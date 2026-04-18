/**
 * HomepagePreviewModal
 *
 * Xem thử banner quảng cáo của seller trên giao diện homepage mock.
 * Hiển thị banner với hotspot dots overlay — giống như khi banner live trên trang chủ.
 */

import { Modal } from 'antd';
import { EyeOutlined, ThunderboltOutlined, AimOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import styles from './HomepagePreviewModal.module.css';

const HomepagePreviewModal = ({ open, onClose, banner = {} }) => {
  const { title, subtitle, image, hotspots = [] } = banner;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ maxWidth: 1200, top: 20 }}
      title={
        <div className={styles.modalTitle}>
          <EyeOutlined style={{ color: '#1677ff' }} />
          <span>Xem Thử Trên Trang Chủ</span>
          <span className={styles.previewBadge}>Bản xem thử</span>
        </div>
      }
      styles={{ body: { padding: 0 }, header: { padding: '16px 24px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #fef2f2 0%, #fff 100%)' } }}
      destroyOnHidden
    >
      <div className={styles.notice}>
        <ExclamationCircleOutlined style={{ color: '#f97316' }} />
        <span>
          Đây là <strong>bản xem thử</strong>. Banner thật sẽ xuất hiện trong carousel trang chủ
          sau khi được Admin duyệt và đến ngày bắt đầu.
        </span>
      </div>

      {/* Mock browser */}
      <div className={styles.browser}>
        <div className={styles.browserBar}>
          <div className={styles.browserDots}>
            <span style={{ background: '#ff5f56' }} />
            <span style={{ background: '#ffbd2e' }} />
            <span style={{ background: '#27c93f' }} />
          </div>
          <div className={styles.browserURL}>
            <span>🔒</span>
            <span>gzmart.com</span>
          </div>
          <div />
        </div>

        {/* Mock homepage */}
        <div className={styles.homepage}>
          {/* Fake nav */}
          <div className={styles.fakeNav}>
            <div className={styles.fakeNavLogo}>
              🛒 <strong>GZMart</strong>
            </div>
            <div className={styles.fakeSearchBar}>
              <span className={styles.fakeSearchIcon}>🔍</span>
              <span>Tìm kiếm sản phẩm...</span>
            </div>
            <div className={styles.fakeNavRight}>
              <span>🛒</span>
              <span>👤</span>
            </div>
          </div>

          {/* Banner carousel area */}
          <div className={styles.bannerSection}>
            <div className={styles.carouselWrap}>
              {/* The actual banner */}
              <div className={styles.bannerFrame}>
                {image ? (
                  <div className={styles.bannerImgWrap}>
                    <img src={image} alt="Banner preview" className={styles.bannerImg} />

                    {/* Hotspot overlays */}
                    {hotspots.map((h, i) => (
                      <div
                        key={i}
                        className={styles.hotspot}
                        style={{
                          left: `${h.x}%`,
                          top: `${h.y}%`,
                          width: `${h.width}%`,
                          height: `${h.height}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        title={h.link || `Hotspot ${i + 1}`}
                      >
                        <div className={styles.hotspotPulseRing} />
                        <div className={styles.hotspotDot}>{i + 1}</div>
                        {h.link && (
                          <div className={styles.hotspotTooltip}>{h.link}</div>
                        )}
                      </div>
                    ))}

                    {/* Ad badge */}
                    <div className={styles.adBadge}>
                      <ThunderboltOutlined /> QUẢNG CÁO
                    </div>

                    {/* Text overlay */}
                    <div className={styles.textOverlay}>
                      {title && <div className={styles.bannerTitle}>{title}</div>}
                      {subtitle && <div className={styles.bannerSubtitle}>{subtitle}</div>}
                      <button className={styles.ctaBtn}>Xem ngay →</button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.bannerEmpty}>
                    <span>Chưa có ảnh — vui lòng upload ảnh ở Bước 1</span>
                  </div>
                )}
              </div>

              {/* Carousel dots */}
              <div className={styles.carouselDots}>
                <span className={styles.dotActive} />
                <span className={styles.dotInactive} />
                <span className={styles.dotInactive} />
              </div>
            </div>

            {/* Side thumbnail banners (decorative) */}
            <div className={styles.sideThumb}>
              <div className={styles.thumbItem} />
              <div className={styles.thumbItem} />
            </div>
          </div>

          {/* Hotspot legend */}
          {hotspots.length > 0 && (
            <div className={styles.hotspotLegend}>
              <div className={styles.hotspotLegendTitle}>
                <AimOutlined /> Vùng click hotspot:{' '}
              </div>
              {hotspots.map((h, i) => (
                <div key={i} className={styles.hotspotLegendItem}>
                  <span className={styles.hotspotLegendNum}>{i + 1}</span>
                  <span className={styles.hotspotLegendLink}>{h.link || '(chưa có link)'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Fake sections below */}
          <div className={styles.fakeSections}>
            <div className={styles.fakeSectionTitle} />
            <div className={styles.fakeProductGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.fakeProduct} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default HomepagePreviewModal;
