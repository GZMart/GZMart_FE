import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Table, Button, Space, Empty, Card, Badge, Typography, Tooltip, message, Spin } from 'antd';
import {
  DeleteOutlined,
  ShoppingCartOutlined,
  LeftOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { BUYER_ROUTES } from '@constants/routes';
import * as favouriteService from '@services/api/favouriteService';
import * as cartService from '@services/api/cartService';
import styles from '@assets/styles/buyer/WishlistPage.module.css';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { Title } = Typography;
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch favourites on component mount
  useEffect(() => {
    fetchFavourites();
  }, []);

  const fetchFavourites = async () => {
    try {
      setLoading(true);
      const response = await favouriteService.getFavourites();
      console.log('Favourites response:', response);

      // axiosClient đã unwrap response.data rồi, nên:
      // - response.success = backend response.data.success
      // - response.data = backend response.data.data
      if (response.success) {
        const products = response.data?.products || [];
        console.log('Favourites products:', products);
        setFavourites(products);
      } else {
        // Fallback: nếu response là data object trực tiếp
        const products = response.products || [];
        console.log('Favourites products (direct):', products);
        setFavourites(products);
      }
    } catch (error) {
      console.error('Error fetching favourites:', error);
      message.error(error.response?.data?.message || 'Failed to load favourites');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      setActionLoading(productId);
      await cartService.addToCart(productId, 1);
      message.success('Product added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      message.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      setActionLoading(productId);
      const response = await favouriteService.removeFromFavourites(productId);
      if (response.success) {
        message.success('Removed from favourites');
        // Update local state
        setFavourites((prev) => prev.filter((item) => item._id !== productId));
      }
    } catch (error) {
      console.error('Error removing from favourites:', error);
      message.error(error.response?.data?.message || 'Failed to remove from favourites');
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
          <div className={styles.productImage}>
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
          {record.originalPrice && record.originalPrice > price && (
            <span className={styles.originalPrice}>${record.originalPrice.toFixed(2)}</span>
          )}
          <span className={styles.currentPrice}>${price?.toFixed(2) || '0.00'}</span>
        </div>
      ),
    },
    {
      title: 'STOCK STATUS',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status, record) => {
        const inStock = status === 'active' && (record.stock > 0 || record.quantity > 0);
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
        const inStock = record.status === 'active' && (record.stock > 0 || record.quantity > 0);
        const isLoading = actionLoading === record._id;

        return (
          <Space size="small">
            <Tooltip title={inStock ? 'Add to Cart' : 'Out of Stock'}>
              <Button
                type="primary"
                icon={isLoading ? <LoadingOutlined /> : <ShoppingCartOutlined />}
                onClick={() => handleAddToCart(record._id)}
                disabled={!inStock || isLoading}
                loading={isLoading}
                className={styles.addToCartBtn}
              >
                ADD TO CART
              </Button>
            </Tooltip>
            <Tooltip title="Remove from Favourites">
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveFromWishlist(record._id)}
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
            Favourites
          </Title>
        </div>

        {/* Loading State */}
        {loading ? (
          <Card className={styles.wishlistCard}>
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" tip="Loading favourites..." />
            </div>
          </Card>
        ) : favourites.length > 0 ? (
          <Card className={styles.wishlistCard}>
            <Table
              columns={columns}
              dataSource={favourites.map((item) => ({ ...item, key: item._id }))}
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
              description="Your Favourites is Empty"
              style={{ paddingTop: '40px', paddingBottom: '40px' }}
            >
              <Button type="primary" size="large" onClick={() => navigate('/shop')}>
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
