import React from 'react';
import { motion } from 'framer-motion';

// --- CẤU HÌNH DATA ---
const BRANDS = [
  { id: 1, name: 'ZARA', logoImg: '/zara.png' },
  { id: 2, name: 'D&G', logoImg: '/dg.png' },
  { id: 3, name: 'H&M', logoImg: '/hm.png' },
  { id: 4, name: 'CHANEL', logoImg: '/chanel.png' },
  { id: 5, name: 'PRADA', logoImg: '/prada.png' },
  { id: 6, name: 'BIBA', logoImg: '/biba.png' },
];

const ShopByBrands = () => {
  // --- THAY ĐỔI Ở ĐÂY ---
  // Variants cho animation của hình ảnh
  const imageVariants = {
    rest: {
      filter: 'grayscale(0%) opacity(1)', // Hiện màu gốc và rõ nét ngay từ đầu
      scale: 1,
    },
    hover: {
      filter: 'grayscale(0%) opacity(1)', // Vẫn giữ màu gốc khi hover
      scale: 1.1, // Vẫn giữ hiệu ứng phóng to nhẹ cho đẹp
    },
  };

  // Variants cho thẻ card chứa ảnh (Giữ nguyên)
  const cardVariants = {
    rest: {
      scale: 1,
      backgroundColor: '#F3F4F6',
      boxShadow: '0 0 0 rgba(0,0,0,0)',
    },
    hover: {
      scale: 1.05,
      backgroundColor: '#ffffff',
      boxShadow: '0 .5rem 1rem rgba(0,0,0,0.15)',
    },
  };

  return (
    <div className="container py-5">
      {/* Tiêu đề section */}
      <motion.h3
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="fw-bold mb-4 text-dark"
      >
        SHOP BY BRANDS
      </motion.h3>

      {/* Lưới thương hiệu */}
      <div className="row g-3">
        {BRANDS.map((brand, index) => (
          <div key={brand.id} className="col-6 col-md-4 col-lg-2">
            <motion.div
              initial="rest"
              whileHover="hover"
              animate="rest"
              variants={cardVariants}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="d-flex align-items-center justify-content-center rounded-3 p-3"
              style={{
                height: '100px',
                cursor: 'pointer',
              }}
            >
              <motion.img
                variants={imageVariants}
                transition={{ duration: 0.3 }}
                src={brand.logoImg}
                alt={`${brand.name} logo`}
                className="img-fluid"
                style={{
                  maxHeight: '50px',
                  maxWidth: '90%',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentNode.innerText = brand.name;
                  e.target.parentNode.style.color = '#555';
                  e.target.parentNode.style.fontWeight = 'bold';
                }}
              />
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopByBrands;
