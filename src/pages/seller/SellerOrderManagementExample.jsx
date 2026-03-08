// Example integration for Seller Order Management Page
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Spin, Alert, Typography, Divider, Row, Col, Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import SellerOrderActions from '@components/seller/orders/SellerOrderActions';
import './SellerOrderManagementExample.css';

const { Title, Text } = Typography;

const SellerOrderManagementExample = () => {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/seller/orders/${orderId}`, {
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
    <div className="seller-order-management-example">
      <div className="container">
        <div className="page-header">
          <Button type="text" icon={<LeftOutlined />} onClick={() => window.history.back()}>
            Quay lại
          </Button>
          <Title level={2}>Quản lý đơn hàng</Title>
        </div>

        {/* Seller Order Actions Component */}
        <SellerOrderActions order={order} onOrderUpdate={handleOrderUpdate} />

        <Divider />

        {/* Customer Information */}
        <Card title="Thông tin khách hàng" className="customer-info-card">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text strong>Tên khách hàng:</Text>
                <Text> {order.userId?.fullName || 'N/A'}</Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text strong>Email:</Text>
                <Text> {order.userId?.email || 'N/A'}</Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text strong>Số điện thoại:</Text>
                <Text> {order.userId?.phone || 'N/A'}</Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text strong>Ngày đặt hàng:</Text>
                <Text> {formatDate(order.createdAt)}</Text>
              </div>
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* Order Items */}
        <Card title="Danh sách sản phẩm" className="order-items-card">
          <div className="items-table">
            <div className="table-header">
              <div className="col-product">Sản phẩm</div>
              <div className="col-quantity">Số lượng</div>
              <div className="col-price">Đơn giá</div>
              <div className="col-total">Thành tiền</div>
            </div>
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <div key={item._id || index} className="table-row">
                  <div className="col-product">
                    <div className="product-info">
                      <img
                        src={item.productId?.images?.[0] || '/placeholder.png'}
                        alt={item.productId?.name}
                        className="product-image"
                      />
                      <div>
                        <Text strong>{item.productId?.name || 'Product'}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            SKU: {item.sku}
                          </Text>
                        </div>
                        {item.tierSelections?.color && (
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Màu: {item.tierSelections.color}
                            </Text>
                          </div>
                        )}
                        {item.tierSelections?.size && (
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Size: {item.tierSelections.size}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-quantity">
                    <Text>x{item.quantity}</Text>
                  </div>
                  <div className="col-price">
                    <Text>{formatCurrency(item.price)}</Text>
                  </div>
                  <div className="col-total">
                    <Text strong>{formatCurrency(item.price * item.quantity)}</Text>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Text type="secondary">Không có sản phẩm</Text>
              </div>
            )}
          </div>
        </Card>

        <Divider />

        {/* Order History Timeline */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <Card title="Lịch sử đơn hàng" className="history-card">
            <div className="timeline">
              {order.statusHistory.map((history, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <Text strong>{history.status}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      {formatDate(history.changedAt)}
                    </Text>
                    {history.notes && (
                      <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        {history.notes}
                      </Text>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SellerOrderManagementExample;
