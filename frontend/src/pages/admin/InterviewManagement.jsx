import React, { useState, useEffect } from 'react';
import { interviewService, companyService, studentService } from '../../services/api';

const InterviewManagement = () => {
  const [interviews, setInterviews] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingInterview, setEditingInterview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    companyId: '',
    roundName: 'Aptitude Test',
    interviewDate: '',
    venue: '',
    meetingLink: '',
    instructions: '',
    remarks: '',
    studentIds: []
  });

  const roundTypes = [
    'Aptitude Test',
    'Technical Round',
    'HR Round',
    'Group Discussion',
    'Final Interview'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [interviewsData, companiesData, studentsData] = await Promise.all([
        interviewService.getInterviews(),
        companyService.getCompanies(),
        studentService.getAllStudents()
      ]);
      setInterviews(interviewsData);
      setCompanies(companiesData);
      setStudents(studentsData);
    } catch (err) {
      console.error('Error fetching interview coordination data', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on selected company eligibility
  const getEligibleStudents = () => {
    if (!formData.companyId) return [];
    const selectedComp = companies.find(c => String(c.companyId) === String(formData.companyId));
    if (!selectedComp) return [];

    const minCgpa = selectedComp.eligibilityCgpa;
    const eligibleDepts = selectedComp.eligibleDepartments.split(',').map(d => d.trim().toLowerCase());

    return students.filter(student => {
      // Must meet CGPA
      if (student.cgpa < minCgpa) return false;
      // Must meet Department
      const studentDept = student.department.trim().toLowerCase();
      return eligibleDepts.includes(studentDept);
    });
  };

  const handleOpenCreate = () => {
    setEditingInterview(null);
    const initialCompanyId = companies.length > 0 ? String(companies[0].companyId) : '';
    setFormData({
      companyId: initialCompanyId,
      roundName: 'Aptitude Test',
      interviewDate: '',
      venue: '',
      meetingLink: '',
      instructions: '',
      remarks: '',
      studentIds: []
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (interview) => {
    setEditingInterview(interview);
    setFormData({
      companyId: String(interview.companyId),
      roundName: interview.roundName,
      interviewDate: interview.interviewDate,
      venue: interview.venue,
      meetingLink: interview.meetingLink || '',
      instructions: interview.instructions || '',
      remarks: interview.remarks || '',
      studentIds: interview.studentIds || []
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStudentCheckboxChange = (studentId) => {
    const currentSelected = [...formData.studentIds];
    if (currentSelected.includes(studentId)) {
      setFormData({
        ...formData,
        studentIds: currentSelected.filter(id => id !== studentId)
      });
    } else {
      setFormData({
        ...formData,
        studentIds: [...currentSelected, studentId]
      });
    }
  };

  const selectAllEligible = () => {
    const eligible = getEligibleStudents();
    setFormData({
      ...formData,
      studentIds: eligible.map(s => s.studentId)
    });
  };

  const deselectAllEligible = () => {
    setFormData({
      ...formData,
      studentIds: []
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.studentIds.length === 0) {
      setError('Please assign at least one eligible student to this interview.');
      return;
    }

    const body = {
      ...formData,
      companyId: parseInt(formData.companyId)
    };

    try {
      if (editingInterview) {
        await interviewService.updateInterview(editingInterview.interviewId, body);
        setSuccess('Interview schedule updated successfully!');
      } else {
        await interviewService.createInterview(body);
        setSuccess('Interview scheduled successfully!');
      }
      setTimeout(() => {
        setIsModalOpen(false);
        fetchData();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this interview schedule? All assigned students will receive cancellation notifications.')) {
      return;
    }
    try {
      await interviewService.deleteInterview(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Could not cancel interview schedule.');
    }
  };

  const eligibleStudentsList = getEligibleStudents();

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold m-0 text-dark">Interview Coordination</h2>
          <p className="text-muted small mb-0">Schedule interview rounds, link virtual rooms, and allocate candidate pools</p>
        </div>
        <button className="btn btn-primary fw-semibold py-2 px-4 shadow-sm" onClick={handleOpenCreate}>
          ➕ Schedule Interview Round
        </button>
      </div>

      {/* Interviews list */}
      <div className="card custom-card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle m-0">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Round Name</th>
                <th>Date & Time</th>
                <th>Venue / Location</th>
                <th>Assigned Students</th>
                <th>Meeting Link</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {interviews.length > 0 ? (
                interviews.map((item) => (
                  <tr key={item.interviewId}>
                    <td className="fw-bold text-dark">{item.companyName}</td>
                    <td className="fw-semibold text-primary">{item.roundName}</td>
                    <td className="small text-secondary">{new Date(item.interviewDate).toLocaleString()}</td>
                    <td className="small text-muted">{item.venue}</td>
                    <td>
                      <span className="badge badge-status eligible text-primary fw-bold" title={item.studentNames?.join(', ')}>
                        👤 {item.studentIds?.length || 0} Candidates
                      </span>
                    </td>
                    <td className="small">
                      {item.meetingLink ? (
                        <a href={item.meetingLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary py-1 px-3 border-0 bg-primary bg-opacity-10 text-primary fw-semibold" style={{ fontSize: '0.78rem' }}>
                          🔗 Join
                        </a>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary me-2 fw-semibold" onClick={() => handleOpenEdit(item)}>
                        ⚙️ Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger fw-semibold" onClick={() => handleDelete(item.interviewId)}>
                        🗑️ Cancel
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted small">No interview rounds currently configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(36, 21, 47, 0.75)', backdropFilter: 'blur(3px)', overflowY: 'auto' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content p-4 rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 p-0 mb-3">
                <h5 className="modal-title fw-bold text-primary fs-4">
                  {editingInterview ? '⚙️ Edit Interview Details' : '📅 Schedule New Interview Round'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
              </div>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              {success && <div className="alert alert-success py-2 small">{success}</div>}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">Target Company Drive</label>
                    <select
                      name="companyId"
                      className="form-select"
                      value={formData.companyId}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">-- Select Company --</option>
                      {companies.map(c => (
                        <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">Interview Round Type</label>
                    <select
                      name="roundName"
                      className="form-select"
                      value={formData.roundName}
                      onChange={handleFormChange}
                      required
                    >
                      {roundTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">Date and Time</label>
                    <input
                      type="datetime-local"
                      name="interviewDate"
                      className="form-control"
                      value={formData.interviewDate}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">Venue / Office Location</label>
                    <input
                      type="text"
                      name="venue"
                      className="form-control"
                      placeholder="e.g. Placement Cell Cell Room 102"
                      value={formData.venue}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">Virtual Meeting Link (optional)</label>
                    <input
                      type="url"
                      name="meetingLink"
                      className="form-control"
                      placeholder="https://meet.google.com/xyz"
                      value={formData.meetingLink}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">Officer Remarks (optional)</label>
                    <input
                      type="text"
                      name="remarks"
                      className="form-control"
                      placeholder="e.g. Bring double hardcopy resumes"
                      value={formData.remarks}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Instructions / Guidelines</label>
                  <textarea
                    name="instructions"
                    className="form-control"
                    rows="2"
                    placeholder="Review dynamic programming, graphs, and system design patterns..."
                    value={formData.instructions}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Assign Eligible Students Checklist */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label small fw-semibold m-0">Assign Eligible Students ({formData.studentIds.length} Selected)</label>
                    {eligibleStudentsList.length > 0 && (
                      <div>
                        <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2 me-2 small fw-semibold" style={{ fontSize: '0.75rem' }} onClick={selectAllEligible}>
                          Select All
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2 small fw-semibold" style={{ fontSize: '0.75rem' }} onClick={deselectAllEligible}>
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-3 p-3 bg-light" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {eligibleStudentsList.length > 0 ? (
                      <div className="row g-2">
                        {eligibleStudentsList.map(s => {
                          const isChecked = formData.studentIds.includes(s.studentId);
                          return (
                            <div className="col-md-6" key={s.studentId}>
                              <div className={`p-2 rounded-3 border bg-white d-flex align-items-center gap-2 ${isChecked ? 'border-primary bg-primary bg-opacity-5' : ''}`}>
                                <input
                                  type="checkbox"
                                  id={`student-check-${s.studentId}`}
                                  checked={isChecked}
                                  onChange={() => handleStudentCheckboxChange(s.studentId)}
                                />
                                <label htmlFor={`student-check-${s.studentId}`} className="small m-0 cursor-pointer d-flex flex-column">
                                  <span className="fw-bold text-dark">{s.name} ({s.department})</span>
                                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>CGPA: {s.cgpa} | Reg: {s.regNo}</span>
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted small">
                        {formData.companyId 
                          ? 'No students meet eligibility criteria (CGPA and department match) for this company.' 
                          : 'Select a company first to load eligible students.'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer border-0 p-0 pt-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-semibold shadow-sm">Save Schedule</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewManagement;
