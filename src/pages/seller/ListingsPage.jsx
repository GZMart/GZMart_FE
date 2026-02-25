import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import PageFilters from '../../components/common/PageFilters';
import ProductTable from '../../components/common/ProductTable';
import ListingsPagination from '../../components/seller/listings/ListingsPagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AddProductModal from '../../components/seller/listings/AddProductModal';
import styles from '../../assets/styles/seller/ListingsPage.module.css';
import { productService } from '../../services/api/productService';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

const ListingsPage = () => {
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    category: 'all',
    sort: 'newest',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [allListings, setAllListings] = useState([]); // Store all products
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const itemsPerPage = 5;

  // Fetch all products once from API
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call API to get seller's own products only
      const response = await productService.getMyProducts({ limit: 1000 });

      if (response.success) {
        // Transform API data to match listings format
        const transformedListings = response.data.map((product) => {
          // Handle categoryId - can be object or string
          let categoryName = 'Uncategorized';
          if (product.categoryId) {
            if (typeof product.categoryId === 'object') {
              categoryName = product.categoryId.name || 'Uncategorized';
            } else {
              // If categoryId is just a string, show as ID (backend not populated)
              categoryName = product.category?.name || 'Uncategorized';
            }
          }

          return {
            id: product._id,
            image:
              product.images?.[0] || product.tiers?.[0]?.images?.[0] || '/images/placeholder.jpg',
            name: product.name,
            category: categoryName,
            price: formatCurrency(product.originalPrice),
            status: mapProductStatus(product.status),
            sku: product.models?.[0]?.sku || 'N/A',
            brand: product.brand || 'N/A',
            inStock: product.models?.some((m) => m.stock > 0) || false,
            // Keep original data for filtering
            _originalStatus: product.status,
            _originalCategory: categoryName,
            _createdAt: product.createdAt,
            _price: product.originalPrice,
          };
        });
        setAllListings(transformedListings);
      } else {
        setError('Failed to load listings');
      }
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setError(err.message || 'Failed to load listings');
      setAllListings([]);
    } finally {
      setLoading(false);
    }
  };

  // Map product status to listing status
  const mapProductStatus = (status) => {
    const statusMap = {
      active: 'Approved',
      inactive: 'On Hold',
      draft: 'Pending',
    };
    return statusMap[status] || 'Unapproved';
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Client-side filtering and sorting
  const getFilteredAndSortedListings = () => {
    let filtered = [...allListings];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter((item) => item._originalStatus === filters.status);
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter((item) => item._originalCategory === filters.category);
    }

    // Sort
    switch (filters.sort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b._createdAt) - new Date(a._createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a._createdAt) - new Date(b._createdAt));
        break;
      case 'price-low':
        filtered.sort((a, b) => a._price - b._price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b._price - a._price);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    return filtered;
  };

  // Get paginated listings for current page
  const filteredListings = getFilteredAndSortedListings();
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedListings = filteredListings.slice(startIndex, endIndex);

  // Get unique categories for filter
  const uniqueCategories = ['all', ...new Set(allListings.map((item) => item._originalCategory))];

  const handleAddItem = () => {
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleEditItem = async (product) => {
    try {
      setLoading(true);

      // Fetch full product details from API
      const response = await productService.getById(product.id);

      if (response.success) {
        setEditingProduct(response.data);
        setShowAddModal(true);
      } else {
        console.error('❌ Failed to fetch product details:', response);
        alert('Failed to load product details. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error fetching product details:', error);
      alert('Failed to load product details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
  };

  const handleProductAdded = (product) => {
    // Refresh listings to show the new/updated product
    fetchListings();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Show loading state
  if (loading && allListings.length === 0) {
    return (
      <div className={styles.listingsPage}>
        <PageHeader
          title="Listings"
          subtitle="Returned orders by customers."
          buttonText="ADD ITEM"
          onButtonClick={handleAddItem}
        />
        <div className={styles.content}>
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: '400px' }}
          >
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.listingsPage}>
        <PageHeader
          title="Listings"
          subtitle="Returned orders by customers."
          buttonText="ADD ITEM"
          onButtonClick={handleAddItem}
        />
        <div className={styles.content}>
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error Loading Listings</h4>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchListings}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listingsPage}>
      <PageHeader
        title="Listings"
        subtitle="Returned orders by customers."
        buttonText="ADD ITEM"
        onButtonClick={handleAddItem}
      />

      <div className={styles.content}>
        <PageFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          filterConfigs={[
            {
              name: 'status',
              label: 'Status',
              options: [
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'draft', label: 'Draft' },
              ],
            },
            {
              name: 'category',
              label: 'Category',
              options: uniqueCategories.map((cat) => ({
                value: cat,
                label: cat === 'all' ? 'All Categories' : cat,
              })),
            },
            {
              name: 'sort',
              label: 'Sort By',
              options: [
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'price-low', label: 'Price: Low to High' },
                { value: 'price-high', label: 'Price: High to Low' },
                { value: 'name-asc', label: 'Name: A-Z' },
                { value: 'name-desc', label: 'Name: Z-A' },
              ],
            },
          ]}
        />

        {loading ? (
          <div className="d-flex justify-content-center p-5">
            <LoadingSpinner />
          </div>
        ) : paginatedListings.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No listings found. Start by adding your first product!</p>
            <button className="btn btn-primary" onClick={handleAddItem}>
              Add Product
            </button>
          </div>
        ) : (
          <>
            <ProductTable
              products={paginatedListings}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              showActions={true}
              actions={[
                {
                  label: 'Edit',
                  icon: 'bi bi-pencil',
                  onClick: (product) => handleEditItem(product),
                },
                {
                  label: 'Hide',
                  icon: 'bi bi-eye-slash',
                  onClick: () => {},
                },
                {
                  label: 'Delete',
                  icon: 'bi bi-trash',
                  onClick: () => {},
                },
              ]}
            />

            <ListingsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      <AddProductModal
        show={showAddModal}
        onHide={handleCloseModal}
        onSuccess={handleProductAdded}
        editingProduct={editingProduct}
      />
    </div>
  );
};

export default ListingsPage;
