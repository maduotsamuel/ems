<?php
/**
 * Database Connection Manager
 * Singleton pattern for database connections
 */
class Database {
    private static $instance = null;
    private $conn;
    private $host;
    private $db_name;
    private $user;
    private $password;
    private $port;

    private function __construct() {
        $this->host = Config::get('DB_HOST', 'localhost');
        $this->port = Config::get('DB_PORT', '3306');
        $this->db_name = Config::get('DB_DATABASE', 'workforcepro');
        $this->user = Config::get('DB_USERNAME', 'root');
        $this->password = Config::get('DB_PASSWORD', '');

        $this->connect();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function connect() {
        try {
            $this->conn = new mysqli(
                $this->host,
                $this->user,
                $this->password,
                $this->db_name,
                (int)$this->port
            );

            if ($this->conn->connect_error) {
                throw new Exception('Database Connection Error: ' . $this->conn->connect_error);
            }

            $this->conn->set_charset("utf8mb4");
        } catch (Exception $e) {
            $this->logError($e->getMessage());
            $this->sendError('Database connection failed', 500);
        }
    }

    public function getConnection() {
        return $this->conn;
    }

    public function query($sql) {
        $result = $this->conn->query($sql);
        if (!$result && Config::isDebug()) {
            $this->logError($this->conn->error);
        }
        return $result;
    }

    public function prepare($sql) {
        return $this->conn->prepare($sql);
    }

    public function lastInsertId() {
        return $this->conn->insert_id;
    }

    public function affectedRows() {
        return $this->conn->affected_rows;
    }

    public function escape($string) {
        return $this->conn->real_escape_string($string);
    }

    public function close() {
        if ($this->conn) {
            $this->conn->close();
        }
    }

    private function logError($message) {
        $logFile = BASE_PATH . '/logs/database.log';
        error_log('[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL, 3, $logFile);
    }

    private function sendError($message, $code) {
        header('Content-Type: application/json');
        http_response_code($code);
        echo json_encode(['error' => $message]);
        exit();
    }

    public function __destruct() {
        $this->close();
    }
}

// Prevent cloning
if (class_exists('Database')) {
    Database::getInstance();
}
?>
