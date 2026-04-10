import { useState, useEffect } from 'react';
import {
  Container, Card, Table, Button, Badge, Form,
  Row, Col, Modal, Spinner, Alert,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import voucherCampaignService from '@services/api/voucherCampaignService';
import { ADMIN_ROUTES } from '@constants/routes';

const TRIGGER_LABELS = { birthday: 'Birthday', occasion: 'Occasion' };

const OCCASION_LABELS = {
  NEW_YEAR:      'New Year',
  LUNAR_NEW_YEAR: 'Lunar New Year',
  BLACK_FRIDAY:  'Black Friday',
  CHRISTMAS:     'Christmas',
  VALENTINE:     'Valentine',
  WOMEN_DAY:     "Women's Day",
  CUSTOM:        'Custom Date',
};

const OCCASION_BADGE_STYLE = {
  NEW_YEAR:      { bg: 'success', text: '🎆' },
  LUNAR_NEW_YEAR: { bg: 'danger',  text: '🧧' },
  BLACK_FRIDAY:  { bg: 'dark',    text: '🛒' },
  CHRISTMAS:     { bg: 'danger',  text: '🎄' },
  VALENTINE:     { bg: 'pink',   text: '💝' },
  WOMEN_DAY:     { bg: 'warning', text: '🌸', color: '#000' },
  CUSTOM:        { bg: 'info',    text: '🎯' },
};

const getOccasionBadge = (campaign) => {
  if (campaign.triggerType === 'birthday') {
    return <Badge bg="warning" text="dark">🎂 Birthday</Badge>;
  }
  const style = OCCASION_BADGE_STYLE[campaign.occasion] || { bg: 'secondary', text: '?' };
  return (
    <Badge
      bg={style.bg}
      style={style.color ? { color: style.color } : {}}
    >
      {style.text} {OCCASION_LABELS[campaign.occasion] || campaign.occasion}
    </Badge>
  );
};

const VoucherCampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [triggerId, setTriggerId] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType !== 'all') params.triggerType = filterType;
      const res = await voucherCampaignService.getAll(params);
      setCampaigns(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, [filterType]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await voucherCampaignService.delete(deleteId);
      toast.success('Campaign deleted');
      setDeleteId(null);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleTrigger = async () => {
    if (!triggerId) return;
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await voucherCampaignService.trigger(triggerId);
      setTriggerResult(res.data);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message || 'Trigger failed');
    } finally {
      setTriggering(false);
    }
  };

  const filtered = campaigns.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container fluid className="py-4 px-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1" style={{ color: '#164E63', fontWeight: 700 }}>
            <i className="bi bi-calendar-heart me-2" style={{ color: '#ec4899' }} />
            Voucher Campaigns
          </h4>
          <p className="text-muted mb-0 small">
            Automated voucher distribution for birthdays & special occasions
          </p>
        </div>
        <Link to={ADMIN_ROUTES.VOUCHER_CAMPAIGN_CREATE}>
          <Button style={{ backgroundColor: '#0891b2', borderColor: '#0891b2' }}>
            <i className="bi bi-plus-lg me-1" /> New Campaign
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
        <Card.Body className="py-3">
          <Row className="align-items-center g-3">
            <Col md={4}>
              <Form.Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                size="sm"
              >
                <option value="all">All Types</option>
                <option value="birthday">Birthday</option>
                <option value="occasion">Occasion</option>
              </Form.Select>
            </Col>
            <Col md={5}>
              <Form.Control
                placeholder="Search by name or campaign code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="sm"
              />
            </Col>
            <Col md={3} className="text-end">
              <span className="text-muted small">
                {filtered.length} campaign(s)
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: '#0891b2' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-x fs-1 d-block mb-2 opacity-25" />
              No campaigns found
            </div>
          ) : (
            <Table responsive className="mb-0">
              <thead style={{ backgroundColor: '#ECFEFF' }}>
                <tr>
                  <th style={{ color: '#164E63' }}>Campaign</th>
                  <th style={{ color: '#164E63' }}>Trigger</th>
                  <th style={{ color: '#164E63' }}>Voucher</th>
                  <th style={{ color: '#164E63' }}>Validity</th>
                  <th style={{ color: '#164E63' }}>Active</th>
                  <th style={{ color: '#164E63' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id} style={{ verticalAlign: 'middle' }}>
                    <td>
                      <div className="fw-semibold" style={{ color: '#1f2937' }}>
                        {c.name}
                      </div>
                      <code style={{ fontSize: '0.75rem', color: '#0891b2' }}>
                        {c.code}
                      </code>
                    </td>
                    <td>{getOccasionBadge(c)}</td>
                    <td>
                      <div className="small fw-medium">{c.voucherName}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {c.discountType === 'percent'
                          ? `${c.discountValue}%`
                          : `${Number(c.discountValue).toLocaleString('vi-VN')}₫`}
                        {c.maxDiscountAmount
                          ? ` (max ${Number(c.maxDiscountAmount).toLocaleString('vi-VN')}₫)`
                          : ''}
                      </div>
                    </td>
                    <td>
                      <div className="small">{c.voucherValidityDays} day(s)</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Offset: {c.voucherStartOffset || 0}d
                      </div>
                    </td>
                    <td>
                      <Form.Check
                        type="switch"
                        id={`sw-${c._id}`}
                        checked={c.isActive}
                        onChange={async () => {
                          try {
                            await voucherCampaignService.update(c._id, {
                              isActive: !c.isActive,
                            });
                            fetchCampaigns();
                          } catch {
                            toast.error('Failed to update status');
                          }
                        }}
                        label=""
                      />
                    </td>
                    <td className="text-end">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-1"
                        onClick={() => {
                          setTriggerId(c._id);
                          setTriggerResult(null);
                        }}
                        title="Trigger manually (test)"
                      >
                        <i className="bi bi-lightning-fill" />
                      </Button>
                      <Link
                        to={`${ADMIN_ROUTES.VOUCHER_CAMPAIGN_EDIT.replace(
                          ':id',
                          c._id
                        )}`}
                      >
                        <Button variant="link" size="sm" className="text-decoration-none p-1">
                          <i className="bi bi-pencil-square" />
                        </Button>
                      </Link>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-1"
                        onClick={() => setDeleteId(c._id)}
                      >
                        <i className="bi bi-trash" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirm Modal */}
      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Campaign</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this campaign? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Spinner size="sm" /> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Trigger Modal */}
      <Modal
        show={!!triggerId}
        onHide={() => { setTriggerId(null); setTriggerResult(null); }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-lightning-fill me-2 text-warning" />
            Manual Trigger
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">
            This will immediately create vouchers for this campaign, bypassing date checks.
            Useful for testing.
          </p>
          {triggerResult ? (
            <Alert variant="success" className="mb-0">
              <Alert.Heading className="fs-6">Done!</Alert.Heading>
              {triggerResult.message}
            </Alert>
          ) : (
            <p className="mb-0 text-muted small">
              Ready to trigger campaign "
              <strong>
                {campaigns.find((c) => c._id === triggerId)?.name}
              </strong>
              ".
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => { setTriggerId(null); setTriggerResult(null); }}
          >
            Close
          </Button>
          {!triggerResult && (
            <Button
              variant="warning"
              onClick={handleTrigger}
              disabled={triggering}
            >
              {triggering ? <Spinner size="sm" /> : (
                <><i className="bi bi-lightning-fill me-1" /> Trigger Now</>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VoucherCampaignsPage;
