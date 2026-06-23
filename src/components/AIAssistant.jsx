import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MOCK_RESPONSES = (t) => [
  {
    keywords: ['sensor', 'messen', 'feuchtigkeit', 'temperatur', 'druck'],
    text: t('ai.msg_sensor')
  },
  {
    keywords: ['spannung', 'strom', 'power', 'netzteil', 'dc', 'wandler'],
    text: t('ai.msg_power')
  },
  {
    keywords: ['led', 'licht', 'anzeige', 'blinken'],
    text: t('ai.msg_led')
  },
  {
    keywords: ['spule', 'induktivität', 'filter', 'hf', 'frequenz'],
    text: t('ai.msg_coil')
  },
  {
    keywords: ['hallo', 'hi', 'hey', 'moin', 'servus', 'hello'],
    text: t('ai.msg_hello')
  }
];

const DEFAULT_RESPONSE = (t) => t('ai.msg_default');

export default function AIAssistant() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: t('ai.msg_welcome') }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay (1.5s to 2.5s)
    const delay = Math.floor(Math.random() * 1000) + 1500;
    
    setTimeout(() => {
      let responseText = DEFAULT_RESPONSE(t);
      const lowerInput = userText.toLowerCase();
      
      // Find matching mock response
      for (const rule of MOCK_RESPONSES(t)) {
        if (rule.keywords.some(kw => lowerInput.includes(kw))) {
          responseText = rule.text;
          break;
        }
      }

      setMessages(prev => [...prev, { role: 'ai', text: responseText }]);
      setIsTyping(false);
    }, delay);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        className="btn btn-primary"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(226, 0, 26, 0.4)',
          zIndex: 1000,
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(0)' : 'scale(1)'
        }}
        onClick={() => setIsOpen(true)}
      >
        <Bot size={32} />
      </button>

      {/* Chat Window */}
      <div 
        className="card"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '350px',
          height: '500px',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          zIndex: 1001,
          boxShadow: '0 12px 48px rgba(0,0,0,0.2)',
          transition: 'opacity 0.3s, transform 0.3s, visibility 0.3s',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
          overflow: 'hidden',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Bot size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>{t('ai.title')}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--accent-green)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--accent-green)', borderRadius: '50%', display: 'inline-block' }}></span>
                {t('ai.online')}
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}>
              {msg.role === 'ai' && (
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={12} color="var(--accent-red)" />
                </div>
              )}
              <div style={{
                background: msg.role === 'user' ? 'var(--accent-red)' : 'var(--bg-secondary)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                padding: '12px 16px',
                borderRadius: '16px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '16px',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                {/* Parse simple bold markdown for emphasis */}
                {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>)}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={12} color="var(--accent-red)" />
              </div>
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '12px 16px',
                borderRadius: '16px',
                borderBottomLeftRadius: '4px',
                display: 'flex',
                gap: '4px',
                alignItems: 'center'
              }}>
                <div className="typing-dot" style={{ animationDelay: '0s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.placeholder')}
              style={{
                flex: 1,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '10px 16px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              style={{
                background: input.trim() && !isTyping ? 'var(--accent-red)' : 'var(--bg-tertiary)',
                color: input.trim() && !isTyping ? '#fff' : 'var(--text-muted)',
                border: 'none',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                transition: 'background 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .typing-dot {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: typingPulse 1.4s infinite ease-in-out both;
        }
        @keyframes typingPulse {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}} />
    </>
  );
}
