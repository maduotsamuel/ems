<?php
/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing
 */
class CORS {
    public static function handle() {
        $origin = self::getAllowedOrigin();

        if (isset($_SERVER['HTTP_ORIGIN']) && $origin === null) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Origin not allowed']);
            exit();
        }

        if ($origin !== null) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
            header('Access-Control-Allow-Credentials: true');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
        header('Access-Control-Max-Age: 3600');
        header('Content-Type: application/json');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }

    private static function getAllowedOrigin() {
        $appUrl = Config::get('APP_URL', 'http://localhost/emm');
        $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
        $appOrigin = self::normalizeOrigin($appUrl);

        $allowedOrigins = [
            'http://localhost/emm',
            'http://localhost',
            'http://127.0.0.1/emm',
            'http://127.0.0.1',
        ];

        if ($appOrigin) {
            $allowedOrigins[] = $appOrigin;
        }

        $allowedOrigins = array_values(array_unique(array_filter(array_map([self::class, 'normalizeOrigin'], $allowedOrigins))));

        if ($origin === null) {
            return null;
        }

        $normalizedOrigin = self::normalizeOrigin($origin);

        return in_array($normalizedOrigin, $allowedOrigins, true) ? $normalizedOrigin : null;
    }

    private static function normalizeOrigin($url) {
        $parts = parse_url($url);
        if (!$parts || empty($parts['scheme']) || empty($parts['host'])) {
            return null;
        }

        $origin = $parts['scheme'] . '://' . $parts['host'];
        if (!empty($parts['port'])) {
            $origin .= ':' . $parts['port'];
        }

        return $origin;
    }
}
?>
