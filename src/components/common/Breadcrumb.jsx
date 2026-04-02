import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from '@assets/styles/common/Breadcrumb.module.css';

const Breadcrumb = ({ items }) => (
  <nav className={styles.breadcrumb} aria-label="breadcrumb">
    <div className={styles.container}>
      <ol className={styles.breadcrumbList}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className={styles.breadcrumbItem}>
              {index > 0 && <i className="bi bi-chevron-right"></i>}
              {isLast ? (
                <span className={styles.breadcrumbActive}>{item.label}</span>
              ) : (
                <Link to={item.path} className={styles.breadcrumbLink}>
                  {item.icon && <i className={`bi ${item.icon}`}></i>}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  </nav>
);

Breadcrumb.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string,
      icon: PropTypes.string,
    })
  ).isRequired,
};

export default Breadcrumb;
