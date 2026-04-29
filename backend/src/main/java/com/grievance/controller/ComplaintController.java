package com.grievance.controller;

import com.grievance.entity.Complaint;
import com.grievance.entity.ComplaintHistory;
import com.grievance.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    // ---- CREATE ----

    /** POST /complaints  Body: { title, description, priority, category, userId, performedBy } */
    @PostMapping
    public ResponseEntity<Complaint> createComplaint(@RequestBody Map<String, Object> body) {
        Complaint c = new Complaint();
        c.setTitle((String) body.get("title"));
        c.setDescription((String) body.get("description"));
        c.setPriority((String) body.get("priority"));
        c.setCategory((String) body.get("category"));
        c.setUserId(body.get("userId") != null ? Long.parseLong(body.get("userId").toString()) : null);
        String performedBy = (String) body.getOrDefault("performedBy", "Citizen");
        return ResponseEntity.ok(complaintService.createComplaint(c, performedBy));
    }

    // ---- READ ----

    /** GET /complaints — all complaints (Admin) */
    @GetMapping
    public ResponseEntity<List<Complaint>> getAll() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    /** GET /complaints/user/{userId} — citizen's own complaints */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Complaint>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(complaintService.getComplaintsByUserId(userId));
    }

    /** GET /complaints/department/{dept} — officer sees their department complaints */
    @GetMapping("/department/{dept}")
    public ResponseEntity<List<Complaint>> getByDepartment(@PathVariable String dept) {
        return ResponseEntity.ok(complaintService.getComplaintsByDepartment(dept));
    }

    /** GET /complaints/search?keyword=&status=&dept= */
    @GetMapping("/search")
    public ResponseEntity<List<Complaint>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dept) {
        return ResponseEntity.ok(complaintService.searchComplaints(keyword, status, dept));
    }

    /** GET /complaints/stats — overall stats for Admin */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(complaintService.getStats());
    }

    /** GET /complaints/stats/department/{dept} — department stats for Officer */
    @GetMapping("/stats/department/{dept}")
    public ResponseEntity<Map<String, Long>> getStatsByDept(@PathVariable String dept) {
        return ResponseEntity.ok(complaintService.getStatsByDepartment(dept));
    }

    /** GET /complaints/{id}/history — activity log */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<ComplaintHistory>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.getHistory(id));
    }

    // ---- UPDATE ----

    /** PUT /complaints/{id}/status  Body: { status, performedBy } */
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, String> body) {

        String newStatus  = body.get("status");
        String performedBy = body.getOrDefault("performedBy", "Officer");
        Complaint updated = complaintService.updateStatus(id, newStatus, performedBy);

        Map<String, Object> res = new HashMap<>();
        if (updated != null) {
            res.put("message", "Status updated to " + newStatus);
            res.put("status",  updated.getStatus());
            return ResponseEntity.ok(res);
        }
        res.put("message", "Complaint not found: " + id);
        return ResponseEntity.status(404).body(res);
    }

    /** PUT /complaints/{id}  Body: { title, description, priority, performedBy } */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateComplaint(
            @PathVariable Long id, @RequestBody Map<String, String> body) {

        Complaint updated = complaintService.updateComplaint(
            id, body.get("title"), body.get("description"),
            body.get("priority"), body.getOrDefault("performedBy", "Officer"));

        Map<String, Object> res = new HashMap<>();
        if (updated != null) {
            res.put("message", "Updated successfully.");
            res.put("id", updated.getId());
            return ResponseEntity.ok(res);
        }
        res.put("message", "Complaint not found: " + id);
        return ResponseEntity.status(404).body(res);
    }

    /** PUT /complaints/{id}/assign  Body: { assignedTo, performedBy } */
    @PutMapping("/{id}/assign")
    public ResponseEntity<Map<String, Object>> assignComplaint(
            @PathVariable Long id, @RequestBody Map<String, String> body) {

        String officerName = body.get("assignedTo");
        String performedBy = body.getOrDefault("performedBy", "Officer");
        Complaint updated = complaintService.assignComplaint(id, officerName, performedBy);

        Map<String, Object> res = new HashMap<>();
        if (updated != null) {
            res.put("message", "Assigned to " + officerName);
            res.put("assignedTo", updated.getAssignedTo());
            return ResponseEntity.ok(res);
        }
        res.put("message", "Complaint not found: " + id);
        return ResponseEntity.status(404).body(res);
    }

    // ---- DELETE ----

    /** DELETE /complaints/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteComplaint(@PathVariable Long id) {
        Map<String, Object> res = new HashMap<>();
        if (complaintService.deleteComplaint(id)) {
            res.put("message", "Complaint #" + id + " deleted.");
            return ResponseEntity.ok(res);
        }
        res.put("message", "Complaint not found: " + id);
        return ResponseEntity.status(404).body(res);
    }
}
