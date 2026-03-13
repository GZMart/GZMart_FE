import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ADMIN_ROUTES } from '@constants/routes';
import systemVoucherService from '@services/api/systemVoucherService';
import { toast } from 'react-toastify';

const SystemVouchersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Styled Components (Simulated with Objects)
  const styles = {
    pageHeader: {
      fontFamily: "'Fira Sans', sans-serif",
      color: '#164E63',
      fontWeight: '600',
    },
    primaryButton: {
      backgroundColor: '#0891B2',
      borderColor: '#0891B2',
      color: '#ffffff',
      fontWeight: '500',
    },
    card: {
      borderRadius: '8px',
      border: 'none',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    tableHeader: {
      backgroundColor: '#ECFEFF',
      color: '#164E63',
      fontFamily: "'Fira Code', monospace",
      fontWeight: '600',
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    tableRow: {
      transition: 'background-color 0.2s ease-in-out',
    },
    code: {
      fontFamily: "'Fira Code', monospace",
      color: '#0891B2',
      backgroundColor: '#F0FDFA',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '0.85rem',
    },
    badgeShipping: {
      backgroundColor: '#22D3EE',
      color: '#164E63',
      fontWeight: '600',
    },
    badgeOrder: {
      backgroundColor: '#0891B2',
      color: '#ffffff',
      fontWeight: '600',
    },
    badgeActive: {
      backgroundColor: '#22C55E',
      color: '#ffffff',
    },
  };

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const data = await systemVoucherService.getAll();
      setVouchers(data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch vouchers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this voucher?')) {
      try {
        await systemVoucherService.delete(id);
        toast.success('Voucher deleted successfully');
        fetchVouchers(); // Refresh list
      } catch (error) {
        toast.error(error.message || 'Failed to delete voucher');
      }
    }
  };

  // Filter logic
  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch =
      voucher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === 'all' ||
      (filterType === 'shipping' && voucher.type === 'system_shipping') ||
      (filterType === 'order' && voucher.type === 'system_order');
    return matchesSearch && matchesType;
  });

  return (
    <Container
      fluid
      className="p-4"
      style={{
        backgroundColor: '#F8FAFC',
        minHeight: '100vh',
        fontFamily: "'Fira Sans', sans-serif",
      }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="mb-0 fs-3" style={styles.pageHeader}>
            System Vouchers
          </h2>
          <p className="text-secondary mb-0 mt-1" style={{ fontSize: '0.95rem' }}>
            Global discount management & analytics
          </p>
        </div>
        <Button
          as={Link}
          to={ADMIN_ROUTES.SYSTEM_VOUCHER_CREATE}
          style={styles.primaryButton}
          className="d-flex align-items-center px-4 py-2"
        >
          <i className="bi bi-plus-lg me-2"></i>
          Create Voucher
        </Button>
      </div>

      {/* Filter Section */}
      <Card className="mb-4" style={styles.card}>
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0 text-muted ps-3">
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by name or code..."
                  className="border-start-0 ps-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '0.95rem', boxShadow: 'none' }}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ fontSize: '0.95rem', boxShadow: 'none' }}
              >
                <option value="all">All Types</option>
                <option value="shipping">Free Shipping</option>
                <option value="order">Order Discount</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Data Table */}
      <Card style={styles.card}>
        <Table hover responsive className="align-middle mb-0" style={{ fontSize: '0.95rem' }}>
          <thead>
            <tr style={styles.tableHeader}>
              <th className="py-3 ps-4 border-0">Voucher / Code</th>
              <th className="py-3 border-0">Type</th>
              <th className="py-3 border-0">Value</th>
              <th className="py-3 border-0">Usage</th>
              <th className="py-3 border-0">Status</th>
              <th className="py-3 border-0">Validity</th>
              <th className="py-3 pe-4 text-end border-0">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : filteredVouchers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  No vouchers found.
                </td>
              </tr>
            ) : (
              filteredVouchers.map((voucher) => (
                <tr key={voucher._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td className="ps-4 py-3">
                    <div className="fw-semibold text-dark mb-1">{voucher.name}</div>
                    <span style={styles.code}>{voucher.code}</span>
                  </td>
                  <td>
                    {voucher.type === 'system_shipping' ? (
                      <Badge
                        style={styles.badgeShipping}
                        className="rounded-pill px-3 py-2 fw-normal"
                      >
                        Free Ship
                      </Badge>
                    ) : (
                      <Badge style={styles.badgeOrder} className="rounded-pill px-3 py-2 fw-normal">
                        Discount
                      </Badge>
                    )}
                  </td>
                  <td>
                    <div className="fw-bold" style={{ color: '#0891B2' }}>
                      {voucher.discountValue?.toLocaleString()}đ
                    </div>
                    <small className="text-secondary">
                      Min: {voucher.minBasketPrice?.toLocaleString()}đ
                    </small>
                  </td>
                  <td style={{ minWidth: '150px' }}>
                    <div
                      className="d-flex justify-content-between mb-1"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <span className="text-secondary">Used</span>
                      <span className="fw-semibold">
                        {voucher.usageCount || 0} / {voucher.usageLimit}
                      </span>
                    </div>
                    <div
                      className="progress"
                      style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px' }}
                    >
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                          width: `${((voucher.usageCount || 0) / voucher.usageLimit) * 100}%`,
                          backgroundColor: '#0891B2',
                        }}
                      ></div>
                    </div>
                  </td>
                  <td>
                    <Badge
                      style={voucher.status === 'active' ? styles.badgeActive : {}}
                      bg={voucher.status === 'active' ? null : 'secondary'}
                      className="rounded-pill px-3"
                    >
                      {voucher.status}
                    </Badge>
                  </td>
                  <td>
                    <small className="d-block text-secondary">
                      <i className="bi bi-calendar-event me-1"></i>
                      {new Date(voucher.startTime).toLocaleDateString()}
                    </small>
                    <small className="d-block text-secondary">
                      <i className="bi bi-arrow-right me-1"></i>
                      {new Date(voucher.endTime).toLocaleDateString()}
                    </small>
                  </td>
                  <td className="pe-4 text-end">
                    <Button
                      as={Link}
                      to={ADMIN_ROUTES.SYSTEM_VOUCHER_EDIT.replace(':id', voucher._id)}
                      variant="link"
                      className="p-0 me-3 text-secondary"
                      style={{ fontSize: '1.2rem' }}
                    >
                      <i className="bi bi-pencil-square"></i>
                    </Button>
                    <Button
                      variant="link"
                      className="p-0 text-danger"
                      style={{ fontSize: '1.2rem' }}
                      onClick={() => handleDelete(voucher._id)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </Container>
  );
};

export default SystemVouchersPage;
