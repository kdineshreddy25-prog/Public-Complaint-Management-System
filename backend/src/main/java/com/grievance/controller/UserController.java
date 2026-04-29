package com.grievance.controller;

import com.grievance.entity.User;
import com.grievance.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * POST /register
     * Body: { name, email, password, role, department }
     * department is required only for OFFICER role.
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody User user) {
        User saved = userService.register(user);
        Map<String, Object> res = new HashMap<>();
        res.put("message",    "User registered successfully!");
        res.put("userId",     saved.getId());
        res.put("name",       saved.getName());
        res.put("role",       saved.getRole());
        res.put("department", saved.getDepartment());
        return ResponseEntity.ok(res);
    }

    /**
     * POST /login
     * Body: { email, password }
     * Returns: userId, name, role, department
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> creds) {
        User user = userService.login(creds.get("email"), creds.get("password"));
        Map<String, Object> res = new HashMap<>();
        if (user != null) {
            res.put("message",    "Login successful!");
            res.put("userId",     user.getId());
            res.put("name",       user.getName());
            res.put("role",       user.getRole());
            res.put("department", user.getDepartment());
            return ResponseEntity.ok(res);
        }
        res.put("message", "Invalid email or password.");
        return ResponseEntity.status(401).body(res);
    }

    /**
     * GET /users/{id} — profile (password excluded)
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable Long id) {
        User user = userService.findById(id);
        Map<String, Object> res = new HashMap<>();
        if (user != null) {
            res.put("id",         user.getId());
            res.put("name",       user.getName());
            res.put("email",      user.getEmail());
            res.put("role",       user.getRole());
            res.put("department", user.getDepartment());
            return ResponseEntity.ok(res);
        }
        res.put("message", "User not found: " + id);
        return ResponseEntity.status(404).body(res);
    }

    /**
     * GET /users/officers/{department}
     * Returns list of officers in a department for assign dropdown.
     */
    @GetMapping("/users/officers/{department}")
    public ResponseEntity<List<Map<String, Object>>> getOfficersByDept(@PathVariable String department) {
        List<User> officers = userService.findOfficersByDepartment(department);
        List<Map<String, Object>> result = officers.stream().map(o -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id",   o.getId());
            m.put("name", o.getName());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
