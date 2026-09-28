-- ==============================================================================
-- CMMS / EAM SYSTEM: FACTORY MACHINE & PREVENTIVE MAINTENANCE DATABASE SCHEMA
-- Target Database Engine: MySQL 8.0+ / MariaDB 10.5+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `factory_cmms_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `factory_cmms_db`;

-- ------------------------------------------------------------------------------
-- 1. TABLE: users (ระบบผู้ใช้งานและการแยกสิทธิ์ RBAC)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `maintenance_spare_parts`;
DROP TABLE IF EXISTS `pm_checklist_items`;
DROP TABLE IF EXISTS `maintenance_logs`;
DROP TABLE IF EXISTS `pm_schedules`;
DROP TABLE IF EXISTS `machines`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL COMMENT 'Unique user identifier (UUID or USR-xxx)',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT 'ชื่อผู้ใช้สำหรับ Login',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'รหัสผ่านที่เข้ารหัสด้วย bcrypt / argon2',
  `full_name` VARCHAR(120) NOT NULL COMMENT 'ชื่อ-นามสกุลจริง',
  `email` VARCHAR(100) NOT NULL UNIQUE COMMENT 'อีเมลสำหรับรับการแจ้งเตือนงาน PM',
  `role` ENUM('admin', 'manager', 'technician', 'engineer') NOT NULL DEFAULT 'technician' COMMENT 'สิทธิ์การใช้งาน RBAC',
  `department` VARCHAR(100) NOT NULL COMMENT 'แผนกที่สังกัด เช่น SMT Line, Facility',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'สถานะผู้ใช้ 1=ใช้งาน, 0=ระงับ',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_department` (`department`)
) ENGINE=InnoDB COMMENT='ตารางเก็บข้อมูลผู้ใช้งานและบทบาทสิทธิ์ RBAC';

-- ------------------------------------------------------------------------------
-- 2. TABLE: machines (ทะเบียนเครื่องจักร ข้อมูลทางเทคนิค และสถานะการทำงาน)
-- ------------------------------------------------------------------------------
CREATE TABLE `machines` (
  `id` VARCHAR(36) NOT NULL COMMENT 'ID หรือ Machine Code เช่น MC-SMT-001',
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'รหัสเครื่องจักรประจำโรงงาน',
  `name` VARCHAR(150) NOT NULL COMMENT 'ชื่อเครื่องจักร เช่น SMT PCB LOADER',
  `model` VARCHAR(100) NOT NULL COMMENT 'รุ่นเครื่องจักร เช่น ESL-500',
  `serial_number` VARCHAR(100) NOT NULL COMMENT 'หมายเลขซีเรียลจากผู้ผลิต',
  `line_operation` VARCHAR(100) NOT NULL COMMENT 'ไลน์การผลิต เช่น SMT LINE # 2',
  `department` VARCHAR(100) NOT NULL COMMENT 'แผนกที่ดูแลรับผิดชอบ',
  `status` ENUM('active', 'maintenance', 'breakdown') NOT NULL DEFAULT 'active' COMMENT 'สถานะเครื่องจักร',
  `critical_level` ENUM('critical', 'high', 'medium', 'low') NOT NULL DEFAULT 'medium' COMMENT 'ระดับความวิกฤติต่อสายการผลิต',
  `install_date` DATE NOT NULL COMMENT 'วันที่ติดตั้งเครื่องจักร',
  `location` VARCHAR(150) NOT NULL COMMENT 'ตำแหน่งติดตั้ง เช่น อาคาร B ชั้น 2 Bay 04',
  `running_hours` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ชั่วโมงการทำงานสะสม (Hours)',
  `last_pm_date` DATE NULL COMMENT 'วันที่ทำ PM ล่าสุด',
  `next_pm_date` DATE NOT NULL COMMENT 'วันที่ต้องทำ PM ครั้งถัดไป',
  `power_rating_kw` DECIMAL(8,2) NULL COMMENT 'พิกัดกำลังไฟฟ้า (kW)',
  `spec_notes` TEXT NULL COMMENT 'สเปกทางเทคนิค แรงดันลม สารหล่อลื่น',
  `breakdown_reason` TEXT NULL COMMENT 'สาเหตุที่เครื่องหยุดชะงัก (หากสถานะเป็น breakdown)',
  `breakdown_since` DATETIME NULL COMMENT 'เวลาที่เกิดการชำรุดเสียหาย',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_machines_status` (`status`),
  INDEX `idx_machines_line` (`line_operation`),
  INDEX `idx_machines_next_pm` (`next_pm_date`),
  INDEX `idx_machines_critical` (`critical_level`)
) ENGINE=InnoDB COMMENT='ตารางทะเบียนเครื่องจักรโรงงาน';

-- ------------------------------------------------------------------------------
-- 3. TABLE: pm_schedules (แผนการบำรุงรักษาเชิงป้องกันรายสัปดาห์/เดือน/ปี)
-- ------------------------------------------------------------------------------
CREATE TABLE `pm_schedules` (
  `id` VARCHAR(36) NOT NULL COMMENT 'Schedule ID เช่น PM-2026-001',
  `machine_id` VARCHAR(36) NOT NULL COMMENT 'Foreign Key อ้างอิงตาราง machines',
  `plan_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อแผนงาน PM',
  `frequency` ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL COMMENT 'รอบความถี่ในการตรวจเช็ก',
  `next_due_date` DATE NOT NULL COMMENT 'วันครบกำหนดทำ PM รอบถัดไป (ห้ามย้อนหลัง)',
  `last_performed_date` DATE NULL COMMENT 'วันที่ทำ PM เสร็จสิ้นรอบล่าสุด',
  `status` ENUM('scheduled', 'in_progress', 'completed', 'overdue') NOT NULL DEFAULT 'scheduled' COMMENT 'สถานะแผนงาน',
  `assigned_technician_id` VARCHAR(36) NOT NULL COMMENT 'ช่างหรือวิศวกรผู้รับผิดชอบ',
  `completion_notes` TEXT NULL COMMENT 'บันทึกสรุปการตรวจเช็กหรือข้อเสนอแนะ',
  `verified_by_user_id` VARCHAR(36) NULL COMMENT 'ผู้ตรวจสอบการทำ PM',
  `approved_by_user_id` VARCHAR(36) NULL COMMENT 'ผู้อนุมัติผลการทำ PM (Manager/Admin)',
  `completed_at` DATETIME NULL COMMENT 'วันเวลาที่บันทึกเสร็จสิ้นงาน',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`assigned_technician_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_pm_status_due` (`status`, `next_due_date`),
  INDEX `idx_pm_machine_id` (`machine_id`)
) ENGINE=InnoDB COMMENT='ตารางแผนการบำรุงรักษาเชิงป้องกัน';

