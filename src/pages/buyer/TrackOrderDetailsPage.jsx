import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Row, Col, Spin, Alert, Descriptions } from 'antd';
import { LeftOutlined, ShoppingOutlined } from '@ant-design/icons';
import { orderService } from '@services/api/orderService';
import OrderTrackingEnhanced from '@components/buyer/OrderTrackingEnhanced';
import styles from '@assets/styles/buyer/TrackOrderDetailsPage.module.css';

const TrackOrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { Title, Text } = Typography;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getOrderById(orderId);

      if (response.success) {
        setOrder(response.data);
      } else {
        setError(response.message || 'Không thể tải thông tin đơn hàng');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleOrderUpdate = (updatedData) => {
    console.log('Order updated:', updatedData);
    // Refresh order details
    fetchOrderDetails();
  };

  if (loading) {
    return (
      <div className={styles.trackOrderDetailsPage}>
        <div className={styles.trackOrderDetailsContainer}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" tip="Đang tải thông tin đơn hàng..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.trackOrderDetailsPage}>
        <div className={styles.trackOrderDetailsContainer}>
          <div className={styles.trackOrderHeader}>
            <div className={styles.backButtonGroup}>
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={() => navigate(-1)}
                className={styles.backButton}
              />
              <span className={styles.backText}>Quay lại</span>
            </div>
          </div>
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
            style={{ marginTop: 20 }}
            action={
              <Button size="small" onClick={fetchOrderDetails}>
                Thử lại
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.trackOrderDetailsPage}>
        <div className={styles.trackOrderDetailsContainer}>
          <Alert message="Không tìm thấy đơn hàng" type="warning" showIcon />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.trackOrderDetailsPage}>
      <div className={styles.trackOrderDetailsContainer}>
        {/* Header Section */}
        <div className={styles.trackOrderHeader}>
          <div className={styles.backButtonGroup}>
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
              className={styles.backButton}
            />
            <span className={styles.backText}>Quay lại</span>
          </div>
          <Title level={1} className={styles.pageTitle}>
            Theo dõi đơn hàng
          </Title>
        </div>

        {/* Order Info Card */}
        <Card className={styles.orderInfoCard}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div className={styles.orderInfoLeft}>
                <h3 className={styles.orderId}>#{order.orderNumber}</h3>
                <p className={styles.orderMeta}>
                  <ShoppingOutlined /> {order.items?.length || 0} sản phẩm • Đặt hàng lúc{' '}
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </Col>
            <Col xs={24} md={12} className={styles.orderInfoRight}>
              <Text className={styles.orderPrice}>{formatCurrency(order.totalPrice)}</Text>
            </Col>
          </Row>

          {/* Order Details */}
          <Descriptions
            bordered
            column={{ xs: 1, sm: 2, md: 2 }}
            style={{ marginTop: 20 }}
            size="small"
          >
            <Descriptions.Item label="Phương thức thanh toán">
              {order.paymentMethod === 'cash_on_delivery'
                ? 'COD'
                : order.paymentMethod === 'payos'
                  ? 'PayOS'
                  : order.paymentMethod === 'vnpay'
                    ? 'VNPay'
                    : order.paymentMethod}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái thanh toán">
              {order.paymentStatus === 'paid'
                ? 'Đã thanh toán'
                : order.paymentStatus === 'pending'
                  ? 'Chờ thanh toán'
                  : order.paymentStatus === 'failed'
                    ? 'Thất bại'
                    : order.paymentStatus}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ giao hàng" span={2}>
              {order.shippingAddress}
            </Descriptions.Item>
            {order.notes && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {order.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Order Tracking Component with Real-time Updates */}
        <OrderTrackingEnhanced order={order} onOrderUpdate={handleOrderUpdate} />
      </div>
    </div>
  );
};

export default TrackOrderDetailsPage;
