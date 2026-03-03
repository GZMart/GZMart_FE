import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Badge, notification, message, Space, Tag } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  ShoppingOutlined,
  RocketOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { io } from 'socket.io-client';
import './SellerOrderActions.css';

const SellerOrderActions = ({ order, onOrderUpdate }) => {
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'pending');
  const [loading, setLoading] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const socketRef = useRef(null);

  // Socket.io connection for real-time order notifications
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Listen for new orders
    socket.on('seller:new-order', (data) => {
      console.log('New order received:', data);
      setNewOrderCount((prev) => prev + 1);

      // Show notification
      notification.info({
        message: 'Đơn hàng mới!',
        description: `Đơn hàng ${data.orderNumber} - ${formatCurrency(data.totalPrice)}`,
        icon: <BellOutlined style={{ color: '#1890ff' }} />,
        duration: 10,
      });

      // Play notification sound (optional)
      playNotificationSound();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Update status when order prop changes
  useEffect(() => {
    if (order?.status) {
      setCurrentStatus(order.status);
    }
  }, [order?.status]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch((e) => console.log('Could not play sound:', e));
    } catch (error) {
      console.log('Notification sound not available');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Confirm order (Pending -> Confirmed)
  const handleConfirmOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/seller/orders/${order._id}/confirm`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to confirm order');
      }

      const data = await response.json();
      message.success('Đã xác nhận đơn hàng!');
      setCurrentStatus('confirmed');

      if (onOrderUpdate) {
        onOrderUpdate(data.data);
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      message.error('Không thể xác nhận đơn hàng. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Pack order (Confirmed -> Packing)
  const handlePackOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/seller/orders/${order._id}/pack`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to pack order');
      }

      const data = await response.json();
      message.success('Đã đánh dấu đã đóng gói hàng!');
      setCurrentStatus('packing');

      if (onOrderUpdate) {
        onOrderUpdate(data.data);
      }
    } catch (error) {
      console.error('Error packing order:', error);
      message.error('Không thể đánh dấu đóng gói. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Start shipping (Packing -> Shipping)
  const handleStartShipping = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Optional: Get coordinates from form or use mock data
      const coordinates = {
        seller: {
          lat: 10.762622,
          lng: 106.660172,
          address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        },
        buyer: {
          lat: 10.823099,
          lng: 106.629664,
          address: order.shippingAddress || '456 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM',
        },
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/seller/orders/${order._id}/start-shipping`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ coordinates }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start shipping');
      }

      const data = await response.json();
      message.success('Đã bắt đầu vận chuyển! Đơn hàng sẽ tự động đến nơi sau 60 giây.');
      setCurrentStatus('shipping');

      if (onOrderUpdate) {
        onOrderUpdate(data.data);
      }
    } catch (error) {
      console.error('Error starting shipping:', error);
      message.error('Không thể bắt đầu vận chuyển. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Get action button based on current status
  const renderActionButton = () => {
    switch (currentStatus) {
      case 'pending':
      case 'processing': // Support old workflow
        return (
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleConfirmOrder}
            loading={loading}
            size="large"
          >
            Xác nhận đơn hàng
          </Button>
        );

      case 'confirmed':
        return (
          <Button
            type="primary"
            icon={<InboxOutlined />}
            onClick={handlePackOrder}
            loading={loading}
            size="large"
            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
          >
            Đã đóng gói hàng
          </Button>
        );

      case 'packing':
        return (
          <Button
            type="primary"
            icon={<RocketOutlined />}
            onClick={handleStartShipping}
            loading={loading}
            size="large"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Bắt đầu giao hàng
          </Button>
        );

      case 'shipping':
      case 'shipped': // Support old workflow
        return (
          <Tag color="processing" style={{ fontSize: 16, padding: '8px 16px' }}>
            <ShoppingOutlined /> Đang giao hàng (tự động sau 60s)
          </Tag>
        );

      case 'delivered':
      case 'delivered_pending_confirmation': // Support old workflow
        return (
          <Tag color="success" style={{ fontSize: 16, padding: '8px 16px' }}>
            <CheckOutlined /> Đã giao hàng - Chờ người mua xác nhận
          </Tag>
        );

      case 'completed':
        return (
          <Tag color="success" style={{ fontSize: 16, padding: '8px 16px' }}>
            <CheckOutlined /> Hoàn thành
          </Tag>
        );

      default:
        return null;
    }
  };

  // Get status tag
  const getStatusTag = () => {
    const statusMap = {
      pending: { color: 'warning', text: 'Chờ xác nhận' },
      processing: { color: 'warning', text: 'Đang xử lý' },
      confirmed: { color: 'processing', text: 'Đã xác nhận' },
      packing: { color: 'processing', text: 'Đã đóng gói' },
      shipping: { color: 'processing', text: 'Đang giao hàng' },
      shipped: { color: 'processing', text: 'Đang giao hàng' },
      delivered: { color: 'success', text: 'Đã giao hàng' },
      delivered_pending_confirmation: { color: 'success', text: 'Đã giao hàng' },
      completed: { color: 'success', text: 'Hoàn thành' },
      cancelled: { color: 'error', text: 'Đã hủy' },
    };

    const status = statusMap[currentStatus] || statusMap.pending;
    return <Tag color={status.color}>{status.text}</Tag>;
  };

  return (
    <Card className="seller-order-actions">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div className="order-header">
          <div>
            <h3>Đơn hàng: {order?.orderNumber}</h3>
            <div style={{ marginTop: 8 }}>Trạng thái: {getStatusTag()}</div>
          </div>
          {newOrderCount > 0 && (
            <Badge count={newOrderCount} offset={[-5, 5]}>
              <BellOutlined style={{ fontSize: 24 }} />
            </Badge>
          )}
        </div>

        <div className="action-section">{renderActionButton()}</div>

        <div className="order-info">
          <p>
            <strong>Tổng tiền:</strong> {formatCurrency(order?.totalPrice || 0)}
          </p>
          <p>
            <strong>Địa chỉ giao hàng:</strong> {order?.shippingAddress}
          </p>
          <p>
            <strong>Phương thức thanh toán:</strong> {order?.paymentMethod}
          </p>
        </div>
      </Space>
    </Card>
  );
};

SellerOrderActions.propTypes = {
  order: PropTypes.object.isRequired,
  onOrderUpdate: PropTypes.func,
};

export default SellerOrderActions;
