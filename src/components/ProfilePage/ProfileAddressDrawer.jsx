import { Form, Offcanvas } from 'react-bootstrap';
import { X } from 'lucide-react';
import styles from '@assets/styles/ProfilePage/ProfilePage.module.css';

const ProfileAddressDrawer = ({
  show,
  onHide,
  editingAddress,
  t,
  addressForm,
  onAddressFormChange,
  onProvinceChange,
  provinces,
  wards,
  onWardChange,
  onSaveAddress,
}) => (
  <Offcanvas show={show} onHide={onHide} placement="end" className={styles.addressDrawer}>
    <div className={styles.drawerHeader}>
      <h4 className={styles.modalTitle}>
        {editingAddress
          ? t('profile_page.address.modal.title_edit')
          : t('profile_page.address.modal.title_add')}
      </h4>
      <button className={styles.modalCloseBtn} onClick={onHide}>
        <X size={24} strokeWidth={2} />
      </button>
    </div>

    <Offcanvas.Body className={styles.drawerBody}>
      <Form>
        <div className={styles.modalFormGroup}>
          <label className={styles.modalLabel}>
            {t('profile_page.address.modal.receiver_name')}
          </label>
          <input
            type="text"
            name="receiverName"
            value={addressForm.receiverName}
            onChange={onAddressFormChange}
            placeholder={t('profile_page.address.modal.receiver_name_placeholder')}
            className={styles.modalInput}
          />
        </div>
        <div className={styles.modalFormGroup}>
          <label className={styles.modalLabel}>{t('profile_page.address.modal.phone')}</label>
          <input
            type="text"
            name="phone"
            value={addressForm.phone}
            onChange={onAddressFormChange}
            placeholder={t('profile_page.address.modal.phone_placeholder')}
            className={styles.modalInput}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className={styles.modalFormGroup}>
            <label className={styles.modalLabel}>{t('profile_page.address.modal.province')}</label>
            <select
              name="provinceCode"
              value={addressForm.provinceCode}
              onChange={onProvinceChange}
              className={styles.modalSelect}
            >
              <option value="">{t('profile_page.address.modal.select_province')}</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.modalFormGroup}>
            <label className={styles.modalLabel}>{t('profile_page.address.modal.ward')}</label>
            <select
              name="wardCode"
              value={addressForm.wardCode}
              onChange={onWardChange}
              disabled={!addressForm.provinceCode}
              className={styles.modalSelect}
            >
              <option value="">{t('profile_page.address.modal.select_ward')}</option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.modalFormGroup}>
          <label className={styles.modalLabel}>{t('profile_page.address.modal.street')}</label>
          <input
            type="text"
            name="street"
            value={addressForm.street}
            onChange={onAddressFormChange}
            placeholder={t('profile_page.address.modal.street_placeholder')}
            className={styles.modalInput}
          />
        </div>
        <div className={styles.modalFormGroup}>
          <label className={styles.modalLabel}>
            {t('profile_page.address.modal.specific_address')}
          </label>
          <textarea
            rows={2}
            name="details"
            value={addressForm.details}
            onChange={onAddressFormChange}
            placeholder={t('profile_page.address.modal.specific_address_placeholder')}
            className={styles.modalTextarea || styles.modalInput}
          />
        </div>

        {/* GPS Location removed: no longer required for delivery tracking */}

        <div className={styles.modalFormGroup}>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              name="isDefault"
              checked={addressForm.isDefault}
              onChange={onAddressFormChange}
              style={{ width: '18px', height: '18px', accentColor: '#2563EB' }}
            />
            <span style={{ fontSize: '0.9375rem', color: '#374151', fontWeight: 500 }}>
              {t('profile_page.address.modal.set_default')}
            </span>
          </label>
        </div>
      </Form>
    </Offcanvas.Body>

    <div className={styles.drawerFooter}>
      <button className={styles.modalCancelBtn} onClick={onHide}>
        {t('profile_page.address.modal.cancel')}
      </button>
      <button className={styles.modalSaveBtn} onClick={onSaveAddress}>
        {editingAddress
          ? t('profile_page.address.modal.update')
          : t('profile_page.address.modal.save')}
      </button>
    </div>
  </Offcanvas>
);

export default ProfileAddressDrawer;
