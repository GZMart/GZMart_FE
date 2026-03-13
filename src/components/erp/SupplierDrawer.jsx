import React, { useEffect, useState } from 'react';
import styles from '@assets/styles/erp/SuppliersPage.module.css';

// ── SVG Icons ──────────────────────────────────────────────────────────────
const IconSupplier = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);
const IconSave = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const EMPTY_FORM = {
  name: '', contactPerson: '', phone: '', email: '',
  address: '', taxCode: '', bankAccount: '', bankName: '',
  paymentTerms: '', notes: '',
};

/**
 * Reusable Supplier create/edit drawer.
 * Used by both SuppliersPage and SupplierDetailPage.
 *
 * Props:
 *   supplier  — supplier object when editing, null/undefined when creating
 *   onClose   — called when drawer should close
 *   onSave    — async (formData) => void
 */
const SupplierDrawer = ({ supplier, onClose, onSave }) => {
  const [form, setForm] = useState(
    supplier
      ? {
          name:          supplier.name          || '',
          contactPerson: supplier.contactPerson || '',
          phone:         supplier.phone         || '',
          email:         supplier.email         || '',
          address:       supplier.address       || '',
          taxCode:       supplier.taxCode       || '',
          bankAccount:   supplier.bankAccount   || '',
          bankName:      supplier.bankName      || '',
          paymentTerms:  supplier.paymentTerms  || '',
          notes:         supplier.notes         || '',
        }
      : { ...EMPTY_FORM },
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const isEdit = !!supplier;

  return (
    <>
      <div className={styles.drawerOverlay} onClick={onClose} />
      <div className={styles.drawer} role="dialog" aria-modal="true">

        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderLeft}>
            <div className={styles.drawerIconBadge}><IconSupplier /></div>
            <div>
              <div className={styles.drawerTitle}>
                {isEdit ? 'Edit supplier' : 'Add supplier'}
              </div>
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
        <form id="supplier-form" onSubmit={handleSubmit}>
          <div className={styles.drawerBody}>

            {/* Basic Info */}
            <div className={styles.section}>
              <h3>Basic Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Supplier Name <span className={styles.required}>*</span></label>
                  <input type="text" name="name" value={form.name}
                    onChange={handleChange} required placeholder="Ex: ABC Co., Ltd." />
                </div>
                <div className={styles.formGroup}>
                  <label>Contact Person</label>
                  <input type="text" name="contactPerson" value={form.contactPerson}
                    onChange={handleChange} placeholder="Full name" />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input type="tel" name="phone" value={form.phone}
                    onChange={handleChange} placeholder="+84..." />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input type="email" name="email" value={form.email}
                    onChange={handleChange} placeholder="example@domain.com" />
                </div>
                <div className={styles.formGroup}>
                  <label>Tax Code</label>
                  <input type="text" name="taxCode" value={form.taxCode}
                    onChange={handleChange} placeholder="0123456789" />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  <input type="text" name="address" value={form.address}
                    onChange={handleChange} placeholder="Street, District, City" />
                </div>
              </div>
            </div>

            {/* Banking */}
            <div className={styles.section}>
              <h3>Banking &amp; Payment Info</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Account Number</label>
                  <input type="text" name="bankAccount" value={form.bankAccount}
                    onChange={handleChange} placeholder="0123 4567 8901 2345" />
                </div>
                <div className={styles.formGroup}>
                  <label>Bank Name</label>
                  <input type="text" name="bankName" value={form.bankName}
                    onChange={handleChange} placeholder="Ex: Vietcombank, BIDV..." />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Payment Terms</label>
                  <input type="text" name="paymentTerms" value={form.paymentTerms}
                    onChange={handleChange} placeholder="Ex: Net 30 days, 50% upfront..." />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className={styles.section}>
              <h3>Notes</h3>
              <div className={styles.formGroup}>
                <textarea name="notes" value={form.notes}
                  onChange={handleChange} rows={3}
                  placeholder="Additional info, special instructions..." />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="supplier-form" className={styles.btnPrimary} disabled={saving}>
            <IconSave />
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </>
  );
};

export default SupplierDrawer;
