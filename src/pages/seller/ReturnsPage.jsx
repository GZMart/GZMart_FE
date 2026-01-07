import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import PageFilters from '../../components/common/PageFilters';
import ReturnsTable from '../../components/seller/returns/ReturnsTable';
import ListingsPagination from '../../components/seller/listings/ListingsPagination';
import styles from '../../assets/styles/seller/ListingsPage.module.css';

const ReturnsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sample data matching the image
  const [returns] = useState([
    {
      id: 1,
      image: '/images/placeholder.jpg',
      name: 'Retrospac Toy Bicycle for Children',
      category: 'Children Toys',
      price: '$220',
      status: 'On Bold',
    },
    {
      id: 2,
      image: '/images/placeholder.jpg',
      name: 'Halnalca Call Receiver Set of Two',
      category: 'Mobile & Accessories',
      price: '$150',
      status: 'Dispatched',
    },
    {
      id: 3,
      image: '/images/placeholder.jpg',
      name: 'Bell Bottom Jeans for Women',
      category: 'Apparel',
      price: '$50',
      status: 'Pending',
    },
    {
      id: 4,
      image: '/images/placeholder.jpg',
      name: 'High Quality Condenser Mic',
      category: 'Music Accessories',
      price: '$180',
      status: 'Approved',
    },
    {
      id: 5,
      image: '/images/placeholder.jpg',
      name: 'Tilt-Tok Mini Toy Gun 3D STL File',
      category: 'Music Accessories',
      price: '$230',
      status: 'Canc',
    },
  ]);

  const [filters, setFilters] = useState({
    status: 'All Status',
    reason: 'All Reasons',
    date: 'All Time',
  });

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const totalPages = Math.ceil(returns.length / itemsPerPage);

  return (
    <div className={styles.listingsPage}>
      <PageHeader title="Returns" subtitle="Returned orders by customers." showButton={false} />

      <PageFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        filterConfigs={[
          {
            name: 'status',
            label: 'Status',
            options: [
              'All Status',
              'Pending Review',
              'Approved',
              'Rejected',
              'Refunded',
              'Replaced',
            ],
          },
          {
            name: 'reason',
            label: 'Return Reason',
            options: [
              'All Reasons',
              'Defective',
              'Wrong Item',
              'Not as Described',
              'Changed Mind',
              'Other',
            ],
          },
          {
            name: 'date',
            label: 'Date',
            options: ['All Time', 'Today', 'Last 7 Days', 'Last 30 Days', 'Last 3 Months'],
          },
        ]}
      />

      {/* Content */}
      <div className={styles.content}>
        <ReturnsTable returns={returns} currentPage={currentPage} itemsPerPage={itemsPerPage} />

        <ListingsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default ReturnsPage;