-- ------------------------------------------------------------------------------
-- 4. TABLE: pm_checklist_items (รายการตรวจเช็กตาม Checklist ของเครื่องจักร)
-- ------------------------------------------------------------------------------
CREATE TABLE `pm_checklist_items` (
  `id` VARCHAR(36) NOT NULL COMMENT 'Checklist Item ID เช่น CHK-01',
  `pm_schedule_id` VARCHAR(36) NOT NULL COMMENT 'Foreign Key อ้างอิงตาราง pm_schedules',
  `section` VARCHAR(100) NOT NULL COMMENT 'หน่วยที่ต้องตรวจสอบ เช่น แหล่งจ่ายลม, แกนสไลด์',
  `component_name` VARCHAR(150) NOT NULL COMMENT 'รายการชิ้นส่วน',
  `spec` VARCHAR(255) NOT NULL COMMENT 'มาตรฐานการตรวจสอบ เช่น 4-6 Kgf/cm^2, สะอาด',
  `method_clean` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'วิธีการ C = ทำความสะอาด',
  `method_lubricate` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'วิธีการ L = หล่อลื่น',
  `method_inspect` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'วิธีการ I = ตรวจสอบ',
  `method_functional` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'วิธีการ F = หน้าที่การทำงาน',
  `lubricant` VARCHAR(80) NULL COMMENT 'ชนิดสารหล่อลื่นที่ใช้ เช่น LCG100',
  `interval_tag` VARCHAR(20) NOT NULL DEFAULT '1M' COMMENT 'ช่วงเวลา เช่น 1D, 1W, 1M',
  `result` ENUM('OK', 'NG', 'APPLIED', 'NONE') NOT NULL DEFAULT 'NONE' COMMENT 'ผลการตรวจเช็ก',
  `remark` TEXT NULL COMMENT 'หมายเหตุ / ค่าที่วัดได้จริง',
  `checked_at` DATETIME NULL COMMENT 'เวลาที่บันทึกผลจุดนี้',
  `sequence_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`pm_schedule_id`) REFERENCES `pm_schedules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_checklist_schedule` (`pm_schedule_id`)
) ENGINE=InnoDB COMMENT='ตารางรายการตรวจเช็กและบันทึกผล Checklist ตามแบบฟอร์มโรงงาน';

-- ------------------------------------------------------------------------------
-- 5. TABLE: maintenance_logs (บันทึกประวัติการซ่อมบำรุงและปิดใบงาน)
-- ------------------------------------------------------------------------------
CREATE TABLE `maintenance_logs` (
  `id` VARCHAR(36) NOT NULL COMMENT 'Log / Work Order ID เช่น WO-2026-001',
  `machine_id` VARCHAR(36) NOT NULL COMMENT 'เครื่องจักรที่ทำการซ่อม',
  `pm_schedule_id` VARCHAR(36) NULL COMMENT 'อ้างอิงแผน PM (ถ้าเป็นงาน PM)',
  `log_type` ENUM('preventive', 'corrective', 'breakdown') NOT NULL COMMENT 'ประเภทงานซ่อม',
  `title` VARCHAR(200) NOT NULL COMMENT 'หัวข้องานซ่อมบำรุง',
  `issue_description` TEXT NOT NULL COMMENT 'อาการเสียหรือรายละเอียดงาน',
  `action_taken` TEXT NOT NULL COMMENT 'วิธีการแก้ไขและขั้นตอนการซ่อม',
  `root_cause` TEXT NULL COMMENT 'สาเหตุที่แท้จริง (Root Cause)',
  `technician_id` VARCHAR(36) NOT NULL COMMENT 'ช่างผู้รับผิดชอบงาน',
  `labor_hours` DECIMAL(6,2) NOT NULL DEFAULT 0.00 COMMENT 'ชั่วโมงแรงงานซ่อม (ห้ามติดลบ)',
  `cost_spare_parts` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'ค่าอะไหล่รวม (ห้ามติดลบ)',
  `cost_labor` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'ค่าแรงรวม (ห้ามติดลบ)',
  `total_cost` DECIMAL(12,2) GENERATED ALWAYS AS (`cost_spare_parts` + `cost_labor`) STORED COMMENT 'ค่าใช้จ่ายรวมคำนวณอัตโนมัติ',
  `status` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending' COMMENT 'สถานะใบงานซ่อม',
  `performed_date` DATE NOT NULL COMMENT 'วันที่เข้าดำเนินการซ่อม',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`technician_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`pm_schedule_id`) REFERENCES `pm_schedules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_labor_hours` CHECK (`labor_hours` >= 0),
  CONSTRAINT `chk_cost_spare_parts` CHECK (`cost_spare_parts` >= 0),
  CONSTRAINT `chk_cost_labor` CHECK (`cost_labor` >= 0),
  INDEX `idx_logs_machine` (`machine_id`),
  INDEX `idx_logs_performed_date` (`performed_date`),
  INDEX `idx_logs_type` (`log_type`)
) ENGINE=InnoDB COMMENT='ตารางประวัติการซ่อมบำรุงและใบสั่งงาน Work Order';

