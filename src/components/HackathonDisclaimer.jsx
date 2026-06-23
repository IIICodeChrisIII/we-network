import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HackathonDisclaimer = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const isDismissed = localStorage.getItem('hackathonDisclaimerDismissed');
    if (!isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('hackathonDisclaimerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 48px)',
      maxWidth: '500px',
      backgroundColor: 'var(--bg-card)',
      border: '2px solid var(--accent-red)',
      borderRadius: 'var(--border-radius-xl, 6px)',
      padding: '16px',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 99999,
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
      animation: 'slideUp 0.3s ease-out forwards'
    }}>
      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translate(-50%, 20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
        `}
      </style>
      <div style={{ color: 'var(--accent-red)', marginTop: '2px' }}>
        <Info size={24} />
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          {t('hackathon.title')}
        </h4>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          {t('hackathon.desc')}
        </p>
      </div>
      <button 
        onClick={handleDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'var(--transition-fast)'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        aria-label={t('hackathon.close')}
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default HackathonDisclaimer;
