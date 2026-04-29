package com.grievance.repository;

import com.grievance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    /** Get all officers in a specific department (for assign dropdown) */
    List<User> findByRoleAndDepartment(String role, String department);
}
