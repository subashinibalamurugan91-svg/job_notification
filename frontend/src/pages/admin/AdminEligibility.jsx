import React, { useState, useEffect, useMemo } from 'react';
import { studentService, companyService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EligibilityPipeline from '../../components/EligibilityPipeline';

const AdminEligibility = () => {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected company for pipeline analysis
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [pipelineData, setPipelineData] = useState(null);
  const [isNotifying, setIsNotifying] = useState(false);

  // Interactive Student Evaluator states
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [evalCompanyId, setEvalCompanyId] = useState('');

  // Manual Test Simulator states
  const [customCgpa, setCustomCgpa] = useState('8.20');
  const [customSkillMatch, setCustomSkillMatch] = useState('75');

  // Search & Filter in student eligibility table
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [studentsData, companiesData] = await Promise.all([
        studentService.getAllStudents(),
        companyService.getCompanies()
      ]);

      setStudents(studentsData || []);
      setCompanies(companiesData || []);

      if (companiesData && companiesData.length > 0) {
        setSelectedCompanyId(String(companiesData[0].companyId));
        setEvalCompanyId(String(companiesData[0].companyId));
        loadCompanyPipeline(companiesData[0].companyId);
      }
      if (studentsData && studentsData.length > 0) {
        setSelectedStudentId(String(studentsData[0].studentId));
      }
    } catch (err) {
      console.error('Error fetching eligibility data', err);
      toast.error('Failed to load eligibility records.');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyPipeline = async (companyId) => {
    try {
      const data = await companyService.getEligibilityPipeline(companyId);
      setPipelineData(data);
    } catch (err) {
      console.error('Error loading company eligibility pipeline', err);
    }
  };

  const handleCompanyChange = (compId) => {
    setSelectedCompanyId(compId);
    loadCompanyPipeline(compId);
  };

  const handleNotifyEligible = async () => {
    if (!selectedCompanyId) return;
    setIsNotifying(true);
    try {
      const res = await companyService.notifyEligible(selectedCompanyId);
      toast.success(`Success! Targeted alerts sent to ${res.notificationsSent} eligible candidates.`);
      loadCompanyPipeline(selectedCompanyId);
    } catch (err) {
      toast.error('Failed to send alerts.');
    } finally {
      setIsNotifying(false);
    }
  };

  // Requirement 7 Formula Calculator:
  // Eligibility Score = 70% CGPA + 30% Skill Match
  const calculateEligibilityScore = (cgpa, skillMatchPct) => {
    const cgpaVal = parseFloat(cgpa) || 0;
    const cgpaScore = cgpaVal > 10 ? cgpaVal : (cgpaVal * 10); // scale to 100%
    const skillScore = parseFloat(skillMatchPct) || 0;
    const finalScore = (0.70 * cgpaScore) + (0.30 * skillScore);
    const isEligible = finalScore >= 65.0 && cgpaVal >= 6.0;
    return {
      cgpaScore: parseFloat(cgpaScore.toFixed(1)),
      skillScore: parseFloat(skillScore.toFixed(1)),
      finalScore: parseFloat(finalScore.toFixed(1)),
      isEligible
    };
  };

  // Interactive Live Evaluation calculation
  const liveEvaluation = useMemo(() => {
    const student = students.find(s => String(s.studentId) === String(selectedStudentId));
    const company = companies.find(c => String(c.companyId) === String(evalCompanyId));
    
    if (!student || !company) return null;

    // Student skills match against company required skills
    const studentSkills = student.skills || [];
    const requiredSkills = company.requiredSkills || [];

    let matched = [];
    let missing = [];

    if (requiredSkills.length === 0) {
      matched = studentSkills;
    } else {
      requiredSkills.forEach(req => {
        if (studentSkills.some(s => s.toLowerCase() === req.toLowerCase())) {
          matched.push(req);
        } else {
          missing.push(req);
        }
      });
    }

    const matchPct = requiredSkills.length > 0 
      ? Math.round((matched.length / requiredSkills.length) * 100) 
      : 80;

    const scores = calculateEligibilityScore(student.cgpa, matchPct);
    const meetsCgpaCutoff = student.cgpa >= (company.eligibilityCgpa || 6.0);
    const finalEligible = scores.isEligible && meetsCgpaCutoff;

    return {
      student,
      company,
      matched,
      missing,
      requiredSkills,
      studentCgpa: student.cgpa,
      requiredCgpa: company.eligibilityCgpa || 6.0,
      skillMatchScore: matchPct,
      ...scores,
      finalEligible
    };
  }, [students, companies, selectedStudentId, evalCompanyId]);

  // Simulator Calculation
  const simulatorResult = useMemo(() => {
    return calculateEligibilityScore(customCgpa, customSkillMatch);
  }, [customCgpa, customSkillMatch]);

  // Batch Candidate Table
  const candidateRows = useMemo(() => {
    const targetComp = companies.find(c => String(c.companyId) === String(evalCompanyId));
    const reqSkills = targetComp?.requiredSkills || [];
    const cutoff = targetComp?.eligibilityCgpa || 6.0;

    return students.map(s => {
      const skills = s.skills || [];
      let matchCount = 0;
      if (reqSkills.length > 0) {
        reqSkills.forEach(r => {
          if (skills.some(sk => sk.toLowerCase() === r.toLowerCase())) {
            matchCount++;
          }
        });
      }
      const matchPct = reqSkills.length > 0 ? Math.round((matchCount / reqSkills.length) * 100) : 75;
      const scores = calculateEligibilityScore(s.cgpa, matchPct);
      const isQualified = scores.finalScore >= 65 && s.cgpa >= cutoff;

      return {
        ...s,
        skillMatchPct: matchPct,
        cgpaScore: scores.cgpaScore,
        finalScore: scores.finalScore,
        isQualified
      };
    });
  }, [students, companies, evalCompanyId]);

  const filteredCandidateRows = useMemo(() => {
    let list = candidateRows;
    if (deptFilter !== 'ALL') {
      list = list.filter(s => s.department && s.department.toUpperCase().includes(deptFilter));
    }
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ELIGIBLE') {
        list = list.filter(s => s.isQualified);
      } else if (statusFilter === 'NOT_ELIGIBLE') {
        list = list.filter(s => !s.isQualified);
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q) || s.regNo?.toLowerCase().includes(q));
    }
    return list;
  }, [candidateRows, deptFilter, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Initializing intelligent eligibility screening engine...</p>
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
              INTELLIGENT RECRUITMENT FILTER
            </span>
            <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1 rounded-pill" style={{ fontSize: '0.74rem' }}>
              Formula-Driven Screening
            </span>
          </div>
          <h2 className="fw-bold m-0 text-dark">Eligibility & Screening Module</h2>
          <p className="text-muted small mb-0 mt-1">
            Standardized two-stage recruitment scoring combining Academic CGPA and Technical Skill Match.
          </p>
        </div>

        <button 
          onClick={fetchInitialData}
          className="btn btn-secondary btn-sm py-2 px-3 fw-semibold rounded-3"
        >
          🔄 Refresh Engine
        </button>
      </div>

      {/* ====================================================================
          REQUIREMENT 7: Formula Banner & Score Display
          Formula: Eligibility Score = 70% CGPA + 30% Skill Match
          ==================================================================== */}
      <div className="card custom-card p-4 mb-4 shadow-sm border-0" style={{
        background: 'linear-gradient(135deg, rgba(36, 21, 47, 0.04) 0%, rgba(214, 173, 96, 0.08) 100%)',
        borderLeft: '4px solid var(--accent-gold)'
      }}>
        <div className="row align-items-center g-3">
          <div className="col-lg-8">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-primary text-white fw-bold px-3 py-1 rounded-pill" style={{ fontSize: '0.72rem' }}>
                STANDARD FORMULA
              </span>
              <span className="small text-secondary fw-bold">Official Campus Recruitment Regulation</span>
            </div>
            <h4 className="fw-bold text-dark m-0">
              Eligibility Score = 70% CGPA + 30% Skill Match
            </h4>
            <p className="small text-secondary mb-0 mt-1">
              Candidates are evaluated on a balanced 100-point composite scale. Academic CGPA accounts for 70% weightage, and technical skill compatibility accounts for 30%. Minimum benchmark for qualification is 65.0%.
            </p>
          </div>

          <div className="col-lg-4 text-lg-end">
            <div className="d-inline-flex align-items-center gap-3 p-3 bg-white rounded-3 shadow-sm border">
              <div className="text-start">
                <div className="small text-muted fw-bold" style={{ fontSize: '0.68rem' }}>QUALIFICATION CRITERIA</div>
                <div className="fw-bold text-dark fs-6">Score ≥ 65.0%</div>
                <div className="small text-success fw-bold" style={{ fontSize: '0.7rem' }}>+ CGPA ≥ Drive Cutoff</div>
              </div>
              <span className="badge-eligible">
                ✓ Eligible Badge
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Candidate Evaluator Grid */}
      <div className="row g-4 mb-4">
        {/* Left: Live Student Evaluator */}
        <div className="col-lg-8">
          <div className="card custom-card p-4 shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark m-0">🎯 Interactive Candidate Evaluator</h5>
              <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">Real-Time Evaluation</span>
            </div>
            <p className="text-muted small mb-3">
              Select any candidate and recruiter drive to inspect their composite scores, formula calculation, and qualification status.
            </p>

            {/* Selectors */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label small fw-bold text-muted">Select Student Candidate:</label>
                <select 
                  className="form-select form-select-sm"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  {students.map(s => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.name} ({s.regNo}) - CGPA: {s.cgpa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold text-muted">Select Recruitment Drive:</label>
                <select 
                  className="form-select form-select-sm"
                  value={evalCompanyId}
                  onChange={(e) => setEvalCompanyId(e.target.value)}
                >
                  {companies.map(c => (
                    <option key={c.companyId} value={c.companyId}>
                      {c.companyName} (Cutoff: {c.eligibilityCgpa} CGPA, {c.packageAmount} LPA)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Evaluation Result Card */}
            {liveEvaluation && (
              <div className="p-4 rounded-3 border bg-light">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 pb-3 border-bottom gap-2">
                  <div>
                    <h5 className="fw-bold text-dark m-0">{liveEvaluation.student.name}</h5>
                    <div className="small text-muted">{liveEvaluation.student.regNo} | {liveEvaluation.student.department}</div>
                  </div>
                  <div>
                    {liveEvaluation.finalEligible ? (
                      <span className="badge-eligible fs-6 py-2 px-3">
                        ✓ ELIGIBLE
                      </span>
                    ) : (
                      <span className="badge-not-eligible fs-6 py-2 px-3">
                        ✕ NOT ELIGIBLE
                      </span>
                    )}
                  </div>
                </div>

                {/* Score Breakdown Metrics */}
                <div className="row g-3 mb-3 text-center">
                  <div className="col-md-4">
                    <div className="p-3 bg-white rounded-3 border shadow-sm">
                      <div className="small text-muted fw-bold" style={{ fontSize: '0.72rem' }}>1. CGPA SCORE (70%)</div>
                      <div className="fs-3 fw-bold text-primary mt-1">{liveEvaluation.cgpaScore}%</div>
                      <div className="small text-secondary" style={{ fontSize: '0.72rem' }}>
                        CGPA: {liveEvaluation.studentCgpa.toFixed(2)} / Cutoff: {liveEvaluation.requiredCgpa.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="p-3 bg-white rounded-3 border shadow-sm">
                      <div className="small text-muted fw-bold" style={{ fontSize: '0.72rem' }}>2. SKILL MATCH SCORE (30%)</div>
                      <div className="fs-3 fw-bold text-info mt-1">{liveEvaluation.skillScore}%</div>
                      <div className="small text-secondary" style={{ fontSize: '0.72rem' }}>
                        {liveEvaluation.matched.length} of {liveEvaluation.requiredSkills.length} required skills matched
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="p-3 bg-white rounded-3 border shadow-sm">
                      <div className="small text-muted fw-bold" style={{ fontSize: '0.72rem' }}>FINAL ELIGIBILITY SCORE</div>
                      <div className={`fs-3 fw-bold mt-1 ${liveEvaluation.finalEligible ? 'text-success' : 'text-danger'}`}>
                        {liveEvaluation.finalScore}%
                      </div>
                      <div className="small text-secondary" style={{ fontSize: '0.72rem' }}>
                        70%({liveEvaluation.cgpaScore}) + 30%({liveEvaluation.skillScore})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="row g-2 pt-2">
                  <div className="col-md-6">
                    <div className="small fw-bold text-success mb-1">✓ Matched Skills:</div>
                    <div className="d-flex flex-wrap gap-1">
                      {liveEvaluation.matched.map(s => (
                        <span key={s} className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                          ✓ {s}
                        </span>
                      ))}
                      {liveEvaluation.matched.length === 0 && <span className="small text-muted">None matched</span>}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="small fw-bold text-danger mb-1">✕ Missing Skills:</div>
                    <div className="d-flex flex-wrap gap-1">
                      {liveEvaluation.missing.map(s => (
                        <span key={s} className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">
                          ✕ {s}
                        </span>
                      ))}
                      {liveEvaluation.missing.length === 0 && <span className="small text-success">All skills matched!</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Formula Simulator */}
        <div className="col-lg-4">
          <div className="card custom-card p-4 shadow-sm border-0 h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold text-dark mb-1">🧮 Score Simulator</h5>
              <p className="text-muted small mb-3">Test hypothetical CGPA and skill parameters against the 70% + 30% formula.</p>

              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Test CGPA (0 - 10.0):</label>
                <input 
                  type="number"
                  step="0.05"
                  min="0"
                  max="10"
                  className="form-control form-control-sm"
                  value={customCgpa}
                  onChange={(e) => setCustomCgpa(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Skill Match % (0 - 100):</label>
                <input 
                  type="number"
                  step="5"
                  min="0"
                  max="100"
                  className="form-control form-control-sm"
                  value={customSkillMatch}
                  onChange={(e) => setCustomSkillMatch(e.target.value)}
                />
              </div>
            </div>

            <div className="p-3 rounded-3 bg-light border text-center">
              <div className="small text-muted fw-bold">CALCULATED FINAL SCORE</div>
              <div className="fs-2 fw-bold text-dark mt-1">{simulatorResult.finalScore}%</div>
              
              <div className="mt-2">
                {simulatorResult.isEligible ? (
                  <span className="badge-eligible">
                    ✓ Cleared Benchmark (≥65%)
                  </span>
                ) : (
                  <span className="badge-not-eligible">
                    ✕ Below Benchmark (&lt;65%)
                  </span>
                )}
              </div>

              <div className="small text-muted mt-2" style={{ fontSize: '0.72rem' }}>
                70% × {(parseFloat(customCgpa) * 10).toFixed(0)}% + 30% × {customSkillMatch}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Drive Pipeline & Dispatch */}
      <div className="card custom-card p-4 shadow-sm border-0 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
          <div>
            <h5 className="fw-bold text-dark m-0">⚡ Recruiter Pipeline & Alert Dispatch</h5>
            <p className="text-muted small mb-0 mt-0.5">Filter batch by drive, preview two-stage gates, and send automated notifications</p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label className="small text-muted fw-bold mb-0">Select Drive:</label>
            <select
              className="form-select form-select-sm fw-semibold"
              style={{ width: '220px' }}
              value={selectedCompanyId}
              onChange={(e) => handleCompanyChange(e.target.value)}
            >
              {companies.map(c => (
                <option key={c.companyId} value={c.companyId}>
                  {c.companyName} (Cutoff: {c.eligibilityCgpa})
                </option>
              ))}
            </select>
          </div>
        </div>

        {pipelineData && (
          <EligibilityPipeline 
            mode="admin"
            pipelineData={pipelineData}
            onNotifyEligible={handleNotifyEligible}
            isNotifying={isNotifying}
          />
        )}
      </div>

      {/* Candidate Eligibility Pool Table */}
      <div className="card custom-card p-4 shadow-sm border-0 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
          <div>
            <h5 className="fw-bold text-dark m-0">👥 Candidate Pool Eligibility Scores</h5>
            <p className="text-muted small mb-0 mt-0.5">All student records with computed formula scores for the active recruiter</p>
          </div>

          {/* Table Filters */}
          <div className="d-flex gap-2 flex-wrap">
            <select 
              className="form-select form-select-sm"
              style={{ width: '150px' }}
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="ALL">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
            </select>

            <select 
              className="form-select form-select-sm"
              style={{ width: '160px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Qualifications</option>
              <option value="ELIGIBLE">Eligible Only</option>
              <option value="NOT_ELIGIBLE">Not Eligible Only</option>
            </select>

            <input 
              type="text"
              className="form-control form-control-sm"
              placeholder="Search candidate..."
              style={{ width: '180px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Reg No</th>
                <th>Candidate Name</th>
                <th>Department</th>
                <th className="text-center">CGPA Score (70%)</th>
                <th className="text-center">Skill Match (30%)</th>
                <th className="text-center">Final Score</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidateRows.slice(0, 30).map(cand => (
                <tr key={cand.studentId}>
                  <td className="fw-bold">{cand.regNo}</td>
                  <td className="fw-semibold text-dark">{cand.name}</td>
                  <td>{cand.department}</td>
                  <td className="text-center">{cand.cgpaScore}%</td>
                  <td className="text-center">{cand.skillMatchPct}%</td>
                  <td className="text-center fw-bold">{cand.finalScore}%</td>
                  <td className="text-center">
                    {cand.isQualified ? (
                      <span className="badge-eligible">
                        ✓ Eligible
                      </span>
                    ) : (
                      <span className="badge-not-eligible">
                        ✕ Not Eligible
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminEligibility;
