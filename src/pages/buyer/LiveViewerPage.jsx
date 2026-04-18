import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { parseOrderSyntax, normalizeVariantOptionKey } from '@utils/orderSyntax';
import { SOCKET_EVENTS } from '@constants';
import { toast } from 'react-toastify';
import { LiveKitRoom, VideoTrack, RoomAudioRenderer, useTracks } from '@livekit/components-react';
import { Room, RoomEvent, Track } from 'livekit-client';
import '@livekit/components-styles';
import livestreamService from '@services/api/livestreamService';
import voucherService from '@services/api/voucherService';
import socketService from '@services/socket/socketService';
import { useSelector } from 'react-redux';
import Header from '@components/common/Header';
import Footer from '@components/common/Footer';
import LiveQuickBuySheet from './LiveQuickBuySheet';
import styles from '@assets/styles/buyer/LiveViewerPage.module.css';

/** Only one of these overlays at a time (drawers + quick-buy sheet + live cart). */
const LIVE_OVERLAY = {
  PRODUCTS: 'products',
  VOUCHERS: 'vouchers',
  QUICK_BUY: 'quickBuy',
  LIVE_CART: 'liveCart',
};

// ── Chat message normalizer ─────────────────────────────────────────────────
const resolveUserAvatar = (u) => {
  if (!u) {
    return '';
  }
  const url = u.avatar || u.profileImage;
  return typeof url === 'string' && url.trim() ? url.trim() : '';
};

const normalizeMessage = (m) => ({
  id: m.id || m._id || String(Math.random()),
  displayName: m.displayName || m.userId || 'Viewer',
  content: m.content,
  userId: m.userId ?? m.senderId,
  role: m.role || 'buyer',
  timestamp: m.timestamp || new Date().toISOString(),
  avatar: typeof m.avatar === 'string' && m.avatar.trim() ? m.avatar.trim() : undefined,
});

