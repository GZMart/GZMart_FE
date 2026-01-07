import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// --- Custom Styles (Có thể tách ra file CSS riêng) ---
const styles = {
  bannerContainer: {
    backgroundColor: '#0a58ca', // Màu nền xanh chủ đạo
    position: 'relative',
    overflow: 'hidden',
    minHeight: '400px', // Chiều cao tối thiểu
  },
  // Tạo họa tiết nền màu vàng bằng CSS (đơn giản hóa)
  bgDecoration: {
    position: 'absolute',
    top: '-30%',
    right: '-20%',
    width: '70%',
    paddingBottom: '70%', // Tạo hình vuông để bo tròn
    backgroundColor: '#fca311', // Màu vàng cam
    borderRadius: '50%',
    zIndex: 0,
    opacity: 0.9,
  },
  bgDecorationLine: {
    position: 'absolute',
    top: '10%',
    right: '30%',
    width: '400px',
    height: '400px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: '50%',
    zIndex: 0,
  },
  // Style cho nút điều hướng tròn màu trắng
  controlBtn: {
    width: '50px',
    height: '50px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  productImage: {
    maxHeight: '500px',
    objectFit: 'contain',
    transform: 'rotate(-15deg) translateX(20px)', // Xoay nhẹ để tạo hiệu ứng động
    zIndex: 2,
    position: 'relative',
  },
};
// ----------------------------------------------------

const HeroBanner = () => {
  return (
    <section>
      <div id="heroBannerCarousel" className="carousel slide" data-bs-ride="carousel">
        {/* --- 1. Carousel Indicators (Các chấm tròn bên dưới) --- */}
        <div
          className="carousel-indicators justify-content-start container ms-auto mb-4"
          style={{
            zIndex: 2,
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {/* Custom CSS cho indicators để tạo thanh dài và chấm tròn */}
          <style>
            {`
              .banner-indicator {
                width: 8px !important;
                height: 8px !important;
                border-radius: 50%;
                background-color: rgba(255,255,255,0.5) !important;
                border: none !important;
                margin: 0 4px !important;
                transition: all 0.3s ease;
              }
              .banner-indicator.active {
                width: 25px !important;
                border-radius: 4px;
                background-color: #fff !important;
              }
            `}
          </style>
          <button
            type="button"
            data-bs-target="#heroBannerCarousel"
            data-bs-slide-to="0"
            className="active banner-indicator"
            aria-current="true"
            aria-label="Slide 1"
          ></button>
          <button
            type="button"
            data-bs-target="#heroBannerCarousel"
            data-bs-slide-to="1"
            className="banner-indicator"
            aria-label="Slide 2"
          ></button>
          <button
            type="button"
            data-bs-target="#heroBannerCarousel"
            data-bs-slide-to="2"
            className="banner-indicator"
            aria-label="Slide 3"
          ></button>
          {/* Thêm các chấm khác nếu cần */}
        </div>

        {/* --- 2. Carousel Inner (Nội dung chính) --- */}
        <div className="carousel-inner">
          {/* --- Slide 1 (Active) --- */}
          <div className="carousel-item active" style={styles.bannerContainer}>
            {/* Họa tiết trang trí nền */}
            <div style={styles.bgDecoration}></div>
            <div style={styles.bgDecorationLine}></div>

            <div className="container h-100 position-relative" style={{ zIndex: 1 }}>
              <div className="row align-items-center h-100 py-5">
                {/* Left Content: Text */}
                <div className="col-md-6 col-lg-6 text-white py-5">
                  <h5 className="fw-light mb-3 fs-4">Best Deal Online on smart watches</h5>
                  <h1
                    className="display-3 fw-bolder text-uppercase mb-3"
                    style={{ letterSpacing: '-1px' }}
                  >
                    LATEST NIKE SHOES
                  </h1>
                  <p className="fs-3 fw-light mb-4">
                    UP to <span className="fw-bold">80% OFF</span>
                  </p>
                  {/* Nút bấm (Tùy chọn thêm) */}
                  {/* <button className="btn btn-light btn-lg rounded-pill px-4 fw-bold">Shop Now</button> */}
                </div>

                {/* Right Content: Image */}
                <div className="col-md-6 col-lg-6 text-center text-md-end">
                  <img
                    src="/nike-shoes-banner.png" // <-- Đảm bảo bạn có ảnh này trong folder public
                    alt="Nike Shoes"
                    className="img-fluid"
                    style={styles.productImage}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- Slide 2 (Ví dụ để test carousel) --- */}
          {/* Bạn có thể copy structure Slide 1 xuống đây và thay đổi nội dung/màu sắc */}
          {/* <div className="carousel-item" style={{...styles.bannerContainer, backgroundColor: '#5a0000'}}> ... </div> */}
        </div>

        {/* --- 3. Carousel Controls (Nút mũi tên) --- */}
        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#heroBannerCarousel"
          data-bs-slide="prev"
          style={{ width: '8%', zIndex: 3 }}
        >
          <span style={styles.controlBtn}>
            <ChevronLeft size={28} />
          </span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#heroBannerCarousel"
          data-bs-slide="next"
          style={{ width: '8%', zIndex: 3 }}
        >
          <span style={styles.controlBtn}>
            <ChevronRight size={28} />
          </span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </section>
  );
};

export default HeroBanner;
