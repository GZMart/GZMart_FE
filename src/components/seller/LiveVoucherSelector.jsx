// GZMart_FE/src/components/seller/LiveVoucherSelector.jsx
import { useState, useEffect } from 'react';
import voucherService from '@services/api/voucherService';

export default function LiveVoucherSelector({ isOpen, onClose, onAdd, loading, existingVoucherIds = [] }) {
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoadingVouchers(true);
    setSelected(new Set(existingVoucherIds.map((id) => String(id))));
    voucherService
      .getVouchers({ limit: 100, type: 'live', status: 'active' })
      .then((res) => {
        const list = res?.data?.data || res?.data || [];
        setVouchers(Array.isArray(list) ? list.filter((v) => v.status === 'active') : []);
      })
      .catch(() => setVouchers([]))
      .finally(() => setLoadingVouchers(false));
  }, [isOpen, existingVoucherIds]);

  const filtered = vouchers.filter((v) =>
    v.code?.toLowerCase().includes(search.toLowerCase()) ||
    v.name?.toLowerCase().includes(search.toLowerCase())
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

  const formatDiscount = (v) => {
    if (v.discountType === 'percent') return `${v.discountValue}% OFF`;
    if (v.discountType === 'amount') return `₫${Number(v.discountValue).toLocaleString()} OFF`;
    if (v.discountType === 'coin') return `${v.discountValue} coins`;
    return `${v.discountValue}`;
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
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Add Vouchers to Live</h2>
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
            placeholder="Search by voucher code or description..."
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

        {/* Voucher list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {loadingVouchers ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
              No active vouchers found. Create vouchers first.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filtered.map((voucher) => {
                const isSelected = selected.has(voucher._id);
                return (
                  <div
                    key={voucher._id}
                    onClick={() => toggleSelect(voucher._id)}
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
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#B13C36',
                            margin: 0,
                            fontFamily: 'monospace',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {voucher.code}
                        </p>
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: '#555',
                            margin: '2px 0 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {voucher.name || 'No name'}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#B13C36',
                          background: '#fff0f0',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {formatDiscount(voucher)}
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
            {selected.size > 0 ? `${selected.size} voucher${selected.size > 1 ? 's' : ''} selected` : 'Select vouchers'}
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
