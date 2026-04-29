package com.grievance.repository;

import com.grievance.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    /** Citizen: see only their own complaints */
    List<Complaint> findByUserId(Long userId);

    /**
     * Officer: complaints for their department.
     * Also matches old records where department is null but category matches —
     * this handles complaints filed before the department column was added.
     */
    @Query("SELECT c FROM Complaint c WHERE c.department = :dept " +
           "OR (c.department IS NULL AND c.category = :dept)")
    List<Complaint> findByDepartmentOrCategory(@Param("dept") String dept);

    /** Admin/Officer search: filter by keyword and/or status */
    @Query("SELECT c FROM Complaint c WHERE " +
           "(:keyword IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:status  IS NULL OR c.status = :status) AND " +
           "(:dept    IS NULL OR c.department = :dept OR (c.department IS NULL AND c.category = :dept))")
    List<Complaint> searchComplaints(
        @Param("keyword") String keyword,
        @Param("status")  String status,
        @Param("dept")    String dept
    );

    // ---- Stats counts ----
    long countByStatus(String status);
    
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.department = :dept OR (c.department IS NULL AND c.category = :dept)")
    long countByDepartment(@Param("dept") String dept);
    
    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = :status AND (c.department = :dept OR (c.department IS NULL AND c.category = :dept))")
    long countByStatusAndDepartment(@Param("status") String status, @Param("dept") String dept);
}
