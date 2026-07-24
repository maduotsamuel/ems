<?php
/**
 * WorkforcePro - Application Bootstrap
 * Central entry point for all requests
 */

// ============================================
// Set Error Reporting
// ============================================
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

// ============================================
// Define Base Paths
// ============================================
define('BASE_PATH', realpath(__DIR__ . '/..'));
define('PUBLIC_PATH', __DIR__);
define('SRC_PATH', BASE_PATH . '/src');
define('CONFIG_PATH', SRC_PATH . '/config');
define('VIEWS_PATH', BASE_PATH . '/views');

// ============================================
// Load Environment Configuration
// ============================================
require_once CONFIG_PATH . '/Config.php';

// ============================================
// Load Core Classes
// ============================================
require_once CONFIG_PATH . '/Database.php';
require_once SRC_PATH . '/middleware/CORS.php';
require_once SRC_PATH . '/middleware/Auth.php';
require_once SRC_PATH . '/Router.php';

// ============================================
// Enable CORS & Session
// ============================================
CORS::handle();
session_name('workforcepro_session');
session_set_cookie_params([
	'lifetime' => 0,
	'path' => '/',
	'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
	'httponly' => true,
	'samesite' => 'Strict',
]);
session_start();

// ============================================
// Initialize Database
// ============================================
$db = Database::getInstance();

// ============================================
// Route the Request
// ============================================
$router = new Router();
$router->dispatch();
?>
