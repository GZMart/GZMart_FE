import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import CategoryCard from '@components/common/CategoryCard';
import CategoryListItem from '@components/common/CategoryListItem';
import styles from '@assets/styles/CategoriesPage.module.css';
import { categoryService } from '../../services/api';

const breadcrumbItems = [
  { label: 'Home', path: '/' },
  { label: 'Categories', path: '/categories', isActive: true },
];

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [itemsToShow, setItemsToShow] = useState(12);
  const [sortBy, setSortBy] = useState('position');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getCategoriesWithCounts();

        if (!isMounted) {
          return;
        }

        const categoriesData = response.data?.data || [];

        // Transform backend data to component format
        const transformed = categoriesData.map((cat) => ({
          id: cat._id,
          name: cat.name,
          image: cat.image || cat.imageUrl || 'https://via.placeholder.com/300',
          productCount: cat.productCount || 0,
        }));

        setCategories(transformed);
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching categories:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sort categories
  const sortedCategories = [...categories].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'popular':
        return (b.productCount || 0) - (a.productCount || 0);
      default:
        return 0;
    }
  });

  // Calculate displayed categories
  const totalCategories = sortedCategories.length;
  const displayedCategories = sortedCategories.slice(0, itemsToShow);

  if (loading) {
    return (
      <div className={styles.categoriesPage}>
        <Breadcrumb items={breadcrumbItems} />
        <div className={styles.container}>
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.categoriesPage}>
      <Breadcrumb items={breadcrumbItems} />

      <div className={styles.container}>
        {/* Header Controls */}
        <div className={styles.categoriesHeader}>
          <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Go back">
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
