import { useState, useEffect, useCallback } from 'react';
import { Spinner } from 'react-bootstrap';
import {
  Ticket,
  Copy,
  Check,
  Store,
  ShoppingBag,
  Globe,
  Zap,
  Clock,
  Tag,
  Crown,
  Truck,
} from 'lucide-react';
import { toast } from 'react-toastify';
import voucherService from '@services/api/voucherService';
import styles from '@assets/styles/buyer/ProfilePage/ProfilePage.module.css';

const TYPE_LABELS = {
  shop: { label: 'Shop', color: '#6366f1', bg: '#eef2ff', icon: Store },
  private: { label: 'Private', color: '#8b5cf6', bg: '#f5f3ff', icon: Tag },
  product: { label: 'Product', color: '#f59e0b', bg: '#fffbeb', icon: ShoppingBag },
  live: { label: 'Live', color: '#ef4444', bg: '#fef2f2', icon: Zap },
  new_buyer: { label: 'New Buyer', color: '#10b981', bg: '#ecfdf5', icon: Globe },
  repeat_buyer: { label: 'Repeat Buyer', color: '#10b981', bg: '#ecfdf5', icon: Globe },
  follower: { label: 'Follower', color: '#10b981', bg: '#ecfdf5', icon: Globe },
  system_shipping: { label: 'Free Ship', color: '#0ea5e9', bg: '#f0f9ff', icon: Truck },
  system_order: { label: 'System', color: '#0ea5e9', bg: '#f0f9ff', icon: Globe },
  system_vip_daily: { label: 'VIP Daily', color: '#b13c36', bg: '#fff8f7', icon: Crown },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'vip', label: 'VIP' },
  { key: 'system', label: 'System' },
  { key: 'shop', label: 'Shop' },
  { key: 'product', label: 'Product' },
  { key: 'special', label: 'Special' },
];

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtDiscount = (v) => {
  if (v.discountType === 'percent') return `${v.discountValue}% OFF`;
  if (v.discountType === 'coin') return `+${Number(v.discountValue).toLocaleString()} Coin`;
  return `−${Number(v.discountValue).toLocaleString()} ₫`;
};
const fmtMoney = (n) => Number(n).toLocaleString('en-US');

const daysLeft = (endTime) => {
  const d = Math.ceil((new Date(endTime) - Date.now()) / 86400000);
  return d;
};

const filterVouchers = (vouchers, filter) => {
  if (filter === 'all') return vouchers;
  if (filter === 'vip') return vouchers.filter((v) => v.type === 'system_vip_daily');
  if (filter === 'system') return vouchers.filter((v) => v.type?.startsWith('system_') && v.type !== 'system_vip_daily');
  if (filter === 'shop') return vouchers.filter((v) => v.type === 'shop' || v.type === 'private');
  if (filter === 'product') return vouchers.filter((v) => v.type === 'product');
  if (filter === 'special')
    return vouchers.filter((v) =>
      ['live', 'new_buyer', 'repeat_buyer', 'follower'].includes(v.type),
    );
  return vouchers;
};

