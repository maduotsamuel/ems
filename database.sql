-- WorkforcePro Employee Management System Database
-- MySQL Database Schema

-- Create Database
CREATE DATABASE IF NOT EXISTS workforcepro;
USE workforcepro;

-- ============================================
-- 1. USERS TABLE (for authentication)
-- ============================================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('hr', 'director', 'employee') NOT NULL DEFAULT 'employee',
  employee_id VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- ============================================
-- 2. DEPARTMENTS TABLE
-- ============================================
CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  head_id VARCHAR(20),
  budget DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (head_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- ============================================
-- 3. EMPLOYEES TABLE
-- ============================================
CREATE TABLE employees (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  department_id INT,
  position VARCHAR(100) NOT NULL,
  status ENUM('Active', 'On Leave', 'Inactive', 'Terminated') DEFAULT 'Active',
  joined_date DATE NOT NULL,
  salary DECIMAL(10, 2),
  address TEXT,
  profile_picture LONGBLOB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  INDEX idx_department (department_id),
  INDEX idx_status (status),
  INDEX idx_email (email)
);

-- ============================================
-- 4. ATTENDANCE TABLE
-- ============================================
CREATE TABLE attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(20) NOT NULL,
  attendance_date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status ENUM('Present', 'Late', 'Absent', 'On Leave') DEFAULT 'Absent',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (employee_id, attendance_date),
  INDEX idx_date (attendance_date),
  INDEX idx_status (status)
);

-- ============================================
-- 5. LEAVE_TYPES TABLE
-- ============================================
CREATE TABLE leave_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type_name VARCHAR(50) NOT NULL UNIQUE,
  days_per_year INT DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. LEAVES TABLE
-- ============================================
CREATE TABLE leaves (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(20) NOT NULL,
  leave_type_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending',
  approved_by INT,
  approved_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_employee (employee_id),
  INDEX idx_status (status),
  INDEX idx_date (start_date, end_date)
);

-- ============================================
-- 7. PERFORMANCE_REVIEWS TABLE
-- ============================================
CREATE TABLE performance_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(20) NOT NULL,
  reviewed_by INT NOT NULL,
  rating DECIMAL(3, 1) CHECK (rating >= 1 AND rating <= 5),
  goal_achievement INT CHECK (goal_achievement >= 0 AND goal_achievement <= 100),
  notes TEXT,
  review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_employee (employee_id),
  INDEX idx_rating (rating)
);

-- ============================================
-- 8. PAYROLL_RUNS TABLE
-- ============================================
CREATE TABLE payroll_runs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  month DATE NOT NULL UNIQUE,
  status ENUM('Draft', 'Processed', 'Paid', 'Cancelled') DEFAULT 'Draft',
  total_amount DECIMAL(12, 2),
  processed_by INT,
  processed_date TIMESTAMP NULL,
  paid_date TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_month (month),
  INDEX idx_status (status)
);

-- ============================================
-- 9. PAYROLL_DETAILS TABLE
-- ============================================
CREATE TABLE payroll_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_run_id INT NOT NULL,
  employee_id VARCHAR(20) NOT NULL,
  base_salary DECIMAL(10, 2),
  bonuses DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  net_salary DECIMAL(10, 2),
  working_days INT,
  days_present INT,
  days_absent INT,
  days_on_leave INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  UNIQUE KEY unique_payroll_employee (payroll_run_id, employee_id),
  INDEX idx_employee (employee_id)
);

-- ============================================
-- 10. AUDIT_LOG TABLE (optional for tracking changes)
-- ============================================
CREATE TABLE audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50),
  record_id VARCHAR(50),
  old_values JSON,
  new_values JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_timestamp (timestamp),
  INDEX idx_action (action)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_employee_department ON employees(department_id);
CREATE INDEX idx_employee_status ON employees(status);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, attendance_date);
CREATE INDEX idx_leave_employee_status ON leaves(employee_id, status);
CREATE INDEX idx_payroll_run_month ON payroll_runs(month);
CREATE INDEX idx_payroll_employee ON payroll_details(employee_id);

