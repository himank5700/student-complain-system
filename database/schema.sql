-- ==========================================================
-- Student Complaint Management System - Database Schema
-- Database: student_complaint_system
-- MySQL Server 8.0+
-- ==========================================================

-- 1. Create the Database if it does not already exist
CREATE DATABASE IF NOT EXISTS student_complaint_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE student_complaint_system;

-- 2. Drop existing tables in reverse order of foreign key dependencies
DROP TABLE IF EXISTS complaint_logs;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS users;

-- ==========================================================
-- Table 1: users
-- Stores both students and college administrators
-- ==========================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  department VARCHAR(100) DEFAULT 'Computer Science',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_email (email),
  INDEX idx_user_role (role)
) ENGINE=InnoDB;

-- ==========================================================
-- Table 2: complaints
-- Stores all student complaints with category, status, and details
-- ==========================================================
CREATE TABLE complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id VARCHAR(30) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  category ENUM(
    'Hostel',
    'Library',
    'Wi-Fi and Internet',
    'Classroom',
    'Laboratory',
    'Transport',
    'Canteen',
    'Other'
  ) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status ENUM(
    'Submitted',
    'Under Review',
    'In Progress',
    'Resolved',
    'Rejected'
  ) NOT NULL DEFAULT 'Submitted',
  assigned_department VARCHAR(100) NOT NULL DEFAULT 'Administration',
  admin_comments TEXT DEFAULT NULL,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_complaint_id (complaint_id),
  INDEX idx_complaint_student (student_id),
  INDEX idx_complaint_status (status),
  INDEX idx_complaint_category (category)
) ENGINE=InnoDB;

-- ==========================================================
-- Table 3: complaint_logs
-- Audit trail tracking status updates, comments, and admin actions
-- ==========================================================
CREATE TABLE complaint_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id VARCHAR(30) NOT NULL,
  changed_by_user_id INT NOT NULL,
  previous_status VARCHAR(50) DEFAULT NULL,
  new_status VARCHAR(50) NOT NULL,
  comment TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_log_complaint_id (complaint_id)
) ENGINE=InnoDB;

-- ==========================================================
-- Sample Data Insertion
-- Passwords:
-- Admin:   Admin@123   -> $2a$10$WEiGVAqzi3Il1sy.OONsTOjoYZH74/XxjjzA68KpoR7NtZRqJZeP2
-- Student: Student@123 -> $2a$10$dGI7it.ds7zKnm5PwbAUuedPF9r5RsLMPdANgS.Yeb7w7eh4cydCW
-- ==========================================================

INSERT INTO users (id, name, email, password_hash, role, department) VALUES
(1, 'System Administrator', 'admin@college.edu', '$2a$10$WEiGVAqzi3Il1sy.OONsTOjoYZH74/XxjjzA68KpoR7NtZRqJZeP2', 'admin', 'Administration'),
(2, 'Rahul Sharma', 'student@college.edu', '$2a$10$dGI7it.ds7zKnm5PwbAUuedPF9r5RsLMPdANgS.Yeb7w7eh4cydCW', 'student', 'Computer Science & Engineering'),
(3, 'Priya Patel', 'priya@college.edu', '$2a$10$dGI7it.ds7zKnm5PwbAUuedPF9r5RsLMPdANgS.Yeb7w7eh4cydCW', 'student', 'Electronics & Communication');

INSERT INTO complaints (id, complaint_id, student_id, category, title, description, status, assigned_department, admin_comments, resolved_at, created_at) VALUES
(
  1,
  'CMP-1001',
  2,
  'Hostel',
  'Solar water heater not working in Block B',
  'The solar water heater on the 3rd floor of Boys Hostel Block B has not been functional for 3 days. Students have to manage with cold water in winter.',
  'In Progress',
  'Hostel Maintenance',
  'Plumbing technician dispatched. Parts ordered.',
  NULL,
  DATE_SUB(NOW(), INTERVAL 4 DAY)
),
(
  2,
  'CMP-1002',
  2,
  'Wi-Fi and Internet',
  'Wi-Fi repeatedly disconnecting in CSE Lab 3',
  'During afternoon lab sessions, the access point in CSE Lab 3 drops connections for all 30 students intermittently every 10 minutes.',
  'Resolved',
  'IT Infrastructure',
  'Replaced faulty router and upgraded firmware. Network verified stable.',
  DATE_SUB(NOW(), INTERVAL 1 DAY),
  DATE_SUB(NOW(), INTERVAL 5 DAY)
),
(
  3,
  'CMP-1003',
  3,
  'Library',
  'Central AC cooling insufficient in 2nd Floor Reading Hall',
  'The second-floor reading hall gets excessively hot and humid during afternoon study hours, making it hard to concentrate.',
  'Submitted',
  'Estate & Maintenance',
  NULL,
  NULL,
  DATE_SUB(NOW(), INTERVAL 1 DAY)
),
(
  4,
  'CMP-1004',
  2,
  'Classroom',
  'Ceiling projector flickering in Room 304',
  'The HDMI input cable and display bulb in Room 304 keep flickering during lectures, cutting off presentations frequently.',
  'Under Review',
  'Audio-Visual Support',
  'Inspected by AV team, replacement cable scheduled for Friday.',
  NULL,
  DATE_SUB(NOW(), INTERVAL 2 DAY)
);

INSERT INTO complaint_logs (complaint_id, changed_by_user_id, previous_status, new_status, comment) VALUES
('CMP-1001', 1, 'Submitted', 'Under Review', 'Assigned to hostel warden and maintenance team.'),
('CMP-1001', 1, 'Under Review', 'In Progress', 'Plumbing technician dispatched. Parts ordered.'),
('CMP-1002', 1, 'Submitted', 'In Progress', 'IT team investigating access point logs.'),
('CMP-1002', 1, 'In Progress', 'Resolved', 'Replaced faulty router and upgraded firmware. Network verified stable.'),
('CMP-1004', 1, 'Submitted', 'Under Review', 'Inspected by AV team, replacement cable scheduled for Friday.');
