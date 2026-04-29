package com.grievance.service;

import com.grievance.entity.Complaint;
import com.grievance.entity.ComplaintHistory;
import com.grievance.repository.ComplaintHistoryRepository;
import com.grievance.repository.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ComplaintService {

    @Autowired private ComplaintRepository complaintRepository;
    @Autowired private ComplaintHistoryRepository historyRepository;

    // ----------------------------------------------------------------
    // CREATE
    // ----------------------------------------------------------------

    /**
     * Creates a complaint with auto-routing:
     * - Status always starts as PENDING
     * - Department is auto-set from category
     * - Due date is auto-set from priority (7/14/30 days)
     */
    public Complaint createComplaint(Complaint complaint, String performedBy) {
        complaint.setStatus("PENDING");
        complaint.setCreatedAt(LocalDateTime.now());

        if (complaint.getPriority() == null || complaint.getPriority().isBlank())
            complaint.setPriority("MEDIUM");
        if (complaint.getCategory() == null || complaint.getCategory().isBlank())
            complaint.setCategory("GENERAL");

        // Auto-route: department = category
        complaint.setDepartment(complaint.getCategory());

        // Auto due date based on priority
        int days = "HIGH".equals(complaint.getPriority()) ? 7
                 : "LOW".equals(complaint.getPriority())  ? 30 : 14;
        complaint.setDueDate(LocalDate.now().plusDays(days));

        Complaint saved = complaintRepository.save(complaint);
        logHistory(saved.getId(), "Complaint created with priority " + saved.getPriority(), performedBy);
        return saved;
    }

    // ----------------------------------------------------------------
    // READ
    // ----------------------------------------------------------------

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    public List<Complaint> getComplaintsByUserId(Long userId) {
        return complaintRepository.findByUserId(userId);
    }

    /** Officer: get all complaints for their department */
    public List<Complaint> getComplaintsByDepartment(String department) {
        return complaintRepository.findByDepartmentOrCategory(department);
    }

    /** Search with optional keyword, status, and department filters */
    public List<Complaint> searchComplaints(String keyword, String status, String dept) {
        String kw = (keyword != null && !keyword.isBlank()) ? keyword : null;
        String st = (status  != null && !status.isBlank())  ? status  : null;
        String dp = (dept    != null && !dept.isBlank())    ? dept    : null;
        return complaintRepository.searchComplaints(kw, st, dp);
    }

    /** History for a single complaint */
    public List<ComplaintHistory> getHistory(Long complaintId) {
        return historyRepository.findByComplaintIdOrderByTimestampDesc(complaintId);
    }

    // ----------------------------------------------------------------
    // STATS
    // ----------------------------------------------------------------

    /** Overall stats — for Admin */
    public Map<String, Long> getStats() {
        long total    = complaintRepository.count();
        long pending  = complaintRepository.countByStatus("PENDING");
        long progress = complaintRepository.countByStatus("IN_PROGRESS");
        long resolved = complaintRepository.countByStatus("RESOLVED");
        Map<String, Long> stats = new HashMap<>();
        stats.put("total",      total);
        stats.put("pending",    pending);
        stats.put("inProgress", progress);
        stats.put("resolved",   resolved);
        return stats;
    }

    /** Department stats — for Officer */
    public Map<String, Long> getStatsByDepartment(String dept) {
        long total    = complaintRepository.countByDepartment(dept);
        long pending  = complaintRepository.countByStatusAndDepartment("PENDING", dept);
        long progress = complaintRepository.countByStatusAndDepartment("IN_PROGRESS", dept);
        long resolved = complaintRepository.countByStatusAndDepartment("RESOLVED", dept);
        Map<String, Long> stats = new HashMap<>();
        stats.put("total",      total);
        stats.put("pending",    pending);
        stats.put("inProgress", progress);
        stats.put("resolved",   resolved);
        return stats;
    }

    // ----------------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------------

    /** Update status and log history */
    public Complaint updateStatus(Long id, String newStatus, String performedBy) {
        Optional<Complaint> opt = complaintRepository.findById(id);
        if (opt.isPresent()) {
            Complaint c = opt.get();
            c.setStatus(newStatus);
            Complaint saved = complaintRepository.save(c);
            logHistory(id, "Status changed to " + newStatus, performedBy);
            return saved;
        }
        return null;
    }

    /** Edit title, description, priority and log history */
    public Complaint updateComplaint(Long id, String title, String description, String priority, String performedBy) {
        Optional<Complaint> opt = complaintRepository.findById(id);
        if (opt.isPresent()) {
            Complaint c = opt.get();
            if (title != null && !title.isBlank())             c.setTitle(title);
            if (description != null && !description.isBlank()) c.setDescription(description);
            if (priority != null && !priority.isBlank())       c.setPriority(priority);
            Complaint saved = complaintRepository.save(c);
            logHistory(id, "Complaint details edited", performedBy);
            return saved;
        }
        return null;
    }

    /** Assign complaint to an officer and log history */
    public Complaint assignComplaint(Long id, String officerName, String performedBy) {
        Optional<Complaint> opt = complaintRepository.findById(id);
        if (opt.isPresent()) {
            Complaint c = opt.get();
            c.setAssignedTo(officerName);
            Complaint saved = complaintRepository.save(c);
            logHistory(id, "Assigned to " + officerName, performedBy);
            return saved;
        }
        return null;
    }

    // ----------------------------------------------------------------
    // DELETE
    // ----------------------------------------------------------------

    public boolean deleteComplaint(Long id) {
        if (complaintRepository.existsById(id)) {
            complaintRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // ----------------------------------------------------------------
    // PRIVATE HELPERS
    // ----------------------------------------------------------------

    private void logHistory(Long complaintId, String action, String performedBy) {
        ComplaintHistory h = new ComplaintHistory();
        h.setComplaintId(complaintId);
        h.setAction(action);
        h.setPerformedBy(performedBy != null ? performedBy : "System");
        h.setTimestamp(LocalDateTime.now());
        historyRepository.save(h);
    }
}