/** Renders profile image when `src` loads; otherwise initials (per-row image error state). */
function LiveChatAvatar({ src, initials, className }) {
  const [imgErr, setImgErr] = useState(false);
  useEffect(() => {
    setImgErr(false);
  }, [src]);
  const showImg = Boolean(src) && !imgErr;
  return (
    <div className={className}>
      {showImg ? (
        <img
          src={src}
          alt=""
          className={styles['ls-msg-avatar-img']}
          onError={() => setImgErr(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}

LiveChatAvatar.propTypes = {
  src: PropTypes.string,
  initials: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
};

/** Quick reactions for live chat (sent as plain text over the socket). */
const LIVE_CHAT_EMOTES = [
  '❤️', '🔥', '👍', '😂', '🎉', '😍', '👏', '🙌',
  '😮', '🤣', '💯', '✨', '👀', '💪', '🙏', '🌟',
];

// ── Product price helpers ────────────────────────────────────────────────────
const computePrice = (product) => {
  const sale = product?.price != null && !Number.isNaN(Number(product.price)) ? Number(product.price) : null;
  const original = product?.originalPrice != null && !Number.isNaN(Number(product.originalPrice)) ? Number(product.originalPrice) : null;
  const current = sale != null && sale > 0 ? sale : (original ?? 0);
  const discount = original != null && original > 0 && current < original ? Math.round((1 - current / original) * 100) : null;
  return { sale, original, current, discount };
};

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n || 0);

// ── LiveKit video renderer ──────────────────────────────────────────────────
function LiveStreamView() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const videoRef = tracks.find((t) => t.source === Track.Source.ScreenShare) || tracks.find((t) => t.source === Track.Source.Camera);

  return (
    <div className={styles['ls-video-layer']}>
      {videoRef ? (
        <VideoTrack
          trackRef={videoRef}
          className={styles['ls-video-track']}
        />
      ) : (
        <div className={styles['ls-connecting-state']}>
          <div className={styles['ls-connecting-ring']} />
          <span className={styles['ls-connecting-label']}>Connecting to stream</span>
        </div>
      )}
      <RoomAudioRenderer />
    </div>
  );
}

// ── Waiting placeholder while waiting for seller ─────────────────────────────
function WaitingForSeller() {
  return (
    <div className={styles['ls-waiting-state']}>
      <div className={styles['ls-grid-bg']} />
      <div className={styles['ls-waiting-ring']} />
      <div className={styles['ls-waiting-text']}>Waiting for seller</div>
    </div>
  );
}

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
const Icon = ({ size = 16, strokeWidth = 2, children, className = '', animated = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${className}${animated ? ` ${styles['ls-spin']}` : ''}`}
  >
    {children}
  </svg>
);

const IconChevronLeft = ({ size = 16 }) => (
  <Icon size={size}><polyline points="15 18 9 12 15 6" /></Icon>
);

const IconShare = ({ size = 15 }) => (
  <Icon size={size} strokeWidth={2}>
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </Icon>
);

const IconHeart = ({ size = 16, filled = false, animated = false }) => (
  <Icon size={size} strokeWidth={2} fill={filled ? 'currentColor' : 'none'} className={animated ? styles['ls-heart-icon'] : ''}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Icon>
);

const IconShoppingBag = ({ size = 15 }) => (
  <Icon size={size} strokeWidth={2}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </Icon>
);

const IconCart = ({ size = 13 }) => (
  <Icon size={size} strokeWidth={2.5}>
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </Icon>
);

const IconArrowRight = ({ size = 13 }) => (
  <Icon size={size} strokeWidth={2.5}>
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </Icon>
);

const IconX = () => (
  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="1" y1="1" x2="9" y2="9" />
    <line x1="9" y1="1" x2="1" y2="9" />
  </svg>
);

const IconSend = ({ size = 12 }) => (
  <Icon size={size} strokeWidth={2.5}>
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </Icon>
);

const IconLoader = ({ size = 12 }) => (
  <Icon size={size} strokeWidth={3}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </Icon>
);

const IconEye = ({ size = 13 }) => (
  <Icon size={size} strokeWidth={2}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </Icon>
);

const IconSmile = ({ size = 15 }) => (
  <Icon size={size} strokeWidth={2}>
    <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
  </Icon>
);

const IconGift = ({ size = 15 }) => (
  <Icon size={size} strokeWidth={2}>
    <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </Icon>
);

const IconCheck = ({ size = 11 }) => (
  <Icon size={size} strokeWidth={3}>
    <polyline points="20 6 9 17 4 12" />
  </Icon>
);

const IconPlus = ({ size = 11 }) => (
  <Icon size={size} strokeWidth={3}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

const IconChevronUp = ({ size = 18 }) => (
  <Icon size={size} strokeWidth={2}>
    <polyline points="18 15 12 9 6 15" />
  </Icon>
);

const IconAlert = ({ size = 40 }) => (
  <Icon size={size} strokeWidth={1.5}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </Icon>
);

const IconPlay = ({ size = 48 }) => (
  <Icon size={size} strokeWidth={1.5}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </Icon>
);

const IconMessageSquare = ({ size = 13 }) => (
  <Icon size={size} strokeWidth={2.5}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Icon>
);

// Tier options from API / socket use `options`; legacy payloads may use `values`.
const syntaxTierOptions = (tier) => {
  const raw = tier?.options ?? tier?.values;
  return Array.isArray(raw) ? raw : [];
};

/** Options for display: session tier first, then same-named tier on product (if empty). */
const syntaxTierOptionsResolved = (tier, product) => {
  const direct = syntaxTierOptions(tier);
  if (direct.length > 0) {
    return direct;
  }
  if (!product?.tiers?.length) {
    return [];
  }
  const match = product.tiers.find((pt) => pt.name === tier.name);
  const fromProduct = match?.options ?? match?.values;
  return Array.isArray(fromProduct) ? fromProduct : [];
};

/** Match session syntax tier to product.tiers row (names may differ in casing / spacing). */
function findProductTierIndexForSyntaxTier(product, variantTier, variantTierIndex) {
  if (!product?.tiers?.length || !variantTier?.name) {
    return -1;
  }
  const want = String(variantTier.name).toLowerCase().trim();
  const byName = product.tiers.findIndex((t) => String(t.name || '').toLowerCase().trim() === want);
  if (byName >= 0) {
    return byName;
  }
  if (
    typeof variantTierIndex === 'number' &&
    variantTierIndex >= 0 &&
    variantTierIndex < product.tiers.length
  ) {
    return variantTierIndex;
  }
  return -1;
}

function optionIndexInTierOptions(productTier, optionDisplayValue) {
  const opts = productTier?.options;
  if (!Array.isArray(opts)) {
    return -1;
  }
  const want = normalizeVariantOptionKey(optionDisplayValue);
  return opts.findIndex((o) => normalizeVariantOptionKey(o) === want);
}

/**
 * true = out of stock (show strikethrough). false = in stock or unknown — never default to OOS.
 */
function buildSyntaxGuideOosMap(product, variantTiers) {
  const map = {};
  if (!Array.isArray(variantTiers) || variantTiers.length === 0) {
    return map;
  }

  variantTiers.forEach((vt, vtIdx) => {
    map[vt.name] = {};
    const resolvedOpts = syntaxTierOptionsResolved(vt, product);
    const ptIdx = findProductTierIndexForSyntaxTier(product, vt, vtIdx);

    if (ptIdx < 0 || !product?.models?.length) {
      resolvedOpts.forEach((opt) => {
        map[vt.name][opt] = false;
      });
      return;
    }

    const pt = product.tiers[ptIdx];
    resolvedOpts.forEach((opt) => {
      const oIdx = optionIndexInTierOptions(pt, opt);
      if (oIdx < 0) {
        map[vt.name][opt] = false;
        return;
      }
      let hasStock = false;
      for (const model of product.models) {
        if (!model.tierIndex || model.stock <= 0) {
          continue;
        }
        if (model.tierIndex[ptIdx] === oIdx) {
          hasStock = true;
          break;
        }
      }
      map[vt.name][opt] = !hasStock;
    });
  });

  return map;
}

/** English labels for common tier names (seller data may still be Vietnamese). */
function formatSyntaxTierLabel(rawName) {
  if (rawName == null || rawName === '') {
    return '';
  }
  const s = String(rawName).toLowerCase().trim();
  if (/màu|mau/.test(s) || s === 'color') {
    return 'Color';
  }
  if (/size|kích|kich/.test(s)) {
    return 'Size';
  }
  return String(rawName);
}

// ── Syntax Guide Card (pinned at top of chat) ───────────────────────────────
const SyntaxGuideCard = ({ guide }) => {
  const { prefix, product, variantTiers } = guide ?? { prefix: '', product: null, variantTiers: [] };

  const oosMap = useMemo(
    () => (guide ? buildSyntaxGuideOosMap(product, variantTiers) : {}),
    [guide, variantTiers, product],
  );

  const exampleParts = [
    prefix,
    ...variantTiers.map((t) => {
      const opts = syntaxTierOptionsResolved(t, product);
      const firstInStock = opts.find((o) => !oosMap[t.name]?.[o]);
      return firstInStock ?? opts[0] ?? t.name;
    }),
    '2',
  ];
  const example = `#${exampleParts.join(' ')}`;

  if (!guide) {
return null;
}

  return (
    <div className={styles['ls-syntax-guide']}>
      <div className={styles['ls-syntax-guide-header']}>
        <div className={styles['ls-syntax-guide-icon']}>
          <IconMessageSquare size={12} />
        </div>
        <span className={styles['ls-syntax-guide-label']}>Order syntax</span>
      </div>

      {product && (
        <div className={styles['ls-syntax-guide-product']}>
          {product.thumbnail && (
            <img
              src={product.thumbnail}
              alt={product.name}
              className={styles['ls-syntax-guide-thumb']}
              onError={(e) => {
 e.target.style.display = 'none'; 
}}
            />
          )}
          <span className={styles['ls-syntax-guide-product-name']}>{product.name}</span>
        </div>
      )}

      {variantTiers.length > 0 && (
        <div className={styles['ls-syntax-guide-variants']}>
          {variantTiers.map((tier) => (
            <div key={tier.name} className={styles['ls-syntax-guide-tier']}>
              <span className={styles['ls-syntax-guide-tier-name']}>{formatSyntaxTierLabel(tier.name)}:</span>
              <div className={styles['ls-syntax-guide-tier-options']}>
                {syntaxTierOptionsResolved(tier, product).map((opt) => {
                  const isOOS = Boolean(oosMap[tier.name]?.[opt]);
                  return (
                    <span
                      key={opt}
                      className={`${styles['ls-syntax-guide-option-chip']}${isOOS ? ` ${styles['ls-syntax-chip-oos']}` : ''}`}
                      title={isOOS ? 'Out of stock' : 'In stock'}
                    >
                      {opt}
                      {isOOS && (
                        <span className={styles['ls-syntax-chip-oos-badge']}>
                          <IconX />
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles['ls-syntax-guide-example']}>
        Example: <code>{example}</code>
      </div>

      <div className={styles['ls-syntax-guide-hint']}>
        Send the message above in chat to add items to your cart.
      </div>
    </div>
  );
};

// ── Live Cart Drawer ─────────────────────────────────────────────────────
const LiveCartDrawer = ({ items, onHide, onRemoveItem, onUpdateQty, onCheckout }) => {
  const total = computeLiveCartTotal(items);

  const drawerContent = items.length === 0 ? (
    <div className={styles['ls-live-cart-empty']}>
      <div className={styles['ls-live-cart-empty-icon']}>
        <IconCart size={32} />
      </div>
      <span>No items yet</span>
      <span className={styles['ls-live-cart-empty-hint']}>
        Use order syntax in chat to add items
      </span>
    </div>
  ) : (
    <>
      <div className={styles['ls-live-cart-items']}>
        {items.map((item) => (
          <div key={item.tempId} className={styles['ls-live-cart-item']}>
            <img
              src={item.image || '/placeholder.png'}
              alt={item.name}
              className={styles['ls-live-cart-item-img']}
              onError={(e) => {
 e.target.src = '/placeholder.png'; 
}}
            />
            <div className={styles['ls-live-cart-item-info']}>
              <span className={styles['ls-live-cart-item-name']}>{item.name}</span>
              {item.variantLabel && (
                <span className={styles['ls-live-cart-item-variant']}>{item.variantLabel}</span>
              )}
              <div className={styles['ls-live-cart-item-row']}>
                <span className={styles['ls-live-cart-item-price']}>
                  {formatVND(item.price)}
                </span>
                <div className={styles['ls-live-cart-qty-control']}>
                  <button
                    className={styles['ls-live-cart-qty-btn']}
                    onClick={() => onUpdateQty(item.tempId, Math.max(1, item.quantity - 1))}
                  >−</button>
                  <span className={styles['ls-live-cart-qty-val']}>{item.quantity}</span>
                  <button
                    className={styles['ls-live-cart-qty-btn']}
                    onClick={() => onUpdateQty(item.tempId, item.quantity + 1)}
                  >+</button>
                </div>
              </div>
            </div>
            <button
              className={styles['ls-live-cart-item-remove']}
              onClick={() => onRemoveItem(item.tempId)}
              aria-label="Remove"
            >
              <IconX />
            </button>
          </div>
        ))}
      </div>

      <div className={styles['ls-live-cart-footer']}>
        <div className={styles['ls-live-cart-total-row']}>
          <span className={styles['ls-live-cart-total-label']}>Total:</span>
          <span className={styles['ls-live-cart-total-value']}>{formatVND(total)}</span>
        </div>
        <button className={styles['ls-live-cart-checkout-btn']} onClick={onCheckout}>
          <IconCart size={13} />
          Checkout now
        </button>
        <button className={styles['ls-live-cart-continue-btn']} onClick={onHide}>
          Keep shopping
        </button>
      </div>
    </>
  );

  return (
    <motion.div
      className={`${styles['ls-live-cart-root']} ${styles['ls-live-cart-root--live']}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ls-live-cart-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        type="button"
        className={styles['ls-live-cart-backdrop']}
        aria-label="Close live cart"
        onClick={onHide}
      />
      <motion.div
        className={styles['ls-live-cart-drawer']}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles['ls-live-cart-header']}>
          <div className={styles['ls-live-cart-header-left']}>
            <span id="ls-live-cart-title" className={styles['ls-live-cart-title']}>
              Live cart
            </span>
            {items.length > 0 && (
              <span className={styles['ls-live-cart-count']}>{items.length}</span>
            )}
          </div>
          <button type="button" className={styles['ls-live-cart-close']} onClick={onHide} aria-label="Close">
            <IconX />
          </button>
        </div>

        <div className={styles['ls-live-cart-body']}>
          {drawerContent}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Stock helpers for SyntaxGuideCard OOS chips ──────────────────────────

// ── Live Cart Helpers ─────────────────────────────────────────────────────
const generateTempId = () =>
  `live_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const computeLiveCartTotal = (items) =>
  items.reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);

const buildVariantLabel = (color, size) => {
  const parts = [color, size].filter(
    (v) => v && v !== 'Default',
  );
  return parts.length > 0 ? parts.join(' / ') : null;
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LiveViewerPage() {
  const { shopId, sessionId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);

  const [token, setToken] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [pinnedProduct, setPinnedProduct] = useState(null);
  const [, /* setPinnedProductId not exposed — use pinnedProductIdRef */] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [savedVoucherIds, setSavedVoucherIds] = useState(new Set());
  const [showPinnedOverlay, setShowPinnedOverlay] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [hasRemoteTrack, setHasRemoteTrack] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [emotePickerOpen, setEmotePickerOpen] = useState(false);
  const emotePickerRef = useRef(null);
  const [systemMessages, setSystemMessages] = useState([]);
  const hasJoinedRef = useRef(false);
  /** Mutually exclusive: products drawer | vouchers drawer | quick-buy sheet | live cart */
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [selectedQuickBuyProduct, setSelectedQuickBuyProduct] = useState(null);
  const [liveCartItems, setLiveCartItems] = useState([]);

  const [floatingHearts, setFloatingHearts] = useState([]);
  const heartIdRef = useRef(0);
  const heartLayerRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenVideoRef = useRef(null);

  const [orderSyntax, setOrderSyntax] = useState({ enabled: false, prefix: '', productId: null, variantTiers: null });
  const [syntaxGuide, setSyntaxGuide] = useState(null);  // Syntax guide card data

  const chatRef = useRef(null);
  const prevMsgLen = useRef(0);
  const displayNameRef = useRef(user?.fullName || 'Viewer');
  const fetchedRef = useRef(false);
  const buyerRoomRef = useRef(
    new Room({ adaptiveStream: true, dynacast: true }),
  );

  const syntaxMatchedRef = useRef(null);
  const orderSyntaxRef = useRef(orderSyntax);
  useEffect(() => {
 orderSyntaxRef.current = orderSyntax; 
}, [orderSyntax]);

  const productsRef = useRef(products);
  useEffect(() => {
 productsRef.current = products; 
}, [products]);

  const pinnedProductIdRef = useRef(pinnedProduct?._id ?? null);
  const pinnedProductRef = useRef(pinnedProduct);
  useEffect(() => {
 pinnedProductRef.current = pinnedProduct; 
  pinnedProductIdRef.current = pinnedProduct?._id ?? null;
}, [pinnedProduct]);

  const liveCartItemsRef = useRef([]);
  useEffect(() => {
 liveCartItemsRef.current = liveCartItems; 
}, [liveCartItems]);

  const productsRailRef = useRef(null);
  const productsRailWrapRef = useRef(null);
  const [productsRailEdges, setProductsRailEdges] = useState({ moreLeft: false, moreRight: false });

  const updateProductsRailEdges = useCallback(() => {
    const el = productsRailRef.current;
    if (!el) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setProductsRailEdges({
      moreLeft: scrollLeft > 2,
      moreRight: scrollLeft + clientWidth < scrollWidth - 2,
    });
  }, []);

  useLayoutEffect(() => {
    if (activeOverlay !== LIVE_OVERLAY.PRODUCTS || products.length === 0) {
      return;
    }
    updateProductsRailEdges();
    const el = productsRailRef.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(() => updateProductsRailEdges());
    ro.observe(el);
    window.addEventListener('resize', updateProductsRailEdges);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateProductsRailEdges);
    };
  }, [activeOverlay, products.length, updateProductsRailEdges]);

  useEffect(() => {
    if (activeOverlay !== LIVE_OVERLAY.PRODUCTS || products.length === 0) {
      return;
    }
    const wrap = productsRailWrapRef.current;
    const el = productsRailRef.current;
    if (!wrap || !el) {
      return;
    }
    const onWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth + 1) {
        return;
      }
      e.preventDefault();
      el.scrollLeft += e.deltaY + e.deltaX;
      requestAnimationFrame(updateProductsRailEdges);
    };
    wrap.addEventListener('wheel', onWheel, { passive: false });
    return () => wrap.removeEventListener('wheel', onWheel);
  }, [activeOverlay, products.length, updateProductsRailEdges]);

  // ── Floating Hearts ─────────────────────────────────────────────────
  const HEART_COLORS = ['#FF6B6B', '#FF8E8E', '#FFB4B4', '#B13C36', '#FF5252', '#FF7043'];
  const MAX_HEARTS = 20;

  const spawnHeart = useCallback(() => {
    if (heartLayerRef.current && floatingHearts.length < MAX_HEARTS) {
      const container = heartLayerRef.current;
      const rect = container.getBoundingClientRect();
      const x = Math.random() * (rect.width * 0.7) + rect.width * 0.1;
      const y = rect.height * 0.6;
      const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
      const scale = 0.7 + Math.random() * 0.6;
      const dur = 1.8 + Math.random() * 1.4;
      const id = ++heartIdRef.current;
      const offsetX = (Math.random() - 0.5) * 60;
      setFloatingHearts((prev) => [...prev, { id, x, y, color, scale, dur, offsetX }]);
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
      }, dur * 1000 + 200);
    }
  }, [floatingHearts.length]);

  // ── Fullscreen toggle ───────────────────────────────────────────────
  const handleToggleFullscreen = useCallback(() => {
    const el = fullscreenVideoRef.current;
    if (!el) {
return;
}
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // ── Sync fullscreen state when browser fires fullscreenchange ────────
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          handleToggleFullscreen();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleToggleFullscreen]);

  useEffect(() => {
    if (!emotePickerOpen) {
return;
}
    const onPointerDown = (e) => {
      if (emotePickerRef.current?.contains(e.target)) {
return;
}
      setEmotePickerOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
setEmotePickerOpen(false);
}
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [emotePickerOpen]);

  const closeLiveOverlay = useCallback(() => setActiveOverlay(null), []);

  const toggleLiveOverlay = useCallback((key) => {
    setActiveOverlay((prev) => (prev === key ? null : key));
    setEmotePickerOpen(false);
  }, []);

  const openQuickBuySheet = useCallback((product) => {
    setSelectedQuickBuyProduct(product);
    setActiveOverlay(LIVE_OVERLAY.QUICK_BUY);
    setEmotePickerOpen(false);
  }, []);

  useEffect(() => {
    if (activeOverlay) {
      setEmotePickerOpen(false);
    }
  }, [activeOverlay]);

  // Keep displayNameRef in sync
  useEffect(() => {
    displayNameRef.current = user?.fullName || 'Viewer';
  }, [user]);

  // Auto-show pinned overlay when seller changes pinned product
  useEffect(() => {
    if (pinnedProduct) {
setShowPinnedOverlay(true);
}
  }, [pinnedProduct]);

  // ── Socket.IO: viewer count + chat relay ─
  useEffect(() => {
    if (!sessionId) {
return;
}

    socketService.connect(user?._id);

    const handleViewerUpdate = ({ count }) => {
 setViewerCount(count); 
};

    const handleSocketChat = (msg) => {
      if (!msg?.content || msg.sessionId !== sessionId) {
return;
}
      if (String(msg.senderId) === String(user?._id)) {
return;
}

      setMessages((prev) => {
        if (msg.id && prev.some((p) => p.id === msg.id)) {
return prev;
}
        return [
          prev.slice(-49),
          { ...normalizeMessage(msg), isOwn: false },
        ].flat();
      });

      const os = orderSyntaxRef.current;
      if (os.enabled && os.prefix) {
        const result = parseOrderSyntax(msg.content, os.prefix, os.productId, os.variantTiers);
        if (result.matched) {
          syntaxMatchedRef.current(result, msg.displayName || 'Buyer');
        }
      }
    };

    const handlePinUpdate = ({ pinnedProduct: pp, products: prodList }) => {
      if (prodList) {
setProducts(prodList);
}
      setPinnedProduct(pp || null);
    };

    const handleProductsUpdate = ({ products: prodList }) => {
      if (prodList) {
setProducts(prodList);
}
    };

    const handleVouchersUpdate = ({ vouchers: voucherList }) => {
      if (voucherList) {
setVouchers(voucherList);
}
    };

    // Remote join notifications — broadcast from backend when anyone joins the session
    const handleRemoteJoin = ({ displayName }) => {
      const toastId = `join_${Date.now()}_${Math.random()}`;
      // Show in chat sidebar at the top; auto-remove after 3.2 s
      setSystemMessages((prev) => [
        ...prev.slice(-4),
        { id: toastId, type: 'join', text: `${displayName || 'Viewer'} joined the live` },
      ]);
      setTimeout(() => {
        setSystemMessages((prev) => prev.filter((m) => m.id !== toastId));
      }, 3200);
    };

    const handleConfigUpdate = (config) => {
      if (!config?.sessionId || String(config.sessionId) !== String(sessionId)) {
return;
}
      const os = config.orderSyntax;
      setOrderSyntax({
        enabled: os?.enabled ?? false,
        prefix: typeof os?.prefix === 'string' ? os.prefix : '',
        productId: os?.productId != null && os.productId !== '' ? String(os.productId) : null,
        variantTiers: Array.isArray(os?.variantTiers) ? os.variantTiers : null,
      });
    };

    const handleSyntaxGuide = (guide) => {
      setSyntaxGuide(guide);
    };

    const handleSyntaxGuideClear = () => {
      setSyntaxGuide(null);
    };

    const handleRemoteLike = () => {
      setLikeCount((c) => c + 1);
      spawnHeart();
    };

    socketService.on('livestream_viewer_update', handleViewerUpdate);
    socketService.on('livestream_chat_message', handleSocketChat);
    socketService.on('livestream_pin_update', handlePinUpdate);
    socketService.on('livestream_products_update', handleProductsUpdate);
    socketService.on('livestream_vouchers_update', handleVouchersUpdate);
    socketService.on('livestream_join', handleRemoteJoin);
    socketService.on(SOCKET_EVENTS.LIVESTREAM_CONFIG_UPDATE, handleConfigUpdate);
    socketService.on('livestream_syntax_guide', handleSyntaxGuide);
    socketService.on('livestream_syntax_guide_clear', handleSyntaxGuideClear);
    socketService.on('livestream_like', handleRemoteLike);

    return () => {
      socketService.off('livestream_viewer_update', handleViewerUpdate);
      socketService.off('livestream_chat_message', handleSocketChat);
      socketService.off('livestream_pin_update', handlePinUpdate);
      socketService.off('livestream_products_update', handleProductsUpdate);
      socketService.off('livestream_vouchers_update', handleVouchersUpdate);
      socketService.off('livestream_join', handleRemoteJoin);
      socketService.off(SOCKET_EVENTS.LIVESTREAM_CONFIG_UPDATE, handleConfigUpdate);
      socketService.off('livestream_syntax_guide', handleSyntaxGuide);
      socketService.off('livestream_syntax_guide_clear', handleSyntaxGuideClear);
      socketService.off('livestream_like', handleRemoteLike);
    };
  }, [sessionId, user]);

  // ── Initial data fetch ──
  useEffect(() => {
    if (!sessionId || fetchedRef.current) {
return;
}
    fetchedRef.current = true;

    Promise.all([
      livestreamService.getViewerToken(sessionId),
      livestreamService.getSession(sessionId),
      livestreamService.getSessionProducts(sessionId),
      livestreamService.getSessionVouchers(sessionId),
    ])
      .then(([tokenRes, sessionRes, productsRes, vouchersRes]) => {
        const raw = tokenRes?.data ?? tokenRes;
        const tokenStr = typeof raw === 'string' ? raw : (raw?.token || '');
        setToken(tokenStr || null);

        if (sessionRes?.data) {
          setSession(sessionRes.data);
          if (sessionRes.data.viewerCount != null) {
            setViewerCount(sessionRes.data.viewerCount);
          }
        }

        if (productsRes?.data) {
          setProducts(productsRes.data.products || []);
          setLikeCount(productsRes.data.likeCount || 0);
          setPinnedProduct(productsRes.data.pinnedProduct || null);
        }

        if (vouchersRes?.data) {
          setVouchers(vouchersRes.data.vouchers || []);
        }

        // Load buyer's saved voucher IDs so saved state survives page refresh
        voucherService
          .getSavedVoucherIds()
          .then((res) => {
            // axios interceptor returns response.data — body is { success, data: { ids } }
            const ids = (res?.data?.ids || []).map((id) => String(id));
            setSavedVoucherIds(new Set(ids));
          })
          .catch(() => {});

        livestreamService.getSessionConfig(sessionId).then((res) => {
          const cfg = res?.data?.orderSyntax;
          setOrderSyntax({
            enabled: cfg?.enabled ?? false,
            prefix: typeof cfg?.prefix === 'string' ? cfg.prefix : '',
            productId: cfg?.productId != null && cfg.productId !== '' ? String(cfg.productId) : null,
            variantTiers: Array.isArray(cfg?.variantTiers) ? cfg.variantTiers : null,
          });

          // Build guide client-side if syntax is enabled
          if (cfg?.enabled && cfg?.prefix) {
            let resolvedProduct = null;
            if (cfg.productId) {
              resolvedProduct = (productsRes?.data?.products || []).find(
                (p) => String(p._id) === String(cfg.productId),
              );
            }
            if (!resolvedProduct) {
              resolvedProduct = productsRes?.data?.pinnedProduct || null;
            }
            if (!resolvedProduct && (productsRes?.data?.products || []).length > 0) {
              resolvedProduct = productsRes.data.products[0];
            }

            if (resolvedProduct) {
              setSyntaxGuide({
                sessionId,
                prefix: cfg.prefix,
                variantTiers: cfg.variantTiers ?? [],
                product: {
                  _id: String(resolvedProduct._id),
                  name: resolvedProduct.name,
                  thumbnail: resolvedProduct.thumbnail ?? resolvedProduct.images?.[0] ?? null,
                  tiers: (resolvedProduct.tiers ?? []).map((t) => ({
                    name: t.name,
                    options: t.options ?? [],
                  })),
                },
              });
            }
          }
        }).catch(() => {});

        livestreamService
          .getSessionMessages(sessionId, 100)
          .then((messagesRes) => {
            const msgList = Array.isArray(messagesRes?.data)
              ? messagesRes.data
              : messagesRes?.data?.data;
            if (!msgList?.length) {
              return;
            }

            const fromServer = msgList.map((m) => ({
              ...normalizeMessage(m),
              isOwn:
                String(m.userId ?? m.senderId) === String(user?._id),
            }));
            setMessages((prev) => {
              const byId = new Map();
              for (const m of fromServer) {
                byId.set(m.id, m);
              }
              for (const m of prev) {
                if (!byId.has(m.id)) {
                  byId.set(m.id, m);
                }
              }
              const merged = Array.from(byId.values()).sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
              );
              return merged.slice(-100);
            });
          })
          .catch(() => { /* chat history is optional */ });

        setLoading(false);

        // Emit join event — backend will broadcast to all viewers; toast shows & fades for everyone.
        // Always emit so anonymous viewers also join the socket room and receive pin/syntax updates.
        if (!hasJoinedRef.current) {
          hasJoinedRef.current = true;
          socketService.emit('livestream_join', {
            sessionId,
            userId: user?._id || 'anonymous',
            displayName: displayNameRef.current,
            role: 'buyer',
          });
        }
      })
      .catch((e) => {
        setError(e.response?.data?.message || e.message || 'Cannot load stream');
        setLoading(false);
      });
  }, [sessionId, user]);

  // ── LiveKit Connected event ─
  useEffect(() => {
    const r = buyerRoomRef.current;

    const onConnected = () => {};

    const checkForRemoteTracks = () => {
      for (const [, participant] of r.remoteParticipants) {
        for (const [, pub] of participant.trackPublications) {
          if (pub.track && (pub.track.kind === 'video' || pub.track.kind === 'audio')) {
            setHasRemoteTrack(true);
            return;
          }
        }
      }
      setHasRemoteTrack(false);
    };

    const onTrackSubscribed = (track) => {
      if (track.kind === 'video' || track.kind === 'audio') {
setHasRemoteTrack(true);
}
    };

    const onTrackUnsubscribed = () => {
 checkForRemoteTracks(); 
};
    const onParticipantDisconnected = () => {
 checkForRemoteTracks(); 
};
    const onParticipantConnected = () => {};

    if (r.state === 'connected') {
      onConnected();
    } else {
      r.on(RoomEvent.Connected, onConnected);
    }

    checkForRemoteTracks();
    r.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    r.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    r.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
    r.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);

    return () => {
      r.off(RoomEvent.Connected, onConnected);
      r.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      r.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      r.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
      r.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    };
  }, [sessionId]);

  // ── Auto-scroll with smooth behavior ─
  useEffect(() => {
    if (messages.length > prevMsgLen.current && chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }
    prevMsgLen.current = messages.length;
  }, [messages]);

  // ── Session persistence: restore buyer chat after F5 (merge with server/socket state) ─
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`gzmart_buyer_chat_${sessionId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const deduped = parsed.filter(
            (m, i, arr) => arr.findIndex((p) => p.id === m.id) === i,
          );
          setMessages((prev) => {
            const byId = new Map();
            for (const m of deduped) {
              const n = normalizeMessage(m);
              byId.set(n.id, { ...n, isOwn: m.isOwn });
            }
            for (const m of prev) {
              if (!byId.has(m.id)) {
                byId.set(m.id, m);
              }
            }
            return Array.from(byId.values())
              .sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
              )
              .slice(-100);
          });
        }
      }
    } catch {
      /* non-critical */
    }
  }, [sessionId]);

  // ── Persist chat messages ───────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0 && sessionId) {
      try {
        sessionStorage.setItem(`gzmart_buyer_chat_${sessionId}`, JSON.stringify(messages.slice(-100)));
      } catch {
        /* non-critical */
      }
    }
  }, [messages, sessionId]);

  // ── Emit leave event on unmount ─────────────────────────────────
  useEffect(() => () => {
      if (sessionId) {
        socketService.emit('livestream_leave', {
          sessionId,
          userId: user?._id || 'anonymous',
          displayName: displayNameRef.current,
          role: 'buyer',
        });
      }
    }, [sessionId]);

  // ── Order syntax: resolve a model by tierIndex ─────────────────────────────
  const resolveVariantFromTiers = useCallback((product, variants) => {
    if (!product?.tiers?.length || !product?.models?.length || !variants?.length) {
      return null;
    }
    const tiers = product.tiers;
    // Build tierIndex array aligned with the product's tier order.
    // variantTiers names are lowercased in the BE; product.tier names are as stored.
    const tierIndex = new Array(tiers.length).fill(-1);

    for (const { tierName, value } of variants) {
      const tierIdx = tiers.findIndex(
        (t) => t.name.toLowerCase() === tierName.toLowerCase(),
      );
      if (tierIdx === -1) {
return null;
}
      const want = normalizeVariantOptionKey(value);
      const optionIdx = tiers[tierIdx].options?.findIndex(
        (o) => normalizeVariantOptionKey(o) === want,
      );
      if (optionIdx === -1) {
return null;
}
      tierIndex[tierIdx] = optionIdx;
    }

    if (tierIndex.some((v) => v === -1)) {
return null;
}

    return product.models.find(
      (m) =>
        m.tierIndex &&
        m.tierIndex.length === tierIndex.length &&
        m.tierIndex.every((v, i) => v === tierIndex[i]),
    );
  }, []);

  // ── Order syntax: handle matched syntax ───────────────────────────────────
  const handleSyntaxMatched = useCallback(async (result, _displayName) => {
    let targetProduct = null;
    if (result.productId) {
      targetProduct = productsRef.current.find((p) => String(p._id) === String(result.productId));
    }
    if (!targetProduct) {
      targetProduct = productsRef.current.find(
        (p) => String(p._id) === String(pinnedProductIdRef.current),
      );
    }
    if (!targetProduct && pinnedProductRef.current) {
      targetProduct = productsRef.current.find(
        (p) => String(p._id) === String(pinnedProductRef.current._id),
      );
    }
    if (!targetProduct) {
      toast.error('No product is selected to order.');
      return;
    }

    const qty = result.quantity || 1;
    const image = targetProduct.thumbnail || targetProduct.images?.[0];

    let resolvedVariant = null;
    let color = 'Default';
    let size = 'Default';
    let price = computePrice(targetProduct).current;

    if (result.variants?.length > 0) {
      resolvedVariant = resolveVariantFromTiers(targetProduct, result.variants);
      if (!resolvedVariant) {
        const attempted = result.variants.map((v) => `${v.tierName}=${v.value}`).join(', ');
        toast.error(`No matching variant (${attempted}) for this product.`);
        return;
      }
      price = Number(resolvedVariant.price) || price;

      // Derive color / size labels from tierIndex
      const { tiers } = targetProduct;
      const variantTierIdx = resolvedVariant.tierIndex ?? [];
      color = 'Default';
      size = 'Default';
      tiers.forEach((tier, tierPos) => {
        const optIdx = variantTierIdx[tierPos];
        if (optIdx == null || optIdx < 0) {
return;
}
        const label = tiers[tierPos].options?.[optIdx] ?? 'Default';
        const n = tier.name.toLowerCase();
        if (n.includes('color') || n.includes('màu') || n.includes('mau')) {
          color = label;
        } else if (n.includes('size') || n.includes('kích') || n.includes('kich')) {
          size = label;
        }
      });
    } else {
      // No variant specified → use default first active model
      const fallback = targetProduct.models?.find((m) => m.isActive !== false && m.stock > 0)
        || targetProduct.models?.[0];
      if (!fallback) {
        toast.error('This product has no valid variant.');
        return;
      }
      price = Number(fallback.price) || price;
    }

    try {
      const variantLabel = buildVariantLabel(color, size);

      const liveItem = {
        tempId: generateTempId(),
        productId: targetProduct._id,
        name: targetProduct.name,
        image,
        price,
        quantity: qty,
        color,
        size,
        variantLabel,
      };

      setLiveCartItems((prev) => [...prev, liveItem]);
      setActiveOverlay(LIVE_OVERLAY.LIVE_CART);

      toast.success(
        <div>
          <div style={{ fontWeight: 600 }}>Added to live cart!</div>
          <div style={{ fontSize: '0.78rem', color: '#ddd', marginTop: 2 }}>
            {qty}x {targetProduct.name}
            {variantLabel ? ` (${variantLabel})` : ''}
          </div>
        </div>,
        { autoClose: 3000 },
      );
    } catch (err) {
      toast.error(err?.message || 'Could not create the order. Please try again.');
    }
  }, [resolveVariantFromTiers]);

  // Keep syntaxMatchedRef in sync with the latest handleSyntaxMatched
  useEffect(() => {
    syntaxMatchedRef.current = handleSyntaxMatched;
  }, [handleSyntaxMatched]);

  // ── Send chat via Socket.IO ─
  const sendChatContent = useCallback(
    (rawText, { runOrderSyntax = true } = {}) => {
      const text = typeof rawText === 'string' ? rawText.trim() : '';
      if (!text || !user) {
return false;
}

      setIsSending(true);
      const localMsg = {
        ...normalizeMessage({
          id: `local_${Date.now()}`,
          content: text,
          userId: user?._id,
          avatar: resolveUserAvatar(user),
        }),
        displayName: displayNameRef.current,
        isOwn: true,
      };
      setMessages((prev) => [...prev.slice(-49), localMsg]);

      if (runOrderSyntax) {
        const os = orderSyntaxRef.current;
        if (os.enabled && os.prefix) {
          const result = parseOrderSyntax(text, os.prefix, os.productId, os.variantTiers);
          if (result.matched) {
            syntaxMatchedRef.current(result, displayNameRef.current);
          }
        }
      }

      socketService.emit('livestream_chat', {
        sessionId,
        content: text,
        displayName: displayNameRef.current,
        userId: user?._id || 'anonymous',
        role: 'buyer',
        avatar: resolveUserAvatar(user) || undefined,
      });

      setTimeout(() => setIsSending(false), 600);
      return true;
    },
    [user, sessionId],
  );

  const sendChat = () => {
    const text = input.trim();
    if (!sendChatContent(text, { runOrderSyntax: true })) {
return;
}
    setInput('');
  };

  const sendEmote = (emoji) => {
    if (!user) {
return;
}
    sendChatContent(emoji, { runOrderSyntax: false });
    setEmotePickerOpen(false);
  };

  // ── Live cart handlers ──────────────────────────────────────────────────
  const handleRemoveLiveCartItem = useCallback((tempId) => {
    setLiveCartItems((prev) => prev.filter((item) => item.tempId !== tempId));
  }, []);

  const handleUpdateLiveCartQty = useCallback((tempId, newQty) => {
    setLiveCartItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, quantity: Math.max(1, newQty) } : item,
      ),
    );
  }, []);

  const handleLiveCartCheckout = useCallback(() => {
    if (liveCartItemsRef.current.length === 0) {
return;
}
    navigate('/buyer/checkout', {
      state: {
        selectedItems: liveCartItemsRef.current.map(({ tempId, ...rest }) => ({
          id: tempId,
          ...rest,
        })),
        fromLiveSession: sessionId,
      },
    });
  }, [sessionId, navigate]);

  // ── Like via REST API ──────────────────────────────────────────────
  const handleLike = () => {
    if (!sessionId) {
return;
}

    spawnHeart();
    setLikeCount((c) => c + 1);
    setLiked(true);

    livestreamService.likeSession(sessionId)
      .then((res) => {
        if (res?.data?.likeCount !== undefined) {
setLikeCount(res.data.likeCount);
}
      })
      .catch(() => {
        setLikeCount((c) => Math.max(0, c - 1));
      });

    setTimeout(() => setLiked(false), 600);
  };

  const handleFollow = () => {
 setIsFollowing((prev) => !prev); 
};

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Watch Live on GZMart Live', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleSaveVoucher = async (voucherId) => {
    try {
      await voucherService.saveVoucher(voucherId);
      setSavedVoucherIds((prev) => new Set([...prev, String(voucherId)]));
    } catch (e) {
      if (e.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleCopyVoucherCode = (code) => {
    navigator.clipboard.writeText(code);
  };

  const handleBack = () => {
 navigate(shopId ? `/shop/${shopId}` : '/'); 
};

  const handleQuickBuy = (product) => {
    openQuickBuySheet(product);
  };

  const formatCount = (count) => {
    if (count >= 1000) {
return `${(count / 1000).toFixed(1)}k`;
}
    return String(count);
  };

  const showLiveKit = token && typeof token === 'string' && token.length > 0;

  const displayProduct = pinnedProduct || products[0];
  const { original: origNum, current: mainPrice, discount } = useMemo(() => computePrice(displayProduct), [displayProduct]);
  // eslint-disable-next-line no-unused-vars
  const showStrike = origNum != null && origNum > 0 && mainPrice < origNum;
  const isPinned = Boolean(pinnedProduct);

  // ── Loading State ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`${styles['ls-root']} ${styles['ls-root--loading']}`}>
        <Header />
        <div className={styles['ls-loading-center']}>
          <div className={styles['ls-loading-ring']} />
          <span className={styles['ls-loading-label']}>Connecting to stream</span>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={`${styles['ls-root']} ${styles['ls-root--loading']}`}>
        <Header />
        <div className={styles['ls-error-center']}>
          <div className={styles['ls-error-icon']}>
            <IconAlert size={40} />
          </div>
          <p className={styles['ls-error-message']}>{error}</p>
          <button className={styles['ls-error-btn']} onClick={handleBack}>
            Back to Shop
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`${styles['ls-root']}${isFullscreen ? ` ${styles['ls-root--fullscreen']}` : ''}`}>
      {!isFullscreen && <Header />}

      {/* ── Main Stage ────────────────────────────────────────────────── */}
      <div className={styles['ls-stage']}>

        {/* ══ VIDEO COLUMN ══ */}
        <div className={`${styles['ls-video-col']}${isFullscreen ? ` ${styles['ls-video-col--fullscreen']}` : ''}`}>

          {/* Ambient grid */}
          <div className={styles['ls-grid-bg']} />

          {/* Video Layer */}
          <div
            ref={fullscreenVideoRef}
            className={styles['ls-video-wrap']}
            onDoubleClick={handleToggleFullscreen}
            style={{ cursor: 'pointer' }}
          >
            {showLiveKit ? (
              <LiveKitRoom
                serverUrl={import.meta.env.VITE_LIVEKIT_URL}
                token={token}
                connect={true}
                room={buyerRoomRef.current}
                audio={false}
                video={false}
              >
                {hasRemoteTrack ? <LiveStreamView /> : <WaitingForSeller />}
              </LiveKitRoom>
            ) : (
              <div className={styles['ls-preview-state']}>
                <div className={styles['ls-preview-icon']}>
                  <IconPlay size={48} />
                </div>
                <span className={styles['ls-preview-label']}>Stream preview</span>
              </div>
            )}
          </div>

          {/* Floating exit fullscreen button */}
          <AnimatePresence>
            {isFullscreen && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className={styles['ls-fs-exit-btn']}
                onClick={handleToggleFullscreen}
                aria-label="Exit fullscreen"
                title="Exit fullscreen (F or Escape)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Hearts animation layer */}
          <div ref={heartLayerRef} className={styles['ls-hearts-layer']}>
            <AnimatePresence>
              {floatingHearts.map((h) => (
                <motion.div
                  key={h.id}
                  className={styles['ls-heart-particle']}
                  initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -180, x: h.offsetX, scale: h.scale }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: h.dur, ease: 'easeOut' }}
                  style={{ left: h.x, bottom: h.y, color: h.color }}
                >
                  <IconHeart size={20} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ══ TOP OVERLAY ══ */}
          <div className={styles['ls-top-overlay']}>
            {/* Left cluster */}
            <div className={styles['ls-top-left']}>
              <button
                className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--back']}`}
                onClick={handleBack}
                aria-label="Back"
              >
                <IconChevronLeft size={16} />
              </button>

              <div className={styles['ls-live-badge']}>
                <div className={styles['ls-live-dot']}>
                  <div className={styles['ls-live-dot-ring']} />
                </div>
                <span className={styles['ls-live-text']}>LIVE</span>
              </div>

              <div className={`${styles['ls-glass-chip']} ${styles['ls-viewer-chip']}`}>
                <IconEye size={13} />
                <span>{formatCount(viewerCount)}</span>
              </div>

              <div className={`${styles['ls-glass-chip']} ${styles['ls-shop-chip']}`}>
                <div className={styles['ls-shop-avatar']}>
                  <img
                    src={session?.shopId?.avatar || '/placeholder.png'}
                    alt={session?.shopId?.fullName || 'Shop'}
                    onError={(e) => {
 e.target.src = '/placeholder.png'; 
}}
                  />
                </div>
                <span className={styles['ls-shop-name']}>
                  {session?.shopId?.fullName || 'Shop'}
                </span>
              </div>
            </div>

            {/* Right cluster */}
            <div className={styles['ls-top-right']}>
              <button
                className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--icon']}${isFullscreen ? ` ${styles['ls-glass-btn--active']}` : ''}`}
                onClick={handleToggleFullscreen}
                aria-label="Toggle fullscreen"
                title="Fullscreen (F)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>

              <button
                className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--icon']}${liked ? ` ${styles['ls-glass-btn--liked']}` : ''}`}
                onClick={handleLike}
                aria-label="Like"
              >
                <IconHeart size={16} filled={liked} animated={liked} />
                <span className={styles['ls-btn-count']}>{formatCount(likeCount)}</span>
              </button>

              <button
                className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--icon']}`}
                onClick={handleShare}
                aria-label="Share"
              >
                <IconShare size={15} />
              </button>

              <button
                className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--icon']}${activeOverlay === LIVE_OVERLAY.PRODUCTS ? ` ${styles['ls-glass-btn--active']}` : ''}`}
                onClick={() => toggleLiveOverlay(LIVE_OVERLAY.PRODUCTS)}
                aria-label="Products"
              >
                <IconShoppingBag size={15} />
                <span className={styles['ls-btn-count']}>{products.length}</span>
              </button>

              <button
                className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--icon']}${activeOverlay === LIVE_OVERLAY.VOUCHERS ? ` ${styles['ls-glass-btn--active']}` : ''}`}
                onClick={() => toggleLiveOverlay(LIVE_OVERLAY.VOUCHERS)}
                aria-label="Vouchers"
              >
                <IconGift size={15} />
                {vouchers.length > 0 && (
                  <span className={styles['ls-btn-count']}>{vouchers.length}</span>
                )}
              </button>

              <button
                className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--icon']}${activeOverlay === LIVE_OVERLAY.LIVE_CART ? ` ${styles['ls-glass-btn--active']}` : ''}`}
                onClick={() => toggleLiveOverlay(LIVE_OVERLAY.LIVE_CART)}
                aria-label="Live Cart"
              >
                <IconCart size={15} />
                {liveCartItems.length > 0 && (
                  <span className={styles['ls-btn-count']}>{liveCartItems.length}</span>
                )}
              </button>
            </div>
          </div>

          {/* ══ FEATURED PRODUCT CARD ══ */}
          {showPinnedOverlay && displayProduct && (
            <div className={`${styles['ls-feature-card']}${isPinned ? ` ${styles['ls-feature-card--pinned']}` : ''}`}>
              <div className={styles['ls-feature-body']}>
                {/* Close */}
                <button
                  className={styles['ls-feature-close']}
                  onClick={() => setShowPinnedOverlay(false)}
                  aria-label="Close"
                >
                  <IconX />
                </button>

                {/* Product Image */}
                <div className={styles['ls-feature-thumb']}>
                  <img
                    src={displayProduct?.thumbnail || displayProduct?.images?.[0] || '/placeholder.png'}
                    alt={displayProduct?.name || 'Product'}
                    onError={(e) => {
 e.target.src = '/placeholder.png'; 
}}
                  />
                  {discount && (
                    <div className={styles['ls-discount-chip']}>-{discount}%</div>
                  )}
                </div>

                {/* Product Info */}
                <div className={styles['ls-feature-info']}>
                  <span className={styles['ls-feature-tag']}>Featured Item</span>
                  <h3 className={styles['ls-feature-name']}>{displayProduct?.name || 'Product Name'}</h3>
                  <div className={styles['ls-feature-price-row']}>
                    <span className={styles['ls-feature-price']}>
                      {formatVND(mainPrice)}
                    </span>
                    {showStrike && (
                      <span className={styles['ls-feature-price-orig']}>
                        {formatVND(origNum)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className={styles['ls-feature-actions']}>
                  <button
                    className={styles['ls-buy-btn']}
                    onClick={() => displayProduct?._id && handleQuickBuy(displayProduct)}
                  >
                    <IconCart size={13} />
                    Buy Now
                  </button>
                  <button
                    className={styles['ls-details-link']}
                    onClick={() => displayProduct?._id && handleQuickBuy(displayProduct)}
                  >
                    Details
                    <IconArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ PRODUCTS DRAWER ══ */}
          {activeOverlay === LIVE_OVERLAY.PRODUCTS && (
            <div className={`${styles['ls-products-drawer']} ${styles['ls-products-drawer--dark']}`}>
              {/* Drawer Header */}
              <div className={`${styles['ls-drawer-header']} ${styles['ls-drawer-header--glass']}`}>
                <div className={styles['ls-drawer-header-left']}>
                  <div className={`${styles['ls-drawer-icon']} ${styles['ls-drawer-icon--glass']}`}>
                    <IconShoppingBag size={13} />
                  </div>
                  <div>
                    <div className={`${styles['ls-drawer-title']} ${styles['ls-drawer-title--glass']}`}>Live products</div>
                    <div className={`${styles['ls-drawer-subtitle']} ${styles['ls-drawer-subtitle--glass']}`}>
                      {products.length} {products.length === 1 ? 'product' : 'products'}
                    </div>
                  </div>
                </div>
                <button
                  className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--close']}`}
                  onClick={closeLiveOverlay}
                  aria-label="Close"
                >
                  <IconX />
                </button>
              </div>

              {/* Product Scroll */}
              <div className={`${styles['ls-drawer-scroll']} ${styles['ls-drawer-scroll--dark']}`}>
                {products.length === 0 ? (
                  <div className={`${styles['ls-empty-products']} ${styles['ls-empty-products--dark']}`}>
                    <div className={styles['ls-empty-icon']}>
                      <IconShoppingBag size={32} />
                    </div>
                    <div className={styles['ls-empty-text']}>No products yet</div>
                    <div className={styles['ls-empty-sub']}>The seller will add products soon.</div>
                  </div>
                ) : (
                  <div
                    ref={productsRailWrapRef}
                    className={`${styles['ls-products-rail-wrap']}${
                      productsRailEdges.moreLeft ? ` ${styles['ls-products-rail-wrap--more-left']}` : ''
                    }${productsRailEdges.moreRight ? ` ${styles['ls-products-rail-wrap--more-right']}` : ''}`}
                  >
                    {products.length > 1 && (
                      <p className={styles['ls-products-rail-hint']}>
                        Hover — wheel scrolls sideways · Di chuột — lăn chuột để cuộn ngang · kéo
                      </p>
                    )}
                    <div className={styles['ls-products-rail-inner']}>
                      <div
                        className={`${styles['ls-products-rail-fade']} ${styles['ls-products-rail-fade--left']}`}
                        aria-hidden
                      />
                      <div
                        className={`${styles['ls-products-rail-fade']} ${styles['ls-products-rail-fade--right']}`}
                        aria-hidden
                      />
                      <div
                        ref={productsRailRef}
                        className={styles['ls-products-grid']}
                        role="list"
                        aria-label="Live products"
                        onScroll={updateProductsRailEdges}
                      >
                    {products.map((product, idx) => {
                      const { original: op, current: mp, discount: disc } = computePrice(product);
                      const ip = product._id === pinnedProduct?._id;

                      return (
                        <div
                          key={product._id != null ? String(product._id) : `cart-${idx}`}
                          className={`${styles['ls-product-card']} ${styles['ls-product-card--enhanced']}${ip ? ` ${styles['ls-product-card--pinned']}` : ''}`}
                          onClick={() => handleQuickBuy(product)}
                          role="listitem"
                          tabIndex={0}
                          onKeyDown={(e) => {
 if (e.key === 'Enter') {
handleQuickBuy(product);
}
}}
                        >
                          {/* Image */}
                          <div className={`${styles['ls-product-img-wrap']} ${styles['ls-product-img-wrap--enhanced']}`}>
                            <img
                              src={product.thumbnail || product.images?.[0] || '/placeholder.png'}
                              alt={product.name || 'Product'}
                              className={`${styles['ls-product-img']} ${styles['ls-product-img--enhanced']}`}
                              loading="lazy"
                              decoding="async"
                              onLoad={updateProductsRailEdges}
                              onError={(e) => {
 e.target.src = '/placeholder.png'; 
}}
                            />
                            <div className={styles['ls-product-badge-stack']}>
                              {ip && (
                                <span className={`${styles['ls-product-pin-badge']} ${styles['ls-product-pin-badge--new']}`}>Pinned</span>
                              )}
                              {disc && (
                                <span className={`${styles['ls-product-disc-badge']} ${styles['ls-product-disc-badge--new']}`}>-{disc}%</span>
                              )}
                            </div>
                          </div>

                          {/* Info */}
                          <div className={`${styles['ls-product-info']} ${styles['ls-product-info--enhanced']}`}>
                            <span className={`${styles['ls-product-name']} ${styles['ls-product-name--new']}`}>{product.name}</span>
                            <div className={styles['ls-product-price-row']}>
                              <span className={`${styles['ls-product-price']} ${styles['ls-product-price--new']}`}>
                                {formatVND(mp)}
                              </span>
                              {disc && op && (
                                <span className={`${styles['ls-product-price-orig']} ${styles['ls-product-price-orig--new']}`}>
                                  {formatVND(op)}
                                </span>
                              )}
                            </div>
                            <button
                              className={`${styles['ls-product-buy-btn']} ${styles['ls-product-buy-btn--new']}`}
                              type="button"
                              onClick={(e) => {
 e.stopPropagation(); handleQuickBuy(product); 
}}
                            >
                              Buy now
                            </button>
                          </div>
                        </div>
                      );
                    })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ VOUCHERS DRAWER ══ */}
          {activeOverlay === LIVE_OVERLAY.VOUCHERS && (
            <div className={`${styles['ls-products-drawer']} ${styles['ls-products-drawer--dark']}`}>
              <div className={`${styles['ls-drawer-header']} ${styles['ls-drawer-header--glass']}`}>
                <div className={styles['ls-drawer-header-left']}>
                  <div className={`${styles['ls-drawer-icon']} ${styles['ls-drawer-icon--glass']}`}>
                    <IconGift size={13} />
                  </div>
                  <div>
                    <div className={`${styles['ls-drawer-title']} ${styles['ls-drawer-title--glass']}`}>Live vouchers</div>
                    <div className={`${styles['ls-drawer-subtitle']} ${styles['ls-drawer-subtitle--glass']}`}>
                      {vouchers.length} {vouchers.length === 1 ? 'voucher' : 'vouchers'}
                    </div>
                  </div>
                </div>
                <button
                  className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--close']}`}
                  onClick={closeLiveOverlay}
                  aria-label="Close"
                >
                  <IconX />
                </button>
              </div>

              <div className={`${styles['ls-drawer-scroll']} ${styles['ls-drawer-scroll--dark']}`}>
                {vouchers.length === 0 ? (
                  <div className={`${styles['ls-empty-products']} ${styles['ls-empty-products--dark']}`}>
                    <div className={styles['ls-empty-icon']}>
                      <IconGift size={32} />
                    </div>
                    <div className={styles['ls-empty-text']}>No vouchers yet</div>
                    <div className={styles['ls-empty-sub']}>The seller will add vouchers soon.</div>
                  </div>
                ) : (
                  <div className={styles['ls-vouchers-list']}>
                    {vouchers.map((voucher) => {
                      const isSaved = savedVoucherIds.has(String(voucher._id));
                      const discountLabel =
                        voucher.discountType === 'percent'
                          ? `${voucher.discountValue}% OFF`
                          : `₫${Number(voucher.discountValue || 0).toLocaleString('en-US')} OFF`;
                      const minLabel = voucher.minBasketPrice
                        ? `Min ₫${Number(voucher.minBasketPrice).toLocaleString('en-US')}`
                        : null;
                      const expDate = voucher.endTime
                        ? new Date(voucher.endTime).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : null;

                      return (
                        <div
                          key={voucher._id}
                          className={`${styles['ls-voucher-card']} ${styles['ls-voucher-card--redesigned']}`}
                        >
                          <div className={styles['ls-voucher-card-left']}>
                            <div className={styles['ls-voucher-discount']}>{discountLabel}</div>
                            {minLabel && <div className={styles['ls-voucher-min']}>{minLabel}</div>}
                          </div>
                          <div className={styles['ls-voucher-separator']} aria-hidden />
                          <div className={styles['ls-voucher-card-right']}>
                            <div className={styles['ls-voucher-code']}>{voucher.code}</div>
                            {voucher.name && <div className={styles['ls-voucher-name']}>{voucher.name}</div>}
                            {expDate && <div className={styles['ls-voucher-exp']}>Expires: {expDate}</div>}
                            <div className={styles['ls-voucher-actions']}>
                              <button
                                className={styles['ls-voucher-copy-btn--new']}
                                onClick={() => handleCopyVoucherCode(voucher.code)}
                                type="button"
                              >
                                Copy
                              </button>
                              <button
                                className={`${styles['ls-voucher-save-btn--new']}${isSaved ? ` ${styles['ls-voucher-save-btn--saved-new']}` : ''}`}
                                onClick={() => handleSaveVoucher(String(voucher._id))}
                                disabled={isSaved}
                                type="button"
                              >
                                {isSaved ? 'Saved' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Show overlay FAB */}
          {!showPinnedOverlay && displayProduct && (
            <div className={styles['ls-fab']}>
              <button
                className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--fab']}`}
                onClick={() => setShowPinnedOverlay(true)}
                aria-label="Show product"
              >
                <IconChevronUp size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ══ CHAT SIDEBAR ══ */}
        {!isFullscreen && (
          <aside className={styles['ls-chat-sidebar']}>
          <div className={styles['ls-chat-inner']}>

            {/* Chat Header */}
            <div className={styles['ls-chat-header']}>
              <div className={styles['ls-chat-header-left']}>
                <div className={styles['ls-chat-icon-wrap']}>
                  <div className={styles['ls-chat-icon']}>
                    <IconMessageSquare size={13} />
                  </div>
                  <div className={styles['ls-chat-live-dot']} />
                </div>
                <div>
                  <h2 className={styles['ls-chat-title']}>Live Chat</h2>
                  <div className={styles['ls-chat-subtitle']}>{formatCount(viewerCount)} watching</div>
                </div>
              </div>
              <button
                className={`${styles['ls-follow-btn']}${isFollowing ? ` ${styles['ls-follow-btn--active']}` : ''}`}
                onClick={handleFollow}
              >
                {isFollowing ? <IconCheck size={11} /> : <IconPlus size={11} />}
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>

            {/* Messages */}
            <div ref={chatRef} className={styles['ls-messages']}>
              {/* Syntax guide pinned at top */}
              {syntaxGuide && <SyntaxGuideCard guide={syntaxGuide} />}

              {messages.length === 0 && (
                <div className={styles['ls-empty-chat']}>
                  <div className={styles['ls-empty-chat-icon']}>
                    <IconMessageSquare size={20} />
                  </div>
                  <span>Say something nice</span>
                </div>
              )}

              {/* System messages at top */}
              {systemMessages.map((msg) => (
                <div key={msg.id} className={`${styles['ls-msg-row']} ${styles['ls-msg-row--system']}`}>
                  <span className={styles['ls-msg-bubble']}>{msg.text}</span>
                </div>
              ))}

              {/* User messages below */}
              {messages.map((m, i) => {
                const isOwn = String(m.userId) === String(user?._id);
                const isHost = m.role === 'host' || m.role === 'seller' || m.isSupport;
                const nameLabel = isOwn ? 'You' : isHost ? 'Seller' : m.displayName || 'Viewer';
                const initials = isHost && !isOwn
                  ? 'SE'
                  : isOwn
                    ? (user?.fullName || 'YO').slice(0, 2).toUpperCase()
                    : (m.displayName || 'V').slice(0, 2).toUpperCase();

                const avatarSrc = isOwn
                  ? resolveUserAvatar(user)
                  : (m.avatar || (isHost && !isOwn ? session?.shopId?.avatar : '') || '');

                return (
                  <div
                    key={m.id || i}
                    className={`${styles['ls-msg-row']}${isOwn ? ` ${styles['ls-msg-row--own']}` : ''}${isHost && !isOwn ? ` ${styles['ls-msg-row--host']}` : ''}`}
                  >
                    <LiveChatAvatar
                      src={avatarSrc}
                      initials={initials}
                      className={`${styles['ls-msg-avatar']}${isHost && !isOwn ? ` ${styles['ls-msg-avatar--host']}` : isOwn ? ` ${styles['ls-msg-avatar--own']}` : ` ${styles['ls-msg-avatar--other']}`}`}
                    />
                    <div className={`${styles['ls-msg-content']}${isOwn ? ` ${styles['ls-msg-content--own']}` : ''}`}>
                      <div className={styles['ls-msg-meta']}>
                        {isHost && !isOwn && (
                          <span className={styles['ls-msg-host-badge']}>Seller</span>
                        )}
                        <span className={styles['ls-msg-name']}>{nameLabel}</span>
                      </div>
                      <div className={`${styles['ls-msg-bubble']}${isOwn ? ` ${styles['ls-msg-bubble--own']}` : isHost ? ` ${styles['ls-msg-bubble--host']}` : ''}`}>
                        <p className={styles['ls-msg-text']}>{m.content}</p>
                      </div>
                      {m.timestamp && (
                        <span className={styles['ls-msg-time']}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <div className={styles['ls-input-area']}>
              {/* Action icons */}
              <div className={styles['ls-input-actions']}>
                <div className={styles['ls-emote-picker-wrap']} ref={emotePickerRef}>
                  <button
                    type="button"
                    className={`${styles['ls-input-icon-btn']}${emotePickerOpen ? ` ${styles['ls-input-icon-btn--active']}` : ''}`}
                    title="Emote"
                    aria-label="Open emote picker"
                    aria-expanded={emotePickerOpen}
                    aria-haspopup="dialog"
                    disabled={!user}
                    onClick={() => setEmotePickerOpen((o) => !o)}
                  >
                    <IconSmile size={15} />
                  </button>
                  {emotePickerOpen && user && (
                    <div
                      className={styles['ls-emote-picker']}
                      role="dialog"
                      aria-label="Choose an emote"
                    >
                      <div className={styles['ls-emote-picker-grid']}>
                        {LIVE_CHAT_EMOTES.map((em) => (
                          <button
                            key={em}
                            type="button"
                            className={styles['ls-emote-cell']}
                            onClick={() => sendEmote(em)}
                            aria-label={`Send ${em}`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles['ls-input-actions-spacer']} />
                <span className={styles['ls-input-brand']}>GZMart</span>
              </div>

              {/* Input row */}
              <div className={`${styles['ls-input-row']}${inputFocused ? ` ${styles['ls-input-row--focused']}` : ''}`}>
                <input
                  className={styles['ls-text-input']}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
 if (e.key === 'Enter') {
sendChat();
} 
}}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={user ? 'Say something' : 'Login to chat'}
                  disabled={!user}
                  maxLength={300}
                  aria-label="Chat input"
                />
                {input.length > 0 && (
                  <span className={`${styles['ls-char-count']}${input.length > 250 ? ` ${styles['ls-char-count--warn']}` : ''}`}>
                    {input.length}/300
                  </span>
                )}
                <button
                  className={`${styles['ls-send-btn']}${input.trim() && user ? ` ${styles['ls-send-btn--active']}` : ''}`}
                  onClick={sendChat}
                  disabled={!user || !input.trim()}
                  aria-label="Send"
                >
                  {isSending ? (
                    <IconLoader size={12} animated />
                  ) : (
                    <IconSend size={12} />
                  )}
                </button>
              </div>

              {!user && (
                <p className={styles['ls-login-hint']}>
                  <a href="/login" className={styles['ls-login-link']}>Login</a> to join the chat
                </p>
              )}
            </div>
          </div>
        </aside>
        )}
      </div>

      {!isFullscreen && <Footer />}

      {/* Quick Buy Bottom Sheet */}
      <LiveQuickBuySheet
        show={activeOverlay === LIVE_OVERLAY.QUICK_BUY}
        onHide={closeLiveOverlay}
        product={selectedQuickBuyProduct}
        liveVouchers={vouchers}
        sessionId={sessionId}
        user={user}
        onAddToLiveCart={(item) => {
          setLiveCartItems((prev) => [...prev, { ...item, tempId: generateTempId() }]);
          setActiveOverlay(LIVE_OVERLAY.LIVE_CART);
          toast.success(
            <div>
              <div style={{ fontWeight: 600 }}>Added to live cart!</div>
              <div style={{ fontSize: '0.78rem', color: '#ddd', marginTop: 2 }}>
                {item.quantity}x {item.name}
                {item.variantLabel ? ` (${item.variantLabel})` : ''}
              </div>
            </div>,
            { autoClose: 3000 },
          );
        }}
      />

      {/* Live Cart Drawer */}
      <AnimatePresence>
        {activeOverlay === LIVE_OVERLAY.LIVE_CART && (
          <LiveCartDrawer
            items={liveCartItems}
            onHide={closeLiveOverlay}
            onRemoveItem={handleRemoveLiveCartItem}
            onUpdateQty={handleUpdateLiveCartQty}
            onCheckout={handleLiveCartCheckout}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

Icon.propTypes = {
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
  children: PropTypes.node,
  className: PropTypes.string,
  animated: PropTypes.bool,
};

IconChevronLeft.propTypes = { size: PropTypes.number };
IconShare.propTypes = { size: PropTypes.number };
IconHeart.propTypes = { size: PropTypes.number, filled: PropTypes.bool, animated: PropTypes.bool };
IconShoppingBag.propTypes = { size: PropTypes.number };
IconCart.propTypes = { size: PropTypes.number };
IconArrowRight.propTypes = { size: PropTypes.number };
IconX.propTypes = {};
IconSend.propTypes = { size: PropTypes.number };
IconLoader.propTypes = { size: PropTypes.number };
IconEye.propTypes = { size: PropTypes.number };
IconSmile.propTypes = { size: PropTypes.number };
IconGift.propTypes = { size: PropTypes.number };
IconCheck.propTypes = { size: PropTypes.number };
IconPlus.propTypes = { size: PropTypes.number };
IconChevronUp.propTypes = { size: PropTypes.number };
IconAlert.propTypes = { size: PropTypes.number };
IconPlay.propTypes = { size: PropTypes.number };
IconMessageSquare.propTypes = { size: PropTypes.number };

SyntaxGuideCard.propTypes = {
  guide: PropTypes.shape({
    prefix: PropTypes.string,
    product: PropTypes.shape({
      thumbnail: PropTypes.string,
      name: PropTypes.string,
      tiers: PropTypes.arrayOf(PropTypes.object),
    }),
    variantTiers: PropTypes.arrayOf(
      PropTypes.shape({ name: PropTypes.string, options: PropTypes.array })
    ),
  }),
};

LiveCartDrawer.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      tempId: PropTypes.string,
      quantity: PropTypes.number,
      variantLabel: PropTypes.string,
    })
  ),
  onHide: PropTypes.func,
  onRemoveItem: PropTypes.func,
  onUpdateQty: PropTypes.func,
  onCheckout: PropTypes.func,
};
