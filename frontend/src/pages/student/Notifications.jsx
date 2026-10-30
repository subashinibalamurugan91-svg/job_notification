import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const Notifications = () => {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'UNREAD', 'ELIGIBLE', 'INTERVIEW', 'RESULT'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications(); // reload
    } catch (err) {
      console.error('Error marking as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) {
      toast.warning('No unread notifications to process!');
      return;
    }

    try {
      await Promise.all(unread.map(n => notificationService.markAsRead(n.notificationId)));
      toast.success('All notifications marked as read!');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to mark notifications as read.');
    }
  };

  // Icons mapper for clean SVGs
  const getNotificationIcon = (type) => {
    if (type === 'INTERVIEW_REMINDER') {
      return (
        <div className="bg-warning bg-opacity-10 text-warning p-2.5 rounded-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" style={{ width: 20, height: 20 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }
    if (type === 'RESULT_UPDATE' || type === 'SELECTION_UPDATE') {
      return (
        <div className="bg-success bg-opacity-10 text-success p-2.5 rounded-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" style={{ width: 20, height: 20 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="bg-primary bg-opacity-10 text-primary p-2.5 rounded-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" style={{ width: 20, height: 20 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
    );
  };

  const getNotificationCategoryBadge = (type) => {
    switch (type) {
      case 'INTERVIEW_REMINDER':
        return <span className="badge rounded-pill bg-warning bg-opacity-10 text-warning px-2.5 py-1">Interview Round</span>;
      case 'RESULT_UPDATE':
      case 'SELECTION_UPDATE':
        return <span className="badge rounded-pill bg-success bg-opacity-10 text-success px-2.5 py-1">Result Outcome</span>;
      case 'ELIGIBLE_COMPANY':
        return <span className="badge rounded-pill bg-info bg-opacity-10 text-info px-2.5 py-1">Drives Eligibility</span>;
      default:
        return <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-2.5 py-1">Broadcast Announcement</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }} className="py-2">
        <div className="skeleton skeleton-title" style={{ height: '32px', width: '300px' }}></div>
        <div className="skeleton skeleton-text medium mb-4"></div>
        <div className="card custom-card p-3 mb-4 border-0 shadow-sm">
          <div className="d-flex justify-content-between">
            <div className="skeleton skeleton-text short" style={{ width: '250px' }}></div>
            <div className="skeleton skeleton-text short" style={{ width: '150px' }}></div>
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="card custom-card p-4 mb-2 border-0 shadow-sm">
            <div className="skeleton skeleton-title mb-2" style={{ width: '150px' }}></div>
            <div className="skeleton skeleton-text medium"></div>
          </div>
        ))}
      </div>
    );
  }

  // Filter & Search computations
  const filteredNotifications = notifications.filter(notif => {
    // 1. Search Query Match
    const matchesSearch = 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Active Tab Match
    if (activeFilter === 'UNREAD') return !notif.isRead;
    if (activeFilter === 'ELIGIBLE') return notif.type === 'ELIGIBLE_COMPANY';
    if (activeFilter === 'INTERVIEW') return notif.type === 'INTERVIEW_REMINDER';
    if (activeFilter === 'RESULT') return notif.type === 'RESULT_UPDATE' || notif.type === 'SELECTION_UPDATE';
    
    return true; // 'ALL'
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }} className="py-2">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold m-0 text-dark">Notification Center</h2>
          <p className="text-muted small mb-0">Stay updated with placement announcements, alerts, and schedules</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            className="btn btn-outline-primary btn-sm py-2 px-3 fw-bold rounded-3"
            onClick={handleMarkAllAsRead}
            style={{ fontSize: '0.8rem' }}
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Chips & Search input */}
      <div className="card custom-card p-3 mb-4 shadow-sm border-0 rounded-3">
        <div className="d-flex flex-column flex-md-row gap-3 justify-content-between align-items-center">
          {/* Tabs Filter */}
          <div className="d-flex flex-wrap gap-1">
            <button 
              className={`btn btn-sm px-3 py-1.5 rounded-3 border-0 fw-semibold ${activeFilter === 'ALL' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
              onClick={() => setActiveFilter('ALL')}
            >
              All Alerts ({notifications.length})
            </button>
            <button 
              className={`btn btn-sm px-3 py-1.5 rounded-3 border-0 fw-semibold ${activeFilter === 'UNREAD' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
              onClick={() => setActiveFilter('UNREAD')}
            >
              Unread ({unreadCount})
            </button>
            <button 
              className={`btn btn-sm px-3 py-1.5 rounded-3 border-0 fw-semibold ${activeFilter === 'ELIGIBLE' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
              onClick={() => setActiveFilter('ELIGIBLE')}
            >
              Drives
            </button>
            <button 
              className={`btn btn-sm px-3 py-1.5 rounded-3 border-0 fw-semibold ${activeFilter === 'INTERVIEW' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
              onClick={() => setActiveFilter('INTERVIEW')}
            >
              Interviews
            </button>
            <button 
              className={`btn btn-sm px-3 py-1.5 rounded-3 border-0 fw-semibold ${activeFilter === 'RESULT' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
              onClick={() => setActiveFilter('RESULT')}
            >
              Outcomes
            </button>
          </div>

          {/* Search text box */}
          <div className="position-relative" style={{ minWidth: '220px' }}>
            <input 
              type="text" 
              className="form-control form-control-sm py-1.5 px-3 rounded-3" 
              placeholder="🔍 Search alerts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.85rem' }}
              aria-label="Search alerts"
            />
          </div>
        </div>
      </div>

      {/* Notifications listing history */}
      {filteredNotifications.length > 0 ? (
        <div className="card custom-card p-3 shadow-sm border-0 d-flex flex-column gap-2 rounded-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.notificationId}
              className={`p-3 rounded-3 border-bottom border-light transition-all ${notif.isRead ? 'bg-light bg-opacity-25' : 'bg-primary bg-opacity-5 border-start border-primary border-3'}`}
            >
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div className="d-flex align-items-start gap-3">
                  {getNotificationIcon(notif.type)}
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <h6 className="fw-bold text-dark m-0" style={{ fontSize: '0.92rem' }}>{notif.title}</h6>
                      {getNotificationCategoryBadge(notif.type)}
                    </div>
                    <p className="text-secondary small mb-0">{notif.message}</p>
                  </div>
                </div>

                <div className="text-end" style={{ flexShrink: 0 }}>
                  <div className="small text-muted text-nowrap mb-2" style={{ fontSize: '0.72rem' }}>
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </div>
                  {!notif.isRead && (
                    <button
                      className="btn btn-link btn-sm p-0 text-decoration-none fw-bold text-primary"
                      onClick={() => handleMarkAsRead(notif.notificationId)}
                      style={{ fontSize: '0.78rem' }}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Professional Empty State */
        <div className="text-center py-5 border border-dashed rounded-3 bg-light bg-opacity-25 my-4">
          <span className="fs-1 d-block mb-3">🔔</span>
          <h5 className="fw-bold text-dark">No Notifications Found</h5>
          <p className="text-muted small mx-auto" style={{ maxWidth: '380px' }}>
            There are no placement broadcasts, interview invites, or drive notifications match your filters.
          </p>
          <div className="d-flex justify-content-center gap-2 mt-4">
            <button 
              className="btn btn-primary btn-sm px-4 fw-bold rounded-3"
              onClick={() => {
                setActiveFilter('ALL');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
            <Link to="/student/dashboard" className="btn btn-outline-secondary btn-sm px-4 fw-semibold rounded-3">
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
