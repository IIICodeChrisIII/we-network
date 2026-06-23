import React, { useState, useEffect, useRef } from 'react';
import { User, Save, Briefcase, ChevronDown, X, Search, UserPlus, Award, CheckCircle, FileText, UploadCloud, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GERMAN_UNIVERSITIES, getLogoUrl, findUniversity } from '../lib/universities';
import NodeBalance from '../components/NodeBalance';
import { getCertificates, CATEGORY_LABEL } from '../lib/certificates';
import CertificateBadges from '../components/CertificateBadges';
import { useTranslation } from 'react-i18next';

function UniLogo({ domain, name, size = 22 }) {
  const [error, setError] = useState(false);
  const logoUrl = getLogoUrl(domain);
  if (error || !logoUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: '5px', background: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.52), fontWeight: 700, color: 'white', flexShrink: 0 }}>
        {(name || '?')[0]}
      </div>
    );
  }
  return (
    <img
      src={logoUrl}
      alt=""
      onError={() => setError(true)}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, borderRadius: '3px' }}
    />
  );
}

export default function Profile() {
  const [profile, setProfile] = useState({ first_name: '', last_name: '', bio: '', status: 'student', university: '', degree: '', semester: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState('student_verification');

  // University dropdown state
  const [uniSearch, setUniSearch] = useState('');
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const uniDropdownRef = useRef(null);
  const uniInputRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchProfileAndDocs();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (uniDropdownRef.current && !uniDropdownRef.current.contains(e.target)) {
        setShowUniDropdown(false);
        setUniSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchProfileAndDocs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!error && data) setProfile(data);

      const { data: docs } = await supabase.from('user_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (docs) setDocuments(docs);
    }
    setLoading(false);
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File is too large (max 5MB)'); return; }
    setUploadingDoc(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('user_documents').insert({
          user_id: user.id,
          type: docType,
          file_name: file.name,
          file_data: reader.result
        });
        if (!error) {
          alert(t('profile.msg_doc_success'));
          const { data: docs } = await supabase.from('user_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
          if (docs) setDocuments(docs);
        } else {
          console.error(error);
          alert('Error uploading document');
        }
      }
      setUploadingDoc(false);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').upsert({ id: user.id, ...profile });
      if (!error) alert(t('profile.msg_profile_saved'));
      else alert(t('profile.msg_profile_error'));
    }
    setSaving(false);
  };

  const selectUniversity = (uni) => {
    setProfile(prev => ({ ...prev, university: uni.name }));
    setUniSearch('');
    setShowUniDropdown(false);
  };

  const clearUniversity = (e) => {
    e.stopPropagation();
    setProfile(prev => ({ ...prev, university: '' }));
    setUniSearch('');
  };

  const selectedUniData = profile.university ? findUniversity(profile.university) : null;
  const certs = getCertificates(profile);

  const filteredUnis = GERMAN_UNIVERSITIES.filter(u =>
    u.name.toLowerCase().includes(uniSearch.toLowerCase()) ||
    u.city.toLowerCase().includes(uniSearch.toLowerCase())
  );

  if (loading) return null;

  return (
    <div className="page-content animate-fade-in" style={{ maxWidth: '800px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{t('profile.title')}</h1>
          <p className="page-description">{t('profile.description')}</p>
        </div>
        <NodeBalance userId={profile?.id} />
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-primary)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', overflow: 'hidden', flexShrink: 0 }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={40} />
            )}
          </div>
          <div>
            <label className="btn btn-secondary" style={{ marginBottom: '8px', cursor: 'pointer', display: 'inline-block' }}>
              {t('profile.upload_photo')}
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) { alert('File is too large (max 2MB)'); return; }
                  const reader = new FileReader();
                  reader.onloadend = () => setProfile(prev => ({ ...prev, avatar_url: reader.result }));
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>{t('profile.upload_hint')}</p>
            {certs.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <CertificateBadges profile={profile} max={8} size={22} />
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="form-row">
          <div className="input-group">
            <label className="input-label">{t('profile.first_name')}</label>
            <input type="text" className="input-field" value={profile.first_name || ''} onChange={e => setProfile({ ...profile, first_name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">{t('profile.last_name')}</label>
            <input type="text" className="input-field" value={profile.last_name || ''} onChange={e => setProfile({ ...profile, last_name: e.target.value })} />
          </div>
        </div>

        {/* Bio */}
        <div className="input-group">
          <label className="input-label">{t('profile.bio')}</label>
          <textarea className="input-field" rows="3" value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} style={{ resize: 'vertical' }} />
        </div>

        {/* Status */}
        <div className="input-group">
          <label className="input-label">{t('profile.current_status')}</label>
          <div className="input-with-icon">
            <Briefcase className="input-icon" size={18} />
            <select className="input-field pl-10" value={profile.status || 'student'} onChange={e => setProfile({ ...profile, status: e.target.value })} style={{ appearance: 'none' }}>
              <option value="student">{t('profile.status_student')}</option>
              <option value="intern">{t('profile.status_intern')}</option>
              <option value="working_student">{t('profile.status_working_student')}</option>
              <option value="employee">{t('profile.status_employee')}</option>
            </select>
          </div>
        </div>

        {/* ── University Picker ─────────────────────────────── */}
        <div className="input-group" style={{ marginBottom: '8px' }}>
          <label className="input-label">{t('profile.university')}</label>

          <div ref={uniDropdownRef} style={{ position: 'relative' }}>
            {/* Trigger */}
            <div
              onClick={() => { setShowUniDropdown(v => !v); if (!showUniDropdown) setTimeout(() => uniInputRef.current?.focus(), 50); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: 'var(--border-radius-sm)',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${showUniDropdown ? 'var(--accent-red)' : 'var(--border-color)'}`,
                cursor: 'pointer', transition: 'border-color var(--transition-fast)',
                boxShadow: showUniDropdown ? '0 0 0 3px rgba(204,0,0,0.1)' : 'none',
                minHeight: '44px',
              }}
            >
              {profile.university ? (
                <>
                  <UniLogo domain={selectedUniData?.domain} name={profile.university} size={22} />
                  <span style={{ flex: 1, fontSize: '0.95rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile.university}
                  </span>
                  {selectedUniData?.city && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>{selectedUniData.city}</span>
                  )}
                  <button
                    onClick={clearUniversity}
                    style={{ padding: '2px', color: 'var(--text-muted)', borderRadius: '50%', flexShrink: 0, lineHeight: 0 }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', flex: 1 }}>{t('profile.select_university')}</span>
                  <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: showUniDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </>
              )}
            </div>

            {/* Dropdown */}
            {showUniDropdown && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', boxShadow: '0 -20px 60px rgba(0,0,0,0.45)', zIndex: 500, overflow: 'hidden' }}>

                {/* Search inside dropdown */}
                <div style={{ padding: '10px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-secondary)' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      ref={uniInputRef}
                      type="text"
                      placeholder={t('profile.search_university')}
                      value={uniSearch}
                      onChange={e => setUniSearch(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '8px 10px 8px 32px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                    />
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
                    {filteredUnis.length} {t('profile.uni_found')}
                  </p>
                </div>

                {/* List */}
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {filteredUnis.length === 0 ? (
                    <p style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {t('profile.no_uni_found')}
                    </p>
                  ) : (
                    filteredUnis.map(uni => {
                      const isSelected = profile.university === uni.name;
                      return (
                        <button
                          key={uni.name}
                          onClick={() => selectUniversity(uni)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 14px', textAlign: 'left', fontSize: '0.875rem',
                            background: isSelected ? 'rgba(204,0,0,0.08)' : 'transparent',
                            color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            cursor: 'pointer', transition: 'background var(--transition-fast)',
                          }}
                          onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <UniLogo domain={uni.domain} name={uni.name} size={22} />
                          <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {uni.name}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {uni.city}
                          </span>
                          {isSelected && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)', flexShrink: 0 }} />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Degree & Semester ─────────────────────────────── */}
        <div className="form-row" style={{ marginTop: '16px' }}>
          <div className="input-group">
            <label className="input-label">{t('profile.degree')}</label>
            <input type="text" className="input-field" placeholder={t('profile.degree_placeholder')} value={profile.degree || ''} onChange={e => setProfile({ ...profile, degree: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">{t('profile.semester')}</label>
            <input type="number" min="1" className="input-field" placeholder={t('profile.semester_placeholder')} value={profile.semester || ''} onChange={e => setProfile({ ...profile, semester: e.target.value })} />
          </div>
        </div>

        {/* ── Career Timeline ─────────────────────────────── */}
        <div style={{ marginTop: '32px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>{t('profile.journey_title')}</h3>
          <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              
              {/* Step 1: Join Network */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <UserPlus size={16} />
                  </div>
                  <div style={{ width: '2px', height: '40px', background: (profile.status === 'intern' || profile.status === 'working_student' || profile.status === 'employee') ? 'var(--accent-red)' : 'var(--border-color)', margin: '4px 0' }} />
                </div>
                <div style={{ paddingBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{t('profile.journey_join')}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>März 2024</span>
                </div>
              </div>

              {/* Step 2: Internship / Working Student */}
              {(profile.status === 'intern' || profile.status === 'working_student' || profile.status === 'employee') && (
                <div style={{ display: 'flex', gap: '16px', animation: 'fadeIn 0.5s ease-out' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(204,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)' }}>
                      <Briefcase size={16} />
                    </div>
                    <div style={{ width: '2px', height: '40px', background: profile.status === 'employee' ? 'var(--accent-green)' : 'var(--border-color)', margin: '4px 0' }} />
                  </div>
                  <div style={{ paddingBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {profile.status === 'working_student' ? t('profile.journey_start_working_student') : t('profile.journey_start_intern')}
                    </h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Oktober 2024</span>
                  </div>
                </div>
              )}

              {/* Step 3: Employee */}
              {profile.status === 'employee' && (
                <div style={{ display: 'flex', gap: '16px', animation: 'fadeIn 0.5s ease-out' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
                      <Award size={16} />
                    </div>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{t('profile.journey_employee')}</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('profile.today')}</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
            <Save size={18} /> {saving ? t('profile.btn_saving') : t('profile.btn_save')}
          </button>
        </div>
      </div>

      {/* ── Zertifikate & Status ──────────────────────────── */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '2px' }}>{t('profile.certs_title')}</h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
              {t('profile.certs_desc')}
            </p>
          </div>
          <span className="badge badge-red">{certs.length}</span>
        </div>

        {certs.length === 0 ? (
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>{t('profile.no_certs')}</p>
        ) : (
          <div className="cert-list">
            {certs.map((c) => {
              const Icon = c.icon;
              return (
                <div className="cert-row" key={c.id}>
                  <div className="cert-row__icon" style={{ color: c.color, background: `${c.color}22` }}>
                    <Icon size={22} strokeWidth={2.2} />
                  </div>
                  <div className="cert-row__body">
                    <div className="cert-row__title">
                      {c.label}
                      <CheckCircle size={14} className="cert-row__check" />
                    </div>
                    <div className="cert-row__desc">{c.description}</div>
                    <div className="cert-row__meta">{c.issuer}{c.date ? ` · ${c.date}` : ''}</div>
                  </div>
                  <span className={`cert-row__cat cert-row__cat--${c.category}`}>{CATEGORY_LABEL[c.category]}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Dokumenten-Upload ──────────────────────────── */}
      <div className="card">
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '2px' }}>{t('profile.doc_upload_title')}</h3>
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
            {t('profile.doc_upload_desc')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: '1', minWidth: '200px' }}>
            <label className="input-label">{t('profile.doc_type')}</label>
            <select className="input-field" value={docType} onChange={e => setDocType(e.target.value)}>
              <option value="student_verification">{t('profile.doc_type_imma')}</option>
              <option value="certificate">{t('profile.doc_type_cert')}</option>
            </select>
          </div>
          <div className="input-group" style={{ flex: '1', minWidth: '200px', display: 'flex', alignItems: 'flex-end' }}>
            <label className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
              {uploadingDoc ? t('profile.doc_uploading') : <><UploadCloud size={18} style={{ marginRight: '8px' }}/> {t('profile.doc_upload_btn')}</>}
              <input
                type="file"
                accept="application/pdf, image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                onChange={handleDocumentUpload}
                disabled={uploadingDoc}
              />
            </label>
          </div>
        </div>

        {documents.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>{t('profile.your_uploads')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {documents.map(doc => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{doc.file_name}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {doc.type === 'student_verification' ? t('profile.doc_type_imma') : t('profile.doc_type_cert')} • {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    {doc.status === 'pending' && <span className="badge" style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308' }}><Clock size={12} style={{ marginRight: '4px' }}/> {t('profile.status_pending')}</span>}
                    {doc.status === 'approved' && <span className="badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}><CheckCircle size={12} style={{ marginRight: '4px' }}/> {t('profile.status_approved')}</span>}
                    {doc.status === 'rejected' && <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><AlertCircle size={12} style={{ marginRight: '4px' }}/> {t('profile.status_rejected')}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}