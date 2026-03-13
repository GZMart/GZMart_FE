import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ChevronLeft, ChevronRight, Ticket, Bookmark, BookmarkCheck } from 'lucide-react';
import ProductCard from '../../components/common/ProductCard';
import ShopInfoCard from '../../components/common/ShopInfoCard';
import Pagination from '../../components/common/Pagination';
import { productService, followService } from '../../services/api';
import voucherService from '../../services/api/voucherService';
import promotionBuyerService from '../../services/api/promotionBuyerService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import styles from '../../assets/styles/ShopProfilePage.module.css';

const normalizeProduct = (p) => {
  const activeModel = p.models?.find((m) => m.isActive) || p.models?.[0] || {};
  return {
    ...p,
    id: p._id || p.id,
    image: p.images?.[0] || p.tiers?.[0]?.images?.[0] || activeModel.image || '',
    price: activeModel.price || p.price || 0,
    originalPrice: activeModel.originalPrice || p.originalPrice || 0,
  };
};

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
  const [vouchers, setVouchers] = useState([]);
  const [activeVoucherFilter, setActiveVoucherFilter] = useState(null);
  const voucherScrollRef = useRef(null);
  const productsSectionRef = useRef(null);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchShopData();
  }, [id, pagination.page]);

  useEffect(() => {
    if (isAuthenticated && id) {
      checkFollowStatus();
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (id) {
      fetchShopVouchers();
    }
  }, [id]);

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

      setSeller((prev) => ({
        ...prev,
        followerCount: isNowFollowing
          ? (prev.followerCount || 0) + 1
          : Math.max(0, (prev.followerCount || 1) - 1),
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
        limit: pagination.limit,
      });

      const responseData = response.data?.data || response.data || response;
      if (responseData) {
        setSeller(responseData.seller);
        const transformedProducts = (responseData.products || []).map(normalizeProduct);
        setProducts(transformedProducts);

        // Fetch promotions for all visible products
        const productIds = transformedProducts.map((p) => p.id).filter(Boolean);
        if (productIds.length > 0) {
          try {
            const promoResponse = await promotionBuyerService.getProductPromotionsBatch(productIds);
            const promoMap = promoResponse?.data?.data || promoResponse?.data || promoResponse;
            if (promoMap && typeof promoMap === 'object') {
              setProducts((prev) =>
                prev.map((p) => {
                  const promo = promoMap[p.id];
                  if (!promo) {
                    return p;
                  }

                  const updated = { ...p };

                  // Shop program price override
                  if (
                    promo.shopProgram &&
                    promo.shopProgram.salePrice < promo.shopProgram.originalPrice
                  ) {
                    updated.price = promo.shopProgram.salePrice;
                    updated.originalPrice = promo.shopProgram.originalPrice;
                    updated.promotionType = 'shopProgram';
                  }

                  // Combo promotion info
                  if (promo.comboPromotions && promo.comboPromotions.length > 0) {
                    const combo = promo.comboPromotions[0];
                    const bestTier = combo.tiers?.reduce(
                      (best, t) => (t.value > (best?.value || 0) ? t : best),
                      null
                    );
                    updated.comboPromotion = {
                      name: combo.name,
                      comboType: combo.comboType,
                      bestDiscount: bestTier?.value || 0,
                    };
                  }

                  return updated;
                })
              );
            }
          } catch (promoErr) {
            console.error('Error fetching batch promotions:', promoErr);
          }
        }

        // Match the pagination structure from the backend
        const pageData = response.data?.pagination || response.pagination;
        if (pageData) {
          setPagination((prev) => ({
            ...prev,
            total: pageData.total || 0,
            pages: pageData.pages || 0,
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
      setPagination((prev) => ({ ...prev, page: newPage }));
      window.scrollTo(0, 0);
    }
  };

  const fetchShopVouchers = async () => {
    try {
      const res = await voucherService.getShopVouchers(id);
      setVouchers(res.data?.data || res.data || []);
    } catch {
      // Silent fail - vouchers are optional
    }
  };

  const handleSaveVoucher = async (voucherId) => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để lưu voucher');
      navigate('/login');
      return;
    }
    try {
      const voucher = vouchers.find((v) => v._id === voucherId);
      if (voucher?.isSaved) {
        await voucherService.unsaveVoucher(voucherId);
        setVouchers((prev) =>
          prev.map((v) => (v._id === voucherId ? { ...v, isSaved: false } : v))
        );
        toast.success('Đã bỏ lưu voucher');
        if (activeVoucherFilter?._id === voucherId) {
          setActiveVoucherFilter(null);
        }
      } else {
        await voucherService.saveVoucher(voucherId);
        setVouchers((prev) => prev.map((v) => (v._id === voucherId ? { ...v, isSaved: true } : v)));
        toast.success('Đã lưu voucher!');
      }
    } catch {
      toast.error('Không thể lưu voucher');
    }
  };

  const handleUseVoucher = (voucher) => {
    setActiveVoucherFilter(voucher);
    setActiveTab('ALL');
    setPagination((prev) => ({ ...prev, page: 1 }));

    // Slight delay to ensure tab switch before scrolling
    setTimeout(() => {
      productsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const scrollVouchers = (direction) => {
    if (voucherScrollRef.current) {
      const scrollAmount = 260;
      voucherScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
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
          {seller.profileImage && (
            <div className={styles.shopBanner}>
              <img
                src={seller.profileImage}
                alt={`${seller.fullName} shop banner`}
                className={styles.shopBannerImg}
              />
            </div>
          )}
          <ShopInfoCard
            seller={seller}
            showViewShop={false}
            isFollowing={isFollowing}
            onToggleFollow={handleToggleFollow}
          />
        </Container>
      </div>

      {/* Voucher Carousel */}
      {vouchers.length > 0 && (
        <div className={styles.voucherSection}>
          <Container>
            <div className={styles.voucherHeader}>
              <div className={styles.voucherTitle}>
                <Ticket size={20} />
                <span>Shop Vouchers</span>
              </div>
            </div>
            <div className={styles.voucherCarouselWrapper}>
              <button
                className={`${styles.voucherArrow} ${styles.voucherArrowLeft}`}
                onClick={() => scrollVouchers('left')}
              >
                <ChevronLeft size={20} />
              </button>
              <div className={styles.voucherCarousel} ref={voucherScrollRef}>
                {vouchers.map((v) => {
                  const usagePercent =
                    v.usageLimit > 0 ? Math.round((v.usageCount / v.usageLimit) * 100) : 0;
                  const endDate = new Date(v.endTime);
                  const formattedEnd = `${String(endDate.getDate()).padStart(2, '0')}.${String(endDate.getMonth() + 1).padStart(2, '0')}.${endDate.getFullYear()}`;
                  return (
                    <div key={v._id} className={styles.voucherCard}>
                      <div className={styles.voucherLeft}>
                        <div className={styles.voucherDiscount}>
                          {v.discountType === 'percent'
                            ? `${v.discountValue}% Off`
                            : `${formatCurrency(v.discountValue)} Off`}
                        </div>
                        <div className={styles.voucherCondition}>
                          Min. Order {formatCurrency(v.minBasketPrice)}
                          {v.maxDiscountAmount && ` | Max ${formatCurrency(v.maxDiscountAmount)}`}
                        </div>
                      </div>
                      <div className={styles.voucherRight}>
                        {v.isSaved ? (
                          <button
                            className={styles.useVoucherBtn}
                            onClick={() => handleUseVoucher(v)}
                          >
                            Use
                          </button>
                        ) : (
                          <button
                            className={`${styles.voucherSaveBtn}`}
                            onClick={() => handleSaveVoucher(v._id)}
                            title="Save voucher"
                          >
                            <Bookmark size={18} />
                          </button>
                        )}
                      </div>
                      <div className={styles.voucherFooter}>
                        <div className={styles.voucherUsageBar}>
                          <div
                            className={styles.voucherUsageFill}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                        <span className={styles.voucherUsageText}>{usagePercent}% used</span>
                        <span className={styles.voucherExpiry}>Exp: {formattedEnd}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                className={`${styles.voucherArrow} ${styles.voucherArrowRight}`}
                onClick={() => scrollVouchers('right')}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </Container>
        </div>
      )}

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
          {activeVoucherFilter && (
            <div className={styles.activeFilterBanner}>
              <div>
                <Ticket size={16} />
                <span>
                  Đang lọc sản phẩm cho voucher:
                  <strong>
                    {' '}
                    {activeVoucherFilter.discountType === 'percent'
                      ? `${activeVoucherFilter.discountValue}%`
                      : formatCurrency(activeVoucherFilter.discountValue)}{' '}
                    Giảm
                  </strong>
                </span>
                <span className={styles.filterCondition}>
                  {' '}
                  (Đơn Tối Thiểu {formatCurrency(activeVoucherFilter.minBasketPrice)})
                </span>
              </div>
              <button
                className={styles.clearFilterBtn}
                onClick={() => setActiveVoucherFilter(null)}
              >
                Xóa Bộ Lọc
              </button>
            </div>
          )}

          <div ref={productsSectionRef}>
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
                      <h3 className={styles.sectionTitle}>
                        {t('product_details.suggested_for_you', 'GỢI Ý CHO BẠN')}
                      </h3>
                      <button className={styles.viewAllBtn}>
                        Xem Tất Cả <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                    <Row className="g-3">
                      {products.slice(0, 6).map((product) => (
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
                        <button className={styles.viewAllBtn}>
                          Xem Tất Cả <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>
                      <Row className="g-3">
                        {products.slice(6, 12).map((product) => (
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
                        <button className={styles.viewAllBtn}>
                          Xem Tất Cả <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>
                      <Row className="g-3">
                        {products.slice(12, 18).map((product) => (
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
                    <h3 className={styles.sectionTitle}>
                      {t('product_details.tab_all_products', 'TẤT CẢ SẢN PHẨM')}
                    </h3>
                  </div>
                  <Row className="g-3">
                    {products
                      .filter(
                        (p) => !activeVoucherFilter || p.price >= activeVoucherFilter.minBasketPrice
                      )
                      .map((product) => (
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
          </div>
        </Container>
      </div>
    </>
  );
};

export default ShopProfilePage;
