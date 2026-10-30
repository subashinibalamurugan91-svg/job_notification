import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { companyService, applicationService, interviewService, studentService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EligibilityPipeline from '../../components/EligibilityPipeline';

const DriveDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [company, setCompany] = useState(null);
  const [apps, setApps] = useState([]);
  const [student, setStudent] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriveDetails();
  }, [id]);

  const fetchDriveDetails = async () => {
    try {
      const [compData, appsData, studentData, interviewsData] = await Promise.all([
        companyService.getCompany(id),
        applicationService.getMyApplications(),
        studentService.getProfile(),
        interviewService.getInterviews()
      ]);
      setCompany(compData);
      setApps(appsData);
      setStudent(studentData);
      setInterviews(interviewsData.filter(i => i.companyName === compData.companyName));

      try {
        const eligData = await applicationService.checkEligibility(id);
        setEligibilityResult(eligData);
      } catch (e) {
        // Fallback calculation using student profile and company data
        if (studentData && compData) {
          const sSkills = studentData.skills || [];
          const rSkills = compData.requiredSkills || [];
          const matched = rSkills.filter(r => sSkills.some(s => s.toLowerCase() === r.toLowerCase()));
          const missing = rSkills.filter(r => !sSkills.some(s => s.toLowerCase() === r.toLowerCase()));
          const score = rSkills.length > 0 ? Math.round((matched.length / rSkills.length) * 100) : 100;
          const cgpaPassed = studentData.cgpa >= compData.eligibilityCgpa;
          const skillPassed = score >= 60;
          setEligibilityResult({
            studentCgpa: studentData.cgpa,
            requiredCgpa: compData.eligibilityCgpa,
            cgpaEligible: cgpaPassed,
            cgpaStatus: cgpaPassed ? 'PASSED' : 'CGPA Not Eligible',
            skillMatchPercentage: score,
            skillEligible: skillPassed,
            skillStatus: skillPassed ? 'PASSED' : 'Skill Match Ineligible (< 60%)',
            studentSkills: sSkills,
            requiredSkills: rSkills,
            matchedSkills: matched,
            missingSkills: missing,
            departmentEligible: compData.eligibleDepartments?.toLowerCase().includes(studentData.department?.toLowerCase()),
            finalEligible: cgpaPassed && skillPassed,
            eligibilityStatus: !cgpaPassed ? 'CGPA_NOT_ELIGIBLE' : !skillPassed ? 'SKILL_NOT_ELIGIBLE' : 'FINAL_ELIGIBLE',
            message: !cgpaPassed ? `CGPA Not Eligible: Minimum required is ${compData.eligibilityCgpa}` : !skillPassed ? `Skill Match Ineligible: ${score}% match (Min 60% required)` : `Eligible: Two-Stage Verification cleared (${score}% match)`
          });
        }
      }
    } catch (err) {
      toast.error('Failed to load drive details.');
    } finally {
      setLoading(false);
    }
  };


  const handleRegister = async () => {
    try {
      await applicationService.apply(company.companyId);
      toast.success(`Successfully registered for the ${company.companyName} recruitment drive!`);
      fetchDriveDetails(); // reload
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit drive registration.');
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  if (!company) {
    return <div className="text-center py-5 text-muted">Recruitment drive details not found.</div>;
  }

  // 1. Calculate dynamic drive status based on dates
  const getDriveStatus = () => {
    const today = new Date();
    const deadline = new Date(company.applicationDeadline);
    const driveDate = new Date(company.driveDate);

    // 7 days before deadline is Upcoming
    const upcomingThreshold = new Date(deadline);
    upcomingThreshold.setDate(deadline.getDate() - 7);

    if (today < upcomingThreshold) return 'Upcoming';
    if (today <= deadline) return 'Registration Open';
    if (today < driveDate) return 'Registration Closed';
    if (today.toDateString() === driveDate.toDateString()) return 'Interview Ongoing';
    return 'Completed';
  };

  const driveStatus = getDriveStatus();
  const hasApplied = apps.some(a => a.companyName === company.companyName);
  const myApp = apps.find(a => a.companyName === company.companyName);

  // Two-Stage Eligibility criteria evaluation
  const isEligibleCgpa = student ? student.cgpa >= company.eligibilityCgpa : false;
  const isEligibleDept = student ? (company.eligibleDepartments || '').toLowerCase().includes((student.department || '').toLowerCase()) : false;
  const isEligible = eligibilityResult ? Boolean(eligibilityResult.finalEligible) : (isEligibleCgpa && isEligibleDept);

  const getStatusBadgeClass = (status) => {
    if (status === 'Registration Open') return 'eligible';
    if (status === 'Upcoming') return 'shortlisted';
    if (status === 'Completed') return 'rejected';
    return 'shortlisted';
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <Link to="/student/companies" className="text-decoration-none small fw-bold">← Back to Recruiter Drives</Link>
          <h2 className="fw-bold mt-2 text-dark">{company.companyName} Recruitment Drive</h2>
          <p className="text-muted small mb-0">Placement Drive Lifecycle Event Tracker & Eligibility Verification</p>
        </div>
        <span className={`badge badge-status ${getStatusBadgeClass(driveStatus)} text-uppercase fw-bold p-2.5`} style={{ fontSize: '0.78rem' }}>
          Event Status: {driveStatus}
        </span>
      </div>

      {/* Two-Stage Eligibility Verification Pipeline Banner */}
      {eligibilityResult && (
        <EligibilityPipeline mode="student" studentEval={eligibilityResult} />
      )}

      <div className="row g-4">
        {/* Drive Info details */}
        <div className="col-md-7">
          <div className="card custom-card p-4 shadow-sm border-0 mb-4">
            <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Drive Event Details</h5>
            <p className="text-secondary small mb-4">{company.description || 'No description provided.'}</p>
            
            <div className="row g-3 small">
              <div className="col-6">
                <div className="text-muted fw-bold">Package CTC</div>
                <div className="fs-5 fw-bold text-primary mt-1">{company.packageAmount} LPA</div>
              </div>
              <div className="col-6">
                <div className="text-muted fw-bold">Eligibility Cutoff</div>
                <div className="fs-5 fw-bold text-secondary mt-1">{company.eligibilityCgpa.toFixed(2)} CGPA</div>
              </div>
              <div className="col-6">
                <div className="text-muted fw-bold">Allowed Branches</div>
                <div className="fw-semibold text-dark mt-1">{company.eligibleDepartments}</div>
              </div>
              <div className="col-6">
                <div className="text-muted fw-bold">Drive / Test Date</div>
                <div className="fw-semibold text-dark mt-1">{company.driveDate}</div>
              </div>
            </div>

            {/* Required Skills list */}
            {company.requiredSkills && company.requiredSkills.length > 0 && (
              <div className="mt-3 pt-3 border-top">
                <div className="text-muted fw-bold small mb-2">Required Skills for Role:</div>
                <div className="d-flex flex-wrap gap-1.5">
                  {company.requiredSkills.map(s => {
                    const isMatched = eligibilityResult?.matchedSkills?.includes(s);
                    return (
                      <span key={s} className={`badge px-2.5 py-1.5 rounded-3 fw-semibold ${isMatched ? 'bg-success bg-opacity-15 text-success border border-success' : 'bg-light text-dark border'}`}>
                        {isMatched ? `✓ ${s}` : s}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <hr className="my-4 opacity-25" />

            {/* Registration Action trigger */}
            {hasApplied ? (
              <div className="alert alert-success border-0 bg-success bg-opacity-5 p-3 rounded-3 d-flex align-items-center justify-content-between">
                <div className="small text-secondary">
                  <strong>Registered!</strong> You have successfully registered for this placement drive. Current Status: <strong className="text-uppercase text-success">{myApp.status.replace('_', ' ')}</strong>.
                </div>
                <span className="badge bg-success py-1.5 px-3 rounded-pill fw-bold">Registered</span>
              </div>
            ) : (
              <div className="p-3 bg-light rounded-3 border">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div className="small fw-bold text-dark">Drive Registration Panel</div>
                    <div className="text-muted small">Registration deadline closes on: <strong>{company.applicationDeadline}</strong></div>
                  </div>
                  {student && (
                    <span className={`badge badge-status ${isEligible ? 'selected' : 'rejected'}`}>
                      {isEligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                  )}
                </div>

                {!isEligible && eligibilityResult && (
                  <div className="alert alert-warning border-0 bg-warning bg-opacity-10 small text-dark py-2.5 px-3 mb-3 fw-medium rounded-3">
                    <div className="fw-bold text-danger mb-1">
                      ⚠️ Ineligible: {eligibilityResult.eligibilityStatus === 'CGPA_NOT_ELIGIBLE' ? 'Stage 1 (CGPA Screening) Failed' : eligibilityResult.eligibilityStatus === 'SKILL_NOT_ELIGIBLE' ? 'Stage 2 (Skill Matching < 60%) Failed' : 'Criteria Not Met'}
                    </div>
                    <div>{eligibilityResult.message}</div>
                    {eligibilityResult.missingSkills && eligibilityResult.missingSkills.length > 0 && (
                      <div className="mt-1.5 text-muted" style={{ fontSize: '0.75rem' }}>
                        Missing required skills: <span className="text-danger fw-semibold">{eligibilityResult.missingSkills.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleRegister}
                  className="btn btn-primary w-100 fw-bold py-2"
                  disabled={!isEligible || driveStatus === 'Registration Closed' || driveStatus === 'Completed'}
                >
                  {driveStatus === 'Registration Closed' ? 'Registration Closed' : driveStatus === 'Completed' ? 'Drive Completed' : isEligible ? 'Register for Drive' : 'Ineligible to Register'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Drive Vertical Timeline Tracker */}
        <div className="col-md-5">
          <div className="card custom-card p-4 shadow-sm border-0 h-100">
            <h5 className="fw-bold text-dark mb-4">📍 Placement Drive Timeline</h5>
            
            <div className="drive-event-timeline">
              
              {/* Step 1: Announcement */}
              <div className="timeline-item active">
                <div className="timeline-marker bg-success"></div>
                <div className="timeline-content">
                  <h6 className="fw-bold text-dark mb-0.5" style={{ fontSize: '0.88rem' }}>Drive Announcement</h6>
                  <p className="text-muted small mb-0">Placement Drive was announced to eligible candidates.</p>
                </div>
              </div>

              {/* Step 2: Registration Open */}
              <div className="timeline-item active">
                <div className="timeline-marker bg-success"></div>
                <div className="timeline-content">
                  <h6 className="fw-bold text-dark mb-0.5" style={{ fontSize: '0.88rem' }}>Registration Open</h6>
                  <p className="text-muted small mb-0">Recruiter registrations opened on the campus portal.</p>
                </div>
              </div>

              {/* Step 3: Registration Closed */}
              <div className={`timeline-item ${driveStatus !== 'Upcoming' && driveStatus !== 'Registration Open' ? 'active' : ''}`}>
                <div className={`timeline-marker ${driveStatus !== 'Upcoming' && driveStatus !== 'Registration Open' ? 'bg-success' : 'bg-secondary'}`}></div>
                <div className="timeline-content">
                  <h6 className="fw-bold text-dark mb-0.5" style={{ fontSize: '0.88rem' }}>Registration Closed</h6>
                  <p className="text-muted small mb-0">Deadline expired on {company.applicationDeadline}.</p>
                </div>
              </div>

              {/* Step 4: Testing & Screening Rounds */}
              <div className={`timeline-item ${interviews.length > 0 ? 'active' : ''}`}>
                <div className={`timeline-marker ${interviews.length > 0 ? 'bg-warning' : 'bg-secondary'}`}></div>
                <div className="timeline-content">
                  <h6 className="fw-bold text-dark mb-0.5" style={{ fontSize: '0.88rem' }}>Testing & Interviews</h6>
                  {interviews.length > 0 ? (
                    <div className="d-flex flex-column gap-1.5 mt-1.5">
                      {interviews.map((i, idx) => (
                        <div key={idx} className="small bg-light p-2 rounded-2 border">
                          <strong className="text-dark">{i.roundName}</strong>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>📍 {i.venue} | 📅 {new Date(i.interviewDate).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted small mb-0">Screening rounds date: {company.driveDate}.</p>
                  )}
                </div>
              </div>

              {/* Step 5: Result Publication */}
              <div className={`timeline-item ${myApp?.status === 'SELECTED' || myApp?.status === 'REJECTED' ? 'active' : ''}`}>
                <div className={`timeline-marker ${myApp?.status === 'SELECTED' ? 'bg-success' : myApp?.status === 'REJECTED' ? 'bg-danger' : 'bg-secondary'}`}></div>
                <div className="timeline-content">
                  <h6 className="fw-bold text-dark mb-0.5" style={{ fontSize: '0.88rem' }}>Result Publication</h6>
                  {myApp?.status === 'SELECTED' ? (
                    <span className="small text-success fw-bold">🎉 Selected at {company.companyName}!</span>
                  ) : myApp?.status === 'REJECTED' ? (
                    <span className="small text-danger fw-semibold">Application rejected.</span>
                  ) : (
                    <p className="text-muted small mb-0">Results declared after screening interviews.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriveDetails;
