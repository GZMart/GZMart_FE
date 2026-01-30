import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { ADMIN_ROUTES } from '@constants/routes';
import systemVoucherService from '@services/api/systemVoucherService';
import { toast } from 'react-toastify';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

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

    // Fetch existing voucher data for Edit Mode
    useEffect(() => {
        if (isEditMode) {
            const fetchVoucher = async () => {
                try {
                    setLoading(true);
                    const data = await systemVoucherService.getById(id);
                    setFormData({
                        ...data,
                        isActive: data.status === 'active'
                    });
                } catch (error) {
                    toast.error(error.message || 'Failed to fetch voucher details');
                    navigate(ADMIN_ROUTES.SYSTEM_VOUCHERS);
                } finally {
                    setLoading(false);
                }
            };
            fetchVoucher();
        }
    }, [id, isEditMode, navigate]);

    const handleDateChange = (dates) => {
        if (dates) {
            setFormData(prev => ({
                ...prev,
                startTime: dates[0].toISOString(),
                endTime: dates[1].toISOString(),
            }));
        } else {
            setFormData(prev => ({ ...prev, startTime: null, endTime: null }));
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                type: formData.type, // Values are already correct from dropdown
                isActive: formData.isActive
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

    // Styling
    const styles = {
        pageHeader: {
            fontFamily: "'Fira Sans', sans-serif",
            color: '#164E63',
            fontWeight: '600'
        },
        primaryButton: {
            backgroundColor: '#0891B2',
            borderColor: '#0891B2',
            color: '#ffffff',
            fontWeight: '500',
            padding: '10px 24px'
        },
        card: {
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        cardHeader: {
            backgroundColor: '#fff',
            borderBottom: '1px solid #E2E8F0',
            padding: '16px 24px',
            color: '#0F172A',
            fontWeight: '600',
            fontSize: '1.1rem'
        },
        label: {
            fontSize: '0.9rem',
            fontWeight: '500',
            color: '#475569',
            marginBottom: '6px'
        },
        input: {
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '0.95rem',
            color: '#334155'
        },
        infoAlert: {
            backgroundColor: '#ECFEFF',
            borderColor: '#CFFAFE',
            color: '#0891B2',
            fontSize: '0.95rem'
        }
    };

    return (
        <Container fluid className="p-4" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Fira Sans', sans-serif" }}>
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h2 className="mb-0 fs-3" style={styles.pageHeader}>
                        {isEditMode ? 'Edit System Voucher' : 'Create System Voucher'}
                    </h2>
                    <p className="text-secondary mb-0 mt-1">Configure global pricing rules and constraints</p>
                </div>
                <Button
                    variant="link"
                    onClick={() => navigate(ADMIN_ROUTES.SYSTEM_VOUCHERS)}
                    className="text-decoration-none text-secondary fw-medium"
                >
                    <i className="bi bi-arrow-left me-2"></i> Back to List
                </Button>
            </div>

            <Form onSubmit={handleSubmit}>
                <Row className="g-4">
                    {/* Left Column: Main Info */}
                    <Col lg={8}>
                        {/* Basic Info Card */}
                        <Card className="mb-4" style={styles.card}>
                            <div style={styles.cardHeader}>Basic Information</div>
                            <Card.Body className="p-4">
                                <Row className="g-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label style={styles.label}>Voucher Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="e.g., Free Ship Lunar New Year"
                                                required
                                                style={styles.input}
                                                className="shadow-sm"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={styles.label}>Voucher Code</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="code"
                                                value={formData.code}
                                                onChange={handleChange}
                                                placeholder="e.g., FREESHIP2024"
                                                required
                                                style={{ ...styles.input, textTransform: 'uppercase', fontFamily: "'Fira Code', monospace" }}
                                                className="shadow-sm"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={styles.label}>Voucher Type</Form.Label>
                                            <Form.Select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                                style={styles.input}
                                                className="shadow-sm"
                                            >
                                                <option value="system_shipping">Free Shipping (Fixed Amount)</option>
                                                <option value="system_order">Order Discount (Direct Deduction)</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Discount Settings Card */}
                        <Card style={styles.card}>
                            <div style={styles.cardHeader}>Discount Rules</div>
                            <Card.Body className="p-4">
                                <Alert style={styles.infoAlert} className="d-flex align-items-center mb-4 border rounded-3">
                                    <i className="bi bi-info-circle-fill me-3 fs-5"></i>
                                    <div>
                                        <strong>Rule Explanation:</strong>{' '}
                                        {formData.type === 'system_shipping'
                                            ? 'The entered amount will be subtracted from the shipping cost.'
                                            : 'The entered amount will be subtracted from the order total.'}
                                    </div>
                                </Alert>

                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={styles.label}>Discount Amount (VND)</Form.Label>
                                            <div className="input-group shadow-sm">
                                                <span className="input-group-text bg-light border-end-0">₫</span>
                                                <Form.Control
                                                    type="number"
                                                    name="discountValue"
                                                    value={formData.discountValue}
                                                    onChange={handleChange}
                                                    min="0"
                                                    required
                                                    style={styles.input}
                                                    className="border-start-0"
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label style={styles.label}>Min Basket Value (VND)</Form.Label>
                                            <div className="input-group shadow-sm">
                                                <span className="input-group-text bg-light border-end-0">
                                                    <i className="bi bi-cart"></i>
                                                </span>
                                                <Form.Control
                                                    type="number"
                                                    name="minBasketPrice"
                                                    value={formData.minBasketPrice}
                                                    onChange={handleChange}
                                                    min="0"
                                                    style={styles.input}
                                                    className="border-start-0"
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right Column: Sidebar Settings */}
                    <Col lg={4}>
                        <Card className="mb-4" style={styles.card}>
                            <div style={styles.cardHeader}>Usage Limits</div>
                            <Card.Body className="p-4">
                                <Form.Group className="mb-3">
                                    <Form.Label style={styles.label}>Total Global Limit</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="usageLimit"
                                        value={formData.usageLimit}
                                        onChange={handleChange}
                                        min="1"
                                        style={styles.input}
                                        className="shadow-sm"
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label style={styles.label}>Max Per Buyer</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="maxPerBuyer"
                                        value={formData.maxPerBuyer}
                                        onChange={handleChange}
                                        min="1"
                                        style={styles.input}
                                        className="shadow-sm"
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        <Card className="mb-4" style={styles.card}>
                            <div style={styles.cardHeader}>Validity Period</div>
                            <Card.Body className="p-4">
                                <Form.Group className="mb-3">
                                    <Form.Label style={styles.label}>Start & End Time</Form.Label>
                                    <RangePicker
                                        showTime
                                        className="w-100 py-2 shadow-sm"
                                        style={styles.input}
                                        onChange={handleDateChange}
                                        value={formData.startTime && formData.endTime ? [dayjs(formData.startTime), dayjs(formData.endTime)] : []}
                                        placeholder={['Start Time', 'End Time']}
                                    />
                                </Form.Group>
                                <hr className="my-3" />
                                <Form.Check
                                    type="switch"
                                    id="isActive"
                                    label="Activate Voucher Immediately"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="fw-medium text-dark"
                                />
                            </Card.Body>
                        </Card>

                        <div className="d-flex gap-3">
                            <Button
                                variant="light"
                                className="w-100 py-3 border fw-medium text-secondary"
                                onClick={() => navigate(ADMIN_ROUTES.SYSTEM_VOUCHERS)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                style={styles.primaryButton}
                                className="w-100 shadow py-3"
                            >
                                <i className="bi bi-save me-2"></i>
                                {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Voucher')}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Form>
        </Container >
    );
};

export default SystemVoucherForm;
