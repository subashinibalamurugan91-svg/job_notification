import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';
import GlobalSearch from '../components/GlobalSearch';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [themeMode, setThemeMode] = useState(localStorage.getItem('theme') || 'light');
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count for students periodically
  useEffect(() => {
    const fetchUnread = async () => {
      if (user && user.role === 'STUDENT') {
        try {
          const data = await notificationService.getUnreadCount();
          setUnreadCount(data.count);
        } catch (e) {
          console.error('Error fetching unread count', e);
        }
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Monitor session timeout based on JWT token exp claim
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expTime = payload.exp * 1000;
      
      const interval = setInterval(() => {
        if (Date.now() >= expTime) {
          clearInterval(interval);
          logout();
          navigate('/login');
          alert('Security Session Expired! Please sign in again.');
        }
      }, 10000);
      return () => clearInterval(interval);
    } catch (err) {
      console.error('Error checking token expiration', err);
    }
  }, [user, navigate, logout]);

  // Sync theme mode variables on load
  useEffect(() => {
    if (themeMode === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [themeMode]);

  const toggleTheme = () => {
    const target = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(target);
    localStorage.setItem('theme', target);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Modern Enterprise SaaS Icon Set (Consistent 20x20 viewBox, strokeWidth 1.8)
  const icons = {
    dashboard: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
    students: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    companies: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    eligibility: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    applications: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    interviews: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    placedStudents: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5" />
      </svg>
    ),
    reports: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    references: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    settings: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    calendar: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    announcements: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    auditLogs: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    profile: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 19, height: 19 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  };

  // 5. Sidebar Redesign: Exact ordered sections for Placement Officer
  const adminMainLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: icons.dashboard },
    { to: '/admin/students', label: 'Students', icon: icons.students },
    { to: '/admin/companies', label: 'Companies', icon: icons.companies },
    { to: '/admin/eligibility', label: 'Eligibility', icon: icons.eligibility },
    { to: '/admin/applications', label: 'Applications', icon: icons.applications },
    { to: '/admin/interviews', label: 'Interviews', icon: icons.interviews },
    { to: '/admin/placed-students', label: 'Placed Students', icon: icons.placedStudents },
    { to: '/admin/reports', label: 'Reports', icon: icons.reports },
    { to: '/admin/references', label: 'References', icon: icons.references },
    { to: '/admin/settings', label: 'Settings', icon: icons.settings }
  ];

  // Additional Operations links preserved so NO functionality is lost
  const adminOperationsLinks = [
    { to: '/admin/calendar', label: 'Calendar', icon: icons.calendar },
    { to: '/admin/announcements', label: 'Announcements', icon: icons.announcements },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: icons.auditLogs }
  ];

  // Student Navigation Links
  const studentMainLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: icons.dashboard },
    { to: '/student/profile', label: 'My Profile', icon: icons.profile },
    { to: '/student/companies', label: 'Companies', icon: icons.companies },
    { to: '/student/eligibility', label: 'Eligibility', icon: icons.eligibility },
    { to: '/student/applications', label: 'Applications', icon: icons.applications },
    { to: '/student/interviews', label: 'Interviews', icon: icons.interviews },
    { to: '/student/calendar', label: 'Calendar', icon: icons.calendar },
    { to: '/student/references', label: 'References', icon: icons.references },
    { to: '/student/notifications', label: 'Notifications', icon: icons.announcements },
    { to: '/student/settings', label: 'Settings', icon: icons.settings }
  ];

  const savedAvatar = localStorage.getItem(`avatar_${user?.id}`) || '';

  // Current page title lookup for breadcrumb
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Executive Dashboard';
    if (path.includes('/students')) return 'Candidate Talent Pool';
    if (path.includes('/companies')) return 'Corporate Recruiters & Drives';
    if (path.includes('/eligibility')) return 'Intelligent Eligibility Module';
    if (path.includes('/applications')) return 'Recruitment Applications';
    if (path.includes('/interviews')) return 'Interview Schedules';
    if (path.includes('/placed-students')) return 'Placed Candidates Analytics';
    if (path.includes('/reports')) return 'Reports & Analytics Center';
    if (path.includes('/references')) return 'Preparation References Library';
    if (path.includes('/settings')) return 'System Settings';
    if (path.includes('/calendar')) return 'Recruitment Calendar';
    if (path.includes('/notifications')) return 'Notification Center';
    if (path.includes('/profile')) return 'Student Profile & Portfolio';
    return 'Campus Recruitment System';
  };

  return (
    <div className="app-layout">
      {/* Sidebar (Midnight Plum #24152F & Champagne Gold #D6AD60) */}
      <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-left">
            <div 
              className="sidebar-brand-icon" 
              onClick={() => isCollapsed && setIsCollapsed(false)} 
              style={isCollapsed ? { cursor: 'pointer' } : undefined}
              title={isCollapsed ? "Click to expand sidebar" : undefined}
            >
              <span>CR</span>
            </div>
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-title">
                <span className="brand-title-line">Campus</span>
                <span className="brand-title-line gold-accent">Recruit</span>
              </div>
              <span className="sidebar-subtext">PLACEMENT PORTAL</span>
            </div>
          </div>
          <button 
            className="collapse-btn d-none d-md-flex" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle Sidebar"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
        </div>
        
        {/* Navigation list with elegant Champagne Gold active indicator */}
        <nav className="flex-grow-1 py-2 overflow-y-auto">
          <div className="sidebar-section-title">Main Navigation</div>
          {(user?.role === 'ADMIN' ? adminMainLinks : studentMainLinks).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="icon-wrapper me-2.5">{link.icon}</span>
              <span className="text-truncate">{link.label}</span>
              {link.label === 'Notifications' && unreadCount > 0 && (
                <span className="badge rounded-pill ms-auto px-1.5 py-0.5 badge-unread-notif" style={{ fontSize: '0.65rem', minWidth: '18px' }}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}

          {/* Secondary Operations section for admin */}
          {user?.role === 'ADMIN' && (
            <>
              <div className="sidebar-section-title mt-2">Operations & Logs</div>
              {adminOperationsLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span className="icon-wrapper me-2.5">{link.icon}</span>
                  <span className="text-truncate">{link.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User profile & Sign Out footer */}
        <div className="p-3 border-top" style={{ backgroundColor: 'rgba(0,0,0,0.24)', borderColor: 'rgba(229,221,233,0.1)' }}>
          <div className="d-flex align-items-center mb-2.5 user-profile-info">
            {savedAvatar ? (
              <img 
                src={savedAvatar} 
                className="rounded-circle me-2.5 shadow-sm" 
                style={{ width: '36px', height: '36px', objectFit: 'cover', flexShrink: 0, border: '1.5px solid var(--accent-gold)' }}
                alt="Profile Avatar"
              />
            ) : (
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-2.5 shadow-sm"
                style={{ width: '36px', height: '36px', flexShrink: 0, backgroundColor: 'var(--secondary-plum)', border: '1.5px solid var(--accent-gold)', color: 'var(--accent-gold)', fontSize: '0.8rem' }}
              >
                {(user?.name || user?.email || 'U').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <div className="small fw-bold text-truncate text-white" style={{ fontSize: '0.82rem' }}>
                {user?.name || user?.email}
              </div>
              <div className="small text-uppercase fw-semibold" style={{ fontSize: '0.62rem', letterSpacing: '0.06em', color: 'var(--accent-gold)' }}>
                {user?.role === 'ADMIN' ? 'Placement Officer' : 'Student Candidate'}
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="btn btn-outline-danger btn-sm w-100 py-1.5 d-flex align-items-center justify-content-center border-0 fw-semibold bg-danger bg-opacity-10 text-danger rounded-3"
            style={{ fontSize: '0.78rem' }}
          >
            <svg className="w-4 h-4 me-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" style={{ width: '15px', height: '15px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="logout-btn-text">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-content">
        <header className="navbar-custom">
          <div className="d-flex align-items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button className="btn btn-link p-0 d-md-none text-dark" onClick={() => setIsMobileOpen(!isMobileOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" style={{ width: 22, height: 22 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Breadcrumb / Title */}
            <div className="d-none d-lg-flex flex-column">
              <span className="fw-bold text-dark fs-6" style={{ letterSpacing: '-0.01em' }}>{getPageTitle()}</span>
              <span className="text-secondary small" style={{ fontSize: '0.7rem' }}>Placement Progress & Analytics Portal</span>
            </div>

            {/* Global Search Bar */}
            <GlobalSearch />
          </div>
          
          <div className="d-flex align-items-center gap-2.5">
            {/* Top Bar Notification Bell */}
            <button 
              onClick={() => navigate(user?.role === 'ADMIN' ? '/admin/announcements' : '/student/notifications')}
              className="btn btn-sm btn-light p-1.5 rounded-circle border d-flex align-items-center justify-content-center position-relative no-print"
              style={{ width: '34px', height: '34px', backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              title="Notifications"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" style={{ width: 17, height: 17 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span 
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white"
                  style={{ fontSize: '0.6rem', padding: '2px 5px' }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Theme toggle */}
            <button 
              onClick={toggleTheme} 
              className="btn btn-sm btn-light p-1.5 rounded-circle border d-flex align-items-center justify-content-center no-print"
              style={{ width: '34px', height: '34px', backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              title="Toggle Dark Mode"
            >
              {themeMode === 'light' ? '🌙' : '☀️'}
            </button>
            
            <div className="d-none d-sm-flex flex-column text-end">
              <span className="fw-semibold text-dark small" style={{ fontSize: '0.82rem' }}>{user?.name || user?.email}</span>
              <span className="text-secondary" style={{ fontSize: '0.68rem' }}>{user?.role === 'ADMIN' ? 'Placement Cell' : 'Student'}</span>
            </div>

            <span className="badge badge-role-tag text-uppercase fw-bold">
              {user?.role === 'ADMIN' ? 'OFFICER' : 'CANDIDATE'}
            </span>
          </div>
        </header>

        <main className="page-container">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
