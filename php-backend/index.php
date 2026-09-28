<?php
/**
 * FACTORY CMMS/EAM - MAIN ENTRY POINT & WEB INSTALLER (PHP 8.x)
 * -----------------------------------------------------------------------------
 * Functionality:
 *  1. One-Click Project & Database Auto-Installer Wizard (if not yet installed)
 *  2. REST API Front-Controller Router (when installed and accessing /api/*)
 *  3. Factory CMMS Web Overview Dashboard (when accessed via browser)
 * -----------------------------------------------------------------------------
 */

declare(strict_types=1);

// Global Security & CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Role, X-User-Id");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");
header("X-XSS-Protection: 1; mode=block");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$lockFile = __DIR__ . '/installed.lock';
$configFile = __DIR__ . '/config/database.php';
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// -----------------------------------------------------------------------------
// CHECK IF INSTALLATION IS REQUIRED OR REQUESTED
// -----------------------------------------------------------------------------
$isInstalled = file_exists($lockFile);
$action = $_GET['action'] ?? '';

if (!$isInstalled || $action === 'install') {
    handleInstallationWizard($lockFile, $configFile);
    exit;
}

// -----------------------------------------------------------------------------
// REST API ROUTING (When Installed)
// -----------------------------------------------------------------------------
if (strpos($requestUri, '/api/') !== false || preg_match('#^/api#', $requestUri)) {
    if (preg_match('#^/api/machines#', $requestUri)) {
        require __DIR__ . '/api/machines.php';
    } elseif (preg_match('#^/api/complete-pm#', $requestUri) || preg_match('#^/api/complete_pm#', $requestUri)) {
        require __DIR__ . '/api/complete_pm.php';
    } elseif (preg_match('#^/api/pm-schedules#', $requestUri) || preg_match('#^/api/pm_schedules#', $requestUri)) {
        require __DIR__ . '/api/pm_schedules.php';
    } elseif (preg_match('#^/api/maintenance-logs#', $requestUri) || preg_match('#^/api/maintenance_logs#', $requestUri)) {
        require __DIR__ . '/api/maintenance_logs.php';
    } elseif (preg_match('#^/api/kpis#', $requestUri)) {
        require __DIR__ . '/api/kpis.php';
    } else {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'system'    => 'Factory Machine Management CMMS/EAM',
            'backend'   => 'PHP 8.x + MySQL PDO',
            'status'    => 'installed_and_running',
            'endpoints' => [
                'GET /api/machines'          => 'ดึงรายการเครื่องจักรและสถานะ',
                'POST /api/machines'         => 'ลงทะเบียนเครื่องจักรใหม่ (Manager/Admin)',
                'GET /api/pm-schedules'      => 'ดึงตารางแผนงาน PM และรอบความถี่',
                'POST /api/pm-schedules'     => 'สร้างแผนงาน PM ใหม่ (ห้ามย้อนหลัง)',
                'POST /api/complete-pm'      => 'บันทึกปิดใบงาน PM พร้อม Checklist & อะไหล่ (PDO Transaction)',
                'GET /api/maintenance-logs'  => 'ประวัติงานซ่อมและ Work Orders',
                'POST /api/maintenance-logs' => 'เปิดใบงานซ่อมบำรุงฉุกเฉิน / แก้ไข',
                'GET /api/kpis'              => 'คำนวณ Machine Availability %, MTBF, MTTR'
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
    exit;
}

// -----------------------------------------------------------------------------
// BROWSER WEB DASHBOARD OVERVIEW (When Accessing Root in Browser)
// -----------------------------------------------------------------------------
renderInstalledDashboard();
exit;

// =============================================================================
// INSTALLATION WIZARD CONTROLLER & VIEW
// =============================================================================
function handleInstallationWizard(string $lockFile, string $configFile): void {
    $error = null;
    $success = null;
    $installedSteps = [];

    // Default configuration values
    $dbHost = $_POST['db_host'] ?? 'localhost';
    $dbPort = $_POST['db_port'] ?? '3306';
    $dbName = $_POST['db_name'] ?? 'factory_cmms_db';
    $dbUser = $_POST['db_user'] ?? 'root';
    $dbPass = $_POST['db_pass'] ?? '';
    $adminUser = $_POST['admin_user'] ?? 'admin';
    $adminPass = $_POST['admin_pass'] ?? 'Admin@1234';
    $adminEmail = $_POST['admin_email'] ?? 'admin@factory-tech.co.th';
    $factoryName = $_POST['factory_name'] ?? 'SMT Line #2 Precision Manufacturing';

    // Handle Form Submit
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['run_install'])) {
        try {
            // Step 1: Test Connection to MySQL Server
            $dsnNoDb = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
            $pdo = new PDO($dsnNoDb, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            $installedSteps[] = "เชื่อมต่อฐานข้อมูล MySQL Server ({$dbHost}:{$dbPort}) สำเร็จ";

            // Step 2: Create Database if not exists
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `{$dbName}`");
            $installedSteps[] = "สร้างฐานข้อมูล `{$dbName}` (utf8mb4_unicode_ci) สำเร็จ";

            // Step 3: Create Tables DDL
            $sqlDdl = getDdlScript();
            $pdo->exec($sqlDdl);
            $installedSteps[] = "สร้างโครงสร้างตาราง (users, machines, pm_schedules, pm_checklist_items, maintenance_logs, maintenance_spare_parts) สำเร็จ";

            // Step 4: Seed Admin User
            $hashedPassword = password_hash($adminPass, PASSWORD_BCRYPT);
            $userStmt = $pdo->prepare("INSERT INTO users (id, username, password_hash, full_name, email, role, department)
                                       VALUES ('USR-001', :username, :password, 'System Administrator', :email, 'admin', 'Maintenance IT')
                                       ON DUPLICATE KEY UPDATE password_hash = :password");
            $userStmt->execute([
                ':username' => $adminUser,
                ':password' => $hashedPassword,
                ':email'    => $adminEmail
            ]);
            $installedSteps[] = "สร้างบัญชีผู้ดูแลระบบ (Admin: {$adminUser}) สำเร็จ";

            // Step 5: Seed Authentic SMT Machine & PM Checklist (LOADER ESL-500)
            seedFactoryMachinesAndChecklist($pdo);
            $installedSteps[] = "นำเข้าข้อมูลเครื่องจักร SMT LOADER ESL-500 พร้อม Checklist ตรวจสอบ 15 จุด (แผงควบคุม, สวิทช์ฉุกเฉิน, สารหล่อลื่น LCG100) สำเร็จ";

            // Step 6: Write config/database.php
            if (!is_dir(dirname($configFile))) {
                mkdir(dirname($configFile), 0755, true);
            }
            $configContent = generateDatabaseConfigFile($dbHost, $dbPort, $dbName, $dbUser, $dbPass);
            file_put_contents($configFile, $configContent);
            $installedSteps[] = "บันทึกไฟล์คอนฟิกเชื่อมต่อที่ config/database.php สำเร็จ";

            // Step 7: Create installed.lock
            file_put_contents($lockFile, date('Y-m-d H:i:s') . " - Installed successfully");
            $installedSteps[] = "สร้างไฟล์ installed.lock เพื่อความปลอดภัยของระบบ";

            $success = "ติดตั้งระบบ Factory CMMS/EAM และสร้างฐานข้อมูล MySQL สมบูรณ์พร้อมใช้งาน!";
        } catch (Throwable $e) {
            $error = "การติดตั้งล้มเหลว: " . $e->getMessage();
        }
    }

    // Render HTML Installer Page
    renderInstallerHtml($dbHost, $dbPort, $dbName, $dbUser, $dbPass, $adminUser, $adminPass, $adminEmail, $factoryName, $error, $success, $installedSteps);
}

// -----------------------------------------------------------------------------
// DDL SCHEMA SCRIPT GENERATOR
// -----------------------------------------------------------------------------
function getDdlScript(): string {
    return "
    CREATE TABLE IF NOT EXISTS `users` (
      `id` VARCHAR(36) NOT NULL,
      `username` VARCHAR(50) NOT NULL UNIQUE,
      `password_hash` VARCHAR(255) NOT NULL,
      `full_name` VARCHAR(120) NOT NULL,
      `email` VARCHAR(100) NOT NULL UNIQUE,
      `role` ENUM('admin', 'manager', 'technician', 'engineer') NOT NULL DEFAULT 'technician',
      `department` VARCHAR(100) NOT NULL,
      `is_active` TINYINT(1) NOT NULL DEFAULT 1,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      INDEX `idx_users_role` (`role`)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS `machines` (
      `id` VARCHAR(36) NOT NULL,
      `code` VARCHAR(50) NOT NULL UNIQUE,
      `name` VARCHAR(150) NOT NULL,
      `model` VARCHAR(100) NOT NULL,
      `serial_number` VARCHAR(100) NOT NULL,
      `line_operation` VARCHAR(100) NOT NULL,
      `department` VARCHAR(100) NOT NULL,
      `status` ENUM('active', 'maintenance', 'breakdown') NOT NULL DEFAULT 'active',
      `critical_level` ENUM('critical', 'high', 'medium', 'low') NOT NULL DEFAULT 'medium',
      `install_date` DATE NOT NULL,
      `location` VARCHAR(150) NOT NULL,
      `running_hours` INT UNSIGNED NOT NULL DEFAULT 0,
      `last_pm_date` DATE NULL,
      `next_pm_date` DATE NOT NULL,
      `power_rating_kw` DECIMAL(8,2) NULL,
      `spec_notes` TEXT NULL,
      `breakdown_reason` TEXT NULL,
      `breakdown_since` DATETIME NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      INDEX `idx_machines_status` (`status`),
      INDEX `idx_machines_line` (`line_operation`),
      INDEX `idx_machines_next_pm` (`next_pm_date`)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS `pm_schedules` (
      `id` VARCHAR(36) NOT NULL,
      `machine_id` VARCHAR(36) NOT NULL,
      `plan_name` VARCHAR(200) NOT NULL,
      `frequency` ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
      `next_due_date` DATE NOT NULL,
      `last_performed_date` DATE NULL,
      `status` ENUM('scheduled', 'in_progress', 'completed', 'overdue') NOT NULL DEFAULT 'scheduled',
      `assigned_technician_id` VARCHAR(36) NOT NULL,
      `completion_notes` TEXT NULL,
      `verified_by_user_id` VARCHAR(36) NULL,
      `approved_by_user_id` VARCHAR(36) NULL,
      `completed_at` DATETIME NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY (`assigned_technician_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
      INDEX `idx_pm_status_due` (`status`, `next_due_date`)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS `pm_checklist_items` (
      `id` VARCHAR(36) NOT NULL,
      `pm_schedule_id` VARCHAR(36) NOT NULL,
      `section` VARCHAR(100) NOT NULL,
      `component_name` VARCHAR(150) NOT NULL,
      `spec` VARCHAR(255) NOT NULL,
      `method_clean` TINYINT(1) NOT NULL DEFAULT 0,
      `method_lubricate` TINYINT(1) NOT NULL DEFAULT 0,
      `method_inspect` TINYINT(1) NOT NULL DEFAULT 0,
      `method_functional` TINYINT(1) NOT NULL DEFAULT 0,
      `lubricant` VARCHAR(80) NULL,
      `interval_tag` VARCHAR(20) NOT NULL DEFAULT '1M',
      `result` ENUM('OK', 'NG', 'APPLIED', 'NONE') NOT NULL DEFAULT 'NONE',
      `remark` TEXT NULL,
      `sequence_order` INT NOT NULL DEFAULT 0,
      PRIMARY KEY (`id`),
      FOREIGN KEY (`pm_schedule_id`) REFERENCES `pm_schedules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS `maintenance_logs` (
      `id` VARCHAR(36) NOT NULL,
      `machine_id` VARCHAR(36) NOT NULL,
      `pm_schedule_id` VARCHAR(36) NULL,
      `log_type` ENUM('preventive', 'corrective', 'breakdown') NOT NULL,
      `title` VARCHAR(200) NOT NULL,
      `issue_description` TEXT NOT NULL,
      `action_taken` TEXT NOT NULL,
      `root_cause` TEXT NULL,
      `technician_id` VARCHAR(36) NOT NULL,
      `labor_hours` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
      `cost_spare_parts` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      `cost_labor` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      `total_cost` DECIMAL(12,2) GENERATED ALWAYS AS (`cost_spare_parts` + `cost_labor`) STORED,
      `status` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
      `performed_date` DATE NOT NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY (`technician_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
      INDEX `idx_logs_machine` (`machine_id`),
      INDEX `idx_logs_performed_date` (`performed_date`)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS `maintenance_spare_parts` (
      `id` INT AUTO_INCREMENT NOT NULL,
      `maintenance_log_id` VARCHAR(36) NOT NULL,
      `part_no` VARCHAR(50) NOT NULL,
      `part_name` VARCHAR(150) NOT NULL,
      `quantity` DECIMAL(8,2) NOT NULL DEFAULT 1.00,
      `unit_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      PRIMARY KEY (`id`),
      FOREIGN KEY (`maintenance_log_id`) REFERENCES `maintenance_logs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;
    ";
}

// -----------------------------------------------------------------------------
// SEED FACTORY MACHINES AND AUTHENTIC SMT LOADER CHECKLIST
// -----------------------------------------------------------------------------
function seedFactoryMachinesAndChecklist(PDO $pdo): void {
    // 1. Seed LOADER ESL-500
    $pdo->exec("
    INSERT INTO `machines` (`id`, `code`, `name`, `model`, `serial_number`, `line_operation`, `department`, `status`, `critical_level`, `install_date`, `location`, `running_hours`, `last_pm_date`, `next_pm_date`, `power_rating_kw`, `spec_notes`)
    VALUES
    ('MC-SMT-001', 'MC-SMT-001', 'SMT PCB LOADER', 'ESL-500', 'L21020301024E', 'SMT LINE # 2', 'SMT Manufacturing', 'active', 'high', '2023-03-15', 'Building B, Floor 2, Bay 04', 4820, '2026-09-15', '2026-10-15', 2.20, 'ความดันลม 4-6 Kgf/cm², สารหล่อลื่น LCG100'),
    ('MC-SMT-002', 'MC-SMT-002', 'AUTO SOLDER PRINTER', 'DEK Horizon 03iX', 'DH-2022-88719', 'SMT LINE # 2', 'SMT Manufacturing', 'active', 'critical', '2022-08-10', 'Building B, Floor 2, Bay 05', 6140, '2026-09-10', '2026-10-10', 4.50, 'ความแม่นยำ Alignment ±15µm, กล้อง 2D Paste Inspection'),
    ('MC-SMT-003', 'MC-SMT-003', 'HIGH SPEED CHIP MOUNTER', 'Panasonic NPM-D3', 'PM-99210-441B', 'SMT LINE # 2', 'SMT Manufacturing', 'maintenance', 'critical', '2022-05-20', 'Building B, Floor 2, Bay 06', 7290, '2026-08-28', '2026-09-28', 8.80, 'กำลังอยู่ระหว่าง Calibrate หัว Nozzle Head 3 และเปลี่ยน Vacuum Filter'),
    ('MC-CNC-001', 'MC-CNC-001', '5-AXIS CNC MACHINING CENTER', 'DMG MORI DMU 50', 'DM-50-2023-091', 'PRECISION CNC SHOP', 'Tooling & Fabrication', 'breakdown', 'critical', '2023-01-18', 'Building A, Floor 1, Machining Cell 1', 3950, '2026-08-14', '2026-09-20', 15.00, 'แกน Spindle ความร้อนขึ้นสูงผิดปกติ (>75°C) สัญญาณ Error Code E-4091')
    ON DUPLICATE KEY UPDATE name=VALUES(name);
    ");

    // 2. Seed PM Schedule
    $pdo->exec("
    INSERT INTO `pm_schedules` (`id`, `machine_id`, `plan_name`, `frequency`, `next_due_date`, `last_performed_date`, `status`, `assigned_technician_id`, `created_at`)
    VALUES
    ('PM-2026-001', 'MC-SMT-001', 'แผน PM ประจำเดือน: หล่อลื่นแกนสไลด์และเช็กความดันลม', 'monthly', '2026-10-15', '2026-09-15', 'scheduled', 'USR-001', NOW())
    ON DUPLICATE KEY UPDATE plan_name=VALUES(plan_name);
    ");

    // 3. Seed 15 Authentic Checklist Items (Preventive Maintenance Record Data)
    $pdo->exec("
    INSERT INTO `pm_checklist_items` (`id`, `pm_schedule_id`, `section`, `component_name`, `spec`, `method_clean`, `method_lubricate`, `method_inspect`, `method_functional`, `lubricant`, `interval_tag`, `result`, `remark`, `sequence_order`)
    VALUES
    ('CHK-01', 'PM-2026-001', 'ภายนอกของเครื่องจักร', 'แผงควบคุม', 'สะอาด', 1, 0, 0, 0, NULL, '1D', 'OK', 'เช็ดทำความสะอาดเรียบร้อย', 1),
    ('CHK-02', 'PM-2026-001', 'ความปลอดภัย', 'สวิทช์ Emergency และสวิทช์ Safety', 'เครื่องหยุด', 0, 0, 1, 1, NULL, '1D', 'OK', 'ทดสอบตัดวงจรไฟหลักได้สมบูรณ์', 2),
    ('CHK-03', 'PM-2026-001', 'ภายนอกเครื่อง', 'ความสะอาดของเครื่องจักร', 'สะอาด', 1, 0, 1, 0, NULL, '1D', 'OK', NULL, 3),
    ('CHK-04', 'PM-2026-001', 'แกนผลักบอร์ด', 'ความเร็วแกนผลักบอร์ด', 'ความเร็วต่ำ', 0, 0, 1, 0, NULL, '1D', 'OK', NULL, 4),
    ('CHK-05', 'PM-2026-001', 'แกนผลักบอร์ด', 'หัวลูกบิด ปรับความเร็วแกนผลักบอร์ด', 'ล็อกไม่คลาย', 0, 0, 1, 0, NULL, '1D', 'OK', NULL, 5),
    ('CHK-06', 'PM-2026-001', 'แกนผลักบอร์ด', 'มาร์ค I ที่หัวลูกบิด ป้องกัน การปรับความเร็วแกนผลักบอร์ด', 'ไม่ปรับ', 0, 0, 1, 0, NULL, '1D', 'OK', NULL, 6),
    ('CHK-07', 'PM-2026-001', 'แหล่งจ่ายลม', 'ความดันลม', '4-6 Kgf/cm^2', 0, 0, 1, 0, NULL, '1D', 'OK', 'วัดได้ 5.2 Kgf/cm^2', 7),
    ('CHK-08', 'PM-2026-001', 'สายพานลำเลียง', 'โซ่พลาสติก', 'ไม่ติดขัด', 1, 0, 0, 0, NULL, '1M', 'OK', NULL, 8),
    ('CHK-09', 'PM-2026-001', 'สายพานลำเลียง', 'เซ็นเซอร์', 'สะอาด', 1, 0, 0, 1, NULL, '1M', 'OK', NULL, 9),
    ('CHK-10', 'PM-2026-001', 'แกนผลักบอร์ด', 'ทดสอบแกนผลักบอร์ดอยู่ตรงกึ่งกลางแกน', 'กึ่งกลางแกน', 1, 0, 1, 0, NULL, '1M', 'OK', NULL, 10),
    ('CHK-11', 'PM-2026-001', 'ล็อกแมกกาซีน', 'กระบอกลม', 'ไม่ติดขัด', 1, 0, 0, 0, NULL, '1M', 'OK', NULL, 11),
    ('CHK-12', 'PM-2026-001', 'ลิฟท์ยกแมกกาซีน', 'แกนสไลด์', 'ไม่ติดขัด', 1, 1, 0, 0, 'LCG100', '1M', 'APPLIED', 'ทาจาระบี LCG100 ตามรอบเดือน', 12),
    ('CHK-13', 'PM-2026-001', 'ลิฟท์ยกแมกกาซีน', 'สายพาน ของมอเตอร์ลิฟท์', 'สภาพดี', 0, 0, 1, 0, NULL, '1M', 'OK', NULL, 13),
    ('CHK-14', 'PM-2026-001', 'ลิฟท์ยกแมกกาซีน', 'ตรวจสอบการเชื่อมต่อระบบกราวด์ของเครื่องจักร', 'สกรูยึดสายแน่น', 0, 0, 1, 0, NULL, '1M', 'OK', NULL, 14),
    ('CHK-15', 'PM-2026-001', 'แผงวงจร', 'ภาคควบคุม', 'สะอาด', 1, 0, 0, 0, NULL, '1M', 'OK', NULL, 15)
    ON DUPLICATE KEY UPDATE component_name=VALUES(component_name);
    ");
}

function generateDatabaseConfigFile(string $host, string $port, string $name, string $user, string $pass): string {
    return '<?php
declare(strict_types=1);

namespace FactoryCMMS\Config;

use PDO;
use PDOException;

class Database {
    private static ?PDO $connection = null;

    public static function getConnection(): PDO {
        if (self::$connection === null) {
            $host = getenv("DB_HOST") ?: "' . addslashes($host) . '";
            $port = getenv("DB_PORT") ?: "' . addslashes($port) . '";
            $dbName = getenv("DB_NAME") ?: "' . addslashes($name) . '";
            $username = getenv("DB_USER") ?: "' . addslashes($user) . '";
            $password = getenv("DB_PASSWORD") ?: "' . addslashes($pass) . '";

            $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$connection = new PDO($dsn, $username, $password, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database connection failed: " . $e->getMessage()]);
                exit;
            }
        }
        return self::$connection;
    }
}
';
}

// -----------------------------------------------------------------------------
// HTML RENDERERS (Installer UI & Dashboard)
// -----------------------------------------------------------------------------
function renderInstallerHtml($dbHost, $dbPort, $dbName, $dbUser, $dbPass, $adminUser, $adminPass, $adminEmail, $factoryName, $error, $success, $steps) {
    header('Content-Type: text/html; charset=utf-8');
    ?>
    <!DOCTYPE html>
    <html lang="th" class="h-full bg-slate-950 text-slate-100">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factory CMMS / EAM - Setup & Database Installer</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&family=Noto+Sans+Thai:wght@400;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <style>
            body { font-family: 'Plus Jakarta Sans', 'Noto Sans Thai', sans-serif; }
            .font-mono { font-family: 'JetBrains Mono', monospace; }
        </style>
    </head>
    <body class="min-h-full flex items-center justify-center p-4 sm:p-6 bg-[#0b0f19]">
        <div class="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <!-- Header -->
            <div class="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                    <span class="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                        AUTOMATED INSTALLER WIZARD
                    </span>
                    <h1 class="text-xl font-extrabold text-white mt-0.5">
                        ติดตั้งระบบ CMMS & ฐานข้อมูล MySQL สำหรับเว็บไซต์ใหม่
                    </h1>
                </div>
                <div class="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold font-mono">
                    PHP
                </div>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-6">
                <?php if ($error): ?>
                    <div class="p-4 bg-red-950/80 border border-red-700 rounded-xl text-red-200 text-xs">
                        <strong>ข้อผิดพลาด:</strong> <?= htmlspecialchars($error) ?>
                    </div>
                <?php endif; ?>

                <?php if ($success): ?>
                    <div class="p-5 bg-emerald-950/80 border border-emerald-600 rounded-xl text-emerald-200 text-xs space-y-3">
                        <div class="font-bold text-sm text-emerald-300 flex items-center gap-2">
                            <span>✓</span> <?= htmlspecialchars($success) ?>
                        </div>
                        <div class="space-y-1 font-mono text-[11px] text-emerald-400/90 bg-emerald-950/60 p-3 rounded-lg border border-emerald-800">
                            <?php foreach ($steps as $step): ?>
                                <div>• <?= htmlspecialchars($step) ?></div>
                            <?php endforeach; ?>
                        </div>
                        <div class="pt-2 flex items-center gap-3">
                            <a href="index.php" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors inline-block text-xs">
                                เข้าสู่ระบบ Factory CMMS →
                            </a>
                            <a href="api/machines" target="_blank" class="text-xs text-emerald-300 underline font-mono">
                                ทดสอบ REST API (/api/machines)
                            </a>
                        </div>
                    </div>
                <?php else: ?>
                    <form method="POST" action="index.php" class="space-y-5 text-xs">
                        <!-- Step 1: Database Settings -->
                        <div class="space-y-3">
                            <div class="flex items-center gap-2 font-bold text-slate-200 text-sm border-b border-slate-800 pb-1.5">
                                <span class="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-mono">1</span>
                                ตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div class="sm:col-span-2">
                                    <label class="block text-slate-400 mb-1 font-semibold">Database Host / Server</label>
                                    <input type="text" name="db_host" value="<?= htmlspecialchars($dbHost) ?>" required class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden">
                                </div>
                                <div>
                                    <label class="block text-slate-400 mb-1 font-semibold">Port</label>
                                    <input type="text" name="db_port" value="<?= htmlspecialchars($dbPort) ?>" required class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden">
                                </div>
                                <div class="sm:col-span-3">
                                    <label class="block text-slate-400 mb-1 font-semibold">ชื่อฐานข้อมูล (จะถูกสร้างอัตโนมัติหากยังไม่มี)</label>
                                    <input type="text" name="db_name" value="<?= htmlspecialchars($dbName) ?>" required class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden">
                                </div>
                                <div>
                                    <label class="block text-slate-400 mb-1 font-semibold">MySQL Username</label>
                                    <input type="text" name="db_user" value="<?= htmlspecialchars($dbUser) ?>" required class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden">
                                </div>
                                <div class="sm:col-span-2">
                                    <label class="block text-slate-400 mb-1 font-semibold">MySQL Password</label>
                                    <input type="password" name="db_pass" value="<?= htmlspecialchars($dbPass) ?>" placeholder="(เว้นว่างไว้หากใช้ XAMPP root ไม่มีรหัส)" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden">
                                </div>
                            </div>
                        </div>

                        <!-- Step 2: Factory & Admin Setup -->
                        <div class="space-y-3 pt-2">
                            <div class="flex items-center gap-2 font-bold text-slate-200 text-sm border-b border-slate-800 pb-1.5">
                                <span class="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-mono">2</span>
                                ตั้งค่าโรงงานและบัญชีผู้ดูแลระบบ (Admin)
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div class="sm:col-span-2">
                                    <label class="block text-slate-400 mb-1 font-semibold">ชื่อโรงงาน / สายงานผลิต</label>
                                    <input type="text" name="factory_name" value="<?= htmlspecialchars($factoryName) ?>" required class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:border-blue-500 focus:outline-hidden">
                                </div>
                                <div>
                                    <label class="block text-slate-400 mb-1 font-semibold">Admin Username</label>
                                    <input type="text" name="admin_user" value="<?= htmlspecialchars($adminUser) ?>" required class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden">
                                </div>
                                <div>
                                    <label class="block text-slate-400 mb-1 font-semibold">Admin Password</label>
                                    <input type="text" name="admin_pass" value="<?= htmlspecialchars($adminPass) ?>" required class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden">
                                </div>
                                <div class="sm:col-span-2">
                                    <label class="block text-slate-400 mb-1 font-semibold">Admin Email (สำหรับรับการแจ้งเตือนงาน PM)</label>
                                    <input type="email" name="admin_email" value="<?= htmlspecialchars($adminEmail) ?>" required class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden">
                                </div>
                            </div>
                        </div>

                        <!-- Highlights Box -->
                        <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                            <span class="font-bold text-slate-200 block font-sans">สิ่งที่จะถูกสร้างและติดตั้งอัตโนมัติ:</span>
                            <div>✓ สร้าง Database และตาราง InnoDB 6 ตาราง (UTF-8)</div>
                            <div>✓ ใส่ข้อมูลเครื่องจักรจริง SMT LOADER ESL-500 และตาราง Checklist 15 รายการ</div>
                            <div>✓ สร้างไฟล์ config/database.php พร้อมตัวเชื่อมต่อ PDO ป้องกัน SQL Injection</div>
                            <div>✓ สร้างไฟล์ installed.lock ล็อกตัวติดตั้งเพื่อความปลอดภัย</div>
                        </div>

                        <!-- Submit Button -->
                        <div class="pt-2">
                            <button type="submit" name="run_install" value="1" class="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer text-sm font-sans flex items-center justify-center gap-2">
                                ⚡ เริ่มต้นติดตั้งฐานข้อมูลและโปรเจกต์ทันที (Start Install)
                            </button>
                        </div>
                    </form>
                <?php endif; ?>
            </div>

            <!-- Footer -->
            <div class="p-4 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500 font-mono">
                Factory CMMS v1.0 · PHP 8.x + MySQL PDO · SMT LINE #2 Standard
            </div>
        </div>
    </body>
    </html>
    <?php
}

function renderInstalledDashboard() {
    header('Content-Type: text/html; charset=utf-8');
    ?>
    <!DOCTYPE html>
    <html lang="th" class="h-full bg-slate-950 text-slate-100">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factory CMMS - System Running</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; }
            .font-mono { font-family: 'JetBrains Mono', monospace; }
        </style>
    </head>
    <body class="min-h-full flex items-center justify-center p-6 bg-[#0b0f19]">
        <div class="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 text-center">
            <div class="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mx-auto flex items-center justify-center text-emerald-400 text-2xl font-bold">
                ✓
            </div>
            <div>
                <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    SYSTEM INSTALLED & RUNNING
                </span>
                <h1 class="text-2xl font-extrabold text-white mt-1">
                    Factory CMMS / EAM Backend Online
                </h1>
                <p class="text-xs text-slate-400 mt-2">
                    โปรเจกต์และฐานข้อมูล MySQL ติดตั้งเรียบร้อยพร้อมให้บริการ RESTful API
                </p>
            </div>

            <div class="grid grid-cols-2 gap-3 text-left font-mono text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                <a href="api/machines" target="_blank" class="p-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 block transition-colors">
                    <strong>GET /api/machines</strong>
                    <span class="text-[11px] text-slate-400 block font-sans">ดึงรายการเครื่องจักร</span>
                </a>
                <a href="api/kpis" target="_blank" class="p-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 block transition-colors">
                    <strong>GET /api/kpis</strong>
                    <span class="text-[11px] text-slate-400 block font-sans">Availability & MTBF</span>
                </a>
                <a href="api/pm-schedules" target="_blank" class="p-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 block transition-colors">
                    <strong>GET /api/pm-schedules</strong>
                    <span class="text-[11px] text-slate-400 block font-sans">แผนงานบำรุงรักษา</span>
                </a>
                <a href="api/maintenance-logs" target="_blank" class="p-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-400 block transition-colors">
                    <strong>GET /api/maintenance-logs</strong>
                    <span class="text-[11px] text-slate-400 block font-sans">ประวัติการซ่อมบำรุง</span>
                </a>
            </div>

            <div class="pt-2 flex justify-center gap-3">
                <a href="index.php?action=install" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 transition-colors">
                    ⚙ รันตัวติดตั้งใหม่อีกครั้ง (Re-install Wizard)
                </a>
            </div>
        </div>
    </body>
    </html>
    <?php
}
