import { useState } from 'react';
import Breadcrumb from '@components/common/Breadcrumb';
import CategoryCard from '@components/common/CategoryCard';
import CategoryListItem from '@components/common/CategoryListItem';
import styles from '@assets/styles/CategoriesPage.module.css';
import { breadcrumbItems, categories } from '@utils/data/CategoriesPage_MockData';

const CategoriesPage = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [itemsToShow, setItemsToShow] = useState(12);
  const [sortBy, setSortBy] = useState('position');

  // Calculate displayed categories
  const totalCategories = categories.length;
  const displayedCategories = categories.slice(0, itemsToShow);

  return (
    <div className={styles.categoriesPage}>
      <Breadcrumb items={breadcrumbItems} />

      <div className={styles.container}>
        {/* Header Controls */}
        <div className={styles.categoriesHeader}>
          <button className={styles.backButton}>
            <i className="bi bi-arrow-left"></i>
          </button>

          <h1 className={styles.pageTitle}>All Categories</h1>

          <div className={styles.categoriesControls}>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <i className="bi bi-grid-3x3-gap"></i>
              </button>
              <button
                className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <i className="bi bi-list-ul"></i>
              </button>
            </div>

            <div className={styles.infoText}>
              Showing 1 - {displayedCategories.length} of {totalCategories} items
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>To Show:</label>
              <select
                className={styles.filterSelect}
                value={itemsToShow}
                onChange={(e) => setItemsToShow(Number(e.target.value))}
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={totalCategories}>All</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <select
                className={styles.filterSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="position">Position</option>
                <option value="name">Name</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Grid/List */}
        {viewMode === 'grid' ? (
          <div className={styles.categoryGrid}>
            {displayedCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category.name}
                image={category.image}
                link={`/categories/${category.id}/products`}
              />
            ))}
          </div>
        ) : (
          <div className={styles.categoryList}>
            {displayedCategories.map((category) => (
              <CategoryListItem
                key={category.id}
                category={category.name}
                image={category.image}
                link={`/categories/${category.id}/products`}
                productCount={category.productCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
