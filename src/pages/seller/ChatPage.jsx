import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Container, Row, Col, ListGroup, Form, Button, Image, InputGroup } from 'react-bootstrap';
import socketService from '../../services/socketService';
import axios from 'axios';
import './ChatPage.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const ChatPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
  }, [user, activeConversation]);

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

  const handleSelectConversation = async (conv) => {
    setActiveConversation(conv);
    socketService.joinConversation(conv._id);
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/chat/messages/${conv._id}`, {
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
    setNewMessage('');
  };

  const scrollToBottom = () => {
    // Timeout to allow render
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <Container fluid className="chat-page-container p-0 h-100">
      <Row className="g-0 h-100 shadow-sm rounded overflow-hidden border">
        {/* Sidebar: Conversations List */}
        <Col md={4} lg={3} className="border-end bg-white d-flex flex-column h-100">
          <div className="p-3 border-bottom bg-light">
            <h5 className="mb-0">Messages</h5>
            {/* Search bar could go here */}
          </div>
          <ListGroup variant="flush" className="overflow-auto flex-grow-1">
            {conversations.map(conv => {
              const otherUser = conv.participants.find(p => p._id !== user._id);
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
        <Col md={8} lg={9} className="d-flex flex-column h-100 bg-light">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 bg-white border-bottom shadow-sm d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    <Image 
                        src={activeConversation.participants.find(p => p._id !== user._id)?.avatar || 'https://via.placeholder.com/40'} 
                        roundedCircle 
                        width={40} 
                        height={40} 
                        className="me-2"
                    />
                    <h6 className="mb-0">
                        {activeConversation.participants.find(p => p._id !== user._id)?.fullName}
                    </h6>
                </div>
                <div>
                    {/* Action buttons like delete chat, etc. */}
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column">
                {loading ? (
                    <div className="text-center my-auto"><div className="spinner-border text-primary"></div></div>
                ) : (
                    messages.map((msg, idx) => (
                        <div 
                        key={idx} 
                        className={`d-flex mb-3 ${msg.sender._id === user._id || msg.sender === user._id ? 'justify-content-end' : 'justify-content-start'}`}
                        >
                        <div className={`message-bubble p-3 rounded-3 shadow-sm ${msg.sender._id === user._id || msg.sender === user._id ? 'bg-primary text-white' : 'bg-white'}`}>
                            <p className="mb-0">{msg.content}</p>
                            <small className={`d-block text-end mt-1 ${msg.sender._id === user._id || msg.sender === user._id ? 'text-white-50' : 'text-muted'}`} style={{fontSize: '0.7em'}}>
                                {new Date(msg.timestamp).toLocaleString()}
                            </small>
                        </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-top">
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
    </Container>
  );
};

export default ChatPage;
