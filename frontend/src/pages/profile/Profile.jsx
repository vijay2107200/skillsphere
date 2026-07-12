import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyProfile, updateMyProfile } from '../../store/slices/profileSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const card = { background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' };
const inputStyle = { width: '100%', background: '#fffbf5', border: '1px solid #fed7aa', color: '#1e293b', borderRadius: '0.5rem', padding: '0.5rem 1rem', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#334155' };

const emptyPortfolio = { title: '', description: '', projectUrl: '' };
const emptyCert = { name: '', issuer: '', year: new Date().getFullYear() };
const emptyExp = { title: '', company: '', from: '', to: '', description: '' };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const defaultAvailability = DAYS.map((day) => ({
  day, available: !['Saturday', 'Sunday'].includes(day), from: '09:00', to: '17:00',
}));

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { myProfile, loading } = useSelector((s) => s.profile);
  const isFreelancer = user?.role === 'freelancer';

  const [form, setForm] = useState({ bio: '', location: '', hourlyRate: '', skillsInput: '', website: '', companyName: '' });
  const [skillsList, setSkillsList] = useState([]);
  const [editing, setEditing] = useState(false);

  const [portfolio, setPortfolio] = useState([]);
  const [certs, setCerts] = useState([]);
  const [experience, setExperience] = useState([]);

  const [addingPortfolio, setAddingPortfolio] = useState(false);
  const [addingCert, setAddingCert] = useState(false);
  const [addingExp, setAddingExp] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [availability, setAvailability] = useState(defaultAvailability);
  const [availSaving, setAvailSaving] = useState(false);

  const [newPortfolio, setNewPortfolio] = useState(emptyPortfolio);
  const [newCert, setNewCert] = useState(emptyCert);
  const [newExp, setNewExp] = useState(emptyExp);

  useEffect(() => { dispatch(fetchMyProfile()); }, [dispatch]);

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setTwoFAEnabled(data.user?.twoFactorEnabled || false)).catch(() => {});
  }, []);

  useEffect(() => {
    if (myProfile) {
      setForm({ bio: myProfile.bio || '', location: myProfile.location || '', hourlyRate: myProfile.hourlyRate || '', website: myProfile.website || '', companyName: myProfile.companyName || '', skillsInput: '' });
      if (isFreelancer && myProfile.skills) setSkillsList(myProfile.skills.map((s) => s.name || s));
      if (isFreelancer) {
        setPortfolio(myProfile.portfolio || []);
        setCerts(myProfile.certifications || []);
        setExperience(myProfile.experience || []);
        if (myProfile.availability?.length) setAvailability(myProfile.availability);
      }
    }
  }, [myProfile, isFreelancer]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addSkill = () => {
    const skill = form.skillsInput.trim();
    if (skill && !skillsList.includes(skill)) { setSkillsList((s) => [...s, skill]); setForm((f) => ({ ...f, skillsInput: '' })); }
  };
  const removeSkill = (skill) => setSkillsList((s) => s.filter((x) => x !== skill));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = isFreelancer
      ? { bio: form.bio, location: form.location, hourlyRate: Number(form.hourlyRate), skills: skillsList.map((n) => ({ name: n, level: 'intermediate' })) }
      : { bio: form.bio, location: form.location, website: form.website, companyName: form.companyName };
    const result = await dispatch(updateMyProfile(payload));
    if (updateMyProfile.fulfilled.match(result)) { toast.success('Profile updated!'); setEditing(false); }
    else toast.error('Failed to update profile');
  };

  const handle2FAToggle = async () => {
    setTwoFALoading(true);
    try {
      const { data } = await api.put('/auth/2fa/toggle');
      setTwoFAEnabled(data.twoFactorEnabled);
      toast.success(data.twoFactorEnabled ? '2FA enabled! A code will be sent to your email on each login.' : '2FA disabled.');
    } catch { toast.error('Failed to update 2FA'); }
    finally { setTwoFALoading(false); }
  };

  const saveAvailability = async () => {
    setAvailSaving(true);
    const result = await dispatch(updateMyProfile({ availability }));
    if (updateMyProfile.fulfilled.match(result)) toast.success('Availability saved!');
    else toast.error('Failed to save availability');
    setAvailSaving(false);
  };

  const savePortfolioItem = async () => {
    if (!newPortfolio.title.trim()) { toast.error('Title is required'); return; }
    const updated = [...portfolio, newPortfolio];
    const result = await dispatch(updateMyProfile({ portfolio: updated }));
    if (updateMyProfile.fulfilled.match(result)) { setPortfolio(updated); setAddingPortfolio(false); setNewPortfolio(emptyPortfolio); toast.success('Portfolio item added'); }
    else toast.error('Failed to save');
  };

  const removePortfolioItem = async (idx) => {
    const updated = portfolio.filter((_, i) => i !== idx);
    const result = await dispatch(updateMyProfile({ portfolio: updated }));
    if (updateMyProfile.fulfilled.match(result)) { setPortfolio(updated); toast.success('Removed'); }
  };

  const saveCert = async () => {
    if (!newCert.name.trim()) { toast.error('Certification name is required'); return; }
    const updated = [...certs, newCert];
    const result = await dispatch(updateMyProfile({ certifications: updated }));
    if (updateMyProfile.fulfilled.match(result)) { setCerts(updated); setAddingCert(false); setNewCert(emptyCert); toast.success('Certification added'); }
    else toast.error('Failed to save');
  };

  const removeCert = async (idx) => {
    const updated = certs.filter((_, i) => i !== idx);
    const result = await dispatch(updateMyProfile({ certifications: updated }));
    if (updateMyProfile.fulfilled.match(result)) { setCerts(updated); toast.success('Removed'); }
  };

  const saveExp = async () => {
    if (!newExp.title.trim() || !newExp.company.trim()) { toast.error('Title and company are required'); return; }
    const updated = [...experience, newExp];
    const result = await dispatch(updateMyProfile({ experience: updated }));
    if (updateMyProfile.fulfilled.match(result)) { setExperience(updated); setAddingExp(false); setNewExp(emptyExp); toast.success('Experience added'); }
    else toast.error('Failed to save');
  };

  const removeExp = async (idx) => {
    const updated = experience.filter((_, i) => i !== idx);
    const result = await dispatch(updateMyProfile({ experience: updated }));
    if (updateMyProfile.fulfilled.match(result)) { setExperience(updated); toast.success('Removed'); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8" style={{ color: '#0f172a' }}>My Profile</h1>

      {/* Avatar + name card */}
      <div className="p-6 mb-6 flex items-center gap-6" style={card}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 shadow-lg"
          style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 className="text-2xl font-bold" style={{ color: '#0f172a' }}>{user?.name}</h2>
            {isFreelancer && myProfile?.isVerified && (
              <span style={{ background: '#d1fae5', color: '#047857', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '2rem', border: '1px solid #a7f3d0' }}>
                ✓ Verified
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>{user?.email}</p>
          <span className="text-xs px-2 py-1 rounded-full mt-2 inline-block capitalize"
            style={{ background: '#ffedd5', color: '#c2410c' }}>
            {user?.role}
          </span>
        </div>
        <button onClick={() => setEditing((v) => !v)} className="ml-auto text-sm px-4 py-2 rounded-lg font-medium"
          style={editing
            ? { background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }
            : { background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#ffffff' }}>
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {!editing ? (
        <div className="space-y-4">
          {isFreelancer ? (
            <>
              <InfoCard label="Bio" value={myProfile?.bio || 'No bio yet'} />
              <InfoCard label="Location" value={myProfile?.location || 'Not set'} />
              <InfoCard label="Hourly Rate" value={myProfile?.hourlyRate ? `Rs.${myProfile.hourlyRate}/hr` : 'Not set'} />
              <div className="p-5" style={card}>
                <p className="text-sm font-medium mb-3" style={{ color: '#475569' }}>Skills</p>
                {skillsList.length === 0 ? (
                  <p style={{ color: '#94a3b8' }} className="text-sm">No skills added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((s) => (
                      <span key={s} className="text-sm px-3 py-1 rounded-full"
                        style={{ background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa' }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <StatsRow completed={myProfile?.completedJobs || 0} earnings={myProfile?.totalEarnings || 0} score={myProfile?.reputationScore || 0} />
            </>
          ) : (
            <>
              <InfoCard label="Company" value={myProfile?.companyName || 'Not set'} />
              <InfoCard label="Bio" value={myProfile?.bio || 'No bio yet'} />
              <InfoCard label="Location" value={myProfile?.location || 'Not set'} />
              <InfoCard label="Website" value={myProfile?.website || 'Not set'} />
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-5 rounded-2xl" style={card}>
          {!isFreelancer && (
            <div>
              <label style={labelStyle}>Company Name</label>
              <input name="companyName" value={form.companyName} onChange={handleChange} style={inputStyle} placeholder="Your company name" />
            </div>
          )}
          <div>
            <label style={labelStyle}>Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} placeholder="Tell us about yourself..." style={{ ...inputStyle, resize: 'none' }} />
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input name="location" value={form.location} onChange={handleChange} style={inputStyle} placeholder="e.g. Chennai, Tamil Nadu" />
          </div>
          {isFreelancer ? (
            <>
              <div>
                <label style={labelStyle}>Hourly Rate (Rs.)</label>
                <input type="number" name="hourlyRate" value={form.hourlyRate} onChange={handleChange} min={0} style={inputStyle} placeholder="e.g. 500" />
              </div>
              <div>
                <label style={labelStyle}>Skills</label>
                <div className="flex gap-2 mb-2">
                  <input name="skillsInput" value={form.skillsInput} onChange={handleChange} placeholder="e.g. React" style={{ ...inputStyle, flex: 1 }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                  <button type="button" onClick={addSkill} className="px-4 py-2 rounded-lg text-white text-sm"
                    style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((s) => (
                    <span key={s} className="text-sm px-3 py-1 rounded-full flex items-center gap-1"
                      style={{ background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa' }}>
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} style={{ fontSize: '1rem', lineHeight: 1, color: '#dc2626' }}>x</button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <label style={labelStyle}>Website</label>
              <input name="website" value={form.website} onChange={handleChange} style={inputStyle} placeholder="https://yourwebsite.com" />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      )}

      {/* ── Security ── */}
      {!editing && (
        <div style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            🔒 Security
          </h2>
          <div style={{ ...card, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>Two-Factor Authentication</p>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                {twoFAEnabled
                  ? 'On — a 6-digit code will be emailed to you at each login.'
                  : 'Off — enable to receive a one-time code by email when you log in.'}
              </p>
            </div>
            <button
              onClick={handle2FAToggle}
              disabled={twoFALoading}
              style={{
                minWidth: '80px', padding: '0.5rem 1.25rem', borderRadius: '2rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', border: 'none', flexShrink: 0,
                background: twoFAEnabled ? '#fee2e2' : 'linear-gradient(135deg,#ea580c,#f97316)',
                color: twoFAEnabled ? '#dc2626' : '#ffffff',
                opacity: twoFALoading ? 0.6 : 1,
              }}
            >
              {twoFALoading ? '...' : twoFAEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      )}

      {/* ── Portfolio (freelancers only) ── */}
      {isFreelancer && !editing && (
        <>
          <Section
            title="Portfolio"
            emoji="🖼️"
            onAdd={() => setAddingPortfolio((v) => !v)}
            adding={addingPortfolio}
          >
            {addingPortfolio && (
              <div style={{ ...card, padding: '1.25rem', marginBottom: '1rem', background: '#fffbf5' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Project Title *</label>
                    <input value={newPortfolio.title} onChange={(e) => setNewPortfolio((f) => ({ ...f, title: e.target.value }))} placeholder="My awesome project" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Project URL</label>
                    <input value={newPortfolio.projectUrl} onChange={(e) => setNewPortfolio((f) => ({ ...f, projectUrl: e.target.value }))} placeholder="https://..." style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea value={newPortfolio.description} onChange={(e) => setNewPortfolio((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe what you built..." style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={savePortfolioItem} disabled={loading} style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                    Save
                  </button>
                  <button onClick={() => { setAddingPortfolio(false); setNewPortfolio(emptyPortfolio); }} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {portfolio.length === 0 && !addingPortfolio ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No portfolio items yet. Add your best work!</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {portfolio.map((item, i) => (
                  <div key={i} style={{ ...card, padding: '1rem', position: 'relative' }}>
                    <button onClick={() => removePortfolioItem(i)} style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.35rem' }}>{item.title}</p>
                    {item.description && <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{item.description}</p>}
                    {item.projectUrl && (
                      <a href={item.projectUrl} target="_blank" rel="noreferrer" style={{ color: '#ea580c', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>
                        View Project →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Certifications ── */}
          <Section title="Certifications" emoji="🏆" onAdd={() => setAddingCert((v) => !v)} adding={addingCert}>
            {addingCert && (
              <div style={{ ...card, padding: '1.25rem', marginBottom: '1rem', background: '#fffbf5' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Certification Name *</label>
                    <input value={newCert.name} onChange={(e) => setNewCert((f) => ({ ...f, name: e.target.value }))} placeholder="AWS Solutions Architect" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Issuing Organization</label>
                    <input value={newCert.issuer} onChange={(e) => setNewCert((f) => ({ ...f, issuer: e.target.value }))} placeholder="Amazon / Google / etc." style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Year</label>
                    <input type="number" value={newCert.year} onChange={(e) => setNewCert((f) => ({ ...f, year: Number(e.target.value) }))} style={inputStyle} min={2000} max={2099} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={saveCert} disabled={loading} style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Save</button>
                  <button onClick={() => { setAddingCert(false); setNewCert(emptyCert); }} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                </div>
              </div>
            )}
            {certs.length === 0 && !addingCert ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No certifications added yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {certs.map((cert, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#fffbf5', border: '1px solid #fed7aa', borderRadius: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>🎖️</span>
                      <div>
                        <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem', margin: 0 }}>{cert.name}</p>
                        <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0.1rem 0 0' }}>{cert.issuer} • {cert.year}</p>
                      </div>
                    </div>
                    <button onClick={() => removeCert(i)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Availability Scheduler ── */}
          <div style={{ marginTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              📅 Availability Schedule
            </h2>
            <div style={{ ...card, padding: '1.25rem' }}>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>
                Set which days and hours you're available for new projects.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {availability.map((slot, i) => (
                  <div key={slot.day} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '0.6rem', background: slot.available ? '#fff7ed' : '#f8fafc', border: `1px solid ${slot.available ? '#fed7aa' : '#e2e8f0'}` }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none', minWidth: '100px' }}>
                      <input type="checkbox" checked={slot.available}
                        onChange={(e) => setAvailability((prev) => prev.map((s, j) => j === i ? { ...s, available: e.target.checked } : s))}
                        style={{ accentColor: '#ea580c', width: '14px', height: '14px' }}
                      />
                      <span style={{ fontWeight: 600, fontSize: '0.82rem', color: slot.available ? '#0f172a' : '#94a3b8' }}>{slot.day}</span>
                    </label>
                    {slot.available ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
                        <input type="time" value={slot.from}
                          onChange={(e) => setAvailability((prev) => prev.map((s, j) => j === i ? { ...s, from: e.target.value } : s))}
                          style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '0.4rem', padding: '0.25rem 0.4rem', fontSize: '0.8rem', color: '#334155', outline: 'none' }}
                        />
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>to</span>
                        <input type="time" value={slot.to}
                          onChange={(e) => setAvailability((prev) => prev.map((s, j) => j === i ? { ...s, to: e.target.value } : s))}
                          style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '0.4rem', padding: '0.25rem 0.4rem', fontSize: '0.8rem', color: '#334155', outline: 'none' }}
                        />
                      </div>
                    ) : (
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94a3b8' }}>Not available</span>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={saveAvailability} disabled={availSaving}
                style={{ marginTop: '1rem', background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.55rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', opacity: availSaving ? 0.7 : 1 }}>
                {availSaving ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>

          {/* ── Work Experience ── */}
          <Section title="Work Experience" emoji="💼" onAdd={() => setAddingExp((v) => !v)} adding={addingExp}>
            {addingExp && (
              <div style={{ ...card, padding: '1.25rem', marginBottom: '1rem', background: '#fffbf5' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Job Title *</label>
                    <input value={newExp.title} onChange={(e) => setNewExp((f) => ({ ...f, title: e.target.value }))} placeholder="Senior Developer" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Company *</label>
                    <input value={newExp.company} onChange={(e) => setNewExp((f) => ({ ...f, company: e.target.value }))} placeholder="Tech Corp" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>From</label>
                    <input type="date" value={newExp.from} onChange={(e) => setNewExp((f) => ({ ...f, from: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>To (leave blank if current)</label>
                    <input type="date" value={newExp.to} onChange={(e) => setNewExp((f) => ({ ...f, to: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea value={newExp.description} onChange={(e) => setNewExp((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="What did you do?" style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={saveExp} disabled={loading} style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Save</button>
                  <button onClick={() => { setAddingExp(false); setNewExp(emptyExp); }} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                </div>
              </div>
            )}
            {experience.length === 0 && !addingExp ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No work experience added yet.</p>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: '#fed7aa', borderRadius: '1px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {experience.map((exp, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-1.5rem', top: '1rem', width: '12px', height: '12px', borderRadius: '50%', background: '#ea580c', border: '2px solid #fff', boxShadow: '0 0 0 2px #fed7aa' }} />
                      <div style={{ ...card, padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div>
                            <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', margin: 0 }}>{exp.title}</p>
                            <p style={{ color: '#ea580c', fontSize: '0.8rem', margin: '0.15rem 0 0', fontWeight: 600 }}>{exp.company}</p>
                            <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '0.1rem 0 0' }}>
                              {exp.from ? new Date(exp.from).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                              {' — '}
                              {exp.to ? new Date(exp.to).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Present'}
                            </p>
                            {exp.description && <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.4rem' }}>{exp.description}</p>}
                          </div>
                          <button onClick={() => removeExp(i)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, emoji, onAdd, adding, children }) {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{emoji}</span> {title}
        </h2>
        <button onClick={onAdd} style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.35rem 0.9rem', borderRadius: '2rem', cursor: 'pointer', background: adding ? '#f1f5f9' : '#ffedd5', color: adding ? '#334155' : '#c2410c', border: adding ? '1px solid #e2e8f0' : '1px solid #fed7aa' }}>
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>
      <div style={{ ...card, padding: '1.25rem' }}>
        {children}
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="p-5 flex justify-between items-center" style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' }}>
      <span className="text-sm" style={{ color: '#64748b' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: '#0f172a' }}>{value}</span>
    </div>
  );
}

function StatsRow({ completed, earnings, score }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Completed Jobs', value: completed, color: '#059669' },
        { label: 'Total Earnings', value: `Rs.${earnings.toLocaleString()}`, color: '#ea580c' },
        { label: 'Reputation Score', value: score, color: '#b45309' },
      ].map(({ label, value, color }) => (
        <div key={label} className="p-4 text-center" style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(234,88,12,0.06)' }}>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>{label}</p>
        </div>
      ))}
    </div>
  );
}
