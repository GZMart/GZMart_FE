import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { LeftOutlined, ShareAltOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import DealCard from '@/pages/buyer/DealCard';
import styles from '@assets/styles/buyer/MyDealsPage.module.css';

const MyDealsPage = () => {
  const navigate = useNavigate();
  const { Title, Text } = Typography;
  const [timeLeft, setTimeLeft] = useState({});

  // Mock data for pending deals
  const pendingDeals = [
    {
      id: 1,
      image: 'https://tse4.mm.bing.net/th/id/OIP.SkPj7juxuRMPOHxYvak4dQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
      name: 'Marvel Thor Movie Print Marble T...',
      seller: 'Geaux Club',
      price: 2300,
      currency: 'Rs',
      items: 1,
      totalBuyers: 40,
      maxBuyers: 40,
      timeLeft: { hours: 3, minutes: 43, seconds: 12 },
      paymentMethod: 'Please choose a payment method',
    },
    {
      id: 2,
      image: 'https://tse4.mm.bing.net/th/id/OIP.SkPj7juxuRMPOHxYvak4dQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
      name: 'Marvel Thor Movie Print Marble T...',
      seller: 'Geaux Club',
      price: 2300,
      currency: 'Rs',
      items: 1,
      totalBuyers: 40,
      maxBuyers: 40,
      timeLeft: { hours: 3, minutes: 43, seconds: 12 },
      paymentMethod: 'Please choose a payment method',
    },
    {
      id: 3,
      image: 'https://tse4.mm.bing.net/th/id/OIP.SkPj7juxuRMPOHxYvak4dQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
      name: 'Marvel Thor Movie Print Marble T...',
      seller: 'Geaux Club',
      price: 2300,
      currency: 'Rs',
      items: 1,
      totalBuyers: 40,
      maxBuyers: 40,
      timeLeft: { hours: 3, minutes: 43, seconds: 12 },
      paymentMethod: 'Please choose a payment method',
    },
  ];

  // Mock data for approved deals
  const approvedDeals = [
    {
      id: 4,
      image: 'https://tse4.mm.bing.net/th/id/OIP.SkPj7juxuRMPOHxYvak4dQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
      name: 'Marvel Thor Movie Print Marble T...',
      seller: 'Geaux Club',
      price: 2300,
      currency: 'Rs',
      items: 1,
      totalBuyers: 40,
      maxBuyers: 40,
      shippingNote: 'Please choose a shipping company based on your region',
    },
    {
      id: 5,
      image: 'https://tse4.mm.bing.net/th/id/OIP.SkPj7juxuRMPOHxYvak4dQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
      name: 'Marvel Thor Movie Print Marble T...',
      seller: 'Geaux Club',
      price: 2300,
      currency: 'Rs',
      items: 1,
      totalBuyers: 40,
      maxBuyers: 40,
      shippingNote: 'Please choose a shipping company based on your region',
    },
    {
      id: 6,
      image: 'https://tse4.mm.bing.net/th/id/OIP.SkPj7juxuRMPOHxYvak4dQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
      name: 'Marvel Thor Movie Print Marble T...',
      seller: 'Geaux Club',
      price: 2300,
      currency: 'Rs',
      items: 1,
      totalBuyers: 40,
      maxBuyers: 40,
      shippingNote: 'Please choose a shipping company based on your region',
    },
  ];

  const formatTimeLeft = (time) => {
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(time.hours)}h : ${pad(time.minutes)}m : ${pad(time.seconds)}s`;
  };

  return (
    <div className={styles.myDealsPage}>
      <div className={styles.myDealsContainer}>
        {/* Header Section */}
        <div className={styles.myDealsHeader}>
          <div className={styles.headerLeft}>
            <Button 
              type="text" 
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
              className={styles.backButton}
            />
            <div className={styles.headerTitleSection}>
              <Title level={1} className={styles.pageTitle}>My Deals</Title>
              <Text className={styles.pageSubtitle}>Lets create your account</Text>
            </div>
          </div>
          
          <div className={styles.headerRight}>
            <Button 
              type="primary" 
              icon={<ShoppingCartOutlined />}
              className={styles.pastDealsBtn}
            >
              Past Deals
            </Button>
            <Button 
              type="primary" 
              className={styles.walletBtn}
            >
              💳 Add Money to UD wallet
            </Button>
            <Button 
              type="text" 
              icon={<ShareAltOutlined />}
              className={styles.shareBtn}
            />
          </div>
        </div>

        {/* Deals Section */}
        <div className={styles.dealsSection}>
          {/* Pending Deals */}
          <div className={styles.dealsColumn}>
            <div className={styles.sectionHeader}>
              <div className={styles.headerIconText}>
                <span className={styles.bellIcon}>🔔</span>
                <div>
                  <h2>Pending Deals</h2>
                  <p className={styles.sectionDescription}>Please choose a payment method</p>
                </div>
              </div>
            </div>
            
            <div className={styles.dealsGrid}>
              {pendingDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} type="pending" />
              ))}
            </div>
          </div>

          {/* Approved Deals */}
          <div className={styles.dealsColumn}>
            <div className={styles.sectionHeader}>
              <div className={styles.headerIconText}>
                <span className={styles.checkIcon}>✓</span>
                <div>
                  <h2>Approved Deals</h2>
                  <p className={styles.sectionDescription}>Please choose a shipping company based on your region</p>
                </div>
              </div>
            </div>
            
            <div className={styles.dealsGrid}>
              {approvedDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} type="approved" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDealsPage;
