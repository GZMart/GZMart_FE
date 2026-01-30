import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Button, Table, Form, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { message, DatePicker } from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import PageTransition from '@components/common/PageTransition';
import shopProgramService from '@services/api/shopProgramService';
import comboService from '@services/api/comboService';
import addOnDealService from '@services/api/addOnDealService';
import styles from '@assets/styles/seller/ShopPromotions.module.css';

const PROMOTION_TYPES = [
    {
        id: 'shop',
        title: 'Shop Program',
        description: 'Create a Shop Program to set up discount programs for all products',
        icon: 'bi-shop',
        link: '/seller/promotions/create/shop'
    },
    {
        id: 'combo',
        title: 'Combo Promotion',
        description: 'Create Combo Promotion to increase order value with bundled discounts',
        icon: 'bi-box-seam',
        link: '/seller/promotions/create/combo'
    },
    {
        id: 'addon',
        title: 'Add-on Deal',
        description: 'Create Add-on Deal to boost order quantity with special bundle prices',
        icon: 'bi-cart-plus',
        link: '/seller/promotions/create/addon'
    },
];

const MOCK_METRICS = {
    revenue: { value: 0, change: 0.00 },
    orders: { value: 0, change: 0.00 },
    quantity: { value: 0, change: 0.00 },
    buyers: { value: 0, change: 0.00 },
};

const ShopPromotionsPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter State
    const [searchText, setSearchText] = useState('');
    const [dateRange, setDateRange] = useState([null, null]);

    // Applied Filters (triggered on Search)
    const [appliedFilters, setAppliedFilters] = useState({
        text: '',
        dateRange: [null, null]
    });

    // Initialize dayjs plugin
    useEffect(() => {
        dayjs.extend(isBetween);
    }, []);

    // Fetch programs on mount
    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const [shopRes, comboRes, addonRes] = await Promise.all([
                shopProgramService.getPrograms(),
                comboService.getCombos(),
                addOnDealService.getAddOns()
            ]);

            // Handle response structures
            const shopData = shopRes.data?.data || shopRes.data || [];
            const comboData = comboRes.data?.data || comboRes.data || [];
            const addonData = addonRes.data?.data || addonRes.data || [];

            // Map to unified format
            const shopPrograms = (Array.isArray(shopData) ? shopData : []).map(p => ({
                _id: p._id,
                name: p.name,
                type: 'shop',
                products: [],
                totalProducts: p.totalProducts || 0,
                startTime: p.startDate,
                endTime: p.endDate,
                status: p.status,
                createdAt: p.createdAt
            }));

            const comboPrograms = (Array.isArray(comboData) ? comboData : []).map(p => ({
                _id: p._id,
                name: p.name,
                type: 'combo',
                products: [],
                totalProducts: p.products?.length || 0, // Simplified count
                startTime: p.startDate,
                endTime: p.endDate,
                status: p.status,
                createdAt: p.createdAt
            }));

            const addonPrograms = (Array.isArray(addonData) ? addonData : []).map(p => {
                const uniqueSubProducts = new Set(p.subProducts?.map(sp => sp.productId?._id?.toString() || sp.productId?.toString()));
                return {
                    _id: p._id,
                    name: p.name,
                    type: 'addon',
                    products: [],
                    totalProducts: (p.mainProducts?.length || 0) + (uniqueSubProducts.size || 0),
                    startTime: p.startDate,
                    endTime: p.endDate,
                    status: p.status,
                    createdAt: p.createdAt
                };
            });

            const allPrograms = [...shopPrograms, ...comboPrograms, ...addonPrograms].sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            setPromotions(allPrograms);
        } catch (error) {
            console.error('Failed to fetch programs:', error);
            message.error('Failed to load programs');
        } finally {
            setLoading(false);
        }
    };

    /*
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this program?')) {
            return;
        }
        try {
            await shopProgramService.deleteProgram(id);
            message.success('Program deleted');
            fetchPrograms();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to delete');
        }
    };
    */

    // Date range for metrics
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const metricsDateRange = `From ${weekAgo.toLocaleDateString('en-GB')} to ${today.toLocaleDateString('en-GB')} GMT+7`;

    // Filter promotions
    const filteredPromotions = promotions.filter(p => {
        // Tab Filter
        if (activeTab !== 'all' && p.type !== activeTab) {
            return false;
        }

        // Text Filter (Real-time)
        // Checks 'searchText' directly, not 'appliedFilters.text'
        if (searchText && !p.name.toLowerCase().includes(searchText.toLowerCase())) {
            return false;
        }

        // Date Range Filter (Applied)
        // Check if promotion overlaps with selected range
        const [start, end] = appliedFilters.dateRange || [null, null];
        if (start && end) {
            // Ensure inclusive comparison for the entire day
            const filterStart = dayjs(start).startOf('day');
            const filterEnd = dayjs(end).endOf('day');

            const promoStart = dayjs(p.startTime);
            const promoEnd = dayjs(p.endTime);

            // Overlap logic: promoStart <= filterEnd AND promoEnd >= filterStart
            const isOverlapping = (promoStart.isBefore(filterEnd) || promoStart.isSame(filterEnd)) &&
                (promoEnd.isAfter(filterStart) || promoEnd.isSame(filterStart));

            if (!isOverlapping) {
                return false;
            }
        }

        return true;
    });

    const handleSearch = () => {
        // Only apply Date Range on "Search" click
        setAppliedFilters({
            ...appliedFilters,
            dateRange
        });
    };

    const handleReset = () => {
        setSearchText('');
        setDateRange([null, null]);
        setAppliedFilters({
            text: '',
            dateRange: [null, null]
        });
    };

    // Get status badge
    const getStatusBadge = (startTime, endTime) => {
        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (end < now) {
            return <span className={`${styles.statusBadge} ${styles.statusEnded}`}>Ended</span>;
        } else if (start > now) {
            return <span className={`${styles.statusBadge} ${styles.statusUpcoming}`}><i className="bi bi-clock-fill me-1" style={{ fontSize: '8px' }}></i>Upcoming</span>;
        } else {
            return <span className={`${styles.statusBadge} ${styles.statusOngoing}`}><i className="bi bi-circle-fill me-1" style={{ fontSize: '6px' }}></i>Ongoing</span>;
        }
    };

    // Format date
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <PageTransition>
            <Container fluid className={`p-4 ${styles.container}`}>
                {/* Header Section */}
                <div className={styles.headerSection}>
                    <h4 className={styles.headerTitle}>Create Promotion</h4>
                    <p className={styles.headerDesc}>
                        Set up promotion programs to increase Sales and improve Conversion Rate.{' '}
                        <Link to="#" className={styles.learnMore}>Learn more</Link>
                    </p>
                </div>

                {/* Promotion Type Cards */}
                <Row className="g-3 mb-4">
                    {PROMOTION_TYPES.map((type) => (
                        <Col md={4} key={type.id}>
                            <Card className={styles.typeCard}>
                                <Card.Body className="d-flex align-items-start p-3">
                                    <div className={styles.typeIcon}>
                                        <i className={`bi ${type.icon}`}></i>
                                    </div>
                                    <div className="flex-grow-1 ms-3">
                                        <div className={styles.typeTitle}>{type.title}</div>
                                        <div className={styles.typeDesc}>{type.description}</div>
                                    </div>
                                    <Button
                                        className={styles.createBtn}
                                        onClick={() => navigate(type.link)}
                                    >
                                        Create
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Horizontal Tabs */}
                <Nav className={styles.horizontalTabs}>
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'shop', label: 'Shop Program' },
                        { key: 'combo', label: 'Combo Promotion' },
                        { key: 'addon', label: 'Add-on Deal' },
                    ].map(tab => (
                        <Nav.Item key={tab.key}>
                            <Nav.Link
                                className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </Nav.Link>
                        </Nav.Item>
                    ))}
                </Nav>

                {/* Performance Metrics */}
                <div className={styles.metricsSection}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h5 className={styles.sectionTitle}>Promotion Performance</h5>
                            <span className={styles.dateRange}>{metricsDateRange}</span>
                        </div>
                        <Link to="#" className={styles.moreLink}>More <i className="bi bi-chevron-right"></i></Link>
                    </div>
                    <Row className="g-3">
                        {[
                            { label: 'Revenue', value: MOCK_METRICS.revenue.value, prefix: '₫', icon: 'bi-currency-dollar' },
                            { label: 'Orders', value: MOCK_METRICS.orders.value, icon: 'bi-receipt' },
                            { label: 'Quantity Sold', value: MOCK_METRICS.quantity.value, icon: 'bi-box' },
                            { label: 'Buyers', value: MOCK_METRICS.buyers.value, icon: 'bi-people' },
                        ].map((metric, idx) => (
                            <Col md={3} sm={6} key={idx}>
                                <div className={styles.metricCard}>
                                    <div className={styles.metricLabel}>
                                        {metric.label} <i className="bi bi-info-circle ms-1" style={{ fontSize: '11px', opacity: 0.5 }}></i>
                                    </div>
                                    <div className={styles.metricValue}>
                                        {metric.prefix || ''}{metric.value.toLocaleString()}
                                    </div>
                                    <div className={styles.metricChange}>
                                        vs 7 days ago <span className={styles.changeValue}>0.00%</span>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* Program List */}
                <Card className={styles.listCard}>
                    <Card.Header className="bg-white border-bottom py-3 px-4">
                        <h5 className="fw-semibold mb-3">Program List</h5>
                        <div className="d-flex gap-2 flex-wrap align-items-center">
                            <InputGroup style={{ maxWidth: '200px' }} size="sm">
                                <Form.Control
                                    placeholder="Search"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </InputGroup>
                            <Form.Select size="sm" style={{ maxWidth: '150px' }}>
                                <option>Program name</option>
                            </Form.Select>
                            <DatePicker.RangePicker
                                size="small"
                                style={{ maxWidth: '220px' }}
                                placeholder={['Start Date', 'End Date']}
                                value={dateRange}
                                onChange={(dates) => setDateRange(dates || [null, null])}
                            />
                            <Form.Check type="checkbox" label="Start - End" className="ms-2 small" />
                            <div className="ms-auto d-flex gap-2">
                                <Button variant="primary" size="sm" className={styles.searchBtn} onClick={handleSearch}>Search</Button>
                                <Button variant="outline-secondary" size="sm" onClick={handleReset}>Reset</Button>
                            </div>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Table hover className="mb-0" style={{ fontSize: '0.875rem' }}>
                            <thead className={styles.tableHeader}>
                                <tr>
                                    <th className="ps-4">
                                        <Form.Check type="checkbox" />
                                    </th>
                                    <th>All <i className="bi bi-chevron-down ms-1" style={{ fontSize: '10px' }}></i></th>
                                    <th>Promotion Type</th>
                                    <th>Products</th>
                                    <th>Time</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status"></div>
                                        </td>
                                    </tr>
                                ) : filteredPromotions.length > 0 ? (
                                    filteredPromotions.map(promo => (
                                        <tr key={promo._id}>
                                            <td className="ps-4">
                                                <Form.Check type="checkbox" />
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {getStatusBadge(promo.startTime, promo.endTime)}
                                                    <div className="ms-3">
                                                        <div className="fw-medium">{promo.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={styles.promoType}>
                                                    {promo.type === 'combo' ? 'Combo Promotion' : 'Add-on Deal'}
                                                </span>
                                            </td>
                                            <td>
                                                {promo.totalProducts > 0 ? (
                                                    <div className="d-flex align-items-center">
                                                        <span className="text-success fw-medium">{promo.totalProducts} product(s)</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted small">No products yet</span>
                                                )}
                                            </td>
                                            <td className="small text-muted">
                                                <div>{formatDate(promo.startTime)}</div>
                                                <div>{formatDate(promo.endTime)}</div>
                                            </td>
                                            <td>
                                                <Link to={`/seller/promotions/view/${promo.type === 'shop' ? 'shop' : promo.type === 'combo' ? 'combo' : 'addon'}/${promo._id}`} className={styles.actionLink}>Details</Link>
                                                {new Date(promo.endTime) > new Date() && (
                                                    <Link to={`/seller/promotions/edit/${promo.type === 'shop' ? 'shop' : promo.type === 'combo' ? 'combo' : 'addon'}/${promo._id}`} className={`${styles.actionLink} ms-3`}>Edit</Link>
                                                )}
                                                <Link to="#" className={`${styles.actionLink} ms-3`}>Copy</Link>
                                                {/* Delete button hidden as requested */}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <div className="mb-3 opacity-50">
                                                <i className="bi bi-clipboard-x fs-1 text-secondary"></i>
                                            </div>
                                            <p className="text-muted mb-0">No promotions found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </Container>
        </PageTransition>
    );
};

export default ShopPromotionsPage;
