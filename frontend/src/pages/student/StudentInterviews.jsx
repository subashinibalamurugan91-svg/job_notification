import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interviewService } from '../../services/api';

const StudentInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const data = await interviewService.getStudentInterviews();
        setInterviews(data);
      } catch (err) {
        console.error('Error loading student interviews', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  // Skeleton Loader UI
  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }} className="py-2">
        <div className="skeleton skeleton-title" style={{ height: '32px', width: '300px' }}></div>
        <div className="skeleton skeleton-text medium mb-4"></div>
        <div className="skeleton skeleton-title mb-4" style={{ height: '36px', width: '220px' }}></div>
        {[1, 2].map(i => (
          <div key={i} className="card custom-card p-4 mb-3 border-0 shadow-sm">
            <div className="skeleton skeleton-title mb-2" style={{ width: '180px' }}></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text medium"></div>
          </div>
        ))}
      </div>
    );
  }

  const now = new Date();
  const upcoming = interviews.filter(item => new Date(item.interviewDate) >= now);
  const history = interviews.filter(item => new Date(item.interviewDate) < now);

  const displayedList = activeTab === 'upcoming' ? upcoming : history;

  const downloadInstructions = (item) => {
    const content = `Placement Cell - Interview Instructions\n\n` +
                    `Company: ${item.companyName}\n` +
                    `Round: ${item.roundName}\n` +
                    `Date & Time: ${new Date(item.interviewDate).toLocaleString()}\n` +
                    `Venue/Location: ${item.venue}\n` +
                    `Meeting Link: ${item.meetingLink || 'N/A'}\n\n` +
                    `Remarks: ${item.remarks || 'None'}\n\n` +
                    `Instructions:\n${item.instructions || 'None'}`;
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `${item.companyName.replace(/\s+/g, '_')}_interview_instructions.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }} className="py-2">
      <div className="mb-4">
        <h2 className="fw-bold m-0 text-dark">My Interview Coordination</h2>
        <p className="text-muted small mb-0">Monitor scheduled interview rounds, download instruction logs, and access virtual meeting links</p>
      </div>

      {/* Tabs */}
      <div className="p-1 bg-light rounded-3 mb-4 d-inline-flex border no-print">
        <button 
          className={`btn btn-sm border-0 px-4 py-2 fw-semibold rounded-2 ${activeTab === 'upcoming' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
          onClick={() => setActiveTab('upcoming')}
        >
          🗓️ Upcoming ({upcoming.length})
        </button>
        <button 
          className={`btn btn-sm border-0 px-4 py-2 fw-semibold rounded-2 ${activeTab === 'history' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
          onClick={() => setActiveTab('history')}
        >
          📜 Past Rounds ({history.length})
        </button>
      </div>

      {displayedList.length > 0 ? (
        <div className="d-flex flex-column gap-3">
          {displayedList.map((item) => (
            <div className="card custom-card p-4 shadow-sm border-0 rounded-3" key={item.interviewId}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h4 className="fw-bold text-primary mb-1">{item.companyName}</h4>
                  <h6 className="fw-semibold text-secondary m-0">{item.roundName}</h6>
                </div>
                <span className={`badge badge-status ${activeTab === 'upcoming' ? 'eligible' : 'applied'} text-uppercase fw-bold`}>
                  {activeTab === 'upcoming' ? 'Scheduled' : 'Completed'}
                </span>
              </div>

              <div className="row g-3 mb-3 border-top pt-3 border-light">
                <div className="col-sm-6 small text-secondary">
                  <strong>📅 Date & Time:</strong> <span className="text-dark">{new Date(item.interviewDate).toLocaleString()}</span>
                </div>
                <div className="col-sm-6 small text-secondary">
                  <strong>📍 Venue/Link:</strong> <span className="text-dark">{item.venue}</span>
                </div>
              </div>

              {item.remarks && (
                <div className="alert alert-info border-0 bg-info bg-opacity-10 text-info p-3 rounded-3 mb-3 small fw-semibold">
                  💡 <strong>Coordinator Notes:</strong> {item.remarks}
                </div>
              )}

              {item.instructions && (
                <div className="bg-light p-3 rounded-3 mb-3 small text-secondary border border-light">
                  <strong className="text-dark">📝 Instructions:</strong>
                  <p className="mb-0 mt-1">{item.instructions}</p>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center pt-3 border-top border-light">
                {item.instructions ? (
                  <button 
                    onClick={() => downloadInstructions(item)}
                    className="btn btn-outline-secondary btn-sm fw-semibold py-1.5 px-3 rounded-3"
                    style={{ fontSize: '0.82rem' }}
                  >
                    📥 Instructions.txt
                  </button>
                ) : (
                  <span className="small text-muted" style={{ fontSize: '0.78rem' }}>No study brief attached.</span>
                )}

                {item.meetingLink && activeTab === 'upcoming' && (
                  <a
                    href={item.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm px-4 py-1.5 fw-semibold shadow-sm rounded-3"
                    style={{ fontSize: '0.82rem' }}
                  >
                    🔗 Join Virtual Room
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Professional Empty State */
        <div className="text-center py-5 border border-dashed rounded-3 bg-light bg-opacity-25 my-4">
          <span className="fs-1 d-block mb-3">{activeTab === 'upcoming' ? '🗓️' : '📜'}</span>
          <h5 className="fw-bold text-dark">
            {activeTab === 'upcoming' ? 'No Upcoming Interviews' : 'No Past Interviews'}
          </h5>
          <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '380px' }}>
            {activeTab === 'upcoming' 
              ? 'You have no scheduled interview rounds on calendar. Coordinate with TPO placement coordinators or verify active applications.' 
              : 'You have no past completed interview coordination records.'}
          </p>
          <div className="d-flex justify-content-center gap-2">
            <Link to="/student/companies" className="btn btn-primary btn-sm px-4 py-2 fw-bold rounded-3">
              Browse Company Drives
            </Link>
            <Link to="/student/dashboard" className="btn btn-outline-secondary btn-sm px-4 py-2 fw-semibold rounded-3">
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentInterviews;
