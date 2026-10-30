package com.placement.repository;

import com.placement.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Integer> {
    List<Interview> findByCompanyCompanyId(Integer companyId);

    @Query("SELECT i FROM Interview i JOIN i.students s WHERE s.studentId = :studentId")
    List<Interview> findInterviewsForStudent(@Param("studentId") Integer studentId);

    long countByInterviewDateAfter(java.time.LocalDateTime date);

    List<Interview> findAllByInterviewDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
}
