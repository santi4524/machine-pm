<?php
/**
 * CMMS/EAM REST API: /api/machines.php
 * CRUD operations for Machines with PDO Prepared Statements
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

use FactoryCMMS\Config\Database;
use FactoryCMMS\Middleware\AuthMiddleware;

header('Content-Type: application/json; charset=utf-8');

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Route by HTTP Method
switch ($method) {
    case 'GET':
        handleGetMachines($pdo);
        break;

    case 'POST':
        // Only Admin and Manager can create machines
        $user = AuthMiddleware::requireRoles(['admin', 'manager']);
        handleCreateMachine($pdo);
        break;

    case 'PUT':
    case 'PATCH':
        $user = AuthMiddleware::authenticate();
        handleUpdateMachine($pdo);
        break;

    case 'DELETE':
        $user = AuthMiddleware::requireRoles(['admin', 'manager']);
        handleDeleteMachine($pdo);
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
        break;
}

/**
 * GET /api/machines
 * Supports ?status=active&line=SMT
 */
function handleGetMachines(PDO $pdo): void {
    $status = $_GET['status'] ?? null;
    $department = $_GET['department'] ?? null;
    $search = $_GET['search'] ?? null;

    $sql = "SELECT * FROM machines WHERE 1=1";
    $params = [];

    if ($status && in_array($status, ['active', 'maintenance', 'breakdown'], true)) {
        $sql .= " AND status = :status";
        $params[':status'] = $status;
    }

    if ($department) {
        $sql .= " AND department = :department";
        $params[':department'] = $department;
    }

    if ($search) {
        $sql .= " AND (name LIKE :search OR code LIKE :search OR model LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }

    $sql .= " ORDER BY code ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $machines = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'count'   => count($machines),
        'data'    => $machines
    ], JSON_UNESCAPED_UNICODE);
}

/**
 * POST /api/machines
 * Creates a new machine with strict validation
 */
function handleCreateMachine(PDO $pdo): void {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?? [];

    $errors = [];
    $code = trim($data['code'] ?? '');
    $name = trim($data['name'] ?? '');
    $model = trim($data['model'] ?? '');
    $serialNumber = trim($data['serial_number'] ?? $data['serialNumber'] ?? '');
    $lineOperation = trim($data['line_operation'] ?? $data['lineOperation'] ?? 'SMT LINE # 2');
    $department = trim($data['department'] ?? 'SMT Manufacturing');
    $status = $data['status'] ?? 'active';
    $criticalLevel = $data['critical_level'] ?? $data['criticalLevel'] ?? 'high';
    $installDate = $data['install_date'] ?? $data['installDate'] ?? date('Y-m-d');
    $location = trim($data['location'] ?? 'Building B, Floor 2');
    $nextPmDate = $data['next_pm_date'] ?? $data['nextPmDate'] ?? date('Y-m-d', strtotime('+30 days'));
    $powerKw = floatval($data['power_rating_kw'] ?? $data['powerRatingKw'] ?? 0);
    $specNotes = trim($data['spec_notes'] ?? $data['specNotes'] ?? '');

    if (empty($code)) $errors[] = 'กรุณาระบุรหัสเครื่องจักร (code)';
    if (empty($name)) $errors[] = 'กรุณาระบุชื่อเครื่องจักร (name)';
    if ($powerKw < 0) $errors[] = 'พิกัดกำลังไฟฟ้า (kW) ต้องไม่ติดลบ';

    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'errors' => $errors], JSON_UNESCAPED_UNICODE);
        return;
    }

    // Check duplicate code
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM machines WHERE code = :code");
    $checkStmt->execute([':code' => $code]);
    if ($checkStmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => "รหัสเครื่องจักร {$code} มีอยู่ในระบบแล้ว"], JSON_UNESCAPED_UNICODE);
        return;
    }

    $id = $code; // Or UUID
    $sql = "INSERT INTO machines (
        id, code, name, model, serial_number, line_operation, department,
        status, critical_level, install_date, location, next_pm_date, power_rating_kw, spec_notes
    ) VALUES (
        :id, :code, :name, :model, :serial_number, :line_operation, :department,
        :status, :critical_level, :install_date, :location, :next_pm_date, :power_kw, :spec_notes
    )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'             => $id,
        ':code'           => $code,
        ':name'           => $name,
        ':model'          => $model,
        ':serial_number'  => $serialNumber,
        ':line_operation' => $lineOperation,
        ':department'     => $department,
        ':status'         => $status,
        ':critical_level' => $criticalLevel,
        ':install_date'   => $installDate,
        ':location'       => $location,
        ':next_pm_date'   => $nextPmDate,
        ':power_kw'       => $powerKw,
        ':spec_notes'     => $specNotes
    ]);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'บันทึกเครื่องจักรใหม่เรียบร้อย',
        'machine_id' => $id
    ], JSON_UNESCAPED_UNICODE);
}

/**
 * PUT/PATCH /api/machines
 */
function handleUpdateMachine(PDO $pdo): void {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?? [];
    $id = $data['id'] ?? $_GET['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing machine id']);
        return;
    }

    $status = $data['status'] ?? null;
    $breakdownReason = $data['breakdown_reason'] ?? $data['breakdownReason'] ?? null;

    if ($status === 'breakdown') {
        $sql = "UPDATE machines SET status = 'breakdown', breakdown_reason = :reason, breakdown_since = NOW() WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':reason' => $breakdownReason, ':id' => $id]);
    } else if ($status) {
        $sql = "UPDATE machines SET status = :status WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':status' => $status, ':id' => $id]);
    }

    echo json_encode(['success' => true, 'message' => "อัปเดตเครื่องจักร {$id} เรียบร้อย"], JSON_UNESCAPED_UNICODE);
}

/**
 * DELETE /api/machines
 */
function handleDeleteMachine(PDO $pdo): void {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing machine id']);
        return;
    }

    $stmt = $pdo->prepare("DELETE FROM machines WHERE id = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode(['success' => true, 'message' => "ลบเครื่องจักร {$id} สำเร็จ"], JSON_UNESCAPED_UNICODE);
}
