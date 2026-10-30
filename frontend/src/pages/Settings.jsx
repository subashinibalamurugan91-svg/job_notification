import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const Settings = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('notifications');
  
  // Theme state
  const [themeMode, setThemeMode] = useState(localStorage.getItem('theme') || 'light');

  // Notifications preferences
  const [notifs, setNotifs] = useState({
    emailAnnouncements: true,
    emailInterviews: true,
    dashboardAlerts: true,
    smsAlerts: false
  });

  // Account Preferences
  const [sessionTimeout, setSessionTimeout] = useState('30'); // minutes

  useEffect(() => {
    if (themeMode === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [themeMode]);

  const handleToggleTheme = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('theme', mode);
    toast.success(`Theme mode updated to ${mode.toUpperCase()}!`);
  };

  const handleCheckboxChange = (e) => {
    setNotifs({ ...notifs, [e.target.name]: e.target.checked });
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    localStorage.setItem('notif_prefs', JSON.stringify(notifs));
    toast.success('Notification preferences updated successfully!');
  };

  const handleSaveAccountSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('session_timeout', sessionTimeout);
    toast.success('Security configurations updated successfully!');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="mb-4">
        <h2 className="fw-bold m-0 text-dark">Portal System Settings</h2>
        <p className="text-muted small mb-0">Configure notification logs, system theme, and account session controls</p>
      </div>

      <div className="row g-4">
        {/* Left Side Tab Sorters */}
        <div className="col-md-4">
          <div className="card custom-card p-3 shadow-sm border-0 d-flex flex-column gap-2">
            <button 
              className={`btn btn-sm text-start py-2.5 px-3 border-0 fw-semibold rounded-3 ${activeTab === 'notifications' ? 'btn-primary text-white shadow-sm' : 'text-secondary bg-transparent'}`}
              onClick={() => setActiveTab('notifications')}
            >
              🔔 Notifications
            </button>
            <button 
              className={`btn btn-sm text-start py-2.5 px-3 border-0 fw-semibold rounded-3 ${activeTab === 'theme' ? 'btn-primary text-white shadow-sm' : 'text-secondary bg-transparent'}`}
              onClick={() => setActiveTab('theme')}
            >
              🎨 Theme Preferences
            </button>
            <button 
              className={`btn btn-sm text-start py-2.5 px-3 border-0 fw-semibold rounded-3 ${activeTab === 'security' ? 'btn-primary text-white shadow-sm' : 'text-secondary bg-transparent'}`}
              onClick={() => setActiveTab('security')}
            >
              🔒 Security Settings
            </button>
          </div>
        </div>

        {/* Right Side Content Panel */}
        <div className="col-md-8">
          <div className="card custom-card p-4 shadow-sm border-0">
            {activeTab === 'notifications' && (
              <form onSubmit={handleSaveNotifications}>
                <h5 className="fw-bold text-dark mb-3">Notification Preferences</h5>
                <p className="text-muted small mb-4">Choose how you wish to receive updates regarding drives, interview shortlists, and test schedules.</p>

                <div className="d-flex flex-column gap-3 mb-4">
                  <div className="form-check form-switch d-flex justify-content-between align-items-center p-0">
                    <label className="form-check-label small fw-semibold text-secondary" htmlFor="emailAnnouncements">Email Placement Announcements</label>
                    <input 
                      className="form-check-input ms-0" 
                      type="checkbox" 
                      role="switch" 
                      name="emailAnnouncements" 
                      id="emailAnnouncements"
                      checked={notifs.emailAnnouncements}
                      onChange={handleCheckboxChange}
                    />
                  </div>
                  <div className="form-check form-switch d-flex justify-content-between align-items-center p-0">
                    <label className="form-check-label small fw-semibold text-secondary" htmlFor="emailInterviews">Email Interview Call Letters</label>
                    <input 
                      className="form-check-input ms-0" 
                      type="checkbox" 
                      role="switch" 
                      name="emailInterviews" 
                      id="emailInterviews"
                      checked={notifs.emailInterviews}
                      onChange={handleCheckboxChange}
                    />
                  </div>
                  <div className="form-check form-switch d-flex justify-content-between align-items-center p-0">
                    <label className="form-check-label small fw-semibold text-secondary" htmlFor="dashboardAlerts">Real-time Dashboard Notifications</label>
                    <input 
                      className="form-check-input ms-0" 
                      type="checkbox" 
                      role="switch" 
                      name="dashboardAlerts" 
                      id="dashboardAlerts"
                      checked={notifs.dashboardAlerts}
                      onChange={handleCheckboxChange}
                    />
                  </div>
                  <div className="form-check form-switch d-flex justify-content-between align-items-center p-0">
                    <label className="form-check-label small fw-semibold text-secondary" htmlFor="smsAlerts">SMS Drive Reminder Messages</label>
                    <input 
                      className="form-check-input ms-0" 
                      type="checkbox" 
                      role="switch" 
                      name="smsAlerts" 
                      id="smsAlerts"
                      checked={notifs.smsAlerts}
                      onChange={handleCheckboxChange}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary px-4 fw-semibold shadow-sm w-100">
                  Save Notification Preferences
                </button>
              </form>
            )}

            {activeTab === 'theme' && (
              <div>
                <h5 className="fw-bold text-dark mb-3">Portal Theme Preferences</h5>
                <p className="text-muted small mb-4">Toggle between Light and Dark interface modes according to your preferences.</p>

                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <div 
                      onClick={() => handleToggleTheme('light')}
                      className={`p-4 rounded-3 border text-center cursor-pointer transition-all ${themeMode === 'light' ? 'shadow-sm' : ''}`}
                      style={{ 
                        cursor: 'pointer',
                        borderColor: themeMode === 'light' ? 'var(--accent-gold)' : 'var(--border-color)',
                        backgroundColor: themeMode === 'light' ? 'rgba(214, 173, 96, 0.08)' : 'var(--card-bg)'
                      }}
                    >
                      <div className="fs-1 mb-2">☀️</div>
                      <div className="fw-bold text-dark small">Light Mode (Signature)</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div 
                      onClick={() => handleToggleTheme('dark')}
                      className={`p-4 rounded-3 border text-center cursor-pointer transition-all ${themeMode === 'dark' ? 'shadow-sm' : ''}`}
                      style={{ 
                        cursor: 'pointer',
                        borderColor: themeMode === 'dark' ? 'var(--accent-gold)' : 'var(--border-color)',
                        backgroundColor: themeMode === 'dark' ? 'rgba(58, 37, 71, 0.2)' : 'var(--card-bg)'
                      }}
                    >
                      <div className="fs-1 mb-2">🌙</div>
                      <div className="fw-bold text-dark small">Midnight Dark Mode</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleSaveAccountSettings}>
                <h5 className="fw-bold text-dark mb-3">Security & Account Configuration</h5>
                <p className="text-muted small mb-4">Configure session expiration times and sign-in protection flags.</p>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">Auto Logout Session Timeout</label>
                  <select 
                    className="form-select"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                  >
                    <option value="15">15 Minutes (High Security)</option>
                    <option value="30">30 Minutes (Recommended)</option>
                    <option value="60">60 Minutes</option>
                    <option value="120">2 Hours</option>
                  </select>
                  <div className="form-text small text-muted" style={{ fontSize: '0.72rem' }}>You will be logged out automatically after this period of inactivity.</div>
                </div>

                <button type="submit" className="btn btn-primary px-4 fw-semibold shadow-sm w-100">
                  Save Security Config
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
