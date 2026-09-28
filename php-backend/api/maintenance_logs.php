<?php
/**
 * CMMS/EAM REST API: /api/maintenance_logs.php
 * Handles logging of Preventive, Corrective, and Breakdown Repairs.
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
    $stmt = $pdo->query("SELECT l.*, m.name as machine_name, m.code as machine_code, u.full_name as technician_name
                         FROM maintenance_logs l
                         JOIN machines m ON l.machine_id = m.id
                         LEFT JOIN users u ON l.technician_id = u.id
                         ORDER BY l.performed_date DESC, l.created_at DESC");
    $logs = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'count'   => count($logs),
        'data'    => $logs
    ], JSON_UNESCAPED_UNICODE);
} else if ($method === 'POST') {
    $user = AuthMiddleware::authenticate();
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?? [];

    $machineId = $data['machine_id'] ?? $data['machineId'] ?? null;
    $logType = $data['log_type'] ?? $data['logType'] ?? 'corrective';
    $title = trim($data['title'] ?? '');
    $issueDescription = trim($data['issue_description'] ?? $data['issueDescription'] ?? $title);
    $actionTaken = trim($data['action_taken'] ?? $data['actionTaken'] ?? 'ดำเนินการซ่อมบำรุงตามมาตรฐาน');
    $rootCause = trim($data['root_cause'] ?? $data['rootCause'] ?? '');
    $laborHours = floatval($data['labor_hours'] ?? $data['laborHours'] ?? 1.0);
    $costSpareParts = floatval($data['cost_spare_parts'] ?? $data['costSpareParts'] ?? 0);
    $costLabor = floatval($data['cost_labor'] ?? $data['costLabor'] ?? 0);
    $performedDate = $data['performed_date'] ?? $data['performedDate'] ?? date('Y-m-d');
    $status = $data['status'] ?? 'completed';

    // Validation
    $errors = [];
    if (!$machineId) $errors[] = 'กรุณาระบุ machine_id';
    if (empty($title)) $errors[] = 'กรุณาระบุหัวข้องานซ่อม (title)';
    if ($laborHours < 0) $errors[] = 'ชั่วโมงแรงงานต้องไม่เป็นค่าติดลบ';
    if ($costSpareParts < 0 || $costLabor < 0) $errors[] = 'ค่าใช้จ่ายต้องไม่เป็นค่าติดลบ';

    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'errors' => $errors], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = 'WO-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));

    $sql = "INSERT INTO maintenance_logs (
        id, machine_id, log_type, title, issue_description,
        action_taken, root_cause, technician_id, labor_hours,
        cost_spare_parts, cost_labor, status, performed_date
    ) VALUES (
        :id, :machine_id, :log_type, :title, :issue_desc,
        :action_taken, :root_cause, :tech_id, :labor_hours,
        :cost_parts, :cost_labor, :status, :performed_date
    )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'             => $id,
        ':machine_id'     => $machineId,
        ':log_type'       => $logType,
        ':title'          => $title,
        ':issue_desc'     => $issueDescription,
        ':action_taken'   => $actionTaken,
        ':root_cause'     => $rootCause ?: null,
        ':tech_id'        => $user['id'],
        ':labor_hours'    => $laborHours,
        ':cost_parts'     => $costSpareParts,
        ':cost_labor'     => $costLabor,
        ':status'         => $status,
        ':performed_date' => $performedDate
    ]);

    // If breakdown, update machine status
    if ($logType === 'breakdown' && $status !== 'completed') {
        $upd = $pdo->prepare("UPDATE machines SET status = 'breakdown', breakdown_reason = :reason, breakdown_since = NOW() WHERE id = :id");
        $upd->execute([':reason' => $issueDescription, ':id' => $machineId]);
    } else if ($status === 'completed') {
        $upd = $pdo->prepare("UPDATE machines SET status = 'active', breakdown_reason = NULL WHERE id = :id AND status = 'breakdown'");
        $upd->execute([':id' => $machineId]);
    }

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'บันทึกใบงานซ่อมบำรุงเรียบร้อย',
        'log_id'  => $id
    ], JSON_UNESCAPED_UNICODE);
}
