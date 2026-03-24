
import styles from '../../../assets/styles/seller/ListingsPage.module.css';

const ListingsPagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={styles.paginationContainer}>
      <button
        className={styles.paginationArrow}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ←
      </button>

      {pages.map((page) => (
        <button
          key={page}
          className={`${styles.paginationButton} ${page === currentPage ? styles.paginationActive : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page.toString().padStart(2, '0')}
        </button>
      ))}

      <button
        className={styles.paginationArrow}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        →
      </button>
    </div>
  );
};

export default ListingsPagination;
