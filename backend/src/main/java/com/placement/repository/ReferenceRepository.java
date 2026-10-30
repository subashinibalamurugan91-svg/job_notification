package com.placement.repository;

import com.placement.entity.Reference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReferenceRepository extends JpaRepository<Reference, Integer> {
    List<Reference> findByCompanyCompanyId(Integer companyId);
    List<Reference> findByCompanyIsNull();
    List<Reference> findByCategoryIgnoreCase(String category);
    List<Reference> findAllByOrderByUploadedAtDesc();
    List<Reference> findTop5ByOrderByUploadedAtDesc();

    @Query("SELECT COALESCE(SUM(r.downloadCount), 0) FROM Reference r")
    Long sumDownloadCount();

    @Query("SELECT r.category, COUNT(r) FROM Reference r GROUP BY r.category")
    List<Object[]> getCategoryCounts();
}
