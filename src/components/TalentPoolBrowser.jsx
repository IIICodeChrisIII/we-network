/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Search, Filter, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function TalentPoolBrowser() {
  const [talents, setTalents] = useState([]);
  const [filteredTalents, setFilteredTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    interestType: '',
    skill: ''
  });
  const { t } = useTranslation();

  useEffect(() => {
    loadTalents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [talents, filters]);

  const loadTalents = async () => {
    setLoading(true);
    try {
      // Get all talent profiles
      const { data: talentsData, error: talentsError } = await supabase
        .from('talent_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (talentsError) throw talentsError;
      if (!talentsData) {
        setTalents([]);
        setLoading(false);
        return;
      }

      // For each talent, fetch profile, skills and modules in parallel
      const talentsWithDetails = await Promise.all(
        talentsData.map(async (talent) => {
          const [{ data: profile }, { data: skills }, { data: modules }] = await Promise.all([
            supabase.from('profiles').select('id, first_name, last_name, university, degree, semester').eq('id', talent.student_id).maybeSingle(),
            supabase.from('student_skills').select('*').eq('student_id', talent.student_id),
            supabase.from('student_modules').select('*').eq('student_id', talent.student_id)
          ]);

          return {
            ...talent,
            profiles: profile || null,
            skills: skills || [],
            modules: modules || []
          };
        })
      );

      setTalents(talentsWithDetails);
    } catch (error) {
      console.error('Error loading talents:', error);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = talents;

    // Search by name or bio
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(talent => {
        const profile = talent.profiles;
        const name = `${profile?.first_name || ''} ${profile?.last_name || ''}`.toLowerCase();
        const bio = (talent.bio || '').toLowerCase();
        return name.includes(searchLower) || bio.includes(searchLower);
      });
    }

    // Filter by interest type
    if (filters.interestType) {
      filtered = filtered.filter(talent => {
        try {
          const interests = typeof talent.interests === 'string'
            ? JSON.parse(talent.interests)
            : talent.interests;
          return interests?.includes(filters.interestType);
        } catch {
          return false;
        }
      });
    }

    // Filter by skill
    if (filters.skill) {
      const skillLower = filters.skill.toLowerCase();
      filtered = filtered.filter(talent =>
        talent.skills?.some(s => s.skill_name.toLowerCase().includes(skillLower))
      );
    }

    setFilteredTalents(filtered);
  };

  const getInterestsList = (interests) => {
    if (!interests) return [];
    try {
      const parsed = typeof interests === 'string' ? JSON.parse(interests) : interests;
      return parsed.map(type => {
        switch(type) {
          case 'internship': return t('talent_pool.int_intern');
          case 'working_student': return t('talent_pool.int_working_student');
          case 'full_time': return t('talent_pool.int_full_time');
          default: return type;
        }
      });
    } catch {
      return [];
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Filter Section */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Filter size={20} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{t('talent_pool.title')}</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>{t('talent_pool.label_name_bio')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', paddingLeft: '12px' }}>
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('talent_pool.ph_search')}
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                style={{
                  flex: 1,
                  border: 'none',
                  padding: '8px 12px',
                  background: 'none',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>{t('talent_pool.label_type')}</label>
            <select
              value={filters.interestType}
              onChange={(e) => setFilters({...filters, interestType: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
                fontSize: '1rem',
                backgroundColor: 'var(--bg-primary)'
              }}
            >
              <option value="">{t('talent_pool.opt_all_types')}</option>
              <option value="internship">{t('talent_pool.int_intern')}</option>
              <option value="working_student">{t('talent_pool.int_working_student')}</option>
              <option value="full_time">{t('talent_pool.int_full_time')}</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>{t('talent_pool.label_skill')}</label>
            <input
              type="text"
              placeholder={t('talent_pool.ph_skill')}
              value={filters.skill}
              onChange={(e) => setFilters({...filters, skill: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('talent_pool.loading')}</p>
      ) : filteredTalents.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('talent_pool.no_talents')}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {filteredTalents.map(talent => {
            const profile = talent.profiles;
            const interests = getInterestsList(talent.interests);

            return (
              <div key={talent.id} className="card card-accent" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 8px 0' }}>
                      {profile?.first_name} {profile?.last_name}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                      {profile?.degree} • {profile?.semester} • {profile?.university}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ borderRadius: 'var(--border-radius-pill)' }}>
                      <Mail size={18} /> {t('talent_pool.btn_contact')}
                    </button>
                  </div>
                </div>

                {/* Bio */}
                {talent.bio && (
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                    {talent.bio}
                  </p>
                )}

                {/* Interests */}
                {interests.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-muted)' }}>{t('talent_pool.interested_in')}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {interests.map((interest, idx) => (
                        <span key={idx} className="badge badge-secondary">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {talent.skills && talent.skills.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-muted)' }}>{t('talent_pool.skills')}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {talent.skills.map((skill) => (
                        <span key={skill.id} className="badge badge-secondary" style={{ fontSize: '0.85rem' }}>
                          {skill.skill_name}
                          {skill.proficiency_level !== 'intermediate' && (
                            <span style={{ marginLeft: '4px', color: 'var(--text-muted)' }}>
                              ({skill.proficiency_level === 'beginner' ? t('talent_form.lvl_beginner') : t('talent_form.lvl_advanced')})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modules */}
                {talent.modules && talent.modules.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-muted)' }}>{t('talent_pool.modules', { count: talent.modules.length })}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
                      {talent.modules.slice(0, 5).map((mod) => (
                        <div key={mod.id} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <strong>{mod.module_name}</strong>
                          {mod.grade && <div>{t('talent_form.grade')} {mod.grade}</div>}
                        </div>
                      ))}
                      {talent.modules.length > 5 && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          {t('talent_pool.more', { count: talent.modules.length - 5 })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Availability */}
                {talent.availability_date && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <strong>{t('talent_form.label_avail')}</strong> {new Date(talent.availability_date).toLocaleDateString('de-DE')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '32px', fontSize: '0.9rem' }}>
        {t('talent_pool.found', { count: filteredTalents.length, talent: filteredTalents.length === 1 ? t('talent_pool.talent_single') : t('talent_pool.talent_plural') })}
      </p>
    </div>
  );
}

