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
import { orderService } from '@services/api/orderService';
import '../../assets/styles/OrderTrackingEnhanced.module.css';

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

    // FIX BUG 12: Connect to backend socket with reconnection handling
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      // Socket connected
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // Server disconnected, manually reconnect
        socket.connect();
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      // Reconnected
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      // Reconnection attempt
    });

    socket.on('reconnect_error', (error) => {
      console.error('[Socket] Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed after all attempts');
      message.error('Lost connection to server. Please refresh the page.');
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    // Listen for order status changes
    socket.on(`order:status:${order._id}`, (data) => {
      setCurrentStatus(data.status);
      if (onOrderUpdate) {
        onOrderUpdate(data);
      }
    });

    // Listen for shipping started event
    socket.on(`order:shipping:${order._id}`, (data) => {
      setCurrentStatus('shipping');
      setShowMap(true);

      // Start map animation
      if (data.coordinates) {
        startMapAnimation(data.coordinates, data.duration || 60);
      }
    });

    // Listen for delivery arrival
    socket.on(`order:arrived:${order._id}`, (data) => {
      setCurrentStatus('delivered');
      setShowMap(false);
      message.success('Order has been delivered to your address!');
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
        // Position updated
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  };

  // Handle confirm receipt
  const handleConfirmReceipt = async () => {
    try {
      setLoading(true);
      const response = await orderService.confirmReceipt(order._id);
      message.success('Receipt confirmed successfully!');
      setCurrentStatus('completed');
      setShowReviewModal(true);

      if (onOrderUpdate) {
        onOrderUpdate(response.data);
      }
    } catch (error) {
      console.error('Error confirming receipt:', error);
      message.error('Unable to confirm receipt. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  // Handle submit review
  const handleSubmitReview = async () => {
    try {
      setLoading(true);
      // TODO: Implement review API call
      message.success('Thank you for your review!');
      setShowReviewModal(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      message.error('Unable to submit review. Please try again!');
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

  // Get coordinates from order data (real GPS from user location or fallback to mock)
  const getCoordinates = () => {
    // Try to get real GPS from trackingCoordinates or populated user data
    const hasSellerGPS =
      order?.trackingCoordinates?.seller?.lat && order?.trackingCoordinates?.seller?.lng;
    const hasBuyerGPS = order?.userId?.location?.lat && order?.userId?.location?.lng;

    return {
      seller: hasSellerGPS
        ? {
            lat: order.trackingCoordinates.seller.lat,
            lng: order.trackingCoordinates.seller.lng,
            address: order.trackingCoordinates.seller.address || 'Seller Address',
          }
        : {
            lat: 16.0471, // Da Nang - Hai Chau District (fallback)
            lng: 108.2062,
            address: 'Hai Chau District, Da Nang (Demo)',
          },
      buyer: hasBuyerGPS
        ? {
            lat: order.userId.location.lat,
            lng: order.userId.location.lng,
            address: order.userId.location.address || order.shippingAddress || 'Buyer Address',
          }
        : {
            lat: 16.0878, // Da Nang - Son Tra District (fallback)
            lng: 108.2429,
            address: order?.shippingAddress || 'Son Tra District, Da Nang (Demo)',
          },
      usingRealGPS: hasSellerGPS && hasBuyerGPS,
    };
  };

  // Check if map should be shown
  useEffect(() => {
    if (currentStatus === 'shipping' || currentStatus === 'shipped') {
      // Priority: trackingCoordinates from order > real GPS from user location > mock data
      const coordinates = order?.trackingCoordinates || getCoordinates();

      setShowMap(true);
      startMapAnimation(
        {
          seller: coordinates.seller,
          buyer: coordinates.buyer,
        },
        60
      );
    }
  }, [currentStatus, order?.trackingCoordinates, order?.userId?.location]);

  // Define steps for the stepper
  const steps = [
    {
      title: 'Confirmed',
      status: 'confirmed',
      icon: <CheckCircleOutlined />,
      description: 'Seller confirmed',
    },
    {
      title: 'Packed',
      status: 'packing',
      icon: <InboxOutlined />,
      description: 'Ready to ship',
    },
    {
      title: 'Shipping',
      status: 'shipping',
      icon: <TruckOutlined />,
      description: 'On the way',
    },
    {
      title: 'Delivered',
      status: 'delivered',
      icon: <CheckCircleOutlined />,
      description: 'Arrived at address',
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
      <Card title="🚚 Order Status" className="tracking-card">
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
            <strong>Awaiting Confirmation:</strong> Your order is awaiting seller confirmation
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
            <strong style={{ color: '#52c41a' }}>Order Completed!</strong>
            <p style={{ margin: '8px 0 0 0', color: '#595959' }}>
              Thank you for your purchase. See you again!
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
              <h3 style={{ margin: 0 }}>🚚 Track Delivery</h3>
              {!order?.trackingCoordinates && !getCoordinates().usingRealGPS && (
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
                  📍 Demo Mode (Mock GPS)
                </span>
              )}
              {!order?.trackingCoordinates && getCoordinates().usingRealGPS && (
                <span
                  style={{
                    fontSize: 12,
                    color: '#52c41a',
                    background: '#f6ffed',
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid #b7eb8f',
                  }}
                >
                  📍 Real GPS
                </span>
              )}
            </div>
            <DeliveryTrackingMap
              sellerCoords={mapAnimation.start}
              buyerCoords={mapAnimation.end}
              duration={mapAnimation.duration}
              onDeliveryComplete={async () => {
                // Call API to mark order as delivered
                try {
                  const response = await orderService.markAsDelivered(order._id);

                  if (response.success) {
                    message.success('Đơn hàng đã được giao thành công! 🎉');
                    setCurrentStatus('delivered');

                    // Notify parent component
                    if (onOrderUpdate) {
                      onOrderUpdate(response.data);
                    }
                  }
                } catch (error) {
                  console.error('Error marking order as delivered:', error);
                  // Don't show error message to user as backend timer will handle it
                  // Just log for debugging
                }
              }}
            />
            {!order?.trackingCoordinates && !getCoordinates().usingRealGPS && (
              <p style={{ marginTop: 12, fontSize: 13, color: '#8c8c8c', textAlign: 'center' }}>
                ℹ️ Using mock GPS coordinates (Hai Chau → Son Tra, Da Nang)
              </p>
            )}
            {!order?.trackingCoordinates && getCoordinates().usingRealGPS && (
              <p style={{ marginTop: 12, fontSize: 13, color: '#52c41a', textAlign: 'center' }}>
                ✓ Using real GPS from user addresses
              </p>
            )}
          </Card>
        )}

        {/* Action Buttons */}
        <div className="action-buttons" style={{ marginTop: 24, textAlign: 'center' }}>
          {currentStatus === 'delivered' && (
            <Button type="primary" size="large" onClick={handleConfirmReceipt} loading={loading}>
              Confirm Receipt
            </Button>
          )}
        </div>
      </Card>

      {/* Review Modal */}
      <Modal
        title="Rate Product"
        open={showReviewModal}
        onOk={handleSubmitReview}
        onCancel={() => setShowReviewModal(false)}
        okText="Submit Review"
        cancelText="Skip"
        confirmLoading={loading}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Your Rating:</label>
            <Rate
              value={reviewData.rating}
              onChange={(value) => setReviewData({ ...reviewData, rating: value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Comment:</label>
            <TextArea
              rows={4}
              placeholder="Share your experience about the product..."
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
