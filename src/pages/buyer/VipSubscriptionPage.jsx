import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Spinner } from 'react-bootstrap';
import {
  Crown,
  Ticket,
  Zap,
  ShieldCheck,
  Star,
  CheckCircle2,
  CalendarClock,
  ArrowLeft,
  Repeat2,
  Sparkles,
  ChevronDown,
  BadgeCheck,
  Truck,
  Headphones,
} from 'lucide-react';
import { PUBLIC_ROUTES } from '@constants/routes';
import subscriptionService from '@services/api/subscriptionService';
import styles from '@assets/styles/buyer/VipSubscriptionPage.module.css';

const BENEFITS = [
  {
    icon: Ticket,
    title: 'Daily VIP Vouchers',
    desc: 'Exclusive discount vouchers delivered automatically every day while your membership is active.',
    color: '#d97706',
    bg: '#fffbeb',
  },
  {
    icon: Zap,
    title: 'Priority Order Processing',
    desc: 'VIP orders jump the queue — processed and dispatched faster than standard orders.',
    color: '#6366f1',
    bg: '#eef2ff',
  },
  {
    icon: ShieldCheck,
    title: 'Dedicated Support',
    desc: 'Private support channel for VIP members with guaranteed response within 2 hours.',
    color: '#10b981',
    bg: '#ecfdf5',
  },
  {
    icon: Star,
    title: 'Double Coin Rewards',
    desc: 'Every transaction earns 2× GZMart Coin points, accelerating your rewards balance.',
    color: '#ef4444',
    bg: '#fef2f2',
  },
];

const FAQS = [
  {
    q: 'When does my VIP membership start?',
    a: 'Your membership activates instantly after a successful PayOS payment. You can start using VIP vouchers immediately.',
  },
  {
    q: 'How do I receive daily vouchers?',
    a: 'VIP vouchers are issued automatically to your account each day. You can find and apply them at checkout.',
  },
  {
    q: 'Can I renew before my membership expires?',
    a: 'Yes. You can renew at any time. The new period starts from your current expiry date, so no days are lost.',
  },
  {
    q: 'Is the payment secure?',
    a: 'All payments are processed by PayOS, a certified and PCI-compliant payment gateway. Your card details are never stored on our servers.',
  },
];

const fmt = (n) => Number(n).toLocaleString('en-US');
const fmtDate = (d) =>
  new Date(d).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
const daysBetween = (d) => Math.max(0, Math.ceil((new Date(d) - Date.now()) / 86400000));

const VipSubscriptionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sub, setSub] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await subscriptionService.getMine();
      if (res?.success) {
setSub(res.data ?? null);
}
    } catch (e) {
      console.error(e);
      toast.error('Failed to load VIP information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubscribe = async () => {
    try {
      setSubmitting(true);
      const res = await subscriptionService.createCheckout('/buyer/vip');
      if (res?.success && res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }
      toast.error('Could not create payment link');
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Payment error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Spinner animation="border" className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Loading VIP information...</p>
      </div>
    );
  }

  const plan = sub?.planId;
  const validUntil = sub?.validUntil ? new Date(sub.validUntil) : null;
  const isVip = !!sub;
  const daysLeft = validUntil ? daysBetween(validUntil) : 0;

  return (
    <div className={styles.page}>

      {/* ══ HERO ══ */}
      <div className={styles.hero}>
        <div className={styles.heroCircle1} />
        <div className={styles.heroCircle2} />
        <div className={styles.heroCircle3} />

        <div className={styles.heroInner}>
          <button className={styles.backBtn} onClick={() => navigate(PUBLIC_ROUTES.HOME)}>
            <ArrowLeft size={15} />
            Home
          </button>

          <div className={styles.heroTitle}>
            <div className={styles.heroIconWrap}>
              <Crown size={38} strokeWidth={1.7} />
            </div>
            <div>
              <div className={styles.heroLabel}>Membership</div>
              <h1 className={styles.heroHeading}>GZMart VIP</h1>
            </div>
          </div>

          <p className={styles.heroTagline}>
            Unlock exclusive perks every day — vouchers, double coin rewards,
            priority shipping and much more.
          </p>

          <div className={styles.heroBadges}>
            <span className={styles.heroBadge}><Ticket size={13} /> Daily Vouchers</span>
            <span className={styles.heroBadge}><Star size={13} /> 2× Coin Rewards</span>
            <span className={styles.heroBadge}><Truck size={13} /> Priority Shipping</span>
            <span className={styles.heroBadge}><Headphones size={13} /> VIP Support</span>
          </div>
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <div className={styles.content}>

        {/* Active VIP banner */}
        {isVip && (
          <div className={styles.activeBanner}>
            <div className={styles.activeBannerIcon}>
              <CheckCircle2 size={28} color="#fff" strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <div className={styles.activeBannerTitle}>
                You are an active VIP member 🎉
              </div>
              <div className={styles.activeBannerMeta}>
                <CalendarClock size={14} />
                Valid until <strong>{validUntil ? fmtDate(validUntil) : '—'}</strong>
                {daysLeft > 0 && (
                  <span className={styles.daysLeftBadge}>{daysLeft} days left</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Member Benefits */}
        <section>
          <h2 className={styles.sectionTitle}>
            <Sparkles size={19} className={styles.sectionTitleIcon} />
            Member Benefits
          </h2>
          <div className={styles.benefitsGrid}>
            {BENEFITS.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className={styles.benefitCard}>
                <div className={styles.benefitIconWrap} style={{ background: bg }}>
                  <Icon size={21} color={color} strokeWidth={2} />
                </div>
                <div>
                  <div className={styles.benefitTitle}>{title}</div>
                  <div className={styles.benefitDesc}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Daily voucher slots */}
        {plan?.dailySlots?.length > 0 && (
          <section>
            <h2 className={styles.sectionTitle}>
              <Ticket size={19} className={styles.sectionTitleIcon} />
              Daily VIP Vouchers
            </h2>
            <div className={styles.voucherList}>
              {plan.dailySlots.map((slot, i) => (
                <div key={i} className={styles.voucherSlotCard}>
                  <div className={styles.voucherSlotLeft}>
                    <div className={styles.voucherSlotIconWrap}>
                      <Ticket size={19} color="var(--color-primary)" />
                    </div>
                    <span className={styles.voucherSlotName}>{slot.name}</span>
                  </div>
                  <div className={styles.voucherSlotRight}>
                    <div className={styles.voucherSlotValue}>
                      {slot.discountType === 'percent'
                        ? `−${slot.discountValue}%`
                        : slot.discountType === 'amount'
                          ? `−${fmt(slot.discountValue)} ₫`
                          : `+${fmt(slot.discountValue)} coin`}
                    </div>
                    {slot.maxDiscountAmount && slot.discountType !== 'amount' && (
                      <div className={styles.voucherSlotSub}>up to {fmt(slot.maxDiscountAmount)} ₫</div>
                    )}
                    {slot.minBasketPrice > 0 && (
                      <div className={styles.voucherSlotSub}>min. order {fmt(slot.minBasketPrice)} ₫</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pricing card */}
        <div className={styles.pricingCard}>
          <div className={styles.pricingDecor} />
          <div className={styles.pricingDecor2} />

          <div className={styles.pricingInner}>
            <div className={styles.pricingBadge}>
              <Crown size={12} />
              {isVip ? 'Renew Your Membership' : 'Get Started Today'}
            </div>

            <div className={styles.pricingRow}>
              <span className={styles.pricingAmount}>
                {plan?.priceVnd != null ? `${fmt(plan.priceVnd)} ₫` : '99,000 ₫'}
              </span>
              <span className={styles.pricingPer}>/ {plan?.durationDays ?? 30} days</span>
            </div>

            <p className={styles.pricingNote}>
              One-time payment — all VIP benefits activate instantly.
              Secure checkout via <strong>PayOS</strong>.
            </p>

            <ul className={styles.pricingFeatures}>
              {[
                'Automatic daily vouchers',
                'Double GZMart Coin rewards',
                'Priority order processing',
                'Faster shipping',
                'Dedicated VIP support',
                'Instant activation',
              ].map((f) => (
                <li key={f} className={styles.pricingFeatureItem}>
                  <BadgeCheck size={16} className={styles.pricingFeatureCheck} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              className={styles.ctaButton}
              onClick={handleSubscribe}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" style={{ width: 18, height: 18 }} />
                  Redirecting to payment...
                </>
              ) : isVip ? (
                <>
                  <Repeat2 size={20} />
                  Renew VIP Membership
                </>
              ) : (
                <>
                  <Crown size={20} />
                  Subscribe Now
                </>
              )}
            </button>

            {!isVip && (
              <p className={styles.ctaFootnote}>
                Powered by PayOS
                <span className={styles.ctaFootnoteDot}>·</span>
                SSL Secured
                <span className={styles.ctaFootnoteDot}>·</span>
                Instant Activation
              </p>
            )}
          </div>
        </div>

        {/* FAQ */}
        <section>
          <h2 className={styles.sectionTitle}>
            <Sparkles size={19} className={styles.sectionTitleIcon} />
            Frequently Asked Questions
          </h2>
          <div className={styles.faqList}>
            {FAQS.map(({ q, a }, i) => (
              <div key={i} className={styles.faqItem}>
                <button
                  className={styles.faqQuestion}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {q}
                  <ChevronDown
                    size={18}
                    className={`${styles.faqChevron} ${openFaq === i ? styles.faqChevronOpen : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className={styles.faqAnswer}>{a}</div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default VipSubscriptionPage;
