import React, { useState, useEffect } from 'react';
import { User, Settings, Save, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const [profile, setProfile] = useState({ first_name: '', last_name: '', bio: '', status: 'student', university: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!error && data) {
        setProfile(data);
      }
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').upsert({ id: user.id, ...profile });
      if (!error) alert("Profile saved!");
      else alert("Error saving profile");
    }
  };
  return (
    <div className="page-content animate-fade-in" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <h1 className="page-title">Profil</h1>
        <p className="page-description">Manage your personal information and career status.</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-primary)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', overflow: 'hidden' }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={40} />
            )}
          </div>
          <div>
            <label className="btn btn-secondary" style={{ marginBottom: '8px', cursor: 'pointer', display: 'inline-block' }}>
              Upload Photo
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                      alert("File is too large (max 2MB)");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setProfile(prev => ({ ...prev, avatar_url: reader.result }));
                    };
                    reader.readAsDataURL(file);
                  }
                }} 
              />
            </label>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>JPG or PNG, max 2MB</p>
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label className="input-label">First Name</label>
            <input type="text" className="input-field" value={profile.first_name || ''} onChange={e => setProfile({...profile, first_name: e.target.value})} />
          </div>
          <div className="input-group">
            <label className="input-label">Last Name</label>
            <input type="text" className="input-field" value={profile.last_name || ''} onChange={e => setProfile({...profile, last_name: e.target.value})} />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Bio</label>
          <textarea className="input-field" rows="3" value={profile.bio || ''} onChange={e => setProfile({...profile, bio: e.target.value})} style={{ resize: 'vertical' }}></textarea>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label className="input-label">Current Status</label>
            <div className="input-with-icon">
              <Briefcase className="input-icon" size={18} />
              <select className="input-field pl-10" value={profile.status || 'student'} onChange={e => setProfile({...profile, status: e.target.value})} style={{ appearance: 'none' }}>
                <option value="student">Student</option>
                <option value="intern">Intern at Würth</option>
                <option value="working_student">Working Student at Würth</option>
                <option value="employee">Employee</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Location</label>
            <div className="input-with-icon">
              <MapPin className="input-icon" size={18} />
              <input type="text" className="input-field pl-10" value={profile.university || ''} onChange={e => setProfile({...profile, university: e.target.value})} placeholder="e.g. TU München" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
          <button className="btn btn-primary" onClick={saveProfile}>
            <Save size={18} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
