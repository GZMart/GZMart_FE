import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@store/slices/authSlice';
import socketService from '@services/socket/socketService';
import { notificationAPI } from '@services/api';

const NotificationBell = ({ triggerClassName = '', dropdownWidth = '400px' }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (notificationAPI && notificationAPI.fetchUnreadCount) {
        fetchUnreadCount();
      }

      try {
        socketService.connect();

        const handleNewNotification = (notification) => {
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        };

        socketService.on('new_notification', handleNewNotification);

        return () => {
          socketService.off('new_notification', handleNewNotification);
        };
      } catch (e) {
        console.error(e);
      }
    }
  }, [isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      if (!notificationAPI || !notificationAPI.fetchUnreadCount) {
        return;
      }
      const response = await notificationAPI.fetchUnreadCount();
      if (response?.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread notification count', error);
    }
  };

  const fetchNotifications = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      if (!notificationAPI || !notificationAPI.fetchNotifications) {
        setLoading(false);
        return;
      }
      const response = await notificationAPI.fetchNotifications({ limit: 10 });
      if (response?.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDropdown = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!showDropdown) {
      fetchNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      if (notificationAPI && notificationAPI.markAsRead) {
        await notificationAPI.markAsRead(id);
      }
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead({ stopPropagation: () => {} }, notification._id);
    }

    const shopId = notification.relatedData?.shopId;

    switch (notification.type) {
      case 'ORDER':
        navigate(
          notification.relatedData?.orderId
            ? `/buyer/orders/${notification.relatedData.orderId}`
            : '/buyer/orders'
        );
        break;
      case 'PROMOTION':
      case 'ANNOUNCEMENT':
      case 'VOUCHER':
        navigate(shopId ? `/shop/${shopId}` : '/deals');
        break;
      case 'FLASH_SALE':
        navigate('/deals');
        break;
      default:
        break;
    }

    setShowDropdown(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }} ref={dropdownRef}>
      <button
        type="button"
        className={triggerClassName}
        onClick={handleToggleDropdown}
        aria-label={t('notifications.title')}
        style={!triggerClassName ? {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          position: 'relative',
        } : undefined}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              minWidth: '16px',
              height: '16px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '9px',
              fontWeight: 700,
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #fff',
              padding: '0 3px',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: dropdownWidth,
            zIndex: 1050,
            cursor: 'default',
            background: '#fff',
            border: '1px solid #e8ecf0',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            padding: '12px 16px 10px',
            borderBottom: '1px solid #f1f3f5',
            background: '#fdfdfd',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', letterSpacing: '0.01em' }}>
              {t('notifications.recent')}
            </span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                {t('notifications.loading')}
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                {t('notifications.empty')}
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 14px',
                    borderBottom: '1px solid #f1f3f5',
                    backgroundColor: !notification.isRead ? '#fffbf0' : '#fff',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = !notification.isRead ? '#fff3cc' : '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = !notification.isRead ? '#fffbf0' : '#fff';
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
                    {notification.relatedData?.imageUrl ? (
                      <img
                        src={notification.relatedData.imageUrl}
                        alt="Related"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '8px',
                        background: '#f1f5f9', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#94a3b8',
                      }}>
                        <Bell size={16} />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', color: '#1e293b', marginBottom: '3px', lineHeight: '1.4',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {notification.message}
                    </div>
                    {notification.relatedData?.images && notification.relatedData.images.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', marginTop: '4px' }}>
                        {notification.relatedData.images.slice(0, 3).map((img, idx) => (
                          <img key={idx} src={img} alt="Promo" style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '4px' }} />
                        ))}
                      </div>
                    )}
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {!notification.isRead && (
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: '2px', flexShrink: 0 }}>
                      <div style={{ width: '7px', height: '7px', background: '#1a56db', borderRadius: '50%' }} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 16px',
              borderTop: '1px solid #f1f3f5',
              background: '#f8fafc',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#1a56db',
              textAlign: 'center',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#eef2ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
            }}
            onClick={() => {
              setShowDropdown(false);
              navigate('/buyer/notifications');
            }}
          >
            {t('notifications.view_all')}
          </button>
        </div>
      )}
    </div>
  );
};

NotificationBell.propTypes = {
  triggerClassName: PropTypes.string,
  dropdownWidth: PropTypes.string,
};

export default NotificationBell;
