import PropTypes from 'prop-types';
import { Edit2, MapPin, Plus, Trash2 } from 'lucide-react';
import styles from '@assets/styles/buyer/ProfilePage/ProfilePage.module.css';

const ProfileAddressTab = ({
  t,
  addresses,
  onAddAddress,
  onSetDefaultAddress,
  onEditAddress,
  onDeleteAddress,
  formatAddressString,
}) => (
  <div>
    <div className={styles.addressHeader}>
      <h3 className={styles.addressTitle}>
        <MapPin size={24} color="#111827" strokeWidth={2} />
        {t('profile_page.address.title')}
      </h3>
      <button
        className={styles.addAddressBtn}
        title={t('profile_page.address.title')}
        onClick={onAddAddress}
      >
        <Plus size={20} strokeWidth={2} />
      </button>
    </div>

    <div className={styles.addressGrid}>
      {addresses.length === 0 && (
        <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#666' }}>
          {t('profile_page.address.empty_state')}
        </p>
      )}
      {addresses.map((addr) => (
        <div
          key={addr._id}
          className={`${styles.addressCard} ${addr.isDefault ? styles.addressCardDefault : ''}`}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardType}>
              {addr.isDefault
                ? t('profile_page.address.default_badge')
                : t('profile_page.address.address_badge')}
            </span>
            <div
              className={styles.cardActions}
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              {!addr.isDefault && (
                <span
                  className={styles.setDefaultLink}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetDefaultAddress(addr._id);
                  }}
                  title={t('profile_page.address.set_default')}
                >
                  {t('profile_page.address.set_default')}
                </span>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={styles.iconActionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditAddress(addr);
                  }}
                  title={t('profile_page.address.edit_tooltip')}
                >
                  <Edit2 size={18} strokeWidth={2} />
                </button>
                <button
                  className={styles.iconActionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAddress(addr._id);
                  }}
                  title={t('profile_page.address.delete_tooltip')}
                  style={{ color: '#DC2626' }}
                >
                  <Trash2 size={18} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
          <div className={styles.cardBody}>
            <span className={styles.cardName}>{addr.receiverName}</span>
            <p style={{ margin: '0.5rem 0 0', lineHeight: '1.6', color: '#4B5563' }}>
              {addr.phone}
            </p>
            <p style={{ margin: '0.25rem 0 0', lineHeight: '1.6', color: '#6B7280' }}>
              {formatAddressString(addr)}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

ProfileAddressTab.propTypes = {
  t: PropTypes.func.isRequired,
  addresses: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      isDefault: PropTypes.bool,
      receiverName: PropTypes.string,
      phone: PropTypes.string,
      // You can add more specific fields here if needed based on what formatAddressString uses
    })
  ).isRequired,
  onAddAddress: PropTypes.func.isRequired,
  onSetDefaultAddress: PropTypes.func.isRequired,
  onEditAddress: PropTypes.func.isRequired,
  onDeleteAddress: PropTypes.func.isRequired,
  formatAddressString: PropTypes.func.isRequired,
};

export default ProfileAddressTab;
