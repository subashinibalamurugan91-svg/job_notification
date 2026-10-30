package com.placement.security;

import com.placement.entity.Admin;
import com.placement.entity.Student;
import com.placement.repository.AdminRepository;
import com.placement.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String cleanEmail = email != null ? email.trim() : "";
        // Try admin first
        Admin admin = adminRepository.findByEmail(cleanEmail).orElse(null);
        if (admin != null) {
            return new UserPrincipal(admin.getAdminId(), admin.getEmail(), admin.getPasswordHash(), "ADMIN", admin.getName());
        }

        // Try student next
        Student student = studentRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + cleanEmail));
        
        return new UserPrincipal(student.getStudentId(), student.getEmail(), student.getPasswordHash(), "STUDENT", student.getName());
    }
}
