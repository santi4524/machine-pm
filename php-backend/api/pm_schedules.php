<?php
/**
 * CMMS/EAM REST API: /api/pm_schedules.php
 * List & Create PM Schedules with Frequency and Date Validation
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

use FactoryCMMS\Config\Database;
use FactoryCMMS\Middleware\AuthMiddleware;

header('Content-Type: application/json; charset=utf-8');

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT s.*, m.name as machine_name, m.code as machine_code, m.line_operation, u.full_name as technician_name
                         FROM pm_schedules s
                         JOIN machines m ON s.machine_id = m.id
                         LEFT JOIN users u ON s.assigned_technician_id = u.id
                         ORDER BY s.next_due_date ASC");
    $schedules = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'count'   => count($schedules),
        'data'    => $schedules
    ], JSON_UNESCAPED_UNICODE);
} else if ($method === 'POST') {
    $user = AuthMiddleware::authenticate();
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?? [];

    $machineId = $data['machine_id'] ?? $data['machineId'] ?? null;
    $planName = trim($data['plan_name'] ?? $data['planName'] ?? '');
    $frequency = $data['frequency'] ?? 'monthly';
    $nextDueDate = $data['next_due_date'] ?? $data['nextDueDate'] ?? null;
    $assignedTechId = $data['assigned_technician_id'] ?? $data['assignedTechnicianId'] ?? $user['id'];

    $errors = [];
    if (!$machineId) $errors[] = 'กรุณาระบุ machine_id';
    if (empty($planName)) $errors[] = 'กรุณาระบุ plan_name';

    // Strict Date Validation: Cannot retro-date PM
    $today = date('Y-m-d');
    if (!$nextDueDate || $nextDueDate < $today) {
        $errors[] = 'ไม่อนุญาตให้กำหนดวันทำ PM ย้อนหลัง (ต้องเป็นวันที่ปัจจุบันหรืออนาคต)';
    }

    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'errors' => $errors], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = 'PM-' . date('Y') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));

    $sql = "INSERT INTO pm_schedules (id, machine_id, plan_name, frequency, next_due_date, status, assigned_technician_id)
            VALUES (:id, :machine_id, :plan_name, :frequency, :next_due, 'scheduled', :assigned_id)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'          => $id,
        ':machine_id'  => $machineId,
        ':plan_name'   => $planName,
        ':frequency'   => $frequency,
        ':next_due'    => $nextDueDate,
        ':assigned_id' => $assignedTechId
    ]);

    http_response_code(201);
    echo json_encode([
        'success'     => true,
        'message'     => 'สร้างแผนงาน PM สำเร็จ',
        'schedule_id' => $id
    ], JSON_UNESCAPED_UNICODE);
}
