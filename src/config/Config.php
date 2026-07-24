<?php
/**
 * Configuration Manager
 * Loads environment variables and application configuration
 */
class Config {
    private static $config = [];
    private static $instance = null;

    public static function load() {
        if (!empty(self::$config)) {
            return;
        }

        // Load .env file
        $envFile = BASE_PATH . '/.env';
        if (!file_exists($envFile)) {
            $envFile = BASE_PATH . '/.env.example';
        }

        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '#') === 0 || strpos($line, '=') === false) {
                    continue;
                }
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                self::$config[$key] = $value;
            }
        }

        // Merge with $_ENV for flexibility
        self::$config = array_merge($_ENV, self::$config);
    }

    public static function get($key, $default = null) {
        self::load();
        return self::$config[$key] ?? $default;
    }

    public static function all() {
        self::load();
        return self::$config;
    }

    public static function set($key, $value) {
        self::load();
        self::$config[$key] = $value;
    }

    public static function isProduction() {
        return self::get('APP_ENV') === 'production';
    }

    public static function isDebug() {
        return self::get('APP_DEBUG') === 'true';
    }
}

// Initialize config immediately
Config::load();
?>
