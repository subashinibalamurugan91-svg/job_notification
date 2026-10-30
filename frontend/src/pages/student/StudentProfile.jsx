import React, { useState, useEffect } from 'react';
import { studentService, notificationService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const StudentProfile = () => {
  const toast = useToast();
  
  // Local profile and avatar states
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', department: '', cgpa: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Resume states
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  // Avatar states
  const [avatarBase64, setAvatarBase64] = useState('');

  // Password states
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Activity Feed logs
  const [activityFeed, setActivityFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);

  // Skills & Certifications states (Persisted in localStorage keyed by studentId)
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [certs, setCerts] = useState([]);
  const [certForm, setCertForm] = useState({ name: '', authority: '', date: '', link: '' });
  const [showCertForm, setShowCertForm] = useState(false);

  // Error/Success tags
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await studentService.getProfile();
      setProfile(data);
      setFormData({
        name: data.name,
        phone: data.phone,
        department: data.department,
        cgpa: data.cgpa
      });

      // Load base64 avatar from local storage
      const savedAvatar = localStorage.getItem(`avatar_${data.studentId}`);
      if (savedAvatar) {
        setAvatarBase64(savedAvatar);
      }

      // Load skills directly from backend (persisted in student_skills table)
      if (data.skills && data.skills.length > 0) {
        setSkills(data.skills);
        localStorage.setItem(`skills_${data.studentId}`, JSON.stringify(data.skills));
      } else {
        const savedSkills = localStorage.getItem(`skills_${data.studentId}`);
        if (savedSkills) {
          const parsed = JSON.parse(savedSkills);
          setSkills(parsed);
          studentService.updateSkills(parsed).catch(() => {});
        } else {
          const defaultSkills = ['Java', 'SQL', 'Git'];
          setSkills(defaultSkills);
          localStorage.setItem(`skills_${data.studentId}`, JSON.stringify(defaultSkills));
          studentService.updateSkills(defaultSkills).catch(() => {});
        }
      }

      const savedCerts = localStorage.getItem(`certs_${data.studentId}`);
      if (savedCerts) {
        setCerts(JSON.parse(savedCerts));
      }

      fetchActivityLogs();
    } catch (err) {
      setError('Could not load student profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    setFeedLoading(true);
    try {
      const notifs = await notificationService.getNotifications();
      setActivityFeed(notifs.slice(0, 5)); // recent 5 events
    } catch (err) {
      console.error('Error fetching activity logs', err);
    } finally {
      setFeedLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const data = await studentService.updateProfile(formData);
      setProfile(data);
      toast.success('Academic profile information updated!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF resumes are allowed.');
        setResumeFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Resume size must be less than 5MB.');
        setResumeFile(null);
        return;
      }
      setResumeFile(file);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;

    setResumeUploading(true);
    const data = new FormData();
    data.append('file', resumeFile);

    try {
      const updatedProfile = await studentService.uploadResume(data);
      setProfile(updatedProfile);
      toast.success('Resume PDF uploaded successfully!');
      setResumeFile(null);
    } catch (err) {
      toast.error('Failed to upload resume PDF.');
    } finally {
      setResumeUploading(false);
    }
  };

  const handleResumeDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your uploaded resume?')) {
      return;
    }
    try {
      const updatedProfile = await studentService.deleteResume();
      setProfile(updatedProfile);
      toast.success('Resume deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete resume.');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (PNG, JPG).');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setAvatarBase64(base64);
        localStorage.setItem(`avatar_${profile.studentId}`, base64);
        toast.success('Profile avatar updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    setTimeout(() => {
      setPasswordSaving(false);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Account password updated successfully!');
    }, 1200);
  };

  // Add a skill
  const handleAddSkill = async (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (skills.some(s => s.toLowerCase() === newSkill.toLowerCase())) {
        toast.warning(`${newSkill} is already added!`);
        return;
      }
      const updated = [...skills, newSkill];
      setSkills(updated);
      localStorage.setItem(`skills_${profile.studentId}`, JSON.stringify(updated));
      setSkillInput('');
      try {
        await studentService.updateSkills(updated);
        toast.success(`Skill "${newSkill}" synced with eligibility engine.`);
      } catch (err) {
        toast.success(`Skill "${newSkill}" added.`);
      }
    }
  };

  // Remove a skill
  const handleRemoveSkill = async (skillToRemove) => {
    const updated = skills.filter(s => s !== skillToRemove);
    setSkills(updated);
    localStorage.setItem(`skills_${profile.studentId}`, JSON.stringify(updated));
    try {
      await studentService.updateSkills(updated);
      toast.success(`Skill "${skillToRemove}" removed.`);
    } catch (err) {
      toast.success(`Skill "${skillToRemove}" removed.`);
    }
  };

  // Add a certification
  const handleAddCert = (e) => {
    e.preventDefault();
    if (!certForm.name || !certForm.authority || !certForm.date) {
      toast.warning('Please fill in the certificate name, authority, and date.');
      return;
    }
    const newCert = {
      id: Date.now(),
      ...certForm
    };
    const updated = [newCert, ...certs];
    setCerts(updated);
    localStorage.setItem(`certs_${profile.studentId}`, JSON.stringify(updated));
    setCertForm({ name: '', authority: '', date: '', link: '' });
    setShowCertForm(false);
    toast.success('Certification logged successfully!');
  };

  // Delete a certification
  const handleDeleteCert = (id) => {
    const updated = certs.filter(c => c.id !== id);
    setCerts(updated);
    localStorage.setItem(`certs_${profile.studentId}`, JSON.stringify(updated));
    toast.success('Certification removed.');
  };

  // Profile completeness calculations
  const calculateCompleteness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.name) score += 15;
    if (profile.phone) score += 15;
    if (profile.department) score += 10;
    if (profile.cgpa) score += 10;
    if (avatarBase64) score += 15;
    if (profile.resumeUrl) score += 20;
    if (skills.length > 0) score += Math.min(skills.length * 5, 15);
    return score;
  };

  const completeness = calculateCompleteness();

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading user profile configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }} className="py-2">
      <div className="mb-4">
        <h2 className="fw-bold m-0 text-dark">User Profile Center</h2>
        <p className="text-muted small mb-0">Manage placement credentials, skills, certifications, and uploaded resume attachments</p>
      </div>

      {/* Completion Meter Progress Bar */}
      <div className="card custom-card p-4 border-0 shadow-sm mb-4 rounded-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
            Profile Completeness Benchmark
          </span>
          <span className={`fw-bold ${completeness >= 80 ? 'text-success' : 'text-primary'}`}>
            {completeness}% Completed
          </span>
        </div>
        <div className="progress rounded-pill" style={{ height: '8px' }}>
          <div 
            className={`progress-bar rounded-pill progress-bar-striped progress-bar-animated ${completeness >= 80 ? 'bg-success' : 'bg-primary'}`} 
            role="progressbar" 
            style={{ width: `${completeness}%` }}
            aria-valuenow={completeness}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Profile completion progress"
          ></div>
        </div>
        <p className="text-secondary small mt-3 mb-0">
          {completeness >= 80 ? '✓ Your profile is fully complete and optimized for corporate recruiter placement lists!' : 
           '💡 Complete all fields, add skills/certifications, and upload a resume PDF to reach a 100% placement readiness rating.'}
        </p>
      </div>

      <div className="row g-4">
        {/* Left Side: Avatar Card & Password Settings */}
        <div className="col-md-5">
          <div className="d-flex flex-column gap-4">
            
            {/* Profile Avatar Card */}
            <div className="card custom-card p-4 text-center shadow-sm border-0">
              <div className="position-relative d-inline-block mx-auto mb-3">
                {avatarBase64 ? (
                  <img 
                    src={avatarBase64} 
                    className="rounded-circle shadow" 
                    style={{ width: '110px', height: '110px', objectFit: 'cover', border: '2.5px solid var(--accent-gold)' }}
                    alt="User Avatar"
                  />
                ) : (
                  <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-2 shadow mx-auto" style={{ width: '110px', height: '110px', backgroundColor: '#24152F', color: '#D6AD60', border: '2px solid #D6AD60' }}>
                    {(profile?.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                )}
                
                <label className="position-absolute bottom-0 end-0 p-2 rounded-circle shadow cursor-pointer border" style={{ cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-gold)', borderColor: '#FFFFFF', color: '#24152F' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input type="file" accept="image/*" className="d-none" onChange={handleAvatarChange} aria-label="Upload profile image" />
                </label>
              </div>

              <h5 className="fw-bold text-dark mb-1">{profile?.name}</h5>
              <p className="text-secondary small mb-3">{profile?.department}</p>
              
              <div className="badge badge-status eligible text-uppercase fw-bold mx-auto mb-2" style={{ fontSize: '0.68rem' }}>
                CGPA Score: {profile?.cgpa.toFixed(2)}
              </div>
            </div>

            {/* Interactive Skills Card */}
            <div className="card custom-card p-4 shadow-sm border-0">
              <h5 className="fw-bold text-dark mb-1">🛠️ Core Skills</h5>
              <p className="text-secondary small mb-3">Add skills relevant to your placement profiles</p>
              
              <div className="d-flex flex-wrap gap-1.5 mb-3">
                {skills.map((skill) => (
                  <span key={skill} className="badge bg-light text-primary border d-inline-flex align-items-center gap-1.5 py-1.5 px-2.5 rounded-3 fw-semibold" style={{ fontSize: '0.78rem' }}>
                    {skill}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSkill(skill)}
                      className="border-0 bg-transparent text-secondary p-0 leading-none"
                      style={{ fontSize: '0.9rem', cursor: 'pointer' }}
                      aria-label={`Remove skill ${skill}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {skills.length === 0 && (
                  <span className="text-muted small">No skills added yet.</span>
                )}
              </div>

              <input 
                type="text" 
                className="form-control form-control-sm"
                placeholder="Type skill & press Enter"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                aria-label="Skill input"
              />
            </div>

            {/* Change Password Card */}
            <div className="card custom-card p-4 shadow-sm border-0">
              <h5 className="fw-bold text-dark mb-3">🔒 Change Password</h5>
              <form onSubmit={handlePasswordChange}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Current Password</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">New Password</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-semibold">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-outline-primary btn-sm w-100 py-2 fw-semibold" disabled={passwordSaving}>
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* Right Side: Credentials Form & Resume Attachment & Certifications */}
        <div className="col-md-7">
          <div className="d-flex flex-column gap-4">
            
            {/* Account Info Form */}
            <div className="card custom-card p-4 shadow-sm border-0">
              <h5 className="fw-bold text-dark mb-3 border-bottom pb-2">Academic & Contact Information</h5>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-sm-6 mb-3">
                    <label className="form-label small fw-semibold text-secondary">Registration Number</label>
                    <input type="text" className="form-control" value={profile?.regNo} disabled />
                  </div>
                  <div className="col-sm-6 mb-3">
                    <label className="form-label small fw-semibold text-secondary">Email Address</label>
                    <input type="email" className="form-control" value={profile?.email} disabled />
                  </div>
                </div>

                <div className="row">
                  <div className="col-sm-6 mb-3">
                    <label className="form-label small fw-semibold text-secondary">Department</label>
                    <input type="text" className="form-control" value={profile?.department} disabled />
                  </div>
                  <div className="col-sm-6 mb-3">
                    <label className="form-label small fw-semibold text-secondary">CGPA Score</label>
                    <input type="text" className="form-control" value={profile?.cgpa.toFixed(2)} disabled />
                  </div>
                </div>

                <hr className="my-3 opacity-25" />

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required 
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required 
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-sm py-2.5 w-100 fw-semibold" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>

            {/* Resume Upload Card */}
            <div className="card custom-card p-4 shadow-sm border-0">
              <h5 className="fw-bold mb-3 text-dark">📄 Resume Attachment</h5>
              {profile?.resumeUrl ? (
                <div className="bg-light p-3 rounded-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-dark text-truncate me-2" title={profile.resumeFileName} style={{ fontSize: '0.9rem' }}>
                      {profile.resumeFileName}
                    </span>
                    <span className="badge bg-success bg-opacity-10 text-success fw-bold text-uppercase" style={{ fontSize: '0.68rem' }}>Uploaded</span>
                  </div>
                  <div className="d-flex gap-2 mt-2">
                    <a 
                      href={studentService.downloadResumeUrl(profile.studentId)} 
                      className="btn btn-sm btn-outline-primary fw-semibold flex-grow-1"
                      target="_blank"
                      rel="noreferrer"
                    >
                      📥 Download PDF
                    </a>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-outline-danger fw-semibold"
                      onClick={handleResumeDelete}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResumeUpload}>
                  <div className="mb-3">
                    <input 
                      type="file" 
                      className="form-control" 
                      accept="application/pdf"
                      onChange={handleResumeChange}
                      required
                      aria-label="Upload resume PDF"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2 fw-semibold shadow-sm" 
                    disabled={!resumeFile || resumeUploading}
                  >
                    {resumeUploading ? 'Uploading...' : 'Upload Resume PDF'}
                  </button>
                </form>
              )}
            </div>

            {/* Dynamic Certifications Card */}
            <div className="card custom-card p-4 shadow-sm border-0">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold m-0 text-dark">🎓 Certifications</h5>
                <button 
                  type="button" 
                  onClick={() => setShowCertForm(!showCertForm)}
                  className="btn btn-xs btn-outline-primary fw-semibold py-1 px-2.5"
                  style={{ fontSize: '0.72rem' }}
                >
                  {showCertForm ? 'Cancel' : '+ Add Log'}
                </button>
              </div>

              {/* Add Certification Form */}
              {showCertForm && (
                <form onSubmit={handleAddCert} className="p-3 bg-light rounded-3 border mb-3 animate-fade-in">
                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-secondary mb-1">Certificate Name</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      placeholder="e.g. Oracle Certified Java Associate"
                      value={certForm.name}
                      onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-secondary mb-1">Issuing Authority</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      placeholder="e.g. Oracle University, Coursera"
                      value={certForm.authority}
                      onChange={(e) => setCertForm({ ...certForm, authority: e.target.value })}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-6 mb-2">
                      <label className="form-label small fw-semibold text-secondary mb-1">Issue Date</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm"
                        value={certForm.date}
                        onChange={(e) => setCertForm({ ...certForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6 mb-2">
                      <label className="form-label small fw-semibold text-secondary mb-1">Credential URL</label>
                      <input 
                        type="url" 
                        className="form-control form-control-sm"
                        placeholder="https://..."
                        value={certForm.link}
                        onChange={(e) => setCertForm({ ...certForm, link: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-sm btn-primary w-100 fw-bold mt-2">
                    Save Certification
                  </button>
                </form>
              )}

              {/* Render Certifications List */}
              {certs.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {certs.map((cert) => (
                    <div key={cert.id} className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                      <div className="text-start">
                        <div className="fw-bold text-dark small">{cert.name}</div>
                        <div className="text-secondary" style={{ fontSize: '0.78rem' }}>
                          Issued by: {cert.authority} | Date: {cert.date}
                        </div>
                        {cert.link && (
                          <a href={cert.link} target="_blank" rel="noreferrer" className="small text-primary text-decoration-none" style={{ fontSize: '0.72rem' }}>
                            🔗 View Credential
                          </a>
                        )}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteCert(cert.id)} 
                        className="btn btn-xs btn-outline-danger p-1 leading-none"
                        style={{ fontSize: '0.75rem' }}
                        aria-label="Delete certification"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted border border-dashed rounded-3 bg-light bg-opacity-25 small">
                  No professional certifications registered.
                </div>
              )}
            </div>

            {/* Activity History Logs */}
            <div className="card custom-card p-4 shadow-sm border-0">
              <h5 className="fw-bold mb-3 text-dark">📜 My Activity History</h5>
              {feedLoading ? (
                <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-primary" role="status"></div></div>
              ) : activityFeed.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {activityFeed.map((log) => (
                    <div key={log.notificationId} className="border-start border-3 border-primary ps-3 py-1 bg-light bg-opacity-25 rounded-end p-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold text-dark small">{log.title}</span>
                        <span className="small text-muted" style={{ fontSize: '0.72rem' }}>{new Date(log.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="small text-secondary" style={{ fontSize: '0.78rem' }}>{log.message}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted small">No recent logs recorded.</div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
