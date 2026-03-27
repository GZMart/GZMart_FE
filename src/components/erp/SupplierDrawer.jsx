import React, { useEffect, useState } from 'react';
import styles from '@assets/styles/erp/SuppliersPage.module.css';

// ── SVG Icons ──────────────────────────────────────────────────────────────
const IconSupplier = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconX = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IconSave = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

// ── Initial form state with nested object structure ────────────────────────
const EMPTY_FORM = {
  // General Information
  name: '',
  category: [],
  status: 'Active',
  reliabilityScore: 50,

  // Contact Information
  contact: {
    contactPerson: '',
    phone: '',
    email: '',
    wechatId: '',
    aliwangwangId: '',
  },

  // Address & Platform Information
  addressInfo: {
    address: '',
    returnAddress: '',
    platformUrl: '',
  },

  // Billing & Payment Information
  billingInfo: {
    taxCode: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    defaultCurrency: 'CNY',
    paymentTerms: '',
  },

  // Logistics
  leadTimeDays: 0,

  // Additional Information
  notes: '',
};

/**
 * Map old flat structure to new nested structure (for backward compatibility)
 */
const mapLegacyToNested = (supplier) => ({
    name: supplier.name || '',
    category: supplier.category || [],
    status: supplier.status || 'Active',
    reliabilityScore: supplier.reliabilityScore ?? 50,

    contact: {
      contactPerson: supplier.contact?.contactPerson || supplier.contactPerson || '',
      phone: supplier.contact?.phone || supplier.phone || '',
      email: supplier.contact?.email || supplier.email || '',
      wechatId: supplier.contact?.wechatId || '',
      aliwangwangId: supplier.contact?.aliwangwangId || '',
    },

    addressInfo: {
      address: supplier.addressInfo?.address || supplier.address || '',
      returnAddress: supplier.addressInfo?.returnAddress || '',
      platformUrl: supplier.addressInfo?.platformUrl || '',
    },

    billingInfo: {
      taxCode: supplier.billingInfo?.taxCode || supplier.taxCode || '',
      bankName: supplier.billingInfo?.bankName || supplier.bankName || '',
      accountName: supplier.billingInfo?.accountName || '',
      accountNumber: supplier.billingInfo?.accountNumber || supplier.bankAccount || '',
      defaultCurrency: supplier.billingInfo?.defaultCurrency || 'CNY',
      paymentTerms: supplier.billingInfo?.paymentTerms || supplier.paymentTerms || '',
    },

    leadTimeDays: supplier.leadTimeDays ?? 0,
    notes: supplier.notes || '',
  });

/**
 * Reusable Supplier create/edit drawer with nested object structure.
 * Supports cross-border e-commerce suppliers (Taobao/1688).
 *
 * Props:
 *   supplier  — supplier object when editing, null/undefined when creating
 *   onClose   — called when drawer should close
 *   onSave    — async (formData) => void
 */
