import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { homeService } from '../../services/api';
import { PUBLIC_ROUTES } from '../../constants/routes';

const styles = {
  bannerContainer: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: '500px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
    zIndex: 0,
    pointerEvents: 'none',
  },
  decorativeShape1: {
    position: 'absolute',
    top: '-10%',
    right: '-5%',
    width: '40%',
    height: '40%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
    borderRadius: '50%',
    filter: 'blur(40px)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  decorativeShape2: {
    position: 'absolute',
    bottom: '-15%',
    left: '-10%',
    width: '50%',
    height: '50%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)',
    borderRadius: '50%',
    filter: 'blur(60px)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  decorativeCircles: {
    position: 'absolute',
    top: '20%',
    right: '15%',
    width: '300px',
    height: '300px',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '50%',
    zIndex: 1,
    pointerEvents: 'none',
  },
  decorativeCircles2: {
    position: 'absolute',
    top: '25%',
    right: '12%',
    width: '250px',
    height: '250px',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '50%',
    zIndex: 1,
    pointerEvents: 'none',
  },
  contentWrapper: {
    position: 'relative',
    zIndex: 2,
    minHeight: '500px',
  },
  textContent: {
    animation: 'fadeInLeft 0.8s ease-out',
  },
  subtitle: {
    fontSize: '1rem',
    fontWeight: '500',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: '1rem',
    opacity: 0.9,
  },
  title: {
    fontSize: '4rem',
    fontWeight: '800',
    lineHeight: '1.1',
    marginBottom: '1.5rem',
    textShadow: '0 2px 20px rgba(0,0,0,0.1)',
  },
  description: {
    fontSize: '1.25rem',
    fontWeight: '400',
    opacity: 0.95,
    marginBottom: '2rem',
    lineHeight: '1.6',
  },
  ctaButton: {
    padding: '15px 40px',
    fontSize: '1.1rem',
    fontWeight: '600',
    borderRadius: '50px',
    border: 'none',
    background: 'white',
    color: '#667eea',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-block',
  },
  imageWrapper: {
    position: 'relative',
    animation: 'fadeInRight 0.8s ease-out',
  },
  productImage: {
    maxHeight: '450px',
    width: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
    transition: 'transform 0.3s ease',
  },
  controlBtn: {
    width: '55px',
    height: '55px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#667eea',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
    border: 'none',
  },
};

const HeroBanner = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const response = await homeService.getBanners();
        const apiData = Array.isArray(response) ? response : response.data || [];
        setBanners(apiData);
      } catch (err) {
        console.error('Error fetching banners:', err);
        setError(err.message);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const handleBannerClick = async (bannerId) => {
    try {
      await homeService.incrementBannerClick(bannerId);
    } catch (err) {
      console.error('Error tracking banner click:', err);
    }
  };

  if (loading) {
    return (
      <section style={styles.bannerContainer}>
        <div
          className="container h-100 d-flex align-items-center justify-content-center"
          style={{ minHeight: '400px' }}
        >
          <div className="spinner-border text-white" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </section>
    );
  }

  if (!banners.length) {
    return (
      <section style={styles.bannerContainer}>
        <div
          className="container h-100 d-flex align-items-center justify-content-center text-white"
          style={{ minHeight: '400px' }}
        >
          <p className="fs-5">No banners available at the moment</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <style>
        {`
          @keyframes fadeInLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes fadeInRight {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .banner-indicator {
            width: 10px !important;
            height: 10px !important;
            border-radius: 50%;
            background-color: rgba(255,255,255,0.4) !important;
            border: none !important;
            margin: 0 5px !important;
            transition: all 0.4s ease;
            cursor: pointer;
          }
          .banner-indicator.active {
            width: 35px !important;
            border-radius: 5px;
            background-color: rgba(255,255,255,0.95) !important;
            box-shadow: 0 2px 8px rgba(255,255,255,0.3);
          }
          .banner-indicator:hover {
            background-color: rgba(255,255,255,0.6) !important;
            transform: scale(1.2);
          }
          .hero-cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
          }
          .hero-control-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
            background-color: #fff !important;
          }
          .hero-product-image:hover {
            transform: scale(1.05);
          }
          .carousel-item {
            transition: transform 0.8s ease-in-out;
          }
        `}
      </style>

      <div
        id="heroBannerCarousel"
        className="carousel slide"
        data-bs-ride="carousel"
        data-bs-interval="5000"
      >
        <div className="carousel-inner">
          {banners.map((banner, index) => (
            <div
              key={banner._id}
              className={`carousel-item ${index === 0 ? 'active' : ''}`}
              data-bs-interval="5000"
            >
              <div style={styles.bannerContainer}>
                <div style={styles.gradientOverlay}></div>
                <div style={styles.decorativeShape1}></div>
                <div style={styles.decorativeShape2}></div>
                <div style={styles.decorativeCircles}></div>
                <div style={styles.decorativeCircles2}></div>

                <div
                  className="container"
                  style={{ ...styles.contentWrapper, pointerEvents: 'none' }}
                >
                  <div className="row align-items-center h-100 py-5">
                    <div
                      className="col-lg-6 text-white"
                      style={{ ...styles.textContent, pointerEvents: 'auto' }}
                    >
                      <div style={styles.subtitle}>{banner.subtitle || 'Best Deal Online'}</div>
                      <h1 style={styles.title}>{banner.title}</h1>
                      <p style={styles.description}>{banner.description}</p>
                      {banner.buttonText && banner.buttonLink && (
                        <a
                          href={banner.buttonLink}
                          className="hero-cta-button"
                          style={styles.ctaButton}
                          onClick={() => handleBannerClick(banner._id)}
                        >
                          {banner.buttonText} →
                        </a>
                      )}
                    </div>

                    <div
                      className="col-lg-6"
                      style={{ ...styles.imageWrapper, pointerEvents: 'auto' }}
                    >
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="hero-product-image"
                        style={styles.productImage}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="carousel-indicators"
          style={{
            bottom: '30px',
            margin: '0',
            zIndex: 10,
          }}
        >
          {banners.map((banner, index) => (
            <button
              key={banner._id}
              type="button"
              data-bs-target="#heroBannerCarousel"
              data-bs-slide-to={index}
              className={`banner-indicator ${index === 0 ? 'active' : ''}`}
              aria-current={index === 0 ? 'true' : undefined}
              aria-label={`Slide ${index + 1}`}
            ></button>
          ))}
        </div>

        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#heroBannerCarousel"
          data-bs-slide="prev"
          style={{ width: '10%', zIndex: 10, border: 'none', background: 'transparent' }}
        >
          <span
            className="hero-control-btn"
            style={{ ...styles.controlBtn, pointerEvents: 'none' }}
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#heroBannerCarousel"
          data-bs-slide="next"
          style={{ width: '10%', zIndex: 10, border: 'none', background: 'transparent' }}
        >
          <span
            className="hero-control-btn"
            style={{ ...styles.controlBtn, pointerEvents: 'none' }}
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </section>
  );
};

export default HeroBanner;
