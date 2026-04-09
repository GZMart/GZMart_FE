/**
 * AdminBannerAdsPage — Premium UI Rebuild
 *
 * List View: Stats → Table with reorder (↑↓) + approve/reject
 * Create View: 3-step wizard (Upload → Hotspot → Config & Publish)
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Table, Tag, Button, Space, Modal, Form, Input,
  message, Statistic, Drawer, Image, Divider, Tooltip,
  Typography, Empty, Segmented, Steps, Upload, Alert, DatePicker, Select,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined,
  ThunderboltOutlined, ClockCircleOutlined, DollarOutlined,
  UserOutlined, CalendarOutlined, BarChartOutlined, PlusOutlined,
  DeleteOutlined, ArrowLeftOutlined, AimOutlined, SendOutlined,
  ArrowUpOutlined, ArrowDownOutlined, InboxOutlined, PictureOutlined,
  SortAscendingOutlined, SettingOutlined, EditOutlined,
  PauseCircleOutlined, PlayCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import bannerAdsService from '@services/api/bannerAdsService';
import uploadService from '@services/api/uploadService';
import ImgCrop from 'antd-img-crop';
import HotspotEditor from '@components/seller/ShopEditor/ConfigComponents/HotspotEditor';
import HomepagePreviewModal from '@components/seller/banner/HomepagePreviewModal';
import styles from './AdminBannerAdsPage.module.css';

const { Text, Title } = Typography;
const { Dragger } = Upload;
const { RangePicker } = DatePicker;

const STATUS_CFG = {
  DRAFT:          { color: 'default',    label: 'Draft',          bg: '#f1f5f9', text: '#475569' },
  PENDING_REVIEW: { color: 'processing', label: 'Pending Review', bg: '#fef3c7', text: '#92400e' },
  APPROVED:       { color: 'cyan',       label: 'Approved',       bg: '#cffafe', text: '#0e7490' },
  RUNNING:        { color: 'success',    label: 'Running',        bg: '#dcfce7', text: '#15803d' },
  COMPLETED:      { color: 'default',    label: 'Completed',      bg: '#f1f5f9', text: '#64748b' },
  REJECTED:       { color: 'error',      label: 'Rejected',       bg: '#fee2e2', text: '#dc2626' },
  CANCELLED:      { color: 'default',    label: 'Cancelled',      bg: '#f1f5f9', text: '#9ca3af' },
};

// ─── Step 1: Upload Image ─────────────────────────────────────────────────────
const AdminStep1Upload = ({ imageUrl, setImageUrl, onNext }) => {
  const [preview, setPreview] = useState(imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const handleUpload = async (file) => {
    if (!file.type.startsWith('image/')) { message.error('Invalid file type.'); return Upload.LIST_IGNORE; }
    setUploading(true); setImgErr(false);
    try {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
      const res = await uploadService.uploadMedia(file);
      if (res?.url) setPreview(res.url);
    } catch { message.error('Upload failed.'); setImgErr(true); }
    finally { setUploading(false); }
    return false;
  };

  const handleConfirm = () => {
    if (!preview || imgErr) return message.warning('Please select a valid image first');
    if (preview.startsWith('data:')) return message.warning('Processing image, please wait...');
    setImageUrl(preview); onNext();
  };

  return (
    <div className={styles.stepPanel}>
      <div className={styles.stepHint}>
        <InboxOutlined style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }} />
        <span>Prepare your banner image. Recommended size: <strong>1200×600px</strong> — matches the GZMart homepage hero banner.</span>
      </div>

      <div className={styles.uploadBox}>
        <ImgCrop aspect={1200 / 600} quality={1} modalTitle="Crop Banner Image (1200×600)">
          <Dragger beforeUpload={handleUpload} showUploadList={false} accept="image/*" disabled={uploading}
            style={{ background: 'transparent', border: 'none', padding: '2rem 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              {uploading ? (
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #1677ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <InboxOutlined style={{ fontSize: 28, color: '#1677ff' }} />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                  {uploading ? 'Uploading to Cloudinary...' : 'Drag & drop or click to choose image'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Supports: JPG, PNG, WebP · Ideal ratio 1200×600</div>
              </div>
            </div>
          </Dragger>
        </ImgCrop>
      </div>

      {preview && (
        <div className={styles.previewBox}>
          <div className={styles.previewBoxHeader}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <PictureOutlined /> Banner Preview
            </span>
            {!imgErr && <span style={{ color: '#22c55e', fontWeight: 700 }}>✓ Valid image</span>}
          </div>
          {!imgErr ? (
            <img src={preview} alt="preview" className={styles.previewImg} onError={() => setImgErr(true)} />
          ) : (
            <div style={{ padding: '3rem', background: '#fef2f2', color: '#dc2626', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <CloseCircleOutlined style={{ fontSize: 32 }} />
              <span>Cannot load image. Please try another file.</span>
            </div>
          )}
          {!imgErr && (
            <div className={styles.previewBoxFooter}>
              💡 1200×600px ratio — Banner will display at the correct size on the GZMart homepage
            </div>
          )}
        </div>
      )}

      <div className={styles.stepActions}>
        <div />
        <Button type="primary" size="large" className={styles.publishBtn}
          disabled={!preview || imgErr || preview.startsWith('data:')}
          onClick={handleConfirm} loading={uploading}>
          Use this image → Step 2
        </Button>
      </div>
    </div>
  );
};

// ─── Step 2: Hotspot ──────────────────────────────────────────────────────────
const AdminStep2Hotspot = ({ imageUrl, hotspots, setHotspots, linkMode, setLinkMode, bannerLink, setBannerLink, onBack, onNext }) => {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div className={styles.stepPanel}>
      <div className={styles.stepHint}>
        <AimOutlined style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }} />
        <span>
          Choose how the banner redirects users when clicked. You can either set a <strong>Default Link</strong> for the entire banner, or draw multiple <strong>Click Zones (Hotspots)</strong>.
        </span>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '1rem' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Banner Link Mode</div>
          <Segmented 
            options={[
              { label: 'Default Link (Whole Banner)', value: 'global' },
              { label: 'Multiple Click Zones (Hotspots)', value: 'hotspot' }
            ]} 
            value={linkMode}
            onChange={setLinkMode}
            size="large"
          />
        </div>

        {linkMode === 'global' ? (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Destination URL</div>
            <Input 
              placeholder="/categories/deal OR https://example.com" 
              value={bannerLink}
              onChange={(e) => setBannerLink(e.target.value)}
              size="large"
              style={{ maxWidth: 500 }}
            />
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
              This link will be applied to the entire banner.
            </div>
          </div>
        ) : (
          <div className={styles.hotspotSection}>
            <div className={styles.hotspotHeader}>
              <div>
                <div className={styles.hotspotTitle}>
                  <AimOutlined style={{ color: '#f97316' }} /> Click Zones (Hotspots)
                </div>
                <div className={styles.hotspotSub}>Draw click zones on the image to link to products or categories</div>
              </div>
              <Button icon={<AimOutlined />} onClick={() => setShowEditor(true)} disabled={!imageUrl}
                style={{ borderColor: '#f97316', color: '#f97316', borderRadius: 8, fontWeight: 600 }}>
                {hotspots.length > 0 ? `Edit (${hotspots.length} zones)` : '+ Add Click Zone'}
              </Button>
            </div>

            {!imageUrl ? (
              <Alert type="warning" showIcon message="Please upload an image in Step 1 before adding hotspots" />
            ) : hotspots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: 13 }}>
                <AimOutlined style={{ fontSize: 28, marginBottom: 8 }} />
                <div>Chưa có vùng click nào. Nhấn "+ Thêm vùng click" để thiết lập.</div>
              </div>
            ) : (
              <div>
                {hotspots.map((h, i) => (
                  <div key={i} className={styles.hotspotItem}>
                    <div className={styles.hotspotNum}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                        X: {Math.round(h.x)}% · Y: {Math.round(h.y)}% · W: {Math.round(h.width)}% · H: {Math.round(h.height)}%
                      </div>
                      <div style={{ fontSize: 12, color: h.link ? '#1677ff' : '#ef4444', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.link || '⚠ No link set'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image preview with hotspot dots */}
      {imageUrl && linkMode === 'hotspot' && hotspots.length > 0 && (
        <div className={styles.previewBox}>
          <div className={styles.previewBoxHeader}>
            <span>📍 Hotspot positions on image</span>
          </div>
          <div style={{ position: 'relative' }}>
            <img src={imageUrl} alt="banner" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
            {hotspots.map((h, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${h.x}%`, top: `${h.y}%`,
                width: `${h.width}%`, height: `${h.height}%`,
                border: '2px solid #f97316',
                background: 'rgba(249,115,22,0.15)',
                transform: 'translate(-50%,-50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 4,
              }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#f97316', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.stepActions}>
        <Button onClick={onBack} icon={<ArrowLeftOutlined />} className={styles.backBtn}>Back</Button>
        <Button type="primary" size="large" className={styles.publishBtn} onClick={onNext} disabled={linkMode === 'hotspot' && hotspots.length === 0 && !imageUrl}>Next →</Button>
      </div>

      {showEditor && (
        <HotspotEditor image={imageUrl} hotspots={hotspots}
          onSave={(h) => { setShowEditor(false); setHotspots(h); }} />
      )}
    </div>
  );
};

// ─── Step 3: Config & Publish ─────────────────────────────────────────────────
const AdminStep3Config = ({ imageUrl, hotspots, calendar = {}, onBack, onSubmit, submitting, adminBanners, dateRange, setDateRange, order, setOrder, bannerStatus, setBannerStatus, bannerTitle, setBannerTitle }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const disabledDate = (current) => {
    if (current < dayjs().startOf('day')) return true;
    return false;
  };

  const cellRender = (current) => {
    const dateStr = current.format('YYYY-MM-DD');
    const info = calendar[dateStr];
    if (!info) return <div className="ant-picker-cell-inner">{current.date()}</div>;
    
    // Only Green (Còn slot) and Red (Hết slot)
    const color = info.isFull ? '#ef4444' : '#22c55e';
    
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

  return (
    <div className={styles.stepPanel}>
      <Alert type="success" showIcon
        message={<span>Admin banners <strong>skip approval</strong> — they appear on the homepage immediately after publishing.</span>}
      />

      {/* Title config */}
      <div className={styles.configSection}>
        <div className={styles.configSectionTitle}>
          Banner Title
        </div>
        <Input 
          value={bannerTitle} 
          onChange={(e) => setBannerTitle(e.target.value)} 
          placeholder="e.g. Summer Mega Sale Highlight" 
          size="large" 
        />
        <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
          💡 Give your banner a recognizable name for easy management
        </div>
      </div>

      {/* Date config */}
      <div className={styles.configSection}>
        <div className={styles.configSectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><CalendarOutlined style={{ color: '#1677ff' }} /> Display Schedule</div>
          <div style={{ fontSize: 12, fontWeight: 400, display: 'flex', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}/> Còn slot</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }}/> Hết slot</span>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <RangePicker
            allowEmpty={[false, true]}
            style={{ width: '100%' }}
            size="large"
            disabledDate={disabledDate}
            cellRender={cellRender}
            onChange={(dates) => setDateRange(dates || [null, null])}
            format="DD/MM/YYYY"
            minDate={dayjs()}
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
          💡 Leave end date empty for an evergreen banner with no expiry
        </div>
      </div>

      {/* Status config */}
      <div className={styles.configSection}>
        <div className={styles.configSectionTitle}>
          <SettingOutlined style={{ color: '#8b5cf6' }} /> Banner Status
        </div>
        <Select value={bannerStatus} onChange={setBannerStatus} style={{ width: '100%' }} size="large">
          <Select.Option value="RUNNING">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              Running (Visible)
            </span>
          </Select.Option>
          <Select.Option value="COMPLETED">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} />
              Completed (Hidden)
            </span>
          </Select.Option>
        </Select>
      </div>

      {/* Order config */}
      <div className={styles.configSection}>
        <div className={styles.configSectionTitle}>
          <SortAscendingOutlined style={{ color: '#f97316' }} /> Display Order on Homepage
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <input type="number" value={order} min={0} onChange={e => setOrder(e.target.value)} className={styles.orderInput} />
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            Lower number → appears <strong>first</strong> in the slideshow.<br />
            Currently <strong>{adminBanners.length}</strong> system banners.
          </div>
        </div>

        {adminBanners.length > 0 && (
          <div className={styles.orderPreviewList}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current order</div>
            {[...adminBanners]
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .slice(0, 5)
              .map((b, i) => (
                <div key={b._id} className={styles.orderPreviewItem}>
                  <div className={styles.orderPreviewNum}>{b.order ?? i}</div>
                  <span style={{ flexShrink: 0, fontSize: 11, color: '#94a3b8', marginRight: 4 }}>{b.ownerType === 'ADMIN' ? '🔵' : '🟠'}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.title || '(No title)'}
                  </span>
                </div>
              ))}
            <div className={styles.orderPreviewItem} style={{ border: '2px dashed #1677ff', background: '#eff6ff' }}>
              <div className={styles.orderPreviewNum} style={{ background: '#1677ff' }}>{parseInt(order) || 0}</div>
              <span style={{ fontSize: 11, color: '#1677ff', fontWeight: 700 }}>⭐ Your new banner will be here</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.stepActions}>
        <Button onClick={onBack} icon={<ArrowLeftOutlined />} className={styles.backBtn}>Back</Button>
        <Space>
          {imageUrl && (
            <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}
              style={{ borderColor: '#1677ff', color: '#1677ff', borderRadius: 10, fontWeight: 600 }}>
              Preview on Home
            </Button>
          )}
          <Button type="primary" icon={<SendOutlined />} size="large" loading={submitting}
            className={styles.publishBtn}
            onClick={() => onSubmit()}>
            🚀 {submitting ? 'Publishing...' : 'Publish Banner Now'}
          </Button>
        </Space>
      </div>

      {previewOpen && (
        <HomepagePreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)}
          banner={{ image: imageUrl, hotspots }} />
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminBannerAdsPage = () => {
  const [view, setView] = useState('list');
  const [currentStep, setCurrentStep] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [linkMode, setLinkMode] = useState('global');
  const [bannerLink, setBannerLink] = useState('');
  const [hotspots, setHotspots] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [order, setOrder] = useState(0);
  const [bannerStatus, setBannerStatus] = useState('RUNNING');
  const [bannerTitle, setBannerTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [rejectId, setRejectId] = useState(null);
  const [rejectForm] = Form.useForm();
  const [rejecting, setRejecting] = useState(false);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [approving, setApproving] = useState({});
  const [deleting, setDeleting] = useState({});
  const [reordering, setReordering] = useState(false);
  const [allBanners, setAllBanners] = useState([]);
  const [calendar, setCalendar] = useState({});

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (ownerFilter) params.ownerType = ownerFilter;
      const res = await bannerAdsService.adminGetAll(params);
      const data = res?.data || res;
      const list = (data?.banners || data || []);
      setBanners([...list].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
      setTotal(data?.pagination?.total || list.length);
    } catch { message.error('Không tải được dữ liệu banner'); }
    finally { setLoading(false); }
  }, [statusFilter, ownerFilter, page]);

  const fetchAllStats = useCallback(async () => {
    try {
      const res = await bannerAdsService.adminGetAll({ limit: 200 });
      const data = res?.data || res;
      setAllBanners(data?.banners || data || []);
    } catch { /* silent */ }
  }, []);

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await bannerAdsService.getCalendar();
      const d = res?.data || res;
      setCalendar(d?.calendar || {});
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);
  useEffect(() => { fetchAllStats(); }, [fetchAllStats]);
  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  // ─── Wizard submit ────────────────────────────────────────────────────────
  const resetWizard = () => { 
    setView('list'); setCurrentStep(0); 
    setImageUrl(''); setHotspots([]); 
    setLinkMode('global'); setBannerLink(''); 
    setDateRange([null, null]); 
    setBannerStatus('RUNNING');
    setBannerTitle('');
    setEditId(null);
  };

  const handleCreateClick = () => {
    const adminAds = allBanners.filter(b => b.ownerType === 'ADMIN');
    const maxOrder = adminAds.reduce((max, b) => Math.max(max, b.order || 0), -1);
    setOrder(maxOrder + 1);
    setView('create');
  };

  const handleToggleStatus = async (banner) => {
    try {
      const newStatus = banner.status === 'RUNNING' ? 'COMPLETED' : 'RUNNING';
      await bannerAdsService.adminUpdate(banner._id, { status: newStatus, isActive: newStatus === 'RUNNING' });
      message.success(`Banner đã được ${newStatus === 'RUNNING' ? 'phát hành lại' : 'tạm dừng'}`);
      fetchBanners(); fetchAllStats();
    } catch { message.error('Lỗi cập nhật trạng thái'); }
  };

  const handleEdit = (banner) => {
    setEditId(banner._id);
    setImageUrl(banner.image);
    setHotspots(banner.hotspots || []);
    setBannerLink(banner.link || '');
    setLinkMode(banner.link ? 'global' : (banner.hotspots?.length > 0 ? 'hotspot' : 'global'));
    setDateRange([
      banner.startDate ? dayjs(banner.startDate) : null,
      banner.endDate ? dayjs(banner.endDate) : null,
    ]);
    setOrder(banner.order ?? 0);
    setBannerStatus(banner.status || 'RUNNING');
    setBannerTitle(banner.title || '');
    setView('create');
    setCurrentStep(0);
  };

  const handleWizardSubmit = async () => {
    if (!imageUrl) return message.error('Vui lòng chọn ảnh banner');
    setSubmitting(true);
    try {
      const payload = {
        title: bannerTitle,
        image: imageUrl, 
        hotspots: linkMode === 'hotspot' ? hotspots : [],
        link: linkMode === 'global' ? bannerLink : null,
        linkType: linkMode === 'global' ? (bannerLink.startsWith('http') ? 'external' : 'deal') : 'none',
        startDate: dateRange[0] ? dateRange[0].toISOString() : undefined,
        endDate: dateRange[1] ? dateRange[1].toISOString() : undefined,
        order: parseInt(order) || 0,
        isActive: bannerStatus === 'RUNNING', ownerType: 'ADMIN', status: bannerStatus,
      };
      
      if (editId) {
        await bannerAdsService.adminUpdate(editId, payload);
        message.success('🎉 System banner updated successfully!');
      } else {
        await bannerAdsService.adminCreate(payload);
        message.success('🎉 System banner published successfully!');
      }
      
      resetWizard(); fetchBanners(); fetchAllStats();
    } catch (err) { message.error(err?.response?.data?.message || 'Failed to save banner'); }
    finally { setSubmitting(false); }
  };

  // ─── Approve / Reject ─────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setApproving(p => ({ ...p, [id]: true }));
    try {
      await bannerAdsService.adminApprove(id);
      message.success('✅ Banner approved successfully');
      fetchBanners(); fetchAllStats();
    } catch (err) { message.error(err?.response?.data?.message || 'Approval failed'); }
    finally { setApproving(p => ({ ...p, [id]: false })); }
  };

  const handleReject = async () => {
    try {
      const { rejectionReason } = await rejectForm.validateFields();
      setRejecting(true);
      await bannerAdsService.adminReject(rejectId, rejectionReason);
      message.success('Banner rejected. Seller coins have been refunded.');
      setRejectId(null); rejectForm.resetFields();
      fetchBanners(); fetchAllStats();
    } catch (err) { if (err?.response) message.error(err.response.data?.message || 'Rejection failed'); }
    finally { setRejecting(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(p => ({ ...p, [id]: true }));
    try {
      await bannerAdsService.adminDelete(id);
      message.success('Banner deleted'); fetchBanners(); fetchAllStats();
    } catch (err) { message.error(err?.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(p => ({ ...p, [id]: false })); }
  };

  // ─── Reorder ──────────────────────────────────────────────────────────────
  const handleMoveOrder = async (bannerId, direction) => {
    // Sort ALL active banners by their current order to get the full list
    const sortedAll = [...banners].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    const idx = sortedAll.findIndex(b => b._id === bannerId);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sortedAll.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newList = [...sortedAll];
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    const updates = newList.map((b, i) => ({ id: b._id, order: i }));
    setReordering(true);
    try {
      await bannerAdsService.adminReorder(updates);
      await fetchBanners();
      message.success('Banner order updated');
    } catch { message.error('Failed to update order'); }
    finally { setReordering(false); }
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    pending:      allBanners.filter(b => b.status === 'PENDING_REVIEW').length,
    running:      allBanners.filter(b => b.status === 'RUNNING').length,
    totalRevenue: allBanners
      .filter(b => ['RUNNING', 'COMPLETED', 'APPROVED'].includes(b.status))
      .reduce((s, b) => s + (b.pricing?.totalFee || 0), 0),
    totalViews:   allBanners.reduce((s, b) => s + (b.metrics?.views || 0), 0),
  };

  const STAT_CARDS = [
    { label: 'Pending Review', value: stats.pending, icon: <ClockCircleOutlined />, iconBg: '#fff7ed', iconColor: '#fa8c16', cls: styles.statCardOrange },
    { label: 'Running',        value: stats.running, icon: <ThunderboltOutlined />, iconBg: '#f0fdf4', iconColor: '#22c55e', cls: styles.statCardGreen },
    { label: 'Total Revenue',  value: stats.totalRevenue, suffix: ' xu', icon: <DollarOutlined />, iconBg: '#fffbeb', iconColor: '#f59e0b', cls: styles.statCardYellow },
    { label: 'Total Views',    value: stats.totalViews, icon: <BarChartOutlined />, iconBg: '#eff6ff', iconColor: '#3b82f6', cls: styles.statCardBlue },
  ];

  // ─── Table columns ────────────────────────────────────────────────────────
  // All active/running banners sorted by order for reorder controls
  const adminBannersOnly = [...banners].filter(b => b.ownerType === 'ADMIN').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sortedAllBanners = [...banners].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const columns = [
    {
      title: 'Thứ tự',
      key: 'order',
      width: 100,
      render: (_, rec) => {
        const idx = sortedAllBanners.findIndex(b => b._id === rec._id);
        return (
          <div className={styles.orderCell}>
            <div className={styles.orderBadge}
              style={rec.ownerType === 'SELLER' ? { background: 'linear-gradient(135deg, #f97316, #ea580c)' } : undefined}
            >
              {idx + 1}
            </div>
            <div className={styles.orderBtns}>
              <Button className={styles.orderBtn} icon={<ArrowUpOutlined style={{ fontSize: 9 }} />}
                disabled={idx === 0} loading={reordering}
                onClick={() => handleMoveOrder(rec._id, 'up')} />
              <Button className={styles.orderBtn} icon={<ArrowDownOutlined style={{ fontSize: 9 }} />}
                disabled={idx === sortedAllBanners.length - 1} loading={reordering}
                onClick={() => handleMoveOrder(rec._id, 'down')} />
            </div>
          </div>
        );
      },
    },
    {
      title: 'Banner',
      key: 'banner',
      width: 280,
      render: (_, rec) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {rec.image ? (
            <img src={rec.image} alt="banner" className={styles.bannerThumb} />
          ) : (
            <div className={styles.bannerThumbPlaceholder}><PictureOutlined /></div>
          )}
          <div className={styles.bannerInfo}>
            <div className={styles.bannerName}>{rec.title || '(No title)'}</div>
            {rec.subtitle && <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{rec.subtitle}</div>}
            <div className={styles.bannerTagRow}>
              <Tag style={{ fontSize: 10, padding: '0 5px', margin: 0 }} color={rec.ownerType === 'ADMIN' ? 'geekblue' : 'orange'}>
                {rec.ownerType === 'ADMIN' ? '🔵 System' : '🟠 Seller'}
              </Tag>
              {(rec.hotspots || []).length > 0 && (
                <Tag style={{ fontSize: 10, padding: '0 5px', margin: 0 }} color="gold">
                  <AimOutlined /> {rec.hotspots.length}
                </Tag>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Owner',
      key: 'seller',
      width: 180,
      render: (_, rec) => rec.sellerId ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {(rec.sellerId?.fullName || 'S')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.sellerId?.fullName || '—'}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.sellerId?.email}</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1677ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>A</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1677ff' }}>Admin</span>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s) => {
        const cfg = STATUS_CFG[s] || { bg: '#f1f5f9', text: '#475569', label: s };
        return (
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 20,
            background: cfg.bg, color: cfg.text, fontSize: 12, fontWeight: 600,
          }}>{cfg.label}</span>
        );
      },
    },
    {
      title: 'Ngày chạy',
      key: 'dates',
      width: 140,
      render: (_, rec) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>
            <CalendarOutlined style={{ color: '#1677ff', marginRight: 4 }} />
            {rec.startDate ? dayjs(rec.startDate).format('DD/MM/YYYY') : '—'}
          </div>
          <div style={{ color: '#94a3b8', marginTop: 2 }}>
            → {rec.endDate ? dayjs(rec.endDate).format('DD/MM/YYYY') : 'No expiry'}
          </div>
        </div>
      ),
    },
    {
      title: 'Metrics',
      key: 'metrics',
      width: 110,
      render: (_, rec) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ color: '#475569', marginBottom: 2 }}>👁 {(rec.metrics?.views || 0).toLocaleString()}</div>
          <div style={{ color: '#475569', marginBottom: 4 }}>🖱 {(rec.metrics?.clicks || 0).toLocaleString()}</div>
          <span style={{ background: '#eff6ff', color: '#1677ff', fontSize: 10, padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>
            CTR {rec.ctr || '0.00'}%
          </span>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      render: (_, rec) => (
        <Space size={4} wrap>
          <Tooltip title="Xem chi tiết">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewBanner(rec)}
              style={{ borderRadius: 6 }} />
          </Tooltip>
          {rec.ownerType === 'ADMIN' ? (
            <>
              <Tooltip title={rec.status === 'RUNNING' ? 'Pause banner' : 'Resume banner'}>
                <Button size="small" icon={rec.status === 'RUNNING' ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={() => handleToggleStatus(rec)}
                  style={{ borderRadius: 6, color: rec.status === 'RUNNING' ? '#f59e0b' : '#10b981', borderColor: rec.status === 'RUNNING' ? '#f59e0b' : '#10b981' }} />
              </Tooltip>
              <Tooltip title="Edit banner">
                <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(rec)}
                  style={{ borderRadius: 6, color: '#1677ff', borderColor: '#1677ff' }} />
              </Tooltip>
            </>
          ) : rec.status === 'RUNNING' ? (
            <Tooltip title="Pause seller banner">
              <Button size="small" icon={<PauseCircleOutlined />} onClick={() => handleToggleStatus(rec)}
                style={{ borderRadius: 6, color: '#f59e0b', borderColor: '#f59e0b' }} />
            </Tooltip>
          ) : rec.status === 'APPROVED' || rec.status === 'PAUSED' ? (
            <Tooltip title="Resume seller banner">
              <Button size="small" icon={<PlayCircleOutlined />} onClick={() => handleToggleStatus(rec)}
                style={{ borderRadius: 6, color: '#10b981', borderColor: '#10b981' }} />
            </Tooltip>
          ) : null}
          {rec.status === 'PENDING_REVIEW' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}
                loading={approving[rec._id]} onClick={() => handleApprove(rec._id)}
                style={{ background: '#22c55e', borderColor: '#22c55e', borderRadius: 6 }}>
              </Button>
              <Button size="small" danger icon={<CloseCircleOutlined />}
                onClick={() => setRejectId(rec._id)} style={{ borderRadius: 6 }}>
              </Button>
            </>
          )}
          <Tooltip title="Xoá">
            <Button size="small" danger icon={<DeleteOutlined />} loading={deleting[rec._id]}
              style={{ borderRadius: 6 }}
              onClick={() => Modal.confirm({
                title: 'Delete banner?',
                content: rec.ownerType === 'SELLER' ? 'Coins will be refunded to the Seller.' : 'This banner will be permanently deleted.',
                onOk: () => handleDelete(rec._id),
                okButtonProps: { danger: true },
              })} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>

        {/* ── Page Header ── */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            {view === 'create' ? (
              <button onClick={resetWizard} className={styles.backIconBtn} title="Back to list"><ArrowLeftOutlined /></button>
            ) : (
              <div className={styles.pageIconWrap}>
                <ThunderboltOutlined style={{ color: '#fff', fontSize: 22 }} />
              </div>
            )}
            <div>
              <div className={styles.pageTitle}>
                {view === 'create' ? 'Create New System Banner' : 'Banner Ads Management'}
              </div>
              <div className={styles.pageSub}>
                {view === 'create'
                  ? 'Upload image · Set hotspots · Configure and publish'
                  : 'Review Seller requests · Manage system banners with display order'}
              </div>
            </div>
          </div>
          {view === 'list' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateClick} className={styles.createBtn}>
              Create System Banner
            </Button>
          )}
        </div>

        {/* ── Stats ── */}
        <div className={styles.statsRow}>
          {STAT_CARDS.map(s => (
            <div key={s.label} className={`${styles.statCard} ${s.cls}`}>
              <div className={styles.statIconWrap} style={{ background: s.iconBg, color: s.iconColor }}>
                {s.icon}
              </div>
              <div>
                <div className={styles.statValue} style={{ color: s.iconColor }}>
                  {s.value.toLocaleString()}{s.suffix || ''}
                </div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ══════ LIST VIEW ══════ */}
        {view === 'list' && (
          <div className={styles.listCard}>
            <div className={styles.listCardHeader}>
              <div>
                <div className={styles.listCardTitle}>Banner List</div>
                <div className={styles.listCardSub}>{total} banners total · Sorted by display order</div>
              </div>
              <div className={styles.filterBar}>
                <Segmented value={ownerFilter} onChange={v => { setOwnerFilter(v); setPage(1); }}
                  options={[
                    { label: 'All Types', value: '' },
                    { label: '🔵 System', value: 'ADMIN' },
                    { label: '🟠 Seller', value: 'SELLER' },
                  ]}
                />
                <Segmented value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }}
                  options={[
                    { label: 'All Status', value: 'ALL' },
                    { label: '⏳ Pending', value: 'PENDING_REVIEW' },
                    { label: '🟢 Running', value: 'RUNNING' },
                    { label: '✅ Approved', value: 'APPROVED' },
                  ]}
                />
              </div>
            </div>

            {ownerFilter === 'ADMIN' && (
              <div style={{ padding: '0 16px 12px' }}>
                <Alert type="info" showIcon
                  message="Use the ↑ ↓ buttons in the Order column to rearrange the display sequence of system banners on the homepage." />
              </div>
            )}

            <div className={styles.tableWrap}>
              <Table rowKey="_id" columns={columns} dataSource={banners} loading={loading}
                scroll={{ x: 1100 }}
                pagination={{ current: page, total, pageSize: 20, onChange: setPage, showSizeChanger: false }}
                locale={{ emptyText: <Empty description="No banners found" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                rowClassName={(rec) => rec.ownerType === 'ADMIN' ? '' : ''}
              />
            </div>
          </div>
        )}

        {/* ══════ CREATE WIZARD VIEW ══════ */}
        {view === 'create' && (
          <div className={styles.wizardLayout}>
            <div className={styles.wizardStepsCard}>
              <Steps current={currentStep} size="small"
                items={[
                  { title: 'Upload Image', icon: <InboxOutlined />},
                  { title: 'Hotspot & Content', icon: <AimOutlined /> },
                  { title: 'Configure & Publish', icon: <SendOutlined /> },
                ]}
              />
            </div>
            <div className={styles.wizardContent}>
              {currentStep === 0 && (
                <AdminStep1Upload imageUrl={imageUrl} setImageUrl={setImageUrl} onNext={() => setCurrentStep(1)} />
              )}
              {currentStep === 1 && (
                <AdminStep2Hotspot 
            imageUrl={imageUrl} 
            hotspots={hotspots} 
            setHotspots={setHotspots}
            linkMode={linkMode}
            setLinkMode={setLinkMode}
            bannerLink={bannerLink}
            setBannerLink={setBannerLink}
                  onBack={() => setCurrentStep(0)} onNext={() => setCurrentStep(2)} />
              )}
              {currentStep === 2 && (
                <AdminStep3Config imageUrl={imageUrl} hotspots={hotspots}
                  adminBanners={allBanners.filter(b => b.ownerType === 'ADMIN')}
                  calendar={calendar}
                  dateRange={dateRange} setDateRange={setDateRange}
                  order={order} setOrder={setOrder}
                  bannerStatus={bannerStatus} setBannerStatus={setBannerStatus}
                  bannerTitle={bannerTitle} setBannerTitle={setBannerTitle}
                  onBack={() => setCurrentStep(1)} onSubmit={handleWizardSubmit} submitting={submitting} />
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Reject Modal ── */}
      <Modal title="❌ Reject Seller Banner" open={!!rejectId}
        onOk={handleReject} onCancel={() => { setRejectId(null); rejectForm.resetFields(); }}
        okText="Confirm Reject & Refund Coins" okButtonProps={{ danger: true, loading: rejecting }} cancelText="Cancel">
        <Form form={rejectForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="rejectionReason" label="Rejection Reason"
            rules={[{ required: true, min: 5, message: 'Please enter a reason (min 5 characters)' }]}>
            <Input.TextArea rows={4} placeholder="e.g. Image violates policy, low quality, misleading content..." />
          </Form.Item>
        </Form>
        <Alert type="warning" showIcon
          message="The Seller's coins will be refunded immediately upon rejection." />
      </Modal>

      {/* ── Preview Drawer ── */}
      <Drawer title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#fa8c16,#f5222d)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EyeOutlined style={{ color: '#fff', fontSize: 14 }} />
          </div>
          <span>Banner Details</span>
        </div>
      } open={!!previewBanner} onClose={() => setPreviewBanner(null)} width={540}
        extra={previewBanner?.status === 'PENDING_REVIEW' && (
          <Space>
            <Button type="primary" icon={<CheckCircleOutlined />} loading={approving[previewBanner?._id]}
              style={{ background: '#22c55e', borderColor: '#22c55e' }}
              onClick={() => { handleApprove(previewBanner._id); setPreviewBanner(null); }}>Approve</Button>
            <Button danger icon={<CloseCircleOutlined />}
              onClick={() => { setRejectId(previewBanner._id); setPreviewBanner(null); }}>Reject</Button>
          </Space>
        )}>
        {previewBanner && (
          <div>
            <div className={styles.drawerPreview}
              style={{ backgroundImage: previewBanner.image ? `url(${previewBanner.image})` : undefined }} />

            <Divider style={{ margin: '12px 0' }} />

            {[
              { label: 'Type',       value: <span style={{ padding: '2px 10px', borderRadius: 20, background: previewBanner.ownerType === 'ADMIN' ? '#eff6ff' : '#fff7ed', color: previewBanner.ownerType === 'ADMIN' ? '#1677ff' : '#f97316', fontWeight: 700, fontSize: 12 }}>{previewBanner.ownerType === 'ADMIN' ? '🔵 System' : '🟠 Seller'}</span> },
              { label: 'Status',     value: <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: STATUS_CFG[previewBanner.status]?.bg, color: STATUS_CFG[previewBanner.status]?.text }}>{STATUS_CFG[previewBanner.status]?.label}</span> },
              { label: 'Order',      value: `#${previewBanner.order ?? 0}` },
              { label: 'Seller',     value: previewBanner.sellerId ? `${previewBanner.sellerId.fullName} · ${previewBanner.sellerId.email}` : 'Admin' },
              { label: 'Start Date', value: previewBanner.startDate ? dayjs(previewBanner.startDate).format('DD/MM/YYYY HH:mm') : '—' },
              { label: 'End Date',   value: previewBanner.endDate ? dayjs(previewBanner.endDate).format('DD/MM/YYYY HH:mm') : 'No expiry' },
              { label: 'Hotspots',   value: `${(previewBanner.hotspots || []).length} click zones` },
              { label: 'Views',      value: (previewBanner.metrics?.views || 0).toLocaleString() },
              { label: 'Clicks',     value: (previewBanner.metrics?.clicks || 0).toLocaleString() },
              { label: 'CTR',        value: `${previewBanner.ctr || '0.00'}%` },
            ].map(({ label, value }) => (
              <div key={label} className={styles.drawerInfoRow}>
                <Text type="secondary" style={{ fontSize: 13 }}>{label}</Text>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
              </div>
            ))}

            {previewBanner.rejectionReason && (
              <Alert type="error" showIcon style={{ marginTop: 12 }}
                message={<span><strong>Rejection Reason:</strong> {previewBanner.rejectionReason}</span>} />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AdminBannerAdsPage;
