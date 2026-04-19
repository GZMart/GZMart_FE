import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@hooks/useMediaQuery';
import { DataPacket_Kind } from 'livekit-client';
import livestreamService from '@services/api/livestreamService';
import socketService from '@services/socket/socketService';
import styles from '@assets/styles/buyer/LiveStreamPage.module.css';
import OrderSyntaxPanel from './OrderSyntaxPanel';

function resolveUserAvatar(u) {
  if (!u) {
    return '';
  }
  const url = u.avatar || u.profileImage;
  return typeof url === 'string' && url.trim() ? url.trim() : '';
}

function SellerChatAvatar({ avatarUrl, initials, className }) {
  const [imgErr, setImgErr] = useState(false);
  useEffect(() => {
    setImgErr(false);
  }, [avatarUrl]);
  const show = Boolean(avatarUrl) && !imgErr;
  return (
    <div className={className}>
      {show ? (
        <img
          src={avatarUrl}
          alt=""
          className={styles.chatAvatarImg}
          onError={() => setImgErr(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}

export default function LiveChatPanel({ room, sessionId, isLive, liveProducts = [], pinnedProductId = null, onEditProducts, onRemoveProduct, onPinProduct, onUnpinProduct, liveVouchers = [], onEditVouchers, onRemoveVoucher }) {
  const compactTabs = useMediaQuery('(max-width: 768px)');
  const [activeTab, setActiveTab] = useState('interaction');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [chatStatus, setChatStatus] = useState('idle');
  const [refreshing, setRefreshing] = useState(false);
  /** Scroll container for seller chat only — avoid scrollIntoView (scrolls the whole page). */
  const chatScrollRef = useRef(null);
  const user = useSelector((state) => state.auth?.user);
  const sellerIdRef = useRef(user?._id || 'seller_self');
  const displayNameRef = useRef(user?.fullName || 'Seller');
  const existingIdsRef = useRef(new Set()); // dedup set for refresh

  // Sync user into refs
  useEffect(() => {
    sellerIdRef.current = user?._id || 'seller_self';
    displayNameRef.current = user?.fullName || 'Seller';
  }, [user]);

  // ── Session persistence: save/restore on mount/unmount ──────────────
  useEffect(() => {
    if (!sessionId) {
return;
}
    try {
      const saved = sessionStorage.getItem('gzmart_seller_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.sessionId === sessionId && Array.isArray(parsed?.messages)) {
          /* Optimistic rows (local_*) must not survive F5 — server history has the real id. */
          const deduped = parsed.messages
            .filter((m) => !m.isLocal)
            .filter((m, i, arr) => arr.findIndex((p) => p.id === m.id) === i);
          setMessages(deduped);
          deduped.forEach((m) => existingIdsRef.current.add(m.id));
        }
      }
    } catch {
      /* non-critical */
    }
  }, [sessionId]);

  const persistSession = useCallback((msgList) => {
    if (!sessionId) {
return;
}
    try {
      const withoutOptimistic = msgList.filter((m) => !m.isLocal).slice(-100);
      sessionStorage.setItem(
        'gzmart_seller_session',
        JSON.stringify({ sessionId, messages: withoutOptimistic }),
      );
    } catch {
      /* non-critical */
    }
  }, [sessionId]);

  // Persist on message changes
  useEffect(() => {
    if (messages.length > 0) {
      persistSession(messages);
    }
  }, [messages, persistSession]);

  // ── Refresh chat history ──────────────────────────────────────────────
  const handleRefreshChat = useCallback(async () => {
    if (!isLive || !sessionId) {
return;
}
    setRefreshing(true);
    try {
      const res = await livestreamService.getSessionMessages(sessionId, 100);
      const list = Array.isArray(res?.data) ? res.data : res?.data?.data;
      if (list?.length) {
        const normalized = list.map((m) => ({
          id: m.id || m._id || String(Math.random()),
          sender: m.displayName || m.userId || 'Viewer',
          initials: (m.displayName || 'V').slice(0, 2).toUpperCase(),
          colorClass: m.role === 'host' || m.role === 'seller' ? styles.chatAvatarBlue : styles.chatAvatarGray,
          text: m.content,
          isLocal: false,
          timestamp: m.timestamp,
          senderId: m.senderId,
          userId: m.userId ?? m.senderId,
          avatarUrl: typeof m.avatar === 'string' && m.avatar.trim() ? m.avatar.trim() : '',
        }));
        // Only add messages we don't already have
        const fresh = normalized.filter((m) => !existingIdsRef.current.has(m.id));
        if (fresh.length > 0) {
          const sellerSid = String(sellerIdRef.current);
          setMessages((prev) => {
            let next = prev;
            for (const nm of fresh) {
              if (String(nm.senderId) === sellerSid) {
                const li = next.findIndex((p) => p.isLocal && p.text === nm.text);
                if (li !== -1) {
                  const removed = next[li];
                  next = [...next.slice(0, li), ...next.slice(li + 1)];
                  existingIdsRef.current.delete(removed.id);
                }
              }
            }
            return [...next, ...fresh];
          });
          fresh.forEach((m) => existingIdsRef.current.add(m.id));
        }
      }
    } catch {
      /* non-critical */
    } finally {
      setRefreshing(false);
    }
  }, [isLive, sessionId]);

  /** Fetch server chat history once per live segment / session (late-joining seller). */
  const historyFetchKeyRef = useRef('');

  useEffect(() => {
    if (!isLive) {
      historyFetchKeyRef.current = '';
      return;
    }
    if (!sessionId) {
      return;
    }
    const key = String(sessionId);
    if (historyFetchKeyRef.current === key) {
      return;
    }
    historyFetchKeyRef.current = key;
    void handleRefreshChat();
  }, [isLive, sessionId, handleRefreshChat]);

  // LiveKit room connected → enable chat input
  useEffect(() => {
    if (room) {
      setChatStatus('connected');
    } else if (isLive) {
      setChatStatus('connecting');
    } else {
      setChatStatus('idle');
    }
  }, [room, isLive]);

  // ── Socket.IO: join + receive all messages (deduplicated by senderId) ─
  // Seller sends via both LiveKit DataChannel and Socket.IO (so all viewers receive).
  // Seller receives ALL messages (from buyer and from its own echo) via Socket.IO only —
  // LiveKit DataChannel is NOT listened to (causes duplicates).
  // Deduplication: skip if senderId matches the seller's own userId (those were added optimistically).
  useEffect(() => {
    if (!isLive || !sessionId || !user?._id) {
return;
}

    socketService.connect(user._id);
    // livestream_join / livestream_leave — LiveStreamPage (stays active on Analytics tab)

    const onSocketChat = (msg) => {
      if (!msg?.content || msg.sessionId !== sessionId) {
return;
}
      const sid = String(sellerIdRef.current);
      if (String(msg.senderId) === sid || String(msg.userId) === sid) {
return;
}
      if (msg.id) {
        if (existingIdsRef.current.has(msg.id)) {
return;
}
        existingIdsRef.current.add(msg.id);
        const newMsg = {
          id: msg.id,
          sender: msg.displayName || 'Viewer',
          initials: (msg.displayName || 'V').slice(0, 2).toUpperCase(),
          colorClass: msg.role === 'seller' ? styles.chatAvatarBlue : styles.chatAvatarGray,
          text: msg.content,
          isLocal: false,
          timestamp: msg.timestamp,
          senderId: msg.senderId,
          userId: msg.userId ?? msg.senderId,
          avatarUrl: typeof msg.avatar === 'string' && msg.avatar.trim() ? msg.avatar.trim() : '',
        };
        setMessages((prev) => [...prev, newMsg]);
      } else {
        const id = `sock_${Date.now()}_${Math.random()}`;
        const newMsg = {
          id,
          sender: msg.displayName || 'Viewer',
          initials: (msg.displayName || 'V').slice(0, 2).toUpperCase(),
          colorClass: msg.role === 'seller' ? styles.chatAvatarBlue : styles.chatAvatarGray,
          text: msg.content,
          isLocal: false,
          timestamp: msg.timestamp,
          senderId: msg.senderId,
          userId: msg.userId ?? msg.senderId,
          avatarUrl: typeof msg.avatar === 'string' && msg.avatar.trim() ? msg.avatar.trim() : '',
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    };

    socketService.on('livestream_chat_message', onSocketChat);

    return () => {
      socketService.off('livestream_chat_message', onSocketChat);
    };
  }, [isLive, sessionId, user?._id]);

  // ── LiveKit DataChannel: NOT listened for incoming chat ─
  // All incoming messages are received via the Socket.IO listener above.
  // Listening on both channels would cause duplicates.
  // LiveKit is still used for sending (so viewers connected via LiveKit receive). 

  // ── Keep chat scrolled to bottom inside the panel only (no document scroll) ──
  useEffect(() => {
    if (activeTab !== 'interaction') {
      return;
    }
    const id = requestAnimationFrame(() => {
      const root = chatScrollRef.current;
      if (root) {
        root.scrollTop = root.scrollHeight;
      }
    });
    return () => cancelAnimationFrame(id);
  }, [messages, activeTab]);

  // ── Send message ───────────────────────────────────────────────
  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) {
return;
}

    // Always update local state immediately
    const localMsg = {
      id: `local_${Date.now()}`,
      sender: 'You',
      initials: 'YO',
      colorClass: styles.chatAvatarPink,
      text,
      isLocal: true,
      senderId: sellerIdRef.current,
      userId: sellerIdRef.current,
      avatarUrl: resolveUserAvatar(user),
    };

    const payloadJson = {
      type: 'chat',
      content: text,
      displayName: displayNameRef.current,
      userId: sellerIdRef.current,
      timestamp: new Date().toISOString(),
    };

    if (room) {
      try {
        const payload = new TextEncoder().encode(JSON.stringify(payloadJson));
        room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE);
      } catch {
        /* non-fatal */
      }
    }

    // Socket.IO: viewers receive + Redis history (required for buyer UI)
    socketService.emit('livestream_chat', {
      sessionId,
      content: text,
      displayName: displayNameRef.current,
      userId: sellerIdRef.current,
      role: 'seller',
      avatar: resolveUserAvatar(user) || undefined,
    });

    setMessages((prev) => [...prev, localMsg]);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.chatCard}>
        {/* Tabs */}
        <div className={styles.chatTabs}>
          <button
            className={`${styles.chatTab} ${activeTab === 'interaction' ? styles.chatTabActive : ''}`}
            onClick={() => setActiveTab('interaction')}
            type="button"
            title="Live Interaction"
          >
            {compactTabs ? 'Chat' : 'Live Interaction'}
          </button>
          <button
            className={`${styles.chatTab} ${activeTab === 'products' ? styles.chatTabActive : ''}`}
            onClick={() => setActiveTab('products')}
            type="button"
            title="Product Showcase"
          >
            {compactTabs ? 'Products' : 'Product Showcase'}
          </button>
          <button
            className={`${styles.chatTab} ${activeTab === 'vouchers' ? styles.chatTabActive : ''}`}
            onClick={() => setActiveTab('vouchers')}
            type="button"
            title="Vouchers"
          >
            {compactTabs ? 'Vouchers' : 'Vouchers'}
          </button>
          <button
            className={`${styles.chatTab} ${activeTab === 'syntax' ? styles.chatTabActive : ''}`}
            onClick={() => setActiveTab('syntax')}
            type="button"
            title="Order Syntax"
          >
            {compactTabs ? 'Orders' : 'Order Syntax'}
          </button>
        </div>

        <div className={styles.chatMainArea}>
        {/* Live Interaction: chat only (products / vouchers live on their tabs) */}
        {activeTab === 'interaction' && (
          <>
            <div className={styles.sellerChatHistoryHeader}>
              <span className={styles.sellerChatHistoryLabel}>Chat History</span>
              <button
                type="button"
                className={styles.sellerChatRefreshBtn}
                onClick={handleRefreshChat}
                disabled={refreshing || !isLive}
                title="Refresh chat history"
                aria-label="Refresh chat"
              >
                <i className={`bi bi-arrow-clockwise ${refreshing ? styles.spinning : ''}`} aria-hidden />
              </button>
            </div>

            <div className={styles.chatBody} ref={chatScrollRef}>
              {!isLive && messages.length === 0 ? (
                <div className={styles.emptyChat}>
                  <i className={`bi bi-chat-left-text ${styles.emptyChatIcon}`} />
                  <span>No messages yet. Start the stream to receive messages!</span>
                </div>
              ) : messages.length === 0 ? (
                <div className={styles.emptyChat}>
                  <i className={`bi bi-chat-left-text ${styles.emptyChatIcon}`} />
                  <span>Waiting for viewer messages...</span>
                </div>
              ) : (
                messages.map((msg) => {
                  const uid = user?._id ? String(user._id) : '';
                  const isOwn =
                    msg.isLocal ||
                    (uid !== '' &&
                      (String(msg.senderId) === uid || String(msg.userId) === uid));
                  const displaySender = isOwn ? 'You' : msg.sender;
                  const displayInitials = isOwn ? 'YO' : msg.initials;
                  const displayAvatar = isOwn ? resolveUserAvatar(user) : msg.avatarUrl;
                  const displayColor = isOwn ? styles.chatAvatarPink : msg.colorClass;
                  return (
                    <div className={styles.chatMsg} key={msg.id}>
                      <SellerChatAvatar
                        avatarUrl={displayAvatar}
                        initials={displayInitials}
                        className={`${styles.chatAvatar} ${displayColor}`}
                      />
                      <div className={styles.chatMsgContent}>
                        <div className={styles.chatSender}>{displaySender}</div>
                        <div className={styles.chatText}>{msg.text}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.chatInputRow}>
              <div className={styles.chatInputWrapper}>
                <input
                  className={styles.chatInput}
                  type="text"
                  placeholder={
                    isLive
                      ? chatStatus === 'connected'
                        ? 'Message your audience…'
                        : 'Connecting to stream…'
                      : 'Start a stream to chat with viewers…'
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!isLive}
                  maxLength={300}
                />
                <button
                  className={styles.chatSendBtn}
                  onClick={handleSend}
                  disabled={!inputValue.trim() || !isLive}
                  type="button"
                  aria-label="Send message"
                >
                  <i className="bi bi-send-fill" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Products tab */}
        {activeTab === 'products' && (
          <>
            <div className={styles.showcaseTabToolbar}>
              <span className={styles.showcaseTabTitle}>Product showcase</span>
              <button
                type="button"
                className={styles.featuredAddBtn}
                onClick={onEditProducts}
              >
                <i className={`bi bi-plus-circle-fill ${styles.featuredAddBtnIcon}`} />
                Add product
              </button>
            </div>
            <div className={styles.chatBody}>
            {liveProducts && liveProducts.length > 0 ? (
              liveProducts.map((p) => {
                const isPinned = pinnedProductId && String(p._id) === String(pinnedProductId);
                return (
                <div className={`${styles.showcaseItem} ${isPinned ? styles.showcaseItemPinned : ''}`} key={p._id}>
                  <img
                    src={p.thumbnail || p.images?.[0] || '/placeholder.png'}
                    alt={p.name}
                    className={styles.showcaseImg}
                    onError={(e) => {
 e.target.src = '/placeholder.png';
}}
                  />
                  <div className={styles.showcaseInfo}>
                    <div className={styles.showcaseName}>{p.name}</div>
                    <div className={styles.showcasePrice}>
                      {p.price != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(p.price)) : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => isPinned ? onUnpinProduct(p._id) : onPinProduct(p._id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      color: isPinned ? '#B13C36' : '#9ca3af',
                      transition: 'color 0.15s',
                    }}
                    title={isPinned ? 'Unpin' : 'Pin to viewer overlay'}
                    onMouseEnter={(e) => {
 e.currentTarget.style.color = '#B13C36';
}}
                    onMouseLeave={(e) => {
 e.currentTarget.style.color = isPinned ? '#B13C36' : '#9ca3af';
}}
                  >
                    <i className={`bi ${isPinned ? 'bi-pin-fill' : 'bi-pin'}`} style={{ fontSize: '14px' }} />
                  </button>
                  <button
                    onClick={() => onRemoveProduct(p._id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#9ca3af',
                      transition: 'color 0.15s',
                    }}
                    title="Remove from live"
                    onMouseEnter={(e) => {
 e.currentTarget.style.color = '#ef4444';
}}
                    onMouseLeave={(e) => {
 e.currentTarget.style.color = '#9ca3af';
}}
                  >
                    <i className="bi bi-x-circle-fill" style={{ fontSize: '14px' }} />
                  </button>
                </div>
                );
              })
            ) : (
              <div className={styles.emptyChat}>
                <i className={`bi bi-box-seam ${styles.emptyChatIcon}`} />
                <span>No products in showcase. Use Add product above.</span>
              </div>
            )}
            </div>
          </>
        )}

        {/* Vouchers tab */}
        {activeTab === 'vouchers' && (
          <>
            <div className={styles.showcaseTabToolbar}>
              <span className={styles.showcaseTabTitle}>Vouchers</span>
              <button
                type="button"
                className={styles.featuredAddBtnVoucher}
                onClick={onEditVouchers}
              >
                <i className={`bi bi-ticket-perforated ${styles.featuredAddBtnIcon}`} />
                Add voucher
              </button>
            </div>
            <div className={styles.chatBody}>
            {liveVouchers && liveVouchers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {liveVouchers.map((v) => (
                  <div
                    key={v._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem',
                      borderRadius: '0.5rem',
                      border: '1.5px solid #e8e8e8',
                      background: '#fff',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B13C36', fontFamily: 'monospace' }}>
                        {v.code}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '2px' }}>
                        {v.name || 'No name'}
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#333', marginTop: '2px' }}>
                        {v.discountType === 'percent' ? `${v.discountValue}% OFF` : `₫${Number(v.discountValue).toLocaleString()} OFF`}
                        {v.minBasketPrice ? ` · Min ₫${Number(v.minBasketPrice).toLocaleString()}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveVoucher && onRemoveVoucher(v._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#9ca3af',
                        transition: 'color 0.15s',
                      }}
                      title="Remove from live"
                      onMouseEnter={(e) => {
 e.currentTarget.style.color = '#ef4444'; 
}}
                      onMouseLeave={(e) => {
 e.currentTarget.style.color = '#9ca3af'; 
}}
                    >
                      <i className="bi bi-x-circle-fill" style={{ fontSize: '14px' }} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyChat}>
                <i className={`bi bi-ticket-perforated ${styles.emptyChatIcon}`} />
                <span>No vouchers in showcase. Use Add voucher above.</span>
              </div>
            )}
            </div>
          </>
        )}

        {/* Order Syntax tab — same scroll container as other tabs */}
        {activeTab === 'syntax' && (
          <div className={styles.chatBody}>
            <OrderSyntaxPanel
              sessionId={sessionId}
              isLive={isLive}
              liveProducts={liveProducts}
              pinnedProductId={pinnedProductId}
            />
          </div>
        )}
        </div>
    </div>
  );
}

// eslint-disable-next-line react/display-name
LiveChatPanel.propTypes = {
  room: PropTypes.shape({
    localParticipant: PropTypes.shape({
      publishData: PropTypes.func,
    }),
  }),
  sessionId: PropTypes.string,
  isLive: PropTypes.bool,
  liveProducts: PropTypes.arrayOf(PropTypes.object),
  pinnedProductId: PropTypes.string,
  onEditProducts: PropTypes.func,
  onRemoveProduct: PropTypes.func,
  onPinProduct: PropTypes.func,
  onUnpinProduct: PropTypes.func,
  liveVouchers: PropTypes.arrayOf(PropTypes.object),
  onEditVouchers: PropTypes.func,
  onRemoveVoucher: PropTypes.func,
};
