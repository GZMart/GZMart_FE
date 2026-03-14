import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { toast } from 'react-toastify';
import rmaService from '@services/api/rmaService';

/**
 * MyReturnsPage
 * View all return/exchange requests for buyer
 */
const MyReturnsPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

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

      const response = await rmaService.getMyReturnRequests(params);
      setReturns(response.data);
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Không thể tải danh sách yêu cầu đổi trả');
    } finally {
      setLoading(false);
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

  const getTypeBadge = (type) =>
    type === 'refund' ? <Badge bg="info">Hoàn tiền</Badge> : <Badge bg="warning">Đổi hàng</Badge>;

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

  const handleViewDetails = (returnRequest) => {
    navigate(`/buyer/returns/${returnRequest._id}`);
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Bạn có chắc muốn hủy yêu cầu này?')) {
      return;
    }

    try {
      await rmaService.cancelReturnRequest(requestId);
      toast.success('Đã hủy yêu cầu');
      fetchReturns();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error(error.response?.data?.message || 'Không thể hủy yêu cầu');
    }
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
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Yêu Cầu Đổi Trả Của Tôi</h2>
        <Button variant="outline-primary" onClick={() => navigate('/buyer/profile?tab=orders')}>
          Quay lại Đơn hàng
        </Button>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="all" title="Tất cả" />
        <Tab eventKey="pending" title="Chờ xử lý" />
        <Tab eventKey="approved" title="Đã chấp nhận" />
        <Tab eventKey="processing" title="Đang xử lý" />
        <Tab eventKey="completed" title="Hoàn thành" />
        <Tab eventKey="rejected" title="Đã từ chối" />
      </Tabs>

      {returns.length === 0 ? (
        <Alert variant="info">
          <p className="mb-0">Bạn chưa có yêu cầu đổi trả nào.</p>
        </Alert>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Mã yêu cầu</th>
                  <th>Đơn hàng</th>
                  <th>Loại</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>Số tiền hoàn</th>
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
                    <td>{getTypeBadge(returnRequest.type)}</td>
                    <td>{getReasonText(returnRequest.reason)}</td>
                    <td>{getStatusBadge(returnRequest.status)}</td>
                    <td>
                      {returnRequest.type === 'refund' && returnRequest.refund?.coinAmount ? (
                        <span className="text-success">
                          {returnRequest.refund.coinAmount.toLocaleString('vi-VN')} coins
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{new Date(returnRequest.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleViewDetails(returnRequest)}
                        >
                          Chi tiết
                        </Button>
                        {returnRequest.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleCancelRequest(returnRequest._id)}
                          >
                            Hủy
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

      {/* Info Alert */}
      <Alert variant="info" className="mt-4">
        <Alert.Heading>Lưu ý</Alert.Heading>
        <ul className="mb-0">
          <li>Seller có 3 ngày để phản hồi yêu cầu của bạn</li>
          <li>Sau 3 ngày không phản hồi, yêu cầu sẽ tự động được chấp nhận</li>
          <li>Hoàn tiền sẽ được chuyển thành coin vào ví của bạn</li>
          <li>Bạn có thể hủy yêu cầu trước khi seller phản hồi</li>
        </ul>
      </Alert>
    </Container>
  );
};

export default MyReturnsPage;
