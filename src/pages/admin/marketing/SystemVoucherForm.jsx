import { useState, useEffect } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { ADMIN_ROUTES } from '@constants/routes';
import systemVoucherService from '@services/api/systemVoucherService';
import { toast } from 'react-toastify';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import styles from './SystemVoucherForm.module.css';

const { RangePicker } = DatePicker;

const randomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < 8; i += 1) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
};

const SystemVoucherForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'system_shipping',
    discountValue: '',
    minBasketPrice: 0,
    usageLimit: 1000,
    maxPerBuyer: 1,
    startTime: null,
    endTime: null,
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      const fetchVoucher = async () => {
        try {
          setFetching(true);
          const data = await systemVoucherService.getById(id);
          setFormData({
            ...data,
            isActive: data.status === 'active',
          });
        } catch (error) {
          toast.error(error.message || 'Failed to fetch voucher details');
          navigate(ADMIN_ROUTES.SYSTEM_VOUCHERS);
        } finally {
          setFetching(false);
        }
      };
      fetchVoucher();
    }
  }, [id, isEditMode, navigate]);

  const handleDateChange = (dates) => {
    if (dates) {
      setFormData((prev) => ({
        ...prev,
        startTime: dates[0].toISOString(),
        endTime: dates[1].toISOString(),
      }));
    } else {
      setFormData((prev) => ({ ...prev, startTime: null, endTime: null }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        type: formData.type,
        isActive: formData.isActive,
      };

      if (isEditMode) {
        await systemVoucherService.update(id, payload);
        toast.success('System voucher updated successfully');
      } else {
        await systemVoucherService.create(payload);
        toast.success('System voucher created successfully');
      }
      navigate(ADMIN_ROUTES.SYSTEM_VOUCHERS);
    } catch (error) {
      console.error('Submit Error:', error);
      toast.error(error.data?.message || error.message || 'Failed to save voucher');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className={styles.formRoot}>
        <div className={styles.loadingWrap}>
          <Spinner animation="border" style={{ color: '#4f46e5' }} />
          <span>Loading voucher…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formRoot}>
      <Form onSubmit={handleSubmit} className={styles.formLayout}>
        <header className={styles.stickyHeader}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(ADMIN_ROUTES.SYSTEM_VOUCHERS)}
              aria-label="Back to system vouchers"
            >
              <i className="bi bi-arrow-left fs-5" />
            </button>
            <h1 className={styles.headerTitle}>{isEditMode ? 'Edit system voucher' : 'Create system voucher'}</h1>
          </div>
        </header>

        <div className={styles.formScroll}>
          <div className={styles.formMax}>
            <div className={styles.grid}>
              <div className={styles.colMain}>
                <section className={styles.section}>
                  <div className={styles.sectionInner}>
                    <h2 className={styles.sectionTitle}>
                      <i className="bi bi-info-circle-fill" aria-hidden />
                      Basic information
                    </h2>
                    <div className={styles.stack}>
                      <div>
                        <label className={styles.label} htmlFor="sv-name">
                          Voucher name
                        </label>
                        <input
                          id="sv-name"
                          className={styles.input}
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g. Summer free ship 2026"
                          required
                          autoComplete="off"
                        />
                      </div>
                      <div className={styles.row2}>
                        <div>
                          <label className={styles.label} htmlFor="sv-code">
                            Voucher code
                          </label>
                          <div className={styles.codeWrap}>
                            <input
                              id="sv-code"
                              className={`${styles.input} ${styles.inputMono} ${styles.codeInput}`}
                              type="text"
                              name="code"
                              value={formData.code}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  code: e.target.value.toUpperCase().replace(/\s/g, ''),
                                }))
                              }
                              placeholder="FREESHIP2026"
                              required
                              maxLength={32}
                              autoComplete="off"
                            />
                            <button
                              type="button"
                              className={styles.genBtn}
                              title="Generate random code"
                              onClick={() => setFormData((prev) => ({ ...prev, code: randomCode() }))}
                            >
                              <i className="bi bi-arrow-repeat" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className={styles.label} htmlFor="sv-type">
                            Voucher type
                          </label>
                          <select
                            id="sv-type"
                            className={styles.select}
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                          >
                            <option value="system_shipping">Free shipping (fixed ₫ off shipping)</option>
                            <option value="system_order">Order discount (₫ off order total)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.section}>
                  <div className={styles.sectionInner}>
                    <h2 className={styles.sectionTitle}>
                      <i className="bi bi-sliders" aria-hidden />
                      Discount rules
                    </h2>
                    <div className={styles.infoBox}>
                      <i className="bi bi-lightbulb-fill" aria-hidden />
                      <p>
                        Define the discount amount and minimum basket value.{' '}
                        {formData.type === 'system_shipping'
                          ? 'The amount reduces shipping cost for qualifying carts.'
                          : 'The amount is deducted from the order subtotal.'}{' '}
                        Use 0 for min. basket if there is no minimum.
                      </p>
                    </div>
                    <div className={styles.row2}>
                      <div>
                        <label className={styles.label} htmlFor="sv-discount">
                          Discount amount (₫)
                        </label>
                        <div className={`${styles.inputPrefix}`}>
                          <span className={styles.prefix}>₫</span>
                          <input
                            id="sv-discount"
                            className={styles.input}
                            type="number"
                            name="discountValue"
                            value={formData.discountValue}
                            onChange={handleChange}
                            min="0"
                            required
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={styles.label} htmlFor="sv-min">
                          Min. basket value (₫)
                        </label>
                        <div className={styles.inputPrefix}>
                          <span className={styles.prefix}>₫</span>
                          <input
                            id="sv-min"
                            className={styles.input}
                            type="number"
                            name="minBasketPrice"
                            value={formData.minBasketPrice}
                            onChange={handleChange}
                            min="0"
                            placeholder="0"
                          />
                        </div>
                        <p className={styles.hint}>Leave 0 for no minimum requirement.</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className={styles.colAside}>
                <section className={`${styles.section} ${styles.asideSection}`}>
                  <div className={styles.sectionInner}>
                    <h2 className={`${styles.sectionTitle} ${styles.sectionTitleSecondary}`}>
                      <i className="bi bi-speedometer2" aria-hidden />
                      Usage limits
                    </h2>
                    <div className={styles.stack}>
                      <div>
                        <label className={styles.label} htmlFor="sv-limit">
                          Total usage limit
                        </label>
                        <input
                          id="sv-limit"
                          className={styles.input}
                          type="number"
                          name="usageLimit"
                          value={formData.usageLimit}
                          onChange={handleChange}
                          min="1"
                        />
                      </div>
                      <div>
                        <label className={styles.label} htmlFor="sv-max-buyer">
                          Limit per buyer
                        </label>
                        <input
                          id="sv-max-buyer"
                          className={styles.input}
                          type="number"
                          name="maxPerBuyer"
                          value={formData.maxPerBuyer}
                          onChange={handleChange}
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className={`${styles.section} ${styles.asideSection}`}>
                  <div className={styles.sectionInner}>
                    <h2 className={`${styles.sectionTitle} ${styles.sectionTitleTertiary}`}>
                      <i className="bi bi-calendar3" aria-hidden />
                      Validity period
                    </h2>
                    <div>
                      <label className={styles.label} htmlFor="sv-range">
                        Start &amp; end
                      </label>
                      <div id="sv-range" className={styles.pickerWrap}>
                        <RangePicker
                          showTime
                          className="w-100"
                          onChange={handleDateChange}
                          value={
                            formData.startTime && formData.endTime
                              ? [dayjs(formData.startTime), dayjs(formData.endTime)]
                              : []
                          }
                          placeholder={['Start', 'End']}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <div className={styles.switchCard}>
                  <div>
                    <h3>Activate immediately</h3>
                    <p>Voucher will be live when you save (subject to validity window).</p>
                  </div>
                  <div className={styles.switchRow}>
                    <Form.Check
                      type="switch"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      aria-label="Activate voucher immediately"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footerDock}>
          <div className={styles.footerGrid}>
            <div className={styles.footerActions}>
            <button type="button" className={styles.btnCancel} onClick={() => navigate(ADMIN_ROUTES.SYSTEM_VOUCHERS)}>
              Cancel
            </button>
            <button type="submit" className={styles.btnSave} disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Saving…
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg" />
                  {isEditMode ? 'Save voucher' : 'Create voucher'}
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

export default SystemVoucherForm;
