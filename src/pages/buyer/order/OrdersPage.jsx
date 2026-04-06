import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Button, Spin, Alert, Space } from 'antd';
import { EnvironmentOutlined, EyeOutlined } from '@ant-design/icons';
import { orderService } from '@services/api/orderService';
import './OrdersPage.css';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getMyOrders();

      if (response.success) {
        setOrders(response.data || []);
      } else {
        setError('Không thể tải danh sách đơn hàng');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'warning', text: 'Chờ xác nhận' },
      confirmed: { color: 'processing', text: 'Đã xác nhận' },
      shipping: { color: 'processing', text: 'Đang giao hàng' },
      delivered: { color: 'success', text: 'Đã giao hàng' },
      completed: { color: 'success', text: 'Hoàn thành' },
      cancelled: { color: 'error', text: 'Đã hủy' },
      processing: { color: 'processing', text: 'Đang xử lý' },
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (amount) => <strong style={{ color: '#ff4d4f' }}>{formatCurrency(amount)}</strong>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => (
        <Tag color={status === 'paid' ? 'success' : 'warning'}>
          {status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {['confirmed', 'shipping', 'delivered'].includes(record.status) ? (
            <Button
              type="primary"
              icon={<EnvironmentOutlined />}
              size="small"
              onClick={() => navigate('/buyer/profile?tab=orders')}
            >
              Theo dõi đơn hàng
            </Button>
          ) : (
            <Button
              type="default"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate('/buyer/profile?tab=orders')}
            >
              Xem chi tiết
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" tip="Đang tải đơn hàng..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchOrders}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="orders-page">
      <Card
        title={<h2 style={{ margin: 0 }}>Đơn hàng của tôi</h2>}
        extra={<Button onClick={fetchOrders}>Làm mới</Button>}
      >
        {orders.length === 0 ? (
          <Alert
            message="Chưa có đơn hàng"
            description="Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!"
            type="info"
            showIcon
          />
        ) : (
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} đơn hàng`,
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default OrdersPage;
