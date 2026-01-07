import { Button, Badge, Typography } from 'antd';
import { ShareAltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from '@assets/styles/buyer/DealCard.module.css';

const { Text } = Typography;

const DealCard = ({ deal, type = 'pending' }) => {
  const navigate = useNavigate();

  const formatTimeLeft = (time) => {
    if (!time) return '0h : 00m : 00s';
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(time.hours)}h : ${pad(time.minutes)}m : ${pad(time.seconds)}s`;
  };

  const handleDealClick = () => {
    navigate(`/deal/${deal.id}`);
  };

  return (
    <div className={`${styles.dealCard} ${styles[`dealCard${type.charAt(0).toUpperCase() + type.slice(1)}`]}`} onClick={handleDealClick} style={{ cursor: 'pointer' }}>
      <div className={styles.dealCardTopSection}>
        {/* Product Image - Left Side */}
        <div className={styles.dealCardImage}>
          <img alt={deal.name} src={deal.image} />
        </div>

        {/* Content - Right Side */}
        <div className={styles.dealCardContent}>
          {/* Product Name */}
          <h3 className={styles.dealProductName}>{deal.name}</h3>

          {/* Seller */}
          <Text className={styles.dealSellerText}>by {deal.seller}</Text>

          {/* Price and Items - Same Row */}
          <div className={styles.dealPriceItems}>
            <span className={styles.dealPrice}>
              {deal.currency}
              {deal.price}
            </span>
            <span className={styles.dealItemCount}>{deal.items} Item</span>
          </div>

          {/* Buyers Badge */}
          <div className={styles.dealBuyersSection}>
            <Badge
              count={`No. of Buyers : ${deal.totalBuyers} / ${deal.maxBuyers}`}
              color={type === 'pending' ? '#FFC069' : '#95DE64'}
              className={`${styles.customBadge} ${styles[`customBadge${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section - Full Width */}
      <div className={`${styles.dealBottomBar} ${styles[`dealBottom${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}>
        <div className={styles.dealTimeLeft}>
          <span className={styles.dealTimeLabel}>Deal Ending in</span>
          <span className={styles.dealTimeValue}>
            {type === 'pending' ? formatTimeLeft(deal.timeLeft) : '0h : 00m : 00s'}
          </span>
        </div>
        <Button type="text" icon={<ShareAltOutlined />} className={styles.shareLinkBtn}>
          SHARE LINK
        </Button>
      </div>
    </div>
  );
};

export default DealCard;
