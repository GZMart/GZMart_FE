import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import ProductCard from '../../components/common/ProductCard';
import Pagination from '../../components/common/Pagination';
import { productService } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import styles from '../../assets/styles/ShopProfilePage.module.css';

const ShopProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchShopData();
  }, [id, pagination.page]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await productService.getProductsBySeller(id, {
        page: pagination.page,
        limit: pagination.limit
      });
      
      const responseData = response.data?.data || response.data || response;
      if (responseData) {
        setSeller(responseData.seller);
        setProducts(responseData.products || []);
        
        // Match the pagination structure from the backend
        const pageData = response.data?.pagination || response.pagination;
        if (pageData) {
          setPagination(prev => ({
            ...prev,
            total: pageData.total || 0,
            pages: pageData.pages || 0
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching shop data:', err);
      setError(err.response?.data?.message || 'Failed to load shop profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo(0, 0);
    }
  };

  if (loading && !seller) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
      </Container>
    );
  }

  if (error || !seller) {
    return (
      <Container className="py-5 text-center">
        <h2>{error || 'Shop not found'}</h2>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/products')}>
          Go to Shop
        </button>
      </Container>
    );
  }

  return (
    <div className={styles.shopProfilePage}>
      {/* Shop Banner / Header */}
      <div className={styles.shopHeader}>
        <Container>
          <div className={styles.shopInfoCard}>
            <div className={styles.shopAvatar}>
              <img src={seller.avatar || 'https://via.placeholder.com/100'} alt={seller.fullName} />
            </div>
            <div className={styles.shopDetails}>
              <h1 className={styles.shopName}>{seller.fullName}</h1>
              <div className={styles.shopMeta}>
                <span><i className="bi bi-geo-alt-fill"></i> {seller.provinceName || 'Not specified'}</span>
                <span><i className="bi bi-calendar-check-fill"></i> Joined: {formatDate(seller.createdAt)}</span>
                <span><i className="bi bi-box-seam-fill"></i> Products: {pagination.total}</span>
              </div>
              {seller.aboutMe && (
                <p className={styles.shopDescription}>{seller.aboutMe}</p>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* Shop Products */}
      <Container className={styles.productsSection}>
        <div className={styles.sectionTitle}>
          <h3>All Products</h3>
        </div>
        
        {loading && products.length > 0 ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <Row className="g-4">
              {products.map(product => (
                <Col key={product.id || product._id} xs={6} md={4} lg={3}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
            
            {pagination.pages > 1 && (
              <div className="mt-5 d-flex justify-content-center">
                <Pagination 
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-5">
            <h4>This shop doesn't have any active products yet.</h4>
          </div>
        )}
      </Container>
    </div>
  );
};

export default ShopProfilePage;
