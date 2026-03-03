import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Card, Steps, Button, Modal, Rate, Input, message, Spin } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  TruckOutlined,
  DollarOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { io } from 'socket.io-client';
import DeliveryTrackingMap from './DeliveryTrackingMap';
import './OrderTrackingEnhanced.css';

const { TextArea } = Input;

const OrderTrackingEnhanced = ({ order, onOrderUpdate }) => {
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'pending');
  const [showMap, setShowMap] = useState(false);
  const [mapAnimation, setMapAnimation] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Socket.io connection
  useEffect(() => {
    if (!order?._id) return;

    // Connect to backend socket
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Listen for order status changes
    socket.on(`order:status:${order._id}`, (data) => {
      console.log('Order status update:', data);
      setCurrentStatus(data.status);
      if (onOrderUpdate) {
        onOrderUpdate(data);
      }
    });

    // Listen for shipping started event
    socket.on(`order:shipping:${order._id}`, (data) => {
      console.log('Shipping started:', data);
      setCurrentStatus('shipping');
      setShowMap(true);

      // Start map animation
      if (data.coordinates) {
        startMapAnimation(data.coordinates, data.duration || 60);
      }
    });

    // Listen for delivery arrival
    socket.on(`order:arrived:${order._id}`, (data) => {
      console.log('Order arrived:', data);
      setCurrentStatus('delivered');
      setShowMap(false);
      message.success('Đơn hàng đã được giao đến địa chỉ của bạn!');
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [order?._id, onOrderUpdate]);

  // Initialize map when showing
  useEffect(() => {
    if (showMap && mapRef.current && !mapAnimation) {
      // This is a placeholder - replace with actual map library (Google Maps, Leaflet, etc.)
      console.log('Map should be initialized here');
    }
  }, [showMap, mapAnimation]);

  // Start map animation (mock implementation)
  const startMapAnimation = (coordinates, durationSeconds) => {
    const { seller, buyer } = coordinates;

    // Mock animation - in production, use actual map library
    const startTime = Date.now();
    const endTime = startTime + durationSeconds * 1000;

    const animationData = {
      start: seller,
      end: buyer,
      startTime,
      endTime,
      duration: durationSeconds,
    };

    setMapAnimation(animationData);

    // Simulate vehicle movement
    const interval = setInterval(() => {
      const now = Date.now();
      const progress = (now - startTime) / (endTime - startTime);

      if (progress >= 1) {
        clearInterval(interval);
        // Animation complete
      } else {
        // Update marker position (interpolate between start and end)
        const lat = seller.lat + (buyer.lat - seller.lat) * progress;
        const lng = seller.lng + (buyer.lng - seller.lng) * progress;

        // Update marker on map (mock)
        console.log(`Vehicle at: ${lat}, ${lng} (${(progress * 100).toFixed(2)}%)`);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  };

  // Handle confirm receipt
  const handleConfirmReceipt = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(`${apiUrl}/api/orders/${order._id}/confirm-receipt`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to confirm receipt');
      }

      const data = await response.json();
      message.success('Đã xác nhận nhận hàng thành công!');
      setCurrentStatus('completed');
      setShowReviewModal(true);

      if (onOrderUpdate) {
        onOrderUpdate(data.data);
      }
    } catch (error) {
      console.error('Error confirming receipt:', error);
      message.error('Không thể xác nhận nhận hàng. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Handle submit review
  const handleSubmitReview = async () => {
    try {
      setLoading(true);
      // TODO: Implement review API call
      console.log('Submit review:', reviewData);
      message.success('Cảm ơn bạn đã đánh giá!');
      setShowReviewModal(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      message.error('Không thể gửi đánh giá. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Map old status to new status for consistent tracking
  const normalizeStatus = (status) => {
    const statusMap = {
      processing: 'confirmed',
      shipped: 'shipping',
      delivered_pending_confirmation: 'delivered',
    };
    return statusMap[status] || status;
  };

  const normalizedStatus = normalizeStatus(currentStatus);

  // Generate mock coordinates if order is shipping but has no tracking data
  const getMockCoordinates = () => ({
    seller: {
      lat: 16.0471, // Da Nang - Hai Chau District (downtown)
      lng: 108.2062,
      address: 'Quận Hải Châu, Đà Nẵng',
    },
    buyer: {
      lat: 16.0878, // Da Nang - Son Tra District
      lng: 108.2429,
      address: order?.shippingAddress?.fullAddress || 'Quận Sơn Trà, Đà Nẵng',
    },
  });

  // Check if map should be shown
  useEffect(() => {
    if (currentStatus === 'shipping' || currentStatus === 'shipped') {
      const coordinates = order?.trackingCoordinates || getMockCoordinates();

      setShowMap(true);
      startMapAnimation(
        {
          seller: coordinates.seller,
          buyer: coordinates.buyer,
        },
        60
      );
    }
  }, [currentStatus, order?.trackingCoordinates]);

  // Define steps for the stepper
  const steps = [
    {
      title: 'Đã nhận đơn',
      status: 'confirmed',
      icon: <CheckCircleOutlined />,
      description: 'Người bán đã nhận đơn hàng',
    },
    {
      title: 'Đã gói hàng',
      status: 'packing',
      icon: <InboxOutlined />,
      description: 'Đơn hàng đã được đóng gói',
    },
    {
      title: 'Đang giao hàng',
      status: 'shipping',
      icon: <TruckOutlined />,
      description: 'Đơn hàng đang trên đường giao đến bạn',
    },
    {
      title: 'Đã đến nơi',
      status: 'delivered',
      icon: <CheckCircleOutlined />,
      description: 'Đơn hàng đã được giao đến địa chỉ',
    },
  ];

  // Get current step index
  const getCurrentStep = () => {
    // Map status to step index
    const statusMap = {
      pending: -1, // Before first step
      confirmed: 0,
      processing: 0, // Old status -> map to confirmed
      packing: 1,
      shipping: 2,
      shipped: 2, // Old status -> map to shipping
      delivered: 3,
      delivered_pending_confirmation: 3, // Old status
      completed: 4, // After last step
    };

    return statusMap[normalizedStatus] ?? -1;
  };

  // Get step status for rendering (wait, process, finish)
  const getStepStatus = (stepIndex) => {
    const currentStep = getCurrentStep();
    if (stepIndex < currentStep) return 'finish';
    if (stepIndex === currentStep) return 'process';
    return 'wait';
  };

  return (
    <div className="order-tracking-enhanced">
      <Card title="🚚 Trạng thái đơn hàng" className="tracking-card">
        {/* Show pending status notice if order is still pending */}
        {(currentStatus === 'pending' || currentStatus === 'processing') && (
          <div
            style={{
              padding: '16px',
              marginBottom: '16px',
              background: '#fff7e6',
              borderRadius: '8px',
              border: '1px solid #ffd591',
            }}
          >
            <ClockCircleOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
            <strong>Chờ xác nhận:</strong> Đơn hàng của bạn đang chờ người bán xác nhận
          </div>
        )}

        <Steps
          current={getCurrentStep()}
          items={steps.map((step, index) => ({
            title: step.title,
            description: step.description,
            icon: step.icon,
            status: getStepStatus(index),
          }))}
        />

        {/* Show completed status */}
        {currentStatus === 'completed' && (
          <div
            style={{
              padding: '16px',
              marginTop: '16px',
              background: '#f6ffed',
              borderRadius: '8px',
              border: '1px solid #b7eb8f',
              textAlign: 'center',
            }}
          >
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24, marginRight: 8 }} />
            <strong style={{ color: '#52c41a' }}>Đơn hàng đã hoàn thành!</strong>
            <p style={{ margin: '8px 0 0 0', color: '#595959' }}>
              Cảm ơn bạn đã mua hàng. Hẹn gặp lại!
            </p>
          </div>
        )}

        {/* Map Animation Section */}
        {showMap && mapAnimation && (
          <Card className="map-container" style={{ marginTop: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>🚚 Theo dõi vận chuyển</h3>
              {!order?.trackingCoordinates && (
                <span
                  style={{
                    fontSize: 12,
                    color: '#fa8c16',
                    background: '#fff7e6',
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid #ffd591',
                  }}
                >
                  📍 Demo Mode
                </span>
              )}
            </div>
            <DeliveryTrackingMap
              sellerCoords={mapAnimation.start}
              buyerCoords={mapAnimation.end}
              duration={mapAnimation.duration}
              onDeliveryComplete={() => {
                console.log('Delivery animation completed');
              }}
            />
            {!order?.trackingCoordinates && (
              <p style={{ marginTop: 12, fontSize: 13, color: '#8c8c8c', textAlign: 'center' }}>
                ℹ️ Đang dùng mock GPS (Quận Hải Châu → Quận Sơn Trà, Đà Nẵng)
              </p>
            )}
          </Card>
        )}

        {/* Action Buttons */}
        <div className="action-buttons" style={{ marginTop: 24, textAlign: 'center' }}>
          {currentStatus === 'delivered' && (
            <Button type="primary" size="large" onClick={handleConfirmReceipt} loading={loading}>
              Đã nhận được hàng
            </Button>
          )}
        </div>
      </Card>

      {/* Review Modal */}
      <Modal
        title="Đánh giá sản phẩm"
        open={showReviewModal}
        onOk={handleSubmitReview}
        onCancel={() => setShowReviewModal(false)}
        okText="Gửi đánh giá"
        cancelText="Bỏ qua"
        confirmLoading={loading}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Đánh giá của bạn:</label>
            <Rate
              value={reviewData.rating}
              onChange={(value) => setReviewData({ ...reviewData, rating: value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Nhận xét:</label>
            <TextArea
              rows={4}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

OrderTrackingEnhanced.propTypes = {
  order: PropTypes.object.isRequired,
  onOrderUpdate: PropTypes.func,
};

export default OrderTrackingEnhanced;
