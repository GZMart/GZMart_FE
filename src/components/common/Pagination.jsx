import React from 'react';
import styles from '@assets/styles/common/Pagination.module.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 3; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 2; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className={styles.paginationContainer}>
            <button
                className={styles.paginationArrow}
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <i className="bi bi-chevron-left"></i>
            </button>

            {getPageNumbers().map((page, index) =>
                page === '...' ? (
                    <span key={`dots-${index}`} className={styles.paginationDots}>
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        className={`${styles.paginationButton} ${page === currentPage ? styles.active : ''}`}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                className={styles.paginationArrow}
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                <i className="bi bi-chevron-right"></i>
            </button>
        </div>
    );
};

export default Pagination;
