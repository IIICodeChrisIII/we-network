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
    <div className="page-content animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Karriere</h1>
          <p className="page-description">Find your next opportunity at Würth Elektronik.</p>
        </div>
        <button className="btn btn-secondary">Filter Options</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {loading ? <p>Loading jobs...</p> : jobs.map(job => (
          <div key={job.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ marginBottom: 'auto' }}>
              <div className="flex-between" style={{ marginBottom: '16px' }}>
                <span style={{ 
                  background: job.type === 'internship' ? 'rgba(59,130,246,0.1)' : job.type === 'working_student' ? 'rgba(16,185,129,0.1)' : 'rgba(204,0,0,0.1)', 
                  color: job.type === 'internship' ? '#60a5fa' : job.type === 'working_student' ? '#34d399' : 'var(--accent-red)', 
                  padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase'
                }}>
                  {job.type.replace('_', ' ')}
                </span>
                <span className="text-secondary" style={{ fontSize: '0.9rem' }}>{job.department}</span>
              </div>
              
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', lineHeight: '1.4' }}>{job.title}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} /> {job.location}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> Flexible Hours</div>
              </div>
            </div>
            
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }}>
              Apply Now <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
