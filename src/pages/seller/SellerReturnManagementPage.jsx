import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Table,
  Badge,
  Button,
  Spinner,
  Alert,
  Tabs,
  Tab,
  Modal,
  Form,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import rmaService from '@services/api/rmaService';

/**
 * SellerReturnManagementPage
 * Seller manages return/exchange requests
 */
const SellerReturnManagementPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');

  // Response modal
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decision, setDecision] = useState('approve');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, [activeTab]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params = {};

      if (activeTab !== 'all') {
        params.status = activeTab;
      }

      const response = await rmaService.getSellerReturnRequests(params);
      setReturns(response.data);
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error(t('sellerReturns.management.errors.cannotLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResponseModal = (returnRequest) => {
    setSelectedRequest(returnRequest);
    setDecision('approve');
    setNotes('');
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!notes.trim() && decision === 'reject') {
      toast.error(t('sellerReturns.management.errors.enterRejectReason'));
      return;
    }

    try {
      setSubmitting(true);

      await rmaService.respondToReturnRequest(selectedRequest._id, {
        decision,
        notes: notes.trim(),
      });

      toast.success(decision === 'approve'
        ? t('sellerReturns.management.successApprove')
        : t('sellerReturns.management.successReject'));
      setShowResponseModal(false);
      fetchReturns();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error(error.response?.data?.message || t('sellerReturns.management.errorProcess'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessRefund = async (returnRequest) => {
    if (!window.confirm(t('sellerReturns.management.confirmRefund'))) {
      return;
    }

    try {
      const response = await rmaService.processRefund(returnRequest._id);
      toast.success(response.message || t('sellerReturns.management.successRefund'));
      fetchReturns();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error(error.response?.data?.message || t('sellerReturns.management.errorProcess'));
    }
  };

  const handleProcessExchange = async (returnRequest) => {
    if (!window.confirm(t('sellerReturns.management.confirmExchange'))) {
      return;
    }

    try {
      const response = await rmaService.processExchange(returnRequest._id);
      toast.success(response.message || t('sellerReturns.management.successExchange'));
      fetchReturns();
    } catch (error) {
      console.error('Error processing exchange:', error);
      toast.error(error.response?.data?.message || t('sellerReturns.management.errorProcess'));
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: 'warning', labelKey: 'sellerReturns.status.pending' },
      approved: { bg: 'success', labelKey: 'sellerReturns.status.approved' },
      rejected: { bg: 'danger', labelKey: 'sellerReturns.status.rejected' },
      items_returned: { bg: 'info', labelKey: 'sellerReturns.status.items_returned' },
      processing: { bg: 'primary', labelKey: 'sellerReturns.status.processing' },
      completed: { bg: 'success', labelKey: 'sellerReturns.status.completed' },
      cancelled: { bg: 'secondary', labelKey: 'sellerReturns.status.rejected' },
    };

    const config = statusMap[status] || { bg: 'secondary', labelKey: null, text: status };
    return <Badge bg={config.bg}>{config.labelKey ? t(config.labelKey) : config.text}</Badge>;
  };

  const getTypeBadge = (type) =>
    type === 'refund'
      ? <Badge bg="info">{t('sellerReturns.type.refund')}</Badge>
      : <Badge bg="warning">{t('sellerReturns.type.exchange')}</Badge>;

  const getReasonText = (reason) => {
    const reasonMap = {
      wrong_size: 'sellerReturns.reason.wrong_size',
      defective: 'sellerReturns.reason.defective',
      wrong_item: 'sellerReturns.reason.wrong_item',
      not_as_described: 'sellerReturns.reason.not_as_described',
      damaged_in_shipping: 'sellerReturns.reason.damaged_in_shipping',
      change_of_mind: 'sellerReturns.reason.change_of_mind',
      other: 'sellerReturns.reason.other',
    };

    const key = reasonMap[reason];
    return key ? t(key) : reason;
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">{t('sellerReturns.management.loadingRequests')}</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">{t('sellerReturns.management.pageTitle')}</h2>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab
          eventKey="pending"
          title={
            <span>
              <Badge bg="warning">{t('sellerReturns.status.pending')}</Badge>
            </span>
          }
        />
        <Tab eventKey="approved" title={t('sellerReturns.status.approved')} />
        <Tab eventKey="processing" title={t('sellerReturns.status.processing')} />
        <Tab eventKey="completed" title={t('sellerReturns.status.completed')} />
        <Tab eventKey="rejected" title={t('sellerReturns.status.rejected')} />
        <Tab eventKey="all" title={t('sellerReturns.status.all')} />
      </Tabs>

      {returns.length === 0 ? (
        <Alert variant="info">
          <p className="mb-0">{t('sellerReturns.management.emptyRequests')}</p>
        </Alert>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>{t('sellerReturns.management.columns.code')}</th>
                  <th>{t('sellerReturns.management.columns.order')}</th>
                  <th>{t('sellerReturns.management.columns.customer')}</th>
                  <th>{t('sellerReturns.management.columns.type')}</th>
                  <th>{t('sellerReturns.management.columns.reason')}</th>
                  <th>{t('sellerReturns.management.columns.status')}</th>
                  <th>{t('sellerReturns.management.columns.amount')}</th>
                  <th>{t('sellerReturns.management.columns.createdAt')}</th>
                  <th>{t('sellerReturns.management.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((returnRequest) => (
                  <tr key={returnRequest._id}>
                    <td>
                      <strong>{returnRequest.requestNumber}</strong>
                    </td>
                    <td>{returnRequest.orderId?.orderNumber || 'N/A'}</td>
                    <td>
                      {returnRequest.userId?.fullName || 'N/A'}
                      <br />
                      <small className="text-muted">{returnRequest.userId?.email}</small>
                    </td>
                    <td>{getTypeBadge(returnRequest.type)}</td>
                    <td>{getReasonText(returnRequest.reason)}</td>
                    <td>{getStatusBadge(returnRequest.status)}</td>
                    <td>
                      {returnRequest.type === 'refund' && returnRequest.refund?.amount ? (
                        <span className="text-danger">
                          {returnRequest.refund.amount.toLocaleString('vi-VN')}₫
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{new Date(returnRequest.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div className="d-flex flex-column gap-2">
                        {returnRequest.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleOpenResponseModal(returnRequest)}
                          >
                            {t('sellerReturns.management.buttons.respond')}
                          </Button>
                        )}

                        {returnRequest.status === 'approved' && returnRequest.type === 'refund' && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleProcessRefund(returnRequest)}
                          >
                            {t('sellerReturns.management.buttons.refund')}
                          </Button>
                        )}

                        {returnRequest.status === 'approved' &&
                          returnRequest.type === 'exchange' && (
                            <Button
                              size="sm"
                              variant="warning"
                              onClick={() => handleProcessExchange(returnRequest)}
                            >
                              {t('sellerReturns.management.buttons.exchange')}
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Response Modal */}
      <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{t('sellerReturns.management.modal.responseTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <Alert variant="secondary">
                <strong>{t('sellerReturns.management.modal.requestCode')}:</strong> {selectedRequest.requestNumber}
                <br />
                <strong>{t('sellerReturns.management.modal.type')}:</strong>{' '}
                {selectedRequest.type === 'refund' ? t('sellerReturns.type.refund') : t('sellerReturns.type.exchange')}
                <br />
                <strong>{t('sellerReturns.management.modal.reason')}:</strong> {getReasonText(selectedRequest.reason)}
                <br />
                <strong>{t('sellerReturns.management.modal.description')}:</strong> {selectedRequest.description}
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>{t('sellerReturns.management.modal.decision')}</Form.Label>
                <div>
                  <Form.Check
                    type="radio"
                    label={t('sellerReturns.management.modal.approve')}
                    name="decision"
                    value="approve"
                    checked={decision === 'approve'}
                    onChange={(e) => setDecision(e.target.value)}
                    className="mb-2"
                  />
                  <Form.Check
                    type="radio"
                    label={t('sellerReturns.management.modal.reject')}
                    name="decision"
                    value="reject"
                    checked={decision === 'reject'}
                    onChange={(e) => setDecision(e.target.value)}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  {t('sellerReturns.management.modal.notes')} {decision === 'reject' && <span className="text-danger">*</span>}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={decision === 'reject'
                    ? t('sellerReturns.management.modal.notesPlaceholderReject')
                    : t('sellerReturns.management.modal.notesPlaceholderOptional')}
                  required={decision === 'reject'}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResponseModal(false)}>
            {t('sellerReturns.management.modal.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmitResponse} disabled={submitting}>
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {t('sellerReturns.management.modal.submitting')}
              </>
            ) : (
              t('sellerReturns.management.modal.submit')
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Info Alert */}
      <Alert variant="warning" className="mt-4">
        <Alert.Heading>{t('sellerReturns.management.alert.title')}</Alert.Heading>
        <ul className="mb-0">
          <li>{t('sellerReturns.management.alert.points.respondWithin')}</li>
          <li>{t('sellerReturns.management.alert.points.autoApprove')}</li>
          <li>{t('sellerReturns.management.alert.points.sellerFault')}</li>
          <li>{t('sellerReturns.management.alert.points.customerFault')}</li>
          <li>{t('sellerReturns.management.alert.points.refundAsCoin')}</li>
        </ul>
      </Alert>
    </Container>
  );
};

export default SellerReturnManagementPage;
