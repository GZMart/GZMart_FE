import React, { useState, useEffect } from 'react';
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

const NotificationPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      if (!notificationAPI?.fetchNotifications) return;

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
  };

  const markAsRead = async (id) => {
    try {
      if (notificationAPI?.markAsRead) await notificationAPI.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (notificationAPI?.markAllAsRead) await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);

    const shopId = notification.relatedData?.shopId;
    const orderId = notification.relatedData?.orderId;

    switch (notification.type) {
      case 'ORDER':
        navigate(
          orderId
            ? `/buyer/profile?tab=orders&orderId=${encodeURIComponent(orderId)}`
            : '/buyer/profile?tab=orders'
        );
        break;
      case 'PROMOTION':
      case 'ANNOUNCEMENT':
        navigate(shopId ? `/shop/${shopId}` : '/deals');
        break;
      case 'VOUCHER':
        navigate(shopId ? `/shop/${shopId}` : '/deals');
        break;
      case 'FLASH_SALE':
        navigate('/deals');
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
    <div className="container py-4 mt-2 mb-5">
      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-12 col-md-3 col-lg-2">
          <div className="d-flex flex-column gap-2">
            {NOTIFICATION_CATEGORIES.map(({ id, labelKey, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="btn d-flex align-items-center gap-3 py-2 px-3 border-0 text-start"
                  style={{
                    backgroundColor: 'transparent',
                    color: isActive ? '#ee4d2d' : '#333',
                    fontWeight: isActive ? '500' : '400',
                    fontSize: '0.95rem',
                  }}
                >
                  <Icon size={18} color={isActive ? '#ee4d2d' : '#888'} />
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-12 col-md-9 col-lg-10">
          <div className="bg-white rounded-2 shadow-sm border border-light overflow-hidden">
            {/* Header */}
            <div className="d-flex justify-content-end align-items-center p-3 border-bottom bg-light">
              <button
                className="btn btn-sm btn-link text-decoration-none text-dark"
                onClick={handleMarkAllAsRead}
                style={{ fontSize: '0.9rem' }}
              >
                {t('notifications.mark_all_read')}
              </button>
            </div>

            {/* Notification list */}
            <div>
              {loading ? (
                <div className="p-5 text-center">
                  <div className="spinner-border text-primary" role="status">
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
                      backgroundColor: !notification.isRead ? '#fff0ec' : '#fff',
                      transition: 'background-color 0.15s, filter 0.15s',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleNotificationClick(notification)}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.97)')}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = '')}
                  >
                    {/* Icon / Image */}
                    <div className="flex-shrink-0" style={{ width: '72px', height: '72px' }}>
                      {notification.relatedData?.imageUrl ? (
                        <img
                          src={notification.relatedData.imageUrl}
                          alt=""
                          className="w-100 h-100 object-fit-cover rounded border"
                        />
                      ) : (
                        <div
                          className={`w-100 h-100 rounded d-flex align-items-center justify-content-center ${getIconBg(notification.type)}`}
                        >
                          {renderIcon(notification.type)}
                        </div>
                      )}
                    </div>

                    {/* Text content */}
                    <div className="flex-grow-1 ms-3" style={{ minWidth: 0 }}>
                      <h6
                        className="mb-1"
                        style={{ color: '#333', fontWeight: '500', fontSize: '1rem' }}
                      >
                        {notification.title}
                      </h6>
                      <p
                        className="mb-1 text-secondary"
                        style={{
                          fontSize: '0.88rem',
                          lineHeight: '1.4',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {notification.message}
                      </p>
                      <small className="text-secondary" style={{ fontSize: '0.8rem' }}>
                        {formatDate(notification.createdAt)}
                      </small>
                    </div>

                    {/* Unread indicator dot */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0 ms-3">
                        <div
                          className="rounded-circle bg-danger"
                          style={{ width: '10px', height: '10px' }}
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

export default NotificationPage;
