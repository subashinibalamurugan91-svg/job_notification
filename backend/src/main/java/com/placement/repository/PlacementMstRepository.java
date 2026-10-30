package com.placement.repository;

import com.placement.entity.PlacementMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlacementMstRepository extends JpaRepository<PlacementMst, Integer> {

    List<PlacementMst> findAllByOrderByOfferDateDesc();

    Optional<PlacementMst> findByStudentStudentIdAndCompanyCompanyId(Integer studentId, Integer companyId);

    List<PlacementMst> findByStudentStudentId(Integer studentId);

    List<PlacementMst> findByCompanyCompanyId(Integer companyId);

    List<PlacementMst> findByDepartmentIgnoreCase(String department);

    @Query("SELECT DISTINCT p.academicYear FROM PlacementMst p WHERE p.academicYear IS NOT NULL ORDER BY p.academicYear DESC")
    List<String> findDistinctAcademicYears();

    @Query("SELECT p.department, COUNT(p) FROM PlacementMst p GROUP BY p.department")
    List<Object[]> getDepartmentWisePlacementCounts();

    @Query("SELECT p.company.companyName, COUNT(p), AVG(p.packageAmount), MAX(p.packageAmount) FROM PlacementMst p GROUP BY p.company.companyName ORDER BY COUNT(p) DESC")
    List<Object[]> getCompanyWisePlacementCounts();

    @Query("SELECT MAX(p.packageAmount) FROM PlacementMst p")
    Double findHighestPackage();

    @Query("SELECT AVG(p.packageAmount) FROM PlacementMst p")
    Double findAveragePackage();

    @Query("SELECT COUNT(DISTINCT p.company.companyId) FROM PlacementMst p")
    Long countDistinctRecruitingCompanies();
}
