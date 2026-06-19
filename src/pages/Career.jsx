import React, { useState, useEffect } from 'react';
import { MapPin, Clock, ArrowRight, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Career() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setJobs(data);
    }
    setLoading(false);
  };

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1000px' }}>
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Career Opportunities</h1>
            <p className="page-description">Find your next opportunity at Würth Elektronik.</p>
          </div>
          <button className="btn btn-secondary" style={{ borderRadius: 'var(--border-radius-pill)' }}>
            Filter Options
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading jobs...</p> : jobs.map(job => (
            <div key={job.id} className="card card-accent" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '32px' }}>
              <div style={{ flex: 1 }}>
                <div className="flex-between" style={{ marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{job.title}</h3>
                  <span className="badge badge-green">Actively Hiring</span>
                </div>
                
                <h4 style={{ color: 'var(--accent-red)', fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px' }}>
                  Würth Elektronik HQ
                </h4>
                
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6', fontSize: '1rem', maxWidth: '800px' }}>
                  Join our team for an exciting opportunity working on cutting-edge hardware and software integration in our {job.department || 'engineering'} department.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {job.location}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> Flexible Hours</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={16} /> 
                    <span style={{ textTransform: 'capitalize' }}>{job.type.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ paddingLeft: '24px', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <button className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }}>
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
