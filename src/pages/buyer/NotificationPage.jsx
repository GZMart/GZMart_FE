import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Clock, ShoppingBag, Tag, Wallet, Smartphone, ChevronDown, Check } from 'lucide-react';
import { notificationAPI } from '@services/api';
import { useNavigate } from 'react-router-dom';
import { PUBLIC_ROUTES } from '@constants/routes';

// Dummy categories based on screenshot
const NOTIFICATION_CATEGORIES = [
  { id: 'all', labelKey: 'notifications.categories.all', icon: Bell },
  { id: 'order', labelKey: 'notifications.categories.order', icon: ShoppingBag },
  { id: 'promotion', labelKey: 'notifications.categories.promotion', icon: Tag },
  { id: 'wallet', labelKey: 'notifications.categories.wallet', icon: Wallet },
  { id: 'system', labelKey: 'notifications.categories.system', icon: Smartphone },
];

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
      if (notificationAPI && notificationAPI.fetchNotifications) {
        // Here you could pass `type: activeTab` to API if supported.
        const params = { limit: 50 };
        if (activeTab !== 'all') {
           // Mapping tabs to our backend enum types 
           // 'ORDER', 'SYSTEM', 'PROMOTION', 'OTHER' string values
           const typeMap = {
             'order': 'ORDER',
             'promotion': 'PROMOTION',
             'system': 'SYSTEM',
           };
           if (typeMap[activeTab]) {
             params.type = typeMap[activeTab];
           }
        }

        const response = await notificationAPI.fetchNotifications(params);
        if (response?.success) {
          // If backend doesn't support type filtering yet, we filter on frontend for now
          let fetchedNotifs = response.data.notifications || [];
          
          if (activeTab !== 'all') {
             const typeMap = {
               'order': 'ORDER',
               'promotion': 'PROMOTION',
               'system': 'SYSTEM',
             };
             if (typeMap[activeTab]) {
                fetchedNotifs = fetchedNotifs.filter(n => n.type === typeMap[activeTab] || (!n.type && typeMap[activeTab] === 'SYSTEM'));
             }
          }

          setNotifications(fetchedNotifs);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, currentStatus) => {
    if (currentStatus) return;
    
    try {
      if (notificationAPI && notificationAPI.markAsRead) {
        await notificationAPI.markAsRead(id);
      }
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (notificationAPI && notificationAPI.markAllAsRead) {
        await notificationAPI.markAllAsRead();
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id, false);
    }
    
    if (notification.type === 'ORDER') {
      navigate('/buyer/orders');
    } else if (notification.type === 'PROMOTION') {
       navigate(PUBLIC_ROUTES.DEALS);
    }
  };

  const formatDate = (dateString) => {
     const d = new Date(dateString);
     return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  };

  const renderIcon = (type) => {
    switch (type) {
       case 'ORDER': return <ShoppingBag size={24} className="text-white" />;
       case 'PROMOTION': return <Tag size={24} className="text-white" />;
       default: return <Bell size={24} className="text-white" />;
    }
  };
  
  const getIconColor = (type) => {
     switch(type) {
       case 'ORDER': return 'bg-info';
       case 'PROMOTION': return 'bg-warning';
       default: return 'bg-primary';
     }
  }

  return (
    <div className="container py-4 mt-2 mb-5">
      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-12 col-md-3 col-lg-2">
           <div className="d-flex flex-column gap-2">
              {NOTIFICATION_CATEGORIES.map(category => {
                 const Icon = category.icon;
                 const isActive = activeTab === category.id;
                 return (
                    <button
                       key={category.id}
                       onClick={() => setActiveTab(category.id)}
                       className={`btn d-flex align-items-center gap-3 py-2 px-3 border-0 text-start`}
                       style={{ 
                          backgroundColor: 'transparent',
                          color: isActive ? '#ee4d2d' : '#333',
                          fontWeight: isActive ? '500' : '400',
                          fontSize: '0.95rem'
                       }}
                    >
                       <Icon 
                          size={18} 
                          color={isActive ? '#ee4d2d' : '#888'} 
                       />
                       {t(category.labelKey)}
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

             {/* List */}
             <div>
                {loading ? (
                  <div className="p-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
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
                  <div>
                    {notifications.map((notification) => (
                      <div 
                        key={notification._id}
                        className="d-flex align-items-start p-3 border-bottom cursor-pointer position-relative"
                        style={{ 
                           backgroundColor: !notification.isRead ? '#fff0ec' : '#fff',
                           transition: 'background-color 0.2s'
                        }}
                        onClick={() => handleNotificationClick(notification)}
                      >
                         {/* Image/Icon Container */}
                         <div className="flex-shrink-0" style={{ width: '80px', height: '80px' }}>
                            {notification.relatedData?.imageUrl ? (
                               <img 
                                 src={notification.relatedData.imageUrl} 
                                 alt="Related" 
                                 className="w-100 h-100 object-fit-cover rounded border" 
                               />
                            ) : (
                               <div className={`w-100 h-100 rounded d-flex align-items-center justify-content-center ${getIconColor(notification.type)}`}>
                                  {renderIcon(notification.type)}
                               </div>
                            )}
                         </div>

                         {/* Content Container */}
                         <div className="flex-grow-1 ms-3">
                            <h6 className="mb-2" style={{ color: '#333', fontWeight: '500', fontSize: '1rem' }}>
                               {notification.title}
                            </h6>
                            <p className="mb-2 text-secondary" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                               {notification.message}
                            </p>
                            <div className="d-flex align-items-center text-secondary" style={{ fontSize: '0.85rem' }}>
                               {formatDate(notification.createdAt)}
                               <ChevronDown size={14} className="ms-1" />
                            </div>
                         </div>

                         {/* Action Button */}
                         <div className="flex-shrink-0 ms-3 d-none d-sm-block mt-3">
                            <button 
                               className="btn btn-sm btn-outline-secondary px-3 py-1 bg-white"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleNotificationClick(notification);
                               }}
                            >
                               {t('notifications.view_details')}
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