const SupplierDrawer = ({ supplier, onClose, onSave }) => {
  const [form, setForm] = useState(supplier ? mapLegacyToNested(supplier) : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  /**
   * Handle form changes supporting nested object paths.
   * Examples:
   *   - name: "John" → form.name = "John"
   *   - contact.wechatId: "john123" → form.contact.wechatId = "john123"
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;

    setForm((prev) => {
      if (name.includes('.')) {
        // Nested field: "contact.wechatId"
        const [parentKey, childKey] = name.split('.');
        return {
          ...prev,
          [parentKey]: {
            ...prev[parentKey],
            [childKey]: inputValue,
          },
        };
      } else {
        // Root level field: "name"
        return {
          ...prev,
          [name]: inputValue,
        };
      }
    });
  };

  /**
   * Handle category changes (array field)
   */
  const handleCategoryChange = (e) => {
    const value = e.target.value.trim();
    if (value) {
      setForm((prev) => ({
        ...prev,
        category: [...prev.category, value],
      }));
      e.target.value = '';
    }
  };

  const removeCategory = (index) => {
    setForm((prev) => ({
      ...prev,
      category: prev.category.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!supplier;

  return (
    <>
      <div className={styles.drawerOverlay} onClick={onClose} />
      <div className={styles.drawer} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderLeft}>
            <div className={styles.drawerIconBadge}>
              <IconSupplier />
            </div>
            <div>
              <div className={styles.drawerTitle}>{isEdit ? 'Edit supplier' : 'Add supplier'}</div>
              <div className={styles.drawerSubtitle}>
                {isEdit ? supplier.name : "Fill in the new supplier's info"}
              </div>
            </div>
          </div>
          <button className={styles.drawerCloseBtn} onClick={onClose} aria-label="Close">
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div className={styles.drawerBody}>
          <form id="supplier-form" onSubmit={handleSubmit}>
            {/* ─── Section 1: General Information ─────────────────────────────── */}
            <div className={styles.section}>
              <h3>General Information</h3>
              <div className={styles.formGrid}>
                {/* Supplier Name */}
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>
                    Supplier Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Ex: ABC Co., Ltd."
                  />
                </div>

                {/* Status */}
                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Reliability Score */}
                <div className={styles.formGroup}>
                  <label>Reliability Score (0-100)</label>
                  <input
                    type="number"
                    name="reliabilityScore"
                    value={form.reliabilityScore}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    placeholder="50"
                  />
                </div>

                {/* Categories */}
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Categories</label>
                  <div>
                    <input
                      type="text"
                      placeholder="Add category (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCategoryChange(e);
                        }
                      }}
                    />
                    {form.category.length > 0 && (
                      <div
                        style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}
                      >
                        {form.category.map((cat, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#e6f2ff',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          >
                            {cat}
                            <button
                              type="button"
                              onClick={() => removeCategory(idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                color: '#999',
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Section 2: Contact & Platform ────────────────────────────── */}
            <div className={styles.section}>
              <h3>Contact & Platform Information</h3>
              <div className={styles.formGrid}>
                {/* Contact Person */}
                <div className={styles.formGroup}>
                  <label>Contact Person</label>
                  <input
                    type="text"
                    name="contact.contactPerson"
                    value={form.contact.contactPerson}
                    onChange={handleChange}
                    placeholder="Full name"
                  />
                </div>

                {/* Phone */}
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="contact.phone"
                    value={form.contact.phone}
                    onChange={handleChange}
                    placeholder="+86 or +84..."
                  />
                </div>

                {/* Email */}
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="contact.email"
                    value={form.contact.email}
                    onChange={handleChange}
                    placeholder="example@domain.com"
                  />
                </div>

                {/* WeChat ID */}
                <div className={styles.formGroup}>
                  <label>WeChat ID</label>
                  <input
                    type="text"
                    name="contact.wechatId"
                    value={form.contact.wechatId}
                    onChange={handleChange}
                    placeholder="WeChat username"
                  />
                </div>

                {/* Aliwangwang ID */}
                <div className={styles.formGroup}>
                  <label>Aliwangwang ID</label>
                  <input
                    type="text"
                    name="contact.aliwangwangId"
                    value={form.contact.aliwangwangId}
                    onChange={handleChange}
                    placeholder="Aliwangwang ID"
                  />
                </div>

                {/* Platform/Shop URL */}
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Platform/Shop URL</label>
                  <input
                    type="url"
                    name="addressInfo.platformUrl"
                    value={form.addressInfo.platformUrl}
                    onChange={handleChange}
                    placeholder="https://shop.taobao.com/shop/... or https://1688.com/..."
                  />
                </div>
              </div>
            </div>

            {/* ─── Section 3: Logistics ───────────────────────────────────── */}
            <div className={styles.section}>
              <h3>Logistics & Shipping</h3>
              <div className={styles.formGrid}>
                {/* Address */}
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Supplier Address</label>
                  <input
                    type="text"
                    name="addressInfo.address"
                    value={form.addressInfo.address}
                    onChange={handleChange}
                    placeholder="Street, District, City, China"
                  />
                </div>

                {/* Return Address */}
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Return Address (if different)</label>
                  <input
                    type="text"
                    name="addressInfo.returnAddress"
                    value={form.addressInfo.returnAddress}
                    onChange={handleChange}
                    placeholder="Return address (leave empty if same as supplier address)"
                  />
                </div>

                {/* Lead Time */}
                <div className={styles.formGroup}>
                  <label>Lead Time (Days)</label>
                  <input
                    type="number"
                    name="leadTimeDays"
                    value={form.leadTimeDays}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* ─── Section 4: Banking & Payment ──────────────────────────── */}
            <div className={styles.section}>
              <h3>Banking & Payment Information</h3>
              <div className={styles.formGrid}>
                {/* Tax Code */}
                <div className={styles.formGroup}>
                  <label>Tax Code</label>
                  <input
                    type="text"
                    name="billingInfo.taxCode"
                    value={form.billingInfo.taxCode}
                    onChange={handleChange}
                    placeholder="0123456789"
                  />
                </div>

                {/* Bank Name */}
                <div className={styles.formGroup}>
                  <label>Bank Name</label>
                  <input
                    type="text"
                    name="billingInfo.bankName"
                    value={form.billingInfo.bankName}
                    onChange={handleChange}
                    placeholder="Ex: ICBC, ABC..."
                  />
                </div>

                {/* Account Name */}
                <div className={styles.formGroup}>
                  <label>Account Name</label>
                  <input
                    type="text"
                    name="billingInfo.accountName"
                    value={form.billingInfo.accountName}
                    onChange={handleChange}
                    placeholder="Account holder name"
                  />
                </div>

                {/* Account Number */}
                <div className={styles.formGroup}>
                  <label>Account Number</label>
                  <input
                    type="text"
                    name="billingInfo.accountNumber"
                    value={form.billingInfo.accountNumber}
                    onChange={handleChange}
                    placeholder="0123 4567 8901 2345"
                  />
                </div>

                {/* Default Currency */}
                <div className={styles.formGroup}>
                  <label>Default Currency</label>
                  <select
                    name="billingInfo.defaultCurrency"
                    value={form.billingInfo.defaultCurrency}
                    onChange={handleChange}
                  >
                    <option value="CNY">CNY (Chinese Yuan)</option>
                    <option value="VND">VND (Vietnamese Dong)</option>
                  </select>
                </div>

                {/* Payment Terms */}
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Payment Terms</label>
                  <input
                    type="text"
                    name="billingInfo.paymentTerms"
                    value={form.billingInfo.paymentTerms}
                    onChange={handleChange}
                    placeholder="Ex: Net 30 days, 50% upfront, T/T..."
                  />
                </div>
              </div>
            </div>

            {/* ─── Section 5: Additional Notes ────────────────────────────── */}
            <div className={styles.section}>
              <h3>Additional Notes</h3>
              <div className={styles.formGroup}>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Special instructions, agreements, quality issues, or any other important notes..."
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            form="supplier-form"
            className={styles.btnPrimary}
            disabled={saving}
          >
            <IconSave />
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </>
  );
};

export default SupplierDrawer;
