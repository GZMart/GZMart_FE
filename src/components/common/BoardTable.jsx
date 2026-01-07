import React from 'react';
import PropTypes from 'prop-types';
import styles from '../../assets/styles/common/BoardTable.module.css';

/**
 * Reusable Board Table Component
 * Based on seller's ListingsTable design
 */
const BoardTable = ({
  title = 'Board',
  columns = [],
  data = [],
  renderRow,
  showCheckbox = false,
  showFooter = true,
  currentPage = 1,
  itemsPerPage = 10,
  emptyMessage = 'No data available',
  className = '',
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <div className={styles.boardHeader}>
        <h3 className={styles.boardTitle}>{title}</h3>
      </div>

      <table className={styles.boardTable}>
        <thead>
          <tr className={styles.tableHeaderRow}>
            {showCheckbox && (
              <th className={styles.tableHeader}>
                <input type="checkbox" className={styles.checkbox} />
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                className={styles.tableHeader}
                style={{
                  width: column.width,
                  textAlign: column.align || 'left',
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr key={row.id || row._id || index} className={styles.tableRow}>
                {showCheckbox && (
                  <td className={styles.tableCell}>
                    <input type="checkbox" className={styles.checkbox} />
                  </td>
                )}
                {renderRow(row, startIndex + index)}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (showCheckbox ? 1 : 0)} className={styles.emptyState}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showFooter && data.length > 0 && (
        <div className={styles.tableFooter}>
          <span className={styles.showingText}>
            Showing {startIndex + 1} to {endIndex} of {data.length} entries
          </span>
        </div>
      )}
    </div>
  );
};

BoardTable.propTypes = {
  title: PropTypes.string,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.node.isRequired,
      width: PropTypes.string,
      align: PropTypes.oneOf(['left', 'center', 'right']),
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  renderRow: PropTypes.func.isRequired,
  showCheckbox: PropTypes.bool,
  showFooter: PropTypes.bool,
  currentPage: PropTypes.number,
  itemsPerPage: PropTypes.number,
  emptyMessage: PropTypes.node,
  className: PropTypes.string,
};

export default BoardTable;
