import React from 'react';
import { Card, Button } from 'react-bootstrap';
import styles from '@assets/styles/seller/VoucherCreate.module.css';

const VoucherPreview = ({ voucherType, formData }) => (
  <div className={styles.previewWrapper}>
    <Card className={styles.previewCard}>
      {/* Fake Phone UI */}
      <div
        style={{
          background: '#fff',
          borderRadius: '16px 16px 0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: '2px',
          zIndex: 0,
        }}
      ></div>

      <div style={{ position: 'relative', zIndex: 5, height: '100%' }}>
        {/* Status Bar */}
        <div
          className="d-flex justify-content-between px-4 pt-3 pb-2 small text-dark fw-bold"
          style={{ fontSize: '11px' }}
        >
          <span>14:30</span>
          <div className="d-flex gap-1">
            <i className="bi bi-wifi"></i>
            <i className="bi bi-battery-full"></i>
          </div>
        </div>

        <div className={styles.previewHeader}>
          <i className="bi bi-chevron-left position-absolute start-0 ms-3"></i>
          {voucherType === 'product'
            ? 'Product'
            : voucherType === 'private'
              ? 'Private'
              : voucherType === 'live'
                ? 'Live'
                : voucherType === 'video'
                  ? 'Video'
                  : voucherType === 'new_buyer'
                    ? 'New Buyer'
                    : voucherType === 'repeat_buyer'
                      ? 'Repeat Buyer'
                      : voucherType === 'follower'
                        ? 'Follower'
                        : 'Shop'}{' '}
          Voucher
          <i className="bi bi-three-dots position-absolute end-0 me-3"></i>
        </div>

        {voucherType === 'live' ? (
          /* LIVE PREVIEW MODE */
          <div className={styles.livePreviewContainer}>
            <div className={styles.liveHeader}>
              <div className={styles.liveShopInfo}>
                <div className={styles.liveAvatar}>GZ</div>
                <div className={styles.liveShopName}>GZMart Official</div>
                <div className={styles.liveFollowBtn}>+ Follow</div>
              </div>
              <div className={styles.liveCloseBtn}>
                <i className="bi bi-x-lg"></i>
              </div>
            </div>

            <div className={styles.liveBottomSheet}>
              <div className={styles.sheetHeader}>
                <div className="d-flex align-items-center">Showing Products (17)</div>
                <div className={styles.bagBadge}>
                  <i className="bi bi-handbag-fill"></i>
                  <span className={styles.bagBadgeCount}>3</span>
                </div>
              </div>

              {/* Live Voucher Card */}
              <div className={styles.liveVoucherCard}>
                <div className={styles.liveVoucherLeft}>
                  <span className={styles.liveVoucherTitle}>
                    {formData.discountType === 'percent'
                      ? `${formData.discountValue || '0'}% OFF`
                      : `₫${parseInt(formData.discountValue || 0).toLocaleString()} OFF`}
                  </span>
                  <span className={styles.liveVoucherSub}>
                    Min. Spend ₫{parseInt(formData.minBasketPrice || 0).toLocaleString()}
                  </span>
                </div>
                <button className={styles.liveVoucherBtn}>Claim</button>
              </div>

              {/* Fake Product List Item */}
              <div className="d-flex mt-3 border-top pt-2">
                <div
                  style={{
                    width: 60,
                    height: 60,
                    background: '#f5f5f5',
                    borderRadius: 4,
                    marginRight: 10,
                  }}
                ></div>
                <div>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>Cotton T-Shirt Premium</div>
                  <div style={{ color: '#ee4d2d', fontWeight: 600 }}>₫150.000</div>
                </div>
              </div>
            </div>
          </div>
        ) : voucherType === 'video' ? (
          /* VIDEO PREVIEW MODE */
          <div className={styles.videoPreviewContainer}>
            <div className={styles.videoPlaceholder}>VIDEO</div>
            <div className={styles.videoOverlay}>
              <div className={styles.videoRightSidebar}>
                <div className={styles.videoActionBtn}>
                  <i
                    className={`bi bi-heart-fill ${styles.videoIcon}`}
                    style={{ color: 'white' }}
                  ></i>
                  <span className={styles.videoLabel}>1.2K</span>
                </div>
                <div className={styles.videoActionBtn}>
                  <i
                    className={`bi bi-chat-dots-fill ${styles.videoIcon}`}
                    style={{ color: 'white' }}
                  ></i>
                  <span className={styles.videoLabel}>342</span>
                </div>
                <div className={styles.videoActionBtn}>
                  <i
                    className={`bi bi-share-fill ${styles.videoIcon}`}
                    style={{ color: 'white' }}
                  ></i>
                  <span className={styles.videoLabel}>Share</span>
                </div>
              </div>

              <div className={styles.videoBottomInfo}>
                <div className={styles.videoAccountName}>@gzmart.official</div>
                <div className={styles.videoCaption}>
                  Introducing our new summer collection! ☀️ #fashion #summer #sale
                </div>
              </div>

              {/* Voucher Popup */}
              <div className={styles.videoVoucherPopup}>
                <div className={styles.videoVoucherIcon}>%</div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 11, fontWeight: 'bold' }}>
                    {formData.discountType === 'percent'
                      ? `${formData.discountValue || '0'}% OFF`
                      : `₫${parseInt(formData.discountValue || 0).toLocaleString()} OFF`}
                  </div>
                  <div style={{ fontSize: 9, color: '#555' }}>
                    Min. Spend ₫{parseInt(formData.minBasketPrice || 0).toLocaleString()}
                  </div>
                </div>
                <Button size="sm" variant="danger" style={{ fontSize: 10, padding: '2px 8px' }}>
                  Claim
                </Button>
              </div>

              {/* Product Anchor */}
              <div className={styles.videoProductAnchor}>
                <i className="bi bi-bag-check-fill text-warning"></i>
                <span className={styles.videoAnchorText}>Summer T-Shirt Video Exclusive</span>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD PREVIEW MODE */
          <div className={styles.previewBody}>
            {/* Mock Shop Header */}
            <div className="d-flex align-items-center mb-3 p-3 bg-white rounded shadow-sm">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#ff6b35',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}
              >
                GZ
              </div>
              <div className="ms-2">
                <div className="fw-bold small text-dark">GZMart Official</div>
                <div className="text-muted" style={{ fontSize: '10px' }}>
                  <span className="text-success">●</span> Online
                </div>
              </div>
              <Button
                size="sm"
                variant="outline-danger"
                className="ms-auto px-2 py-0"
                style={{ fontSize: '10px', height: '24px' }}
              >
                + Follow
              </Button>
            </div>

            {/* Voucher Preview */}
            <div className="small text-muted mb-2 ps-1">Voucher Preview</div>

            <div className={styles.mockVoucher}>
              <div className={styles.mockVoucherLeft}>
                <div className={styles.mockLogo}>
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: '#1890ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '10px',
                    }}
                  >
                    GZ
                  </div>
                </div>
                <div style={{ fontSize: '9px', color: '#1890ff', fontWeight: 'bold' }}>
                  {voucherType === 'product'
                    ? 'Product'
                    : voucherType === 'private'
                      ? 'Private'
                      : voucherType === 'new_buyer'
                        ? 'New Buyer'
                        : voucherType === 'repeat_buyer'
                          ? 'Repeat Buyer'
                          : voucherType === 'follower'
                            ? 'Follower'
                            : 'Shop'}{' '}
                  Voucher
                </div>
              </div>
              <div className={styles.mockVoucherRight}>
                <div className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>
                  {formData.discountType === 'percent'
                    ? `${formData.discountValue || '0'}% OFF`
                    : `₫${parseInt(formData.discountValue || 0).toLocaleString()} OFF`}
                </div>
                <div className="text-secondary mb-2" style={{ fontSize: '11px' }}>
                  Min. Spend ₫{parseInt(formData.minBasketPrice || 0).toLocaleString()}
                </div>
                <div className="d-flex justify-content-between align-items-end w-100 mt-auto">
                  <div className="text-muted" style={{ fontSize: '9px' }}>
                    Exp:{' '}
                    {formData.endTime ? new Date(formData.endTime).toLocaleDateString() : '31 Dec'}
                  </div>
                  <button className={styles.mockBtn}>Use Now</button>
                </div>
              </div>
            </div>

            {/* Filler Content */}
            <div className="mt-4 opacity-25">
              <div
                className="bg-secondary rounded mb-2"
                style={{ height: '150px', width: '100%' }}
              ></div>
              <div
                className="bg-secondary rounded mb-2"
                style={{ height: '20px', width: '60%' }}
              ></div>
              <div
                className="bg-secondary rounded mb-2"
                style={{ height: '20px', width: '40%' }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </Card>
  </div>
);

export default VoucherPreview;
