import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Mail, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import CertificateBadges from '../components/CertificateBadges';

export default function Contacts() {
  const navigate = useNavigate();
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchSpecialists();
  }, []);

  const fetchSpecialists = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'specialist');
    
    if (!error && data) {
      setSpecialists(data);
    }
    setLoading(false);
  };

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        <div className="page-header">
          <h1 className="page-title">{t('contacts.title')}</h1>
          <p className="page-description">{t('contacts.description')}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {loading ? <p style={{ color: 'var(--text-muted)' }}>{t('contacts.loading')}</p> : specialists.map(spec => {
            const initials = `${(spec.first_name || 'S')[0]}${(spec.last_name || '')[0] || ''}`.toUpperCase();
            
            return (
              <div key={spec.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '20px', border: '3px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  {initials}
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>{spec.first_name} {spec.last_name}</h3>
                <div style={{ marginBottom: '12px' }}><CertificateBadges profile={spec} max={5} size={20} /></div>
                <span className="badge badge-red" style={{ marginBottom: '16px' }}>{spec.role}</span>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '28px', lineHeight: '1.5' }}>
                  <Award size={16} className="text-accent" /> {spec.bio || t('contacts.fallback_bio')}
                </div>

                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: 'auto' }}>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '12px' }} onClick={() => navigate(`/messages?with=${spec.id}`)}>
                    <MessageSquare size={16} /> {t('contacts.btn_message')}
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '12px', borderRadius: 'var(--border-radius-pill)' }}>
                    <Mail size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
