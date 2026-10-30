import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService, companyService, interviewService } from '../services/api';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Load search pool on focus to optimize performance and reduce server load
  const loadSearchPool = async () => {
    try {
      const [studentsData, companiesData, interviewsData] = await Promise.all([
        studentService.getAllStudents().catch(() => []),
        companyService.getCompanies().catch(() => []),
        interviewService.getInterviews().catch(() => [])
      ]);
      setStudents(studentsData);
      setCompanies(companiesData);
      setInterviews(interviewsData);
    } catch (err) {
      console.error('Error loading global search pool', err);
    }
  };

  // Close search results overlay when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleFocus = () => {
    setIsOpen(true);
    if (students.length === 0 && companies.length === 0) {
      loadSearchPool();
    }
  };

  // Filter matches locally
  const queryStr = query.toLowerCase().trim();
  const matchedStudents = queryStr.length > 1 ? students.filter(s => 
    s.name.toLowerCase().includes(queryStr) || 
    s.regNo.toLowerCase().includes(queryStr) ||
    s.department.toLowerCase().includes(queryStr)
  ).slice(0, 4) : [];

  const matchedCompanies = queryStr.length > 1 ? companies.filter(c => 
    c.companyName.toLowerCase().includes(queryStr) || 
    c.eligibleDepartments.toLowerCase().includes(queryStr)
  ).slice(0, 4) : [];

  const matchedInterviews = queryStr.length > 1 ? interviews.filter(i => 
    i.companyName.toLowerCase().includes(queryStr) || 
    i.roundName.toLowerCase().includes(queryStr)
  ).slice(0, 4) : [];

  const hasResults = matchedStudents.length > 0 || matchedCompanies.length > 0 || matchedInterviews.length > 0;

  const handleSelectItem = (targetPath) => {
    setQuery('');
    setIsOpen(false);
    navigate(targetPath);
  };

  return (
    <div className="position-relative no-print" ref={searchRef} style={{ width: '280px' }}>
      <input
        type="text"
        className="form-control form-control-sm py-1.5 px-3 rounded-3"
        placeholder="🔍 Search portal..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        style={{ fontSize: '0.85rem' }}
      />

      {isOpen && query.length > 1 && (
        <div className="global-search-results animate-fade-in shadow-lg">
          {hasResults ? (
            <div>
              {/* Students Group */}
              {matchedStudents.length > 0 && (
                <div>
                  <div className="search-result-group-title">Students</div>
                  {matchedStudents.map(s => (
                    <div 
                      key={s.studentId} 
                      className="search-result-item cursor-pointer"
                      onClick={() => handleSelectItem('/admin/students')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="small fw-bold text-dark">{s.name}</div>
                      <div className="small text-muted" style={{ fontSize: '0.72rem' }}>Reg: {s.regNo} | {s.department}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Companies Group */}
              {matchedCompanies.length > 0 && (
                <div>
                  <div className="search-result-group-title">Drives & Recruiter</div>
                  {matchedCompanies.map(c => (
                    <div 
                      key={c.companyId} 
                      className="search-result-item cursor-pointer"
                      onClick={() => handleSelectItem('/admin/companies')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="small fw-bold text-dark">{c.companyName}</div>
                      <div className="small text-muted" style={{ fontSize: '0.72rem' }}>Package: {c.packageAmount} LPA | CGPA Cutoff: {c.eligibilityCgpa}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Interviews Group */}
              {matchedInterviews.length > 0 && (
                <div>
                  <div className="search-result-group-title">Interviews Rounds</div>
                  {matchedInterviews.map(i => (
                    <div 
                      key={i.interviewId} 
                      className="search-result-item cursor-pointer"
                      onClick={() => handleSelectItem('/admin/interviews')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="small fw-bold text-dark">{i.companyName} - {i.roundName}</div>
                      <div className="small text-muted" style={{ fontSize: '0.72rem' }}>Venue: {i.venue} | Date: {new Date(i.interviewDate).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 text-center text-muted small">No matches found for "{query}".</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