const VoucherCard = ({ voucher }) => {
  const [copied, setCopied] = useState(false);
  const meta = TYPE_LABELS[voucher.type] || TYPE_LABELS['shop'];
  const Icon = meta.icon;
  const days = daysLeft(voucher.endTime);
  const urgentExpiry = days <= 3 && days >= 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(voucher.code).then(() => {
      setCopied(true);
      toast.success(`Copied: ${voucher.code}`);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isVipVoucher = voucher.type === 'system_vip_daily';

  return (
    <div
      style={{
        background: isVipVoucher
          ? 'linear-gradient(135deg, #fff8f7 0%, #fff5f5 100%)'
          : '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        border: isVipVoucher
          ? '1.5px solid #f5b8b6'
          : '1px solid var(--color-border)',
        boxShadow: isVipVoucher
          ? '0 4px 16px rgba(177,60,54,0.1)'
          : '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        position: 'relative',
      }}
    >
      {/* VIP crown badge */}
      {isVipVoucher && (
        <div style={{
          position: 'absolute', top: 10, right: 12,
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))',
          color: '#fff', borderRadius: 20, padding: '2px 9px',
          fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
        }}>
          <Crown size={10} />
          VIP
        </div>
      )}
      {/* Left accent strip */}
      <div
        style={{
          width: 6,
          flexShrink: 0,
          background: `linear-gradient(180deg, ${meta.color}, ${meta.color}99)`,
        }}
      />

      {/* Main body */}
      <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                background: meta.bg,
                borderRadius: 8,
                padding: '7px 8px',
                display: 'flex',
                flexShrink: 0,
              }}
            >
              <Icon size={18} color={meta.color} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                {voucher.name}
              </div>
              {voucher.shopId && (
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Store size={11} />
                  {voucher.shopId.shopName || voucher.shopId.fullName}
                </div>
              )}
            </div>
          </div>

          {/* Discount badge */}
          <div
            style={{
              background: `linear-gradient(135deg, var(--color-secondary), var(--color-primary))`,
              color: '#fff',
              borderRadius: 8,
              padding: '6px 12px',
              fontWeight: 900,
              fontSize: 15,
              flexShrink: 0,
              textAlign: 'center',
            }}
          >
            {fmtDiscount(voucher)}
          </div>
        </div>

        {/* Details row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {voucher.minBasketPrice > 0 && (
            <span>Min. order: <strong>{fmtMoney(voucher.minBasketPrice)} ₫</strong></span>
          )}
          {voucher.maxDiscountAmount && voucher.discountType === 'percent' && (
            <span>Max discount: <strong>{fmtMoney(voucher.maxDiscountAmount)} ₫</strong></span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: urgentExpiry ? '#ef4444' : 'inherit' }}>
            <Clock size={12} />
            Expires {fmtDate(voucher.endTime)}
            {urgentExpiry && days > 0 && (
              <span style={{
                background: '#fef2f2', color: '#ef4444', borderRadius: 10,
                padding: '1px 7px', fontWeight: 700, fontSize: 11
              }}>
                {days}d left
              </span>
            )}
            {days === 0 && (
              <span style={{ background: '#fef2f2', color: '#ef4444', borderRadius: 10, padding: '1px 7px', fontWeight: 700, fontSize: 11 }}>
                Today!
              </span>
            )}
          </span>
        </div>

        {/* Code + copy row */}
        <div
          style={{
            background: 'var(--color-gray-100)',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 1, textTransform: 'uppercase', letterSpacing: 1 }}>Voucher code</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: 'var(--color-primary)', letterSpacing: 2 }}>
              {voucher.code}
            </div>
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#ecfdf5' : 'var(--color-primary)',
              color: copied ? '#10b981' : '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Type badge */}
        <div>
          <span style={{
            background: meta.bg,
            color: meta.color,
            borderRadius: 20,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 700,
          }}>
            {meta.label}
          </span>
        </div>
      </div>
    </div>
  );
};

const ProfileVouchersTab = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await voucherService.getSavedVouchers();
      if (res?.data) {
        // Chỉ hiện voucher còn dùng được
        setVouchers(res.data.filter((v) => !v.isExpired && !v.isUsedUp));
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const displayed = filterVouchers(vouchers, filter);
  const validCount = vouchers.length;
  const vipCount = vouchers.filter((v) => v.type === 'system_vip_daily').length;

  return (
    <div>
      {/* Header stats */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap',
      }}>
        <div style={{
          flex: '1 1 140px', background: '#fff', borderRadius: 12,
          padding: '16px 20px', border: '1px solid var(--color-border)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Ticket size={18} color="var(--color-primary)" />
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Available</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)' }}>{validCount}</div>
        </div>
        <div style={{
          flex: '1 1 140px', background: 'linear-gradient(135deg, #fff8f7, #fff5f5)', borderRadius: 12,
          padding: '16px 20px', border: '1.5px solid #f5b8b6',
          boxShadow: '0 1px 4px rgba(177,60,54,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Crown size={18} color="var(--color-primary)" />
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>VIP Daily</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-secondary)' }}>{vipCount}</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => {
          const count = filterVouchers(vouchers, f.key).length;
          const active = filter === f.key;
          const isVip = f.key === 'vip';
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: active
                  ? isVip
                    ? 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))'
                    : 'var(--color-primary)'
                  : '#fff',
                color: active ? '#fff' : 'var(--color-text-secondary)',
                border: `1.5px solid ${active ? 'transparent' : isVip ? '#f5b8b6' : 'var(--color-border)'}`,
                borderRadius: 20,
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isVip && <Crown size={12} />}
              {f.label}
              <span style={{
                background: active ? 'rgba(255,255,255,0.25)' : 'var(--color-gray-200)',
                borderRadius: 10,
                padding: '0 7px',
                fontSize: 11,
                fontWeight: 700,
                color: active ? '#fff' : 'var(--color-text-secondary)',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Spinner animation="border" style={{ color: 'var(--color-primary)', width: 36, height: 36 }} />
          <p style={{ marginTop: 12, color: 'var(--color-text-secondary)' }}>Loading vouchers...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: '#fff', borderRadius: 14,
          border: '1px solid var(--color-border)',
        }}>
          <Ticket size={48} color="var(--color-gray-300)" strokeWidth={1.5} />
          <p style={{ marginTop: 16, fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: 15 }}>
            No vouchers found
          </p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 4 }}>
            Save vouchers from shops or system promotions to see them here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {displayed.map((v) => (
            <VoucherCard key={v._id} voucher={v} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileVouchersTab;
