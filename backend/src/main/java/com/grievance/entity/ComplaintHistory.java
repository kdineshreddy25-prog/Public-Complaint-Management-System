package com.grievance.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Stores an audit trail of all actions taken on a complaint.
 * Officers can view this timeline to see what happened.
 */
@Entity
@Table(name = "complaint_history")
public class ComplaintHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long complaintId;

    // Human-readable action description, e.g. "Status changed to RESOLVED"
    private String action;

    // Name of the person who performed the action
    private String performedBy;

    private LocalDateTime timestamp;

    public ComplaintHistory() {}

    public Long getId()               { return id; }
    public void setId(Long id)        { this.id = id; }

    public Long getComplaintId()              { return complaintId; }
    public void setComplaintId(Long cid)      { this.complaintId = cid; }

    public String getAction()               { return action; }
    public void setAction(String action)    { this.action = action; }

    public String getPerformedBy()                  { return performedBy; }
    public void setPerformedBy(String performedBy)  { this.performedBy = performedBy; }

    public LocalDateTime getTimestamp()                 { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp)   { this.timestamp = timestamp; }
}
