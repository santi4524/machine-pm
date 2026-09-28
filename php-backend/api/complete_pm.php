<?php
/**
 * CMMS/EAM REST API: /api/complete_pm.php
 * Handles closing a PM Task, saving Checklist & Spare parts, and restoring Machine status.
 * Executes inside an Atomic Database Transaction (START TRANSACTION / COMMIT).
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

use FactoryCMMS\Config\Database;
use FactoryCMMS\Middleware\AuthMiddleware;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$user = AuthMiddleware::authenticate();
$pdo = Database::getConnection();

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true) ?? [];

$scheduleId = $payload['schedule_id'] ?? $payload['scheduleId'] ?? null;
if (!$scheduleId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'กรุณาระบุ schedule_id'], JSON_UNESCAPED_UNICODE);
    exit;
}

$laborHours = max(0, floatval($payload['labor_hours'] ?? $payload['laborHours'] ?? 2.0));
$costSpareParts = max(0, floatval($payload['cost_spare_parts'] ?? $payload['costSpareParts'] ?? 0));
$costLabor = max(0, floatval($payload['cost_labor'] ?? $payload['costLabor'] ?? 0));
$completionNotes = trim($payload['completion_notes'] ?? $payload['completionNotes'] ?? 'ตรวจเช็กตามมาตรฐานโรงงานเรียบร้อย');
$verifiedByName = trim($payload['verified_by_name'] ?? $payload['verifiedByName'] ?? $user['id']);
$approvedByName = trim($payload['approved_by_name'] ?? $payload['approvedByName'] ?? 'Manager');
$checklist = $payload['updated_checklist'] ?? $payload['updatedChecklist'] ?? [];
$spareParts = $payload['spare_parts_used'] ?? $payload['sparePartsUsed'] ?? [];

// -----------------------------------------------------------------------------
// ATOMIC TRANSACTION: Start
// -----------------------------------------------------------------------------
try {
    $pdo->beginTransaction();

    // 1. Fetch current schedule and machine info
    $schedStmt = $pdo->prepare("SELECT * FROM pm_schedules WHERE id = :id FOR UPDATE");
    $schedStmt->execute([':id' => $scheduleId]);
    $schedule = $schedStmt->fetch();

    if (!$schedule) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'ไม่พบแผนงาน PM นี้ในระบบ'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $machineId = $schedule['machine_id'];

    // 2. Update PM Schedule Status to 'completed'
    $updateSchedSql = "UPDATE pm_schedules SET
        status = 'completed',
        last_performed_date = CURRENT_DATE,
        completion_notes = :notes,
        completed_at = NOW()
        WHERE id = :id";
    $updateSchedStmt = $pdo->prepare($updateSchedSql);
    $updateSchedStmt->execute([
        ':notes' => $completionNotes,
        ':id'    => $scheduleId
    ]);

    // 3. Update Checklist items results
    if (!empty($checklist)) {
        $updateChkSql = "UPDATE pm_checklist_items SET
            result = :result,
            remark = :remark,
            checked_at = NOW()
            WHERE id = :id AND pm_schedule_id = :sched_id";
        $updateChkStmt = $pdo->prepare($updateChkSql);

        foreach ($checklist as $item) {
            $itemId = $item['id'] ?? null;
            $res = $item['result'] ?? 'OK';
            $remark = $item['remark'] ?? null;
            if ($itemId) {
                $updateChkStmt->execute([
                    ':result'   => $res,
                    ':remark'   => $remark,
                    ':id'       => $itemId,
                    ':sched_id' => $scheduleId
                ]);
            }
        }
    }

    // 4. Create Work Order in maintenance_logs
    $logId = 'WO-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
    $logSql = "INSERT INTO maintenance_logs (
        id, machine_id, pm_schedule_id, log_type, title,
        issue_description, action_taken, technician_id,
        labor_hours, cost_spare_parts, cost_labor, status, performed_date
    ) VALUES (
        :id, :machine_id, :pm_id, 'preventive', :title,
        :desc, :action, :tech_id,
        :labor_hours, :cost_parts, :cost_labor, 'completed', CURRENT_DATE
    )";

    $logStmt = $pdo->prepare($logSql);
    $logStmt->execute([
        ':id'          => $logId,
        ':machine_id'  => $machineId,
        ':pm_id'       => $scheduleId,
        ':title'       => 'ปิดใบงาน PM: ' . $schedule['plan_name'],
        ':desc'        => 'การตรวจเช็กและบำรุงรักษาเชิงป้องกันตามแบบฟอร์มโรงงาน (' . $schedule['frequency'] . ')',
        ':action'      => $completionNotes,
        ':tech_id'     => $user['id'],
        ':labor_hours' => $laborHours,
        ':cost_parts'  => $costSpareParts,
        ':cost_labor'  => $costLabor
    ]);

    // 5. Insert Spare Parts used
    if (!empty($spareParts)) {
        $partSql = "INSERT INTO maintenance_spare_parts (maintenance_log_id, part_no, part_name, quantity, unit_cost)
                    VALUES (:log_id, :part_no, :part_name, :quantity, :unit_cost)";
        $partStmt = $pdo->prepare($partSql);

        foreach ($spareParts as $part) {
            $partName = trim($part['part_name'] ?? $part['partName'] ?? '');
            if (!empty($partName)) {
                $partStmt->execute([
                    ':log_id'    => $logId,
                    ':part_no'   => $part['part_no'] ?? $part['partNo'] ?? 'N/A',
                    ':part_name' => $partName,
                    ':quantity'  => max(1, floatval($part['quantity'] ?? 1)),
                    ':unit_cost' => max(0, floatval($part['unit_cost'] ?? $part['unitCost'] ?? 0))
                ]);
            }
        }
    }

    // 6. Update Machine: bring to active, bump next PM date
    $freq = $schedule['frequency'];
    $days = 30;
    if ($freq === 'daily') $days = 1;
    else if ($freq === 'weekly') $days = 7;
    else if ($freq === 'quarterly') $days = 90;
    else if ($freq === 'yearly') $days = 365;

    $nextPmDate = date('Y-m-d', strtotime("+{$days} days"));

    $updateMachineSql = "UPDATE machines SET
        status = IF(status = 'maintenance', 'active', status),
        last_pm_date = CURRENT_DATE,
        next_pm_date = :next_pm,
        running_hours = running_hours + 24
        WHERE id = :machine_id";

    $updateMachineStmt = $pdo->prepare($updateMachineSql);
    $updateMachineStmt->execute([
        ':next_pm'    => $nextPmDate,
        ':machine_id' => $machineId
    ]);

    // Commit Transaction
    $pdo->commit();

    echo json_encode([
        'success'         => true,
        'message'         => "ปิดงาน PM และบันทึกประวัติการซ่อมบำรุงเรียบร้อย",
        'work_order_id'   => $logId,
        'machine_id'      => $machineId,
        'next_pm_due'     => $nextPmDate
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Transaction failed: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
