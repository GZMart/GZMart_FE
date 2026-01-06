import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { LeftOutlined, ShareAltOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import DealCard from '@/pages/buyer/DealCard';
import '../../assets/styles/buyer/MyDealsPage.css';

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
    <div className="my-deals-page">
      <div className="my-deals-container">
        {/* Header Section */}
        <div className="my-deals-header">
          <div className="header-left">
            <Button 
              type="text" 
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
              className="back-button"
            />
            <div className="header-title-section">
              <Title level={1} className="page-title">My Deals</Title>
              <Text className="page-subtitle">Lets create your account</Text>
            </div>
          </div>
          
          <div className="header-right">
            <Button 
              type="primary" 
              icon={<ShoppingCartOutlined />}
              className="past-deals-btn"
            >
              Past Deals
            </Button>
            <Button 
              type="primary" 
              className="wallet-btn"
            >
              💳 Add Money to UD wallet
            </Button>
            <Button 
              type="text" 
              icon={<ShareAltOutlined />}
              className="share-btn"
            />
          </div>
        </div>

        {/* Deals Section */}
        <div className="deals-section">
          {/* Pending Deals */}
          <div className="deals-column pending-deals-column">
            <div className="section-header pending">
              <div className="header-icon-text">
                <span className="bell-icon">🔔</span>
                <div>
                  <h2>Pending Deals</h2>
                  <p className="section-description">Please choose a payment method</p>
                </div>
              </div>
            </div>
            
            <div className="deals-grid pending">
              {pendingDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} type="pending" />
              ))}
            </div>
          </div>

          {/* Approved Deals */}
          <div className="deals-column approved-deals-column">
            <div className="section-header approved">
              <div className="header-icon-text">
                <span className="check-icon">✓</span>
                <div>
                  <h2>Approved Deals</h2>
                  <p className="section-description">Please choose a shipping company based on your region</p>
                </div>
              </div>
            </div>
            
            <div className="deals-grid approved">
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
