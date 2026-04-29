package com.grievance.service;

import com.grievance.entity.User;
import com.grievance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    /** Register a new user (citizen, officer, or admin) */
    public User register(User user) {
        return userRepository.save(user);
    }

    /** Login: check email + password match */
    public User login(String email, String password) {
        Optional<User> optional = userRepository.findByEmail(email);
        if (optional.isPresent() && optional.get().getPassword().equals(password)) {
            return optional.get();
        }
        return null;
    }

    /** Get user by ID (for profile page) */
    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    /** Get all officers in a specific department (for assign dropdown) */
    public List<User> findOfficersByDepartment(String department) {
        return userRepository.findByRoleAndDepartment("OFFICER", department);
    }
}
