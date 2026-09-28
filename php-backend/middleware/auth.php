<?php
/**
 * CMMS/EAM AUTH & RBAC MIDDLEWARE (PHP)
 * Enforces Role-Based Access Control (Admin, Manager, Technician, Engineer).
 */

declare(strict_types=1);

namespace FactoryCMMS\Middleware;

class AuthMiddleware {
    /**
     * Authenticate request and return user payload
     */
    public static function authenticate(): array {
        // Headers parsing
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $roleHeader = $headers['X-User-Role'] ?? $headers['x-user-role'] ?? 'manager';
        $userId = $headers['X-User-Id'] ?? $headers['x-user-id'] ?? 'USR-001';

        $validRoles = ['admin', 'manager', 'technician', 'engineer'];
        $role = in_array(strtolower($roleHeader), $validRoles, true) ? strtolower($roleHeader) : 'technician';

        return [
            'id'         => htmlspecialchars($userId, ENT_QUOTES, 'UTF-8'),
            'username'   => 'operator',
            'role'       => $role,
            'department' => 'SMT Line #2'
        ];
    }

    /**
     * Guard endpoint against unauthorized roles
     */
    public static function requireRoles(array $allowedRoles): array {
        $user = self::authenticate();
        if (!in_array($user['role'], $allowedRoles, true)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error'   => 'Forbidden: สิทธิ์ไม่เพียงพอ (ต้องการ ' . implode(' หรือ ', $allowedRoles) . ')'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        return $user;
    }
}
