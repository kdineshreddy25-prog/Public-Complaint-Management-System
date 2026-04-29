package com.grievance.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;

    // Role: CITIZEN, OFFICER, ADMIN
    private String role;

    // Department for OFFICER: WATER, ELECTRICITY, ROADS, SANITATION, GENERAL
    // null for CITIZEN and ADMIN
    private String department;

    public User() {}

    public Long getId()                 { return id; }
    public void setId(Long id)          { this.id = id; }

    public String getName()             { return name; }
    public void setName(String name)    { this.name = name; }

    public String getEmail()            { return email; }
    public void setEmail(String email)  { this.email = email; }

    public String getPassword()                 { return password; }
    public void setPassword(String password)    { this.password = password; }

    public String getRole()             { return role; }
    public void setRole(String role)    { this.role = role; }

    public String getDepartment()               { return department; }
    public void setDepartment(String department){ this.department = department; }
}