-- ============================================
-- INITIAL DATA SETUP
-- ============================================

-- Insert Leave Types
INSERT INTO leave_types (type_name, days_per_year, description) VALUES
('Annual Leave', 21, 'Paid vacation days'),
('Sick Leave', 10, 'Paid sick days'),
('Study Leave', 5, 'Educational leave'),
('Maternity Leave', 60, 'Pregnancy and maternity leave'),
('Paternity Leave', 10, 'Paternity leave'),
('Unpaid Leave', 0, 'Leave without pay');

-- Insert Departments (before employees since they reference departments)
INSERT INTO departments (name, budget) VALUES
('Information Technology', 45000),
('Human Resources', 28000),
('Finance', 32000),
('Operations', 52000),
('Marketing', 24000);

-- Insert Employees
INSERT INTO employees (id, name, email, phone, department_id, position, status, joined_date, salary, address) VALUES
('EMP-001', 'Samuel Maduot', 'employee@workforcepro.com', '+211 920 000 000', 1, 'IT Support Officer', 'Active', '2024-01-10', 1450, 'Juba, South Sudan'),
('EMP-002', 'Grace Ajak', 'grace@workforcepro.com', '+211 921 110 002', 2, 'HR Officer', 'Active', '2024-03-18', 1600, 'Juba, South Sudan'),
('EMP-003', 'Peter Deng', 'peter@workforcepro.com', '+211 922 220 003', 3, 'Accountant', 'Active', '2023-11-05', 1750, 'Juba, South Sudan'),
('EMP-004', 'Mary Nyandeng', 'mary@workforcepro.com', '+211 923 330 004', 4, 'Operations Coordinator', 'On Leave', '2024-05-22', 1500, 'Juba, South Sudan'),
('EMP-005', 'John Lual', 'john@workforcepro.com', '+211 924 440 005', 5, 'Communications Officer', 'Active', '2025-01-07', 1380, 'Juba, South Sudan'),
('EMP-006', 'Rebecca Akon', 'rebecca@workforcepro.com', '+211 925 550 006', 1, 'Systems Administrator', 'Active', '2025-03-12', 1900, 'Juba, South Sudan');

-- Update department heads
UPDATE departments SET head_id = 'EMP-006' WHERE name = 'Information Technology';
UPDATE departments SET head_id = 'EMP-002' WHERE name = 'Human Resources';
UPDATE departments SET head_id = 'EMP-003' WHERE name = 'Finance';
UPDATE departments SET head_id = 'EMP-004' WHERE name = 'Operations';
UPDATE departments SET head_id = 'EMP-005' WHERE name = 'Marketing';

-- Insert Users (with hashed passwords)
-- Default password for all users: Welcome@123
-- Password hash generated with bcrypt (cost 12)
INSERT INTO users (email, password, role, employee_id) VALUES
('hr@workforcepro.com', '$2y$12$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ee89oCQtMsDfJMFy', 'hr', 'EMP-002'),
('director@workforcepro.com', '$2y$12$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ee89oCQtMsDfJMFy', 'director', 'EMP-006'),
('employee@workforcepro.com', '$2y$12$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ee89oCQtMsDfJMFy', 'employee', 'EMP-001');

-- ============================================
-- ADMIN ACCOUNT RECOVERY (SAFE TO RE-RUN)
-- Use this block if HR/Director users were deleted.
-- ============================================

-- Ensure required employees exist.
INSERT INTO employees (id, name, email, phone, department_id, position, status, joined_date, salary, address)
VALUES
('EMP-002', 'Grace Ajak', 'grace@workforcepro.com', '+211 921 110 002', 2, 'HR Officer', 'Active', '2024-03-18', 1600, 'Juba, South Sudan'),
('EMP-006', 'Rebecca Akon', 'rebecca@workforcepro.com', '+211 925 550 006', 1, 'Systems Administrator', 'Active', '2025-03-12', 1900, 'Juba, South Sudan')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  phone = VALUES(phone),
  department_id = VALUES(department_id),
  position = VALUES(position),
  status = VALUES(status),
  joined_date = VALUES(joined_date),
  salary = VALUES(salary),
  address = VALUES(address),
  updated_at = CURRENT_TIMESTAMP;

