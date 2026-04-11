import PropTypes from 'prop-types';
import { Drawer, Spin } from 'antd';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import styles from '@assets/styles/seller/Campaigns.module.css';

// Campaign type configuration for dynamic labels and icons
const CAMPAIGN_TYPE_CONFIG = {
  flash_sale: {
    label: 'Flash Sale',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    iconBg: 'linear-gradient(135deg, #ff4757 0%, #c0392b 100%)',
    iconShadow: '0 4px 12px rgba(255, 71, 87, 0.4)',
  },
  daily_deal: {
    label: 'Daily Deal',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    iconBg: 'linear-gradient(135deg, #ffa502 0%, #e67e22 100%)',
    iconShadow: '0 4px 12px rgba(255, 165, 2, 0.4)',
  },
  weekly_deal: {
    label: 'Weekly Deal',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    iconBg: 'linear-gradient(135deg, #2ed573 0%, #27ae60 100%)',
    iconShadow: '0 4px 12px rgba(46, 213, 115, 0.4)',
  },
  limited_time: {
    label: 'Limited Time',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    iconBg: 'linear-gradient(135deg, #1e90ff 0%, #2980b9 100%)',
    iconShadow: '0 4px 12px rgba(30, 144, 255, 0.4)',
  },
  clearance: {
    label: 'Clearance',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    iconBg: 'linear-gradient(135deg, #a55eea 0%, #8e44ad 100%)',
    iconShadow: '0 4px 12px rgba(165, 94, 234, 0.4)',
  },
  special: {
    label: 'Special',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    iconBg: 'linear-gradient(135deg, #ff6b81 0%, #ee5a70 100%)',
    iconShadow: '0 4px 12px rgba(255, 107, 129, 0.4)',
  },
};

const DEFAULT_TYPE = 'flash_sale';

/**
 * CampaignDrawer - Modal tạo/chỉnh sửa Campaign
 * @description Giao diện Drawer với 3 bước: Basic Info → Products Setup → Review
 * @design Dynamic UI based on campaign type
 */
