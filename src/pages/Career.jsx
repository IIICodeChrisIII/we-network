import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Briefcase, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import StudentTalentForm from '../components/StudentTalentForm';
import TalentPoolBrowser from '../components/TalentPoolBrowser';
import JobManagement from '../components/JobManagement';

export default function Career() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs'); // jobs, talent-pool, talent-form, job-management
  const { t } = useTranslation();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setUserProfile(profile);

        // Determine which tab to show by default
        if (profile?.role === 'admin' || profile?.role === 'specialist') {
          setActiveTab('job-management');
        } else if (profile?.status === 'student') {
          setActiveTab('jobs');
        }
      }

      fetchJobs();
    } catch (error) {
      console.error('Error loading user data:', error);
      fetchJobs();
    }
  };

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

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'specialist';
  const isStudent = userProfile?.status === 'student';

  const tabs = [
    { id: 'jobs', label: t('career.tab_jobs'), icon: Briefcase, show: true },
    { id: 'talent-pool', label: t('career.tab_talent_pool'), icon: BarChart3, show: isAdmin },
    { id: 'talent-form', label: t('career.tab_my_profile'), icon: BarChart3, show: isStudent },
    { id: 'job-management', label: t('career.tab_job_mgmt'), icon: BarChart3, show: isAdmin },
  ];

  const visibleTabs = tabs.filter(t => t.show);

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('career.title')}</h1>
            <p className="page-description">{t('career.description')}</p>
          </div>
        </div>

        {/* Tabs */}
        {visibleTabs.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '32px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '16px'
          }}>
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px',
                  borderRadius: 'var(--border-radius)',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? 'var(--accent-red)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'jobs' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              {loading ? (
                <p style={{ color: 'var(--text-muted)' }}>{t('career.loading')}</p>
              ) : jobs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>{t('career.no_jobs')}</p>
              ) : (
                jobs.map(job => (
                  <div key={job.id} className="card card-accent" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '32px' }}>
                    <div style={{ flex: 1 }}>
                      <div className="flex-between" style={{ marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{job.title}</h3>
                        <span className="badge badge-green">{t('career.badge_active')}</span>
                      </div>

                      <h4 style={{ color: 'var(--accent-red)', fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px' }}>
                        Würth Elektronik
                      </h4>

                      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6', fontSize: '1rem', maxWidth: '800px' }}>
                        {job.description || t('career.fallback_desc').replace('{{department}}', job.department)}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {job.location}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Briefcase size={16} />
                          <span>
                            {job.type === 'internship' ? t('career.type_internship') : job.type === 'working_student' ? t('career.type_working_student') : t('career.type_fulltime')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ paddingLeft: '24px', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <button className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }}>
                        {t('career.btn_details')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'talent-form' && userProfile && (
          <StudentTalentForm
            userProfile={userProfile}
            onSaved={() => console.log(t('career.profile_saved'))}
          />
        )}

        {activeTab === 'talent-pool' && (
          <TalentPoolBrowser />
        )}

        {activeTab === 'job-management' && (
          <JobManagement />
        )}
      </div>
    </div>
  );
}
