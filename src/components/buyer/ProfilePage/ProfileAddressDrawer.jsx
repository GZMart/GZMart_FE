import PropTypes from 'prop-types';
import { Form, Offcanvas } from 'react-bootstrap';
import { X } from 'lucide-react';
import styles from '@assets/styles/buyer/ProfilePage/ProfilePage.module.css';
import useAddressAutocomplete from '@hooks/useAddressAutocomplete';
import AddressAutocompleteDropdown from '@components/common/AddressAutocompleteDropdown';
import { applyAddressSuggestion, applyGoongSuggestion } from '@utils/addressAutocomplete';

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
  savedAddresses,
}) => {
  const {
    activeField: addressSuggestionField,
    setActiveField: setAddressSuggestionField,
    suggestions: addressSuggestions,
    showSuggestions: showAddressSuggestions,
    resolveSuggestionDetails,
  } = useAddressAutocomplete({
    addresses: savedAddresses,
    formValues: addressForm,
    excludeId: editingAddress?._id || null,
  });

  const handleAddressSuggestionSelect = async (suggestion) => {
    const resolvedSuggestion = await resolveSuggestionDetails(suggestion);
    const addressPatch =
      resolvedSuggestion.source === 'goong'
        ? applyGoongSuggestion({
            suggestion: resolvedSuggestion,
            activeField: addressSuggestionField,
            provinces,
            wards,
            currentFormValues: addressForm,
          })
        : {
            ...addressForm,
            ...applyAddressSuggestion(resolvedSuggestion),
          };

    onAddressFormChange({
      target: { name: 'street', value: addressPatch.street, type: 'text' },
    });
    onAddressFormChange({
      target: { name: 'details', value: addressPatch.details, type: 'text' },
    });
    onAddressFormChange({
      target: { name: 'provinceCode', value: addressPatch.provinceCode, type: 'text' },
    });
    onAddressFormChange({
      target: { name: 'provinceName', value: addressPatch.provinceName, type: 'text' },
    });
    onAddressFormChange({
      target: { name: 'wardCode', value: addressPatch.wardCode, type: 'text' },
    });
    onAddressFormChange({
      target: { name: 'wardName', value: addressPatch.wardName, type: 'text' },
    });
    setAddressSuggestionField(null);
  };

  return (
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
              value={addressForm.receiverName || ''}
              onChange={onAddressFormChange}
              placeholder={t('profile_page.address.modal.receiver_name_placeholder')}
              autoComplete="name"
              className={styles.modalInput}
            />
          </div>
          <div className={styles.modalFormGroup}>
            <label className={styles.modalLabel}>{t('profile_page.address.modal.phone')}</label>
            <input
              type="text"
              name="phone"
              value={addressForm.phone || ''}
              onChange={onAddressFormChange}
              placeholder={t('profile_page.address.modal.phone_placeholder')}
              autoComplete="tel"
              className={styles.modalInput}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>
                {t('profile_page.address.modal.province')}
              </label>
              <select
                name="provinceCode"
                value={addressForm.provinceCode || ''}
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
                value={addressForm.wardCode || ''}
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
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="street"
                value={addressForm.street || ''}
                onChange={onAddressFormChange}
                onFocus={() => setAddressSuggestionField('street')}
                onBlur={() => setTimeout(() => setAddressSuggestionField(null), 200)}
                autoComplete="address-line1"
                placeholder={t('profile_page.address.modal.street_placeholder')}
                className={styles.modalInput}
              />
              <div onMouseDown={(e) => e.preventDefault()}>
                <AddressAutocompleteDropdown
                  show={showAddressSuggestions && addressSuggestionField === 'street'}
                  suggestions={addressSuggestions}
                  onSelect={handleAddressSuggestionSelect}
                />
              </div>
            </div>
          </div>
          <div className={styles.modalFormGroup}>
            <label className={styles.modalLabel}>
              {t('profile_page.address.modal.specific_address')}
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                rows={2}
                name="details"
                value={addressForm.details || ''}
                onChange={onAddressFormChange}
                onFocus={() => setAddressSuggestionField('details')}
                onBlur={() => setTimeout(() => setAddressSuggestionField(null), 200)}
                autoComplete="address-line2"
                placeholder={t('profile_page.address.modal.specific_address_placeholder')}
                className={styles.modalTextarea || styles.modalInput}
              />
              <div onMouseDown={(e) => e.preventDefault()}>
                <AddressAutocompleteDropdown
                  show={showAddressSuggestions && addressSuggestionField === 'details'}
                  suggestions={addressSuggestions}
                  onSelect={handleAddressSuggestionSelect}
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFormGroup}>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                name="isDefault"
                checked={!!addressForm.isDefault}
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
};

// Bổ sung khai báo PropTypes
ProfileAddressDrawer.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  editingAddress: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  t: PropTypes.func.isRequired,
  addressForm: PropTypes.shape({
    receiverName: PropTypes.string,
    phone: PropTypes.string,
    provinceCode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    wardCode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    street: PropTypes.string,
    details: PropTypes.string,
    isDefault: PropTypes.bool,
  }).isRequired,
  onAddressFormChange: PropTypes.func.isRequired,
  onProvinceChange: PropTypes.func.isRequired,
  provinces: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  wards: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onWardChange: PropTypes.func.isRequired,
  onSaveAddress: PropTypes.func.isRequired,
  savedAddresses: PropTypes.arrayOf(PropTypes.object),
};

export default ProfileAddressDrawer;
