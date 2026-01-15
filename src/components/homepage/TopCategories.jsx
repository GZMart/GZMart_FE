import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { categoryService } from '../../services/api';
import { PUBLIC_ROUTES } from '../../constants/routes';

const TopCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getTopCategories(8);
        const apiData = Array.isArray(response) ? response : response.data || [];
        setCategories(apiData);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

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
            <h3 className="fw-bold m-0" style={{ color: '#FFC107' }}>
              TOP CATEGORIES
            </h3>
          </div>

          <Link to={PUBLIC_ROUTES.CATEGORIES} style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#e0a800' }}
              whileTap={{ scale: 0.95 }}
              className="d-flex align-items-center justify-content-center px-3 py-2 rounded fw-bold text-dark"
              style={{
                backgroundColor: '#FCBD01',
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
          <div className="d-flex flex-wrap justify-content-center justify-content-lg-between gap-4">
            {categories.map((cat, index) => (
              <Link
                key={cat._id || cat.id || index}
                to={`${PUBLIC_ROUTES.PRODUCTS}?category=${cat._id || cat.id}`}
                style={{ textDecoration: 'none' }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="d-flex flex-column align-items-center"
                  style={{ cursor: 'pointer', width: '120px' }}
                >
                  <motion.div
                    whileHover={{
                      scale: 1.1,
                      borderColor: '#0D6EFD',
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TopCategories;
