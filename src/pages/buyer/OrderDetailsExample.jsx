// Example integration for Buyer Order Details Page
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Spin, Alert, Typography, Divider, Row, Col, Tag } from 'antd';
import OrderTrackingEnhanced from '@components/buyer/OrderTrackingEnhanced';
import './OrderDetailsExample.css';

const { Title, Text } = Typography;

const OrderDetailsExample = () => {
  const { orderId } = useParams();
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

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data.data);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdate = (updatedData) => {
    console.log('Order updated:', updatedData);
    // Refresh order details
    fetchOrderDetails();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Đang tải thông tin đơn hàng..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert message="Lỗi" description={error} type="error" showIcon />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert message="Không tìm thấy đơn hàng" type="warning" showIcon />
      </div>
    );
  }

  return (
    <div className="order-details-example">
      <div className="container">
        <Title level={2}>Chi tiết đơn hàng</Title>

        {/* Order Basic Info */}
        <Card className="order-info-card">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text strong>Mã đơn hàng:</Text>
                <Text> {order.orderNumber}</Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text strong>Ngày đặt:</Text>
                <Text> {formatDate(order.createdAt)}</Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text strong>Tổng tiền:</Text>
                <Text strong style={{ color: '#ff4d4f', fontSize: '18px' }}>
                  {' '}
                  {formatCurrency(order.totalPrice)}
                </Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text strong>Phương thức thanh toán:</Text>
                <Tag color="blue">{order.paymentMethod.toUpperCase()}</Tag>
              </div>
            </Col>
            <Col xs={24}>
              <div className="info-item">
                <Text strong>Địa chỉ giao hàng:</Text>
                <Text> {order.shippingAddress}</Text>
              </div>
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* Enhanced Order Tracking Component */}
        <OrderTrackingEnhanced order={order} onOrderUpdate={handleOrderUpdate} />

        <Divider />

        {/* Order Items */}
        <Card title="Sản phẩm đã đặt" className="order-items-card">
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <div key={item._id || index} className="order-item">
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={8} md={4}>
                    <img
                      src={item.productId?.images?.[0] || '/placeholder.png'}
                      alt={item.productId?.name}
                      className="item-image"
                    />
                  </Col>
                  <Col xs={16} md={12}>
                    <div>
                      <Text strong>{item.productId?.name || 'Product'}</Text>
                      <div style={{ marginTop: 8 }}>
                        {item.tierSelections?.color && <Tag>{item.tierSelections.color}</Tag>}
                        {item.tierSelections?.size && <Tag>{item.tierSelections.size}</Tag>}
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} md={4}>
                    <Text>x{item.quantity}</Text>
                  </Col>
                  <Col xs={12} md={4}>
                    <Text strong>{formatCurrency(item.price)}</Text>
                  </Col>
                </Row>
              </div>
            ))
          ) : (
            <Text type="secondary">Không có sản phẩm</Text>
          )}
        </Card>

        {/* Order Summary */}
        <Card className="order-summary-card">
          <div className="summary-row">
            <Text>Tạm tính:</Text>
            <Text>{formatCurrency(order.subtotal || 0)}</Text>
          </div>
          <div className="summary-row">
            <Text>Phí vận chuyển:</Text>
            <Text>{formatCurrency(order.shippingCost || 0)}</Text>
          </div>
          {order.discount > 0 && (
            <div className="summary-row">
              <Text>Giảm giá:</Text>
              <Text style={{ color: '#52c41a' }}>-{formatCurrency(order.discount)}</Text>
            </div>
          )}
          <Divider style={{ margin: '12px 0' }} />
          <div className="summary-row total">
            <Text strong style={{ fontSize: '16px' }}>
              Tổng cộng:
            </Text>
            <Text strong style={{ fontSize: '18px', color: '#ff4d4f' }}>
              {formatCurrency(order.totalPrice)}
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OrderDetailsExample;
