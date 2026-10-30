import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'I need Wi-Fi coverage for 5 zones with AeroMesh Wi-Fi 6E.',
  'That price is a bit high for our budget. Can you offer a discount?',
  'I need 4 AirPods Pro 2nd Gen units with AppleCare (CARE tier).',
  'Yes, please confirm and book this order for John Doe (john@example.com).',
];

export default function ChatInterface({ messages, onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleSuggestionClick = (prompt) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-title">
          <Bot size={18} className="text-accent" />
          <span>Consultation Stream</span>
        </div>
        <span className="badge-count">{messages.length} messages</span>
      </div>

      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="empty-chat-state">
            <div className="empty-icon-wrap">
              <Sparkles size={32} />
            </div>
            <h3>Consultative Sales Agent</h3>
            <p>
              Inquire about hardware SKUs, specify required capacity, discuss pricing objections, or confirm an order.
            </p>

            <div className="suggestions-list">
              <span className="suggestions-label">Try asking:</span>
              {SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="suggestion-chip"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id || index}
                className={`message-row ${isUser ? 'message-user' : 'message-agent'}`}
              >
                <div className="avatar">
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="message-content">
                  <div className="message-header-meta">
                    <span className="sender-name">{isUser ? 'You' : 'AI Sales Agent'}</span>
                    <span className="message-time">
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                  <div className="message-body">{msg.content}</div>
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="message-row message-agent">
            <div className="avatar">
              <Bot size={16} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-bar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about products, negotiate price, or confirm your booking..."
          className="chat-input"
          id="chat-user-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!input.trim() || isLoading}
          id="btn-send-message"
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
