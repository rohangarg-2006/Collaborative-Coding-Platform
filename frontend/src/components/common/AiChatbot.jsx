import React, { useState, useRef, useEffect } from 'react';
import geminiService from '../../utils/geminiService';
import './ai-chatbot.css';

const AiChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hi! I'm your AI based coding assistant. Ask me anything!" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages(prev => [...prev, { type: 'user', text: inputText }]);
    setInputText('');
    setIsLoading(true);
    const response = await geminiService.getAiResponse(inputText);
    setMessages(prev => [...prev, { type: 'bot', text: response }]);
    setIsLoading(false);
  };
  return (
    <div className="ai-chatbot-container">
      <button
        className="chatbot-toggle-btn"
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        style={{
          background: 'linear-gradient(135deg, #6366f1 60%, #60a5fa 100%)',
          border: '3px solid #fff',
          borderRadius: '50%',
          width: 60,
          height: 60,
          boxShadow: '0 4px 16px rgba(99,102,241,0.18), 0 1.5px 4px rgba(0,0,0,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          overflow: 'hidden',
          transition: 'box-shadow 0.2s, background 0.2s, transform 0.22s cubic-bezier(.34,1.56,.64,1), filter 0.2s',
        }}
      >
        <img
          src="/chatbot-logo.png"
          alt="AI Chatbot Logo"
          style={{
            width: 38,
            height: 38,
            objectFit: 'contain',
            borderRadius: '50%',
            background: 'transparent',
            display: 'block',
            boxShadow: '0 1.5px 4px rgba(0,0,0,0.08)',
            transition: 'transform 0.32s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s',
            willChange: 'transform',
          }}
        />
      </button>
      {isOpen && (
        <div className="chatbot-panel open">
          <div className="chatbot-header"><h3>AI Assistant Chatbot</h3></div>
          <div className="messages-container">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.type}`}>
                <div className="message-avatar">{msg.type === 'bot' ? '🤖' : '🧑'}</div>
                <div className="message-content"><pre className="message-text">{msg.text}</pre></div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot loading">
                <div className="message-avatar">🤖</div>
                <div className="message-content"><span>...</span></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="chatbot-input-form">
            <div className="chatbot-input-row">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Ask me anything..."
                className="chatbot-input"
                ref={inputRef}
                disabled={isLoading}
              />
              {inputText.trim() && (
                <button
                  type="submit"
                  className="chatbot-send-btn"
                  disabled={isLoading}
                  style={{ padding: 0, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <img
                    src="/send-aichatbot.jpeg"
                    alt="Send"
                    style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: '50%', background: 'transparent', padding: 2, boxShadow: 'none' }}
                  />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiChatbot;