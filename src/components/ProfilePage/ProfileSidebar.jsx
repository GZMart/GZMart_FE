import {
  Bell,
  Camera,
  Check,
  ChevronDown,
  Coins,
  Edit2,
  Package,
  Store,
  User,
  X,
} from 'lucide-react';
import styles from '@assets/styles/ProfilePage/ProfilePage.module.css';

const ProfileSidebar = ({
  activeTab,
  onTabChange,
  showMyAccountDropdown,
  onToggleMyAccountDropdown,
  user,
  userAvatar,
  userDisplayName,
  fileInputRef,
  onImageChange,
  avatarFile,
  isSavingAvatar,
  onSaveAvatar,
  onCancelAvatar,
  onBecomeSeller,
}) => (
  <div className={styles.sidebarNav}>
    <div className={styles.avatarHeader}>
      <div className={styles.avatarSection}>
        <div className={styles.avatarImageWrap}>
          <img src={userAvatar} alt={userDisplayName} className={styles.avatar} />
          <button
            className={styles.cameraButton}
            onClick={() => fileInputRef.current?.click()}
            title="Change avatar"
          >
            <Camera size={12} strokeWidth={2} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImageChange}
            style={{ display: 'none' }}
            accept="image/*"
          />
        </div>
        {avatarFile && (
          <div className={styles.avatarActionRow}>
            <button
              className={styles.saveAvatarBtn}
              onClick={onSaveAvatar}
              disabled={isSavingAvatar}
            >
              <Check size={11} strokeWidth={3} />
              {isSavingAvatar ? 'Saving...' : 'Save'}
            </button>
            <button
              className={styles.cancelAvatarBtn}
              onClick={onCancelAvatar}
              disabled={isSavingAvatar}
            >
              <X size={11} strokeWidth={3} />
              Cancel
            </button>
          </div>
        )}
      </div>
      <div className={styles.userInfo}>
        <h3 className={styles.userName}>{userDisplayName}</h3>
        <button className={styles.editProfileBtn} onClick={() => onTabChange('account')}>
          <Edit2 size={14} strokeWidth={2} />
          Edit Profile
        </button>
      </div>
    </div>

    <div className={styles.navList}>
      <div
        className={`${styles.navItem} ${activeTab === 'notifications' ? styles.navItemActive : ''}`}
        onClick={() => onTabChange('notifications')}
      >
        <Bell className={styles.navIcon} size={20} strokeWidth={2} />
        <span className={styles.navText}>Notifications</span>
      </div>

      <div className={styles.navItemGroup}>
        <div
          className={`${styles.navItem} ${styles.navItemParent} ${activeTab === 'account' || activeTab === 'address' ? styles.navItemActive : ''}`}
          onClick={onToggleMyAccountDropdown}
        >
          <User className={styles.navIcon} size={20} strokeWidth={2} />
          <span className={styles.navText}>My Account</span>
          <ChevronDown
            className={`${styles.navArrow} ${showMyAccountDropdown ? styles.navArrowExpanded : ''}`}
            size={16}
            strokeWidth={2}
          />
        </div>

        {showMyAccountDropdown && (
          <div className={styles.navDropdown}>
            <div
              className={`${styles.navSubItem} ${activeTab === 'account' ? styles.navSubItemActive : ''}`}
              onClick={() => onTabChange('account')}
            >
              <span className={styles.navText}>Profile</span>
            </div>
            <div
              className={`${styles.navSubItem} ${activeTab === 'address' ? styles.navSubItemActive : ''}`}
              onClick={() => onTabChange('address')}
            >
              <span className={styles.navText}>Address</span>
            </div>
          </div>
        )}
      </div>

      <div
        className={`${styles.navItem} ${activeTab === 'orders' ? styles.navItemActive : ''}`}
        onClick={() => onTabChange('orders')}
      >
        <Package className={styles.navIcon} size={20} strokeWidth={2} />
        <span className={styles.navText}>My Orders</span>
      </div>

      <div
        className={`${styles.navItem} ${activeTab === 'coin' ? styles.navItemActive : ''}`}
        onClick={() => onTabChange('coin')}
      >
        <Coins className={styles.navIcon} size={20} strokeWidth={2} />
        <span className={styles.navText}>GZMart Coin</span>
      </div>

      {user?.role === 'buyer' && (
        <div className={styles.navItem} onClick={onBecomeSeller}>
          <Store className={styles.navIcon} size={20} strokeWidth={2} />
          <span className={styles.navText}>Become a Seller</span>
        </div>
      )}
    </div>
  </div>
);

export default ProfileSidebar;
