import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Row, Col } from 'antd';
import { LeftOutlined, CheckCircleOutlined, ShoppingOutlined, TruckOutlined, HomeOutlined, CheckOutlined, UserOutlined, EnvironmentOutlined, AppstoreOutlined, CalendarOutlined } from '@ant-design/icons';
import '../../assets/styles/buyer/TrackOrderDetailsPage.css';

const TrackOrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { Title, Text } = Typography;

  // Mock data for order details
  const mockOrderData = {
    id: orderId || '96459761',
    products: 4,
    placedDate: '17 Jan, 2021',
    placedTime: '7:32 PM',
    totalPrice: 1199.00,
    currency: 'Rs.',
    expectedArrival: '23 Jan, 2021',
    status: 'On The Road', // Delivered, On The Road, Packaging, Order Placed
  };

  // Calculate progress based on status
  const getProgressFromStatus = (status) => {
    switch (status) {
      case 'Order Placed':
        return 0;
      case 'Packaging':
        return 33;
      case 'On The Road':
        return 67;
      case 'Delivered':
        return 100;
      default:
        return 0;
    }
  };

  const progress = getProgressFromStatus(mockOrderData.status);

  // Mock order activity timeline
  const mockOrderActivity = [
    {
      id: 1,
      title: 'Your order has been delivered. Thank you for shopping at Client!',
      timestamp: '23 Jan, 2021 at 7:32 PM',
      icon: 'check',
      color: 'success',
    },
    {
      id: 2,
      title: 'Our delivery man (John Wick) Has picked-up your order for delivery.',
      timestamp: '23 Jan, 2021 at 2:00 PM',
      icon: 'user',
      color: 'primary',
    },
    {
      id: 3,
      title: 'Your order has reached at last mile hub.',
      timestamp: '22 Jan, 2021 at 8:00 AM',
      icon: 'location',
      color: 'primary',
    },
    {
      id: 4,
      title: 'Your order on the way to (last mile) hub.',
      timestamp: '21, 2021 at 5:32 AM',
      icon: 'warehouse',
      color: 'default',
    },
    {
      id: 5,
      title: 'Your order is successfully verified.',
      timestamp: '20 Jan, 2021 at 7:32 PM',
      icon: 'check',
      color: 'success',
    },
    {
      id: 6,
      title: 'Your order has been confirmed.',
      timestamp: '19 Jan, 2021 at 2:61 PM',
      icon: 'calendar',
      color: 'primary',
    },
  ];

  const getStepIcon = (index) => {
    if (index === 0) return <CheckCircleOutlined />;
    if (index === 1) return <ShoppingOutlined />;
    if (index === 2) return <TruckOutlined />;
    if (index === 3) return <HomeOutlined />;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'check':
        return <CheckOutlined />;
      case 'user':
        return <UserOutlined />;
      case 'location':
        return <EnvironmentOutlined />;
      case 'warehouse':
        return <AppstoreOutlined />;
      case 'calendar':
        return <CalendarOutlined />;
      default:
        return null;
    }
  };

  return (
    <div className="track-order-details-page">
      <div className="track-order-details-container">
        {/* Header Section */}
        <div className="track-order-header">
          <div className="back-button-group">
            <Button 
              type="text" 
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
              className="back-button"
            />
            <span className="back-text">Back</span>
          </div>
          <Title level={1} className="page-title">
            Track Order
          </Title>
        </div>

        {/* Order Info Card */}
        <Card className="order-info-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <div className="order-info-left">
                <h3 className="order-id">#{mockOrderData.id}</h3>
                <p className="order-meta">
                  {mockOrderData.products} Products • Order Placed in {mockOrderData.placedDate} at {mockOrderData.placedTime}
                </p>
              </div>
            </Col>
            <Col xs={24} md={12} className="order-info-right">
              <Text className="order-price">{mockOrderData.currency} {mockOrderData.totalPrice.toFixed(2)}</Text>
            </Col>
          </Row>
        </Card>

        {/* Expected Arrival */}
        <div className="expected-arrival">
          <Text className="arrival-label">Order expected arrival</Text>
          <Text className="arrival-date">{mockOrderData.expectedArrival}</Text>
        </div>

        {/* Progress Bar */}
        <Card className="progress-card">
          <div className="progress-section">
            <div className="custom-progress-bar">
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-points">
                <div className="progress-point" style={{ left: '0%' }}>
                  <div className={`point-circle ${progress >= 0 ? 'active' : ''}`}>
                    <CheckOutlined />
                  </div>
                  <div className="point-label">Order Placed</div>
                </div>
                <div className="progress-point" style={{ left: '33.33%' }}>
                  <div className={`point-circle ${progress >= 33 ? 'active' : ''}`}>
                    <ShoppingOutlined />
                  </div>
                  <div className="point-label">Packaging</div>
                </div>
                <div className="progress-point" style={{ left: '66.66%' }}>
                  <div className={`point-circle ${progress >= 67 ? 'active' : ''}`}>
                    <TruckOutlined />
                  </div>
                  <div className="point-label">On The Road</div>
                </div>
                <div className="progress-point" style={{ left: '100%' }}>
                  <div className={`point-circle ${progress >= 100 ? 'active' : ''}`}>
                    <HomeOutlined />
                  </div>
                  <div className="point-label">Delivered</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Order Activity */}
        <div className="order-activity-section">
          <Title level={4} className="activity-title">Order Activity</Title>
          
          <div className="activity-timeline">
            {mockOrderActivity.map((activity) => (
              <div key={activity.id} className={`activity-item activity-${activity.color}`}>
                <div className="activity-icon-wrapper">
                  {getActivityIcon(activity.icon)}
                </div>
                <div className="activity-content">
                  <p className="activity-message">{activity.title}</p>
                  <Text className="activity-timestamp">{activity.timestamp}</Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrderDetailsPage;
