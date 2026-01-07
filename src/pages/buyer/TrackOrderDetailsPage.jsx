import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Row, Col } from 'antd';
import { LeftOutlined, CheckCircleOutlined, ShoppingOutlined, TruckOutlined, HomeOutlined, CheckOutlined, UserOutlined, EnvironmentOutlined, AppstoreOutlined, CalendarOutlined } from '@ant-design/icons';
import styles from '@assets/styles/buyer/TrackOrderDetailsPage.module.css';

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
            <span className={styles.backText}>Back</span>
          </div>
          <Title level={1} className={styles.pageTitle}>
            Track Order
          </Title>
        </div>

        {/* Order Info Card */}
        <Card className={styles.orderInfoCard}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <div className={styles.orderInfoLeft}>
                <h3 className={styles.orderId}>#{mockOrderData.id}</h3>
                <p className={styles.orderMeta}>
                  {mockOrderData.products} Products • Order Placed in {mockOrderData.placedDate} at {mockOrderData.placedTime}
                </p>
              </div>
            </Col>
            <Col xs={24} md={12} className={styles.orderInfoRight}>
              <Text className={styles.orderPrice}>{mockOrderData.currency} {mockOrderData.totalPrice.toFixed(2)}</Text>
            </Col>
          </Row>
        </Card>

        {/* Expected Arrival */}
        <div className={styles.expectedArrival}>
          <Text className={styles.arrivalLabel}>Order expected arrival</Text>
          <Text className={styles.arrivalDate}>{mockOrderData.expectedArrival}</Text>
        </div>

        {/* Progress Bar */}
        <Card className={styles.progressCard}>
          <div className={styles.progressSection}>
            <div className={styles.customProgressBar}>
              <div className={styles.progressTrack}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className={styles.progressPoints}>
                <div className={styles.progressPoint} style={{ left: '0%' }}>
                  <div className={`${styles.pointCircle} ${progress >= 0 ? styles.active : ''}`}>
                    <CheckOutlined />
                  </div>
                  <div className={styles.pointLabel}>Order Placed</div>
                </div>
                <div className={styles.progressPoint} style={{ left: '33.33%' }}>
                  <div className={`${styles.pointCircle} ${progress >= 33 ? styles.active : ''}`}>
                    <ShoppingOutlined />
                  </div>
                  <div className={styles.pointLabel}>Packaging</div>
                </div>
                <div className={styles.progressPoint} style={{ left: '66.66%' }}>
                  <div className={`${styles.pointCircle} ${progress >= 67 ? styles.active : ''}`}>
                    <TruckOutlined />
                  </div>
                  <div className={styles.pointLabel}>On The Road</div>
                </div>
                <div className={styles.progressPoint} style={{ left: '100%' }}>
                  <div className={`${styles.pointCircle} ${progress >= 100 ? styles.active : ''}`}>
                    <HomeOutlined />
                  </div>
                  <div className={styles.pointLabel}>Delivered</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Order Activity */}
        <div className={styles.orderActivitySection}>
          <Title level={4} className={styles.activityTitle}>Order Activity</Title>
          
          <div className={styles.activityTimeline}>
            {mockOrderActivity.map((activity) => (
              <div key={activity.id} className={`${styles.activityItem} ${styles[`activity${activity.color.charAt(0).toUpperCase() + activity.color.slice(1)}`]}`}>
                <div className={styles.activityIconWrapper}>
                  {getActivityIcon(activity.icon)}
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityMessage}>{activity.title}</p>
                  <Text className={styles.activityTimestamp}>{activity.timestamp}</Text>
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
