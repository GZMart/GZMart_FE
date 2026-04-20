import { useState, useEffect } from 'react';
import { Form, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import voucherCampaignService from '@services/api/voucherCampaignService';
import { ADMIN_ROUTES } from '@constants/routes';
import { DatePicker, Space } from 'antd';
import dayjs from 'dayjs';
import styles from './VoucherCampaignForm.module.css';

const OCCASION_OPTIONS = [
  { value: 'NEW_YEAR', label: '🎆  New Year (Jan 1)' },
  { value: 'LUNAR_NEW_YEAR', label: '🧧  Lunar New Year' },
  { value: 'BLACK_FRIDAY', label: '🛒  Black Friday (Nov 29)' },
  { value: 'CHRISTMAS', label: '🎄  Christmas (Dec 25)' },
  { value: 'VALENTINE', label: '💝  Valentine (Feb 14)' },
  { value: 'WOMEN_DAY', label: "🌸  Women's Day (Mar 8)" },
  { value: 'CUSTOM', label: '🎯  Custom Date' },
];

const OFFSET_OPTIONS = [
  { value: -7, label: '1 week before' },
  { value: -3, label: '3 days before' },
  { value: 0, label: 'Exactly on the day' },
  { value: 3, label: '3 days after' },
  { value: 7, label: '1 week after' },
];

const VoucherCampaignForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    triggerType: 'birthday',
    occasion: '',
    customDate: null,
    customMonth: null,
    voucherStartOffset: 0,
    voucherValidityDays: 7,
    voucherName: '',
    voucherType: 'system_order',
    discountType: 'percent',
    discountValue: '',
    maxDiscountAmount: '',
    minBasketPrice: 0,
    usageLimit: 10000,
    maxPerBuyer: 1,
    isActive: true,
  });

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!isEditMode) {
      return;
    }
    voucherCampaignService
      .getById(id)
      .then((res) => {
        const d = res.data;
        setForm({
          name: d.name || '',
          code: d.code || '',
          triggerType: d.triggerType || 'birthday',
          occasion: d.occasion || '',
          customDate:
            d.customDate && d.customMonth
              ? dayjs(
                  `${new Date().getFullYear()}-${String(d.customMonth).padStart(2, '0')}-${String(d.customDate).padStart(2, '0')}`
                )
              : null,
          customMonth: d.customMonth || null,
          voucherStartOffset: d.voucherStartOffset || 0,
          voucherValidityDays: d.voucherValidityDays || 7,
          voucherName: d.voucherName || '',
          voucherType: d.voucherType || 'system_order',
          discountType: d.discountType || 'percent',
          discountValue: d.discountValue || '',
          maxDiscountAmount: d.maxDiscountAmount || '',
          minBasketPrice: d.minBasketPrice || 0,
          usageLimit: d.usageLimit || 10000,
          maxPerBuyer: d.maxPerBuyer || 1,
          isActive: d.isActive !== false,
        });
      })
      .catch(() => {
        toast.error('Failed to load campaign');
        navigate(ADMIN_ROUTES.VOUCHER_CAMPAIGNS);
      })
      .finally(() => setFetching(false));
  }, [id, isEditMode, navigate]);

  const handlePreview = async () => {
    if (!form.voucherName || !form.voucherValidityDays) {
      toast.warn('Fill in voucher name and validity days first.');
      return;
    }
    if (!isEditMode) {
      toast.info('Save the campaign first to preview recipients.');
      return;
    }
    setPreviewing(true);
    setPreview(null);
    try {
      const res = await voucherCampaignService.preview(id);
      setPreview(res.data);
    } catch {
      toast.error('Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code || !form.voucherName || !form.discountValue) {
      toast.warn('Please fill in all required fields (name, campaign code, voucher name, discount value).');
      return;
    }
    if (form.triggerType === 'occasion' && !form.occasion) {
      toast.warn('Please select an occasion.');
      return;
    }
    if (form.occasion === 'CUSTOM' && !form.customDate) {
      toast.warn('Please select a custom date.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        occasion: form.triggerType === 'occasion' ? form.occasion : '',
        customDate: form.customDate ? form.customDate.date() : null,
        customMonth: form.customDate ? form.customDate.month() + 1 : null,
        discountValue: Number(form.discountValue),
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        minBasketPrice: Number(form.minBasketPrice),
        usageLimit: Number(form.usageLimit),
        maxPerBuyer: Number(form.maxPerBuyer),
        voucherValidityDays: Number(form.voucherValidityDays),
      };
      if (isEditMode) {
        await voucherCampaignService.update(id, payload);
        toast.success('Campaign updated');
      } else {
        await voucherCampaignService.create(payload);
        toast.success('Campaign created');
      }
      navigate(ADMIN_ROUTES.VOUCHER_CAMPAIGNS);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className={styles.formRoot}>
        <div className={styles.loadingWrap}>
          <Spinner animation="border" style={{ color: '#4f46e5' }} />
          <span>Loading campaign…</span>
        </div>
      </div>
    );
  }

  const isOccasion = form.triggerType === 'occasion';
  const isPercent = form.discountType === 'percent';

  return (
    <div className={styles.formRoot}>
      <Form onSubmit={handleSubmit} className={styles.formLayout}>
        <header className={styles.stickyHeader}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(ADMIN_ROUTES.VOUCHER_CAMPAIGNS)}
              aria-label="Back to voucher campaigns"
            >
              <i className="bi bi-arrow-left fs-5" />
            </button>
            <h1 className={styles.headerTitle}>{isEditMode ? 'Edit campaign' : 'New voucher campaign'}</h1>
          </div>
        </header>

        <div className={styles.formScroll}>
          <div className={styles.formMax}>
            <div className={styles.grid}>
              <div className={styles.colMain}>
                <section className={styles.section}>
                  <div className={styles.sectionInner}>
                    <h2 className={styles.sectionTitle}>
                      <i className="bi bi-flag-fill" aria-hidden />
                      Campaign identity
                    </h2>
                    <div className={styles.stack}>
                      <div className={styles.row2}>
                        <div>
                          <label className={styles.label} htmlFor="vc-name">
                            Campaign name *
                          </label>
                          <input
                            id="vc-name"
                            className={styles.input}
                            value={form.name}
                            onChange={(e) => setField('name', e.target.value)}
                            placeholder="e.g. Birthday Surprise 2026"
                            required
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label className={styles.label} htmlFor="vc-code">
                            Campaign code *
                          </label>
                          <input
                            id="vc-code"
                            className={`${styles.input} ${styles.inputMono}`}
                            value={form.code}
                            onChange={(e) => setField('code', e.target.value.toUpperCase().replace(/\s/g, ''))}
                            placeholder="BDAY2026"
                            required
                            maxLength={20}
                            autoComplete="off"
                          />
                          <p className={styles.hint}>Unique — cannot be changed later</p>
                        </div>
                      </div>
                      <div className={styles.row2}>
                        <div>
                          <label className={styles.label} htmlFor="vc-trigger">
                            Trigger type *
                          </label>
                          <select
                            id="vc-trigger"
                            className={styles.select}
                            value={form.triggerType}
                            onChange={(e) => setField('triggerType', e.target.value)}
                          >
                            <option value="birthday">Birthday — on the user&apos;s birthday</option>
                            <option value="occasion">Occasion — all users on a fixed day</option>
                          </select>
                        </div>
                        {isOccasion && (
                          <div>
                            <label className={styles.label} htmlFor="vc-occasion">
                              Occasion *
                            </label>
                            <select
                              id="vc-occasion"
                              className={styles.select}
                              value={form.occasion}
                              onChange={(e) => setField('occasion', e.target.value)}
                            >
                              <option value="">Select occasion…</option>
                              {OCCASION_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      {isOccasion && form.occasion === 'CUSTOM' && (
                        <div>
                          <label className={styles.label} htmlFor="vc-custom-date">
                            Custom date *
                          </label>
                          <div id="vc-custom-date" className={styles.pickerWrap}>
                            <Space direction="vertical" className="w-100">
                              <DatePicker
                                value={form.customDate}
                                onChange={(val) => setField('customDate', val)}
                                picker="date"
                                placeholder="Pick a date"
                                className="w-100"
                                style={{ minWidth: 200 }}
                                disabledDate={(current) => current && current.year() !== dayjs().year()}
                              />
                            </Space>
                          </div>
                          <p className={styles.hint}>Repeats every year on this date</p>
                        </div>
                      )}
                      {isOccasion && form.occasion === 'LUNAR_NEW_YEAR' && (
                        <div className={styles.lunarAlert}>
                          <i className="bi bi-info-circle me-1" aria-hidden />
                          <strong>Lunar New Year</strong> shifts yearly — use <strong>Custom date</strong> for the upcoming
                          year.
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className={styles.section}>
                  <div className={styles.sectionInner}>
                    <h2 className={styles.sectionTitle}>
                      <i className="bi bi-ticket-perforated" aria-hidden />
                      Voucher template
                    </h2>
                    <div className={styles.stack}>
                      <div>
                        <label className={styles.label} htmlFor="vc-vname">
                          Voucher display name *
                        </label>
                        <input
                          id="vc-vname"
                          className={styles.input}
                          value={form.voucherName}
                          onChange={(e) => setField('voucherName', e.target.value)}
                          placeholder='e.g. "Birthday Special - 15% off"'
                          required
                          autoComplete="off"
                        />
                        <p className={styles.hint}>Shown to customers in wallet &amp; checkout</p>
                      </div>
                      <div className={styles.row3}>
                        <div>
                          <label className={styles.label} htmlFor="vc-vtype">
                            Voucher type *
                          </label>
                          <select
                            id="vc-vtype"
                            className={styles.select}
                            value={form.voucherType}
                            onChange={(e) => setField('voucherType', e.target.value)}
                          >
                            <option value="system_order">Order discount</option>
                            <option value="system_shipping">Free shipping</option>
                          </select>
                        </div>
                        <div>
                          <label className={styles.label} htmlFor="vc-dtype">
                            Discount type *
                          </label>
                          <select
                            id="vc-dtype"
                            className={styles.select}
                            value={form.discountType}
                            onChange={(e) => setField('discountType', e.target.value)}
                          >
                            <option value="percent">Percentage (%)</option>
                            <option value="amount">Fixed amount (₫)</option>
                          </select>
                        </div>
                        <div>
                          <label className={styles.label} htmlFor="vc-val">
                            Value *
                          </label>
                          <input
                            id="vc-val"
                            className={styles.input}
                            type="number"
                            min="0"
                            value={form.discountValue}
                            onChange={(e) => setField('discountValue', e.target.value)}
                            placeholder={isPercent ? 'e.g. 15' : 'e.g. 30000'}
                            required
                          />
                        </div>
                      </div>
                      {isPercent && (
                        <div className={styles.row2}>
                          <div>
                            <label className={styles.label} htmlFor="vc-max">
                              Max discount (₫)
                            </label>
                            <input
                              id="vc-max"
                              className={styles.input}
                              type="number"
                              min="0"
                              value={form.maxDiscountAmount}
                              onChange={(e) => setField('maxDiscountAmount', e.target.value)}
                              placeholder="e.g. 50000"
                            />
                            <p className={styles.hint}>Cap for percentage vouchers</p>
                          </div>
                          <div>
                            <label className={styles.label} htmlFor="vc-minp">
                              Min. basket (₫)
                            </label>
                            <input
                              id="vc-minp"
                              className={styles.input}
                              type="number"
                              min="0"
                              value={form.minBasketPrice}
                              onChange={(e) => setField('minBasketPrice', e.target.value)}
                              placeholder="0 = none"
                            />
                          </div>
                        </div>
                      )}
                      {!isPercent && (
                        <div>
                          <label className={styles.label} htmlFor="vc-minf">
                            Min. basket (₫)
                          </label>
                          <input
                            id="vc-minf"
                            className={styles.input}
                            type="number"
                            min="0"
                            value={form.minBasketPrice}
                            onChange={(e) => setField('minBasketPrice', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <div className={styles.colAside}>
                <section className={`${styles.section} ${styles.asideSection}`}>
                  <div className={styles.sectionInner}>
                    <h2 className={`${styles.sectionTitle} ${styles.sectionTitleSecondary}`}>
                      <i className="bi bi-calendar-check" aria-hidden />
                      Validity settings
                    </h2>
                    <div className={styles.stack}>
                      <div>
                        <label className={styles.label} htmlFor="vc-offset">
                          Voucher start offset
                        </label>
                        <select
                          id="vc-offset"
                          className={styles.select}
                          value={form.voucherStartOffset}
                          onChange={(e) => setField('voucherStartOffset', Number(e.target.value))}
                        >
                          {OFFSET_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={styles.label} htmlFor="vc-days">
                          Validity duration (days) *
                        </label>
                        <input
                          id="vc-days"
                          className={styles.input}
                          type="number"
                          min="1"
                          max="365"
                          value={form.voucherValidityDays}
                          onChange={(e) => setField('voucherValidityDays', e.target.value)}
                          required
                        />
                      </div>
                      <div className={styles.previewBox}>
                        <div className="fw-semibold mb-1">
                          <i className="bi bi-calendar2-week me-1" aria-hidden />
                          Validity preview
                        </div>
                        <div>
                          {form.voucherStartOffset < 0
                            ? `Issued ${Math.abs(form.voucherStartOffset)} day(s) before the event`
                            : form.voucherStartOffset > 0
                              ? `Issued ${form.voucherStartOffset} day(s) after the event`
                              : 'Issued on the day'}
                          <br />
                          Expires after <strong>{form.voucherValidityDays}</strong> day(s)
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={`${styles.section} ${styles.asideSection}`}>
                  <div className={styles.sectionInner}>
                    <h2 className={`${styles.sectionTitle} ${styles.sectionTitleTertiary}`}>
                      <i className="bi bi-shield-lock" aria-hidden />
                      Usage limits
                    </h2>
                    <div className={styles.stack}>
                      <div>
                        <label className={styles.label} htmlFor="vc-ulimit">
                          Total usage limit
                        </label>
                        <input
                          id="vc-ulimit"
                          className={styles.input}
                          type="number"
                          min="1"
                          value={form.usageLimit}
                          onChange={(e) => setField('usageLimit', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={styles.label} htmlFor="vc-maxb">
                          Max per buyer
                        </label>
                        <input
                          id="vc-maxb"
                          className={styles.input}
                          type="number"
                          min="1"
                          value={form.maxPerBuyer}
                          onChange={(e) => setField('maxPerBuyer', e.target.value)}
                        />
                      </div>
                      <Form.Check
                        type="switch"
                        id="vc-active"
                        label="Campaign active"
                        checked={form.isActive}
                        onChange={(e) => setField('isActive', e.target.checked)}
                        className="fw-semibold"
                      />
                    </div>
                  </div>
                </section>

                {preview && (
                  <Alert variant="success" className="rounded-3 border-0 mb-0">
                    <Alert.Heading className="fs-6">Preview</Alert.Heading>
                    <p className="mb-1 small">{preview.message}</p>
                    <strong>{preview.estimatedRecipients} recipient(s)</strong>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footerDock}>
          <div className={styles.footerGrid}>
            <div className={styles.footerActions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => navigate(ADMIN_ROUTES.VOUCHER_CAMPAIGNS)}
              >
                Cancel
              </button>
              {isEditMode && (
                <button
                  type="button"
                  className={styles.btnPreview}
                  onClick={handlePreview}
                  disabled={previewing}
                >
                  {previewing ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <i className="bi bi-eye" /> Preview recipients
                    </>
                  )}
                </button>
              )}
              <button type="submit" className={styles.btnSave} disabled={saving}>
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Saving…
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg" />
                    {isEditMode ? 'Update campaign' : 'Create campaign'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default VoucherCampaignForm;
