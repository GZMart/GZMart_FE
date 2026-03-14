import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Table, Button, Space, Empty, Card, Badge, Typography, Tooltip, message, Spin } from 'antd';
import {
  DeleteOutlined,
  ShoppingCartOutlined,
  LeftOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import * as wishlistService from '@/services/api/wishlistService';
import * as cartService from '@services/api/cartService';
import { formatCurrency } from '@utils/formatters';
import styles from '@assets/styles/buyer/WishlistPage.module.css';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { Title } = Typography;
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch wishlists on component mount
  useEffect(() => {
    fetchWishlists();
  }, []);

  const fetchWishlists = async () => {
    try {
      setLoading(true);
      const response = await wishlistService.getWishlists();

      const products = response?.data?.products || [];
      setWishlists(products);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load wishlists');
    } finally {
      setLoading(false);
    }
  };

  const getVariantForCart = (product) => {
    const models = Array.isArray(product?.models) ? product.models : [];
    const tiers = Array.isArray(product?.tiers) ? product.tiers : [];

    if (models.length === 0) {
      return null;
    }

    if (tiers.length === 0) {
      return { color: 'Default', size: 'Default' };
    }

    const colorTierIndex = tiers.findIndex((tier) => {
      const tierName = String(tier?.name || '').toLowerCase();
      return tierName === 'color' || tierName === 'màu sắc';
    });

    const sizeTierIndex = tiers.findIndex((tier) => {
      const tierName = String(tier?.name || '').toLowerCase();
      return tierName === 'size' || tierName === 'kích thước';
    });

    const candidate =
      models.find((m) => m?.isActive && Number(m?.stock || 0) > 0) ||
      models.find((m) => Number(m?.stock || 0) > 0) ||
      models.find((m) => m?.isActive) ||
      models[0];

    if (!candidate) {
      return null;
    }

    const color =
      colorTierIndex >= 0
        ? tiers[colorTierIndex]?.options?.[candidate?.tierIndex?.[colorTierIndex]]
        : 'Default';
    const size =
      sizeTierIndex >= 0
        ? tiers[sizeTierIndex]?.options?.[candidate?.tierIndex?.[sizeTierIndex]]
        : 'Default';

    if (!color || !size) {
      return null;
    }

    return { color, size };
  };

  const handleAddToCart = async (product) => {
    try {
      setActionLoading(product._id);

      const variant = getVariantForCart(product);
      if (!variant) {
        message.info('Please choose product variant before adding to cart');
        navigate(`/product/${product._id}`);
        return;
      }

      await cartService.addToCart(product._id, 1, variant.color, variant.size);
      message.success('Product added to cart successfully!');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFromWishlist = async (item) => {
    try {
      const actionKey = `${item._id}_${item.wishlistModelId || 'default'}`;
      setActionLoading(actionKey);

      const variant = {
        modelId: item.wishlistModelId || undefined,
        color: item.wishlistColor || undefined,
        size: item.wishlistSize || undefined,
      };

      const response = await wishlistService.removeFromWishlists(item._id, variant);
      if (response.success) {
        message.success('Removed from wishlist');
        // Update local state
        setWishlists((prev) =>
          prev.filter(
            (p) =>
              !(
                p._id === item._id &&
                (p.wishlistModelId || 'default') === (item.wishlistModelId || 'default')
              )
          )
        );
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to remove from wishlist');
    } finally {
      setActionLoading(null);
    }
  };

  // Table columns configuration
  const columns = [
    {
      title: 'PRODUCTS',
      dataIndex: 'name',
      key: 'name',
      width: '50%',
      render: (text, record) => (
        <div className={styles.productRow}>
          <div
            className={styles.productImage}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/product/${record._id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/product/${record._id}`);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={record.images?.[0] || record.image || 'https://via.placeholder.com/100'}
              alt={text}
              className={styles.productImg}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/100';
              }}
            />
          </div>
          <div className={styles.productInfo}>
            <h6 className={styles.productName}>{text}</h6>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Variant: {record.wishlistColor || 'Default'} / {record.wishlistSize || 'Default'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'PRICE',
      dataIndex: 'price',
      key: 'price',
      width: '15%',
      render: (price, record) => (
        <div className={styles.priceColumn}>
          {record.originalPrice && Number(record.originalPrice) > Number(price || 0) && (
            <span className={styles.originalPrice}>{formatCurrency(record.originalPrice)}</span>
          )}
          <span className={styles.currentPrice}>{formatCurrency(price)}</span>
        </div>
      ),
    },
    {
      title: 'STOCK STATUS',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (_, record) => {
        const inStock = Number(record.stock || 0) > 0;
        return (
          <Badge
            status={inStock ? 'success' : 'error'}
            text={
              <span className={inStock ? styles.textSuccess : styles.textDanger}>
                {inStock ? 'IN STOCK' : 'OUT OF STOCK'}
              </span>
            }
          />
        );
      },
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: '20%',
      render: (_, record) => {
        const inStock = Number(record.stock || 0) > 0;
        const actionKey = `${record._id}_${record.wishlistModelId || 'default'}`;
        const isLoading = actionLoading === actionKey;

        return (
          <Space size="small">
            <Tooltip title={inStock ? 'Add to Cart' : 'Out of Stock'}>
              <Button
                type="primary"
                icon={isLoading ? <LoadingOutlined /> : <ShoppingCartOutlined />}
                onClick={() => handleAddToCart(record)}
                disabled={!inStock || isLoading}
                loading={isLoading}
                className={styles.addToCartBtn}
              >
                ADD TO CART
              </Button>
            </Tooltip>
            <Tooltip title="Remove from Wishlist">
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveFromWishlist(record)}
                disabled={isLoading}
                className={styles.removeBtn}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles.wishlistPage}>
      <div className={styles.wishlistContainer}>
        {/* Header Section */}
        <div className={styles.wishlistHeader}>
          <div className={styles.backButtonGroup}>
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
              className={styles.backButton}
            />
            <span className={styles.backText}>Back</span>
          </div>
          <Title level={1} className={styles.wishlistTitle}>
            Wishlist
          </Title>
        </div>

        {/* Loading State */}
        {loading ? (
          <Card className={styles.wishlistCard}>
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" tip="Loading wishlist..." />
            </div>
          </Card>
        ) : wishlists.length > 0 ? (
          <Card className={styles.wishlistCard}>
            <Table
              columns={columns}
              dataSource={wishlists.map((item) => ({
                ...item,
                key: `${item._id}_${item.wishlistModelId || 'default'}`,
              }))}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} items`,
                style: { marginTop: '20px' },
              }}
              scroll={{ x: 1000 }}
              className={styles.wishlistTable}
            />
          </Card>
        ) : (
          <Card className={styles.emptyCard}>
            <Empty
              description="Your Wishlist is Empty"
              style={{ paddingTop: '40px', paddingBottom: '40px' }}
            >
              <Button type="primary" size="large" onClick={() => navigate('/products')}>
                Continue Shopping
              </Button>
            </Empty>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
