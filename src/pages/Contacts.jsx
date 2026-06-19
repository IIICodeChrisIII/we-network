import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Contacts() {
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Tech Specialists</h1>
        <p className="page-description">Connect directly with our experts for mentorship and questions.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {loading ? <p>Loading specialists...</p> : specialists.map(spec => (
          <div key={spec.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', marginBottom: '16px', border: '3px solid var(--border-color)', boxShadow: '0 4px 20px var(--accent-glow)' }}>
              {spec.first_name?.[0] || 'S'}
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{spec.first_name} {spec.last_name}</h3>
            <p className="text-accent" style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '12px' }}>{spec.role}</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              <Award size={16} /> {spec.bio || 'Tech Specialist'}
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button className="btn btn-primary" style={{ flex: 1 }}>
                <MessageSquare size={16} /> Message
              </button>
              <button className="btn btn-secondary" style={{ padding: '10px' }}>
                <Mail size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
