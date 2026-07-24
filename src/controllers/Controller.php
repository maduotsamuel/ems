<?php
/**
 * Base Controller
 * All controllers inherit from this class
 */
abstract class Controller {
    protected $db;
    protected $input = [];

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->input = $this->getInput();

        if ($this->requiresCsrfProtection()) {
            Auth::requireCsrfToken();
        }
    }

    protected function requiresCsrfProtection() {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return false;
        }

        $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '';
        return !preg_match('#/api/auth/login$#', $path);
    }

    protected function getInput() {
        $input = [];
        
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $input = $_GET;
        } else {
            $raw = file_get_contents('php://input');
            $input = json_decode($raw, true) ?? [];
            
            // Fallback to $_POST for form-encoded data
            if (empty($input) && !empty($_POST)) {
                $input = $_POST;
            }
        }
        
        return $input;
    }

    protected function success($data, $message = null, $code = 200) {
        http_response_code($code);
        $response = ['success' => true, 'data' => $data];
        if ($message) {
            $response['message'] = $message;
        }
        echo json_encode($response);
        exit();
    }

    protected function error($message, $code = 400, $errors = null) {
        http_response_code($code);
        $response = ['success' => false, 'error' => $message];
        if ($errors) {
            $response['errors'] = $errors;
        }
        echo json_encode($response);
        exit();
    }

    protected function validate($data, $rules) {
        $errors = [];

        foreach ($rules as $field => $rule) {
            $value = $data[$field] ?? null;
            $ruleParts = explode('|', $rule);

            foreach ($ruleParts as $r) {
                $r = trim($r);
                
                if ($r === 'required' && empty($value)) {
                    $errors[$field] = ucfirst($field) . ' is required';
                }
                
                if (strpos($r, 'email') !== false && !empty($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $errors[$field] = ucfirst($field) . ' must be a valid email';
                }
                
                if (strpos($r, 'min:') === 0 && strlen($value) < (int)substr($r, 4)) {
                    $errors[$field] = ucfirst($field) . ' must be at least ' . substr($r, 4) . ' characters';
                }
                
                if (strpos($r, 'max:') === 0 && strlen($value) > (int)substr($r, 4)) {
                    $errors[$field] = ucfirst($field) . ' must not exceed ' . substr($r, 4) . ' characters';
                }
            }
        }

        return $errors;
    }

    protected function notFound() {
        $this->error('Resource not found', 404);
    }

    protected function unauthorized() {
        $this->error('Unauthorized', 401);
    }

    protected function forbidden() {
        $this->error('Forbidden', 403);
    }
}
?>
