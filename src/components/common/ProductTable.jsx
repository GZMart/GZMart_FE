import React from 'react';
import { Dropdown } from 'react-bootstrap';
import BoardTable from './BoardTable';
import styles from '../../assets/styles/seller/ListingsPage.module.css';

/**
 * Generic Product Table Component
 * Can be used for Listings, Returns, Orders, etc.
 */
const ProductTable = ({
  products,
  currentPage = 1,
  itemsPerPage = 10,
  showActions = true,
  actions = [],
  emptyMessage = 'No products found',
}) => {
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return styles.statusApproved;
      case 'unapproved':
        return styles.statusUnapproved;
      case 'on hold':
      case 'on bold':
        return styles.statusOnHold;
      case 'dispatched':
        return styles.statusDispatched;
      case 'pending':
        return styles.statusPending;
      case 'canc':
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return '';
    }
  };

  const renderProductRow = (product, index) => {
    return (
      <>
        <td className={styles.tableCell}>{index + 1}</td>
        <td className={styles.tableCell}>
          <img
            src={product.image || 'https://picsum.photos/600/600'}
            alt={product.name}
            className={styles.productImage}
          />
        </td>
        <td className={styles.tableCell}>
          <span className={styles.productName}>{product.name}</span>
        </td>
        <td className={styles.tableCell}>
          <span className={styles.category}>{product.category}</span>
        </td>
        <td className={styles.tableCell}>
          <span className={styles.price}>{product.price}</span>
        </td>
        <td className={styles.tableCell}>
          <span className={`${styles.statusBadge} ${getStatusClass(product.status)}`}>
            {product.status}
          </span>
        </td>
        <td className={styles.tableCell}>
          {showActions && actions.length > 0 ? (
            <Dropdown align="end">
              <Dropdown.Toggle as="button" className={styles.actionButton} bsPrefix="custom">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="3" r="1.5" fill="currentColor" />
                  <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                  <circle cx="8" cy="13" r="1.5" fill="currentColor" />
                </svg>
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {actions.map((action, idx) => (
                  <Dropdown.Item key={idx} onClick={() => action.onClick(product)}>
                    {action.icon && <i className={`${action.icon} me-2`}></i>}
                    {action.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <button className={styles.actionButton}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3" r="1.5" fill="currentColor" />
                <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                <circle cx="8" cy="13" r="1.5" fill="currentColor" />
              </svg>
            </button>
          )}
        </td>
      </>
    );
  };

  return (
    <BoardTable
      title="Board"
      columns={[
        { key: 'no', label: 'NO.' },
        { key: 'image', label: 'IMAGE' },
        { key: 'name', label: 'NAME' },
        { key: 'category', label: 'CATEGORY' },
        { key: 'price', label: 'PRICE' },
        { key: 'status', label: 'STATUS' },
        { key: 'action', label: 'ACTION' },
      ]}
      data={products}
      renderRow={renderProductRow}
      showCheckbox={true}
      showFooter={true}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      emptyMessage={emptyMessage}
    />
  );
};

export default ProductTable;
