import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { bulkUploadService } from '../../../services/api/bulkUploadService';
import BulkUploadReviewModal from './BulkUploadReviewModal';
import styles from '../../../assets/styles/seller/ListingsPage.module.css';

/**
 * Modal bulk: upload → preview + AI gợi ý danh mục → user xác nhận → API tạo SP.
 */
const BulkUploadModal = ({ isOpen, onClose, onCompleted }) => {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [step, setStep] = useState('upload');
  const [previewItems, setPreviewItems] = useState(null);
  const [result, setResult] = useState(null);
  /** Định dạng file mẫu: Excel (có màu/viền) hoặc CSV thuần */
  const [templateFormat, setTemplateFormat] = useState('xlsx');

  const reset = useCallback(() => {
    setFile(null);
    setResult(null);
    setPreviewItems(null);
    setStep('upload');
  }, []);

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const downloadTemplate = async (type) => {
    try {
      const blob = await bulkUploadService.downloadTemplate(type, templateFormat);
      const ext = templateFormat === 'csv' ? 'csv' : 'xlsx';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk-upload-template-${type}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded.');
    } catch (err) {
      toast.error(err?.message || 'Could not download template. Try signing in again.');
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.warning('Choose a CSV or Excel file.');
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const data = await bulkUploadService.preview(file);
      const items = data?.data?.items;
      if (!Array.isArray(items) || items.length === 0) {
        toast.warning('No valid rows found.');
        return;
      }
      setPreviewItems(items);
      setStep('review');
    } catch (err) {
      toast.error(err?.message || 'Failed to analyze file.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCreate = async (itemsPayload) => {
    setConfirming(true);
    setResult(null);
    try {
      const data = await bulkUploadService.confirm(itemsPayload);
      setResult(data);
      const { summary } = data || {};
      if (summary?.created > 0) {
        onCompleted?.();
      }
      const fail = summary?.failed ?? 0;
      const ok = summary?.created ?? 0;
      if (fail > 0 && ok === 0) {
        toast.error('No products were created. See details below.');
      } else if (fail > 0) {
        toast.warning(
          `Created ${ok} product(s); ${fail} row(s) failed (see below).`,
          { autoClose: 6000 }
        );
      } else {
        toast.success(`Created ${ok} product(s).`);
        handleClose();
      }
    } catch (err) {
      toast.error(err?.message || 'Confirmation failed.');
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.bulkModalOverlay} role="presentation" onClick={handleClose}>
      <div
        className={`${styles.bulkModal} ${step === 'review' ? styles.bulkModalWide : ''}`}
        role="dialog"
        aria-labelledby="bulk-upload-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        {step === 'upload' ? (
          <>
            <div className={styles.bulkModalHeader}>
              <div>
                <h2 id="bulk-upload-title" className={styles.bulkModalTitle}>
                  Bulk upload
                </h2>
                <p className={styles.bulkModalSubtitle}>
                  Supports CSV and Excel (.csv, .xlsx, .xls — max 5MB). There is <strong>no category column</strong> and{' '}
                  <strong>no status column</strong> in the file — new products are always created as <strong>draft</strong>
                  . After analysis, AI suggests categories from the name and description; you review and confirm, then the
                  system creates the products.
                </p>
              </div>
              <button type="button" className={styles.bulkModalClose} onClick={handleClose} aria-label="Close">
                ×
              </button>
            </div>

            <div className={styles.bulkModalTemplates}>
              <span className={styles.bulkModalTemplatesLabel}>Download template:</span>
              <span className={styles.bulkModalTemplateFormat} role="group" aria-label="Template file format">
                <label className={styles.bulkTemplateFormatOpt}>
                  <input
                    type="radio"
                    name="bulk-template-format"
                    checked={templateFormat === 'xlsx'}
                    onChange={() => setTemplateFormat('xlsx')}
                  />
                  Excel (.xlsx)
                </label>
                <label className={styles.bulkTemplateFormatOpt}>
                  <input
                    type="radio"
                    name="bulk-template-format"
                    checked={templateFormat === 'csv'}
                    onChange={() => setTemplateFormat('csv')}
                  />
                  CSV
                </label>
              </span>
              <button
                type="button"
                className={styles.bulkTemplateBtn}
                onClick={() => downloadTemplate('single')}
              >
                Single
              </button>
              <button
                type="button"
                className={styles.bulkTemplateBtn}
                onClick={() => downloadTemplate('variant')}
              >
                Variant
              </button>
            </div>

            <form className={styles.bulkModalForm} onSubmit={handleAnalyze}>
              <label className={styles.bulkFileLabel}>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  className={styles.bulkFileInput}
                  onChange={(ev) => {
                    setFile(ev.target.files?.[0] || null);
                    setResult(null);
                  }}
                />
                <span className={styles.bulkFileHint}>{file ? file.name : 'Choose file…'}</span>
              </label>

              <div className={styles.bulkModalActions}>
                <button type="button" className={styles.bulkCancelBtn} onClick={handleClose}>
                  Cancel
                </button>
                <button type="submit" className={styles.bulkSubmitBtn} disabled={submitting || !file}>
                  {submitting ? 'Analyzing…' : 'Analyze & preview'}
                </button>
              </div>
            </form>

            <p className={styles.bulkHintFooter}>
              Categories are chosen only at the preview step (AI suggestion or manual). SKUs must be unique in the file
              and in the system.
            </p>
          </>
        ) : (
          <>
            <div className={styles.bulkModalHeader}>
              <div>
                <h2 className={styles.bulkModalTitle}>Preview &amp; categories</h2>
                <p className={styles.bulkModalSubtitle}>
                  Compare AI suggestions (embedding). Adjust categories and use <strong>View &amp; edit</strong> on any row
                  to fix details before creating — highlighted rows need extra review (low confidence or no AI).
                </p>
              </div>
              <button type="button" className={styles.bulkModalClose} onClick={handleClose} aria-label="Close">
                ×
              </button>
            </div>
            <BulkUploadReviewModal
              items={previewItems}
              onBack={() => {
                setStep('upload');
                setPreviewItems(null);
              }}
              onConfirm={handleConfirmCreate}
              confirming={confirming}
            />
            {result?.summary && (
              <div className={styles.bulkResultBox}>
                <p className={styles.bulkResultSummary}>
                  <strong>Result:</strong> {result.summary.created} created / {result.summary.total} total
                  {result.summary.failed > 0 ? ` — ${result.summary.failed} failed` : ''}
                </p>
                {result.data?.failed?.length > 0 && (
                  <div className={styles.bulkFailWrap}>
                    <p className={styles.bulkFailTitle}>Error details</p>
                    <ul className={styles.bulkFailList}>
                      {result.data.failed.map((f, i) => (
                        <li key={`${f.index}-${i}`}>
                          <span className={styles.bulkFailName}>{f.name}</span>
                          <span className={styles.bulkFailMsg}>{f.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BulkUploadModal;
