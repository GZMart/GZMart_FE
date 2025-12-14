import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const CATEGORIES = [
  {
    id: 1,
    name: 'Dresses',
    image:
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 2,
    name: 'Tops & Tees',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 3,
    name: 'Pants & Jeans',
    image:
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 4,
    name: 'Outerwear',
    image:
      'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 5,
    name: 'Skirts',
    image:
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 6,
    name: 'Matching Sets',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=200&q=80',
  },
];

const TopCategories = () => {
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

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn fw-bold d-flex align-items-center gap-2 px-4 rounded-1"
            style={{ backgroundColor: '#FFC107', border: 'none', color: '#000' }}
          >
            VIEW ALL
          </motion.button>
        </div>

        <hr className="my-4 text-secondary opacity-25" />

        <div className="d-flex flex-wrap justify-content-center justify-content-lg-between gap-4">
          {CATEGORIES.map((cat, index) => (
            <motion.div
              key={cat.id}
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
                  src={cat.image}
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopCategories;
