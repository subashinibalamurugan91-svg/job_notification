import React from 'react';

/**
 * Professional Two-Stage Eligibility Pipeline Component
 * CGPA Check → Skill Match Analysis → Final Eligibility → Notification Sent
 * Formula: Eligibility Score = 70% CGPA + 30% Skill Match
 */
const EligibilityPipeline = ({ 
  mode = 'admin', // 'admin' | 'student'
  pipelineData = null, // for admin summary
  studentEval = null, // for student drive view
  onNotifyEligible = null,
  isNotifying = false
}) => {

  // Admin Pipeline Mode
  if (mode === 'admin') {
    const total = pipelineData?.totalStudents || pipelineData?.candidatesCount || 0;
    const cgpaEligible = pipelineData?.cgpaEligibleStudents ?? pipelineData?.cgpaEligible ?? 0;
    const skillEligible = pipelineData?.skillEligibleStudents ?? pipelineData?.skillEligible ?? 0;
    const finalEligible = pipelineData?.finalEligibleStudents ?? pipelineData?.finalEligible ?? 0;
    const notificationsSent = pipelineData?.notificationsSent ?? finalEligible;

    const cgpaRate = total > 0 ? ((cgpaEligible / total) * 100).toFixed(1) : 0;
    const skillRate = total > 0 ? ((skillEligible / total) * 100).toFixed(1) : 0;
    const finalRate = total > 0 ? ((finalEligible / total) * 100).toFixed(1) : 0;

    const stages = [
      {
        id: 'cgpa',
        stageNumber: '01',
        title: 'CGPA Check',
        subtitle: 'Stage 1 Academic Screening (70%)',
        count: cgpaEligible,
        rate: `${cgpaRate}%`,
        dropoff: total > 0 ? `${(100 - cgpaRate).toFixed(1)}%` : '0%',
        badge: 'Stage 1',
        badgeClass: 'bg-primary',
        icon: '🎓',
        description: 'Meets minimum CGPA cutoff criteria'
      },
      {
        id: 'skill',
        stageNumber: '02',
        title: 'Skill Match Analysis',
        subtitle: 'Stage 2 Technical Filter (30%)',
        count: skillEligible,
        rate: `${skillRate}%`,
        dropoff: total > 0 ? `${(100 - skillRate).toFixed(1)}%` : '0%',
        badge: 'Stage 2',
        badgeClass: 'bg-primary',
        icon: '⚡',
        description: 'Scores ≥ 60% match on required skills'
      },
      {
        id: 'final',
        stageNumber: '03',
        title: 'Final Eligibility',
        subtitle: '70% CGPA + 30% Skill Match',
        count: finalEligible,
        rate: `${finalRate}%`,
        dropoff: total > 0 ? `${(100 - finalRate).toFixed(1)}%` : '0%',
        badge: 'Verified Pool',
        badgeClass: 'bg-success',
        icon: '🎯',
        description: 'Satisfies both criteria gates (Score ≥ 65%)'
      },
      {
        id: 'notify',
        stageNumber: '04',
        title: 'Notification Sent',
        subtitle: 'Automated Placement Alerts',
        count: notificationsSent,
        rate: '100%',
        dropoff: '0%',
        badge: 'Targeted Alerts',
        badgeClass: 'bg-dark',
        icon: '📢',
        description: 'Sent strictly to Stage 1 + 2 eligible students'
      }
    ];

    return (
      <div className="eligibility-pipeline-wrapper my-2">
        {/* Pipeline Stepper Container */}
        <div className="card custom-card border-0 shadow-sm p-4 rounded-4 position-relative overflow-hidden">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1.5 rounded-pill fw-bold" style={{ fontSize: '0.72rem' }}>
                  INTELLIGENT TWO-STAGE FILTER
                </span>
                <span className="badge bg-success bg-opacity-10 text-success px-2.5 py-1 rounded-pill small fw-semibold">
                  Active Formula
                </span>
              </div>
              <h4 className="fw-bold text-dark mt-2 mb-1">Recruitment Eligibility Pipeline</h4>
              <p className="text-secondary small mb-0">
                Formula: <strong>Eligibility Score = 70% CGPA + 30% Skill Match</strong>. Minimum qualification benchmark: 65.0%.
              </p>
            </div>

            {onNotifyEligible && (
              <button
                type="button"
                className="btn btn-primary btn-sm px-3.5 py-2 fw-semibold rounded-3 d-inline-flex align-items-center gap-2 shadow-sm"
                onClick={onNotifyEligible}
                disabled={isNotifying || finalEligible === 0}
              >
                {isNotifying ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Dispatching Alerts...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Notify Eligible Students</span>
                    <span className="badge bg-white text-primary rounded-pill">{finalEligible}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Stepper Cards */}
          <div className="row g-3 position-relative">
            {stages.map((stage, idx) => (
              <div key={stage.id} className="col-12 col-sm-6 col-lg-3">
                <div className="pipeline-step-card h-100 p-3.5 rounded-3 border d-flex flex-column justify-content-between bg-light bg-opacity-40 position-relative transition-all">
                  <div>
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className={`badge ${stage.badgeClass} rounded-pill fw-bold px-2.5 py-1 text-white small`}>
                        {stage.badge}
                      </span>
                      <span className="text-muted fw-bold small" style={{ fontSize: '0.75rem' }}>
                        Step {stage.stageNumber}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fs-5">{stage.icon}</span>
                      <h6 className="fw-bold text-dark mb-0">{stage.title}</h6>
                    </div>
                    <div className="text-secondary small fw-medium mb-3" style={{ fontSize: '0.72rem' }}>
                      {stage.subtitle}
                    </div>

                    {/* Metrics */}
                    <div className="p-2.5 rounded-3 bg-white shadow-sm border mb-2">
                      <div className="d-flex justify-content-between align-items-baseline">
                        <span className="fs-4 fw-bold text-dark">{stage.count}</span>
                        <span className="badge bg-success bg-opacity-10 text-success fw-bold">
                          {stage.rate} pass
                        </span>
                      </div>
                      <div className="small text-muted d-flex justify-content-between mt-1" style={{ fontSize: '0.7rem' }}>
                        <span>Qualified candidates</span>
                        {idx > 0 && <span className="text-danger">Drop: {stage.dropoff}</span>}
                      </div>
                    </div>
                  </div>

                  <p className="text-muted small mb-0 mt-2" style={{ fontSize: '0.72rem' }}>
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Flow Indicator Footer */}
          <div className="mt-4 pt-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-2 small text-secondary">
            <div className="d-flex align-items-center gap-2 fw-semibold">
              <span className="text-primary">Pipeline Logic:</span>
              <span className="badge bg-light text-dark border">1. CGPA Screen (70%)</span>
              <span>+</span>
              <span className="badge bg-light text-dark border">2. Skill Match (30%)</span>
              <span>=</span>
              <span className="badge bg-success bg-opacity-10 text-success border">3. Eligibility Score</span>
              <span>→</span>
              <span className="badge bg-info bg-opacity-10 text-info border">4. Automated Alert</span>
            </div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              *Notifications are delivered strictly to students who clear the composite benchmark.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student Individual Drive Mode
  if (mode === 'student' && studentEval) {
    const studentCgpa = studentEval.studentCgpa || 0;
    const requiredCgpa = studentEval.requiredCgpa || 6.0;
    const cgpaPassed = Boolean(studentEval.cgpaEligible) || (studentCgpa >= requiredCgpa);
    const matchScore = studentEval.skillMatchPercentage || 0;
    const skillPassed = Boolean(studentEval.skillEligible) || (matchScore >= 60);

    // Requirement 7 Formula:
    // Eligibility Score = 70% CGPA + 30% Skill Match
    const cgpaScore = studentCgpa > 10 ? studentCgpa : (studentCgpa * 10);
    const finalEligibilityScore = parseFloat(((0.70 * cgpaScore) + (0.30 * matchScore)).toFixed(1));
    const finalPassed = finalEligibilityScore >= 65.0 && cgpaPassed;

    const matchedSkills = studentEval.matchedSkills || [];
    const missingSkills = studentEval.missingSkills || [];
    const requiredSkills = studentEval.requiredSkills || [];

    return (
      <div className="student-eligibility-pipeline card custom-card border-0 shadow-sm p-4 rounded-4 mb-4">
        {/* Header with Requirement 7 Badge */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4 pb-3 border-bottom">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill fw-bold" style={{ fontSize: '0.72rem' }}>
                INTELLIGENT ELIGIBILITY VERIFICATION
              </span>
              {finalPassed ? (
                <span className="badge-eligible">
                  ✓ ELIGIBLE
                </span>
              ) : (
                <span className="badge-not-eligible">
                  ✕ NOT ELIGIBLE
                </span>
              )}
            </div>
            <h5 className="fw-bold text-dark mt-2 mb-0">Eligibility Formula Verification</h5>
            <div className="small text-muted mt-1">
              Formula: <strong>Eligibility Score = 70% CGPA + 30% Skill Match</strong>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end">
              <div className="small text-secondary fw-bold" style={{ fontSize: '0.7rem' }}>FINAL SCORE</div>
              <div className={`fs-3 fw-bold ${finalPassed ? 'text-success' : 'text-danger'}`}>
                {finalEligibilityScore}%
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Formula Components */}
        <div className="row g-3 mb-4">
          {/* 1. CGPA Score */}
          <div className="col-md-4">
            <div className={`p-3 rounded-3 border h-100 text-center eligibility-score-card ${cgpaPassed ? 'eligibility-card-green' : 'bg-danger bg-opacity-10 border-danger'}`}>
              <div className="small fw-bold text-uppercase eligibility-score-label" style={{ fontSize: '0.7rem' }}>
                1. CGPA Score (70% Weightage)
              </div>
              <div className="fs-3 fw-bold eligibility-score-value my-1.5">{cgpaScore.toFixed(1)}%</div>
              <div className="small eligibility-score-subtitle">
                Your CGPA: <strong>{studentCgpa.toFixed(2)}</strong> / Cutoff: <strong>{requiredCgpa.toFixed(2)}</strong>
              </div>
              <span className={`badge mt-2 ${cgpaPassed ? 'badge-dark-navy' : 'bg-danger text-white'}`}>
                {cgpaPassed ? 'Passed Cutoff' : 'CGPA Ineligible'}
              </span>
            </div>
          </div>

          {/* 2. Skill Match Score */}
          <div className="col-md-4">
            <div className={`p-3 rounded-3 border h-100 text-center eligibility-score-card ${skillPassed ? 'eligibility-card-green' : 'bg-warning bg-opacity-10 border-warning'}`}>
              <div className="small fw-bold text-uppercase eligibility-score-label" style={{ fontSize: '0.7rem' }}>
                2. Skill Match Score (30% Weightage)
              </div>
              <div className="fs-3 fw-bold eligibility-score-value my-1.5">{matchScore}%</div>
              <div className="small eligibility-score-subtitle">
                Matched: <strong>{matchedSkills.length}</strong> / {requiredSkills.length} required skills
              </div>
              <span className={`badge mt-2 ${skillPassed ? 'badge-dark-navy' : 'bg-warning text-dark'}`}>
                {skillPassed ? 'Skill Threshold Cleared' : 'Needs Technical Skills'}
              </span>
            </div>
          </div>

          {/* 3. Final Eligibility Score */}
          <div className="col-md-4">
            <div className={`p-3 rounded-3 border h-100 text-center eligibility-score-card ${finalPassed ? 'eligibility-card-green' : 'bg-danger bg-opacity-10 border-danger'}`}>
              <div className="small fw-bold text-uppercase eligibility-score-label" style={{ fontSize: '0.7rem' }}>
                3. Final Eligibility Score
              </div>
              <div className="fs-3 fw-bold eligibility-score-value my-1.5">
                {finalEligibilityScore}%
              </div>
              <div className="small eligibility-score-subtitle">
                70% × {cgpaScore.toFixed(0)}% + 30% × {matchScore}%
              </div>
              <div className="mt-2">
                {finalPassed ? (
                  <span className="badge badge-dark-navy">
                    ✓ Cleared Benchmark (≥65%)
                  </span>
                ) : (
                  <span className="badge-not-eligible">
                    ✕ Below Benchmark (&lt;65%)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown: Matched & Missing Skills */}
        <div className="row g-3 p-3 rounded-3 border skill-breakdown-container">
          <div className="col-md-6">
            <div className="small fw-bold text-success mb-2 d-flex align-items-center gap-1.5">
              <span>✓ Matched Skills ({matchedSkills.length})</span>
            </div>
            <div className="d-flex flex-wrap gap-1.5">
              {matchedSkills.length > 0 ? (
                matchedSkills.map(skill => (
                  <span key={skill} className="badge badge-skill-matched px-2.5 py-1 rounded-3 fw-semibold">
                    ✓ {skill}
                  </span>
                ))
              ) : (
                <span className="text-muted small">No matching skills found</span>
              )}
            </div>
          </div>

          <div className="col-md-6">
            <div className="small fw-bold text-danger mb-2 d-flex align-items-center gap-1.5">
              <span>✕ Missing Skills ({missingSkills.length})</span>
            </div>
            <div className="d-flex flex-wrap gap-1.5">
              {missingSkills.length > 0 ? (
                missingSkills.map(skill => (
                  <span key={skill} className="badge badge-skill-missing px-2.5 py-1 rounded-3 fw-semibold">
                    ✕ {skill}
                  </span>
                ))
              ) : (
                <span className="text-success small fw-semibold">✓ 100% skill match! No missing skills.</span>
              )}
            </div>
          </div>
        </div>

        {/* System Message */}
        {studentEval.message && (
          <div className={`mt-3 p-2.5 rounded-3 small fw-semibold alert ${finalPassed ? 'alert-success' : 'alert-warning'}`}>
            ℹ️ {studentEval.message}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default EligibilityPipeline;
