import { useState, useEffect, useRef } from 'react';
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
  Store,
  ImagePlus,
  X,
} from 'lucide-react';
import locationService from '@services/api/locationService';
import styles from '@assets/styles/seller/SellerProfilePage.module.css';

const SellerProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

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
  });

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

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
      });
      setAvatarPreview(user.avatar || null);
      setBannerPreview(user.profileImage || null);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    }));
    setHasChanges(true);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleBannerClick = () => bannerInputRef.current?.click();

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

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Banner must be less than 10MB');
      return;
    }
    setBannerFile(file);
    setHasChanges(true);
    const reader = new FileReader();
    reader.onloadend = () => setBannerPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    setSaving(true);
    try {
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName.trim());
      submitData.append('phone', formData.phone);
      submitData.append('gender', formData.gender);
      submitData.append('dateOfBirth', formData.dateOfBirth);
      submitData.append('aboutMe', formData.aboutMe);
      submitData.append('address', formData.address);
      submitData.append('provinceCode', formData.provinceCode);
      submitData.append('provinceName', formData.provinceName);
      submitData.append('wardCode', formData.wardCode);
      submitData.append('wardName', formData.wardName);
      if (avatarFile) {
        submitData.append('avatar', avatarFile);
      }
      if (bannerFile) {
        submitData.append('profileImage', bannerFile);
      }

      const result = await dispatch(updateUserProfile({ formData: submitData }));
      if (updateUserProfile.fulfilled.match(result)) {
        toast.success('Profile updated successfully!');
        setAvatarFile(null);
        setBannerFile(null);
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
              <Store size={20} />
              <h2 className={styles.cardTitle}>Shop Appearance</h2>
            </div>
            <p className={styles.sectionHint}>
              This banner and description will be displayed when buyers visit your shop page.
            </p>

            <div className={styles.bannerUpload}>
              {bannerPreview ? (
                <div className={styles.bannerPreviewWrapper}>
                  <img src={bannerPreview} alt="Shop banner" className={styles.bannerPreviewImg} />
                  <div className={styles.bannerActions}>
                    <button
                      type="button"
                      className={styles.bannerChangeBtn}
                      onClick={handleBannerClick}
                    >
                      <Camera size={16} /> Change
                    </button>
                    <button
                      type="button"
                      className={styles.bannerRemoveBtn}
                      onClick={handleRemoveBanner}
                    >
                      <X size={16} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.bannerPlaceholder} onClick={handleBannerClick}>
                  <ImagePlus size={32} />
                  <span>Upload Shop Banner</span>
                  <small>Recommended: 1200×300px, max 10MB</small>
                </div>
              )}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className={styles.hiddenInput}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: 20 }}>
              <label className={styles.label}>Shop Description</label>
              <textarea
                name="aboutMe"
                value={formData.aboutMe}
                onChange={handleChange}
                className={styles.textarea}
                rows={3}
                placeholder="Describe your shop, what you sell, your specialties..."
              />
            </div>
          </section>

          {/* Address & Location */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <MapPin size={20} />
              <h2 className={styles.cardTitle}>Address & Location</h2>
            </div>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Street address, building, etc."
                />
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
    </div>
  );
};

export default SellerProfilePage;
