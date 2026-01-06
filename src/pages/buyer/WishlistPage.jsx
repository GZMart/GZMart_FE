import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Empty, Card, Row, Col, Badge, Typography, Tooltip } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, LeftOutlined } from '@ant-design/icons';
import { BUYER_ROUTES } from '@constants/routes';
import '../../assets/styles/buyer/WishlistPage.css';

// Mock data for wishlist
const mockWishlistData = [
  {
    id: 1,
    name: 'Bose Sport Earbuds - Wireless Earphones',
    image: 'https://th.bing.com/th/id/R.70d4bc8f6ca0ccc05ea690a86c1ae0cd?rik=MMNgedBhzflP6w&pid=ImgRaw&r=0',
    originalPrice: 1299,
    price: 999,
    stockStatus: 'IN STOCK',
    inStock: true,
  },
  {
    id: 2,
    name: 'Simple Mobile 5G LTE Galaxy 12 Mini 512GB Gaming Phone',
    image: 'https://buketomnisportpweb.s3.us-east-2.amazonaws.com/products-images/8XMSx4CdEAmT7tyXCZtVljXUlCkB5cY4mf3K9yDI.jpeg',
    originalPrice: null,
    price: 2300.0,
    stockStatus: 'IN STOCK',
    inStock: true,
  },
  {
    id: 3,
    name: 'Portable Washing Machine, 11lbs capacity Model 18NMFIAM',
    image: 'https://www.caterkwik.ie/wp-content/uploads/2017/05/Large-Capacity-Washing-Machine.jpg',
    originalPrice: null,
    price: 70.0,
    stockStatus: 'IN STOCK',
    inStock: true,
  },
  {
    id: 4,
    name: 'TOZO T6 True Wireless Earbuds Bluetooth Headphones',
    image: 'https://ueeshop.ly200-cdn.com/u_file/UPAX/UPAX632/2304/products/20/b7f6b16b9e.jpg',
    originalPrice: 250.0,
    price: 220.0,
    stockStatus: 'OUT OF STOCK',
    inStock: false,
  },
  {
    id: 5,
    name: 'Wyze Cam Pan v2 1080p Pan/Tilt/Zoom Wi-Fi Indoor Smart Home Camera',
    image: 'https://tse4.mm.bing.net/th/id/OIP.jtlEvbXGoHKEGsTDHS3ewwHaG7?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3',
    originalPrice: null,
    price: 1499.99,
    stockStatus: 'IN STOCK',
    inStock: true,
  },
];

const WishlistPage = () => {
  const navigate = useNavigate();
  const { Title } = Typography;

  const handleAddToCart = (productId) => {
    console.log('Added to cart:', productId);
    // TODO: Implement add to cart functionality
  };

  const handleRemoveFromWishlist = (productId) => {
    console.log('Removed from wishlist:', productId);
    // TODO: Implement remove from wishlist functionality
  };

  // Table columns configuration
  const columns = [
    {
      title: 'PRODUCTS',
      dataIndex: 'name',
      key: 'name',
      width: '50%',
      render: (text, record) => (
        <div className="product-row">
          <div className="product-image">
            {record.image.startsWith('http') ? (
              <img src={record.image} alt={text} className="product-img" />
            ) : (
              <span className="image-emoji">{record.image}</span>
            )}
          </div>
          <div className="product-info">
            <h6 className="product-name">{text}</h6>
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
        <div className="price-column">
          {record.originalPrice && (
            <span className="original-price">${record.originalPrice}</span>
          )}
          <span className="current-price">${price.toFixed(2)}</span>
        </div>
      ),
    },
    {
      title: 'STOCK STATUS',
      dataIndex: 'stockStatus',
      key: 'stockStatus',
      width: '15%',
      render: (status, record) => (
        <Badge 
          status={record.inStock ? 'success' : 'error'} 
          text={<span className={record.inStock ? 'text-success' : 'text-danger'}>{status}</span>}
        />
      ),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: '20%',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={record.inStock ? 'Add to Cart' : 'Out of Stock'}>
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={() => handleAddToCart(record.id)}
              disabled={!record.inStock}
              className="add-to-cart-btn"
            >
              ADD TO CART
            </Button>
          </Tooltip>
          <Tooltip title="Remove from Wishlist">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveFromWishlist(record.id)}
              className="remove-btn"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        {/* Header Section */}
        <div className="wishlist-header">
          <div className="back-button-group">
            <Button 
              type="text" 
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
              className="back-button"
            />
            <span className="back-text">Back</span>
          </div>
          <Title level={1} className="wishlist-title">
            Wishlist
          </Title>
        </div>

        {/* Wishlist Content */}
        {mockWishlistData.length > 0 ? (
          <Card className="wishlist-card">
            <Table
              columns={columns}
              dataSource={mockWishlistData.map(item => ({...item, key: item.id}))}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} items`,
                style: { marginTop: '20px' }
              }}
              scroll={{ x: 1000 }}
              className="wishlist-table"
            />
          </Card>
        ) : (
          <Card className="empty-card">
            <Empty
              description="Your Wishlist is Empty"
              style={{ paddingTop: '40px', paddingBottom: '40px' }}
            >
              <Button 
                type="primary"
                size="large"
                onClick={() => navigate('/shop')}
              >
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
