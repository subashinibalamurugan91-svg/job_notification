package com.placement.repository;

import com.placement.entity.Application;
import com.placement.entity.ApplicationStatus;
import com.placement.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Integer> {
    List<Application> findByStudentStudentId(Integer studentId);
    Optional<Application> findByStudentStudentIdAndCompanyCompanyId(Integer studentId, Integer companyId);
    boolean existsByStudentStudentIdAndCompanyCompanyId(Integer studentId, Integer companyId);
    long countByStatus(ApplicationStatus status);
    List<Application> findByCompanyCompanyId(Integer companyId);

    @Query("SELECT COUNT(DISTINCT a.student.studentId) FROM Application a WHERE a.status = 'SELECTED'")
    long countDistinctSelectedStudents();

    @Query("SELECT a.company.companyName, COUNT(a), SUM(CASE WHEN a.status = 'SELECTED' THEN 1 ELSE 0 END) " +
           "FROM Application a GROUP BY a.company.companyName")
    List<Object[]> getCompanyWiseStats();

    @Query("SELECT a.student.department, COUNT(a), SUM(CASE WHEN a.status = 'SELECTED' THEN 1 ELSE 0 END) " +
           "FROM Application a GROUP BY a.student.department")
    List<Object[]> getDepartmentWiseStats();
}