-- ------------------------------------------------------------------------------
-- 6. TABLE: maintenance_spare_parts (บันทึกการเบิกใช้อะไหล่ในงานซ่อม)
-- ------------------------------------------------------------------------------
CREATE TABLE `maintenance_spare_parts` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `maintenance_log_id` VARCHAR(36) NOT NULL,
  `part_no` VARCHAR(50) NOT NULL COMMENT 'รหัสอะไหล่',
  `part_name` VARCHAR(150) NOT NULL COMMENT 'ชื่ออะไหล่',
  `quantity` DECIMAL(8,2) NOT NULL DEFAULT 1.00 COMMENT 'จำนวนที่เบิกใช้',
  `unit_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาต่อหน่วย',
  `total_part_cost` DECIMAL(12,2) GENERATED ALWAYS AS (`quantity` * `unit_cost`) STORED,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`maintenance_log_id`) REFERENCES `maintenance_logs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_spare_part_qty` CHECK (`quantity` > 0),
  CONSTRAINT `chk_spare_part_cost` CHECK (`unit_cost` >= 0)
) ENGINE=InnoDB COMMENT='ตารางรายการอะไหล่ที่ใช้ในแต่ละใบงานซ่อม';

-- ------------------------------------------------------------------------------
-- 7. INITIAL SEED DATA (ข้อมูลตั้งต้นตามสภาพโรงงานจริง)
-- ------------------------------------------------------------------------------

-- ผู้ใช้งานระบบ
INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `email`, `role`, `department`) VALUES
('USR-001', 'somchai.m', '$2a$12$e68Y2kY27G5sK9w/T...example_hash', 'สมชาย มั่นคง (Somchai M.)', 'somchai.m@factory-tech.co.th', 'manager', 'Maintenance & Facility Management'),
('USR-002', 'prasit.t', '$2a$12$e68Y2kY27G5sK9w/T...example_hash', 'ประสิทธิ์ วิศวกรรม (Prasit W.)', 'prasit.w@factory-tech.co.th', 'engineer', 'SMT Maintenance Engineering'),
('USR-003', 'wichai.k', '$2a$12$e68Y2kY27G5sK9w/T...example_hash', 'วิชัย ช่างทอง (Wichai K.)', 'wichai.k@factory-tech.co.th', 'technician', 'Electromechanical Line 2'),
('USR-004', 'admin.system', '$2a$12$e68Y2kY27G5sK9w/T...example_hash', 'ผู้ดูแลระบบส่วนกลาง (System Admin)', 'cmms-admin@factory-tech.co.th', 'admin', 'IT & Operational Technology');

-- เครื่องจักร (รวม LOADER ESL-500 จากภาพตัวอย่าง)
INSERT INTO `machines` (`id`, `code`, `name`, `model`, `serial_number`, `line_operation`, `department`, `status`, `critical_level`, `install_date`, `location`, `running_hours`, `last_pm_date`, `next_pm_date`, `power_rating_kw`, `spec_notes`) VALUES
('MC-SMT-001', 'MC-SMT-001', 'SMT PCB LOADER', 'ESL-500', 'L21020301024E', 'SMT LINE # 2', 'SMT Manufacturing', 'active', 'high', '2023-03-15', 'Building B, Floor 2, Bay 04', 4820, '2026-09-15', '2026-10-15', 2.20, 'ความดันลม 4-6 Kgf/cm², สารหล่อลื่น LCG100'),
('MC-SMT-002', 'MC-SMT-002', 'AUTO SOLDER PRINTER', 'DEK Horizon 03iX', 'DH-2022-88719', 'SMT LINE # 2', 'SMT Manufacturing', 'active', 'critical', '2022-08-10', 'Building B, Floor 2, Bay 05', 6140, '2026-09-10', '2026-10-10', 4.50, 'ความแม่นยำ Alignment ±15µm, กล้อง 2D Paste Inspection'),
('MC-SMT-003', 'MC-SMT-003', 'HIGH SPEED CHIP MOUNTER', 'Panasonic NPM-D3', 'PM-99210-441B', 'SMT LINE # 2', 'SMT Manufacturing', 'maintenance', 'critical', '2022-05-20', 'Building B, Floor 2, Bay 06', 7290, '2026-08-28', '2026-09-28', 8.80, 'กำลังอยู่ระหว่าง Calibrate หัว Nozzle Head 3 และเปลี่ยน Vacuum Filter'),
('MC-SMT-004', 'MC-SMT-004', 'REFLOW OVEN 10 ZONES', 'Heller 1809 MK5', 'HL-1809-5502', 'SMT LINE # 2', 'SMT Manufacturing', 'active', 'critical', '2021-11-04', 'Building B, Floor 2, Bay 07', 9410, '2026-09-01', '2026-10-01', 24.00, '10 Heating Zones + 3 Cooling Zones, ควบคุมอุณหภูมิ ±1.5°C'),
('MC-CNC-001', 'MC-CNC-001', '5-AXIS CNC MACHINING CENTER', 'DMG MORI DMU 50', 'DM-50-2023-091', 'PRECISION CNC SHOP', 'Tooling & Fabrication', 'breakdown', 'critical', '2023-01-18', 'Building A, Floor 1, Machining Cell 1', 3950, '2026-08-14', '2026-09-20', 15.00, 'แกน Spindle ความร้อนขึ้นสูงผิดปกติ (>75°C) สัญญาณ Error Code E-4091');

-- แผนการบำรุงรักษา
INSERT INTO `pm_schedules` (`id`, `machine_id`, `plan_name`, `frequency`, `next_due_date`, `last_performed_date`, `status`, `assigned_technician_id`, `created_at`) VALUES
('PM-2026-001', 'MC-SMT-001', 'แผน PM ประจำเดือน: หล่อลื่นแกนสไลด์และเช็กความดันลม', 'monthly', '2026-10-15', '2026-09-15', 'scheduled', 'USR-003', '2026-09-01 08:00:00');

-- Checklist Items สำหรับ SMT PCB LOADER (ESL-500) ตามรูปภาพ Preventive Maintenance Record Data
INSERT INTO `pm_checklist_items` (`id`, `pm_schedule_id`, `section`, `component_name`, `spec`, `method_clean`, `method_lubricate`, `method_inspect`, `method_functional`, `lubricant`, `interval_tag`, `result`, `remark`, `sequence_order`) VALUES
('CHK-01', 'PM-2026-001', 'ภายนอกของเครื่องจักร', 'แผงควบคุม', 'สะอาด ปราศจากคราบน้ำมันและฝุ่นผง', 1, 0, 0, 0, NULL, '1D', 'OK', 'เช็ดทำความสะอาดเรียบร้อย', 1),
('CHK-02', 'PM-2026-001', 'ความปลอดภัย', 'สวิทช์ Emergency และสวิทช์ Safety', 'เครื่องหยุดทันทีเมื่อกดสวิทช์ (โดยกดสวิทช์ให้ลงไปติดกับฐานรองสวิทช์)', 0, 0, 1, 1, NULL, '1D', 'OK', 'ทดสอบตัดวงจรไฟหลักได้สมบูรณ์', 2),
('CHK-03', 'PM-2026-001', 'ภายนอกเครื่อง', 'ความสะอาดของเครื่องจักร', 'สะอาด', 1, 0, 1, 0, NULL, '1D', 'OK', NULL, 3),
('CHK-04', 'PM-2026-001', 'แกนผลักบอร์ด', 'ความเร็วแกนผลักบอร์ด', 'ความเร็วต่ำ', 0, 0, 1, 0, NULL, '1D', 'OK', NULL, 4),
('CHK-05', 'PM-2026-001', 'แกนผลักบอร์ด', 'หัวลูกบิด ปรับความเร็วแกนผลักบอร์ด', 'ล็อกไม่คลาย', 0, 0, 1, 0, NULL, '1D', 'OK', NULL, 5),
('CHK-06', 'PM-2026-001', 'แกนผลักบอร์ด', 'มาร์ค I ที่หัวลูกบิด ป้องกัน การปรับความเร็วแกนผลักบอร์ด', 'ไม่ปรับ', 0, 0, 1, 0, NULL, '1D', 'OK', NULL, 6),
('CHK-07', 'PM-2026-001', 'แหล่งจ่ายลม', 'ความดันลม', '4-6 Kgf/cm^2', 0, 0, 1, 0, NULL, '1D', 'OK', 'เกจวัดได้ 5.2 Kgf/cm^2', 7),
('CHK-08', 'PM-2026-001', 'สายพานลำเลียง', 'โซ่พลาสติก', 'ไม่ติดขัด', 1, 0, 0, 0, NULL, '1M', 'OK', NULL, 8),
('CHK-09', 'PM-2026-001', 'สายพานลำเลียง', 'เซ็นเซอร์', 'สะอาด', 1, 0, 0, 1, NULL, '1M', 'OK', NULL, 9),
('CHK-10', 'PM-2026-001', 'แกนผลักบอร์ด', 'ทดสอบแกนผลักบอร์ดอยู่ตรงกึ่งกลางแกน', 'กึ่งกลางแกน', 1, 0, 1, 0, NULL, '1M', 'OK', NULL, 10),
('CHK-11', 'PM-2026-001', 'ล็อกแมกกาซีน', 'กระบอกลม', 'ไม่ติดขัด', 1, 0, 0, 0, NULL, '1M', 'OK', NULL, 11),
('CHK-12', 'PM-2026-001', 'ลิฟท์ยกแมกกาซีน', 'แกนสไลด์', 'ไม่ติดขัด', 1, 1, 0, 0, 'LCG100', '1M', 'APPLIED', 'ทาจาระบี LCG100 ตามรอบเดือน', 12),
('CHK-13', 'PM-2026-001', 'ลิฟท์ยกแมกกาซีน', 'สายพาน ของมอเตอร์ลิฟท์', 'สภาพดี', 0, 0, 1, 0, NULL, '1M', 'OK', NULL, 13),
('CHK-14', 'PM-2026-001', 'ลิฟท์ยกแมกกาซีน', 'ตรวจสอบการเชื่อมต่อระบบกราวด์ของเครื่องจักร', 'สกรูยึดสายแน่น', 0, 0, 1, 0, NULL, '1M', 'OK', NULL, 14),
('CHK-15', 'PM-2026-001', 'แผงวงจร', 'ภาคควบคุม', 'สะอาด', 1, 0, 0, 0, NULL, '1M', 'OK', NULL, 15);
