import React, { useState, useEffect } from 'react';
import { studentService, companyService, applicationService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EligibilityPipeline from '../../components/EligibilityPipeline';

const StudentEligibility = () => {
  const toast = useToast();
  const [student, setStudent] = useState(null);
  const [overview, setOverview] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileData, eligData, compData, appsData] = await Promise.all([
        studentService.getProfile(),
        studentService.getEligibilityOverview(),
        companyService.getCompanies(),
        applicationService.getMyApplications()
      ]);

      setStudent(profileData);
      setOverview(eligData || []);
      setCompanies(compData || []);
      setApplications(appsData || []);

      if (eligData && eligData.length > 0) {
        setSelectedCompanyId(String(eligData[0].companyId));
      } else if (compData && compData.length > 0) {
        setSelectedCompanyId(String(compData[0].companyId));
      }
    } catch (err) {
      console.error('Error fetching student eligibility', err);
      toast.error('Failed to load eligibility details.');
    } finally {
      setLoading(false);
    }
  };

  // Requirement 7 Formula:
  // Eligibility Score = 70% CGPA + 30% Skill Match
  const calculateScore = (cgpa, skillMatchPct) => {
    const cgpaScore = cgpa ? (cgpa * 10) : 0; // scale 10 to 100
    const skillScore = skillMatchPct || 0;
    const finalScore = parseFloat(((0.70 * cgpaScore) + (0.30 * skillScore)).toFixed(1));
    const isEligible = finalScore >= 65.0 && (cgpa >= 6.0);
    return {
      cgpaScore: parseFloat(cgpaScore.toFixed(1)),
      skillScore: parseFloat(skillScore.toFixed(1)),
      finalScore,
      isEligible
    };
  };

  // Active Drive Evaluation
  const activeDriveEval = overview.find(e => String(e.companyId) === String(selectedCompanyId));
  const activeCompany = companies.find(c => String(c.companyId) === String(selectedCompanyId));

  const activeScores = calculateScore(
    student?.cgpa || 0, 
    activeDriveEval?.skillMatchPercentage || 0
  );

  const hasApplied = applications.some(a => String(a.companyId) === String(selectedCompanyId));

  const handleApply = async () => {
    if (!selectedCompanyId) return;
    try {
      await applicationService.apply(selectedCompanyId);
      toast.success('Application submitted successfully!');
      const updatedApps = await applicationService.getMyApplications();
      setApplications(updatedApps);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Calculating eligibility score models...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3 bg-white p-4 rounded-4 shadow-sm border">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1 rounded-pill" style={{ fontSize: '0.74rem' }}>
              RECRUITMENT ELIGIBILITY MODULE
            </span>
            <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1 rounded-pill" style={{ fontSize: '0.74rem' }}>
              Standard Weighted Scoring
            </span>
          </div>
          <h2 className="fw-bold m-0 text-dark">My Placement Eligibility & Score Matrix</h2>
          <p className="text-muted small mb-0 mt-1">
            Evaluate your compatibility with campus recruiting companies based on CGPA and verified skills.
          </p>
        </div>

        <button 
          onClick={fetchData}
          className="btn btn-secondary btn-sm py-2 px-3 fw-semibold rounded-3"
        >
          🔄 Recalculate Scores
        </button>
      </div>

      {/* ====================================================================
          REQUIREMENT 7: Formula Callout Banner
          Eligibility Score = 70% CGPA + 30% Skill Match
          ==================================================================== */}
      <div className="card custom-card p-4 mb-4 shadow-sm border-0" style={{
        background: 'linear-gradient(135deg, rgba(36, 21, 47, 0.04) 0%, rgba(214, 173, 96, 0.08) 100%)',
        borderLeft: '4px solid var(--accent-gold)'
      }}>
        <div className="row align-items-center g-3">
          <div className="col-lg-8">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-primary text-white fw-bold px-3 py-1 rounded-pill" style={{ fontSize: '0.72rem' }}>
                SCORING FORMULA
              </span>
              <span className="small text-secondary fw-bold">Official Campus Criteria</span>
            </div>
            <h4 className="fw-bold text-dark m-0">
              Eligibility Score = 70% CGPA + 30% Skill Match
            </h4>
            <p className="small text-secondary mb-0 mt-1">
              Your overall eligibility is determined through a combination of academic standing (70% weightage) and relevant technical skills (30% weightage). Score ≥ 65.0% qualifies you for the drive.
            </p>
          </div>

          <div className="col-lg-4 text-lg-end">
            <div className="d-inline-flex align-items-center gap-3 p-3 bg-white rounded-3 shadow-sm border">
              <div className="text-start">
                <div className="small text-muted fw-bold" style={{ fontSize: '0.68rem' }}>MY GLOBAL CGPA</div>
                <div className="fs-5 fw-bold text-dark">{student?.cgpa?.toFixed(2)} / 10.0</div>
                <div className="small text-primary fw-bold" style={{ fontSize: '0.7rem' }}>
                  Scaled Score: {(student?.cgpa * 10).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Drive Eligibility Inspection */}
      <div className="card custom-card p-4 shadow-sm border-0 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom gap-3">
          <div>
            <h5 className="fw-bold text-dark m-0">💼 Drive-Specific Eligibility Breakdown</h5>
            <p className="text-muted small mb-0 mt-0.5">Select a recruiting company to inspect your scores and qualification badge</p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label className="small text-muted fw-bold mb-0" style={{ whiteSpace: 'nowrap' }}>Inspect Company:</label>
            <select 
              className="form-select form-select-sm fw-bold"
              style={{ minWidth: '220px' }}
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
            >
              {companies.map(c => (
                <option key={c.companyId} value={c.companyId}>
                  {c.companyName} ({c.packageAmount} LPA)
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeCompany && (
          <div>
            {/* Header with status badge */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
              <div>
                <h4 className="fw-bold text-dark m-0">{activeCompany.companyName}</h4>
                <div className="small text-secondary mt-1">
                  Role: <strong>Software Engineer</strong> | CTC: <strong>{activeCompany.packageAmount} LPA</strong> | Minimum Cutoff: <strong>{activeCompany.eligibilityCgpa} CGPA</strong>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                {activeScores.isEligible && (student?.cgpa >= activeCompany.eligibilityCgpa) ? (
                  <span className="badge-eligible fs-6 py-2 px-3">
                    ✓ ELIGIBLE FOR DRIVE
                  </span>
                ) : (
                  <span className="badge-not-eligible fs-6 py-2 px-3">
                    ✕ NOT ELIGIBLE
                  </span>
                )}

                {activeScores.isEligible && (student?.cgpa >= activeCompany.eligibilityCgpa) && !hasApplied && (
                  <button 
                    className="btn btn-primary btn-sm py-2 px-3 fw-bold rounded-3"
                    onClick={handleApply}
                  >
                    Apply Now
                  </button>
                )}
                {hasApplied && (
                  <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-2 rounded-3">
                    ✓ Applied
                  </span>
                )}
              </div>
            </div>

            {/* Exact 3 Display Requirements: CGPA Score, Skill Match Score, Final Eligibility Score */}
            <div className="row g-3 mb-4">
              {/* 1. CGPA Score */}
              <div className="col-md-4">
                <div className="p-3.5 bg-light rounded-3 border text-center h-100 d-flex flex-column justify-content-between">
                  <div className="small text-muted fw-bold text-uppercase" style={{ fontSize: '0.72rem' }}>
                    1. CGPA Score (70% Weightage)
                  </div>
                  <div className="my-2">
                    <div className="fs-2 fw-bold text-primary">{activeScores.cgpaScore}%</div>
                    <div className="small text-secondary" style={{ fontSize: '0.74rem' }}>
                      Your CGPA: <strong>{student?.cgpa?.toFixed(2)}</strong> (Cutoff: {activeCompany.eligibilityCgpa})
                    </div>
                  </div>
                  <span className={`badge ${student?.cgpa >= activeCompany.eligibilityCgpa ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} fw-bold`}>
                    {student?.cgpa >= activeCompany.eligibilityCgpa ? '✓ Cutoff Cleared' : '✕ Below Cutoff'}
                  </span>
                </div>
              </div>

              {/* 2. Skill Match Score */}
              <div className="col-md-4">
                <div className="p-3.5 bg-light rounded-3 border text-center h-100 d-flex flex-column justify-content-between">
                  <div className="small text-muted fw-bold text-uppercase" style={{ fontSize: '0.72rem' }}>
                    2. Skill Match Score (30% Weightage)
                  </div>
                  <div className="my-2">
                    <div className="fs-2 fw-bold text-info">{activeScores.skillScore}%</div>
                    <div className="small text-secondary" style={{ fontSize: '0.74rem' }}>
                      {activeDriveEval?.matchedSkills?.length || 0} of {activeDriveEval?.requiredSkills?.length || 0} required skills
                    </div>
                  </div>
                  <span className={`badge ${activeScores.skillScore >= 60 ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'} fw-bold`}>
                    {activeScores.skillScore >= 60 ? '✓ Skill Gate Cleared' : '⚡ Add Missing Skills'}
                  </span>
                </div>
              </div>

              {/* 3. Final Eligibility Score */}
              <div className="col-md-4">
                <div className="p-3.5 bg-light rounded-3 border text-center h-100 d-flex flex-column justify-content-between">
                  <div className="small text-muted fw-bold text-uppercase" style={{ fontSize: '0.72rem' }}>
                    3. Final Eligibility Score
                  </div>
                  <div className="my-2">
                    <div className={`fs-2 fw-bold ${activeScores.isEligible ? 'text-success' : 'text-danger'}`}>
                      {activeScores.finalScore}%
                    </div>
                    <div className="small text-secondary" style={{ fontSize: '0.74rem' }}>
                      Formula: 70%({activeScores.cgpaScore}) + 30%({activeScores.skillScore})
                    </div>
                  </div>
                  <div>
                    {activeScores.isEligible ? (
                      <span className="badge-eligible">
                        ✓ Benchmark Met (≥ 65%)
                      </span>
                    ) : (
                      <span className="badge-not-eligible">
                        ✕ Needs Improvement (&lt; 65%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Two-Stage Eligibility Pipeline Visualizer */}
            {activeDriveEval && (
              <EligibilityPipeline mode="student" studentEval={activeDriveEval} />
            )}
          </div>
        )}
      </div>

      {/* All Drives Overview Table */}
      <div className="card custom-card p-4 shadow-sm border-0 mb-4">
        <h5 className="fw-bold text-dark mb-3">📋 All Recruiting Drives Eligibility Status</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Company</th>
                <th className="text-center">Cutoff CGPA</th>
                <th className="text-center">CGPA Score (70%)</th>
                <th className="text-center">Skill Match (30%)</th>
                <th className="text-center">Final Score</th>
                <th className="text-center">Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {overview.map(drive => {
                const s = calculateScore(student?.cgpa || 0, drive.skillMatchPercentage || 0);
                const isDriveApp = applications.some(a => String(a.companyId) === String(drive.companyId));
                return (
                  <tr key={drive.companyId}>
                    <td className="fw-bold text-dark">{drive.companyName}</td>
                    <td className="text-center">{drive.requiredCgpa}</td>
                    <td className="text-center">{s.cgpaScore}%</td>
                    <td className="text-center">{s.skillScore}%</td>
                    <td className="text-center fw-bold text-dark">{s.finalScore}%</td>
                    <td className="text-center">
                      <div className="d-flex flex-column align-items-center gap-1">
                        {drive.finalEligible ? (
                          <span className="badge-eligible">
                            ✓ Eligible
                          </span>
                        ) : (
                          <span className="badge-not-eligible">
                            ✕ Not Eligible
                          </span>
                        )}
                        {isDriveApp && (
                          <span className="badge bg-primary bg-opacity-10 text-primary px-2 py-0.5 rounded-pill small" style={{ fontSize: '0.68rem' }}>
                            ✓ Applied
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-outline-primary py-1 px-2.5 rounded-3 fw-bold"
                        onClick={() => setSelectedCompanyId(String(drive.companyId))}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentEligibility;
