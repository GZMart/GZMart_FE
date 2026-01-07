/**
 * Mock Data for Seller Listings Page
 * Data generated from ProductsPage_MockData.js products
 */

import { products } from './ProductsPage_MockData.js';

// Generate listings from products with status
export const mockListings = products.map((product, index) => {
  const statuses = ['Approved', 'Approved', 'Unapproved', 'Approved', 'On Hold'];
  const statusIndex = index % statuses.length;

  return {
    id: product.id,
    image: product.image || product.tier_variations?.[0]?.images?.[0] || '/images/placeholder.jpg',
    name: product.name,
    category: product.category,
    price: Math.floor(product.price / 1000), // Convert VND to simpler number (e.g., 1250000 -> 1250)
    status: statuses[statusIndex],
    sku: product.sku,
    brand: product.brand,
    inStock: product.inStock,
  };
});

// Filter options
export const typeOptions = [
  'All Types',
  'Fashion',
  'Electronics',
  'Shoes',
  'Accessories',
  'Health',
  'Home Appliances',
  'Computer Components',
  'Music Accessories',
  'Children Toys',
];

export const monthOptions = [
  'All Months',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const urgencyOptions = ['All', 'High', 'Medium', 'Low'];

export default {
  mockListings,
  typeOptions,
  monthOptions,
  urgencyOptions,
};
