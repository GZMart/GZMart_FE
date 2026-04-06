import React, { useState, useEffect } from 'react';
import notificationAPI from '@services/api/notificationAPI';
import axiosClient from '@services/axiosClient';
import { Megaphone, Bell, Tag, Zap, CheckCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const ANNOUNCEMENT_TYPES = [
  { value: 'ANNOUNCEMENT', label: 'Thông báo chung', icon: '📢', color: '#6c757d' },
  { value: 'PROMOTION', label: 'Khuyến mãi', icon: '🎉', color: '#B13C36' },
  { value: 'VOUCHER', label: 'Phát hành Voucher', icon: '🎟️', color: '#198754' },
  { value: 'FLASH_SALE', label: 'Flash Sale', icon: '⚡', color: '#B13C36' },
];

const ShopNotificationsPage = () => {
  const [form, setForm] = useState({ title: '', message: '', type: 'ANNOUNCEMENT' });
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [followerCount, setFollowerCount] = useState(null);

  // Fetch follower count of self using the profile API
  useEffect(() => {
    const fetchFollowerCount = async () => {
      try {
        const res = await axiosClient.get('/api/users/profile');
        const count = res?.data?.followersCount ?? res?.data?.followerCount ?? null;
        setFollowerCount(count);
      } catch {
        // Not critical — just hide the count
      }
    };
    fetchFollowerCount();
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung.');
      return;
    }

    setSending(true);
    setLastResult(null);
    try {
      const resp = await notificationAPI.sendAnnouncement(form);
      const count = resp?.data?.count ?? 0;
      setLastResult({ count, success: true });
      toast.success(
        count > 0
          ? `✅ Đã gửi tới ${count} người theo dõi!`
          : 'Bạn chưa có người theo dõi nào'
      );
      setForm(prev => ({ ...prev, title: '', message: '' }));
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gửi thông báo thất bại';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const selectedType = ANNOUNCEMENT_TYPES.find(t => t.value === form.type) || ANNOUNCEMENT_TYPES[0];

  return (
    <div className="container-fluid py-4 px-4">
      {/* Header */}
      <div className="mb-4">
        <nav aria-label="breadcrumb" className="mb-1">
          <span className="text-muted small">Seller / Notifications</span>
        </nav>
        <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
          <Megaphone size={22} className="text-primary" />
          Gửi thông báo đến Followers
        </h4>
        <p className="text-muted small mb-0">
          Followers của shop bạn sẽ nhận được thông báo ngay lập tức qua chuông thông báo.
        </p>
      </div>

      <div className="row g-4">
        {/* Form */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-3">Tạo thông báo</h6>

              <form onSubmit={handleSend}>
                {/* Type selector */}
                <div className="mb-3">
                  <label className="form-label fw-medium small text-muted">Loại thông báo</label>
                  <div className="d-flex flex-wrap gap-2">
                    {ANNOUNCEMENT_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, type: type.value }))}
                        className="btn btn-sm d-flex align-items-center gap-1"
                        style={{
                          border: `2px solid ${form.type === type.value ? type.color : 'var(--color-border)'}`,
                            backgroundColor: form.type === type.value ? `${type.color}15` : 'var(--color-white)',
                            color: form.type === type.value ? type.color : 'var(--color-gray-700)',
                          fontWeight: form.type === type.value ? '600' : '400',
                          borderRadius: '8px',
                          padding: '6px 14px',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span>{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="mb-3">
                  <label htmlFor="notif-title" className="form-label fw-medium small text-muted">
                    Tiêu đề <span className="text-danger">*</span>
                  </label>
                  <input
                    id="notif-title"
                    type="text"
                    name="title"
                    className="form-control"
                    placeholder={`VD: ${selectedType.icon} Flash Sale hôm nay giảm đến 50%!`}
                    value={form.title}
                    onChange={handleChange}
                    maxLength={100}
                    required
                  />
                  <div className="text-end text-muted small mt-1">{form.title.length}/100</div>
                </div>

                {/* Message */}
                <div className="mb-4">
                  <label htmlFor="notif-message" className="form-label fw-medium small text-muted">
                    Nội dung <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="notif-message"
                    name="message"
                    className="form-control"
                    rows={4}
                    placeholder="Mô tả chi tiết về chương trình, voucher hoặc thông báo của bạn..."
                    value={form.message}
                    onChange={handleChange}
                    maxLength={500}
                    required
                    style={{ resize: 'vertical' }}
                  />
                  <div className="text-end text-muted small mt-1">{form.message.length}/500</div>
                </div>

                {/* Send button */}
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={sending}
                  style={{ padding: '10px', borderRadius: '8px', fontWeight: '600' }}
                >
                  {sending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Megaphone size={16} className="me-2" />
                      Gửi đến tất cả Followers
                      {followerCount !== null && ` (${followerCount} người)`}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Info sidebar */}
        <div className="col-12 col-lg-5">
          {/* Follower count card */}
          <div
            className="card border-0 mb-3 text-white"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center"
                style={{ width: 52, height: 52, flexShrink: 0 }}>
                <Users size={26} />
              </div>
              <div>
                <div className="fw-bold fs-3 lh-1 mb-1">
                  {followerCount !== null ? followerCount.toLocaleString('vi-VN') : '—'}
                </div>
                <div className="small opacity-85">Người đang theo dõi shop của bạn</div>
              </div>
            </div>
          </div>

          {/* Success result */}
          {lastResult && (
            <div className="alert border-0 d-flex align-items-center gap-2 mb-3"
              style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
              <CheckCircle size={18} />
              <span className="small fw-medium">
                Đã gửi thành công đến <strong>{lastResult.count}</strong> người theo dõi!
              </span>
            </div>
          )}

          {/* Tips */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2">
                <Bell size={16} className="text-warning" />
                Mẹo gửi thông báo hiệu quả
              </h6>
              <ul className="list-unstyled mb-0 small text-muted d-flex flex-column gap-2">
                <li className="d-flex align-items-start gap-2">
                  <Tag size={14} className="text-success mt-1 flex-shrink-0" />
                  <span>Dùng emoji trong tiêu đề để thu hút sự chú ý <strong>⚡🎟️🎉</strong></span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <Zap size={14} className="text-warning mt-1 flex-shrink-0" />
                  <span>Thêm thời gian kết thúc để tạo cảm giác cấp bách: <em>"Chỉ còn 24 giờ!"</em></span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <Bell size={14} className="text-primary mt-1 flex-shrink-0" />
                  <span>Voucher và Flash Sale sẽ tự động thông báo khi bạn tạo chúng</span>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <Megaphone size={14} className="text-danger mt-1 flex-shrink-0" />
                  <span>Không gửi quá 1–2 thông báo/ngày để tránh gây phiền</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopNotificationsPage;
