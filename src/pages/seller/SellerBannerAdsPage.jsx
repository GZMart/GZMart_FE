/**
 * SellerBannerAdsPage — Redesigned
 *
 * Features:
 * 1. List view — card-based banner management
 * 2. Create view — 3-step wizard:
 *    Step 1: Upload banner image (with crop hint)
 *    Step 2: Hotspot editor — draw click zones linking to products
 *    Step 3: Schedule + preview on homepage mock
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  Steps,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Table,
  Tag,
  Statistic,
  Modal,
  message,
  Spin,
  Alert,
  Typography,
  Space,
  Divider,
  Tooltip,
  Badge,
  Empty,
  Upload,
  Row,
  Col,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  AimOutlined,
  DollarOutlined,
  SendOutlined,
  InfoCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import bannerAdsService from '@services/api/bannerAdsService';
import { productService } from '@services/api';
import uploadService from '@services/api/uploadService';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from '@store/slices/authSlice';
import { paymentService } from '@services/api/paymentService';
import ImgCrop from 'antd-img-crop';
import HotspotEditor from '@components/seller/ShopEditor/ConfigComponents/HotspotEditor';
import HomepagePreviewModal from '@components/seller/banner/HomepagePreviewModal';
import styles from './SellerBannerAdsPage.module.css';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Dragger } = Upload;

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  DRAFT: { color: 'default', label: 'Nháp', icon: <ClockCircleOutlined /> },
  PENDING_REVIEW: { color: 'processing', label: 'Chờ Duyệt', icon: <ClockCircleOutlined /> },
  APPROVED: { color: 'cyan', label: 'Đã Duyệt', icon: <CheckCircleOutlined /> },
  RUNNING: { color: 'success', label: 'Đang Chạy', icon: <ThunderboltOutlined /> },
  COMPLETED: { color: 'default', label: 'Đã Kết Thúc', icon: <CheckCircleOutlined /> },
  REJECTED: { color: 'error', label: 'Từ Chối', icon: <CloseCircleOutlined /> },
  CANCELLED: { color: 'default', label: 'Đã Huỷ', icon: <StopOutlined /> },
};

// ─── Reusable section header ──────────────────────────────────────────────────
const SectionHeader = ({ title, sub, action }) => (
  <div className={styles.sectionHeader}>
    <div>
      <div className={styles.sectionTitle}>{title}</div>
      {sub && <div className={styles.sectionSub}>{sub}</div>}
    </div>
    {action}
  </div>
);

// ─── Mini banner card for list view ──────────────────────────────────────────
const BannerCard = ({ banner, onCancel }) => {
  const cfg = STATUS_CFG[banner.status] || { color: 'default', label: banner.status };
  const totalDays = banner.pricing?.totalDays || 0;
  const views = banner.metrics?.views || 0;
  const clicks = banner.metrics?.clicks || 0;
  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0';

  return (
    <div className={styles.bannerCard}>
      <div className={styles.bannerCardThumb} style={{ backgroundImage: `url(${banner.image})` }}>
        <Tag color={cfg.color} icon={cfg.icon} className={styles.statusTag}>
          {cfg.label}
        </Tag>
        {(banner.hotspots || []).length > 0 && (
          <div className={styles.hotspotBadge}>
            <AimOutlined /> {banner.hotspots.length} hotspot
          </div>
        )}
      </div>
      <div className={styles.bannerCardBody}>
        <div className={styles.bannerCardTitle}>{banner.title}</div>
        {banner.subtitle && <div className={styles.bannerCardSub}>{banner.subtitle}</div>}

        <div className={styles.bannerCardMeta}>
          <span>
            <CalendarOutlined /> {dayjs(banner.startDate).format('DD/MM')} –{' '}
            {dayjs(banner.endDate).format('DD/MM/YYYY')}
          </span>
          <span>{totalDays} ngày</span>
        </div>

        {banner.status === 'RUNNING' && (
          <div className={styles.metricsRow}>
            <span className={styles.metricItem}>👁 {views.toLocaleString()}</span>
            <span className={styles.metricItem}>🖱 {clicks.toLocaleString()}</span>
            <Tag color="blue" style={{ fontSize: 10 }}>
              CTR {ctr}%
            </Tag>
          </div>
        )}

        {banner.rejectionReason && (
          <Alert
            type="error"
            showIcon
            message={banner.rejectionReason}
            style={{ marginTop: 8, fontSize: 12 }}
          />
        )}

        <div className={styles.bannerCardFooter}>
          <div className={styles.feeDisplay}>
            <DollarOutlined /> {(banner.pricing?.totalFee || 0).toLocaleString()} xu
          </div>
          {['PENDING_REVIEW', 'APPROVED'].includes(banner.status) && (
            <Button
              danger
              size="small"
              icon={<StopOutlined />}
              onClick={() => onCancel(banner._id)}
            >
              Huỷ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Step 1: Image upload ─────────────────────────────────────────────────────
const Step1Upload = ({ imageUrl, setImageUrl, onNext }) => {
  const [preview, setPreview] = useState(imageUrl || '');
  const [imgErr, setImgErr] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error(`${file.name} không phải file ảnh hợp lệ.`);
      return Upload.LIST_IGNORE;
    }

    setUploading(true);
    setImgErr(false);

    try {
      // Local preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      const res = await uploadService.uploadMedia(file);
      if (res?.url) {
        setPreview(res.url);
      }
    } catch (error) {
      message.error('Lỗi tải ảnh lên Cloudinary.');
      setImgErr(true);
    } finally {
      setUploading(false);
    }

    return false; // Prevent automatic AntD upload action
  };

  const handleConfirm = () => {
    if (!preview || imgErr) return message.warning('Vui lòng chọn ảnh hợp lệ trước');
    if (preview.startsWith('data:'))
      return message.warning('Đang xử lý ảnh, vui lòng chờ giây lát...');
    setImageUrl(preview);
    onNext();
  };

  return (
    <div className={styles.stepPanel}>
      <div className={styles.stepHint}>
        <InfoCircleOutlined style={{ color: '#1677ff', flexShrink: 0, marginTop: 2 }} />
        <span>
          Chuẩn bị <strong>ảnh quảng cáo</strong> của bạn — có thể là ảnh chứa nhiều sản phẩm,
          khuyến mãi, thương hiệu... Khuyến nghị kích thước <strong>1300×450px</strong> (tỷ lệ
          chuẩn). Bước tiếp theo bạn sẽ vẽ vùng click dẫn đến từng sản phẩm.
        </span>
      </div>

      <div className={styles.uploadSection}>
        <div className={styles.uploadLabel}>Chọn ảnh tải lên</div>

        <ImgCrop aspect={1300 / 450} quality={1} modalTitle="Cắt ảnh Banner (1300x450)">
          <Dragger
            beforeUpload={handleUpload}
            showUploadList={false}
            accept="image/*"
            style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}
            disabled={uploading}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#1677ff', fontSize: 32 }} />
            </p>
            <p
              className="ant-upload-text"
              style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}
            >
              {uploading ? 'Đang tải ảnh...' : 'Nhấp hoặc kéo thả file ảnh vào đây'}
            </p>
          </Dragger>
        </ImgCrop>

        {preview && (
          <div className={styles.imagePreviewBox} style={{ marginTop: 12 }}>
            <div className={styles.imagePreviewLabel}>
              Xem trước ảnh banner
              {!imgErr && <span style={{ color: '#22c55e', marginLeft: 8 }}>✓ Ảnh hợp lệ</span>}
            </div>
            {!imgErr ? (
              <img
                src={preview}
                alt="banner preview"
                className={styles.imagePreview}
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className={styles.imgErrorBox}>
                <CloseCircleOutlined style={{ fontSize: 24, color: '#ef4444' }} />
                <div>Không thể tải ảnh. Vui lòng thử lại file khác.</div>
              </div>
            )}
            {!imgErr && (
              <div className={styles.imageDimHint}>
                💡 Tỷ lệ lý tưởng: 1300×450px · Banner sẽ hiện nổi bật trên trang chủ GZMart
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.stepActions}>
        <div />
        <Button
          type="primary"
          className={styles.primaryBtn}
          disabled={!preview || imgErr || preview.startsWith('data:')}
          onClick={handleConfirm}
          loading={uploading}
          size="large"
        >
          Dùng ảnh này → Bước 2
        </Button>
      </div>
    </div>
  );
};

// ─── Step 2: Hotspot & Title editor ──────────────────────────────────────────
const Step2Hotspot = ({
  imageUrl,
  hotspots,
  setHotspots,
  form,
  products,
  loadingProducts,
  onBack,
  onNext,
}) => {
  const [showEditor, setShowEditor] = useState(false);

  const handleHotspotSave = (newHotspots) => {
    setShowEditor(false);
    // Map product links back
    setHotspots(newHotspots);
  };

  // Build preset links from seller's products
  const productLinks = products.map((p) => ({
    value: `/product/${p._id}`,
    label: `🛍️ ${p.name}`,
  }));

  return (
    <div className={styles.stepPanel}>
      {/* Banner content fields removed as per request */}
      <div className={styles.stepHint} style={{ marginBottom: '1rem' }}>
        <InfoCircleOutlined style={{ color: '#1677ff', flexShrink: 0, marginTop: 2 }} />
        <span>
          Mặc định, khi khách hàng click vào banner sẽ dẫn trực tiếp tới{' '}
          <strong>Trang Cửa Hàng</strong> của bạn. Tuy nhiên, bạn có thể thêm các vùng click
          (hotspot) chi tiết để dẫn khách đến đường link sản phẩm cụ thể.
        </span>
      </div>

      {/* Hotspot editor section */}
      <div className={styles.hotspotSection}>
        <div className={styles.hotspotSectionHeader}>
          <div>
            <div className={styles.hotspotTitle}>
              <AimOutlined style={{ color: '#f97316' }} /> Vùng Click (Hotspot)
            </div>
            <div className={styles.hotspotSub}>
              Vẽ vùng click trên ảnh để dẫn đến sản phẩm hoặc trang cụ thể khi người dùng click vào
              banner
            </div>
          </div>
          <Button
            icon={<AimOutlined />}
            onClick={() => setShowEditor(true)}
            disabled={!imageUrl}
            style={{ borderColor: '#f97316', color: '#f97316' }}
          >
            {hotspots.length > 0 ? `Chỉnh sửa (${hotspots.length} vùng)` : 'Thêm vùng click'}
          </Button>
        </div>

        {!imageUrl && (
          <Alert
            type="warning"
            showIcon
            message="Vui lòng upload ảnh ở Bước 1 trước khi thêm hotspot"
          />
        )}

        {hotspots.length > 0 && (
          <div className={styles.hotspotList}>
            {hotspots.map((h, i) => (
              <div key={i} className={styles.hotspotItem}>
                <div className={styles.hotspotBadgeNum}>{i + 1}</div>
                <div className={styles.hotspotItemInfo}>
                  <span className={styles.hotspotPos}>
                    X: {Math.round(h.x)}% · Y: {Math.round(h.y)}% · W: {Math.round(h.width)}% · H:{' '}
                    {Math.round(h.height)}%
                  </span>
                  <span className={styles.hotspotLink}>
                    {h.link ? (
                      <a href={h.link} target="_blank" rel="noreferrer">
                        {h.link}
                      </a>
                    ) : (
                      <span style={{ color: '#ef4444' }}>⚠ Chưa có liên kết</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview with hotspot dots */}
        {imageUrl && hotspots.length > 0 && (
          <div className={styles.hotspotPreviewWrap}>
            <div className={styles.hotspotPreviewLabel}>Xem trước vị trí hotspot trên ảnh</div>
            <div className={styles.hotspotPreviewImgWrap}>
              <img src={imageUrl} alt="banner" className={styles.hotspotPreviewImg} />
              {hotspots.map((h, i) => (
                <div
                  key={i}
                  className={styles.hotspotDot}
                  style={{
                    left: `${h.x}%`,
                    top: `${h.y}%`,
                    width: `${h.width}%`,
                    height: `${h.height}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <span className={styles.hotspotDotNum}>{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.stepActions}>
        <Button onClick={onBack} icon={<ArrowLeftOutlined />}>
          Quay lại
        </Button>
        <Button type="primary" className={styles.primaryBtn} onClick={onNext}>
          Tiếp theo →
        </Button>
      </div>

      {/* HotspotEditor modal */}
      {showEditor && (
        <HotspotEditor image={imageUrl} hotspots={hotspots} onSave={handleHotspotSave} />
      )}
    </div>
  );
};

// ─── Step 3: Schedule + preview + submit ──────────────────────────────────────
const Step3Schedule = ({
  imageUrl,
  form,
  hotspots,
  calendar,
  pricePerDay,
  dateRange,
  setDateRange,
  slotInfo,
  setSlotInfo,
  loadingSlots,
  setLoadingSlots,
  submitting,
  onSubmit,
  onBack,
  walletBalance,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  const disabledDate = (current) => {
    if (current < dayjs().startOf('day')) return true;
    const dateStr = current.format('YYYY-MM-DD');
    return calendar[dateStr]?.isFull || false;
  };

  const handleDateChange = async (dates) => {
    setDateRange(dates);
    if (!dates?.[0] || !dates?.[1]) {
      setSlotInfo(null);
      return;
    }
    setLoadingSlots(true);
    try {
      const res = await bannerAdsService.checkSlots(dates[0].toISOString(), dates[1].toISOString());
      setSlotInfo(res?.data || res);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Không thể kiểm tra slot');
      setSlotInfo(null);
    } finally {
      setLoadingSlots(false);
    }
  };

  const estimatedFee = slotInfo?.pricing?.totalFee || 0;
  const canAfford = walletBalance >= estimatedFee;
  const isReady = slotInfo?.isAvailable && canAfford && dateRange?.[0];

  // Calendar legend dot
  const cellRender = (current) => {
    const dateStr = current.format('YYYY-MM-DD');
    const info = calendar[dateStr];
    if (!info) return <div className="ant-picker-cell-inner">{current.date()}</div>;
    const color = info.isFull ? '#ef4444' : info.status === 'almost_full' ? '#f97316' : '#22c55e';
    return (
      <div className="ant-picker-cell-inner" style={{ position: 'relative' }}>
        {current.date()}
        <span
          style={{
            position: 'absolute',
            bottom: 1,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: color,
          }}
        />
      </div>
    );
  };

  // No longer checking bannerValues
  // const bannerValues = form.getFieldsValue(['title', 'subtitle']);

  return (
    <div className={styles.stepPanel}>
      {/* Calendar legend */}
      <div className={styles.calLegend}>
        <span>
          <span className={styles.calDot} style={{ background: '#22c55e' }} />
          Còn slot
        </span>
        <span>
          <span className={styles.calDot} style={{ background: '#f97316' }} />
          Gần đầy
        </span>
        <span>
          <span className={styles.calDot} style={{ background: '#ef4444' }} />
          Hết slot
        </span>
      </div>

      <Form layout="vertical">
        <Form.Item label="Thời gian chạy banner" required>
          <RangePicker
            style={{ width: '100%' }}
            size="large"
            disabledDate={disabledDate}
            cellRender={cellRender}
            onChange={handleDateChange}
            format="DD/MM/YYYY"
            minDate={dayjs()}
          />
        </Form.Item>
      </Form>

      {loadingSlots && <Spin tip="Đang kiểm tra slot..." />}

      {slotInfo && (
        <div
          className={`${styles.pricingCard} ${slotInfo.isAvailable ? styles.pricingAvailable : styles.pricingFull}`}
        >
          {slotInfo.isAvailable ? (
            <>
              <div className={styles.pricingRow}>
                <span>Slot còn trống</span>
                <span className={styles.pricingHighlight}>{slotInfo.availableSlots} / 5</span>
              </div>
              <div className={styles.pricingRow}>
                <span>Số ngày chạy</span>
                <strong>{slotInfo.pricing?.totalDays} ngày</strong>
              </div>
              <div className={styles.pricingRow}>
                <span>Đơn giá</span>
                <span>{pricePerDay.toLocaleString()} xu/ngày</span>
              </div>
              <Divider style={{ margin: '10px 0' }} />
              <div className={`${styles.pricingRow} ${styles.pricingTotal}`}>
                <span>Tổng phí quảng cáo</span>
                <strong className={styles.pricingFee}>{estimatedFee.toLocaleString()} xu</strong>
              </div>
              <div className={styles.pricingRow}>
                <span>Số xu hiện có</span>
                <span style={{ color: canAfford ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                  {walletBalance.toLocaleString()} xu
                  {!canAfford && ` (thiếu ${(estimatedFee - walletBalance).toLocaleString()} xu)`}
                </span>
              </div>
              {!canAfford && (
                <Alert
                  type="warning"
                  showIcon
                  message="Số xu trong ví không đủ. Vui lòng nạp thêm xu trước khi đặt banner."
                  style={{ marginTop: 8 }}
                />
              )}
            </>
          ) : (
            <Alert
              type="error"
              showIcon
              icon={<CloseCircleOutlined />}
              message="Tất cả slot đã được đặt trong khoảng thời gian này. Vui lòng chọn ngày khác."
            />
          )}
        </div>
      )}

      {/* Info box */}
      <div className={styles.infoBox}>
        <div className={styles.infoItem}>
          <div className={styles.infoStep}>1</div>
          <span>
            Xu bị <strong>giữ tạm</strong> ngay khi gửi yêu cầu
          </span>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoStep}>2</div>
          <span>
            Admin xét duyệt trong <strong>1–3 ngày làm việc</strong>
          </span>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoStep}>3</div>
          <span>Nếu duyệt → Banner tự động chạy đúng ngày</span>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoStep}>4</div>
          <span>
            Nếu từ chối → Xu được <strong>hoàn lại ngay</strong>
          </span>
        </div>
      </div>

      <div className={styles.stepActions}>
        <Button onClick={onBack} icon={<ArrowLeftOutlined />}>
          Quay lại
        </Button>
        <Space>
          {imageUrl && (
            <Button
              icon={<EyeOutlined />}
              onClick={() => setPreviewOpen(true)}
              style={{ borderColor: '#1677ff', color: '#1677ff' }}
            >
              Xem thử trên Trang Chủ
            </Button>
          )}
          <Button
            type="primary"
            icon={<SendOutlined />}
            className={styles.primaryBtn}
            loading={submitting}
            disabled={!isReady}
            onClick={onSubmit}
          >
            Thanh Toán & Gửi Duyệt {estimatedFee > 0 ? `(${estimatedFee.toLocaleString()} xu)` : ''}
          </Button>
        </Space>
      </div>

      {previewOpen && (
        <HomepagePreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          banner={{
            image: imageUrl,
            hotspots,
          }}
        />
      )}
    </div>
  );
};

// ─── Main Page Component ──────────────────────────────────────────────────────
const SellerBannerAdsPage = () => {
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  // Data
  const [myBanners, setMyBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [calendar, setCalendar] = useState({});
  const [pricePerDay, setPricePerDay] = useState(5000);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Wizard state
  const [imageUrl, setImageUrl] = useState('');
  const [hotspots, setHotspots] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [slotInfo, setSlotInfo] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cancel modal
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth?.user);
  const walletBalance = user?.reward_point || 0;

  // ─── Fetch data ──────────────────────────────────────────────────────────
  const fetchMyBanners = useCallback(async () => {
    setLoadingBanners(true);
    try {
      const res = await bannerAdsService.getMyRequests();
      setMyBanners(res?.banners || []);
    } catch {
      message.error('Không tải được danh sách banner');
    } finally {
      setLoadingBanners(false);
    }
  }, []);

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await bannerAdsService.getCalendar();
      const d = res?.data || res;
      setCalendar(d?.calendar || {});
      setPricePerDay(d?.pricePerDay || 200000);
    } catch {
      /* silent */
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await productService.getMyProducts({ limit: 200 });
      const raw = res?.data?.products || res?.data || [];
      setProducts(Array.isArray(raw) ? raw : []);
    } catch {
      /* silent */
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchMyBanners();
    fetchCalendar();
    fetchProducts();
    dispatch(getCurrentUser()); // Tải lại thông tin user để update số xu mới nhất từ DB
  }, [fetchMyBanners, fetchCalendar, fetchProducts, dispatch]);

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      if (!imageUrl) return message.error('Vui lòng chọn ảnh banner');
      if (!dateRange?.[0] || !dateRange?.[1])
        return message.error('Vui lòng chọn khoảng thời gian');
      if (!slotInfo?.isAvailable) return message.error('Khoảng thời gian này đã hết slot');

      setSubmitting(true);
      await bannerAdsService.createRequest({
        image: imageUrl,
        hotspots,
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
        linkType: 'none',
      });

      message.success('Gửi yêu cầu thành công! Admin sẽ xét duyệt trong 1–3 ngày làm việc.');
      // Reset wizard
      setView('list');
      setCurrentStep(0);
      setImageUrl('');
      setHotspots([]);
      setDateRange(null);
      setSlotInfo(null);
      form.resetFields();
      await fetchMyBanners();
      try {
        await dispatch(getCurrentUser()).unwrap();
      } catch {
        /* ví có thể chưa cập nhật nếu /me lỗi; banner vẫn đã gửi thành công */
      }
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || 'Gửi yêu cầu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Cancel ──────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      await bannerAdsService.cancelRequest(cancelId);
      message.success('Đã huỷ banner. Xu sẽ được hoàn lại vào ví.');
      setCancelId(null);
      await fetchMyBanners();
      try {
        await dispatch(getCurrentUser()).unwrap();
      } catch {
        /* ignore */
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Huỷ thất bại');
    } finally {
      setCancelling(false);
    }
  };

  const openCreate = () => {
    setView('create');
    setCurrentStep(0);
    setImageUrl('');
    setHotspots([]);
    setDateRange(null);
    setSlotInfo(null);
    form.resetFields();
  };

  // ─── Stats ──────────────────────────────────────────────────────────────
  const stats = {
    running: myBanners.filter((b) => b.status === 'RUNNING').length,
    pending: myBanners.filter((b) => b.status === 'PENDING_REVIEW').length,
    approved: myBanners.filter((b) => b.status === 'APPROVED').length,
    views: myBanners.reduce((s, b) => s + (b.metrics?.views || 0), 0),
  };

  const STEPS = [
    { title: 'Upload Ảnh', icon: <UploadOutlined /> },
    { title: 'Hotspot & Nội dung', icon: <AimOutlined /> },
    { title: 'Lên lịch & Gửi', icon: <CalendarOutlined /> },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          {view === 'create' && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => setView('list')}
              className={styles.backBtn}
            >
              Quay lại
            </Button>
          )}
          <div>
            <div className={styles.pageTitle}>
              {view === 'list' ? 'Quảng Cáo Banner' : 'Tạo Banner Quảng Cáo'}
            </div>
            <div className={styles.pageSub}>
              {view === 'list'
                ? 'Quản lý và theo dõi các chiến dịch banner quảng cáo trên trang chủ GZMart'
                : 'Upload ảnh, thiết lập hotspot, chọn lịch chạy và gửi yêu cầu'}
            </div>
          </div>
        </div>
        <div className={styles.pageHeaderRight}>
          <div className={styles.walletCard}>
            <DollarOutlined />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span className={styles.walletAmt}>{walletBalance.toLocaleString()}</span>
              <span className={styles.walletLabel}>xu trong ví</span>
            </div>
          </div>
          {view === 'list' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className={styles.createBtn}
              onClick={openCreate}
              size="large"
            >
              Tạo Banner Mới
            </Button>
          )}
        </div>
      </div>

      {/* ═══════════════ LIST VIEW ═══════════════ */}
      {view === 'list' && (
        <>
          {/* Pricing info strip */}
          <div className={styles.infoStrip}>
            <div className={styles.infoStripItem}>
              <span className={styles.infoStripIcon}>💰</span>
              <span>
                <strong>{pricePerDay.toLocaleString()} xu</strong> / ngày
              </span>
            </div>
            <div className={styles.infoStripDot} />
            <div className={styles.infoStripItem}>
              <span className={styles.infoStripIcon}>🎯</span>
              <span>
                Tối đa <strong>1 slot</strong> tại 1 thời điểm
              </span>
            </div>
            <div className={styles.infoStripDot} />
            <div className={styles.infoStripItem}>
              <span className={styles.infoStripIcon}>📊</span>
              <span>View & Click tracking thời gian thực</span>
            </div>
            <div className={styles.infoStripDot} />
            <div className={styles.infoStripItem}>
              <span className={styles.infoStripIcon}>✅</span>
              <span>
                Admin duyệt trong <strong>1–3 ngày</strong>
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className={styles.statsGrid}>
            {[
              {
                label: 'Đang Chạy',
                value: stats.running,
                color: '#22c55e',
                icon: <ThunderboltOutlined />,
              },
              {
                label: 'Chờ Duyệt',
                value: stats.pending,
                color: '#1677ff',
                icon: <ClockCircleOutlined />,
              },
              {
                label: 'Đã Duyệt',
                value: stats.approved,
                color: '#06b6d4',
                icon: <CheckCircleOutlined />,
              },
              {
                label: 'Tổng Lượt Xem',
                value: stats.views,
                color: '#8b5cf6',
                icon: <EyeOutlined />,
              },
            ].map((s) => (
              <div key={s.label} className={styles.statCard}>
                <div className={styles.statIcon} style={{ color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <div className={styles.statValue} style={{ color: s.color }}>
                    {s.value.toLocaleString()}
                  </div>
                  <div className={styles.statLabel}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Banner list */}
          <div className={styles.listSection}>
            <SectionHeader title="Danh sách Banner" sub="Tất cả chiến dịch quảng cáo của bạn" />
            {loadingBanners ? (
              <div className={styles.loadingCenter}>
                <Spin size="large" />
              </div>
            ) : myBanners.length === 0 ? (
              <div className={styles.emptySection}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                        Bạn chưa có banner quảng cáo nào
                      </div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>
                        Tạo banner ngay để đưa sản phẩm lên trang chủ và tăng doanh số!
                      </div>
                    </div>
                  }
                >
                  <Button type="primary" className={styles.primaryBtn} onClick={openCreate}>
                    Tạo Banner Đầu Tiên
                  </Button>
                </Empty>
              </div>
            ) : (
              <div className={styles.bannerGrid}>
                {myBanners.map((b) => (
                  <BannerCard key={b._id} banner={b} onCancel={setCancelId} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════ CREATE VIEW ═══════════════ */}
      {view === 'create' && (
        <div className={styles.createLayout}>
          {/* Steps indicator */}
          <div className={styles.stepsCard}>
            <Steps
              current={currentStep}
              items={STEPS.map((s) => ({ title: s.title, icon: s.icon }))}
              size="small"
            />
          </div>

          {/* Step content */}
          <div className={styles.stepContent}>
            {currentStep === 0 && (
              <Step1Upload
                imageUrl={imageUrl}
                setImageUrl={setImageUrl}
                onNext={() => setCurrentStep(1)}
              />
            )}
            {currentStep === 1 && (
              <Step2Hotspot
                imageUrl={imageUrl}
                hotspots={hotspots}
                setHotspots={setHotspots}
                form={form}
                products={products}
                loadingProducts={loadingProducts}
                onBack={() => setCurrentStep(0)}
                onNext={() => setCurrentStep(2)}
              />
            )}
            {currentStep === 2 && (
              <Step3Schedule
                imageUrl={imageUrl}
                form={form}
                hotspots={hotspots}
                calendar={calendar}
                pricePerDay={pricePerDay}
                dateRange={dateRange}
                setDateRange={setDateRange}
                slotInfo={slotInfo}
                setSlotInfo={setSlotInfo}
                loadingSlots={loadingSlots}
                setLoadingSlots={setLoadingSlots}
                submitting={submitting}
                onSubmit={handleSubmit}
                onBack={() => setCurrentStep(1)}
                walletBalance={walletBalance}
              />
            )}
          </div>
        </div>
      )}

      {/* Cancel confirm modal */}
      <Modal
        title="Xác nhận huỷ banner"
        open={!!cancelId}
        onOk={handleCancel}
        onCancel={() => setCancelId(null)}
        okText="Huỷ Banner & Hoàn Xu"
        cancelText="Giữ lại"
        okButtonProps={{ danger: true, loading: cancelling }}
      >
        <Paragraph>
          Bạn có chắc muốn huỷ banner này? Xu sẽ được hoàn lại vào ví ngay lập tức.
        </Paragraph>
      </Modal>
    </div>
  );
};

export default SellerBannerAdsPage;
