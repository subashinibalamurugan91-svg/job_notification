package com.placement.repository;

import com.placement.entity.StatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StatusHistoryRepository extends JpaRepository<StatusHistory, Integer> {
    List<StatusHistory> findByApplicationApplicationIdOrderByUpdatedAtDesc(Integer applicationId);
}
