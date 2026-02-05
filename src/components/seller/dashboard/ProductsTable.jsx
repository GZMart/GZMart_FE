import React from 'react';
import { Package, Search, Calendar } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import styles from '../../../assets/styles/seller/Dashboard.module.css';

export function ProductsTable({ products = [], loading = false }) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Selling Products</h2>
        <div className={styles.tableActions}>
          <button className={styles.filterBtn} title="Search">
            <Search size={18} />
          </button>
          <button className={styles.dateBtn}>
            <Calendar size={16} />
            <span>8 Jan - 2 Feb</span>
          </button>
        </div>
      </div>
      <div className={styles.tableWrapper}>
        {products && products.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Price</th>
                <th>Sold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index}>
                  <td>
                    <div className={styles.productCell}>
                      <span className={styles.productImage}>
                        <Package size={18} />
                      </span>
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td className={styles.priceCell}>{formatCurrency(product.originalPrice || 0)}</td>
                  <td className={styles.soldCell}>{product.totalSold || 0} pcs</td>
                  <td>
                    <span className={styles.statusBadge}>
                      <span className={styles.statusDot}></span>
                      In Stock
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No products available</div>
        )}
      </div>
    </div>
  );
}
