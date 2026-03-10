import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ProductCard from '../../components/common/ProductCard';
import ShopInfoCard from '../../components/common/ShopInfoCard';
import Pagination from '../../components/common/Pagination';
import { productService, followService } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import styles from '../../assets/styles/ShopProfilePage.module.css';

const ShopProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [isFollowing, setIsFollowing] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchShopData();
  }, [id, pagination.page]);

  useEffect(() => {
    if (isAuthenticated && id) {
      checkFollowStatus();
    }
  }, [id, isAuthenticated]);

  const checkFollowStatus = async () => {
    try {
      const res = await followService.checkFollowStatus(id);
      // `res` is the response data body: { success: true, data: { isFollowing: true } }
      setIsFollowing(res.data?.isFollowing || false);
    } catch (error) {
      console.error('Failed to check follow status:', error);
    }
  };

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để theo dõi shop');
      navigate('/login');
      return;
    }
    
    try {
      const res = await followService.toggleFollow(id);
      const isNowFollowing = res.data?.isFollowing;
      setIsFollowing(isNowFollowing);
      
      setSeller(prev => ({
        ...prev,
        followerCount: isNowFollowing 
          ? (prev.followerCount || 0) + 1 
          : Math.max(0, (prev.followerCount || 1) - 1)
      }));
      
      toast.success(res.message || (isNowFollowing ? 'Đã theo dõi' : 'Đã bỏ theo dõi'));
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

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
    <>
      <div>
        <Container className="mt-4 mb-3">
          <ShopInfoCard 
            seller={seller} 
            showViewShop={false} 
            isFollowing={isFollowing}
            onToggleFollow={handleToggleFollow}
          />
        </Container>
      </div>
      
      <div className={styles.shopProfilePage}>
        <div className={styles.tabsContainer}>
          <Container>
            <div className={styles.shopTabs}>
              <button 
                className={`${styles.tabItem} ${activeTab === 'HOME' ? styles.active : ''}`}
                onClick={() => setActiveTab('HOME')}
              >
                {t('product_details.tab_home', 'Dạo')}
              </button>
              <button 
                className={`${styles.tabItem} ${activeTab === 'ALL' ? styles.active : ''}`}
                onClick={() => setActiveTab('ALL')}
              >
                {t('product_details.tab_all_products', 'TẤT CẢ SẢN PHẨM')}
              </button>
              {/* Other pseudo-categories */}
              <button className={styles.tabItem}>Áo Nỉ</button>
              <button className={styles.tabItem}>Quần Đùi/Quần Short</button>
              <button className={styles.tabItem}>Áo hoodies</button>
            </div>
          </Container>
        </div>

        <Container>
          {loading && products.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : products.length > 0 ? (
            activeTab === 'HOME' ? (
              <>
                {/* 1. Gợi Ý Cho Bạn Section */}
                <div className={styles.productsSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>{t('product_details.suggested_for_you', 'GỢI Ý CHO BẠN')}</h3>
                    <button className={styles.viewAllBtn}>Xem Tất Cả <i className="bi bi-chevron-right"></i></button>
                  </div>
                  <Row className="g-3">
                    {products.slice(0, 6).map(product => (
                      <Col key={product.id || product._id} xs={6} md={4} lg={2}>
                        <ProductCard product={product} />
                      </Col>
                    ))}
                  </Row>
                </div>

                {/* 2. Ưu Đãi Khủng Section */}
                {products.length > 6 && (
                  <div className={styles.productsSection}>
                    <div className={styles.sectionHeader}>
                      <h3 className={`${styles.sectionTitle} ${styles.fire}`}>
                        <i className="bi bi-fire"></i> ƯU ĐÃI KHỦNG
                      </h3>
                      <button className={styles.viewAllBtn}>Xem Tất Cả <i className="bi bi-chevron-right"></i></button>
                    </div>
                    <Row className="g-3">
                      {products.slice(6, 12).map(product => (
                        <Col key={product.id || product._id} xs={6} md={4} lg={2}>
                          <ProductCard product={product} />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

                {/* 3. Sản Phẩm Bán Chạy Section */}
                {products.length > 12 && (
                  <div className={styles.productsSection}>
                    <div className={styles.sectionHeader}>
                      <h3 className={styles.sectionTitle}>SẢN PHẨM BÁN CHẠY</h3>
                      <button className={styles.viewAllBtn}>Xem Tất Cả <i className="bi bi-chevron-right"></i></button>
                    </div>
                    <Row className="g-3">
                      {products.slice(12, 18).map(product => (
                        <Col key={product.id || product._id} xs={6} md={4} lg={2}>
                          <ProductCard product={product} />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </>
            ) : (
              /* ALL PRODUCTS TAB */
              <div className={styles.productsSection}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>{t('product_details.tab_all_products', 'TẤT CẢ SẢN PHẨM')}</h3>
                </div>
                <Row className="g-3">
                  {products.map(product => (
                    <Col key={product.id || product._id} xs={6} md={4} lg={2}>
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
              </div>
            )
          ) : (
            <div className="text-center py-5">
              <h4>{t('product_details.no_products', 'Shop chưa có sản phẩm nào.')}</h4>
            </div>
          )}
        </Container>
      </div>
    </>
  );
};

export default ShopProfilePage;