-- Recreate/repair HR and Director login credentials.
-- Default password: Welcome@123
INSERT INTO users (email, password, role, employee_id)
VALUES
('hr@workforcepro.com', '$2y$12$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ee89oCQtMsDfJMFy', 'hr', 'EMP-002'),
('director@workforcepro.com', '$2y$12$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ee89oCQtMsDfJMFy', 'director', 'EMP-006')
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  role = VALUES(role),
  employee_id = VALUES(employee_id),
  updated_at = CURRENT_TIMESTAMP;

-- Insert sample attendance records (today's data)
INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, status) VALUES
('EMP-001', CURDATE(), '08:03', NULL, 'Present'),
('EMP-002', CURDATE(), '07:55', '16:02', 'Present'),
('EMP-003', CURDATE(), '08:22', NULL, 'Late'),
('EMP-004', CURDATE(), NULL, NULL, 'On Leave'),
('EMP-005', CURDATE(), '08:01', NULL, 'Present'),
('EMP-006', CURDATE(), '07:48', NULL, 'Present');

-- Insert sample leave requests
INSERT INTO leaves (employee_id, leave_type_id, start_date, end_date, reason, status, approved_by) VALUES
(1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Family commitment', 'Approved', 1),
(2, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Medical appointment', 'Pending', NULL),
(3, 3, DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 9 DAY), 'University examinations', 'Pending', NULL);

-- Insert sample performance reviews
INSERT INTO performance_reviews (employee_id, reviewed_by, rating, goal_achievement, notes) VALUES
('EMP-001', 1, 4.5, 82, 'Strong technical support and quick response time.'),
('EMP-002', 1, 4.2, 76, 'Good employee engagement and record management.'),
('EMP-003', 1, 4.6, 88, 'Accurate reporting and improved monthly close process.'),
('EMP-004', 1, 4.0, 71, 'Reliable operations coordination.'),
('EMP-005', 1, 3.9, 69, 'Good campaign delivery with room for stronger reporting.'),
('EMP-006', 1, 4.8, 93, 'Excellent system uptime and preventive maintenance.');

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Employee Summary View
CREATE VIEW employee_summary AS
SELECT 
  e.id,
  e.name,
  e.email,
  e.position,
  d.name as department,
  e.status,
  e.salary,
  u.role,
  COUNT(DISTINCT a.id) as total_working_days,
  SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as days_present
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN users u ON e.id = u.employee_id
LEFT JOIN attendance a ON e.id = a.employee_id
GROUP BY e.id;

-- Payroll Summary View
CREATE VIEW payroll_summary AS
SELECT 
  pr.month,
  COUNT(pd.id) as employees_processed,
  SUM(pd.base_salary) as total_base_salary,
  SUM(pd.bonuses) as total_bonuses,
  SUM(pd.deductions) as total_deductions,
  SUM(pd.tax) as total_tax,
  SUM(pd.net_salary) as total_net_salary,
  pr.status
FROM payroll_runs pr
LEFT JOIN payroll_details pd ON pr.id = pd.payroll_run_id
GROUP BY pr.id;

-- Active Leaves View
CREATE VIEW active_leaves AS
SELECT 
  l.id,
  e.id as employee_id,
  e.name as employee_name,
  lt.type_name as leave_type,
  l.start_date,
  l.end_date,
  DATEDIFF(l.end_date, l.start_date) + 1 as total_days,
  l.reason,
  l.status
FROM leaves l
JOIN employees e ON l.employee_id = e.id
JOIN leave_types lt ON l.leave_type_id = lt.id
WHERE l.start_date <= CURDATE() AND l.end_date >= CURDATE();
