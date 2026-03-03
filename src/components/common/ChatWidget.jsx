import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Button, Badge, Form, InputGroup, Image } from 'react-bootstrap';
import socketService from '../../services/socketService';
import aiChatService from '../../services/aiChatService';
import axios from 'axios';
import styles from '../../assets/styles/common/ChatWidget.module.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const SUGGESTED_QUESTIONS = [
    "Làm sao để chọn size giày chuẩn?",
    "Chính sách bảo hành như thế nào?",
    "Có những phương thức thanh toán nào?",
    "Thời gian giao hàng bao lâu?",
    "Quy trình đổi trả hàng?",
];

const ChatWidget = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeChatId, setActiveChatId] = useState('ai'); // 'ai' or conversationId
  
  // Real Chat State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // AI Chat State
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
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
                setUnreadCount(prev => prev + 1);
            }
        } else {
            setUnreadCount(prev => prev + 1);
        }
        fetchConversations();
      });
      
      socket.on('new_message_notification', () => {
          fetchConversations();
          if (!isOpen || isMinimized) {
              setUnreadCount(prev => prev + 1);
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
            timestamp: new Date().toISOString() 
        };
        setAiMessages([welcomeMsg]);
        aiChatService.saveMessages([welcomeMsg]);
      } else {
        setAiMessages(savedAiMessages);
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
      if(isOpen && isAuthenticated) {
          fetchConversations();
          if (activeChatId === 'ai') {
              scrollToBottomAi();
          } else {
              scrollToBottom();
          }
      }
  }, [isOpen, isAuthenticated, activeChatId]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/conversations`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/chat/messages/${conversationId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessages(response.data);
      setLoading(false);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    if (id === 'ai') {
        setActiveConversation(null);
        scrollToBottomAi();
    } else {
        const conv = conversations.find(c => c._id === id);
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
    if (!newMessage.trim() || !activeConversation) return;

    const receiverId = activeConversation.participants.find(p => p._id !== user._id)?._id;

    const messageData = {
      conversationId: activeConversation._id,
      sender: user._id,
      receiver: receiverId,
      content: newMessage,
    };

    socketService.sendMessage(messageData);
    // Optimistic update
    setMessages(prev => [...prev, { ...messageData, timestamp: new Date().toISOString() }]); 
    setNewMessage('');
    scrollToBottom();
  };

  // --- AI Chat Logic ---
  const handleSendAiMessage = async (e, forcedContent = null) => {
    if (e) e.preventDefault();
    const contentToSend = forcedContent || aiInput;
    if (!contentToSend.trim()) return;

    const userMsg = { role: 'user', content: contentToSend, timestamp: new Date().toISOString() };
    const newMessages = [...aiMessages, userMsg];
    
    setAiMessages(newMessages);
    aiChatService.saveMessages(newMessages);
    setAiInput('');
    setIsAiTyping(true);
    scrollToBottomAi();

    // Streaming placeholder
    const tempAiMsgId = Date.now();
    const tempAiMsg = { role: 'ai', content: '', timestamp: new Date().toISOString(), id: tempAiMsgId, isStreaming: true };
    setAiMessages(prev => [...prev, tempAiMsg]);

    await aiChatService.sendMessage(
        userMsg.content,
        (chunk) => {
            setAiMessages(prev => prev.map(msg => 
                msg.id === tempAiMsgId ? { ...msg, content: msg.content + chunk } : msg
            ));
            scrollToBottomAi();
        },
        (finalContent) => {
            setIsAiTyping(false);
            setAiMessages(prev => {
                const updated = prev.map(msg => 
                    msg.id === tempAiMsgId ? { ...msg, content: finalContent, isStreaming: false } : msg
                );
                aiChatService.saveMessages(updated);
                return updated;
            });
        },
        (error) => {
            setIsAiTyping(false);
            const errorMsg = { role: 'ai', content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.', timestamp: new Date().toISOString() };
            setAiMessages(prev => {
                const filtered = prev.filter(msg => msg.id !== tempAiMsgId);
                const updated = [...filtered, errorMsg];
                aiChatService.saveMessages(updated);
                return updated;
            });
        }
    );
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToBottomAi = () => setTimeout(() => aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  const filteredConversations = conversations.filter(c => {
      const otherUser = c.participants.find(p => p._id !== user._id);
      return otherUser?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const toggleOptions = () => {
      setIsOpen(!isOpen);
      if(!isOpen) setUnreadCount(0);
      setIsMinimized(false);
  };

  if (!isAuthenticated) return null;

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
        <div className={`${styles['chat-widget-drawer']} ${isMinimized ? styles['minimized'] : ''}`}>
            {/* Gradient Header */}
            <div className={styles['chat-widget-header']}>
                <div className={styles['chat-widget-title']}>
                    <i className="bi bi-chat-text-fill fs-5"></i>
                    <span>Chat Support</span>
                </div>
                <div className={styles['chat-widget-actions']}>
                    {!isMinimized && (
                        <button className={styles['chat-widget-action-btn']} onClick={() => setIsMinimized(true)}>
                            <i className="bi bi-dash-lg"></i>
                        </button>
                    )}
                    {isMinimized && (
                        <button className={styles['chat-widget-action-btn']} onClick={() => setIsMinimized(false)}>
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
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{boxShadow: 'none', border: '1px solid #ced4da'}}
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
                                    <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{width: 40, height: 40}}>
                                        <i className="bi bi-robot fs-5"></i>
                                    </div>
                                </div>
                                <div className="flex-grow-1 overflow-hidden">
                                     <div className="d-flex justify-content-between align-items-center mb-1">
                                        <h6 className="mb-0 text-truncate fw-bold" style={{fontSize: '0.9rem'}}>AI Consultant</h6>
                                        <small className="text-muted" style={{fontSize: '0.7rem'}}>Now</small>
                                    </div>
                                    <p className="mb-0 text-muted small text-truncate">How can I help you?</p>
                                </div>
                            </div>

                            {/* Conversation Items */}
                            {filteredConversations.map(conv => {
                                const otherUser = conv.participants.find(p => p._id !== user._id);
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
                                                <h6 className="mb-0 text-truncate fw-bold" style={{fontSize: '0.9rem'}}>
                                                    {otherUser?.fullName || 'User'}
                                                </h6>
                                                <small className="text-muted" style={{fontSize: '0.7rem'}}>
                                                    {new Date(conv.lastUpdated).toLocaleDateString()}
                                                </small>
                                            </div>
                                            <p className="mb-0 text-muted small text-truncate">
                                                {conv.lastMessage || 'No messages'}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Main Chat Area */}
                    <div className={styles['chat-main']}>
                        {/* Chat Messages */}
                        <div className={`${styles['chat-messages']} ${styles['custom-scrollbar']}`}>
                             {activeChatId === 'ai' ? (
                                <>
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
                                                        style={{fontSize: '0.85rem'}}
                                                    >
                                                        {q}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {aiMessages.map((msg, idx) => (
                                        <div key={idx} className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                            {msg.role === 'ai' && (
                                                 <div className="me-2 d-flex align-items-end">
                                                     <div className="rounded-circle bg-white text-primary shadow-sm d-flex align-items-center justify-content-center" style={{width: 28, height: 28}}>
                                                        <i className="bi bi-robot" style={{fontSize: '0.9rem'}}></i>
                                                     </div>
                                                 </div>
                                            )}
                                            <div className={`${styles['message-bubble']} ${msg.role === 'user' ? styles['message-user'] : styles['message-other']}`}>
                                                <div style={{whiteSpace: 'pre-wrap'}}>{msg.content}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {isAiTyping && !aiMessages.some(m => m.isStreaming) && (
                                        <div className="d-flex mb-3 justify-content-start">
                                            <div className={styles['typing-indicator']}>
                                                <span className={styles['typing-dot']}></span>
                                                <span className={styles['typing-dot']}></span>
                                                <span className={styles['typing-dot']}></span>
                                            </div>
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
                                        messages.map((msg, idx) => (
                                            <div key={idx} className={`d-flex mb-3 ${msg.sender._id === user._id || msg.sender === user._id ? 'justify-content-end' : 'justify-content-start'}`}>
                                                <div className={`${styles['message-bubble']} ${msg.sender._id === user._id || msg.sender === user._id ? styles['message-user'] : styles['message-other']}`}>
                                                     <div>{msg.content}</div>
                                                     <div className="text-end mt-1 opacity-75" style={{fontSize: '0.65rem'}}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                     </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </>
                             )}
                        </div>

                        {/* Input Area */}
                        <div className={styles['chat-input-area']}>
                            <Form onSubmit={activeChatId === 'ai' ? (e) => handleSendAiMessage(e) : handleSendMessage}>
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        placeholder={activeChatId === 'ai' ? "Nhập câu hỏi..." : "Nhập tin nhắn..."}
                                        value={activeChatId === 'ai' ? aiInput : newMessage}
                                        onChange={(e) => activeChatId === 'ai' ? setAiInput(e.target.value) : setNewMessage(e.target.value)}
                                        className="border-end-0 bg-light py-2 ps-3 rounded-start-pill"
                                        style={{border: '1px solid #dee2e6'}}
                                        disabled={activeChatId === 'ai' && isAiTyping}
                                    />
                                    <Button 
                                        type="submit" 
                                        variant="light" 
                                        className="border border-start-0 bg-light rounded-end-pill text-primary pe-3"
                                        style={{border: '1px solid #dee2e6'}}
                                        disabled={activeChatId === 'ai' ? (!aiInput.trim() || isAiTyping) : !newMessage.trim()}
                                    >
                                        <i className="bi bi-send-fill fs-5"></i>
                                    </Button>
                                </InputGroup>
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
