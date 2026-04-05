import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, Badge, Form, InputGroup, Image } from 'react-bootstrap';
import socketService from '@services/socket/socketService';
import aiChatService from '../../services/ai/aiChatService';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthToken } from '../../utils/storage';
import { formatCurrency } from '../../utils/formatters';
import styles from '@assets/styles/common/ChatWidget.module.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const SUGGESTED_QUESTIONS = [
  'Làm sao để chọn size giày chuẩn?',
  'Chính sách bảo hành như thế nào?',
  'Có những phương thức thanh toán nào?',
  'Thời gian giao hàng bao lâu?',
  'Quy trình đổi trả hàng?',
];

const ChatWidget = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeChatId, setActiveChatId] = useState('ai'); // 'ai' or conversationId

  // Real Chat State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Product Recommendation State
  const [pendingProducts, setPendingProducts] = useState({}); // Dictionary: { conversationId: productInfo[] }

  // AI Chat State
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiThinkingText, setAiThinkingText] = useState(null);
  const aiMessagesEndRef = useRef(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // WebSocket Connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const socket = socketService.connect();
      socketService.joinUserRoom(user._id);

      socket.on('receive_message', (message) => {
        if (activeConversation && message.conversationId === activeConversation?._id) {
          if (isOpen && !isMinimized) {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
          } else {
            setUnreadCount((prev) => prev + 1);
          }
        } else {
          setUnreadCount((prev) => prev + 1);
        }
        fetchConversations();
      });

      socket.on('new_message_notification', () => {
        fetchConversations();
        if (!isOpen || isMinimized) {
          setUnreadCount((prev) => prev + 1);
        }
      });

      return () => {
        socket.off('receive_message');
        socket.off('new_message_notification');
      };
    }
  }, [isAuthenticated, user, activeConversation, isOpen, isMinimized]);

  // Initial Load
  useEffect(() => {
    if (isAuthenticated && user) {
      // Load AI Messages
      aiChatService.setUserId(user._id);
      const savedAiMessages = aiChatService.loadMessages();
      if (savedAiMessages.length === 0) {
        const welcomeMsg = {
          role: 'ai',
          content: 'Chào bạn! Tôi là trợ lý AI của GZMart. Tôi có thể giúp gì cho bạn hôm nay?',
          timestamp: new Date().toISOString(),
        };
        setAiMessages([welcomeMsg]);
        aiChatService.saveMessages([welcomeMsg]);
      } else {
        setAiMessages(savedAiMessages);
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchConversations();
      if (activeChatId === 'ai') {
        scrollToBottomAi();
      } else {
        scrollToBottom();
      }
    }

    const handleOpenChatWithShop = async (event) => {
      const {
        shopId,
        productInfo,
        productInfos,
        autoSendProductMessages = false,
      } = event.detail || {};

      if (!shopId || !user?._id) {
        return;
      }

      const normalizedProductInfos = [
        ...(Array.isArray(productInfos) ? productInfos : []),
        ...(productInfo ? [productInfo] : []),
      ].filter(Boolean);

      const getParticipantId = (participant) => participant?._id || participant;

      const sendProductMessages = (conversation, products = []) => {
        if (!conversation?._id || products.length === 0) {
          return;
        }

        const receiverId =
          conversation.participants?.find((p) => String(getParticipantId(p)) !== String(user._id))
            ?._id ||
          conversation.participants?.find((p) => String(getParticipantId(p)) !== String(user._id));

        if (!receiverId) {
          return;
        }

        products.forEach((product) => {
          socketService.sendMessage({
            conversationId: conversation._id,
            sender: user._id,
            receiver: receiverId,
            type: 'product',
            productInfo: product,
          });
        });
      };

      // Mở widget ngay lập tức
      setIsOpen(true);
      setIsMinimized(false);

      try {
        // Gọi API để tìm hoặc tạo conversation với shop
        const res = await axios.post(
          `${API_URL}/api/chat/conversation`,
          {
            userId: user._id,
            shopId,
          },
          {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
          }
        );

        const conversation = res.data;

        // Cập nhật danh sách các conversation trước (chạy ngầm)
        fetchConversations();

        // Kích hoạt conversation vừa chọn bằng object trực tiếp
        handleSelectChat(conversation._id, conversation);

        // Luôn hiện product recommendation banner khi vào từ trang chi tiết sản phẩm cho ĐÚNG conversation này
        if (normalizedProductInfos.length > 0) {
          if (autoSendProductMessages) {
            sendProductMessages(conversation, normalizedProductInfos);
          } else {
            setPendingProducts((prev) => ({
              ...prev,
              [conversation._id]: normalizedProductInfos,
            }));
          }
        }
      } catch (error) {
        console.error('Error opening chat with shop:', error);
        const errMsg =
          error.response?.data?.message || 'Không thể tạo đoạn chat. Vui lòng thử lại.';
        toast.error(errMsg);
      }
    };

    window.addEventListener('openChatWithShop', handleOpenChatWithShop);

    return () => {
      window.removeEventListener('openChatWithShop', handleOpenChatWithShop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAuthenticated, user]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      setPage(1);
      setHasMore(true);
      const response = await axios.get(
        `${API_URL}/api/chat/messages/${conversationId}?page=1&limit=20`,
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );
      setMessages(response.data.messages || response.data);
      setHasMore(response.data.hasMore !== undefined ? response.data.hasMore : false);
      setLoading(false);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || !activeConversation) {
      return;
    }

    try {
      setLoadingMore(true);
      const nextPage = page + 1;

      const container = messageListRef.current;
      const prevScrollHeight = container ? container.scrollHeight : 0;

      const [response] = await Promise.all([
        axios.get(
          `${API_URL}/api/chat/messages/${activeConversation._id}?page=${nextPage}&limit=20`,
          {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
          }
        ),
        new Promise((resolve) => setTimeout(resolve, 1500)), // Fake delay for smooth UI
      ]);

      const newMessages = response.data.messages || [];
      if (newMessages.length > 0) {
        setMessages((prev) => [...newMessages, ...prev]);
        setPage(nextPage);
        setHasMore(response.data.hasMore);

        setTimeout(() => {
          if (messageListRef.current) {
            messageListRef.current.scrollTop =
              messageListRef.current.scrollHeight - prevScrollHeight;
          }
        }, 0);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && activeChatId !== 'ai') {
      loadMoreMessages();
    }
  };

  const handleSelectChat = (id, convObj = null) => {
    setActiveChatId(id);
    if (id === 'ai') {
      setActiveConversation(null);
      scrollToBottomAi();
    } else {
      const conv = convObj || conversations.find((c) => c._id === id);
      if (conv) {
        setActiveConversation(conv);
        socketService.joinConversation(conv._id);
        fetchMessages(conv._id);
      }
    }
  };

  // --- Real Chat Logic ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) {
      return;
    }

    const receiverId =
      activeConversation.participants.find((p) => (p._id || p) !== user._id)?._id ||
      activeConversation.participants.find((p) => (p._id || p) !== user._id);

    // GỬI SẢN PHẨM TRƯỚC NẾU CÓ TRONG CONVERSATION NÀY
    const currentPendingProducts = pendingProducts[activeConversation._id] || [];
    if (currentPendingProducts.length > 0) {
      currentPendingProducts.forEach((product) => {
        const productMessage = {
          conversationId: activeConversation._id,
          sender: user._id,
          receiver: receiverId,
          type: 'product',
          productInfo: product,
        };
        socketService.sendMessage(productMessage);
      });

      // Clear pending product cho conversation này
      setPendingProducts((prev) => {
        const newState = { ...prev };
        delete newState[activeConversation._id];
        return newState;
      });
    }

    // XONG RỒI GỬI TIN NHẮN CHỮ BÌNH THƯỜNG
    const messageData = {
      conversationId: activeConversation._id,
      sender: user._id,
      receiver: receiverId,
      content: newMessage.trim(),
    };

    socketService.sendMessage(messageData);
    setNewMessage('');
    scrollToBottom();
  };

  // --- AI Chat Logic ---
  const CLEAR_CHAT_PATTERNS = [
    'làm mới',
    'lam moi',
    'clear',
    'reset',
    'xóa chat',
    'xoa chat',
    'bắt đầu lại',
    'bat dau lai',
    'new chat',
    'chat mới',
    'refresh',
    'xóa hội thoại',
    'xoa hoi thoai',
  ];

  const handleSendAiMessage = async (e, forcedContent = null) => {
    if (e) {
      e.preventDefault();
    }
    const contentToSend = forcedContent || aiInput;
    if (!contentToSend.trim()) {
      return;
    }

    const lower = contentToSend.trim().toLowerCase();
    if (CLEAR_CHAT_PATTERNS.some((p) => lower === p || lower === `${p} chat`)) {
      setAiInput('');
      handleClearAiChat();
      return;
    }

    const userMsg = { role: 'user', content: contentToSend, timestamp: new Date().toISOString() };
    const newMessages = [...aiMessages, userMsg];

    setAiMessages(newMessages);
    aiChatService.saveMessages(newMessages);
    setAiInput('');
    setIsAiTyping(true);
    scrollToBottomAi();

    // Streaming placeholder
    const tempAiMsgId = Date.now();
    const tempAiMsg = {
      role: 'ai',
      content: '',
      timestamp: new Date().toISOString(),
      id: tempAiMsgId,
      isStreaming: true,
    };
    setAiMessages((prev) => [...prev, tempAiMsg]);

    await aiChatService.sendMessage(
      userMsg.content,
      (chunk) => {
        setAiThinkingText(null);
        setAiMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAiMsgId ? { ...msg, content: msg.content + chunk } : msg
          )
        );
        scrollToBottomAi();
      },
      (finalContent, finalData) => {
        setIsAiTyping(false);
        setAiThinkingText(null);
        const productMap = {};
        if (finalData?.products?.length > 0) {
          finalData.products.forEach((p) => {
            productMap[p._id] = p;
          });
        }
        setAiMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === tempAiMsgId
              ? { ...msg, content: finalContent, isStreaming: false, products: productMap }
              : msg
          );
          aiChatService.saveMessages(updated);
          return updated;
        });
      },
      (_error) => {
        setIsAiTyping(false);
        setAiThinkingText(null);
        const errorMsg = {
          role: 'ai',
          content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.',
          timestamp: new Date().toISOString(),
        };
        setAiMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== tempAiMsgId);
          const updated = [...filtered, errorMsg];
          aiChatService.saveMessages(updated);
          return updated;
        });
      },
      newMessages,
      (thinkingMsg) => {
        setAiThinkingText(thinkingMsg);
        scrollToBottomAi();
      }
    );
  };

  const handleClearAiChat = () => {
    aiChatService.clearMessages();
    const welcomeMsg = {
      role: 'ai',
      content: 'Chào bạn! Tôi là trợ lý AI của GZMart. Tôi có thể giúp gì cho bạn hôm nay?',
      timestamp: new Date().toISOString(),
    };
    setAiMessages([welcomeMsg]);
    aiChatService.saveMessages([welcomeMsg]);
  };

  const cleanProductText = (text) =>
    text
      .replace(/\[\[product:[^\]]*\]?\]?/gi, '')
      .split('\n')
      .filter((line) => {
        const l = line.trim().toLowerCase().replace(/\*/g, '');
        if (!l) {
          return true;
        }
        if (/^-?\s*(giá|price)\s*:/i.test(l)) {
          return false;
        }
        if (/^-?\s*(đánh giá|rating)\s*:/i.test(l)) {
          return false;
        }
        if (/^-?\s*(đã bán|lượt bán|sold)\s*:/i.test(l)) {
          return false;
        }
        if (/^-?\s*(danh mục|category)\s*:/i.test(l)) {
          return false;
        }
        if (/^-?\s*(thương hiệu|brand)\s*:/i.test(l)) {
          return false;
        }
        if (/^-?\s*(đánh giá)\s*:?\s*⭐/i.test(l)) {
          return false;
        }
        if (/^\d+[.,]\d+\s*(đ|₫|vnd)/i.test(l)) {
          return false;
        }
        if (/^⭐\s*\d/i.test(l)) {
          return false;
        }
        return true;
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\*\*/g, '')
      .trim();

  const renderAiContent = (msg) => {
    const { content, isStreaming, products } = msg;
    if (!content) {
      return null;
    }

    if (isStreaming) {
      const cleanText = content.replace(/\[\[product:[a-f0-9]{24}\]\]/gi, '');
      return <div style={{ whiteSpace: 'pre-wrap' }}>{cleanText}</div>;
    }

    const productMap = products || {};
    const parts = content.split(/(\[\[product:[a-f0-9]{24}\]\])/gi);

    const rendered = parts.map((part, i) => {
      const match = part.match(/\[\[product:([a-f0-9]{24})\]\]/i);
      if (match) {
        const product = productMap[match[1]];
        if (!product) {
          return null;
        }
        return (
          <div
            key={i}
            className={styles['ai-product-card']}
            onClick={() => navigate(`/product/${product._id}`)}
            role="button"
            title="Xem chi tiết sản phẩm"
          >
            {product.dealLabel && (
              <div className={styles['ai-product-deal-badge']}>{product.dealLabel}</div>
            )}
            <img
              src={product.image || 'https://via.placeholder.com/80'}
              alt={product.name}
              className={styles['ai-product-image']}
            />
            <div className={styles['ai-product-info']}>
              <div className={styles['ai-product-name']}>{product.name}</div>
              <div className={styles['ai-product-price']}>
                {product.price?.toLocaleString('vi-VN')}₫
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className={styles['ai-product-price-original']}>
                    {product.originalPrice.toLocaleString('vi-VN')}₫
                  </span>
                )}
                {product.maxPrice && (
                  <span className={styles['ai-product-price-max']}>
                    {' '}
                    – {product.maxPrice.toLocaleString('vi-VN')}₫
                  </span>
                )}
              </div>
              <div className={styles['ai-product-meta']}>
                <span>⭐ {product.rating}/5</span>
                <span>|</span>
                <span>Đã bán {product.sold}</span>
              </div>
            </div>
            <div className={styles['ai-product-arrow']}>
              <i className="bi bi-chevron-right"></i>
            </div>
          </div>
        );
      }
      const cleaned = cleanProductText(part);
      if (!cleaned) {
        return null;
      }
      return <span key={i}>{cleaned}</span>;
    });

    return <div style={{ whiteSpace: 'pre-wrap' }}>{rendered}</div>;
  };

  const scrollToBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  const scrollToBottomAi = () =>
    setTimeout(() => aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  // Product Card component for rendering in messages
  const ProductMessageCard = ({ productInfo, isClickable = true }) => (
    <div
      className={styles['product-message-card']}
      onClick={() => isClickable && navigate(`/product/${productInfo.productId}`)}
      role={isClickable ? 'button' : undefined}
      title="Nhấn để xem sản phẩm"
    >
      <div className={styles['product-message-card-content']}>
        <img src={productInfo.image} alt={productInfo.name} />
        <div className={styles['product-message-info']}>
          <div className={styles['product-message-name']}>{productInfo.name}</div>
          <div className={styles['product-message-price']}>
            {formatCurrency(productInfo.price)}
            {productInfo.originalPrice && productInfo.originalPrice > productInfo.price && (
              <span className={styles['product-message-original-price']}>
                {formatCurrency(productInfo.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className={styles['product-message-action']}>
        <button
          className={`btn btn-sm ${styles['product-btn-cart']}`}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/product/${productInfo.productId}`);
          }}
        >
          <i className="bi bi-cart-plus mb-1" style={{ fontSize: '1.2rem' }}></i>
        </button>
        <button
          className={`btn btn-primary btn-sm flex-grow-1 ${styles['product-btn-buy']}`}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/product/${productInfo.productId}`);
          }}
        >
          Mua ngay
        </button>
      </div>
    </div>
  );

  ProductMessageCard.propTypes = {
    productInfo: PropTypes.shape({
      productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      image: PropTypes.string,
      name: PropTypes.string,
      price: PropTypes.number,
      originalPrice: PropTypes.number,
    }).isRequired,
    isClickable: PropTypes.bool,
  };

  const filteredConversations = conversations.filter((c) => {
    const otherUser = c.participants.find((p) => p._id !== user._id);
    return otherUser?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const toggleOptions = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
    setIsMinimized(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles['chat-widget-container']}>
      {/* Floating Button */}
      {!isOpen && (
        <div className={styles['chat-widget-button']} onClick={toggleOptions}>
          <div className={styles['chat-widget-toggle']}>
            <i className="bi bi-chat-dots-fill"></i>
          </div>
          {unreadCount > 0 && (
            <Badge bg="danger" pill className={styles['chat-widget-badge']}>
              {unreadCount}
            </Badge>
          )}
        </div>
      )}

      {/* Main Drawer Window */}
      {isOpen && (
        <div
          className={`${styles['chat-widget-drawer']} ${isMinimized ? styles['minimized'] : ''}`}
        >
          {/* Gradient Header */}
          <div className={styles['chat-widget-header']}>
            <div className={styles['chat-widget-title']}>
              <i className="bi bi-chat-text-fill fs-5"></i>
              <span>Chat Support</span>
            </div>
            <div className={styles['chat-widget-actions']}>
              {!isMinimized && (
                <button
                  className={styles['chat-widget-action-btn']}
                  onClick={() => setIsMinimized(true)}
                >
                  <i className="bi bi-dash-lg"></i>
                </button>
              )}
              {isMinimized && (
                <button
                  className={styles['chat-widget-action-btn']}
                  onClick={() => setIsMinimized(false)}
                >
                  <i className="bi bi-plus-lg"></i>
                </button>
              )}
              <button className={styles['chat-widget-action-btn']} onClick={toggleOptions}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* Content Area */}
          {!isMinimized && (
            <div className={styles['chat-widget-content']}>
              {/* Sidebar */}
              <div className={`${styles['chat-sidebar']} ${styles['custom-scrollbar']}`}>
                <div className={styles['sidebar-search']}>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-light border-end-0 text-muted">
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search chats..."
                      className="bg-light border-start-0"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ boxShadow: 'none', border: '1px solid #ced4da' }}
                    />
                  </InputGroup>
                </div>

                <div className={styles['sidebar-list']}>
                  {/* AI Item */}
                  <div
                    className={`${styles['sidebar-item']} ${activeChatId === 'ai' ? styles['active'] : ''}`}
                    onClick={() => handleSelectChat('ai')}
                  >
                    <div className="me-3 position-relative">
                      <div
                        className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
                        style={{ width: 40, height: 40 }}
                      >
                        <i className="bi bi-robot fs-5"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h6 className="mb-0 text-truncate fw-bold" style={{ fontSize: '0.9rem' }}>
                          AI Consultant
                        </h6>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                          Now
                        </small>
                      </div>
                      <p className="mb-0 text-muted small text-truncate">How can I help you?</p>
                    </div>
                  </div>

                  {/* Conversation Items */}
                  {filteredConversations.map((conv) => {
                    const otherUser = conv.participants.find((p) => p._id !== user._id);
                    return (
                      <div
                        key={conv._id}
                        className={`${styles['sidebar-item']} ${activeChatId === conv._id ? styles['active'] : ''}`}
                        onClick={() => handleSelectChat(conv._id)}
                      >
                        <div className="me-3 position-relative">
                          <Image
                            src={otherUser?.avatar || 'https://via.placeholder.com/40'}
                            roundedCircle
                            width={40}
                            height={40}
                            className="border"
                          />
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <h6
                              className="mb-0 text-truncate fw-bold"
                              style={{ fontSize: '0.9rem' }}
                            >
                              {otherUser?.fullName || 'User'}
                            </h6>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                              {new Date(conv.lastUpdated).toLocaleDateString()}
                            </small>
                          </div>
                          <p className="mb-0 text-muted small text-truncate">
                            {conv.lastMessage || 'No messages'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Chat Area */}
              <div className={styles['chat-main']}>
                {/* Pinned Product Banner */}
                {(() => {
                  const pinnedProduct =
                    activeConversation && activeChatId !== 'ai'
                      ? [...messages].reverse().find((m) => m.type === 'product')?.productInfo
                      : null;

                  if (!pinnedProduct) {
                    return null;
                  }
                  return (
                    <div className={styles['pinned-product-banner']}>
                      <img
                        src={pinnedProduct.image}
                        alt={pinnedProduct.name}
                        className={styles['pinned-product-image']}
                      />
                      <div className={styles['pinned-product-info']}>
                        <div className={styles['pinned-product-name']} title={pinnedProduct.name}>
                          {pinnedProduct.name}
                        </div>
                        <div className={styles['pinned-product-tags']}>
                          <span className={styles['tag-orange']}>
                            <i className="bi bi-chat-text-fill"></i> Đã hỏi
                          </span>
                          <span className="text-primary fw-medium" style={{ fontSize: '0.6rem' }}>
                            Sản phẩm Shop
                          </span>
                        </div>
                        <div className={styles['pinned-product-bottom']}>
                          <div className={styles['pinned-product-price-row']}>
                            <span className={styles['pinned-product-price']}>
                              {formatCurrency(pinnedProduct.price)}
                            </span>
                            {pinnedProduct.originalPrice &&
                              pinnedProduct.originalPrice > pinnedProduct.price && (
                                <span className={styles['pinned-product-original-price']}>
                                  {formatCurrency(pinnedProduct.originalPrice)}
                                </span>
                              )}
                          </div>
                          <button
                            className={styles['btn-buy-now']}
                            onClick={() => navigate(`/product/${pinnedProduct.productId}`)}
                          >
                            Mua ngay
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Chat Messages */}
                <div
                  className={`${styles['chat-messages']} ${styles['custom-scrollbar']}`}
                  ref={activeChatId !== 'ai' ? messageListRef : null}
                  onScroll={handleScroll}
                >
                  {activeChatId === 'ai' ? (
                    <>
                      {aiMessages.length > 1 && (
                        <div className="d-flex justify-content-end mb-2 px-2">
                          <button
                            className="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center gap-1"
                            style={{ fontSize: '0.75rem', padding: '2px 10px' }}
                            onClick={handleClearAiChat}
                            title="Làm mới cuộc trò chuyện"
                          >
                            <i className="bi bi-arrow-counterclockwise"></i>
                            Làm mới
                          </button>
                        </div>
                      )}
                      {aiMessages.length <= 1 && (
                        <div className="mb-4">
                          <div className="d-flex align-items-center mb-3 text-primary">
                            <i className="bi bi-lightbulb-fill me-2"></i>
                            <small className="fw-bold">Gợi ý câu hỏi:</small>
                          </div>
                          <div className="d-flex flex-column gap-2">
                            {SUGGESTED_QUESTIONS.map((q, idx) => (
                              <Button
                                key={idx}
                                variant="outline-primary"
                                size="sm"
                                className="text-start rounded-3 border-primary-subtle bg-white text-primary py-2"
                                onClick={() => handleSendAiMessage(null, q)}
                                style={{ fontSize: '0.85rem' }}
                              >
                                {q}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiMessages
                        .filter((msg) => !(msg.isStreaming && !msg.content))
                        .map((msg, idx) => (
                          <div
                            key={idx}
                            className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                          >
                            {msg.role === 'ai' && (
                              <div className="me-2 d-flex align-items-end">
                                <div
                                  className="rounded-circle bg-white text-primary shadow-sm d-flex align-items-center justify-content-center"
                                  style={{ width: 28, height: 28 }}
                                >
                                  <i className="bi bi-robot" style={{ fontSize: '0.9rem' }}></i>
                                </div>
                              </div>
                            )}
                            <div
                              className={`${styles['message-bubble']} ${msg.role === 'user' ? styles['message-user'] : styles['message-other']}`}
                            >
                              {msg.role === 'ai' ? (
                                renderAiContent(msg)
                              ) : (
                                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      {isAiTyping && !aiMessages.some((m) => m.isStreaming && m.content) && (
                        <div className="d-flex mb-3 justify-content-start">
                          <div className="me-2 d-flex align-items-end">
                            <div
                              className="rounded-circle bg-white text-primary shadow-sm d-flex align-items-center justify-content-center"
                              style={{ width: 28, height: 28 }}
                            >
                              <i className="bi bi-robot" style={{ fontSize: '0.9rem' }}></i>
                            </div>
                          </div>
                          {aiThinkingText ? (
                            <div className={styles['thinking-indicator']}>
                              <div className={styles['thinking-spinner']}></div>
                              <span>{aiThinkingText}</span>
                            </div>
                          ) : (
                            <div className={styles['typing-indicator']}>
                              <span className={styles['typing-dot']}></span>
                              <span className={styles['typing-dot']}></span>
                              <span className={styles['typing-dot']}></span>
                            </div>
                          )}
                        </div>
                      )}
                      <div ref={aiMessagesEndRef} />
                    </>
                  ) : (
                    <>
                      {loading ? (
                        <div className="text-center mt-5 text-muted">Loading...</div>
                      ) : messages.length === 0 ? (
                        <div className="text-center mt-auto mb-auto text-muted">
                          <i className="bi bi-chat-square-dots fs-1 opacity-25"></i>
                          <p className="mt-2 text-dark">Bắt đầu cuộc trò chuyện</p>
                        </div>
                      ) : (
                        <div className="w-100 d-flex flex-column justify-content-end flex-grow-1">
                          {loadingMore && (
                            <div className="text-center my-2">
                              <div className="spinner-border spinner-border-sm text-primary"></div>
                            </div>
                          )}
                          {messages.map((msg, idx) => {
                            const isMe = msg.sender._id === user._id || msg.sender === user._id;
                            return (
                              <div
                                key={idx}
                                className={`d-flex mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}
                              >
                                {!isMe && (
                                  <div className="me-2 d-flex align-items-end">
                                    <Image
                                      src={
                                        msg.sender?.avatar ||
                                        activeConversation?.participants?.find(
                                          (p) => p._id !== user._id
                                        )?.avatar ||
                                        'https://via.placeholder.com/28'
                                      }
                                      roundedCircle
                                      width={28}
                                      height={28}
                                      className="border bg-white"
                                    />
                                  </div>
                                )}
                                <div
                                  className={`${styles['message-bubble']} ${isMe ? styles['message-user'] : styles['message-other']} ${msg.type === 'product' && msg.productInfo ? styles['message-bubble-product'] : ''}`}
                                >
                                  {msg.type === 'product' && msg.productInfo ? (
                                    <ProductMessageCard productInfo={msg.productInfo} />
                                  ) : (
                                    <div>{msg.content}</div>
                                  )}
                                  <div
                                    className={`text-end mt-1 ${isMe && msg.type !== 'product' ? 'text-white-50' : 'text-muted'}`}
                                    style={{ fontSize: '0.65rem' }}
                                  >
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Pending Product to Send - OUTSIDE scroll container */}
                {activeConversation &&
                  activeChatId !== 'ai' &&
                  pendingProducts[activeConversation._id] && (
                    <div className={styles['pending-product-wrapper']}>
                      <div className={styles['pending-product-header']}>
                        <span className={styles['pending-product-title']}>
                          Bạn đang trao đổi với Người bán về sản phẩm này
                        </span>
                        <button
                          type="button"
                          className="btn-close shadow-none"
                          style={{ fontSize: '0.6rem', opacity: 0.5 }}
                          onClick={() => {
                            setPendingProducts((prev) => {
                              const newState = { ...prev };
                              delete newState[activeConversation._id];
                              return newState;
                            });
                          }}
                        ></button>
                      </div>
                      <div className={styles['pending-product-card']}>
                        <img
                          src={pendingProducts[activeConversation._id].image}
                          alt={pendingProducts[activeConversation._id].name}
                          className={styles['pending-product-image']}
                        />
                        <div className={styles['pending-product-info']}>
                          <div className={styles['pending-product-name']}>
                            {pendingProducts[activeConversation._id].name}
                          </div>
                          <div className={styles['pending-product-price-row']}>
                            <span className={styles['pending-product-price']}>
                              {formatCurrency(pendingProducts[activeConversation._id].price)}
                            </span>
                            {pendingProducts[activeConversation._id].originalPrice &&
                              pendingProducts[activeConversation._id].originalPrice >
                                pendingProducts[activeConversation._id].price && (
                                <span className={styles['pending-product-original-price']}>
                                  {formatCurrency(
                                    pendingProducts[activeConversation._id].originalPrice
                                  )}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Input Area - OUTSIDE scroll container, always visible */}
                <div className={styles['chat-input-area']}>
                  <Form
                    onSubmit={
                      activeChatId === 'ai' ? (e) => handleSendAiMessage(e) : handleSendMessage
                    }
                  >
                    <div className="d-flex align-items-center gap-2">
                      <Form.Control
                        type="text"
                        placeholder={activeChatId === 'ai' ? 'Hỏi AI trợ lý...' : 'Aa'}
                        value={activeChatId === 'ai' ? aiInput : newMessage}
                        onChange={(e) =>
                          activeChatId === 'ai'
                            ? setAiInput(e.target.value)
                            : setNewMessage(e.target.value)
                        }
                        className={styles['chat-input-field']}
                        disabled={activeChatId === 'ai' && isAiTyping}
                      />
                      <button
                        type="submit"
                        className={styles['chat-send-btn']}
                        disabled={
                          activeChatId === 'ai' ? !aiInput.trim() || isAiTyping : !newMessage.trim()
                        }
                      >
                        <i className="bi bi-send-fill" style={{ fontSize: '0.95rem' }}></i>
                      </button>
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
