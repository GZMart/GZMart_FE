import { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import styles from '@assets/styles/seller/VoucherCreate.module.css';
import voucherService from '@services/api/voucherService';
import { toast } from 'react-toastify';
import PageTransition from '@components/common/PageTransition';

// Sub-components
import VoucherForm from '@components/seller/vouchers/VoucherForm';
import VoucherDetails from '@components/seller/vouchers/VoucherDetails';
import VoucherPreview from '@components/seller/vouchers/VoucherPreview';

const VoucherCreatePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { type, id } = useParams(); // 'type' for create, 'id' for edit/view
    const [voucherType, setVoucherType] = useState(type || 'shop'); // Default or from param

    // Determine Mode
    const isEdit = location.pathname.includes('/edit/');
    const isView = location.pathname.includes('/view/');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        codePrefix: 'GZM',
        startTime: null,
        endTime: null,
        discountType: 'amount', // 'amount' | 'percent' | 'coin'
        discountValue: '',
        minBasketPrice: '',
        usageLimit: '',
        maxPerBuyer: '',
        displaySetting: 'public',
    });

    // Scope State: 'all' | 'specific'
    const [applyTo, setApplyTo] = useState('all');
    const [selectedProducts, setSelectedProducts] = useState([]);

    // Effect to set defaults based on Type
    useEffect(() => {
        if (!isEdit && !isView) { // Only set defaults if creating new
            if (type === 'product') {
                setApplyTo('specific');
                setFormData(prev => ({ ...prev, displaySetting: 'public' }));
            } else if (type === 'private') {
                setApplyTo('all');
                setFormData(prev => ({ ...prev, displaySetting: 'private' }));
            } else if (type === 'live') {
                setApplyTo('all');
                setFormData(prev => ({ ...prev, displaySetting: 'live' }));
            } else if (type === 'video') {
                setApplyTo('all');
                setFormData(prev => ({ ...prev, displaySetting: 'video' }));
            } else if (['new_buyer', 'repeat_buyer', 'follower'].includes(type)) {
                setApplyTo('all');
                setFormData(prev => ({ ...prev, displaySetting: 'public' }));
            } else {
                // Shop
                setApplyTo('all');
                setFormData(prev => ({ ...prev, displaySetting: 'public' }));
            }
        }
    }, [type, isEdit, isView]);

    // Fetch Data for Edit/View
    useEffect(() => {
        if ((isEdit || isView) && id) {
            const fetchVoucher = async () => {
                try {
                    const res = await voucherService.getVoucherById(id);
                    const v = res.data;

                    setVoucherType(v.type);

                    // Map Backend Data to Form
                    setFormData({
                        name: v.name,
                        code: v.code.substring(3),
                        codePrefix: v.code.substring(0, 3),
                        startTime: v.startTime,
                        endTime: v.endTime,
                        discountType: v.discountType,
                        discountValue: v.discountValue,
                        minBasketPrice: v.minBasketPrice,
                        usageLimit: v.usageLimit,
                        maxPerBuyer: v.maxPerBuyer,
                        displaySetting: v.displaySetting,
                    });

                    // Set Products
                    if (v.appliedProducts) {
                        setSelectedProducts(v.appliedProducts);
                        if (v.type === 'product' || v.appliedProducts.length > 0) {
                            setApplyTo('specific');
                        } else {
                            setApplyTo('all');
                        }
                    }

                } catch (error) {
                    console.error("Fetch voucher error", error);
                    toast.error("Failed to load voucher details");
                    navigate('/seller/vouchers');
                }
            };
            fetchVoucher();
        } else if (type) {
            setVoucherType(type);
        }
    }, [id, isEdit, isView, type, navigate]);

    const handleProductSelect = (products) => {
        // Ensure uniqueness by ID
        const uniqueProducts = Array.from(new Map(products.map(item => [item._id || item.id, item])).values());
        setSelectedProducts(uniqueProducts);
    };

    const handleRemoveProduct = (id) => {
        setSelectedProducts(prev => prev.filter(p => (p._id || p.id) !== id));
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (type === 'number' && Number(value) < 0) {
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle DatePicker Change
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

    // Handle Submit
    const handleSubmit = async () => {
        if (!formData.name || !formData.code || !formData.startTime || !formData.endTime) {
            toast.error('Please fill in all required fields (Name, Code, Start/End Time)');
            return;
        }
        if (new Date(formData.endTime) <= new Date(formData.startTime)) {
            toast.error('End time must be after start time');
            return;
        }
        if (!formData.usageLimit) {
            toast.error('Usage Limit is required');
            return;
        }

        try {
            const payload = {
                ...formData,
                code: formData.codePrefix + formData.code,
                type: voucherType === 'shop' ? 'shop' : voucherType,
                applyTo: (voucherType === 'product') ? 'specific' : applyTo,
                appliedProducts: (applyTo === 'specific' || voucherType === 'product') ? selectedProducts.map(p => p._id || p.id) : [],
                discountValue: Number(formData.discountValue),
                minBasketPrice: Number(formData.minBasketPrice || 0),
                usageLimit: Number(formData.usageLimit),
                maxPerBuyer: Number(formData.maxPerBuyer || 1),
            };

            if (isEdit) {
                await voucherService.updateVoucher(id, payload);
                toast.success('Voucher updated successfully!');
            } else {
                await voucherService.createVoucher(payload);
                toast.success('Voucher created successfully!');
            }
            navigate('/seller/vouchers');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    return (
        <PageTransition>
            <Container fluid className={`p-4 ${styles.pageContainer}`}>

                {/* Header */}
                <div className="d-flex align-items-center mb-4">
                    <Button variant="link" className="p-0 me-3 text-secondary" onClick={() => navigate('/seller/vouchers')}>
                        <i className="bi bi-arrow-left fs-4"></i>
                    </Button>
                    <div>
                        <h4 className="fw-bold mb-0 text-dark">
                            {isEdit ? 'Edit' : isView ? 'View Details:' : 'Create'} {voucherType === 'product' ? 'Product' : voucherType === 'private' ? 'Private' : voucherType === 'live' ? 'Live' : voucherType === 'video' ? 'Video' : voucherType === 'new_buyer' ? 'New Buyer' : voucherType === 'repeat_buyer' ? 'Repeat Buyer' : voucherType === 'follower' ? 'Follower' : 'Shop'} Voucher
                        </h4>
                        <div className="text-muted small mt-1">{isView ? 'View voucher configuration' : 'Define your voucher details to boost sales'}</div>
                    </div>
                </div>

                <Row>
                    {/* LEFT COLUMN: FORM or DETAILS */}
                    <Col lg={8}>
                        {isView ? (
                            <VoucherDetails
                                formData={formData}
                                voucherType={voucherType}
                                selectedProducts={selectedProducts}
                                navigate={navigate}
                            />
                        ) : (
                            <VoucherForm
                                formData={formData}
                                handleChange={handleChange}
                                handleDateChange={handleDateChange}
                                voucherType={voucherType}
                                applyTo={applyTo}
                                setApplyTo={setApplyTo}
                                selectedProducts={selectedProducts}
                                handleProductSelect={handleProductSelect}
                                handleRemoveProduct={handleRemoveProduct}
                                isEdit={isEdit}
                                handleSubmit={handleSubmit}
                                navigate={navigate}
                            />
                        )}
                    </Col>

                    {/* RIGHT COLUMN: PREVIEW */}
                    <Col lg={4}>
                        <VoucherPreview
                            voucherType={voucherType}
                            formData={formData}
                        />
                    </Col>
                </Row>
            </Container>
        </PageTransition>
    );
};

export default VoucherCreatePage;
