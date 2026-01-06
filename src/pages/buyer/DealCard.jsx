import { Button, Badge, Typography } from 'antd';
import { ShareAltOutlined } from '@ant-design/icons';
import '../../assets/styles/buyer/DealCard.css';

const { Text } = Typography;

const DealCard = ({ deal, type = 'pending' }) => {
  const formatTimeLeft = (time) => {
    if (!time) return '0h : 00m : 00s';
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(time.hours)}h : ${pad(time.minutes)}m : ${pad(time.seconds)}s`;
  };

  return (
    <div className={`deal-card deal-card-${type}`}>
      <div className="deal-card-top-section">
        {/* Product Image - Left Side */}
        <div className="deal-card-image">
          <img alt={deal.name} src={deal.image} />
        </div>

        {/* Content - Right Side */}
        <div className="deal-card-content">
          {/* Product Name */}
          <h3 className="deal-product-name">{deal.name}</h3>

          {/* Seller */}
          <Text className="deal-seller-text">by {deal.seller}</Text>

          {/* Price and Items - Same Row */}
          <div className="deal-price-items">
            <span className="deal-price">
              {deal.currency}
              {deal.price}
            </span>
            <span className="deal-item-count">{deal.items} Item</span>
          </div>

          {/* Buyers Badge */}
          <div className="deal-buyers-section">
            <Badge
              count={`No. of Buyers : ${deal.totalBuyers} / ${deal.maxBuyers}`}
              color={type === 'pending' ? '#FFC069' : '#95DE64'}
              className={`custom-badge custom-badge-${type}`}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section - Full Width */}
      <div className={`deal-bottom-bar deal-bottom-${type}`}>
        <div className="deal-time-left">
          <span className="deal-time-label">Deal Ending in</span>
          <span className="deal-time-value">
            {type === 'pending' ? formatTimeLeft(deal.timeLeft) : '0h : 00m : 00s'}
          </span>
        </div>
        <Button type="text" icon={<ShareAltOutlined />} className="share-link-btn">
          SHARE LINK
        </Button>
      </div>
    </div>
  );
};

export default DealCard;
