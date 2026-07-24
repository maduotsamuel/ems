<?php
/**
 * Authentication Middleware
 * Handles user authentication and authorization
 */
class Auth {
    private const CSRF_SESSION_KEY = 'csrf_token';

    public static function check() {
        return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
    }

    public static function user() {
        if (!self::check()) {
            return null;
        }
        return $_SESSION['user'] ?? null;
    }

    public static function id() {
        return $_SESSION['user_id'] ?? null;
    }

    public static function role() {
        return $_SESSION['role'] ?? null;
    }

    public static function login($user) {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['employee_id'] = $user['employee_id'];
        $_SESSION['user'] = $user;
        self::ensureCsrfToken();
    }

    public static function logout() {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
    }

    public static function ensureCsrfToken() {
        if (empty($_SESSION[self::CSRF_SESSION_KEY])) {
            $_SESSION[self::CSRF_SESSION_KEY] = bin2hex(random_bytes(32));
        }

        return $_SESSION[self::CSRF_SESSION_KEY];
    }

    public static function csrfToken() {
        return self::ensureCsrfToken();
    }

    public static function requireCsrfToken() {
        $sessionToken = $_SESSION[self::CSRF_SESSION_KEY] ?? null;
        $requestToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

        if (!$sessionToken || !is_string($requestToken) || !hash_equals($sessionToken, $requestToken)) {
            http_response_code(419);
            echo json_encode(['success' => false, 'error' => 'Invalid CSRF token']);
            exit();
        }
    }

    public static function requireAuth() {
        if (!self::check()) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit();
        }
    }

    public static function requireRole($roles) {
        self::requireAuth();

        if (!is_array($roles)) {
            $roles = [$roles];
        }

        if (!in_array(self::role(), $roles)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit();
        }
    }

    public static function can($permission) {
        $role = self::role();
        
        $permissions = [
            'hr' => ['view_employees', 'manage_employees', 'manage_payroll', 'approve_leaves', 'manage_attendance'],
            'director' => ['view_employees', 'view_attendance', 'view_performance', 'approve_leaves'],
            'employee' => ['view_profile', 'request_leave', 'view_attendance'],
        ];

        return isset($permissions[$role]) && in_array($permission, $permissions[$role]);
    }
}
?>
