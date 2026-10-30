import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { companyService, applicationService, studentService } from '../../services/api';

const EligibleCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [student, setStudent] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const [eligibilityList, setEligibilityList] = useState([]);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ELIGIBLE' | 'APPLIED' | 'SKILL_PENDING'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      const [companiesData, studentData, appsData, eligData] = await Promise.all([
        companyService.getCompanies(),
        studentService.getProfile(),
        applicationService.getMyApplications(),
        studentService.getEligibilityOverview().catch(() => [])
      ]);
      setCompanies(companiesData || []);
      setStudent(studentData);
      setMyApplications(appsData || []);
      setEligibilityList(eligData || []);
    } catch (err) {
      console.error('Error fetching drives data', err);
      setMessage({ text: 'Failed to retrieve active placement drives.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const eligibilityMap = useMemo(() => {
    const map = new Map();
    eligibilityList.forEach(item => {
      if (item && item.companyId) {
        map.set(item.companyId, item);
      }
    });
    return map;
  }, [eligibilityList]);

  const handleApply = async (companyId) => {
    setApplyingId(companyId);
    setMessage({ text: '', type: '' });

    try {
      await applicationService.apply(companyId);
      setMessage({ text: 'Application submitted successfully! Two-Stage Verification Cleared.', type: 'success' });
      fetchData(); // reload
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to submit application.', type: 'danger' });
    } finally {
      setApplyingId(null);
    }
  };

  // Helper to check if student already applied
  const getAppliedStatus = (companyId) => {
    const found = myApplications.find(app => app.companyId === companyId);
    return found ? found.status : null;
  };

  // Helper to evaluate eligibility (with fallback if overview isn't loaded)
  const getEval = (company) => {
    if (eligibilityMap.has(company.companyId)) {
      return eligibilityMap.get(company.companyId);
    }
    // Fallback local computation
    const sCgpa = student?.cgpa || 0;
    const sSkills = student?.skills || [];
    const rSkills = company.requiredSkills || [];
    const matched = rSkills.filter(r => sSkills.some(s => s.toLowerCase() === r.toLowerCase()));
    const missing = rSkills.filter(r => !sSkills.some(s => s.toLowerCase() === r.toLowerCase()));
    const score = rSkills.length > 0 ? Math.round((matched.length / rSkills.length) * 100) : 100;
    const cgpaPassed = sCgpa >= company.eligibilityCgpa;
    const skillPassed = score >= 60;
    const deptPassed = (company.eligibleDepartments || '').toLowerCase().includes((student?.department || '').toLowerCase());
    const finalPassed = cgpaPassed && skillPassed && deptPassed;

    return {
      companyId: company.companyId,
      companyName: company.companyName,
      studentCgpa: sCgpa,
      requiredCgpa: company.eligibilityCgpa,
      cgpaEligible: cgpaPassed,
      cgpaStatus: cgpaPassed ? 'PASSED' : 'CGPA Not Eligible',
      skillMatchPercentage: score,
      skillEligible: skillPassed,
      skillStatus: skillPassed ? 'PASSED' : 'Skill Match Ineligible (<60%)',
      studentSkills: sSkills,
      requiredSkills: rSkills,
      matchedSkills: matched,
      missingSkills: missing,
      departmentEligible: deptPassed,
      finalEligible: finalPassed,
      eligibilityStatus: !cgpaPassed ? 'CGPA_NOT_ELIGIBLE' : !skillPassed ? 'SKILL_NOT_ELIGIBLE' : 'FINAL_ELIGIBLE',
      message: !cgpaPassed ? `Minimum CGPA required is ${company.eligibilityCgpa}` : !skillPassed ? `Skill match score is ${score}% (Min 60% required)` : 'Two-Stage Eligibility Cleared'
    };
  };

  // Filtered companies
  const filteredCompanies = companies.filter(company => {
    const evalData = getEval(company);
    const applied = Boolean(getAppliedStatus(company.companyId));
    
    // Search match
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = company.companyName?.toLowerCase().includes(q);
      const matchSkills = (company.requiredSkills || []).some(s => s.toLowerCase().includes(q));
      if (!matchName && !matchSkills) return false;
    }

    if (filterMode === 'ELIGIBLE') return evalData.finalEligible && !applied;
    if (filterMode === 'APPLIED') return applied;
    if (filterMode === 'SKILL_PENDING') return evalData.cgpaEligible && !evalData.skillEligible;
    return true;
  });

  const eligibleCount = companies.filter(c => getEval(c).finalEligible && !getAppliedStatus(c.companyId)).length;
  const appliedCount = myApplications.length;

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  return (
    <div>
      <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h2 className="fw-bold m-0 text-dark">Eligible Placement Drives</h2>
          <p className="text-muted small mb-0">
            Intelligent two-stage verification: CGPA Screening + Skill Match (≥ 60%)
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill fw-bold">
            ✓ {eligibleCount} Drives Qualified
          </span>
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary px-3 py-2 rounded-pill fw-bold">
            📋 {appliedCount} Applied
          </span>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'danger' ? 'danger' : 'success'} alert-dismissible fade show border-0 rounded-3 small fw-semibold py-2 px-3 mb-4`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ text: '', type: '' })}></button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="card custom-card border-0 shadow-sm p-3 mb-4 rounded-3">
        <div className="row g-3 align-items-center">
          <div className="col-md-7">
            <div className="btn-group w-100 flex-wrap" role="group">
              <button
                type="button"
                className={`btn btn-sm ${filterMode === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'} fw-semibold`}
                onClick={() => setFilterMode('ALL')}
              >
                All Drives ({companies.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterMode === 'ELIGIBLE' ? 'btn-success text-white' : 'btn-outline-secondary'} fw-semibold`}
                onClick={() => setFilterMode('ELIGIBLE')}
              >
                ✓ Fully Eligible ({eligibleCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterMode === 'SKILL_PENDING' ? 'btn-warning text-dark' : 'btn-outline-secondary'} fw-semibold`}
                onClick={() => setFilterMode('SKILL_PENDING')}
              >
                ⚡ Skill Upskill Needed
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterMode === 'APPLIED' ? 'btn-primary text-white' : 'btn-outline-secondary'} fw-semibold`}
                onClick={() => setFilterMode('APPLIED')}
              >
                📋 Applied ({appliedCount})
              </button>
            </div>
          </div>
          <div className="col-md-5">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by company name or required skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredCompanies.length > 0 ? (
        <div className="row g-4">
          {filteredCompanies.map((company) => {
            const appliedStatus = getAppliedStatus(company.companyId);
            const evalData = getEval(company);
            const { finalEligible, cgpaEligible, skillEligible, skillMatchPercentage, matchedSkills, missingSkills } = evalData;

            return (
              <div className="col-md-6" key={company.companyId}>
                <div className="card custom-card h-100 p-4 d-flex flex-column justify-content-between shadow-sm border-0 position-relative">
                  <div>
                    {/* Top Row: Company & Match Score Badge */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h4 className="fw-bold text-primary mb-1">{company.companyName}</h4>
                        <div className="text-muted small">
                          CTC: <strong className="text-dark">{company.packageAmount.toFixed(2)} LPA</strong> | Cutoff: <strong className="text-dark">{company.eligibilityCgpa.toFixed(2)} CGPA</strong>
                        </div>
                      </div>

                      {appliedStatus ? (
                        <span className="badge badge-status selected text-uppercase fw-bold">Applied</span>
                      ) : finalEligible ? (
                        <div className="d-flex flex-column align-items-end gap-1">
                          <span className="badge bg-success text-white fw-bold px-2.5 py-1.5 rounded-pill shadow-sm">
                            ✓ {skillMatchPercentage}% Match
                          </span>
                          <span className="badge bg-success bg-opacity-10 text-success fw-semibold" style={{ fontSize: '0.68rem' }}>
                            Two-Stage Cleared
                          </span>
                        </div>
                      ) : !cgpaEligible ? (
                        <div className="d-flex flex-column align-items-end gap-1">
                          <span className="badge bg-danger text-white fw-bold px-2.5 py-1.5 rounded-pill">
                            CGPA Not Eligible
                          </span>
                          <span className="text-muted small" style={{ fontSize: '0.68rem' }}>Stage 1 Ineligible</span>
                        </div>
                      ) : (
                        <div className="d-flex flex-column align-items-end gap-1">
                          <span className="badge bg-warning text-dark fw-bold px-2.5 py-1.5 rounded-pill">
                            {skillMatchPercentage}% Match (&lt;60%)
                          </span>
                          <span className="text-muted small" style={{ fontSize: '0.68rem' }}>Stage 2 Ineligible</span>
                        </div>
                      )}
                    </div>

                    <p className="text-secondary small mb-3">{company.description}</p>

                    {/* Skill Match Breakdown Bar */}
                    <div className="mb-3 p-2.5 bg-light bg-opacity-70 rounded-3 border">
                      <div className="d-flex justify-content-between align-items-center mb-1.5">
                        <span className="small fw-bold text-dark" style={{ fontSize: '0.78rem' }}>
                          Technical Skill Match:
                        </span>
                        <span className={`small fw-bold ${skillMatchPercentage >= 60 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.78rem' }}>
                          {skillMatchPercentage}% {skillMatchPercentage >= 60 ? '(≥ 60% Met)' : '(Under 60% Cutoff)'}
                        </span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar ${skillMatchPercentage >= 60 ? 'bg-success' : 'bg-warning'}`}
                          role="progressbar"
                          style={{ width: `${Math.min(100, Math.max(5, skillMatchPercentage))}%` }}
                        ></div>
                      </div>

                      {/* Required Skills Chips */}
                      {company.requiredSkills && company.requiredSkills.length > 0 && (
                        <div className="mt-2.5 pt-2 border-top">
                          <div className="text-muted small fw-semibold mb-1" style={{ fontSize: '0.7rem' }}>
                            Required Skills ({matchedSkills.length}/{company.requiredSkills.length} Matched):
                          </div>
                          <div className="d-flex flex-wrap gap-1">
                            {company.requiredSkills.map(skill => {
                              const isMatched = matchedSkills.some(m => m.toLowerCase() === skill.toLowerCase());
                              return (
                                <span
                                  key={skill}
                                  className={`badge px-2 py-1 rounded-2 small fw-semibold ${
                                    isMatched
                                      ? 'bg-success bg-opacity-15 text-success border border-success border-opacity-30'
                                      : 'bg-light text-muted border border-dashed'
                                  }`}
                                  style={{ fontSize: '0.7rem' }}
                                >
                                  {isMatched ? `✓ ${skill}` : `✕ ${skill}`}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Two-Stage Eligibility Status Box */}
                    {!appliedStatus && !finalEligible && (
                      <div className="alert alert-warning border-0 bg-warning bg-opacity-10 text-dark py-2 px-3 small mb-3 rounded-3 fw-medium">
                        {!cgpaEligible ? (
                          <div>
                            <strong>Stage 1 Ineligible:</strong> CGPA Not Eligible (Cutoff: {company.eligibilityCgpa.toFixed(2)}, Yours: {student?.cgpa?.toFixed(2)})
                          </div>
                        ) : !skillEligible ? (
                          <div>
                            <strong>Stage 2 Ineligible:</strong> Skill match {skillMatchPercentage}% is below 60% threshold. Missing: <span className="text-danger fw-semibold">{missingSkills.slice(0, 3).join(', ')}{missingSkills.length > 3 ? '...' : ''}</span>
                          </div>
                        ) : (
                          <div>{evalData.message}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-2 pt-2 border-top">
                    {appliedStatus ? (
                      <Link to={`/student/companies/${company.companyId}`} className="btn btn-outline-primary w-100 py-2 fw-semibold">
                        Track Application & Timeline →
                      </Link>
                    ) : finalEligible ? (
                      <div className="d-flex flex-column gap-2">
                        <button
                          className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm"
                          onClick={() => handleApply(company.companyId)}
                          disabled={applyingId === company.companyId}
                        >
                          {applyingId === company.companyId ? 'Submitting Application...' : '⚡ Apply Now (Eligible)'}
                        </button>
                        <Link to={`/student/companies/${company.companyId}`} className="btn btn-outline-secondary w-100 py-1.5 fw-semibold" style={{ fontSize: '0.82rem' }}>
                          View Full Verification Pipeline
                        </Link>
                      </div>
                    ) : (
                      <Link to={`/student/companies/${company.companyId}`} className="btn btn-outline-secondary w-100 py-2 fw-semibold">
                        View Eligibility Requirements & Pipeline →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-5 text-muted card custom-card border-0 shadow-sm p-5">
          <span className="fs-1 d-block mb-3">🔍</span>
          <h5>No recruitment drives found</h5>
          <p className="small mb-0">No active placement drives match the current filter or search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default EligibleCompanies;

