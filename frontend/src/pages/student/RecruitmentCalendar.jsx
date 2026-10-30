import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { companyService, interviewService, studentService } from '../../services/api';

const RecruitmentCalendar = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Calendar states
  const [viewMode, setViewMode] = useState('monthly'); // 'daily', 'weekly', 'monthly'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      if (user.role === 'ADMIN') {
        const [compData, intData] = await Promise.all([
          companyService.getCompanies(),
          interviewService.getInterviews()
        ]);
        setCompanies(compData);
        setInterviews(intData);
      } else {
        const [compData, intData, profileData] = await Promise.all([
          companyService.getCompanies(),
          interviewService.getInterviews(),
          studentService.getProfile()
        ]);
        setCompanies(compData);
        setInterviews(intData);
        setStudentProfile(profileData);
      }
    } catch (err) {
      console.error('Error loading calendar data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  // Determine eligibility of a company drive for student
  const isEligible = (company) => {
    if (!studentProfile) return true; // admins see all
    if (studentProfile.cgpa < company.eligibilityCgpa) return false;
    const studentDept = studentProfile.department.trim().toLowerCase();
    const depts = company.eligibleDepartments.split(',').map(d => d.trim().toLowerCase());
    return depts.includes(studentDept);
  };

  // Build events list
  const events = [];

  companies.forEach(company => {
    if (user.role === 'ADMIN' || isEligible(company)) {
      events.push({
        id: `deadline-${company.companyId}`,
        type: 'deadline',
        date: new Date(company.applicationDeadline),
        title: `⏰ ${company.companyName} Deadline`,
        details: `Application submission deadline. Package: ${company.packageAmount.toFixed(2)} LPA. Cutoff CGPA: ${company.eligibilityCgpa.toFixed(2)}.`
      });
      events.push({
        id: `drive-${company.companyId}`,
        type: 'drive',
        date: new Date(company.driveDate),
        title: `💼 ${company.companyName} Drive`,
        details: `Placement recruitment drive day. Package CTC: ${company.packageAmount.toFixed(2)} LPA.`
      });
    }
  });

  interviews.forEach(interview => {
    events.push({
      id: `interview-${interview.interviewId}`,
      type: 'interview',
      date: new Date(interview.interviewDate),
      title: `📅 ${interview.companyName} - ${interview.roundName}`,
      details: `Scheduled interview round at ${new Date(interview.interviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Venue: ${interview.venue}. Remarks: ${interview.remarks || 'None'}.`
    });
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper: Date equals check (ignoring time)
  const isSameDay = (d1, d2) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  // Monthly View Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrev = () => {
    if (viewMode === 'monthly') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'weekly') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)));
    }
  };

  const handleNext = () => {
    if (viewMode === 'monthly') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'weekly') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)));
    }
  };

  // Get current week dates (Sun to Sat)
  const getWeekDates = (date) => {
    const current = new Date(date);
    const day = current.getDay();
    const sunday = new Date(current.setDate(current.getDate() - day));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(new Date(sunday));
      sunday.setDate(sunday.getDate() + 1);
    }
    return dates;
  };

  // Render Monthly View cells
  const renderMonthlyCells = () => {
    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day empty border border-light p-2 bg-light bg-opacity-25" style={{ minHeight: '110px' }}></div>);
    }
    for (let day = 1; day <= totalDays; day++) {
      const dayDate = new Date(year, month, day);
      const dayEvents = events.filter(e => isSameDay(e.date, dayDate));
      const isToday = isSameDay(dayDate, new Date());

      cells.push(
        <div 
          key={`day-${day}`} 
          className={`calendar-day border border-light p-2 d-flex flex-column justify-content-between cursor-pointer hover-shadow ${isToday ? 'bg-primary bg-opacity-10 border-primary border-2' : 'bg-white'}`}
          style={{ minHeight: '110px' }}
          onClick={() => setSelectedDayEvents({ date: dayDate, events: dayEvents })}
        >
          <span className={`fw-bold d-inline-flex align-items-center justify-content-center rounded-circle p-1 ${isToday ? 'bg-primary text-white' : 'text-secondary'}`} style={{ width: '28px', height: '28px', fontSize: '0.85rem' }}>
            {day}
          </span>
          <div className="d-flex flex-column gap-1 overflow-hidden" style={{ maxHeight: '72px' }}>
            {dayEvents.slice(0, 2).map(e => (
              <div 
                key={e.id} 
                className="text-truncate small px-2 py-0.5 rounded fw-semibold text-white"
                style={{ 
                  fontSize: '0.72rem',
                  backgroundColor: e.type === 'deadline' ? '#C65362' : e.type === 'drive' ? '#27836C' : '#3A2547'
                }}
                title={e.title}
              >
                {e.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-muted small text-center fw-bold" style={{ fontSize: '0.7rem' }}>
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }
    return cells;
  };

  // Render Weekly View cells
  const renderWeeklyCells = () => {
    const dates = getWeekDates(currentDate);
    return dates.map((dayDate, index) => {
      const dayEvents = events.filter(e => isSameDay(e.date, dayDate));
      const isToday = isSameDay(dayDate, new Date());

      return (
        <div 
          key={`week-${index}`} 
          className={`calendar-day border border-light p-2 d-flex flex-column justify-content-between cursor-pointer hover-shadow ${isToday ? 'bg-primary bg-opacity-10 border-primary border-2' : 'bg-white'}`}
          style={{ minHeight: '220px' }}
          onClick={() => setSelectedDayEvents({ date: dayDate, events: dayEvents })}
        >
          <div className="text-center border-bottom pb-2">
            <span className="small text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>{dayNames[index]}</span>
            <span className={`fw-bold d-inline-flex align-items-center justify-content-center rounded-circle p-1 mt-1 ${isToday ? 'bg-primary text-white' : 'text-dark'}`} style={{ width: '32px', height: '32px' }}>
              {dayDate.getDate()}
            </span>
          </div>
          
          <div className="d-flex flex-column gap-1 overflow-y-auto flex-grow-1 mt-2" style={{ maxHeight: '140px' }}>
            {dayEvents.map(e => (
              <div 
                key={e.id} 
                className="small px-2 py-1 rounded fw-semibold text-white text-wrap mb-1"
                style={{ 
                  fontSize: '0.72rem',
                  backgroundColor: e.type === 'deadline' ? '#C65362' : e.type === 'drive' ? '#27836C' : '#3A2547'
                }}
                title={e.title}
              >
                {e.title}
              </div>
            ))}
            {dayEvents.length === 0 && (
              <div className="text-muted small text-center py-4">No events</div>
            )}
          </div>
        </div>
      );
    });
  };

  // Render Daily View layout
  const renderDailyLayout = () => {
    const dayEvents = events.filter(e => isSameDay(e.date, currentDate));
    return (
      <div className="card custom-card p-4 shadow-sm border-0">
        <h5 className="fw-bold mb-3 text-primary border-bottom pb-3">
          📅 Day Timeline - {currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h5>
        {dayEvents.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {dayEvents.map(e => (
              <div 
                key={e.id} 
                className={`p-3 rounded-3 border-start border-4 ${
                  e.type === 'deadline' ? 'bg-danger bg-opacity-5 border-danger text-danger' : 
                  e.type === 'drive' ? 'bg-success bg-opacity-5 border-success text-success' : 
                  'bg-primary bg-opacity-5 border-primary text-primary'
                }`}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold m-0 text-dark">{e.title}</h6>
                  <span className={`badge badge-status ${
                    e.type === 'deadline' ? 'rejected' : 
                    e.type === 'drive' ? 'selected' : 'eligible'
                  }`}>
                    {e.type.toUpperCase()}
                  </span>
                </div>
                <p className="small text-secondary mb-0">{e.details}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 text-muted">
            <span className="fs-1 d-block mb-2">🍵</span>
            No recruitment events scheduled for this day.
          </div>
        )}
      </div>
    );
  };

  // Title label depending on viewMode
  const getHeaderTitle = () => {
    if (viewMode === 'monthly') {
      return `${monthNames[month]} ${year}`;
    } else if (viewMode === 'weekly') {
      const dates = getWeekDates(currentDate);
      return `${dates[0].getDate()} ${monthNames[dates[0].getMonth()]} - ${dates[6].getDate()} ${monthNames[dates[6].getMonth()]} ${dates[6].getFullYear()}`;
    } else {
      return currentDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  return (
    <div>
      {/* Calendar Header with Navigation and View Select tabs */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold m-0 text-dark">Recruitment Calendar</h2>
          <p className="text-muted small mb-0">Monitor drive execution timelines and round-wise interview calls</p>
        </div>
        
        {/* Toggle Mode Button Group */}
        <div className="btn-group shadow-sm bg-light p-1 rounded-3">
          <button 
            className={`btn btn-sm px-3 fw-bold rounded-2 border-0 ${viewMode === 'daily' ? 'btn-primary text-white shadow-sm' : 'text-secondary bg-transparent'}`}
            onClick={() => setViewMode('daily')}
          >
            Daily
          </button>
          <button 
            className={`btn btn-sm px-3 fw-bold rounded-2 border-0 ${viewMode === 'weekly' ? 'btn-primary text-white shadow-sm' : 'text-secondary bg-transparent'}`}
            onClick={() => setViewMode('weekly')}
          >
            Weekly
          </button>
          <button 
            className={`btn btn-sm px-3 fw-bold rounded-2 border-0 ${viewMode === 'monthly' ? 'btn-primary text-white shadow-sm' : 'text-secondary bg-transparent'}`}
            onClick={() => setViewMode('monthly')}
          >
            Monthly
          </button>
        </div>

        {/* Date Navigator */}
        <div className="d-flex align-items-center gap-2 bg-white p-1 rounded-3 shadow-sm border">
          <button className="btn btn-link btn-sm text-decoration-none fw-bold text-secondary" onClick={handlePrev}>◀</button>
          <span className="fw-bold text-dark text-center small" style={{ minWidth: '170px', letterSpacing: '0.5px' }}>
            {getHeaderTitle()}
          </span>
          <button className="btn btn-link btn-sm text-decoration-none fw-bold text-secondary" onClick={handleNext}>▶</button>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Calendar View Area */}
        <div className={viewMode === 'daily' ? 'col-12' : 'col-lg-8'}>
          {viewMode === 'daily' ? (
            renderDailyLayout()
          ) : (
            <div className="card custom-card p-3 shadow-sm border-0">
              {/* Days of Week header */}
              <div className="grid-calendar-header d-grid text-center fw-bold text-secondary border-bottom pb-2 mb-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)', fontSize: '0.82rem' }}>
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Calendar Grid Days */}
              <div className="d-grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {viewMode === 'monthly' ? renderMonthlyCells() : renderWeeklyCells()}
              </div>
            </div>
          )}
        </div>

        {/* Side Details Panel (only for Monthly / Weekly views) */}
        {viewMode !== 'daily' && (
          <div className="col-lg-4">
            <div className="card custom-card p-4 h-100 shadow-sm border-0">
              <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">
                🎯 Day Event Details
              </h5>
              {selectedDayEvents ? (
                <div>
                  <h6 className="fw-bold text-primary mb-3" style={{ fontSize: '0.92rem' }}>
                    Events on {selectedDayEvents.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    {selectedDayEvents.events.length > 0 ? (
                      selectedDayEvents.events.map(e => (
                        <div 
                          key={e.id} 
                          className={`p-3 rounded-3 border-start border-4 ${
                            e.type === 'deadline' ? 'bg-danger bg-opacity-5 border-danger' : 
                            e.type === 'drive' ? 'bg-success bg-opacity-5 border-success' :
                            'bg-primary bg-opacity-5 border-primary'
                          }`}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '0.88rem' }}>{e.title}</h6>
                            <span className={`badge badge-status ${
                              e.type === 'deadline' ? 'rejected' : 
                              e.type === 'drive' ? 'selected' : 'eligible'
                            }`} style={{ fontSize: '0.62rem' }}>
                              {e.type.toUpperCase()}
                            </span>
                          </div>
                          <p className="small text-secondary mb-0 mt-1" style={{ fontSize: '0.78rem' }}>{e.details}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted small">No scheduled recruitment events on this day.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <span className="fs-1 d-block mb-3">📅</span>
                  Click on any calendar day containing events to view schedule details.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruitmentCalendar;
