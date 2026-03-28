import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { DataPacket_Kind } from 'livekit-client';
import livestreamService from '@services/api/livestreamService';
import socketService from '@services/socket/socketService';
import styles from '@pages/seller/LiveStreamPage.module.css';
import OrderSyntaxPanel from './OrderSyntaxPanel';

// Chat message topic for LiveKit DataChannel
const CHAT_TOPIC = 'lk-chat';

export default function LiveChatPanel({ room, sessionId, isLive, form, liveProducts = [], pinnedProductId = null, onEditProducts, onRemoveProduct, onPinProduct, onUnpinProduct, liveVouchers = [], onEditVouchers, onRemoveVoucher }) {
  const [activeTab, setActiveTab] = useState('interaction');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [chatStatus, setChatStatus] = useState('idle'); // idle | connecting | connected | error
  const chatEndRef = useRef(null);
  const user = useSelector((state) => state.auth?.user);
  const sellerIdRef = useRef(user?._id || 'seller_self');
  const displayNameRef = useRef(user?.fullName || 'Seller');

  // Sync user into refs whenever auth state changes
  useEffect(() => {
    sellerIdRef.current = user?._id || 'seller_self';
    displayNameRef.current = user?.fullName || 'Seller';
  }, [user]);

  // ── Fetch chat history from REST API ────────────────────────────
  useEffect(() => {
    if (!isLive || !sessionId) return;

    livestreamService
      .getSessionMessages(sessionId)
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : res?.data?.data;
        if (list?.length) {
          setMessages(
            list.map((m) => ({
              id: m.id || m._id || String(Math.random()),
              sender: m.displayName || m.userId || 'Viewer',
              initials: (m.displayName || 'V').slice(0, 2).toUpperCase(),
              colorClass: m.role === 'host' || m.role === 'seller' ? styles.chatAvatarBlue : styles.chatAvatarGray,
              text: m.content,
              isLocal: false,
            }))
          );
        }
      })
      .catch(() => {
        // Silently ignore — chat history is optional
      });
  }, [isLive, sessionId]);

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
    if (!isLive || !sessionId || !user?._id) return;

    socketService.connect(user._id);
    socketService.emit('livestream_join', {
      sessionId,
      displayName: displayNameRef.current,
    });

    const onSocketChat = (msg) => {
      if (!msg?.content || msg.sessionId !== sessionId) return;
      // Skip own messages (already added optimistically via localMsg)
      const sid = String(sellerIdRef.current);
      if (String(msg.senderId) === sid || String(msg.userId) === sid) return;
      // Deduplicate by server-generated message id
      if (msg.id) {
        setMessages((prev) => {
          if (prev.some((p) => p.id === msg.id)) return prev;
          return [
            ...prev,
            {
              id: msg.id,
              sender: msg.displayName || 'Viewer',
              initials: (msg.displayName || 'V').slice(0, 2).toUpperCase(),
              colorClass: msg.role === 'seller' ? styles.chatAvatarBlue : styles.chatAvatarGray,
              text: msg.content,
              isLocal: false,
              timestamp: msg.timestamp,
              senderId: msg.senderId,
            },
          ];
        });
      } else {
        setMessages((prev) => [...prev, {
          id: `sock_${Date.now()}`,
          sender: msg.displayName || 'Viewer',
          initials: (msg.displayName || 'V').slice(0, 2).toUpperCase(),
          colorClass: msg.role === 'seller' ? styles.chatAvatarBlue : styles.chatAvatarGray,
          text: msg.content,
          isLocal: false,
          timestamp: msg.timestamp,
          senderId: msg.senderId,
        }]);
      }
    };

    socketService.on('livestream_chat_message', onSocketChat);

    return () => {
      socketService.off('livestream_chat_message', onSocketChat);
      socketService.emit('livestream_leave', { sessionId });
    };
  }, [isLive, sessionId, user?._id]);

  // ── LiveKit DataChannel: NOT listened for incoming chat ─
  // All incoming messages are received via the Socket.IO listener above.
  // Listening on both channels would cause duplicates.
  // LiveKit is still used for sending (so viewers connected via LiveKit receive). 

  // ── Auto-scroll to bottom ─────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────
  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    // Always update local state immediately
    const localMsg = {
      id: `local_${Date.now()}`,
      sender: 'You',
      initials: 'YO',
      colorClass: styles.chatAvatarPink,
      text,
      isLocal: true,
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
    <div className={styles.rightColumn}>
      <div className={styles.chatCard}>
        {/* Tabs */}
        <div className={styles.chatTabs}>
          <button
            className={`${styles.chatTab} ${activeTab === 'interaction' ? styles.chatTabActive : ''}`}
            onClick={() => setActiveTab('interaction')}
            type="button"
          >
            Live Interaction
          </button>
          <button
            className={`${styles.chatTab} ${activeTab === 'products' ? styles.chatTabActive : ''}`}
            onClick={() => setActiveTab('products')}
            type="button"
          >
            Product Showcase
          </button>
          <button
            className={`${styles.chatTab} ${activeTab === 'vouchers' ? styles.chatTabActive : ''}`}
            onClick={() => setActiveTab('vouchers')}
            type="button"
          >
            Vouchers
          </button>
          <button
            className={`${styles.chatTab} ${activeTab === 'syntax' ? styles.chatTabActive : ''}`}
            onClick={() => setActiveTab('syntax')}
            type="button"
          >
            Order Syntax
          </button>
        </div>

        <div className={styles.chatMainArea}>
        {/* Live Interaction: messages + featured queue + composer (other tabs use full height) */}
        {activeTab === 'interaction' && (
          <>
            <div className={styles.chatBody}>
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
                messages.map((msg) => (
                  <div className={styles.chatMsg} key={msg.id}>
                    <div className={`${styles.chatAvatar} ${msg.colorClass}`}>
                      {msg.initials}
                    </div>
                    <div className={styles.chatMsgContent}>
                      <div className={styles.chatSender}>{msg.sender}</div>
                      <div className={styles.chatText}>{msg.text}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div className={styles.featuredSection}>
              <div className={styles.featuredHeader}>
                <span className={styles.featuredTitle}>Featured queue</span>
                <div className={styles.featuredActions}>
                  <button
                    className={styles.featuredAddBtn}
                    type="button"
                    onClick={onEditProducts}
                  >
                    <i className={`bi bi-plus-circle-fill ${styles.featuredAddBtnIcon}`} />
                    Add product
                  </button>
                  <button
                    className={styles.featuredAddBtnVoucher}
                    type="button"
                    onClick={onEditVouchers}
                  >
                    <i className={`bi bi-ticket-perforated ${styles.featuredAddBtnIcon}`} />
                    Add voucher
                  </button>
                </div>
              </div>
              <div className={styles.featuredList}>
                {liveProducts && liveProducts.length > 0 ? (
                  liveProducts.map((p) => {
                    const isPinned = pinnedProductId && String(p._id) === String(pinnedProductId);
                    return (
                    <div
                      className={`${styles.featuredItem} ${isPinned ? styles.featuredItemPinned : ''}`}
                      key={p._id}
                    >
                      <img
                        src={p.thumbnail || p.images?.[0] || '/placeholder.png'}
                        alt={p.name}
                        className={styles.featuredImg}
                        onError={(e) => { e.target.src = '/placeholder.png'; }}
                      />
                      <div className={styles.featuredInfo}>
                        <div className={styles.featuredName}>{p.name}</div>
                        <div className={styles.featuredPrice}>
                          {p.price != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(p.price)) : ''}
                        </div>
                      </div>
                      <div className={styles.featuredItemActions}>
                        <button
                          type="button"
                          className={styles.featuredIconBtn}
                          onClick={() => (isPinned ? onUnpinProduct(p._id) : onPinProduct(p._id))}
                          title={isPinned ? 'Unpin' : 'Pin to viewer overlay'}
                          aria-label={isPinned ? 'Unpin product' : 'Pin product'}
                        >
                          <i className={`bi ${isPinned ? 'bi-pin-fill' : 'bi-pin'} ${styles.featuredIconBtnGlyph}`} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.featuredIconBtn} ${styles.featuredIconBtnDanger}`}
                          onClick={() => onRemoveProduct(p._id)}
                          title="Remove from live"
                          aria-label="Remove product"
                        >
                          <i className={`bi bi-x-lg ${styles.featuredIconBtnGlyph}`} />
                        </button>
                      </div>
                    </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyChat}>
                    <i className={`bi bi-inbox ${styles.emptyChatIcon}`} />
                    <span className={styles.featuredEmptyText}>No featured products yet.</span>
                  </div>
                )}
              </div>
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
                    onError={(e) => { e.target.src = '/placeholder.png'; }}
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
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#B13C36'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = isPinned ? '#B13C36' : '#9ca3af'; }}
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
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
                  >
                    <i className="bi bi-x-circle-fill" style={{ fontSize: '14px' }} />
                  </button>
                </div>
                );
              })
            ) : (
              <div className={styles.emptyChat}>
                <i className={`bi bi-box-seam ${styles.emptyChatIcon}`} />
                <span>No products in showcase. Add products to your stream!</span>
              </div>
            )}
          </div>
        )}

        {/* Vouchers tab */}
        {activeTab === 'vouchers' && (
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
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
                    >
                      <i className="bi bi-x-circle-fill" style={{ fontSize: '14px' }} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyChat}>
                <i className={`bi bi-ticket-perforated ${styles.emptyChatIcon}`} />
                <span>No vouchers in showcase. Add vouchers to your stream!</span>
              </div>
            )}
          </div>
        )}

        {/* Order Syntax tab — same scroll container as other tabs */}
        {activeTab === 'syntax' && (
          <div className={styles.chatBody}>
            <OrderSyntaxPanel sessionId={sessionId} isLive={isLive} liveProducts={liveProducts} />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
