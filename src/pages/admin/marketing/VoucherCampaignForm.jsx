import { useState, useEffect } from 'react';
import {
  Container, Card, Form, Button, Row, Col,
  Alert, Spinner,
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import voucherCampaignService from '@services/api/voucherCampaignService';
import { ADMIN_ROUTES } from '@constants/routes';
import { DatePicker, Space } from 'antd';
import dayjs from 'dayjs';

const OCCASION_OPTIONS = [
  { value: 'NEW_YEAR',      label: '🎆  New Year (Jan 1)' },
  { value: 'LUNAR_NEW_YEAR', label: '🧧  Lunar New Year' },
  { value: 'BLACK_FRIDAY',  label: '🛒  Black Friday (Nov 29)' },
  { value: 'CHRISTMAS',     label: '🎄  Christmas (Dec 25)' },
  { value: 'VALENTINE',     label: '💝  Valentine (Feb 14)' },
  { value: 'WOMEN_DAY',     label: '🌸  Women\'s Day (Mar 8)' },
  { value: 'CUSTOM',        label: '🎯  Custom Date' },
];

const OFFSET_OPTIONS = [
  { value: -7,  label: '1 week before' },
  { value: -3,  label: '3 days before' },
  { value: 0,   label: 'Exactly on the day' },
  { value: 3,   label: '3 days after' },
  { value: 7,   label: '1 week after' },
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

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // Load existing campaign
  useEffect(() => {
    if (!isEditMode) return;
    voucherCampaignService.getById(id)
      .then((res) => {
        const d = res.data;
        setForm({
          name: d.name || '',
          code: d.code || '',
          triggerType: d.triggerType || 'birthday',
          occasion: d.occasion || '',
          customDate: d.customDate && d.customMonth
            ? dayjs(`${new Date().getFullYear()}-${String(d.customMonth).padStart(2,'0')}-${String(d.customDate).padStart(2,'0')}`)
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
  }, [id, isEditMode]);

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
      <Container className="py-5 text-center">
        <Spinner animation="border" style={{ color: '#0891b2' }} />
      </Container>
    );
  }

  const isOccasion = form.triggerType === 'occasion';
  const isPercent = form.discountType === 'percent';

  return (
    <Container fluid className="py-4 px-4">
      {/* Header */}
      <div className="d-flex align-items-center mb-4 gap-3">
        <Button
          variant="link"
          className="p-0 text-decoration-none"
          onClick={() => navigate(ADMIN_ROUTES.VOUCHER_CAMPAIGNS)}
        >
          <div
            className="rounded-circle border d-flex align-items-center justify-content-center"
            style={{ width: 40, height: 40 }}
          >
            <i className="bi bi-arrow-left" />
          </div>
        </Button>
        <div>
          <h4 className="mb-0" style={{ color: '#164E63', fontWeight: 700 }}>
            {isEditMode ? 'Edit Campaign' : 'New Voucher Campaign'}
          </h4>
          <p className="text-muted mb-0 small">
            {isEditMode
              ? 'Update campaign configuration'
              : 'Create automated voucher distribution campaign'}
          </p>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row>
          {/* Left Column */}
          <Col lg={8}>
            {/* Campaign Identity */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Header
                className="bg-white border-0 pb-0"
                style={{ borderRadius: '12px 12px 0 0' }}
              >
                <h6 className="mb-0" style={{ color: '#164E63' }}>
                  <i className="bi bi-flag me-1" /> Campaign Identity
                </h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Campaign Name *</Form.Label>
                      <Form.Control
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                        placeholder="e.g. Birthday Surprise 2026"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Campaign Code *</Form.Label>
                      <Form.Control
                        value={form.code}
                        onChange={(e) =>
                          set('code', e.target.value.toUpperCase().replace(/\s/g, ''))
                        }
                        placeholder="e.g. BDAY2026"
                        required
                        maxLength={20}
                      />
                      <Form.Text className="text-muted">
                        Unique identifier — cannot be changed later
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Trigger Type *</Form.Label>
                      <Form.Select
                        value={form.triggerType}
                        onChange={(e) => set('triggerType', e.target.value)}
                      >
                        <option value="birthday">🎂  Birthday — sent to user on their birthday</option>
                        <option value="occasion">🎉  Occasion — sent to all users on a special day</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  {isOccasion && (
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Occasion *</Form.Label>
                        <Form.Select
                          value={form.occasion}
                          onChange={(e) => set('occasion', e.target.value)}
                        >
                          <option value="">Select occasion...</option>
                          {OCCASION_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                {isOccasion && form.occasion === 'CUSTOM' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Custom Date *</Form.Label>
                    <Space direction="vertical">
                      <DatePicker
                        value={form.customDate}
                        onChange={(val) => set('customDate', val)}
                        picker="date"
                        placeholder="Pick a date"
                        style={{ width: 200 }}
                        disabledDate={(current) =>
                          current && current.year() !== dayjs().year()
                        }
                      />
                    </Space>
                    <Form.Text className="text-muted d-block">
                      Voucher will be created on this date every year
                    </Form.Text>
                  </Form.Group>
                )}

                {isOccasion && form.occasion === 'LUNAR_NEW_YEAR' && (
                  <Alert variant="info" className="py-2 small">
                    <i className="bi bi-info-circle me-1" />
                    <strong>Lunar New Year</strong> date changes every year.
                    Please use <strong>Custom Date</strong> and set the correct date
                    for the upcoming year. The campaign will trigger on that date annually.
                  </Alert>
                )}
              </Card.Body>
            </Card>

            {/* Voucher Template */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Header
                className="bg-white border-0 pb-0"
                style={{ borderRadius: '12px 12px 0 0' }}
              >
                <h6 className="mb-0" style={{ color: '#164E63' }}>
                  <i className="bi bi-ticket-perforated me-1" /> Voucher Template
                </h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Voucher Display Name *</Form.Label>
                  <Form.Control
                    value={form.voucherName}
                    onChange={(e) => set('voucherName', e.target.value)}
                    placeholder='e.g. "Birthday Special - 15% Off"'
                    required
                  />
                  <Form.Text className="text-muted">
                    This name will be shown to users
                  </Form.Text>
                </Form.Group>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Voucher Type *</Form.Label>
                      <Form.Select
                        value={form.voucherType}
                        onChange={(e) => set('voucherType', e.target.value)}
                      >
                        <option value="system_order">💰 Order Discount</option>
                        <option value="system_shipping">🚚 Free Shipping</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Discount Type *</Form.Label>
                      <Form.Select
                        value={form.discountType}
                        onChange={(e) => set('discountType', e.target.value)}
                      >
                        <option value="percent">Percentage (%)</option>
                        <option value="amount">Fixed Amount (₫)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Value *</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={form.discountValue}
                        onChange={(e) => set('discountValue', e.target.value)}
                        placeholder={isPercent ? 'e.g. 15' : 'e.g. 30000'}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {isPercent && (
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Max Discount Amount (₫)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={form.maxDiscountAmount}
                          onChange={(e) => set('maxDiscountAmount', e.target.value)}
                          placeholder="e.g. 50000"
                        />
                        <Form.Text className="text-muted">
                          Cap for percentage vouchers
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Min. Basket Price (₫)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={form.minBasketPrice}
                          onChange={(e) => set('minBasketPrice', e.target.value)}
                          placeholder="0 = no minimum"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                {!isPercent && (
                  <Form.Group className="mb-3">
                    <Form.Label>Min. Basket Price (₫)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={form.minBasketPrice}
                      onChange={(e) => set('minBasketPrice', e.target.value)}
                    />
                  </Form.Group>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column */}
          <Col lg={4}>
            {/* Validity Settings */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Header
                className="bg-white border-0 pb-0"
                style={{ borderRadius: '12px 12px 0 0' }}
              >
                <h6 className="mb-0" style={{ color: '#164E63' }}>
                  <i className="bi bi-calendar-check me-1" /> Validity Settings
                </h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Voucher Start Offset</Form.Label>
                  <Form.Select
                    value={form.voucherStartOffset}
                    onChange={(e) => set('voucherStartOffset', Number(e.target.value))}
                  >
                    {OFFSET_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Validity Duration (days) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="365"
                    value={form.voucherValidityDays}
                    onChange={(e) => set('voucherValidityDays', e.target.value)}
                    required
                  />
                </Form.Group>

                {/* Validity Preview */}
                <div
                  className="p-3 rounded-3 mb-3"
                  style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
                >
                  <div className="small fw-semibold mb-1" style={{ color: '#166534' }}>
                    <i className="bi bi-calendar-check me-1" />
                    Validity Preview
                  </div>
                  <div className="small" style={{ color: '#15803d' }}>
                    {form.voucherStartOffset < 0
                      ? `Issued ${Math.abs(form.voucherStartOffset)} day(s) before the occasion`
                      : form.voucherStartOffset > 0
                        ? `Issued ${form.voucherStartOffset} day(s) after the occasion`
                        : 'Issued on the day'}
                    <br />
                    Expires after <strong>{form.voucherValidityDays}</strong> day(s)
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Usage Limits */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
              <Card.Header
                className="bg-white border-0 pb-0"
                style={{ borderRadius: '12px 12px 0 0' }}
              >
                <h6 className="mb-0" style={{ color: '#164E63' }}>
                  <i className="bi bi-shield-lock me-1" /> Usage Limits
                </h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Total Usage Limit</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={form.usageLimit}
                    onChange={(e) => set('usageLimit', e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Max Per Buyer</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={form.maxPerBuyer}
                    onChange={(e) => set('maxPerBuyer', e.target.value)}
                  />
                </Form.Group>
                <Form.Check
                  type="switch"
                  id="isActive"
                  label="Campaign Active"
                  checked={form.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                  className="fw-semibold"
                />
              </Card.Body>
            </Card>

            {/* Preview Result */}
            {preview && (
              <Alert variant="success" className="mb-4">
                <Alert.Heading className="fs-6">Preview Result</Alert.Heading>
                <p className="mb-1 small">{preview.message}</p>
                <strong>{preview.estimatedRecipients} recipient(s)</strong>
              </Alert>
            )}

            {/* Actions */}
            <div className="d-flex flex-column gap-2">
              <Button
                type="submit"
                className="fw-semibold"
                style={{ backgroundColor: '#0891b2', borderColor: '#0891b2' }}
                disabled={saving}
              >
                {saving ? <Spinner size="sm" /> : (
                  <>{isEditMode ? 'Update Campaign' : 'Create Campaign'}</>
                )}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={handlePreview}
                disabled={previewing || !isEditMode}
              >
                {previewing ? <Spinner size="sm" /> : (
                  <><i className="bi bi-eye me-1" /> Preview Recipients</>
                )}
              </Button>
              <Button
                variant="link"
                className="text-decoration-none"
                onClick={() => navigate(ADMIN_ROUTES.VOUCHER_CAMPAIGNS)}
              >
                Cancel
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default VoucherCampaignForm;
