import { useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X, Download, FileText } from 'lucide-react';
import styles from '@assets/styles/buyer/ProfilePage/InvoiceModal.module.css';

const InvoiceModal = ({ order, user, formatCurrency, onClose }) => {
  const invoiceRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const invoiceDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const shopName = order.items?.[0]?.productId?.sellerId?.fullName || 'GZMart Shop';

  const handleDownloadPDF = useCallback(async () => {
    if (!invoiceRef.current || downloading) {
return;
}
    setDownloading(true);

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = invoiceRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Invoice_${order.orderNumber || order._id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [downloading, order.orderNumber, order._id]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.invoiceBackdrop} onClick={handleBackdropClick}>
      <div className={styles.invoiceModal}>
        <div className={styles.invoiceModalHeader}>
          <div className={styles.invoiceModalTitle}>
            <FileText size={20} strokeWidth={2} />
            <span>Invoice</span>
          </div>
          <div className={styles.invoiceModalHeaderActions}>
            <button
              className={styles.invoiceDownloadBtn}
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              <Download size={16} strokeWidth={2} />
              {downloading ? 'Generating...' : 'Download PDF'}
            </button>
            <button className={styles.invoiceCloseBtn} onClick={onClose}>
              <X size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className={styles.invoiceModalBody}>
          <div ref={invoiceRef} className={styles.invoiceContent}>
            {/* Invoice Header */}
            <div className={styles.invoiceHeader}>
              <div className={styles.invoiceHeaderLeft}>
                <h1 className={styles.invoiceBrand}>GZMart</h1>
                <p className={styles.invoiceBrandTagline}>B2C E-commerce Platform</p>
              </div>
              <div className={styles.invoiceHeaderRight}>
                <h2 className={styles.invoiceTitle}>INVOICE</h2>
                <div className={styles.invoiceMeta}>
                  <div className={styles.invoiceMetaRow}>
                    <span className={styles.invoiceMetaLabel}>Invoice No:</span>
                    <span className={styles.invoiceMetaValue}>
                      {order.orderNumber || order._id?.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.invoiceMetaRow}>
                    <span className={styles.invoiceMetaLabel}>Date:</span>
                    <span className={styles.invoiceMetaValue}>{invoiceDate}</span>
                  </div>
                  <div className={styles.invoiceMetaRow}>
                    <span className={styles.invoiceMetaLabel}>Status:</span>
                    <span className={`${styles.invoiceMetaValue} ${styles.invoiceStatusBadge}`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.invoiceDivider} />

            {/* Billing Info */}
            <div className={styles.invoiceBillingSection}>
              <div className={styles.invoiceBillingBlock}>
                <h3 className={styles.invoiceBillingTitle}>Bill To</h3>
                <p className={styles.invoiceBillingName}>
                  {order.userId?.fullName || user?.fullName || 'Customer'}
                </p>
                <p className={styles.invoiceBillingDetail}>
                  {order.userId?.phone || user?.phone || '(+84) XXX XXX XXX'}
                </p>
                <p className={styles.invoiceBillingDetail}>{order.shippingAddress || 'N/A'}</p>
              </div>
              <div className={styles.invoiceBillingBlock}>
                <h3 className={styles.invoiceBillingTitle}>Seller</h3>
                <p className={styles.invoiceBillingName}>{shopName}</p>
                <p className={styles.invoiceBillingDetail}>
                  Payment: {order.paymentMethod?.replace(/_/g, ' ') || 'N/A'}
                </p>
              </div>
            </div>

            <div className={styles.invoiceDivider} />

            {/* Items Table */}
            <table className={styles.invoiceTable}>
              <thead>
                <tr>
                  <th className={styles.invoiceThNo}>#</th>
                  <th className={styles.invoiceThItem}>Item</th>
                  <th className={styles.invoiceThVariant}>Variant</th>
                  <th className={styles.invoiceThQty}>Qty</th>
                  <th className={styles.invoiceThPrice}>Unit Price</th>
                  <th className={styles.invoiceThTotal}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx} className={styles.invoiceTableRow}>
                    <td className={styles.invoiceTdNo}>{idx + 1}</td>
                    <td className={styles.invoiceTdItem}>{item.productId?.name || 'Product'}</td>
                    <td className={styles.invoiceTdVariant}>
                      {item.tierSelections
                        ? Object.values(item.tierSelections).join(', ')
                        : 'Default'}
                    </td>
                    <td className={styles.invoiceTdQty}>{item.quantity}</td>
                    <td className={styles.invoiceTdPrice}>{formatCurrency(item.price)}</td>
                    <td className={styles.invoiceTdTotal}>
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className={styles.invoiceTotalsSection}>
              <div className={styles.invoiceTotalsBox}>
                <div className={styles.invoiceTotalsRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className={styles.invoiceTotalsRow}>
                  <span>Shipping Fee</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </div>
                {order.discount > 0 && (
                  <div className={`${styles.invoiceTotalsRow} ${styles.invoiceDiscount}`}>
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className={styles.invoiceTotalsDivider} />
                <div className={`${styles.invoiceTotalsRow} ${styles.invoiceTotalsGrand}`}>
                  <span>Total</span>
                  <span>{formatCurrency(order.totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.invoiceFooter}>
              <p className={styles.invoiceFooterText}>Thank you for shopping with GZMart!</p>
              <p className={styles.invoiceFooterNote}>
                This is a computer-generated invoice. No signature is required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

InvoiceModal.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.string,
    orderNumber: PropTypes.string,
    status: PropTypes.string,
    createdAt: PropTypes.string,
    userId: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        fullName: PropTypes.string,
        phone: PropTypes.string,
      }),
    ]),
    shippingAddress: PropTypes.string,
    paymentMethod: PropTypes.string,
    subtotal: PropTypes.number,
    shippingCost: PropTypes.number,
    discount: PropTypes.number,
    totalPrice: PropTypes.number,
    items: PropTypes.arrayOf(PropTypes.any),
  }).isRequired,
  user: PropTypes.shape({
    fullName: PropTypes.string,
    phone: PropTypes.string,
  }),
  formatCurrency: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default InvoiceModal;
