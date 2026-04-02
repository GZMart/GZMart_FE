import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from '@assets/styles/CategoryCard.module.css';

const CategoryCard = ({ category, image, link, isActive = false }) => (
  <Link to={link} className={`${styles.categoryCard} ${isActive ? styles.active : ''}`}>
    <div className={styles.imageWrapper}>
      <img src={image} alt={category} className={styles.categoryImage} />
    </div>
    <span className={styles.categoryLabel}>{category}</span>
  </Link>
);

CategoryCard.propTypes = {
  category: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
};

// Use JS default parameters instead of defaultProps for function components

export default CategoryCard;
