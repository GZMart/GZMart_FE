import { useState, useEffect, useMemo } from 'react';
import SortableHeader, { useSortState, sortRows } from '../../../components/common/SortableHeader';
import { Container, Row, Col, Card, Nav, Tab, Button, Badge, Table, ProgressBar, Form, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import voucherService from '@services/api/voucherService';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import PageTransition from '@components/common/PageTransition';
import styles from '@assets/styles/seller/VoucherDashboard.module.css';

const VOUCHER_TYPES = [
    { id: 'shop', title: 'Shop Voucher', description: 'Voucher applicable to all products in your Shop', icon: 'bi-shop' },
    { id: 'product', title: 'Product Voucher', description: 'Voucher only applicable to specific products selected by Shop', icon: 'bi-box-seam' },
    { id: 'private', title: 'Private Voucher', description: 'Voucher applicable to target customer groups via Voucher code', icon: 'bi-person-lock' },
    { id: 'live', title: 'Live Voucher', description: 'Exclusive voucher for products in livestream to boost conversion', icon: 'bi-broadcast' },
    { id: 'video', title: 'Video Voucher', description: 'Exclusive voucher for products in Shop Video to boost sales', icon: 'bi-play-circle' },
    { id: 'new_buyer', title: 'New Customer Voucher', description: 'Attract new customers who have not ordered from your shop yet', icon: 'bi-person-plus' },
    { id: 'repeat_buyer', title: 'Repeat Customer Voucher', description: 'Encourage existing customers to buy again from your shop', icon: 'bi-arrow-repeat' },
    { id: 'follower', title: 'Follower Offer', description: 'Encourage users to follow your Shop by rewarding them', icon: 'bi-heart' },
];

const VoucherDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const { sortKey, sortDir, handleSort } = useSortState();

    const sortedVouchers = useMemo(() =>
      sortRows(vouchers, sortKey, sortDir, {
        discount: (v) => v.discountType === 'percentage' ? v.discountValue : v.discountValue,
        usage:    (v) => v.usageCount ?? 0,
        status:   (v) => ({ active: 0, upcoming: 1, expired: 2, inactive: 3 })[v.status] ?? 4,
        validity: (v) => new Date(v.startDate).getTime(),
      }),
    [vouchers, sortKey, sortDir]);

    // Fetch Vouchers
    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                status: activeTab === 'all' ? undefined : activeTab
            };
            const response = await voucherService.getVouchers(params);
            if (response.success) {
                setVouchers(response.data);
                setPagination(prev => ({
                    ...prev,
                    total: response.total,
                    pages: response.pages
                }));
            }
        } catch (error) {
            console.error('Failed to fetch vouchers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, [activeTab, pagination.page]);

    // Handle Delete
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this voucher?')) {
            try {
                await voucherService.deleteVoucher(id);
                toast.success('Voucher deleted successfully');
                fetchVouchers();
            } catch (error) {
                toast.error('Failed to delete voucher');
            }
        }
    };

    // Helper for status badge
    const getStatusBadge = (startTime, endTime, status) => {
        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);
        const isExpired = end < now;
        const isUpcoming = start > now;

        if (status === 'deleted') {
            return <Badge bg="danger">Deleted</Badge>;
        }

        if (isExpired) {
            return (
                <div className={`${styles.statusBadge} bg-secondary-subtle text-secondary border border-secondary-subtle`}>
                    Expired
                </div>
            );
        } else if (isUpcoming) {
            return (
                <div className={`${styles.statusBadge} bg-warning-subtle text-warning border border-warning-subtle`}>
                    <i className="bi bi-clock-fill" style={{ fontSize: '10px' }}></i> Upcoming
                </div>
            );
        } else {
            return (
                <div className={`${styles.statusBadge} bg-success-subtle text-success border border-success-subtle`}>
                    <i className="bi bi-circle-fill" style={{ fontSize: '6px' }}></i> Ongoing
                </div>
            );
        }
    };

    return (
        <PageTransition>
            <Container fluid className={`p-4 ${styles.container}`}>
                <div className={styles.titleSection}>
                    <div>
                        <h2 className={styles.pageTitle}>Voucher Management</h2>
                        <p className={styles.pageSubtitle}>Create and manage vouchers to boost your sales</p>
                    </div>
                </div>

                {/* 1. Marketing Banner */}
                <Card className={styles.bannerCard}>
                    <div className={styles.bannerBackground}>
                        <div className={styles.bannerAccent}></div>
                        <Card.Body className="d-flex align-items-center justify-content-between p-4 px-5">
                            <div className="d-flex align-items-center position-relative" style={{ zIndex: 1 }}>
                                <div className={`me-4 d-none d-md-block ${styles.bannerIconCircle}`}>
                                    <i className={`bi bi-ticket-perforated-fill ${styles.bannerIcon}`}></i>
                                </div>
                                <div>
                                    <h4 className="fw-bold text-dark mb-2">Create Voucher to increase orders!</h4>
                                    <p className="mb-0 text-secondary">
                                        Potential to increase orders by <span className="fw-bold text-success bg-success-subtle px-1 rounded">43%</span> and revenue by <span className="fw-bold text-success bg-success-subtle px-1 rounded">28%</span>.
                                    </p>
                                </div>
                            </div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button className={`${styles.btnPrimary} shadow-sm px-4 py-2`} size="lg" onClick={() => navigate('/seller/vouchers/create/shop')}>
                                    Create Now <i className="bi bi-arrow-right-short fs-5 align-middle"></i>
                                </Button>
                            </motion.div>
                        </Card.Body>
                    </div>
                </Card>

                {/* 2. Voucher Type Grid */}
                <div className="mb-5">
                    <h5 className={styles.sectionTitle}>Select Voucher Type</h5>
                    <Row className="g-4">
                        {VOUCHER_TYPES.map((type) => (
                            <Col md={6} lg={4} xl={20} key={type.id} style={{ flex: '1 0 20%', minWidth: '250px' }}>
                                <motion.div whileHover={{ y: -5 }} className="h-100">
                                    <div className={styles.voucherCard} onClick={() => navigate(`/seller/vouchers/create/${type.id}`)}>
                                        <Card.Body className="d-flex flex-column p-4 h-100">
                                            <div className="mb-3">
                                                <div className={`${styles.iconCircle} shadow-sm`}>
                                                    <i className={`bi ${type.icon} fs-4`}></i>
                                                </div>
                                                <div className={styles.cardTitle}>{type.title}</div>
                                                <div className={styles.cardDesc}>
                                                    {type.description}
                                                </div>
                                            </div>
                                            <div className="mt-auto pt-3 border-top border-light d-flex justify-content-between align-items-center">
                                                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Start now</span>
                                                <i className={`bi bi-chevron-right small ${styles.textPrimary}`}></i>
                                            </div>
                                        </Card.Body>
                                    </div>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* 3. Voucher List */}
                <Card className={styles.listCard}>
                    <Card.Header className="bg-white border-bottom-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-end">
                        <h5 className="fw-bold mb-0 text-dark">Voucher List</h5>
                        <InputGroup style={{ maxWidth: '300px' }} size="sm">
                            <InputGroup.Text className="bg-light border-end-0 text-muted"> <i className="bi bi-search"></i> </InputGroup.Text>
                            <Form.Control placeholder="Search..." className="bg-light border-start-0" />
                        </InputGroup>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                            <div className="px-4 py-3">
                                <Nav variant="pills" className={`mb-3 ${styles.tabNav}`}>
                                    {['all', 'ongoing', 'upcoming', 'expired'].map(tab => (
                                        <Nav.Item key={tab}>
                                            <Nav.Link
                                                eventKey={tab}
                                                className={`${styles.tabLink} ${activeTab === tab ? styles.tabLinkActive : ''} text-capitalize`}
                                            >
                                                {tab}
                                            </Nav.Link>
                                        </Nav.Item>
                                    ))}
                                </Nav>

                                <div className={styles.tableContainer}>
                                    <Table hover className="align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                                        <thead className={styles.tableHeader}>
                                            <tr>
                                                <SortableHeader label="Voucher Name | Code" colKey="name"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="ps-4" />
                                                <SortableHeader label="Type"                colKey="type"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                                                <SortableHeader label="Discount"            colKey="discount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                                                <SortableHeader label="Usage"               colKey="usage"    sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                                                <SortableHeader label="Status"              colKey="status"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                                                <SortableHeader label="Validity Period"     colKey="validity" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                                                <th className="text-end pe-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-5">
                                                        <div className="spinner-border text-primary" role="status"></div>
                                                    </td>
                                                </tr>
                                            ) : sortedVouchers.length > 0 ? (
                                                sortedVouchers.map(voucher => (
                                                    <tr key={voucher._id}>
                                                        <td className="ps-4 py-3">
                                                            <div className="fw-bold text-dark">{voucher.name}</div>
                                                            <div className={styles.voucherCode}>
                                                                {voucher.code}
                                                            </div>
                                                        </td>
                                                        <td><span className={styles.textSecondary}>{voucher.type}</span></td>
                                                        <td>
                                                            <div className={styles.discountText}>
                                                                {voucher.discountType === 'percent' ? `${voucher.discountValue}%` : `₫${voucher.discountValue.toLocaleString()}`}
                                                            </div>
                                                            <div className="small text-muted">Min. Spend ₫{voucher.minBasketPrice.toLocaleString()}</div>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center justify-content-between small mb-1 text-muted">
                                                                <span>Used</span>
                                                                <span className="fw-bold">{voucher.usageCount}/{voucher.usageLimit}</span>
                                                            </div>
                                                            <ProgressBar
                                                                now={(voucher.usageCount / voucher.usageLimit) * 100}
                                                                variant="primary"
                                                                style={{ height: '6px', borderRadius: '3px', backgroundColor: '#eee' }}
                                                            />
                                                        </td>
                                                        <td>{getStatusBadge(voucher.startTime, voucher.endTime, voucher.status)}</td>
                                                        <td className="small text-muted">
                                                            <div>{new Date(voucher.startTime).toLocaleDateString()}</div>
                                                            <div>{new Date(voucher.endTime).toLocaleDateString()}</div>
                                                        </td>
                                                        <td className="text-end pe-4">
                                                            <OverlayTrigger placement="top" overlay={<Tooltip>View Details</Tooltip>}>
                                                                <button className={`${styles.actionBtn} me-1`} onClick={() => navigate(`/seller/vouchers/view/${voucher._id}`)}><i className="bi bi-eye"></i></button>
                                                            </OverlayTrigger>
                                                            {new Date(voucher.endTime) > new Date() && (
                                                                <OverlayTrigger placement="top" overlay={<Tooltip>Edit Voucher</Tooltip>}>
                                                                    <button className={`${styles.actionBtn} me-1`} onClick={() => navigate(`/seller/vouchers/edit/${voucher._id}`)}><i className="bi bi-pencil-square"></i></button>
                                                                </OverlayTrigger>
                                                            )}
                                                            <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
                                                                <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDelete(voucher._id)}><i className="bi bi-trash"></i></button>
                                                            </OverlayTrigger>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-5">
                                                        <div className="mb-3 opacity-50"><i className="bi bi-clipboard-x fs-1 text-secondary"></i></div>
                                                        <p className="text-muted mb-0">No vouchers found.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>

                            <div className="px-4 pb-4 d-flex justify-content-between align-items-center text-muted small">
                                <span>Showing {vouchers.length} of {pagination.total} vouchers</span>
                                <div className="d-flex align-items-center gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        disabled={pagination.page <= 1}
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        disabled={pagination.page >= pagination.pages}
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>

                        </Tab.Container>
                    </Card.Body>
                </Card>
            </Container>
        </PageTransition>
    );
};

export default VoucherDashboard;
