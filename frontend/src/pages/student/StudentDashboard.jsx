import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { applicationService, interviewService, notificationService, companyService, studentService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EligibilityPipeline from '../../components/EligibilityPipeline';

const StudentDashboard = () => {
  const toast = useToast();
  const [apps, setApps] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [student, setStudent] = useState(null);
  const [eligibilityOverview, setEligibilityOverview] = useState([]);
  const [selectedEvalCompanyId, setSelectedEvalCompanyId] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stepper state
  const [selectedAppId, setSelectedAppId] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [appsData, interviewsData, notifsData, companiesData, studentData, eligData] = await Promise.all([
          applicationService.getMyApplications(),
          interviewService.getInterviews(),
          notificationService.getNotifications(),
          companyService.getCompanies(),
          studentService.getProfile(),
          studentService.getEligibilityOverview()
        ]);
        setApps(appsData || []);
        setInterviews(interviewsData || []);
        setNotifications(notifsData || []);
        setCompanies(companiesData || []);
        setStudent(studentData);
        setEligibilityOverview(eligData || []);
        if (eligData && eligData.length > 0) {
          setSelectedEvalCompanyId(String(eligData[0].companyId));
        } else if (companiesData && companiesData.length > 0) {
          setSelectedEvalCompanyId(String(companiesData[0].companyId));
        }
      } catch (err) {
        console.error('Error fetching dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (apps.length > 0 && !selectedAppId) {
      setSelectedAppId(String(apps[0].applicationId));
    }
  }, [apps, selectedAppId]);

  // Handle direct apply from dashboard
  const handleApplyOpportunity = async (companyId, companyName) => {
    try {
      await applicationService.apply(companyId);
      toast.success(`Applied to ${companyName} placement drive successfully!`);
      const [updatedApps, updatedCompanies, updatedElig] = await Promise.all([
        applicationService.getMyApplications(),
        companyService.getCompanies(),
        studentService.getEligibilityOverview()
      ]);
      setApps(updatedApps);
      setCompanies(updatedCompanies);
      setEligibilityOverview(updatedElig);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application.');
    }
  };

  const handleQuickAddSkill = async (skill) => {
    if (!student) return;
    setAddingSkill(true);
    try {
      const currentSkills = student.skills || [];
      if (currentSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
        toast.info(`Skill "${skill}" is already on your profile.`);
        return;
      }
      const newSkills = [...currentSkills, skill];
      const updatedProfile = await studentService.updateSkills(newSkills);
      setStudent(updatedProfile);
      const updatedElig = await studentService.getEligibilityOverview();
      setEligibilityOverview(updatedElig);
      toast.success(`✓ Skill "${skill}" added to your profile! Match score updated.`);
    } catch (err) {
      toast.error('Failed to add skill.');
    } finally {
      setAddingSkill(false);
    }
  };

  // Requirement 6.1: Profile Completion Percentage Calculation
  const profileCompletionPct = useMemo(() => {
    if (!student) return 0;
    let score = 30; // base (name, email, regNo)
    if (student.phone && student.phone.trim().length > 0) score += 15;
    if (student.department && student.department.trim().length > 0) score += 15;
    if (student.skills && student.skills.length > 0) score += 20;
    if (student.resumeUrl) score += 20;
    return Math.min(100, score);
  }, [student]);

  // Requirement 6.2: Global & Selected Drive Eligibility Status
  const currentEval = useMemo(() => {
    return eligibilityOverview.find(e => String(e.companyId) === String(selectedEvalCompanyId)) 
      || (eligibilityOverview.length > 0 ? eligibilityOverview[0] : null);
  }, [eligibilityOverview, selectedEvalCompanyId]);

  const globalEligibility = useMemo(() => {
    if (!student) return { isEligible: false, score: 0 };
    const cgpaScore = student.cgpa ? (student.cgpa * 10) : 0;
    const avgSkillMatch = eligibilityOverview.length > 0
      ? (eligibilityOverview.reduce((acc, e) => acc + (e.skillMatchPercentage || 0), 0) / eligibilityOverview.length)
      : 70;
    // Formula: Eligibility Score = 70% CGPA + 30% Skill Match
    const finalScore = parseFloat(((0.70 * cgpaScore) + (0.30 * avgSkillMatch)).toFixed(1));
    const isEligible = finalScore >= 65 && (student.cgpa >= 6.0);
    return {
      isEligible,
      score: finalScore,
      cgpaScore: cgpaScore.toFixed(1),
      skillScore: avgSkillMatch.toFixed(1)
    };
  }, [student, eligibilityOverview]);

  // Requirement 6.3: Upcoming Interviews list
  const futureInterviews = useMemo(() => {
    return interviews
      .filter(i => new Date(i.interviewDate) >= new Date())
      .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));
  }, [interviews]);

  // Requirement 6.4: Recent Notifications
  const unreadNotifsCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Requirement 6.5: Applied Companies Count
  const appliedCompaniesCount = apps.length;

  // Unapplied opportunities matching student
  const unappliedEligibleOpportunities = useMemo(() => {
    return companies.filter(company => {
      if (!student) return false;
      const evalData = eligibilityOverview.find(e => e.companyId === company.companyId);
      if (evalData) {
        if (!evalData.finalEligible) return false;
      } else {
        if (student.cgpa < company.eligibilityCgpa) return false;
      }
      if (!company.active) return false;
      if (new Date() > new Date(company.applicationDeadline)) return false;
      return !apps.some(a => a.companyName === company.companyName);
    });
  }, [companies, student, eligibilityOverview, apps]);

  const latestApp = apps.find(a => String(a.applicationId) === String(selectedAppId)) || (apps.length > 0 ? apps[0] : null);

  // Status chart
  const statusCounts = apps.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([status, count]) => {
    let color = '#24152F'; // Midnight Plum
    if (status === 'SELECTED') color = '#27836C'; // Emerald Teal
    if (status === 'REJECTED') color = '#C65362'; // Muted Crimson
    if (status === 'SHORTLISTED') color = '#D99536'; // Warm Amber
    if (status === 'APPLIED') color = '#3A2547'; // Secondary Plum
    if (status === 'APTITUDE_CLEARED' || status === 'TECHNICAL_CLEARED' || status === 'HR_CLEARED') color = '#D6AD60'; // Champagne Gold
    return { name: status.replace('_', ' '), value: count, color };
  });

  const stepsList = [
    { key: 'ELIGIBLE', label: 'Eligible' },
    { key: 'APPLIED', label: 'Applied' },
    { key: 'SHORTLISTED', label: 'Shortlisted' },
    { key: 'APTITUDE_CLEARED', label: 'Aptitude' },
    { key: 'TECHNICAL_CLEARED', label: 'Technical' },
    { key: 'HR_CLEARED', label: 'HR Round' },
    { key: 'SELECTED', label: 'Selected' }
  ];

  const getStepClass = (stepKey, index) => {
    if (stepKey === 'ELIGIBLE') return 'completed';
    if (!latestApp) return '';
    const curStatus = latestApp.status;
    if (curStatus === 'REJECTED') return 'rejected';
    const curIndex = stepsList.findIndex(s => s.key === curStatus);
    if (curStatus === stepKey) return 'active';
    if (index < curIndex) return 'completed';
    return '';
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="card custom-card p-4 border-0 shadow-sm mb-4">
          <div className="skeleton skeleton-title" style={{ height: '28px', width: '320px' }}></div>
          <div className="skeleton skeleton-text medium"></div>
        </div>
        <div className="row g-3 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="col">
              <div className="card custom-card p-3 border-0 shadow-sm">
                <div className="skeleton skeleton-text short mb-2"></div>
                <div className="skeleton skeleton-title m-0" style={{ height: '32px', width: '70px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {/* Welcome Banner */}
      <div className="card custom-card border-0 p-4 shadow-sm mb-4 bg-gradient-welcome text-white rounded-4 position-relative overflow-hidden">
        <div className="row align-items-center">
          <div className="col-md-8 position-relative" style={{ zIndex: 2 }}>
            <span className="badge bg-white bg-opacity-20 text-white fw-bold px-3 py-1 rounded-pill small mb-2 d-inline-block">
              STUDENT PORTFOLIO CONSOLE
            </span>
            <h2 className="fw-bold mb-1 text-white">Welcome back, {student?.name || 'Candidate'}! 👋</h2>
            <p className="mb-0 text-white text-opacity-90 small">
              Track recruitment drives, application progress, interviews, and real-time eligibility scores.
            </p>
            <div className="d-flex gap-3 mt-3 flex-wrap text-white text-opacity-80 small">
              <span>Roll No: <strong className="text-white">{student?.regNo}</strong></span>
              <span>•</span>
              <span>Branch: <strong className="text-white">{student?.department}</strong></span>
              <span>•</span>
              <span>CGPA: <strong className="text-white">{student?.cgpa?.toFixed(2)}</strong></span>
            </div>
          </div>
          <div className="col-md-4 text-md-end mt-3 mt-md-0 position-relative" style={{ zIndex: 2 }}>
            <Link to="/student/profile" className="btn btn-light px-3.5 py-2 fw-bold text-primary rounded-3 shadow-sm">
              Update Profile & Skills →
            </Link>
          </div>
        </div>
      </div>

      {/* ====================================================================
          REQUIREMENT 6: Exact 5 Student Dashboard Metric Cards
          - Profile Completion Percentage
          - Eligibility Status
          - Upcoming Interviews
          - Recent Notifications
          - Applied Companies Count
          ==================================================================== */}
      <div className="kpi-grid mb-4">
        {/* Metric 1: Profile Completion Percentage */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Profile Completion</span>
            <div className="kpi-icon-wrapper kpi-icon-primary">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="kpi-value text-primary">{profileCompletionPct}%</div>
          <div className="d-flex flex-column gap-1.5 mt-1">
            <div className="progress" style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--border-color)' }}>
              <div 
                className="progress-bar bg-primary" 
                style={{ width: `${profileCompletionPct}%` }}
              ></div>
            </div>
            <div className="d-flex justify-content-between align-items-center small text-secondary mt-1">
              <span>{profileCompletionPct === 100 ? 'Profile Complete' : 'Resume & Skills'}</span>
              <Link to="/student/profile" className="fw-bold text-primary" style={{ fontSize: '0.72rem' }}>
                {profileCompletionPct === 100 ? 'View' : 'Finish →'}
              </Link>
            </div>
          </div>
        </div>

        {/* Metric 2: Eligibility Status */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Eligibility Status</span>
            <div className={`kpi-icon-wrapper ${globalEligibility.isEligible ? 'kpi-icon-success' : 'kpi-icon-warning'}`}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div>
            {globalEligibility.isEligible ? (
              <span className="badge-eligible fs-6 py-1.5 px-3 mb-2 d-inline-block">
                ✓ ELIGIBLE
              </span>
            ) : (
              <span className="badge-not-eligible fs-6 py-1.5 px-3 mb-2 d-inline-block">
                ✕ NOT ELIGIBLE
              </span>
            )}
          </div>
          <div className="small text-secondary" style={{ fontSize: '0.75rem' }}>
            Score: <strong className="text-dark">{globalEligibility.score}%</strong> (70% CGPA + 30% Skill)
          </div>
        </div>

        {/* Metric 3: Upcoming Interviews */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Upcoming Interviews</span>
            <div className="kpi-icon-wrapper kpi-icon-warning">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="kpi-value text-dark">{futureInterviews.length}</div>
          <div className="kpi-trend">
            {futureInterviews.length > 0 ? (
              <span className="text-secondary small text-truncate">
                Next: <strong>{futureInterviews[0].companyName}</strong>
              </span>
            ) : (
              <span className="text-muted small">No scheduled interviews</span>
            )}
          </div>
        </div>

        {/* Metric 4: Recent Notifications */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Notifications</span>
            <div className="kpi-icon-wrapper kpi-icon-info">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
          <div className="kpi-value text-dark">{notifications.length}</div>
          <div className="d-flex justify-content-between align-items-center">
            {unreadNotifsCount > 0 ? (
              <span className="badge bg-danger rounded-pill px-2 py-0.5 small">
                {unreadNotifsCount} Unread
              </span>
            ) : (
              <span className="text-success small fw-semibold">All Read ✓</span>
            )}
            <Link to="/student/notifications" className="small text-primary fw-bold">Inbox →</Link>
          </div>
        </div>

        {/* Metric 5: Applied Companies Count */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Applied Companies</span>
            <div className="kpi-icon-wrapper kpi-icon-indigo">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="kpi-value text-primary">{appliedCompaniesCount}</div>
          <div className="d-flex justify-content-between align-items-center small text-secondary">
            <span>Offers: <strong className="text-success">{apps.filter(a => a.status === 'SELECTED').length}</strong></span>
            <Link to="/student/applications" className="fw-bold text-primary">Track →</Link>
          </div>
        </div>
      </div>

      {/* Two-Stage Eligibility Verification Engine for Selected Drive */}
      {currentEval && (
        <div className="card custom-card p-4 shadow-sm border-0 mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 pb-3 border-bottom gap-3">
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary text-white px-3 py-1 rounded-pill fw-bold" style={{ fontSize: '0.72rem' }}>
                  INTELLIGENT ELIGIBILITY ENGINE
                </span>
                <span className={`badge rounded-pill fw-bold ${currentEval.finalEligible ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                  {currentEval.finalEligible ? '✓ Stage 1 & 2 Cleared' : '✕ Currently Ineligible'}
                </span>
              </div>
              <h4 className="fw-bold text-dark mt-2 mb-0">Recruitment Eligibility & Skill Matching</h4>
              <p className="text-secondary small mb-0">
                Formula: <strong>Eligibility Score = 70% CGPA + 30% Skill Match</strong>. Minimum qualification threshold: 65.0%.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <label className="small text-secondary fw-semibold mb-0" style={{ whiteSpace: 'nowrap' }}>Inspect Drive:</label>
              <select
                className="form-select form-select-sm fw-bold border-primary"
                style={{ minWidth: '220px' }}
                value={selectedEvalCompanyId}
                onChange={(e) => setSelectedEvalCompanyId(e.target.value)}
              >
                {eligibilityOverview.map(e => (
                  <option key={e.companyId} value={e.companyId}>
                    {e.companyName} ({e.skillMatchPercentage}% Match)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <EligibilityPipeline mode="student" studentEval={currentEval} />

          {currentEval.missingSkills && currentEval.missingSkills.length > 0 && (
            <div className="mt-3 p-3 bg-light rounded-3 border d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="small fw-semibold text-secondary">
                ⚡ Unlock Higher Eligibility: Add missing skills to your profile in one click:
              </div>
              <div className="d-flex flex-wrap gap-1.5">
                {currentEval.missingSkills.slice(0, 4).map(skill => (
                  <button
                    key={skill}
                    type="button"
                    className="btn btn-xs btn-outline-primary py-1 px-2.5 rounded-pill fw-bold"
                    style={{ fontSize: '0.74rem' }}
                    onClick={() => handleQuickAddSkill(skill)}
                    disabled={addingSkill}
                  >
                    + Add "{skill}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Eligible Opportunities & Stepper */}
      <div className="row g-4">
        {/* Open Eligible Placement Drives */}
        <div className="col-lg-8">
          <div className="card custom-card p-4 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark m-0">💼 Open Placement Drives</h5>
              <Link to="/student/companies" className="small text-primary fw-semibold">View All Recruiters →</Link>
            </div>
            <p className="text-muted small mb-4">Drives matching your department criteria. Click 'Apply Now' to register.</p>

            {unappliedEligibleOpportunities.length > 0 ? (
              <div className="row g-3">
                {unappliedEligibleOpportunities.slice(0, 4).map(opp => (
                  <div key={opp.companyId} className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <h6 className="fw-bold text-dark m-0">{opp.companyName}</h6>
                          <span className="badge bg-success bg-opacity-10 text-success fw-bold">
                            {opp.packageAmount} LPA
                          </span>
                        </div>
                        <p className="small text-secondary mb-2 text-truncate">{opp.description || 'Campus recruitment drive.'}</p>
                        <div className="small text-muted mb-3" style={{ fontSize: '0.74rem' }}>
                          📅 Deadline: <strong>{opp.applicationDeadline}</strong>
                        </div>
                      </div>
                      <button 
                        className="btn btn-primary btn-sm py-1.5 w-100 fw-bold"
                        onClick={() => handleApplyOpportunity(opp.companyId, opp.companyName)}
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-muted border border-dashed rounded-3 bg-light">
                <span className="fs-1 d-block mb-1">🍵</span>
                <div className="fw-semibold text-dark">No new unapplied eligible drives!</div>
                <div className="small text-secondary">You are registered for all active campus recruitment drives.</div>
              </div>
            )}
          </div>
        </div>

        {/* Application Status Progression Stepper & Ratio Chart */}
        <div className="col-lg-4">
          <div className="card custom-card p-4 shadow-sm border-0 h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold text-dark mb-1">📈 Recruitment Progress</h5>
              <p className="text-muted small mb-3">Progression tracker & application ratio</p>

              {latestApp ? (
                <div>
                  <div className="small fw-bold text-primary mb-2.5">
                    Company: {latestApp.companyName}
                  </div>
                  <ul className="status-stepper flex-column gap-2 border-0 p-0 before-none mb-3" style={{ margin: 0 }}>
                    {stepsList.map((step, idx) => (
                      <li key={step.key} className={`d-flex align-items-center gap-2.5 p-1.5 rounded-2 ${getStepClass(step.key, idx) === 'completed' ? 'bg-success bg-opacity-10' : getStepClass(step.key, idx) === 'active' ? 'bg-primary bg-opacity-10' : ''}`}>
                        <div className={`status-step-circle m-0 ${getStepClass(step.key, idx)}`} style={{ width: 24, height: 24, fontSize: '0.68rem' }}>
                          {getStepClass(step.key, idx) === 'completed' ? '✓' : idx + 1}
                        </div>
                        <span className="small fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>{step.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-4 text-muted small">
                  Submit an application to view live round progression updates.
                </div>
              )}
            </div>

            {pieData.length > 0 && (
              <div className="pt-3 border-top mt-2">
                <div className="small text-muted fw-bold mb-2">APPLICATION STATUS RATIOS</div>
                <div style={{ width: '100%', height: '120px' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={45}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Scheduled Interviews */}
        <div className="col-lg-6">
          <div className="card custom-card p-4 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark m-0">📅 Upcoming Interviews</h5>
              <Link to="/student/interviews" className="small text-primary fw-semibold">View All</Link>
            </div>
            {futureInterviews.length > 0 ? (
              <div className="d-flex flex-column gap-2.5">
                {futureInterviews.slice(0, 3).map((item, idx) => (
                  <div key={item.interviewId || idx} className="p-3 rounded-3 border-start border-4 border-warning bg-light">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div>
                        <h6 className="fw-bold text-dark m-0">{item.companyName}</h6>
                        <span className="small text-secondary fw-semibold">{item.roundName}</span>
                      </div>
                      <span className="badge bg-warning bg-opacity-10 text-warning fw-bold">Scheduled</span>
                    </div>
                    <div className="small text-muted mt-2">
                      <div>📅 {new Date(item.interviewDate).toLocaleString()}</div>
                      <div>📍 {item.venue}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-muted border border-dashed rounded-3 bg-light">
                <span className="fs-2 d-block mb-1">📅</span>
                <div className="fw-semibold text-dark">No upcoming interviews</div>
                <div className="small text-secondary">Coordination schedules will appear here when shortlists are released.</div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications Feed */}
        <div className="col-lg-6">
          <div className="card custom-card p-4 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark m-0">📢 Placement Notifications</h5>
              <Link to="/student/notifications" className="small text-primary fw-semibold">View All ({notifications.length})</Link>
            </div>
            {notifications.length > 0 ? (
              <div className="d-flex flex-column gap-2.5">
                {notifications.slice(0, 3).map((notif) => (
                  <div key={notif.notificationId} className={`p-3 rounded-3 border-start border-3 bg-light ${notif.isRead ? 'border-secondary' : 'border-primary'}`}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-dark small">{notif.title}</span>
                      <span className="small text-muted" style={{ fontSize: '0.7rem' }}>
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="small text-secondary">{notif.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-muted border border-dashed rounded-3 bg-light">
                <span className="fs-2 d-block mb-1">📢</span>
                <div className="fw-semibold text-dark">No notifications yet</div>
                <div className="small text-secondary">Campus notices and recruitment updates will appear here.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
