import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from '@assets/styles/CategoryListItem.module.css';

const CategoryListItem = ({ category, image, link, productCount }) => (
  <Link to={link} className={styles.categoryListItem}>
    <div className={styles.listImageWrapper}>
      <img src={image} alt={category} className={styles.listCategoryImage} />
    </div>
    <div className={styles.listCategoryInfo}>
      <h3 className={styles.listCategoryName}>{category}</h3>
      {productCount && <p className={styles.listCategoryCount}>{productCount} products</p>}
    </div>
    <i className={`bi bi-chevron-right ${styles.listArrowIcon}`}></i>
  </Link>
);

CategoryListItem.propTypes = {
  category: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  productCount: PropTypes.number,
};

export default CategoryListItem;
