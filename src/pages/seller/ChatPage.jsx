import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Row, Col, ListGroup, Form, Button, Image, InputGroup } from 'react-bootstrap';
import socketService from '@services/socket/socketService';
import axios from 'axios';
import AutoReplyModal from '../../components/seller/AutoReplyModal';
import { getAuthToken } from '../../utils/storage';
import '@assets/styles/common/ChatPage.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const ChatPage = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showAutoReplyModal, setShowAutoReplyModal] = useState(false);
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);

  useEffect(() => {
    if (user) {
      const socket = socketService.connect();
      socketService.joinUserRoom(user._id);

      // Load initial conversations
      fetchConversations();

      socket.on('receive_message', (message) => {
        if (activeConversation && message.conversationId === activeConversation._id) {
          setMessages((prev) => [...prev, message]);
          scrollToBottom();
        }
        fetchConversations();
      });

      socket.on('new_message_notification', () => {
        fetchConversations();
      });

      return () => {
        socket.off('receive_message');
        socket.off('new_message_notification');
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchConversations triggers on mount
  }, [user, activeConversation]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const convList = response.data;
      setConversations(convList);

      // Auto-select conversation if navigated from Orders page
      const targetId = location.state?.conversationId;
      if (targetId && !activeConversation) {
        const target = convList.find((c) => c._id === targetId);
        if (target) {
          handleSelectConversation(target);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleSelectConversation = async (conv) => {
    setActiveConversation(conv);
    socketService.joinConversation(conv._id);
    setPage(1);
    setHasMore(true);

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/chat/messages/${conv._id}?page=1&limit=20`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
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

      // Save current scroll height to maintain position later
      const container = messageListRef.current;
      const prevScrollHeight = container ? container.scrollHeight : 0;

      const [response] = await Promise.all([
        axios.get(
          `${API_URL}/api/chat/messages/${activeConversation._id}?page=${nextPage}&limit=20`,
          {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
          }
        ),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      const newMessages = response.data.messages || [];
      if (newMessages.length > 0) {
        setMessages((prev) => [...newMessages, ...prev]);
        setPage(nextPage);
        setHasMore(response.data.hasMore);

        // Restore scroll position so user doesn't jump to the top
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
    if (e.target.scrollTop === 0) {
      loadMoreMessages();
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) {
      return;
    }

    const receiverId = activeConversation.participants.find((p) => p._id !== user._id)?._id;

    const messageData = {
      conversationId: activeConversation._id,
      sender: user._id,
      receiver: receiverId,
      content: newMessage,
    };

    socketService.sendMessage(messageData);
    setNewMessage('');
  };

  const scrollToBottom = () => {
    // Timeout to allow render
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <Container fluid className="chat-page-container">
      <Row className="chat-wrapper-card">
        {/* Sidebar: Conversations List */}
        <Col md={4} lg={3} className="conversation-sidebar d-flex flex-column h-100 p-0">
          <div className="p-3 conversation-sidebar-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-dark">Tin nhắn</h5>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowAutoReplyModal(true)}
              title="Cài đặt trả lời tự động"
            >
              <i className="bi bi-gear me-1"></i> Auto-Reply
            </Button>
          </div>
          <ListGroup variant="flush" className="overflow-auto flex-grow-1">
            {conversations.map((conv) => {
              const otherUser = conv.participants.find((p) => p._id !== user._id);
              return (
                <ListGroup.Item
                  key={conv._id}
                  action
                  active={activeConversation?._id === conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className="d-flex align-items-center p-3 border-bottom"
                >
                  <div className="position-relative me-3">
                    <Image
                      src={otherUser?.avatar || 'https://via.placeholder.com/40'}
                      roundedCircle
                      width={48}
                      height={48}
                    />
                    {/* Online status indicator could go here */}
                  </div>
                  <div className="flex-grow-1 overflow-hidden">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h6 className="mb-0 text-truncate">{otherUser?.fullName || 'User'}</h6>
                      <small className="text-muted">
                        {new Date(conv.lastUpdated).toLocaleDateString()}
                      </small>
                    </div>
                    <p className="mb-0 text-muted small text-truncate">
                      {conv.lastMessage || <i>No messages yet</i>}
                    </p>
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Col>

        {/* Chat Area */}
        <Col
          md={8}
          lg={9}
          className="chat-main-area d-flex flex-column h-100 p-0 position-relative"
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 chat-header d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <Image
                    src={
                      activeConversation.participants.find((p) => p._id !== user._id)?.avatar ||
                      'https://via.placeholder.com/40'
                    }
                    roundedCircle
                    width={40}
                    height={40}
                    className="me-2"
                  />
                  <h6 className="mb-0">
                    {activeConversation.participants.find((p) => p._id !== user._id)?.fullName}
                  </h6>
                </div>
                <div>{/* Action buttons like delete chat, etc. */}</div>
              </div>

              {/* Messages List */}
              <div
                className="messages-list-container d-flex flex-column"
                ref={messageListRef}
                onScroll={handleScroll}
              >
                {loadingMore && (
                  <div className="text-center my-2">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                  </div>
                )}
                {loading && page === 1 ? (
                  <div className="text-center my-auto">
                    <div className="spinner-border text-primary"></div>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`d-flex mb-3 ${msg.sender._id === user._id || msg.sender === user._id ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                      <div
                        className={`message-bubble p-0 ${msg.sender._id === user._id || msg.sender === user._id ? 'bg-primary' : 'bg-white'}`}
                      >
                        {msg.type === 'product' && msg.productInfo ? (
                          <a
                            href={`/product/${msg.productInfo.productId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                          >
                            <div className="chat-product-preview m-2 border-0">
                              <img src={msg.productInfo.image} alt="" className="product-image" />
                              <div className="p-2">
                                <div
                                  className="text-truncate fw-medium"
                                  style={{ fontSize: '0.85rem', color: '#1e293b' }}
                                >
                                  {msg.productInfo.name}
                                </div>
                                {msg.productInfo.variant && (
                                  <div
                                    style={{
                                      fontSize: '0.75rem',
                                      color: '#64748b',
                                      marginTop: '2px',
                                    }}
                                  >
                                    {msg.productInfo.variant}
                                  </div>
                                )}
                                <div
                                  className="fw-bold mt-1"
                                  style={{ fontSize: '0.9rem', color: '#ef4444' }}
                                >
                                  {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                  }).format(msg.productInfo.price)}
                                </div>
                              </div>
                              <div
                                style={{
                                  background: '#f8fafc',
                                  padding: '8px 12px',
                                  fontSize: '0.75rem',
                                  color: '#3b82f6',
                                  borderTop: '1px solid #f1f5f9',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontWeight: '500',
                                }}
                              >
                                <span>Xem chi tiết</span>
                                <i className="bi bi-chevron-right"></i>
                              </div>
                            </div>
                          </a>
                        ) : (
                          <p className="mb-0 p-3" style={{ fontSize: '0.95rem' }}>
                            {msg.content}
                          </p>
                        )}
                        <small
                          className={`d-block text-end mt-1 p-2 pt-0 ${msg.sender._id === user._id || msg.sender === user._id ? 'text-white-50' : 'text-muted'}`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {new Date(msg.timestamp).toLocaleString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </small>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="message-input-area mt-auto">
                <Form onSubmit={handleSendMessage}>
                  <InputGroup>
                    <Form.Control
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="border-0 bg-light rounded-start-pill ps-4 py-2"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!newMessage.trim()}
                      className="rounded-end-pill px-4"
                    >
                      <i className="bi bi-send-fill"></i>
                    </Button>
                  </InputGroup>
                </Form>
              </div>
            </>
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
              <i className="bi bi-chat-dots display-1 mb-3"></i>
              <h4>Select a conversation to start chatting</h4>
            </div>
          )}
        </Col>
      </Row>

      <AutoReplyModal show={showAutoReplyModal} onHide={() => setShowAutoReplyModal(false)} />
    </Container>
  );
};

export default ChatPage;
