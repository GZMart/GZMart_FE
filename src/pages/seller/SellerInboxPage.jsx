import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, ShoppingBag, Tag, Wallet, Smartphone, Zap, Megaphone } from 'lucide-react';
import { notificationAPI } from '@services/api';
import { useNavigate } from 'react-router-dom';

const NOTIFICATION_CATEGORIES = [
  { id: 'all', labelKey: 'notifications.categories.all', icon: Bell },
  { id: 'order', labelKey: 'notifications.categories.order', icon: ShoppingBag },
  { id: 'promotion', labelKey: 'notifications.categories.promotion', icon: Tag },
  { id: 'flash_sale', labelKey: 'notifications.categories.flash_sale', icon: Zap },
  { id: 'voucher', labelKey: 'notifications.categories.voucher', icon: Tag },
  { id: 'wallet', labelKey: 'notifications.categories.wallet', icon: Wallet },
  { id: 'system', labelKey: 'notifications.categories.system', icon: Smartphone },
];

const TYPE_MAP = {
  order: 'ORDER',
  promotion: 'PROMOTION',
  flash_sale: 'FLASH_SALE',
  voucher: 'VOUCHER',
  system: 'SYSTEM',
};

const SellerInboxPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      if (!notificationAPI?.fetchNotifications) {
        return;
      }

      const params = { limit: 50 };
      if (activeTab !== 'all' && TYPE_MAP[activeTab]) {
        params.type = TYPE_MAP[activeTab];
      }

      const response = await notificationAPI.fetchNotifications(params);
      if (response?.success) {
        let fetchedNotifs = response.data.notifications || [];
        // Client-side filter as fallback
        if (activeTab !== 'all' && TYPE_MAP[activeTab]) {
          fetchedNotifs = fetchedNotifs.filter(
            (n) => n.type === TYPE_MAP[activeTab] || (!n.type && TYPE_MAP[activeTab] === 'SYSTEM')
          );
        }
        setNotifications(fetchedNotifs);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      if (notificationAPI?.markAsRead) {
        await notificationAPI.markAsRead(id);
      }
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (notificationAPI?.markAllAsRead) {
        await notificationAPI.markAllAsRead();
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    const shopId = notification.relatedData?.shopId;
    const orderId = notification.relatedData?.orderId;

    switch (notification.type) {
      case 'ORDER':
        navigate(
          orderId
            ? `/seller/orders/${encodeURIComponent(orderId)}`
            : '/seller/orders'
        );
        break;
      case 'PROMOTION':
      case 'ANNOUNCEMENT':
        navigate('/seller/promotions');
        break;
      case 'VOUCHER':
        navigate('/seller/vouchers');
        break;
      case 'FLASH_SALE':
        navigate('/seller/dashboard');
        break;
      default:
        // No navigation for SYSTEM etc.
        break;
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingBag size={24} className="text-white" />;
      case 'PROMOTION':
        return <Tag size={24} className="text-white" />;
      case 'VOUCHER':
        return <Tag size={24} className="text-white" />;
      case 'FLASH_SALE':
        return <Zap size={24} className="text-white" />;
      case 'ANNOUNCEMENT':
        return <Megaphone size={24} className="text-white" />;
      default:
        return <Bell size={24} className="text-white" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'ORDER':
        return 'bg-info';
      case 'PROMOTION':
        return 'bg-primary';
      case 'VOUCHER':
        return 'bg-success';
      case 'FLASH_SALE':
        return 'bg-danger';
      case 'ANNOUNCEMENT':
        return 'bg-secondary';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className="container-fluid py-4 px-4">
      {/* Header */}
      <div className="mb-4">
        <nav aria-label="breadcrumb" className="mb-1">
          <span className="text-muted small">Seller / Notification</span>
        </nav>
        <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: '#1a56db' }}>
          <Bell size={22} />
          Notification
        </h4>
        <p className="text-muted small mb-0">
          Danh sách tất cả thông báo bạn nhận được từ hệ thống.
        </p>
      </div>

      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-12 col-md-3 col-lg-2">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-2 d-flex flex-column gap-1">
              {NOTIFICATION_CATEGORIES.map(({ id, labelKey, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="btn d-flex align-items-center gap-3 py-2 px-3 border-0 text-start w-100"
                    style={{
                      backgroundColor: isActive ? '#eef2ff' : 'transparent',
                      color: isActive ? '#1a56db' : '#555',
                      fontWeight: isActive ? '600' : '500',
                      fontSize: '0.9rem',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={18} color={isActive ? '#1a56db' : '#888'} />
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-12 col-md-9 col-lg-10">
          <div className="card border-0 shadow-sm overflow-hidden" style={{ minHeight: '500px' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-white">
              <h6 className="fw-semibold mb-0">Notification</h6>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleMarkAllAsRead}
                style={{ fontSize: '0.85rem' }}
              >
                {t('notifications.mark_all_read')}
              </button>
            </div>

            {/* Notification list */}
            <div>
              {loading ? (
                <div className="p-5 text-center">
                  <div className="spinner-border" style={{ color: '#1a56db' }} role="status">
                    <span className="visually-hidden">{t('notifications.loading')}</span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-5 text-center text-muted d-flex flex-column align-items-center">
                  <div className="bg-light rounded-circle p-4 mb-3">
                    <Bell size={48} className="text-secondary opacity-50" />
                  </div>
                  <h5>{t('notifications.empty')}</h5>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="d-flex align-items-center p-3 border-bottom"
                    style={{
                      backgroundColor: !notification.isRead ? '#f8f9fa' : '#fff',
                      transition: 'background-color 0.15s',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleNotificationClick(notification)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f3f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = !notification.isRead ? '#f8f9fa' : '#fff')}
                  >
                    {/* Icon / Image */}
                    <div className="flex-shrink-0" style={{ width: '50px', height: '50px' }}>
                      {notification.relatedData?.imageUrl ? (
                        <img
                          src={notification.relatedData.imageUrl}
                          alt=""
                          className="w-100 h-100 object-fit-cover rounded"
                        />
                      ) : (
                        <div
                          className={`w-100 h-100 rounded d-flex align-items-center justify-content-center text-white ${getIconBg(notification.type)}`}
                        >
                          {renderIcon(notification.type)}
                        </div>
                      )}
                    </div>

                    {/* Text content */}
                    <div className="flex-grow-1 ms-3" style={{ minWidth: 0 }}>
                      <h6
                        className="mb-1"
                        style={{ color: '#2b2b2b', fontWeight: !notification.isRead ? '600' : '500', fontSize: '0.95rem' }}
                      >
                        {notification.title}
                      </h6>
                      <p
                        className="mb-1 text-secondary"
                        style={{
                          fontSize: '0.85rem',
                          lineHeight: '1.4',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          fontWeight: !notification.isRead ? '500' : '400',
                          color: !notification.isRead ? '#495057' : '#6c757d',
                        }}
                      >
                        {notification.message}
                      </p>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {formatDate(notification.createdAt)}
                      </small>
                    </div>

                    {/* Unread indicator dot */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0 ms-3">
                        <div
                          className="rounded-circle"
                          style={{ width: '8px', height: '8px', backgroundColor: '#1a56db' }}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerInboxPage;

