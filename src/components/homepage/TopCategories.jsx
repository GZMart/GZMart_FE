import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { categoryService } from '../../services/api';
import { PUBLIC_ROUTES } from '../../constants/routes';

const TopCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const ITEMS_PER_PAGE = 16; // 2 hàng x 8 categories

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Fetch tất cả categories thay vì chỉ 8
        const response = await categoryService.getAll();
        const apiData = Array.isArray(response) ? response : response.data || [];

        // Sắp xếp categories theo độ phổ biến (productCount) - từ nhiều đến ít
        const sortedCategories = apiData.sort((a, b) => {
          const countA = a.productCount || 0;
          const countB = b.productCount || 0;
          return countB - countA; // Giảm dần (popular to less popular)
        });

        setCategories(sortedCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Tính toán số trang
  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);

  // Lấy categories cho trang hiện tại
  const getCurrentPageCategories = () => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return categories.slice(startIndex, endIndex);
  };

  // Chia thành 2 hàng
  const currentCategories = getCurrentPageCategories();
  const firstRow = currentCategories.slice(0, 8);
  const secondRow = currentCategories.slice(8, 16);

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  if (loading) {
    return (
      <section className="py-5">
        <div className="container text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5">
      <div className="container">
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 mb-3 mb-md-0">
            <h3 className="fw-bold text-dark m-0">SHOP FROM</h3>
            <h3 className="fw-bold m-0" style={{ color: 'var(--color-primary)' }}>
              TOP CATEGORIES
            </h3>
          </div>

          <Link to={PUBLIC_ROUTES.CATEGORIES} style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'var(--color-secondary)' }}
              whileTap={{ scale: 0.95 }}
              className="d-flex align-items-center justify-content-center px-3 py-2 rounded fw-bold text-white"
              style={{
                backgroundColor: 'var(--color-primary)',
                border: 'none',
              }}
            >
              VIEW ALL
            </motion.button>
          </Link>
        </div>

        <hr className="my-4 text-secondary opacity-25" />

        {categories.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted fs-5">No categories available at the moment</p>
          </div>
        ) : (
          <div className="position-relative">
            {/* Navigation Arrows - Hiển thị khi có > 16 categories */}
            {totalPages > 1 && (
              <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handlePrevPage}
                      className="position-absolute top-50 translate-middle-y d-flex align-items-center justify-content-center rounded-circle bg-white shadow"
                      style={{
                        left: '-20px',
                        width: '50px',
                        height: '50px',
                        border: '2px solid var(--color-border)',
                        zIndex: 10,
                        cursor: 'pointer',
                      }}
                    >
                      <ChevronLeft size={28} color="var(--color-primary)" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleNextPage}
                      className="position-absolute top-50 translate-middle-y d-flex align-items-center justify-content-center rounded-circle bg-white shadow"
                      style={{
                        right: '-20px',
                        width: '50px',
                        height: '50px',
                        border: '2px solid var(--color-border)',
                        zIndex: 10,
                        cursor: 'pointer',
                      }}
                    >
                      <ChevronRight size={28} color="var(--color-primary)" />
                    </motion.button>
              </>
            )}

            {/* Categories Grid - 2 hàng */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {/* Hàng 1 - 8 categories */}
                <div className="d-flex flex-wrap justify-content-center justify-content-lg-between gap-4 mb-4">
                  {firstRow.map((cat, index) => (
                    <CategoryCard key={cat._id || cat.id || index} cat={cat} index={index} />
                  ))}
                </div>

                {/* Hàng 2 - 8 categories */}
                {secondRow.length > 0 && (
                  <div className="d-flex flex-wrap justify-content-center justify-content-lg-between gap-4">
                    {secondRow.map((cat, index) => (
                      <CategoryCard key={cat._id || cat.id || index} cat={cat} index={index + 8} />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Pagination Dots - Hiển thị khi có > 1 trang */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
                {Array.from({ length: totalPages }).map((_, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentPage(index)}
                        className="rounded-circle"
                        style={{
                          width: currentPage === index ? '12px' : '8px',
                          height: currentPage === index ? '12px' : '8px',
                          backgroundColor: currentPage === index ? 'var(--color-primary)' : '#dee2e6',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                      />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

// Component CategoryCard để tránh code lặp
const CategoryCard = ({ cat, index }) => (
  <Link
    to={`${PUBLIC_ROUTES.PRODUCTS}?category=${cat._id || cat.id}`}
    style={{ textDecoration: 'none' }}
  >
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="d-flex flex-column align-items-center"
      style={{ cursor: 'pointer', width: '120px' }}
    >
      <motion.div
        whileHover={{
          scale: 1.1,
          borderColor: 'var(--color-primary)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        }}
        className="rounded-circle d-flex align-items-center justify-content-center mb-3 bg-light position-relative"
        style={{
          width: '120px',
          height: '120px',
          border: '2px solid transparent',
          transition: 'border-color 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <img
          src={cat.image || cat.imageUrl || 'https://via.placeholder.com/120'}
          alt={cat.name}
          className="img-fluid"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </motion.div>

      <span className="fw-semibold text-dark text-center">{cat.name}</span>
    </motion.div>
  </Link>
);

export default TopCategories;
