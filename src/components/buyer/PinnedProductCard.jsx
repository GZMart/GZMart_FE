// src/components/buyer/PinnedProductCard.jsx
import { useNavigate } from 'react-router-dom';

export default function PinnedProductCard({ product }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (product?._id) {
navigate(`/product/${product._id}`);
}
  };

  const cardStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.5rem 0.75rem',
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.875rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
    maxWidth: '20rem',
    width: '100%',
  };

  const thumbStyle = {
    width: '2.75rem',
    height: '2.75rem',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
  };

  const chipStyle = {
    background: 'rgba(183,0,72,0.25)',
    color: '#ff728f',
    border: '1px solid rgba(183,0,72,0.3)',
    fontSize: '0.5rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '0.125rem 0.375rem',
    borderRadius: '9999px',
    marginBottom: '0.25rem',
    display: 'inline-block',
  };

  const nameStyle = {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'white',
    lineHeight: 1.2,
    marginBottom: '0.125rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '11rem',
  };

  const priceStyle = {
    fontSize: '0.875rem',
    fontWeight: 800,
    color: '#b70048',
  };

  const chevronStyle = {
    color: 'rgba(255,255,255,0.4)',
    marginLeft: 'auto',
    fontSize: '1rem',
    flexShrink: 0,
    transition: 'color 0.2s',
  };

  return (
    <div
      style={cardStyle}
      onClick={handleClick}
      onMouseEnter={(e) => {
 e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; 
}}
      onMouseLeave={(e) => {
 e.currentTarget.style.background = 'rgba(0,0,0,0.35)'; 
}}
    >
      <div style={thumbStyle}>
        <img
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          src={product?.thumbnail || 'https://via.placeholder.com/44'}
          alt={product?.name || 'Product'}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={chipStyle}>Current Item</span>
        <div style={nameStyle}>{product?.name || 'Product Name'}</div>
        <div style={priceStyle}>${product?.price != null ? Number(product.price).toFixed(2) : '0.00'}</div>
      </div>
      <i
        className="bi bi-chevron-right"
        style={chevronStyle}
        onMouseEnter={(e) => {
 e.target.style.color = 'white'; 
}}
        onMouseLeave={(e) => {
 e.target.style.color = 'rgba(255,255,255,0.4)'; 
}}
      />
    </div>
  );
}
