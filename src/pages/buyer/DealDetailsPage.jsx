import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Select, Progress, Input, Row, Col } from 'antd';
import { LeftOutlined, ShareAltOutlined, ShoppingCartOutlined, HeartOutlined, HeartFilled, CopyOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import styles from '@assets/styles/buyer/DealDetailsPage.module.css';

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
    <div className={styles.dealDetailsPage}>
      <div className={styles.dealDetailsContainer}>
        {/* Header */}
        <div className={styles.dealDetailsHeader}>
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={() => navigate(-1)}
            className={styles.backButton}
          />
          <span className={styles.headerTitle}>Deal Details</span>
        </div>

        {/* Pending Alert */}
        {deal.status === 'pending' && (
          <div className={`${styles.dealAlert} ${styles.pendingAlert}`}>
            ⚠️ Your Deal is pending yet. Wait for the deal to end. <a href="/track-order">Track Here</a>
          </div>
        )}

        <div className={styles.dealDetailsContent}>
          {/* Left Section - Images */}
          <div className={styles.dealDetailsLeft}>
            <div className={styles.dealMainImage}>
              <img src={deal.image} alt={deal.name} />
            </div>
            <div className={styles.dealThumbnailGallery}>
              {deal.images.map((img, index) => (
                <div key={index} className={styles.thumbnail}>
                  <img src={img} alt={`Thumbnail ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Right Section - Details */}
          <div className={styles.dealDetailsRight}>
            {/* Rating */}
            <div className={styles.dealRatingSection}>
              <span className={styles.ratingStars}>★★★★★ {deal.rating}</span>
              <span className={styles.ratingCount}>({deal.reviews.toLocaleString()} User feedback)</span>
            </div>

            {/* Product Name */}
            <Title level={2} className={styles.dealName}>{deal.name}</Title>

            {/* SKU, Brand, Category, Availability */}
            <div className={styles.dealInfoRow}>
              <div className={styles.infoItemInline}>
                <span className={styles.label}>Sku: <span className={styles.value}>{deal.sku}</span></span>
              </div>
              <div className={styles.infoItemInline}>
                <span className={styles.label}>Brand: <span className={styles.value}>{deal.brand}</span></span>
              </div>
              <div className={styles.infoItemInline}>
                <span className={styles.label}>Category: <span className={styles.value}>{deal.category}</span></span>
              </div>
              <div className={styles.infoItemInline}>
                <span className={styles.label}>Availability: <span className={`${styles.value} ${styles.inStock}`}>{deal.availability}</span></span>
              </div>
            </div>

            {/* Price Section */}
            <Row gutter={[16, 0]} align="bottom" className={styles.dealPriceAndQuantity}>
              <Col xs={24} sm={16}>
                <div className={styles.dealPriceSection}>
                  <div className={styles.priceMain}>
                    <span className={styles.currency}>Rs</span>
                    <span className={styles.priceValue}>{deal.dealPrice.toLocaleString()}</span>
                    <span className={styles.originalPrice}>Rs{deal.originalPrice.toLocaleString()}</span>
                    <span className={styles.discount}>{deal.discount}% OFF</span>
                  </div>
                  <div className={styles.priceInstallment}>
                    <span className={styles.installmentLabel}>or</span>
                    <span className={styles.installmentText}>Get it for <span className={styles.installmentPrice}>Rs {deal.installmentPrice.toLocaleString()}</span></span>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className={styles.quantitySection}>
                  <label className={styles.quantityLabel}>Quantity</label>
                  <div className={styles.quantityControl}>
                    <Button
                      type="text"
                      size="small"
                      icon={<MinusOutlined />}
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className={styles.qtyBtn}
                    />
                    <span className={styles.qtyValue}>{quantity}</span>
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className={styles.qtyBtn}
                    />
                  </div>
                </div>
              </Col>
            </Row>

            {/* Options */}
            <div className={styles.dealOptionsWrapper}>
              <Row gutter={[16, 12]} className={styles.dealOptions}>
                <Col xs={24} sm={12}>
                  <div className={styles.optionGroup}>
                    <label className={styles.optionLabel}>Color</label>
                    <div className={styles.colorOptions}>
                      {deal.colors.map((color, idx) => (
                        <div
                          key={idx}
                          className={`${styles.colorBox} ${selectedColor === color.value ? styles.selected : ''}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setSelectedColor(color.value)}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className={styles.optionGroup}>
                    <label className={styles.optionLabel}>Size</label>
                    <Select
                      placeholder="Select Size"
                      value={selectedSize}
                      onChange={setSelectedSize}
                      className={styles.optionSelect}
                      options={deal.sizes.map((size) => ({ value: size, label: size }))}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className={styles.optionGroup}>
                    <label className={styles.optionLabel}>Memory</label>
                    <Select
                      placeholder="Select Memory"
                      value={selectedMemory}
                      onChange={setSelectedMemory}
                      className={styles.optionSelect}
                      options={deal.memory.map((mem) => ({ value: mem, label: mem }))}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className={styles.optionGroup}>
                    <label className={styles.optionLabel}>Storage</label>
                    <Select
                      placeholder="Select Storage"
                      value={selectedStorage}
                      onChange={setSelectedStorage}
                      className={styles.optionSelect}
                      options={deal.storage.map((stor) => ({ value: stor, label: stor }))}
                    />
                  </div>
                </Col>
              </Row>
            </div>

            {/* Deal Info */}
            <div className={styles.dealInfoStats}>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Deal Members Filled</span>
                  <span className={styles.statValue}>{deal.dealMembersFilled}/{deal.dealMembersMax}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>No. Of Buyers in Deal</span>
                  <span className={styles.statValue}>{deal.noOfBuyers}</span>
                </div>
              </div>

              <div className={styles.progressSection}>
                <Progress
                  percent={(deal.dealMembersFilled / deal.dealMembersMax) * 100}
                  strokeColor="#1890ff"
                  showInfo={false}
                />
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Current Deal Price</span>
                  <span className={styles.statValue}>Rs {deal.dealPrice.toLocaleString()}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Deal Tread Indicator</span>
                  <span className={styles.statValue}>{deal.dealTreadIndicator}%</span>
                </div>
              </div>

              {deal.status === 'pending' && (
                <div className={styles.timerSection}>
                  <span className={styles.timerLabel}>Flash Deal Ends in 5 Hours !</span>
                  <div className={styles.timerProgressBar}>
                    <div className={styles.timerProgress} style={{ width: '30%' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Selector */}

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              {deal.status === 'pending' ? (
                <Button
                  type="primary"
                  danger
                  size="large"
                  className={styles.getDealBtn}
                  icon={<ShoppingCartOutlined />}
                >
                  GET DEAL (₹0K )
                </Button>
              ) : (
                <>
                  <Button
                    type="default"
                    size="large"
                    className={styles.addToCartBtn}
                    onClick={handleAddToCart}
                    icon={<ShoppingCartOutlined />}
                  >
                    ADD
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    className={styles.buyNowBtn}
                    onClick={handleBuyNow}
                  >
                    🔒 BUY
                  </Button>
                </>
              )}
            </div>

            {/* Secondary Actions */}
            <Row gutter={[8, 0]} className={styles.secondaryActions}>
              <Col xs={8} sm={8}>
                <Button
                  type="text"
                  className={styles.actionLink}
                  block
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  icon={isWishlisted ? <HeartFilled /> : <HeartOutlined />}
                >
                  Add to Wishlist
                </Button>
              </Col>
              <Col xs={8} sm={8}>
                <Button type="text" className={styles.actionLink} block>
                  Add to Compare
                </Button>
              </Col>
              <Col xs={8} sm={8}>
                <Button
                  type="text"
                  className={styles.actionLink}
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
