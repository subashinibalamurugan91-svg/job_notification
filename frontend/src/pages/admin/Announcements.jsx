import React, { useState } from 'react';
import { notificationService } from '../../services/api';

const Announcements = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await notificationService.broadcastAnnouncement(title, message);
      setSuccess('Announcement broadcasted successfully to all student dashboards!');
      setTitle('');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to broadcast announcement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="mb-4 text-center text-sm-start">
        <h2 className="fw-bold m-0 text-dark">Broadcast Announcement</h2>
        <p className="text-muted small mb-0">Publish system announcements or global recruitment alerts to all student consoles</p>
      </div>

      {error && <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger py-2 px-3 small rounded-3 fw-semibold mb-3">{error}</div>}
      {success && <div className="alert alert-success border-0 bg-success bg-opacity-10 text-success py-2 px-3 small rounded-3 fw-semibold mb-3">{success}</div>}

      <div className="card custom-card p-4 shadow-sm border-0">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Announcement Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Google drive registration opened"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold">Detailed Message</label>
            <textarea
              className="form-control"
              rows="6"
              placeholder="Provide drive links, registration deadlines, and eligibility criteria instructions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2.5 fw-semibold shadow-sm"
            disabled={loading}
          >
            {loading ? 'Broadcasting...' : '📢 Broadcast Announcement'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Announcements;