const CampaignDrawer = ({
  open,
  onClose,
  currentStep,
  setCurrentStep,
  selectedCampaign,
  campaignInfo,
  setCampaignInfo,
  selectedProducts,
  variantConfigs,
  selectedVariantKeys,
  setSelectedVariantKeys,
  productSearchText,
  setProductSearchText,
  filteredProducts,
  variantTableData,
  productsLoading,
  onAddProduct,
  onRemoveProduct,
  onUpdateVariantConfig,
  onBulkUpdate,
  onRemoveVariant,
  onSubmit,
  loading,
}) => {
  // Xác định chế độ chỉnh sửa dựa trên việc có selectedCampaign hay không
  const isEditMode = !!selectedCampaign;

  // Get current type config for dynamic UI
  const currentType = campaignInfo?.type || DEFAULT_TYPE;
  const typeConfig = CAMPAIGN_TYPE_CONFIG[currentType] || CAMPAIGN_TYPE_CONFIG[DEFAULT_TYPE];

  /**
   * Step Indicator V2 - Hiển thị tiến trình 3 bước
   * - Basic Info: Thông tin cơ bản của campaign
   * - Products Setup: Chọn và cấu hình sản phẩm
   * - Review: Xác nhận và tạo campaign
   */
  const stepIndicator = (
    <div className={styles.stepIndicatorV2} style={{ '--progress': `${(currentStep / 2) * 100}%` }}>
      {/* Nền đường kẻ progress */}
      <div className={styles.stepIndicatorV2Bg} />
      {/* Thanh progress động */}
      <div className={styles.stepIndicatorV2Progress} />
      
      {[
        { step: 0, label: 'Basic Info', sub: 'Campaign details' },
        { step: 1, label: 'Products Setup', sub: 'Select & configure' },
        { step: 2, label: 'Review', sub: 'Confirm & create' },
      ].map(({ step, label, sub }) => {
        const isCompleted = currentStep > step;
        const isActive = currentStep === step;
        return (
          <div key={step} className={styles.stepItemV2}>
            {/* Circle indicator với các trạng thái: completed, active, pending */}
            <div
              className={`${styles.stepCircle} ${
                isCompleted
                  ? styles.stepCircleCompleted
                  : isActive
                    ? styles.stepCircleActive
                    : styles.stepCirclePending
              }`}
            >
              {isCompleted ? (
                // Icon checkmark cho bước đã hoàn thành
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                step + 1
              )}
            </div>
            {/* Nhãn bước */}
            <span
              className={`${styles.stepLabel} ${
                isCompleted
                  ? styles.stepLabelCompleted
                  : isActive
                    ? styles.stepLabelActive
                    : styles.stepLabelPending
              }`}
            >
              {label}
            </span>
            {/* Mô tả ngắn */}
            <span className={styles.stepSub}>{sub}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <Drawer
      title={
        // Header với icon và tiêu đề động theo campaign type
        <div className={styles.drawerHeader}>
          <div
            className={styles.drawerHeaderIcon}
            style={{
              background: typeConfig.iconBg,
              boxShadow: typeConfig.iconShadow,
            }}
          >
            {typeConfig.icon}
          </div>
          <span>
            {isEditMode
              ? `Edit ${typeConfig.label} Campaign`
              : `Create ${typeConfig.label} Campaign`}
          </span>
          {isEditMode && (
            // Badge Edit Mode với animation pulse
            <span className={styles.editModeBadge}>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Mode
            </span>
          )}
        </div>
      }
      placement="right"
      width={1700}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{
        header: { 
          padding: '16px 24px', 
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fff 100%)',
        },
        body: { 
          padding: '24px 28px',
          background: 'linear-gradient(180deg, #fafafa 0%, #fff 100%)',
        },
        mask: { backdropFilter: 'blur(4px)' },
        wrapper: {
          boxShadow: '-8px 0 32px rgba(232, 73, 73, 0.12)',
        },
      }}
    >
      {stepIndicator}

      {/* Bước 1: Thông tin cơ bản của Campaign */}
      {currentStep === 0 && (
        <Step1
          campaignInfo={campaignInfo}
          setCampaignInfo={setCampaignInfo}
          isEditMode={isEditMode}
          onNext={() => setCurrentStep(1)}
          onCancel={onClose}
        />
      )}

      {/* Bước 2: Thiết lập sản phẩm với loading state */}
      {currentStep === 1 && (
        <Spin 
          spinning={productsLoading}
          tip={
            <div className={styles.loadingTip}>
              <span>Đang tải sản phẩm...</span>
            </div>
          }
          wrapperClassName={styles.spinWrapper}
        >
          <Step2
            campaignInfo={campaignInfo}
            selectedProducts={selectedProducts}
            variantConfigs={variantConfigs}
            selectedVariantKeys={selectedVariantKeys}
            productSearchText={productSearchText}
            setProductSearchText={setProductSearchText}
            filteredProducts={filteredProducts}
            variantTableData={variantTableData}
            isEditMode={isEditMode}
            onBack={() => setCurrentStep(0)}
            onNext={() => setCurrentStep(2)}
            onAddProduct={onAddProduct}
            onRemoveProduct={onRemoveProduct}
            onUpdateVariantConfig={onUpdateVariantConfig}
            onBulkUpdate={onBulkUpdate}
            onRemoveVariant={onRemoveVariant}
            setSelectedVariantKeys={setSelectedVariantKeys}
            onCancel={onClose}
          />
        </Spin>
      )}

      {/* Bước 3: Xem lại và xác nhận */}
      {currentStep === 2 && (
        <Step3
          campaignInfo={campaignInfo}
          selectedProducts={selectedProducts}
          variantConfigs={variantConfigs}
          isEditMode={isEditMode}
          onBack={() => setCurrentStep(1)}
          onSubmit={onSubmit}
          loading={loading}
          onCancel={onClose}
        />
      )}
    </Drawer>
  );
};

CampaignDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentStep: PropTypes.number.isRequired,
  setCurrentStep: PropTypes.func.isRequired,
  selectedCampaign: PropTypes.object,
  campaignInfo: PropTypes.object,
  setCampaignInfo: PropTypes.func,
  selectedProducts: PropTypes.array,
  variantConfigs: PropTypes.object,
  selectedVariantKeys: PropTypes.array,
  setSelectedVariantKeys: PropTypes.func,
  productSearchText: PropTypes.string,
  setProductSearchText: PropTypes.func,
  filteredProducts: PropTypes.array,
  variantTableData: PropTypes.array,
  productsLoading: PropTypes.bool,
  onAddProduct: PropTypes.func,
  onRemoveProduct: PropTypes.func,
  onUpdateVariantConfig: PropTypes.func,
  onBulkUpdate: PropTypes.func,
  onRemoveVariant: PropTypes.func,
  onSubmit: PropTypes.func,
  loading: PropTypes.bool,
};

export default CampaignDrawer;
