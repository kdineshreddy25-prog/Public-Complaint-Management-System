package com.grievance.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Status: PENDING, IN_PROGRESS, RESOLVED
    private String status;

    // Priority: HIGH, MEDIUM, LOW
    private String priority;

    // Category selected by citizen: WATER, ELECTRICITY, ROADS, SANITATION, GENERAL
    private String category;

    // Department auto-set from category for officer routing
    private String department;

    // Officer name assigned to handle this complaint
    private String assignedTo;

    // Deadline for resolution (auto-set based on priority)
    private LocalDate dueDate;

    private LocalDateTime createdAt;

    // Foreign key — the citizen's user id
    private Long userId;

    public Complaint() {}

    public Long getId()               { return id; }
    public void setId(Long id)        { this.id = id; }

    public String getTitle()              { return title; }
    public void setTitle(String title)    { this.title = title; }

    public String getDescription()                  { return description; }
    public void setDescription(String description)  { this.description = description; }

    public String getStatus()               { return status; }
    public void setStatus(String status)    { this.status = status; }

    public String getPriority()                 { return priority; }
    public void setPriority(String priority)    { this.priority = priority; }

    public String getCategory()                 { return category; }
    public void setCategory(String category)    { this.category = category; }

    public String getDepartment()               { return department; }
    public void setDepartment(String dept)      { this.department = dept; }

    public String getAssignedTo()               { return assignedTo; }
    public void setAssignedTo(String assignedTo){ this.assignedTo = assignedTo; }

    public LocalDate getDueDate()               { return dueDate; }
    public void setDueDate(LocalDate dueDate)   { this.dueDate = dueDate; }

    public LocalDateTime getCreatedAt()                   { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt)     { this.createdAt = createdAt; }

    public Long getUserId()               { return userId; }
    public void setUserId(Long userId)    { this.userId = userId; }
}
