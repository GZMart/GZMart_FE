import React from 'react';
import { motion } from 'framer-motion';

const clothingDeals = [
  {
    id: 1,
    name: "Men's Casual Slim Fit Shirt",
    image:
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bWVucyUyMHNoaXJ0fGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
    price: '599.000 VND',
    dealEndsIn: '5 Hours',
    isNew: true,
  },
  {
    id: 2,
    name: "Women's Floral Summer Dress",
    image:
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8ZHJlc3N8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
    price: '899.000 VND',
    dealEndsIn: '1 Hour',
    isNew: true,
  },
  {
    id: 3,
    name: 'Unisex Classic Denim Jacket',
    image:
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZGVuaW0lMjBqYWNrZXR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
    price: '1.299.000 VND',
    dealEndsIn: '5 Hours',
    isNew: true,
  },
  {
    id: 4,
    name: "Women's High-Waisted Jeans",
    image:
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8amVhbnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
    price: '799.000 VND',
    dealEndsIn: '1 Hour',
    isNew: true,
  },
];

const ProductCard = ({ product }) => {
  return (
    <motion.div
      className="card h-100 border-0 bg-transparent"
      whileHover={{ y: -10 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="p-3">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: '#FAFAFA',
            padding: '10px',
            borderRadius: '24px',
          }}
        >
          <div
            className="position-relative w-100 d-flex align-items-center justify-content-center"
            style={{
              backgroundColor: '#ECEDEF',
              borderRadius: '16px',
              height: '240px',
              overflow: 'hidden',
              padding: '24px',
            }}
          >
            {product.isNew && (
              <span
                className="position-absolute fw-bold text-white px-3 py-1"
                style={{
                  backgroundColor: '#FFC107',
                  top: '0',
                  left: '0',
                  borderRadius: '16px 0 16px 0',
                  fontSize: '0.85rem',
                  zIndex: 2,
                }}
              >
                New
              </span>
            )}

            <motion.img
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
              src={product.image}
              alt={product.name}
              className="img-fluid"
              style={{
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: '16px',
              }}
            />
          </div>
        </div>
      </div>

      <div className="card-body d-flex flex-column pt-0 px-3 pb-3">
        <div className="mb-2">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="fw-medium" style={{ color: '#007bff' }}>
              Flash Deal Ends in {product.dealEndsIn} !
            </small>
          </div>

          <div
            className="progress rounded-pill"
            style={{ height: '6px', backgroundColor: '#E9ECEF' }}
          >
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: product.dealEndsIn.includes('1 Hour') ? '85%' : '40%',
                backgroundColor: '#007bff',
              }}
              aria-valuenow="50"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>

        <h6
          className="card-title fw-bold text-dark mb-3 text-uppercase"
          style={{ lineHeight: '1.4', fontSize: '1.2rem' }}
        >
          {product.name}
        </h6>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-dark w-100 fw-bold py-2 mt-auto d-flex align-items-center justify-content-center gap-2"
          style={{
            borderRadius: '4px',
            fontSize: '0.85rem',
          }}
        >
          <span className="text-white">BUY NOW - </span>
          <span style={{ color: '#FFC107' }}>{product.price}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

const DealsOfTheDay = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className="py-5">
      <div className="container">
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-4">
          <h3 className="fw-bold text-dark mb-3 mb-md-0">TODAY'S DEALS OF THE DAY</h3>

          <div className="d-flex align-items-center gap-3">
            <span className="fs-6 text-dark text-nowrap">Deals ends in</span>

            <div
              className="d-flex align-items-center justify-content-center px-3 py-2 rounded fw-bold text-dark"
              style={{
                backgroundColor: '#FCBD01',
                minWidth: '160px',
                fontSize: '1rem',
              }}
            >
              <span>16d : 21h : 57m : 23s</span>
            </div>

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
          </div>
        </div>

        <motion.div
          className="row g-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {clothingDeals.map((product) => (
            <motion.div
              key={product.id}
              className="col-12 col-sm-6 col-lg-3"
              variants={itemVariants}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default DealsOfTheDay;
