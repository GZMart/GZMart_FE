import { useEffect, useState, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card, Steps, Button, Modal, Rate, Input, message } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  TruckOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import socketService from '@services/socket/socketService';
import DeliveryTrackingMap from './DeliveryTrackingMap';
import { orderService } from '@services/api/orderService';
import '../../assets/styles/buyer/Order/OrderTrackingEnhanced.module.css';

const { TextArea } = Input;

const OrderTrackingEnhanced = ({ order, onOrderUpdate }) => {
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'pending');
  const [showMap, setShowMap] = useState(false);
  const [mapAnimation, setMapAnimation] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const hasInitializedMap = useRef(false);
  const onOrderUpdateRef = useRef(onOrderUpdate);

  // Keep onOrderUpdate ref up-to-date without triggering re-registration
  useEffect(() => {
    onOrderUpdateRef.current = onOrderUpdate;
  }, [onOrderUpdate]);

  // Normalize backend/legacy statuses to canonical workflow statuses
  const normalizeStatus = (status) => {
    const s = String(status || '')
      .trim()
      .toLowerCase();
    if (!s) {
      return 'pending';
    }
    if (s === 'processing') {
      return 'confirmed';
    }
    if (s === 'packing') {
      return 'packed';
    }
    if (s === 'shipping') {
      return 'shipped';
    }
    if (s === 'delivered_pending_confirmation') {
      return 'delivered';
    }
    return s;
  };

  // Socket event listeners using shared socketService (already connected by ProfilePage)
  useEffect(() => {
    if (!order?._id) {
      return;
    }

    const orderId = order._id;

    // Listen for order status changes
    const handleStatusUpdate = (data) => {
      const normalized = normalizeStatus(data.status);
      setCurrentStatus(normalized);
      if (normalized === 'delivered' || normalized === 'completed') {
        setShowMap(false);
        hasInitializedMap.current = false;
      }
      if (onOrderUpdateRef.current) {
        onOrderUpdateRef.current(data);
      }
    };

    // Listen for shipping started event
    const handleShippingStarted = (data) => {
      setCurrentStatus('shipped');
      setShowMap(true);

      // Start map animation
      if (data.coordinates) {
        startMapAnimation(data.coordinates, data.duration || 10, data.startTime);
      }
    };

    // Listen for delivery arrival
    const handleArrived = (_data) => {
      setCurrentStatus('delivered');
      setShowMap(false);
      hasInitializedMap.current = false;
      message.success('Order has been delivered to your address!');
    };

    socketService.on(`order:status:${orderId}`, handleStatusUpdate);
    socketService.on(`order:shipping:${orderId}`, handleShippingStarted);
    socketService.on(`order:arrived:${orderId}`, handleArrived);

    // Cleanup listeners on unmount (without disconnecting shared socket)
    return () => {
      socketService.off(`order:status:${orderId}`, handleStatusUpdate);
      socketService.off(`order:shipping:${orderId}`, handleShippingStarted);
      socketService.off(`order:arrived:${orderId}`, handleArrived);
    };
  }, [order?._id]);

  useEffect(() => {
    if (order?.status && order.status !== currentStatus) {
      setCurrentStatus(normalizeStatus(order.status));
    }

    const normalizedOrderStatus = normalizeStatus(order?.status);
    if (normalizedOrderStatus === 'delivered' || normalizedOrderStatus === 'completed') {
      setShowMap(false);
      hasInitializedMap.current = false;
    }
  }, [order?.status, currentStatus]);

  // Initialize map when showing
  useEffect(() => {
    if (showMap && mapRef.current && !mapAnimation) {
      // This is a placeholder - replace with actual map library (Google Maps, Leaflet, etc.)
    }
  }, [showMap, mapAnimation]);

  // Store animation metadata so map can resume based on server start time.
  const startMapAnimation = (coordinates, durationSeconds = 10, startedAt = null) => {
    const { seller, buyer } = coordinates;

    const animationData = {
      start: seller,
      end: buyer,
      startTime: startedAt ? new Date(startedAt).toISOString() : new Date().toISOString(),
      duration: durationSeconds,
    };

    setMapAnimation(animationData);
  };

  // Handle confirm receipt
  const handleConfirmReceipt = async () => {
    try {
      setLoading(true);
      const response = await orderService.confirmReceipt(order._id);
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

  const normalizedStatus = normalizeStatus(currentStatus);

  // Memoize coordinates to prevent re-triggering map initialization
  const memoizedCoordinates = useMemo(() => {
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
            lat: 16.0471,
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
            lat: 16.0878,
            lng: 108.2429,
            address: order?.shippingAddress || 'Son Tra District, Da Nang (Demo)',
          },
      usingRealGPS: hasSellerGPS && hasBuyerGPS,
    };
  }, [
    order?.trackingCoordinates?.seller?.lat,
    order?.trackingCoordinates?.seller?.lng,
    order?.trackingCoordinates?.seller?.address,
    order?.userId?.location?.lat,
    order?.userId?.location?.lng,
    order?.userId?.location?.address,
    order?.shippingAddress,
  ]);

  // Check if map should be shown — guarded to run only once per shipping session
  useEffect(() => {
    if (currentStatus === 'shipped') {
      if (hasInitializedMap.current) {
        return;
      }
      hasInitializedMap.current = true;

      const coordinates = order?.trackingCoordinates || memoizedCoordinates;
      const durationFromEstimate =
        order?.shippingStartedAt && order?.shippingEstimatedArrival
          ? Math.max(
              1,
              Math.round(
                (new Date(order.shippingEstimatedArrival).getTime() -
                  new Date(order.shippingStartedAt).getTime()) /
                  1000
              )
            )
          : 10;

      setShowMap(true);
      startMapAnimation(
        {
          seller: coordinates.seller,
          buyer: coordinates.buyer,
        },
        durationFromEstimate,
        order?.shippingStartedAt || null
      );
    } else {
      hasInitializedMap.current = false;
    }
  }, [
    currentStatus,
    memoizedCoordinates,
    order?.trackingCoordinates,
    order?.shippingEstimatedArrival,
    order?.shippingStartedAt,
  ]);

  // Define steps for the stepper (simplified)
  const steps = [
    {
      title: 'Confirmed',
      status: 'confirmed',
      icon: <CheckCircleOutlined />,
      description: 'Seller confirmed',
    },
    {
      title: 'Packed',
      status: 'packed',
      icon: <InboxOutlined />,
      description: 'Ready to ship',
    },
    {
      title: 'Shipping',
      status: 'shipped',
      icon: <TruckOutlined />,
      description: 'On the way',
    },
    {
      title: 'Delivered',
      status: 'delivered',
      icon: <CheckCircleOutlined />,
      description: 'Arrived at address',
    },
    {
      title: 'Completed',
      status: 'completed',
      icon: <CheckCircleOutlined />,
      description: 'Order completed',
    },
  ];

  // Get current step index
  const getCurrentStep = () => {
    // Map status to step index (use normalized statuses)
    const statusMap = {
      pending: -1, // Before first step (no step highlighted)
      confirmed: 0,
      packed: 1,
      shipped: 2,
      delivered: 3,
      completed: 4, // After last step
    };

    return statusMap[normalizedStatus] ?? -1;
  };

  // Get step status for rendering (wait, process, finish)
  const getStepStatus = (stepIndex) => {
    const currentStep = getCurrentStep();
    if (stepIndex < currentStep) {
      return 'finish';
    }
    if (stepIndex === currentStep) {
      return 'process';
    }
    return 'wait';
  };

  return (
    <div className="order-tracking-enhanced">
      <Card className="tracking-card">
        {/* Show pending status notice if order is still pending */}
        {currentStatus === 'pending' && (
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
              {!order?.trackingCoordinates && !memoizedCoordinates.usingRealGPS && <span></span>}
              {!order?.trackingCoordinates && memoizedCoordinates.usingRealGPS && <span></span>}
            </div>
            <DeliveryTrackingMap
              sellerCoords={mapAnimation.start}
              buyerCoords={mapAnimation.end}
              duration={mapAnimation.duration}
              startTime={mapAnimation.startTime}
              onDeliveryComplete={async () => {
                // Server controls delivered status; map completion is visual only.
              }}
            />
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
