package com.placement.service;

import com.placement.entity.Student;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    public Student getStudentById(Integer id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
    }

    public Student updateStudentProfile(Integer id, Student updatedDetails) {
        Student student = getStudentById(id);
        student.setName(updatedDetails.getName());
        student.setPhone(updatedDetails.getPhone());
        student.setDepartment(updatedDetails.getDepartment());
        student.setCgpa(updatedDetails.getCgpa());
        if (updatedDetails.getSkills() != null) {
            student.setSkills(new java.util.ArrayList<>(updatedDetails.getSkills()));
        }
        return studentRepository.save(student);
    }

    public Student updateStudentSkills(Integer id, List<String> skills) {
        Student student = getStudentById(id);
        student.setSkills(skills != null ? new java.util.ArrayList<>(skills) : new java.util.ArrayList<>());
        return studentRepository.save(student);
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student updateStudentResume(Integer id, String resumeUrl, String resumeFileName) {
        Student student = getStudentById(id);
        student.setResumeUrl(resumeUrl);
        student.setResumeFileName(resumeFileName);
        student.setResumeUploadedAt(java.time.LocalDateTime.now());
        return studentRepository.save(student);
    }

    public Student deleteStudentResume(Integer id) {
        Student student = getStudentById(id);
        student.setResumeUrl(null);
        student.setResumeFileName(null);
        student.setResumeUploadedAt(null);
        return studentRepository.save(student);
    }
}
