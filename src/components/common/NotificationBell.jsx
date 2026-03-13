import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@store/slices/authSlice';
import socketService from '@services/socket/socketService';
import { notificationAPI } from '@services/api';
import { PUBLIC_ROUTES } from '@constants/routes';

const NotificationBell = () => {
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
      } catch(e) { console.error(e) }
    }
  }, [isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      if (!notificationAPI || !notificationAPI.fetchUnreadCount) return;
      const response = await notificationAPI.fetchUnreadCount();
      if (response?.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread notification count', error);
    }
  };

  const fetchNotifications = async () => {
    if (loading) return;
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
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      if (notificationAPI && notificationAPI.markAllAsRead) {
        await notificationAPI.markAllAsRead();
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead({ stopPropagation: () => {} }, notification._id);
    }
    
    if (notification.type === 'ORDER') {
      if (notification.relatedData?.orderId) {
         navigate(`/buyer/orders/${notification.relatedData.orderId}`);
      } else {
         navigate('/buyer/orders');
      }
    } else if (notification.type === 'PROMOTION') {
       navigate(PUBLIC_ROUTES.DEALS);
    }
    
    setShowDropdown(false);
  };

  return (
    <div className="position-relative d-inline-flex" ref={dropdownRef}>
      <div 
        className="d-flex align-items-center gap-1 cursor-pointer"
        onClick={handleToggleDropdown}
      >
        <div className="position-relative d-flex align-items-center justify-content-center">
          <Bell size={14} />
          {unreadCount > 0 && (
            <span 
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: '0.45rem', padding: '0.15rem 0.25rem', transform: 'translate(-40%, -40%)' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <span>{t('notifications.title')}</span>
      </div>

      {showDropdown && (
        <div 
          className="position-absolute bg-white border rounded shadow-lg text-start"
          style={{ 
            top: 'calc(100% + 10px)', 
            right: 0, 
            width: '400px', 
            zIndex: 1050,
            cursor: 'default'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-dark" style={{ backgroundColor: '#fdfdfd' }}>
            <span className="fw-bold" style={{ fontSize: '1rem' }}>Thông Báo Mới Nhận</span>
          </div>
          
          <div className="overflow-auto text-dark" style={{ maxHeight: '450px' }}>
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-muted" style={{ fontSize: '0.9rem' }}>{t('notifications.loading')}</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted" style={{ fontSize: '0.9rem' }}>{t('notifications.empty')}</div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification._id}
                  className="d-flex align-items-start p-2 border-bottom position-relative"
                  style={{ 
                    backgroundColor: !notification.isRead ? '#fff0ec' : '#fff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0" style={{ width: '50px', height: '50px' }}>
                     {notification.relatedData?.imageUrl ? (
                        <img 
                          src={notification.relatedData.imageUrl} 
                          alt="Related" 
                          className="w-100 h-100 object-fit-cover rounded" 
                        />
                     ) : (
                        <div className="w-100 h-100 rounded d-flex align-items-center justify-content-center bg-light text-secondary">
                          <Bell size={20} />
                        </div>
                     )}
                  </div>
                  
                  <div className="flex-grow-1 ms-2" style={{ minWidth: 0 }}>
                    <div className="text-dark mb-1" style={{ fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {notification.message}
                    </div>
                    {notification.relatedData?.images && notification.relatedData.images.length > 0 && (
                       <div className="d-flex gap-1 mb-1 mt-1">
                          {notification.relatedData.images.slice(0, 3).map((img, idx) => (
                             <img key={idx} src={img} alt="Promo" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                          ))}
                       </div>
                    )}
                    <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </small>
                  </div>
                  {!notification.isRead && (
                    <div className="ms-2 d-flex align-items-center">
                      <div className="rounded-circle bg-primary" style={{ width: '8px', height: '8px' }}></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div 
             className="border-top p-2 text-center bg-light" 
             style={{ borderBottomLeftRadius: '0.25rem', borderBottomRightRadius: '0.25rem', cursor: 'pointer' }}
             onClick={() => {
                setShowDropdown(false);
                navigate('/buyer/notifications');
             }}
          >
             <span className="text-primary fw-medium" style={{ fontSize: '0.85rem' }}>{t('notifications.view_all')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
