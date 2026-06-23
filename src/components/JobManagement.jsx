/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    location: '',
    type: 'internship',
    description: ''
  });
  const { t } = useTranslation();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setJobs(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!newJob.title.trim() || !newJob.department.trim() || !newJob.location.trim()) {
      alert(t('jobs_admin.err_fields'));
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Update existing job and return updated row
        const { data, error } = await supabase
          .from('jobs')
          .update(newJob)
          .eq('id', editingId)
          .select()
          .maybeSingle();

        if (error) throw error;
        setJobs(prev => prev.map(j => j.id === editingId ? data : j));
        setEditingId(null);
      } else {
        // Create new job and get created row
        const { data, error } = await supabase
          .from('jobs')
          .insert([newJob])
          .select()
          .maybeSingle();

        if (error) throw error;
        setJobs(prev => [data, ...prev]);
      }

      setNewJob({
        title: '',
        department: '',
        location: '',
        type: 'internship',
        description: ''
      });
    } catch (error) {
      console.error('Error saving job:', error);
      alert(t('jobs_admin.err_save'));
    }
    setLoading(false);
  };

  const handleEdit = (job) => {
    setNewJob(job);
    setEditingId(job.id);
  };

  const handleCancel = () => {
    setNewJob({
      title: '',
      department: '',
      location: '',
      type: 'internship',
      description: ''
    });
    setEditingId(null);
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm(t('jobs_admin.confirm_delete'))) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (err) {
      console.error('Error deleting job:', err);
      alert(t('jobs_admin.err_delete'));
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Job Creation Form */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '1.3rem', fontWeight: 600 }}>
          {editingId ? t('jobs_admin.title_edit') : t('jobs_admin.title_new')}
        </h2>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>{t('jobs_admin.label_title')}</label>
            <input
              type="text"
              value={newJob.title}
              onChange={(e) => setNewJob({...newJob, title: e.target.value})}
              placeholder={t('jobs_admin.ph_title')}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>{t('jobs_admin.label_dept')}</label>
              <input
                type="text"
                value={newJob.department}
                onChange={(e) => setNewJob({...newJob, department: e.target.value})}
                placeholder={t('jobs_admin.ph_dept')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid var(--border-color)',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>{t('jobs_admin.label_loc')}</label>
              <input
                type="text"
                value={newJob.location}
                onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                placeholder={t('jobs_admin.ph_loc')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid var(--border-color)',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>{t('jobs_admin.label_type')}</label>
            <select
              value={newJob.type}
              onChange={(e) => setNewJob({...newJob, type: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
                fontSize: '1rem',
                boxSizing: 'border-box',
                backgroundColor: 'var(--bg-primary)'
              }}
            >
              <option value="internship">{t('jobs_admin.type_intern')}</option>
              <option value="working_student">{t('jobs_admin.type_working_student')}</option>
              <option value="full_time">{t('jobs_admin.type_full_time')}</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>{t('jobs_admin.label_desc')}</label>
            <textarea
              value={newJob.description}
              onChange={(e) => setNewJob({...newJob, description: e.target.value})}
              placeholder={t('jobs_admin.ph_desc')}
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '8px 12px',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn btn-primary"
            >
              {editingId ? t('jobs_admin.btn_save') : t('jobs_admin.btn_create')}
            </button>
            {editingId && (
              <button
                onClick={handleCancel}
                className="btn btn-secondary"
              >
                {t('jobs_admin.btn_cancel')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div>
        <h2 style={{ marginBottom: '24px', fontSize: '1.3rem', fontWeight: 600 }}>
          {t('jobs_admin.all_jobs')} ({jobs.length})
        </h2>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>{t('jobs_admin.loading')}</p>
        ) : jobs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>{t('jobs_admin.no_jobs')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {jobs.map(job => (
              <div key={job.id} className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 600 }}>
                    {job.title}
                  </h3>
                  <p style={{ margin: '4px 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    <strong>{job.department}</strong> • {job.location}
                  </p>
                  <p style={{ margin: '4px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {job.type === 'internship' ? t('jobs_admin.type_intern_short') : job.type === 'working_student' ? t('jobs_admin.type_working_student_short') : t('jobs_admin.type_full_time_short')}
                  </p>
                  {job.description && (
                    <p style={{ margin: '12px 0 0 0', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {job.description.substring(0, 150)}...
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                  <button
                    onClick={() => handleEdit(job)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px' }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="btn"
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--danger-color)',
                      color: 'var(--danger-color)',
                      background: 'transparent'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

