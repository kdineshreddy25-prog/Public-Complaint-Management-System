package com.grievance.repository;

import com.grievance.entity.ComplaintHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ComplaintHistoryRepository extends JpaRepository<ComplaintHistory, Long> {
    // Returns history in reverse chronological order (newest first)
    List<ComplaintHistory> findByComplaintIdOrderByTimestampDesc(Long complaintId);
}
