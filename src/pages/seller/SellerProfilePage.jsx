import { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, updateUserProfile } from '@store/slices/authSlice';
import { toast } from 'react-toastify';
import {
  Camera,
  Save,
  User,
  MapPin,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Shield,
  ImagePlus,
  X,
  Palette,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Offcanvas } from 'react-bootstrap';
import locationService from '@services/api/locationService';
import useAddressAutocomplete from '@hooks/useAddressAutocomplete';
import AddressAutocompleteDropdown from '@components/common/AddressAutocompleteDropdown';
import { applyAddressSuggestion, applyGoongSuggestion } from '@utils/addressAutocomplete';
import { geocodeAddressForSave } from '@utils/addressGeocoding';
import styles from '@assets/styles/seller/SellerProfilePage.module.css';

const SellerProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const fileInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddressDrawer, setShowAddressDrawer] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: 'other',
    dateOfBirth: '',
    aboutMe: '',
    address: '',
    provinceCode: '',
    provinceName: '',
    wardCode: '',
    wardName: '',
    goongPlaceId: '',
    location: null,
  });

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  const autocompleteAddresses = useMemo(() => [], []);
  const autocompleteFormValues = useMemo(
    () => ({
      street: formData.address,
      details: '',
      wardName: formData.wardName,
      provinceName: formData.provinceName,
    }),
    [formData.address, formData.wardName, formData.provinceName]
  );

  const {
    activeField: addressSuggestionField,
    setActiveField: setAddressSuggestionField,
    suggestions: addressSuggestions,
    showSuggestions: showAddressSuggestions,
    resolveSuggestionDetails,
  } = useAddressAutocomplete({
    addresses: autocompleteAddresses,
    formValues: autocompleteFormValues,
  });

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await locationService.getProvinces();
        setProvinces(data || []);
      } catch (err) {
        console.error('Failed to load provinces:', err);
      }
    };
    loadProvinces();
  }, []);

  useEffect(() => {
    if (formData.provinceCode) {
      const loadWards = async () => {
        try {
          const data = await locationService.getWards(formData.provinceCode);
          setWards(data || []);
        } catch (err) {
          console.error('Failed to load wards:', err);
        }
      };
      loadWards();
    } else {
      setWards([]);
    }
  }, [formData.provinceCode]);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || 'other',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        aboutMe: user.aboutMe || '',
        address: user.address || '',
        provinceCode: user.provinceCode || '',
        provinceName: user.provinceName || '',
        wardCode: user.wardCode || '',
        wardName: user.wardName || '',
        goongPlaceId: '',
        location: user.location || null,
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'address' ? { goongPlaceId: '', location: null } : {}),
    }));
    setHasChanges(true);
  };

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const province = provinces.find((p) => p.code === Number(code));
    setFormData((prev) => ({
      ...prev,
      provinceCode: code,
      provinceName: province ? province.name : '',
      wardCode: '',
      wardName: '',
      goongPlaceId: '',
      location: null,
    }));
    setHasChanges(true);
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    const ward = wards.find((w) => w.code === Number(code));
    setFormData((prev) => ({
      ...prev,
      wardCode: code,
      wardName: ward ? ward.name : '',
      goongPlaceId: '',
      location: null,
    }));
    setHasChanges(true);
  };

  const handleAddressSuggestionSelect = async (suggestion) => {
    const resolvedSuggestion = await resolveSuggestionDetails(suggestion);
    const autocompleteFormValues = {
      street: formData.address,
      details: '',
      wardName: formData.wardName,
      provinceName: formData.provinceName,
      provinceCode: formData.provinceCode,
      wardCode: formData.wardCode,
    };

    const addressPatch =
      resolvedSuggestion.source === 'goong'
        ? applyGoongSuggestion({
            suggestion: resolvedSuggestion,
            activeField: 'street',
            provinces,
            wards,
            currentFormValues: autocompleteFormValues,
          })
        : {
            ...autocompleteFormValues,
            ...applyAddressSuggestion(resolvedSuggestion),
          };

    setFormData((prev) => ({
      ...prev,
      address: addressPatch.street || prev.address,
      provinceCode: addressPatch.provinceCode || prev.provinceCode,
      provinceName: addressPatch.provinceName || prev.provinceName,
      wardCode: addressPatch.wardCode || prev.wardCode,
      wardName: addressPatch.wardName || prev.wardName,
      goongPlaceId: addressPatch.goongPlaceId || prev.goongPlaceId,
      location: addressPatch.location || prev.location,
    }));
    setAddressSuggestionField(null);
    setHasChanges(true);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    setAvatarFile(file);
    setHasChanges(true);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    setSaving(true);
    try {
      const geocodedAddress = await geocodeAddressForSave({
        street: formData.address,
        details: '',
        wardName: formData.wardName,
        provinceName: formData.provinceName,
        goongPlaceId: formData.goongPlaceId,
      });

      const submitData = new FormData();
      submitData.append('fullName', formData.fullName.trim());
      submitData.append('phone', formData.phone);
      submitData.append('gender', formData.gender);
      submitData.append('dateOfBirth', formData.dateOfBirth);
      submitData.append('aboutMe', formData.aboutMe);
      submitData.append('address', geocodedAddress?.formattedAddress || formData.address);
      submitData.append('provinceCode', formData.provinceCode);
      submitData.append('provinceName', formData.provinceName);
      submitData.append('wardCode', formData.wardCode);
      submitData.append('wardName', formData.wardName);

      const resolvedLocation = geocodedAddress?.location || formData.location;

      if (resolvedLocation?.lat != null && resolvedLocation?.lng != null) {
        submitData.append(
          'location',
          JSON.stringify({
            lat: resolvedLocation.lat,
            lng: resolvedLocation.lng,
            address: geocodedAddress.formattedAddress || formData.address,
          })
        );
      }

      if (avatarFile) {
        submitData.append('avatar', avatarFile);
      }

      const result = await dispatch(updateUserProfile({ formData: submitData }));
      if (updateUserProfile.fulfilled.match(result)) {
        toast.success('Profile updated successfully!');
        setAvatarFile(null);
        setHasChanges(false);
      } else {
        toast.error(result.payload || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar =
    avatarPreview ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'S')}&background=0d6efd&color=fff&size=120`;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'N/A';

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Profile Settings</h1>
        <p className={styles.pageSubtitle}>Manage your personal information and shop settings</p>
      </div>

      {/* Two-Column Layout */}
      <div className={styles.layout}>
        {/* LEFT - Sidebar Avatar Card (sticky) */}
        <aside className={styles.sidebar}>
          <div className={styles.profileCard}>
            <div className={styles.avatarWrapper} onClick={handleAvatarClick}>
              <img
                src={displayAvatar}
                alt="Profile avatar"
                className={styles.avatarImage}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'S')}&background=0d6efd&color=fff&size=120`;
                }}
              />
              <div className={styles.avatarOverlay}>
                <Camera size={22} />
                <span>Change</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className={styles.hiddenInput}
              />
            </div>
            <h3 className={styles.profileName}>{formData.fullName || 'Seller'}</h3>
            <p className={styles.profileEmail}>{formData.email}</p>
            <span className={styles.roleBadge}>
              <Shield size={12} />
              Seller Account
            </span>
          </div>

          {/* Quick Info */}
          <div className={styles.quickInfo}>
            <div className={styles.quickInfoItem}>
              <Mail size={16} />
              <span>{formData.email || '—'}</span>
            </div>
            <div className={styles.quickInfoItem}>
              <Phone size={16} />
              <span>{formData.phone || 'Not set'}</span>
            </div>
            <div className={styles.quickInfoItem}>
              <Calendar size={16} />
              <span>Joined {memberSince}</span>
            </div>
            <div className={styles.quickInfoItem}>
              <MapPin size={16} />
              <span>{formData.provinceName || 'No location'}</span>
            </div>
          </div>
        </aside>

        {/* RIGHT - Form Sections */}
        <main className={styles.mainContent}>
          {/* Personal Information */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <User size={20} />
              <h2 className={styles.cardTitle}>Personal Information</h2>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Full Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter your full name"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  className={`${styles.input} ${styles.inputDisabled}`}
                  disabled
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g. 0901234567"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={styles.input}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>About Me</label>
                <textarea
                  name="aboutMe"
                  value={formData.aboutMe}
                  onChange={handleChange}
                  className={styles.textarea}
                  rows={3}
                  placeholder="Tell buyers a little about yourself..."
                />
              </div>
            </div>
          </section>

          {/* Shop Appearance */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <Palette size={20} />
              <h2 className={styles.cardTitle}>Shop Appearance</h2>
            </div>
            <p className={styles.sectionHint}>
              Customize your shop page layout, banners, and modules.
            </p>
            <Link to="/seller/shop-decoration" className={styles.appearanceLink}>
              <div className={styles.appearanceLinkContent}>
                <div className={styles.appearanceLinkIcon}>
                  <Palette size={28} />
                </div>
                <div className={styles.appearanceLinkText}>
                  <span className={styles.appearanceLinkTitle}>Customize Shop Design</span>
                  <span className={styles.appearanceLinkDesc}>
                    Go to Shop Decoration to manage your shop homepage layout
                  </span>
                </div>
              </div>
              <i className="bi bi-arrow-right" />
            </Link>
          </section>

          {/* Address & Location */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <MapPin size={20} />
              <h2 className={styles.cardTitle}>Address & Location</h2>
            </div>
            <div className={styles.addressSummaryBlock}>
              <p className={styles.addressSummaryText}>
                {formData.address || 'No street address added yet'}
              </p>
              <p className={styles.addressSummarySubtext}>
                {[formData.wardName, formData.provinceName].filter(Boolean).join(', ') ||
                  'No province/ward selected'}
              </p>
              <button
                type="button"
                className={styles.openAddressDrawerBtn}
                onClick={() => setShowAddressDrawer(true)}
              >
                Edit Address
              </button>
            </div>
          </section>

          {/* Save Button — always at the bottom of form */}
          <div className={styles.saveSection}>
            <p className={styles.saveHint}>
              {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
            </p>
            <button
              className={`${styles.saveBtn} ${hasChanges ? styles.saveBtnActive : ''}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 size={18} className={styles.spinIcon} /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </main>
      </div>

      <Offcanvas
        show={showAddressDrawer}
        onHide={() => setShowAddressDrawer(false)}
        placement="end"
        className={styles.addressDrawer}
      >
        <div className={styles.drawerHeader}>
          <h3 className={styles.drawerTitle}>Edit Address</h3>
          <button
            type="button"
            className={styles.drawerCloseBtn}
            onClick={() => setShowAddressDrawer(false)}
          >
            <X size={20} />
          </button>
        </div>

        <Offcanvas.Body className={styles.drawerBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                onFocus={() => setAddressSuggestionField('street')}
                onBlur={() => setTimeout(() => setAddressSuggestionField(null), 150)}
                autoComplete="street-address"
                className={styles.input}
                placeholder="Street address, building, etc."
              />
              <AddressAutocompleteDropdown
                show={showAddressSuggestions && addressSuggestionField === 'street'}
                suggestions={addressSuggestions}
                onSelect={handleAddressSuggestionSelect}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Province / City</label>
            <select
              value={formData.provinceCode}
              onChange={handleProvinceChange}
              className={styles.input}
            >
              <option value="">Select province</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Ward / Commune</label>
            <select
              value={formData.wardCode}
              onChange={handleWardChange}
              className={styles.input}
              disabled={!formData.provinceCode}
            >
              <option value="">Select ward</option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* GPS Location removed: not required anymore */}
        </Offcanvas.Body>

        <div className={styles.drawerFooter}>
          <button
            type="button"
            className={styles.drawerSecondaryBtn}
            onClick={() => setShowAddressDrawer(false)}
          >
            Done
          </button>
        </div>
      </Offcanvas>
    </div>
  );
};

export default SellerProfilePage;
