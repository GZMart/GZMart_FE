import PropTypes from 'prop-types';
import { User } from 'lucide-react';
import styles from '@assets/styles/buyer/ProfilePage/ProfilePage.module.css';

const ProfileAccountTab = ({ t, formData, onChange, onSave }) => (
  <>
    <div className={styles.sectionHeader}>
      <User size={24} color="#111827" strokeWidth={2} />
      <h3 className={styles.sectionTitle}>{t('profile_page.account.title')}</h3>
    </div>

    <div className={styles.formSection}>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{t('profile_page.account.first_name')}</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName || ''}
          onChange={onChange}
          className={styles.formInput}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{t('profile_page.account.last_name')}</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName || ''}
          onChange={onChange}
          className={styles.formInput}
        />
      </div>

      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
        <label className={styles.formLabel}>{t('profile_page.account.email')}</label>
        <input
          type="email"
          name="email"
          value={formData.email || ''}
          onChange={onChange}
          className={styles.formInput}
          disabled
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{t('profile_page.account.phone')}</label>
        <input
          type="text"
          name="phone"
          value={formData.phone || ''}
          onChange={onChange}
          className={styles.formInput}
          placeholder="Enter phone number"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{t('profile_page.account.gender')}</label>
        <select
          name="gender"
          value={formData.gender || 'other'}
          onChange={onChange}
          className={styles.formInput}
        >
          <option value="male">{t('profile_page.account.gender_options.male')}</option>
          <option value="female">{t('profile_page.account.gender_options.female')}</option>
          <option value="other">{t('profile_page.account.gender_options.other')}</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{t('profile_page.account.dob')}</label>
        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth || ''}
          onChange={onChange}
          className={styles.formInput}
        />
      </div>

      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
        <label className={styles.formLabel}>{t('profile_page.account.about_me')}</label>
        <textarea
          name="aboutMe"
          value={formData.aboutMe || ''}
          onChange={onChange}
          className={styles.formInput}
          rows={4}
          placeholder={t('profile_page.account.about_me_placeholder')}
        />
      </div>
    </div>

    <div className={styles.formGroup}>
      <button className={styles.saveButton} onClick={onSave}>
        {t('profile_page.account.save_button')}
      </button>
    </div>
  </>
);

ProfileAccountTab.propTypes = {
  t: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    gender: PropTypes.string,
    dateOfBirth: PropTypes.string,
    aboutMe: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default ProfileAccountTab;
