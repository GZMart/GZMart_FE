import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X, Package, Loader2 } from 'lucide-react';
import { receivePurchaseOrder } from '@store/slices/erpSlice';
import styles from '@assets/styles/seller/erp/ReceivePOModal.module.css';

const INITIAL_FORM = {
  totalWeightKg: '',
  intlShippingRateVndPerKg: '',
  cnDomesticShippingCny: '',
  packagingCostVnd: '',
  vnDomesticShippingVnd: '',
  importTaxVnd: '',
  otherCostsVnd: '',
};

/**
 * ReceivePOModal — Stage 2: Enter costs when goods arrive
 * Calls POST /:id/receive with arrival costs → calculates landed cost, updates inventory
 */
const ReceivePOModal = ({ isOpen, onClose, poId, po, onSuccess }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const id = poId || po?._id;

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setError('');
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validate = () => {
    const w = parseFloat(form.totalWeightKg);
    if (isNaN(w) || w < 0) {
      setError('Actual weight (kg) must be a number ≥ 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id) {
      return;
    }
    setError('');
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        totalWeightKg: parseFloat(form.totalWeightKg) || 0,
        intlShippingRateVndPerKg: parseFloat(form.intlShippingRateVndPerKg) || 0,
        cnDomesticShippingCny: parseFloat(form.cnDomesticShippingCny) || 0,
        packagingCostVnd: parseFloat(form.packagingCostVnd) || 0,
        vnDomesticShippingVnd: parseFloat(form.vnDomesticShippingVnd) || 0,
        importTaxVnd: parseFloat(form.importTaxVnd) || 0,
        otherCostsVnd: parseFloat(form.otherCostsVnd) || 0,
      };

      await dispatch(receivePurchaseOrder({ id, arrivalCostsPayload: payload })).unwrap();

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.message || err?.error || 'Failed to receive goods. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Package size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Receive Goods — Enter Costs (Stage 2)
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className={styles.hint}>
          Enter actual costs when goods arrive at VN warehouse. System will calculate landed cost
          and update inventory.
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Actual Total Weight (kg) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.totalWeightKg}
                onChange={(e) => handleChange('totalWeightKg', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Intl Shipping Rate (VND/kg)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.intlShippingRateVndPerKg}
                onChange={(e) => handleChange('intlShippingRateVndPerKg', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className={styles.formGroup}>
              <label>CN Domestic Ship (¥)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cnDomesticShippingCny}
                onChange={(e) => handleChange('cnDomesticShippingCny', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Packaging Cost (VND)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.packagingCostVnd}
                onChange={(e) => handleChange('packagingCostVnd', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className={styles.formGroup}>
              <label>VN Domestic Ship (VND)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.vnDomesticShippingVnd}
                onChange={(e) => handleChange('vnDomesticShippingVnd', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Import Tax (VND)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.importTaxVnd}
                onChange={(e) => handleChange('importTaxVnd', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Other Costs (VND)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.otherCostsVnd}
                onChange={(e) => handleChange('otherCostsVnd', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {error && (
            <p className={styles.errorText} style={{ marginTop: '1rem' }}>
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className={styles.btnSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 size={14} className={styles.spinIcon} />
              ) : (
                <Package size={14} />
              )}
              {submitting ? 'Processing…' : 'Confirm Receive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceivePOModal;
