import React, { useState, useEffect } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function StudentTalentForm({ userProfile, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [modules, setModules] = useState([]);
  const [talentProfile, setTalentProfile] = useState({
    interests: [],
    bio: '',
    availability_date: ''
  });
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate' });
  const [newModule, setNewModule] = useState({ name: '', grade: '', semester: '' });

  useEffect(() => {
    loadTalentData();
  }, [userProfile?.id]);

  const loadTalentData = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      // Load skills
      const { data: skillsData } = await supabase
        .from('student_skills')
        .select('*')
        .eq('student_id', userProfile.id);

      // Load modules
      const { data: modulesData } = await supabase
        .from('student_modules')
        .select('*')
        .eq('student_id', userProfile.id);

      // Load talent profile
      const { data: talentData } = await supabase
        .from('talent_profiles')
        .select('*')
        .eq('student_id', userProfile.id)
        .single();

      if (skillsData) setSkills(skillsData);
      if (modulesData) setModules(modulesData);
      if (talentData) {
        setTalentProfile({
          interests: talentData.interests ? JSON.parse(talentData.interests) : [],
          bio: talentData.bio || '',
          availability_date: talentData.availability_date || ''
        });
      }
    } catch (error) {
      console.error('Error loading talent data:', error);
    }
    setLoading(false);
  };

  const addSkill = async () => {
    if (!newSkill.name.trim()) return;

    const { error } = await supabase
      .from('student_skills')
      .insert({
        student_id: userProfile.id,
        skill_name: newSkill.name,
        proficiency_level: newSkill.level
      });

    if (!error) {
      setSkills([...skills, { id: Date.now(), skill_name: newSkill.name, proficiency_level: newSkill.level }]);
      setNewSkill({ name: '', level: 'intermediate' });
    }
  };

  const removeSkill = async (skillId) => {
    const { error } = await supabase
      .from('student_skills')
      .delete()
      .eq('id', skillId);

    if (!error) {
      setSkills(skills.filter(s => s.id !== skillId));
    }
  };

  const addModule = async () => {
    if (!newModule.name.trim()) return;

    const { error } = await supabase
      .from('student_modules')
      .insert({
        student_id: userProfile.id,
        module_name: newModule.name,
        grade: newModule.grade || null,
        semester: newModule.semester || null
      });

    if (!error) {
      setModules([...modules, {
        id: Date.now(),
        module_name: newModule.name,
        grade: newModule.grade,
        semester: newModule.semester
      }]);
      setNewModule({ name: '', grade: '', semester: '' });
    }
  };

  const removeModule = async (moduleId) => {
    const { error } = await supabase
      .from('student_modules')
      .delete()
      .eq('id', moduleId);

    if (!error) {
      setModules(modules.filter(m => m.id !== moduleId));
    }
  };

  const saveTalentProfile = async () => {
    setLoading(true);
    try {
      // Check if profile exists
      const { data: existing } = await supabase
        .from('talent_profiles')
        .select('id')
        .eq('student_id', userProfile.id)
        .single();

      const profileData = {
        interests: JSON.stringify(talentProfile.interests),
        bio: talentProfile.bio,
        availability_date: talentProfile.availability_date
      };

      if (existing) {
        await supabase
          .from('talent_profiles')
          .update(profileData)
          .eq('student_id', userProfile.id);
      } else {
        await supabase
          .from('talent_profiles')
          .insert({
            student_id: userProfile.id,
            ...profileData
          });
      }

      if (onSaved) onSaved();
    } catch (error) {
      console.error('Error saving talent profile:', error);
    }
    setLoading(false);
  };

  const toggleInterest = (interest) => {
    setTalentProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '20px', fontSize: '1.3rem', fontWeight: 600 }}>Deine Talentpool Profile</h2>

        {/* Bio */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Über dich</label>
          <textarea
            value={talentProfile.bio}
            onChange={(e) => setTalentProfile({...talentProfile, bio: e.target.value})}
            placeholder="Schreib etwas über dich, deine Interessen und Ziele..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)',
              fontFamily: 'inherit',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Interests */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: 500 }}>Interessiert an Positionen:</label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['internship', 'working_student', 'full_time'].map(type => (
              <button
                key={type}
                onClick={() => toggleInterest(type)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--border-radius-pill)',
                  border: '2px solid ' + (talentProfile.interests.includes(type) ? 'var(--accent-red)' : 'var(--border-color)'),
                  backgroundColor: talentProfile.interests.includes(type) ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                  color: talentProfile.interests.includes(type) ? 'var(--accent-red)' : 'var(--text-secondary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {type === 'internship' ? '🎓 Praktikum' : type === 'working_student' ? '💼 HiWi' : '👔 Vollzeit'}
              </button>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Verfügbar ab:</label>
          <input
            type="date"
            value={talentProfile.availability_date}
            onChange={(e) => setTalentProfile({...talentProfile, availability_date: e.target.value})}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)',
              fontSize: '1rem'
            }}
          />
        </div>

        <button
          onClick={saveTalentProfile}
          disabled={loading}
          className="btn btn-primary"
          style={{ marginBottom: '24px' }}
        >
          <Save size={18} /> Profil speichern
        </button>
      </div>

      {/* Skills */}
      <div className="card">
        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 600 }}>Deine Skills</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {skills.map(skill => (
            <div key={skill.id} className="badge badge-secondary" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{skill.skill_name}</strong>
                <br />
                <small style={{ color: 'var(--text-muted)' }}>
                  {skill.proficiency_level === 'beginner' ? 'Anfänger' : skill.proficiency_level === 'intermediate' ? 'Fortgeschritten' : 'Experte'}
                </small>
              </div>
              <button
                onClick={() => removeSkill(skill.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'flex-end' }}>
          <input
            type="text"
            placeholder="Skill eingeben (z.B. Python, React, etc.)"
            value={newSkill.name}
            onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)',
              fontSize: '1rem'
            }}
          />
          <select
            value={newSkill.level}
            onChange={(e) => setNewSkill({...newSkill, level: e.target.value})}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)',
              fontSize: '1rem'
            }}
          >
            <option value="beginner">Anfänger</option>
            <option value="intermediate">Fortgeschritten</option>
            <option value="advanced">Experte</option>
          </select>
          <button onClick={addSkill} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            <Plus size={18} /> Hinzufügen
          </button>
        </div>
      </div>

      {/* Modules */}
      <div className="card">
        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 600 }}>Belegte Module</h3>

        <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {modules.map(module => (
            <div
              key={module.id}
              style={{
                padding: '12px',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong>{module.module_name}</strong>
                {(module.grade || module.semester) && (
                  <br />
                )}
                {module.grade && <span style={{ marginRight: '12px', color: 'var(--text-muted)' }}>Note: {module.grade}</span>}
                {module.semester && <span style={{ color: 'var(--text-muted)' }}>Semester: {module.semester}</span>}
              </div>
              <button
                onClick={() => removeModule(module.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '12px', alignItems: 'flex-end' }}>
          <input
            type="text"
            placeholder="Modulname"
            value={newModule.name}
            onChange={(e) => setNewModule({...newModule, name: e.target.value})}
            onKeyPress={(e) => e.key === 'Enter' && addModule()}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)',
              fontSize: '1rem'
            }}
          />
          <input
            type="text"
            placeholder="Note (z.B. 1.5)"
            value={newModule.grade}
            onChange={(e) => setNewModule({...newModule, grade: e.target.value})}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)',
              fontSize: '1rem'
            }}
          />
          <input
            type="text"
            placeholder="Semester"
            value={newModule.semester}
            onChange={(e) => setNewModule({...newModule, semester: e.target.value})}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)',
              fontSize: '1rem'
            }}
          />
          <button onClick={addModule} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

