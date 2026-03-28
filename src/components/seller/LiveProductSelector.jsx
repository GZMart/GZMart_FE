// GZMart_FE/src/components/seller/LiveProductSelector.jsx
import { useState, useEffect } from 'react';
import { productService } from '@services/api/productService';

export default function LiveProductSelector({ isOpen, onClose, onAdd, loading, existingProductIds = [] }) {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoadingProducts(true);
    setSelected(new Set(existingProductIds.map((id) => String(id))));
    productService
      .getMyProducts({ limit: 100, status: 'active' })
      .then((res) => {
        const list = res?.data || res || [];
        setProducts(Array.isArray(list) ? list : list.data || []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [isOpen]);

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    if (selected.size === 0) return;
    onAdd(Array.from(selected));
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '1rem',
          width: '90vw',
          maxWidth: 600,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e8e8e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Add Products to Live</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#888' }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f0f0f0' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your products..."
            style={{
              width: '100%',
              padding: '0.5rem 0.875rem',
              borderRadius: '9999px',
              border: '1.5px solid #e8e8e8',
              fontSize: '0.8rem',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(177,60,54,0.4)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e8e8e8'; }}
          />
        </div>

        {/* Product list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {loadingProducts ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No products found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filtered.map((product) => {
                const isSelected = selected.has(product._id);
                return (
                  <div
                    key={product._id}
                    onClick={() => toggleSelect(product._id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem',
                      borderRadius: '0.5rem',
                      border: isSelected ? '2px solid #B13C36' : '1.5px solid #e8e8e8',
                      background: isSelected ? '#fff5f5' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        borderRadius: '0.25rem',
                        border: `2px solid ${isSelected ? '#B13C36' : '#ccc'}`,
                        background: isSelected ? '#B13C36' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && <i className="bi bi-check" style={{ color: '#fff', fontSize: '0.6rem' }} />}
                    </div>
                    <img
                      src={product.thumbnail || product.images?.[0] || '/placeholder.png'}
                      alt={product.name}
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.375rem',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                      onError={(e) => { e.target.src = '/placeholder.png'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#1c1b1b',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {product.name}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: '#B13C36', fontWeight: 700 }}>
                        {product.price != null ? `$${Number(product.price).toFixed(2)}` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid #e8e8e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#888' }}>
            {selected.size > 0 ? `${selected.size} product${selected.size > 1 ? 's' : ''} selected` : 'Select products'}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                border: '1.5px solid #e8e8e8',
                background: '#fff',
                color: '#555',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selected.size === 0 || loading}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '9999px',
                border: 'none',
                background: selected.size === 0 ? '#e0e0e0' : '#B13C36',
                color: '#fff',
                cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Adding...' : `Add (${selected.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
