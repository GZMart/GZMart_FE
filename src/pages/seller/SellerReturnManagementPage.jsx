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
import rmaService from '@services/api/rmaService';

/**
 * SellerReturnManagementPage
 * Seller manages return/exchange requests
 */
const SellerReturnManagementPage = () => {
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
      toast.error('Không thể tải danh sách yêu cầu');
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
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setSubmitting(true);

      await rmaService.respondToReturnRequest(selectedRequest._id, {
        decision,
        notes: notes.trim(),
      });

      toast.success(`Đã ${decision === 'approve' ? 'chấp nhận' : 'từ chối'} yêu cầu`);
      setShowResponseModal(false);
      fetchReturns();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error(error.response?.data?.message || 'Không thể xử lý yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessRefund = async (returnRequest) => {
    if (!window.confirm('Xác nhận hoàn tiền cho khách hàng?')) {
      return;
    }

    try {
      const response = await rmaService.processRefund(returnRequest._id);
      toast.success(response.message || 'Đã hoàn tiền thành công');
      fetchReturns();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error(error.response?.data?.message || 'Không thể hoàn tiền');
    }
  };

  const handleProcessExchange = async (returnRequest) => {
    if (!window.confirm('Xác nhận tạo đơn hàng đổi hàng mới?')) {
      return;
    }

    try {
      const response = await rmaService.processExchange(returnRequest._id);
      toast.success(response.message || 'Đã tạo đơn đổi hàng');
      fetchReturns();
    } catch (error) {
      console.error('Error processing exchange:', error);
      toast.error(error.response?.data?.message || 'Không thể xử lý đổi hàng');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: 'warning', text: 'Chờ xử lý' },
      approved: { bg: 'success', text: 'Đã chấp nhận' },
      rejected: { bg: 'danger', text: 'Đã từ chối' },
      items_returned: { bg: 'info', text: 'Đã gửi hàng về' },
      processing: { bg: 'primary', text: 'Đang xử lý' },
      completed: { bg: 'success', text: 'Hoàn thành' },
      cancelled: { bg: 'secondary', text: 'Đã hủy' },
    };

    const config = statusMap[status] || { bg: 'secondary', text: status };
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };

  const getTypeBadge = (type) => {
    return type === 'refund' ? (
      <Badge bg="info">Hoàn tiền</Badge>
    ) : (
      <Badge bg="warning">Đổi hàng</Badge>
    );
  };

  const getReasonText = (reason) => {
    const reasonMap = {
      wrong_size: 'Size không vừa',
      defective: 'Sản phẩm lỗi',
      wrong_item: 'Gửi sai hàng',
      not_as_described: 'Không đúng mô tả',
      damaged_in_shipping: 'Hư hỏng khi vận chuyển',
      change_of_mind: 'Đổi ý',
      other: 'Khác',
    };

    return reasonMap[reason] || reason;
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Quản Lý Yêu Cầu Đổi Trả</h2>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab
          eventKey="pending"
          title={
            <span>
              <Badge bg="warning">Chờ xử lý</Badge>
            </span>
          }
        />
        <Tab eventKey="approved" title="Đã chấp nhận" />
        <Tab eventKey="processing" title="Đang xử lý" />
        <Tab eventKey="completed" title="Hoàn thành" />
        <Tab eventKey="rejected" title="Đã từ chối" />
        <Tab eventKey="all" title="Tất cả" />
      </Tabs>

      {returns.length === 0 ? (
        <Alert variant="info">
          <p className="mb-0">Không có yêu cầu nào.</p>
        </Alert>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Đơn hàng</th>
                  <th>Khách hàng</th>
                  <th>Loại</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>Số tiền</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
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
                            Phản hồi
                          </Button>
                        )}

                        {returnRequest.status === 'approved' && returnRequest.type === 'refund' && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleProcessRefund(returnRequest)}
                          >
                            Hoàn tiền
                          </Button>
                        )}

                        {returnRequest.status === 'approved' &&
                          returnRequest.type === 'exchange' && (
                            <Button
                              size="sm"
                              variant="warning"
                              onClick={() => handleProcessExchange(returnRequest)}
                            >
                              Đổi hàng
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
          <Modal.Title>Phản Hồi Yêu Cầu Đổi Trả</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <Alert variant="secondary">
                <strong>Mã yêu cầu:</strong> {selectedRequest.requestNumber}
                <br />
                <strong>Loại:</strong>{' '}
                {selectedRequest.type === 'refund' ? 'Hoàn tiền' : 'Đổi hàng'}
                <br />
                <strong>Lý do:</strong> {getReasonText(selectedRequest.reason)}
                <br />
                <strong>Mô tả:</strong> {selectedRequest.description}
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>Quyết định</Form.Label>
                <div>
                  <Form.Check
                    type="radio"
                    label="Chấp nhận yêu cầu"
                    name="decision"
                    value="approve"
                    checked={decision === 'approve'}
                    onChange={(e) => setDecision(e.target.value)}
                    className="mb-2"
                  />
                  <Form.Check
                    type="radio"
                    label="Từ chối yêu cầu"
                    name="decision"
                    value="reject"
                    checked={decision === 'reject'}
                    onChange={(e) => setDecision(e.target.value)}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Ghi chú {decision === 'reject' && <span className="text-danger">*</span>}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    decision === 'reject'
                      ? 'Vui lòng nhập lý do từ chối...'
                      : 'Ghi chú thêm (không bắt buộc)...'
                  }
                  required={decision === 'reject'}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResponseModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmitResponse} disabled={submitting}>
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang xử lý...
              </>
            ) : (
              'Gửi phản hồi'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Info Alert */}
      <Alert variant="warning" className="mt-4">
        <Alert.Heading>Lưu ý quan trọng</Alert.Heading>
        <ul className="mb-0">
          <li>Bạn có 3 ngày để phản hồi yêu cầu đổi trả</li>
          <li>Sau 3 ngày không phản hồi, yêu cầu sẽ tự động được chấp nhận</li>
          <li>Nếu sản phẩm lỗi/sai hàng: Seller chịu phí ship hoàn trả</li>
          <li>Nếu khách đổi ý: Khách hàng chịu phí ship hoàn trả</li>
          <li>Hoàn tiền sẽ được chuyển thành coin vào ví của khách hàng</li>
        </ul>
      </Alert>
    </Container>
  );
};

export default SellerReturnManagementPage;
