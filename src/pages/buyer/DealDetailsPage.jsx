import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Select, Progress, Input, Row, Col } from 'antd';
import { LeftOutlined, ShareAltOutlined, ShoppingCartOutlined, HeartOutlined, HeartFilled, CopyOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import '../../assets/styles/buyer/DealDetailsPage.css';

const { Title, Text, Paragraph } = Typography;

const DealDetailsPage = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 0, seconds: 0 });

  // Mock data - in production, this would come from API based on dealId
  const deal = {
    id: dealId || 1,
    name: '2020 Apple MacBook Pro with Apple M1 Chip (13-inch, 8GB RAM, 256GB SSD Storage) - Space Gray',
    brand: 'Apple',
    category: 'Electronics Devices',
    sku: 'A264671',
    image: 'https://tse4.mm.bing.net/th/id/OIP.SkPj7juxuRMPOHxYvak4dQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    images: [
      'https://tse4.mm.bing.net/th/id/OIP.SkPj7juxuRMPOHxYvak4dQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
      'https://tse4.mm.bing.net/th/id/OIP.SkPj7juxuRMPOHxYvak4dQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
      'https://tse4.mm.bing.net/th/id/OIP.SkPj7juxuRMPOHxYvak4dQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
      'https://tse4.mm.bing.net/th/id/OIP.SkPj7juxuRMPOHxYvak4dQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    ],
    rating: 4.7,
    reviews: 21671,
    availability: 'In Stock',
    originalPrice: 156000,
    dealPrice: 125000,
    discount: 21,
    installmentPrice: 90000,
    dealMembersFilled: 700,
    dealMembersMax: 1000,
    noOfBuyers: 22,
    dealTreadIndicator: 85,
    fleshDealEndsIn: '5 Hours',
    status: 'pending',
    colors: [
      { name: 'Gold', value: '#FFD700' },
      { name: 'Navy', value: '#000080' },
    ],
    sizes: [
      '14-inch Liquid Retina XDR display',
      '15-inch Retina XDR display',
      '16-inch Retina XDR display',
    ],
    memory: [
      '8GB unified memory',
      '16GB unified memory',
      '32GB unified memory',
    ],
    storage: [
      '256GB SSD Storage',
      '512GB SSD Storage',
      '1TB SSD Storage',
    ],
  };

  // Timer effect
  useEffect(() => {
    if (deal.status === 'pending') {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          let { hours, minutes, seconds } = prev;
          if (seconds > 0) {
            seconds--;
          } else if (minutes > 0) {
            minutes--;
            seconds = 59;
          } else if (hours > 0) {
            hours--;
            minutes = 59;
            seconds = 59;
          }
          return { hours, minutes, seconds };
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [deal.status]);

  const formatTimeLeft = (time) => {
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(time.hours)}h : ${pad(time.minutes)}m : ${pad(time.seconds)}s`;
  };

  const handleQuantityChange = (value) => {
    if (value >= 1) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize || !selectedMemory || !selectedStorage) {
      alert('Please select all options (Color, Size, Memory, Storage)');
      return;
    }
    console.log('Added to cart:', { dealId, quantity, selectedColor, selectedSize, selectedMemory, selectedStorage });
    alert('Added to cart successfully!');
  };

  const handleBuyNow = () => {
    if (!selectedColor || !selectedSize || !selectedMemory || !selectedStorage) {
      alert('Please select all options (Color, Size, Memory, Storage)');
      return;
    }
    navigate('/checkout', { state: { dealId, quantity } });
  };

  const handleShareDeal = () => {
    const dealLink = `${window.location.origin}/deal/${dealId}`;
    navigator.clipboard.writeText(dealLink);
    alert('Deal link copied to clipboard!');
  };

  return (
    <div className="deal-details-page">
      <div className="deal-details-container">
        {/* Header */}
        <div className="deal-details-header">
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={() => navigate(-1)}
            className="back-button"
          />
          <span className="header-title">Deal Details</span>
        </div>

        {/* Pending Alert */}
        {deal.status === 'pending' && (
          <div className="deal-alert pending-alert">
            ⚠️ Your Deal is pending yet. Wait for the deal to end. <a href="/track-order">Track Here</a>
          </div>
        )}

        <div className="deal-details-content">
          {/* Left Section - Images */}
          <div className="deal-details-left">
            <div className="deal-main-image">
              <img src={deal.image} alt={deal.name} />
            </div>
            <div className="deal-thumbnail-gallery">
              {deal.images.map((img, index) => (
                <div key={index} className="thumbnail">
                  <img src={img} alt={`Thumbnail ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Right Section - Details */}
          <div className="deal-details-right">
            {/* Rating */}
            <div className="deal-rating-section">
              <span className="rating-stars">★★★★★ {deal.rating}</span>
              <span className="rating-count">({deal.reviews.toLocaleString()} User feedback)</span>
            </div>

            {/* Product Name */}
            <Title level={2} className="deal-name">{deal.name}</Title>

            {/* SKU, Brand, Category, Availability */}
            <div className="deal-info-row">
              <div className="info-item-inline">
                <span className="label">Sku: <span className="value">{deal.sku}</span></span>
              </div>
              <div className="info-item-inline">
                <span className="label">Brand: <span className="value">{deal.brand}</span></span>
              </div>
              <div className="info-item-inline">
                <span className="label">Category: <span className="value">{deal.category}</span></span>
              </div>
              <div className="info-item-inline">
                <span className="label">Availability: <span className="value in-stock">{deal.availability}</span></span>
              </div>
            </div>

            {/* Price Section */}
            <Row gutter={[16, 0]} align="bottom" className="deal-price-and-quantity">
              <Col xs={24} sm={16}>
                <div className="deal-price-section">
                  <div className="price-main">
                    <span className="currency">Rs</span>
                    <span className="price-value">{deal.dealPrice.toLocaleString()}</span>
                    <span className="original-price">Rs{deal.originalPrice.toLocaleString()}</span>
                    <span className="discount">{deal.discount}% OFF</span>
                  </div>
                  <div className="price-installment">
                    <span className="installment-label">or</span>
                    <span className="installment-text">Get it for <span className="installment-price">Rs {deal.installmentPrice.toLocaleString()}</span></span>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="quantity-section">
                  <label className="quantity-label">Quantity</label>
                  <div className="quantity-control">
                    <Button
                      type="text"
                      size="small"
                      icon={<MinusOutlined />}
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="qty-btn"
                    />
                    <span className="qty-value">{quantity}</span>
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="qty-btn"
                    />
                  </div>
                </div>
              </Col>
            </Row>

            {/* Options */}
            <div className="deal-options-wrapper">
              <Row gutter={[16, 12]} className="deal-options">
                <Col xs={24} sm={12}>
                  <div className="option-group">
                    <label className="option-label">Color</label>
                    <div className="color-options">
                      {deal.colors.map((color, idx) => (
                        <div
                          key={idx}
                          className={`color-box ${selectedColor === color.value ? 'selected' : ''}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setSelectedColor(color.value)}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="option-group">
                    <label className="option-label">Size</label>
                    <Select
                      placeholder="Select Size"
                      value={selectedSize}
                      onChange={setSelectedSize}
                      className="option-select"
                      options={deal.sizes.map((size) => ({ value: size, label: size }))}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="option-group">
                    <label className="option-label">Memory</label>
                    <Select
                      placeholder="Select Memory"
                      value={selectedMemory}
                      onChange={setSelectedMemory}
                      className="option-select"
                      options={deal.memory.map((mem) => ({ value: mem, label: mem }))}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="option-group">
                    <label className="option-label">Storage</label>
                    <Select
                      placeholder="Select Storage"
                      value={selectedStorage}
                      onChange={setSelectedStorage}
                      className="option-select"
                      options={deal.storage.map((stor) => ({ value: stor, label: stor }))}
                    />
                  </div>
                </Col>
              </Row>
            </div>

            {/* Deal Info */}
            <div className="deal-info-stats">
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Deal Members Filled</span>
                  <span className="stat-value">{deal.dealMembersFilled}/{deal.dealMembersMax}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">No. Of Buyers in Deal</span>
                  <span className="stat-value">{deal.noOfBuyers}</span>
                </div>
              </div>

              <div className="progress-section">
                <Progress
                  percent={(deal.dealMembersFilled / deal.dealMembersMax) * 100}
                  strokeColor="#1890ff"
                  showInfo={false}
                />
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Current Deal Price</span>
                  <span className="stat-value">Rs {deal.dealPrice.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Deal Tread Indicator</span>
                  <span className="stat-value">{deal.dealTreadIndicator}%</span>
                </div>
              </div>

              {deal.status === 'pending' && (
                <div className="timer-section">
                  <span className="timer-label">Flash Deal Ends in 5 Hours !</span>
                  <div className="timer-progress-bar">
                    <div className="timer-progress" style={{ width: '30%' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Selector */}

            {/* Action Buttons */}
            <div className="action-buttons">
              {deal.status === 'pending' ? (
                <Button
                  type="primary"
                  danger
                  size="large"
                  className="get-deal-btn"
                  icon={<ShoppingCartOutlined />}
                >
                  GET DEAL (₹0K )
                </Button>
              ) : (
                <>
                  <Button
                    type="default"
                    size="large"
                    className="add-to-cart-btn"
                    onClick={handleAddToCart}
                    icon={<ShoppingCartOutlined />}
                  >
                    ADD
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    className="buy-now-btn"
                    onClick={handleBuyNow}
                  >
                    🔒 BUY
                  </Button>
                </>
              )}
            </div>

            {/* Secondary Actions */}
            <Row gutter={[8, 0]} className="secondary-actions">
              <Col xs={8} sm={8}>
                <Button
                  type="text"
                  className="action-link"
                  block
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  icon={isWishlisted ? <HeartFilled /> : <HeartOutlined />}
                >
                  Add to Wishlist
                </Button>
              </Col>
              <Col xs={8} sm={8}>
                <Button type="text" className="action-link" block>
                  Add to Compare
                </Button>
              </Col>
              <Col xs={8} sm={8}>
                <Button
                  type="text"
                  className="action-link"
                  block
                  onClick={handleShareDeal}
                >
                  Share product
                </Button>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetailsPage;
