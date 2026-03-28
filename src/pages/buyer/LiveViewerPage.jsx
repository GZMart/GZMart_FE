import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { parseOrderSyntax } from '@utils/orderSyntax';
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

// ── Chat message normalizer ─────────────────────────────────────────────────
const normalizeMessage = (m) => ({
  id: m.id || m._id || String(Math.random()),
  displayName: m.displayName || m.userId || 'Viewer',
  content: m.content,
  userId: m.userId,
  role: m.role || 'buyer',
  timestamp: m.timestamp || new Date().toISOString(),
});

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

const IconImage = ({ size = 15 }) => (
  <Icon size={size} strokeWidth={2}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
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

// ── Syntax Guide Card (pinned at top of chat) ───────────────────────────────
const SyntaxGuideCard = ({ guide }) => {
  if (!guide) {
return null;
}

  const { prefix, product, variantTiers } = guide;

  const exampleParts = [
    prefix,
    ...variantTiers.map((t) => {
      const opts = syntaxTierOptionsResolved(t, product);
      return opts[0] ?? t.name;
    }),
    '2',
  ];
  const example = `#${exampleParts.join(' ')}`;

  return (
    <div className={styles['ls-syntax-guide']}>
      <div className={styles['ls-syntax-guide-header']}>
        <div className={styles['ls-syntax-guide-icon']}>
          <IconMessageSquare size={12} />
        </div>
        <span className={styles['ls-syntax-guide-label']}>Cú pháp mua hàng</span>
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
              <span className={styles['ls-syntax-guide-tier-name']}>{tier.name}:</span>
              <div className={styles['ls-syntax-guide-tier-options']}>
                {syntaxTierOptionsResolved(tier, product).map((opt) => (
                  <span key={opt} className={styles['ls-syntax-guide-option-chip']}>
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles['ls-syntax-guide-example']}>
        Ví dụ: <code>{example}</code>
      </div>

      <div className={styles['ls-syntax-guide-hint']}>
        Nhắn cú pháp trên vào chat để mua ngay
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
      <span>Chưa có sản phẩm nào</span>
      <span className={styles['ls-live-cart-empty-hint']}>
        Nhắn cú pháp để thêm vào giỏ
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
          <span className={styles['ls-live-cart-total-label']}>Tổng cộng:</span>
          <span className={styles['ls-live-cart-total-value']}>{formatVND(total)}</span>
        </div>
        <button className={styles['ls-live-cart-checkout-btn']} onClick={onCheckout}>
          <IconCart size={13} />
          Thanh toán ngay
        </button>
        <button className={styles['ls-live-cart-continue-btn']} onClick={onHide}>
          Tiếp tục mua
        </button>
      </div>
    </>
  );

  return (
    <motion.div
      className={styles['ls-live-cart-drawer']}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className={styles['ls-live-cart-header']}>
        <div className={styles['ls-live-cart-header-left']}>
          <span className={styles['ls-live-cart-title']}>Giỏ hàng Live</span>
          {items.length > 0 && (
            <span className={styles['ls-live-cart-count']}>{items.length}</span>
          )}
        </div>
        <button className={styles['ls-live-cart-close']} onClick={onHide}>
          <IconX />
        </button>
      </div>

      {/* Body */}
      <div className={styles['ls-live-cart-body']}>
        {drawerContent}
      </div>
    </motion.div>
  );
};

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
  const [pinnedProductId, setPinnedProductId] = useState(null);
  const [showProductsDrawer, setShowProductsDrawer] = useState(false);
  const [showVouchersDrawer, setShowVouchersDrawer] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [savedVoucherIds, setSavedVoucherIds] = useState(new Set());
  const [showPinnedOverlay, setShowPinnedOverlay] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [hasRemoteTrack, setHasRemoteTrack] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [systemMessages, setSystemMessages] = useState([]);
  const hasJoinedRef = useRef(false);
  const [showQuickBuy, setShowQuickBuy] = useState(false);
  const [selectedQuickBuyProduct, setSelectedQuickBuyProduct] = useState(null);
  const [liveCartItems, setLiveCartItems] = useState([]);
  const [showLiveCart, setShowLiveCart] = useState(false);

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

  const pinnedProductIdRef = useRef(pinnedProductId);
  useEffect(() => {
 pinnedProductIdRef.current = pinnedProductId; 
}, [pinnedProductId]);

  const pinnedProductRef = useRef(pinnedProduct);
  useEffect(() => {
 pinnedProductRef.current = pinnedProduct; 
}, [pinnedProduct]);

  const liveCartItemsRef = useRef([]);
  useEffect(() => {
 liveCartItemsRef.current = liveCartItems; 
}, [liveCartItems]);

  // Initial products API sets pinnedProduct but not pinnedProductId — keep id in sync for order syntax fallback
  useEffect(() => {
    setPinnedProductId(pinnedProduct?._id ?? null);
  }, [pinnedProduct]);

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
        { id: toastId, type: 'join', text: `${displayName || 'Viewer'} đã vào phiên live` },
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

    socketService.on('livestream_viewer_update', handleViewerUpdate);
    socketService.on('livestream_chat_message', handleSocketChat);
    socketService.on('livestream_pin_update', handlePinUpdate);
    socketService.on('livestream_products_update', handleProductsUpdate);
    socketService.on('livestream_vouchers_update', handleVouchersUpdate);
    socketService.on('livestream_join', handleRemoteJoin);
    socketService.on(SOCKET_EVENTS.LIVESTREAM_CONFIG_UPDATE, handleConfigUpdate);
    socketService.on('livestream_syntax_guide', handleSyntaxGuide);
    socketService.on('livestream_syntax_guide_clear', handleSyntaxGuideClear);

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
          .getSessionMessages(sessionId)
          .then((messagesRes) => {
            const msgList = Array.isArray(messagesRes?.data)
              ? messagesRes.data
              : messagesRes?.data?.data;
            if (msgList?.length) {
              setMessages(
                msgList.slice(-20).map(normalizeMessage)
              );
            }
          })
          .catch(() => { /* chat history is optional */ });

        setLoading(false);

        // Emit join event — backend will broadcast to all viewers; toast shows & fades for everyone
        if (user && !hasJoinedRef.current) {
          hasJoinedRef.current = true;
          socketService.emit('livestream_join', {
            sessionId,
            userId: user._id || 'anonymous',
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

  // ── Emit leave event on unmount ─────────────────────────────────
  useEffect(() => () => {
      if (sessionId && user) {
        socketService.emit('livestream_leave', {
          sessionId,
          userId: user._id || 'anonymous',
          displayName: displayNameRef.current,
          role: 'buyer',
        });
      }
    }, [sessionId, user]);

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
      const optionIdx = tiers[tierIdx].options?.findIndex(
        (o) => String(o).toLowerCase() === String(value).toLowerCase(),
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
      toast.error('Không có sản phẩm nào được chọn để đặt hàng.');
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
        toast.error(`Không tìm thấy biến thể phù hợp (${attempted}) cho sản phẩm này.`);
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
        toast.error('Sản phẩm này không có biến thể hợp lệ.');
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
      setShowLiveCart(true);

      toast.success(
        <div>
          <div style={{ fontWeight: 600 }}>Đã thêm vào giỏ live!</div>
          <div style={{ fontSize: '0.78rem', color: '#ddd', marginTop: 2 }}>
            {qty}x {targetProduct.name}
            {variantLabel ? ` (${variantLabel})` : ''}
          </div>
        </div>,
        { autoClose: 3000 },
      );
    } catch (err) {
      toast.error(err?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    }
  }, [resolveVariantFromTiers]);

  // Keep syntaxMatchedRef in sync with the latest handleSyntaxMatched
  useEffect(() => {
    syntaxMatchedRef.current = handleSyntaxMatched;
  }, [handleSyntaxMatched]);

  // ── Send chat via Socket.IO ─
  const sendChat = () => {
    const text = input.trim();
    if (!text || !user) {
return;
}

    setIsSending(true);
    const localMsg = {
      ...normalizeMessage({ id: `local_${Date.now()}`, content: text, userId: user?._id }),
      displayName: displayNameRef.current,
      isOwn: true,
    };
    setMessages((prev) => [...prev.slice(-49), localMsg]);
    setInput('');

    const os = orderSyntaxRef.current;
    if (os.enabled && os.prefix) {
      const result = parseOrderSyntax(text, os.prefix, os.productId, os.variantTiers);
      if (result.matched) {
        syntaxMatchedRef.current(result, displayNameRef.current);
      }
    }

    socketService.emit('livestream_chat', {
      sessionId,
      content: text,
      displayName: displayNameRef.current,
      userId: user?._id || 'anonymous',
      role: 'buyer',
    });

    setTimeout(() => setIsSending(false), 600);
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

  // ── Like via REST API ─
  const handleLike = () => {
    if (liked || !sessionId) {
return;
}

    setLiked(true);
    setLikeCount((c) => c + 1);

    livestreamService.likeSession(sessionId)
      .then((res) => {
        if (res?.data?.likeCount !== undefined) {
setLikeCount(res.data.likeCount);
}
      })
      .catch(() => {
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      });
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
      setSavedVoucherIds((prev) => new Set([...prev, voucherId]));
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
    setSelectedQuickBuyProduct(product);
    setShowQuickBuy(true);
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
    <div className={styles['ls-root']}>
      <Header />

      {/* ── Main Stage ────────────────────────────────────────────────── */}
      <div className={styles['ls-stage']}>

        {/* ══ VIDEO COLUMN ══ */}
        <div className={styles['ls-video-col']}>

          {/* Ambient grid */}
          <div className={styles['ls-grid-bg']} />

          {/* Video Layer */}
          <div className={styles['ls-video-wrap']}>
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
                className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--icon']}${liked ? ` ${styles['ls-glass-btn--liked']}` : ''}`}
                onClick={handleLike}
                disabled={liked}
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
                className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--icon']}${showProductsDrawer ? ` ${styles['ls-glass-btn--active']}` : ''}`}
                onClick={() => setShowProductsDrawer((v) => !v)}
                aria-label="Products"
              >
                <IconShoppingBag size={15} />
                <span className={styles['ls-btn-count']}>{products.length}</span>
              </button>

              <button
                className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--icon']}${showVouchersDrawer ? ` ${styles['ls-glass-btn--active']}` : ''}`}
                onClick={() => setShowVouchersDrawer((v) => !v)}
                aria-label="Vouchers"
              >
                <IconGift size={15} />
                {vouchers.length > 0 && (
                  <span className={styles['ls-btn-count']}>{vouchers.length}</span>
                )}
              </button>

              <button
                className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--icon']}${showLiveCart ? ` ${styles['ls-glass-btn--active']}` : ''}`}
                onClick={() => setShowLiveCart((v) => !v)}
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
          {showProductsDrawer && (
            <div className={styles['ls-products-drawer']}>
              {/* Drawer Header */}
              <div className={styles['ls-drawer-header']}>
                <div className={styles['ls-drawer-header-left']}>
                  <div className={styles['ls-drawer-icon']}>
                    <IconShoppingBag size={13} />
                  </div>
                  <div>
                    <div className={styles['ls-drawer-title']}>San pham dang live</div>
                    <div className={styles['ls-drawer-subtitle']}>{products.length} san pham</div>
                  </div>
                </div>
                <button
                  className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--close']}`}
                  onClick={() => setShowProductsDrawer(false)}
                  aria-label="Close"
                >
                  <IconX />
                </button>
              </div>

              {/* Product Scroll */}
              <div className={styles['ls-drawer-scroll']}>
                {products.length === 0 ? (
                  <div className={styles['ls-empty-products']}>
                    <div className={styles['ls-empty-icon']}>
                      <IconShoppingBag size={32} />
                    </div>
                    <div className={styles['ls-empty-text']}>Chua co san pham nao</div>
                    <div className={styles['ls-empty-sub']}>Seller se them san pham som nhat</div>
                  </div>
                ) : (
                  <div className={styles['ls-products-track']}>
                    {products.map((product, idx) => {
                      const { original: op, current: mp, discount: disc } = computePrice(product);
                      const ip = product._id === pinnedProduct?._id;

                      return (
                        <div
                          key={product._id != null ? String(product._id) : `cart-${idx}`}
                          className={`${styles['ls-product-card']}${ip ? ` ${styles['ls-product-card--pinned']}` : ''}`}
                          onClick={() => handleQuickBuy(product)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
 if (e.key === 'Enter') {
handleQuickBuy(product);
} 
}}
                        >
                          {/* Image */}
                          <div className={styles['ls-product-img-wrap']}>
                            <img
                              src={product.thumbnail || product.images?.[0] || '/placeholder.png'}
                              alt={product.name || 'San pham'}
                              className={styles['ls-product-img']}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
 e.target.src = '/placeholder.png'; 
}}
                            />
                            {ip && (
                              <div className={styles['ls-product-pin-badge']}>Ghim</div>
                            )}
                            {disc && (
                              <div className={styles['ls-product-disc-badge']}>-{disc}%</div>
                            )}
                          </div>

                          {/* Info */}
                          <div className={styles['ls-product-info']}>
                            <span className={styles['ls-product-name']}>{product.name}</span>
                            <span className={styles['ls-product-price']}>
                              {formatVND(mp)}
                            </span>
                            {disc && op && (
                              <span className={styles['ls-product-price-orig']}>
                                {formatVND(op)}
                              </span>
                            )}
                            <button
                              className={styles['ls-product-buy-btn']}
                              type="button"
                              onClick={(e) => {
 e.stopPropagation(); handleQuickBuy(product); 
}}
                            >
                              Mua ngay
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ VOUCHERS DRAWER ══ */}
          {showVouchersDrawer && (
            <div className={styles['ls-products-drawer']}>
              <div className={styles['ls-drawer-header']}>
                <div className={styles['ls-drawer-header-left']}>
                  <div className={styles['ls-drawer-icon']}>
                    <IconGift size={13} />
                  </div>
                  <div>
                    <div className={styles['ls-drawer-title']}>Voucher khuyen mai</div>
                    <div className={styles['ls-drawer-subtitle']}>{vouchers.length} voucher</div>
                  </div>
                </div>
                <button
                  className={`${styles['ls-glass-btn']} ${styles['ls-glass-btn--close']}`}
                  onClick={() => setShowVouchersDrawer(false)}
                  aria-label="Close"
                >
                  <IconX />
                </button>
              </div>

              <div className={styles['ls-drawer-scroll']}>
                {vouchers.length === 0 ? (
                  <div className={styles['ls-empty-products']}>
                    <div className={styles['ls-empty-icon']}>
                      <IconGift size={32} />
                    </div>
                    <div className={styles['ls-empty-text']}>Chua co voucher nao</div>
                    <div className={styles['ls-empty-sub']}>Seller se them voucher som nhat</div>
                  </div>
                ) : (
                  <div className={styles['ls-vouchers-list']}>
                    {vouchers.map((voucher) => {
                      const isSaved = savedVoucherIds.has(voucher._id);
                      const discountLabel =
                        voucher.discountType === 'percent'
                          ? `${voucher.discountValue}% OFF`
                          : `₫${Number(voucher.discountValue || 0).toLocaleString('vi-VN')} OFF`;
                      const minLabel = voucher.minBasketPrice
                        ? `Min ₫${Number(voucher.minBasketPrice).toLocaleString('vi-VN')}`
                        : null;
                      const expDate = voucher.endTime
                        ? new Date(voucher.endTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : null;

                      return (
                        <div key={voucher._id} className={styles['ls-voucher-card']}>
                          <div className={styles['ls-voucher-left']}>
                            <div className={styles['ls-voucher-discount']}>{discountLabel}</div>
                            {minLabel && <div className={styles['ls-voucher-min']}>{minLabel}</div>}
                          </div>
                          <div className={styles['ls-voucher-right']}>
                            <div className={styles['ls-voucher-code']}>{voucher.code}</div>
                            {voucher.name && <div className={styles['ls-voucher-name']}>{voucher.name}</div>}
                            {expDate && <div className={styles['ls-voucher-exp']}>Han: {expDate}</div>}
                            <div className={styles['ls-voucher-actions']}>
                              <button
                                className={styles['ls-voucher-copy-btn']}
                                onClick={() => handleCopyVoucherCode(voucher.code)}
                                type="button"
                              >
                                Copy
                              </button>
                              <button
                                className={`${styles['ls-voucher-save-btn']}${isSaved ? ` ${styles['ls-voucher-save-btn--saved']}` : ''}`}
                                onClick={() => handleSaveVoucher(voucher._id)}
                                disabled={isSaved}
                                type="button"
                              >
                                {isSaved ? 'Da luu' : 'Luu lai'}
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

                return (
                  <div
                    key={m.id || i}
                    className={`${styles['ls-msg-row']}${isOwn ? ` ${styles['ls-msg-row--own']}` : ''}${isHost && !isOwn ? ` ${styles['ls-msg-row--host']}` : ''}`}
                  >
                    <div className={`${styles['ls-msg-avatar']}${isHost && !isOwn ? ` ${styles['ls-msg-avatar--host']}` : isOwn ? ` ${styles['ls-msg-avatar--own']}` : ` ${styles['ls-msg-avatar--other']}`}`}>
                      {initials}
                    </div>
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
                <button className={styles['ls-input-icon-btn']} title="Emoji" aria-label="Emoji">
                  <IconSmile size={15} />
                </button>
                <button className={styles['ls-input-icon-btn']} title="Gift" aria-label="Gift">
                  <IconGift size={15} />
                </button>
                <button className={styles['ls-input-icon-btn']} title="Image" aria-label="Image">
                  <IconImage size={15} />
                </button>
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
      </div>

      <Footer />

      {/* Quick Buy Bottom Sheet */}
      <LiveQuickBuySheet
        show={showQuickBuy}
        onHide={() => setShowQuickBuy(false)}
        product={selectedQuickBuyProduct}
        liveVouchers={vouchers}
        sessionId={sessionId}
        user={user}
        onAddToLiveCart={(item) => {
          setLiveCartItems((prev) => [...prev, { ...item, tempId: generateTempId() }]);
          setShowQuickBuy(false);
          setShowLiveCart(true);
          toast.success(
            <div>
              <div style={{ fontWeight: 600 }}>Đã thêm vào giỏ live!</div>
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
        {showLiveCart && (
          <LiveCartDrawer
            items={liveCartItems}
            onHide={() => setShowLiveCart(false)}
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
IconImage.propTypes = { size: PropTypes.number };
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
