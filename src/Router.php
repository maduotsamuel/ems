<?php
/**
 * Request Router
 * Handles URL routing and request dispatching
 */
class Router {
    private $routes = [];
    private $method;
    private $path;
    private $params = [];

    public function __construct() {
        $this->method = $_SERVER['REQUEST_METHOD'];
        $this->path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $this->path = str_replace('/emm', '', $this->path);
        $this->path = trim($this->path, '/');
        $this->registerRoutes();
    }

    private function registerRoutes() {
        // Auth routes
        $this->post('api/auth/login', 'AuthController@login');
        $this->post('api/auth/logout', 'AuthController@logout');
        $this->get('api/auth/me', 'AuthController@me');
        $this->post('api/auth/change-password', 'AuthController@changePassword');
        $this->post('api/auth/reset-password', 'AuthController@resetPassword');

        // Employee routes
        $this->get('api/employees', 'EmployeeController@index');
        $this->get('api/employees/:id', 'EmployeeController@show');
        $this->post('api/employees', 'EmployeeController@store');
        $this->put('api/employees/:id', 'EmployeeController@update');
        $this->delete('api/employees/:id', 'EmployeeController@destroy');

        // Attendance routes
        $this->get('api/attendance', 'AttendanceController@index');
        $this->post('api/attendance', 'AttendanceController@store');
        $this->put('api/attendance/:id', 'AttendanceController@update');

        // Leave routes
        $this->get('api/leaves', 'LeaveController@index');
        $this->post('api/leaves', 'LeaveController@store');
        $this->put('api/leaves/:id', 'LeaveController@update');

        // Payroll routes
        $this->get('api/payroll', 'PayrollController@index');
        $this->post('api/payroll/process', 'PayrollController@process');

        // Department routes
        $this->get('api/departments', 'DepartmentController@index');
        $this->post('api/departments', 'DepartmentController@store');

        // Performance routes
        $this->get('api/performance', 'PerformanceController@index');
        $this->post('api/performance', 'PerformanceController@store');

        // Frontend routes
        $this->get('', 'PageController@index');
        $this->get('index', 'PageController@index');
    }

    public function get($path, $handler) {
        $this->routes['GET'][$path] = $handler;
    }

    public function post($path, $handler) {
        $this->routes['POST'][$path] = $handler;
    }

    public function put($path, $handler) {
        $this->routes['PUT'][$path] = $handler;
    }

    public function delete($path, $handler) {
        $this->routes['DELETE'][$path] = $handler;
    }

    public function dispatch() {
        $handler = $this->matchRoute();

        if (!$handler) {
            return $this->notFound();
        }

        [$controller, $method] = explode('@', $handler);
        $this->callController($controller, $method);
    }

    private function matchRoute() {
        $routes = $this->routes[$this->method] ?? [];

        foreach ($routes as $pattern => $handler) {
            if ($this->matchPattern($pattern)) {
                return $handler;
            }
        }

        return null;
    }

    private function matchPattern($pattern) {
        $pattern = str_replace(':id', '(\d+)', $pattern);
        $pattern = '#^' . $pattern . '$#';

        if (preg_match($pattern, $this->path, $matches)) {
            array_shift($matches);
            $this->params = $matches;
            return true;
        }

        return false;
    }

    private function callController($controllerName, $method) {
        $controllerClass = ucfirst($controllerName);
        $controllerFile = SRC_PATH . '/controllers/' . $controllerClass . '.php';

        if (!file_exists($controllerFile)) {
            return $this->notFound();
        }

        require_once $controllerFile;

        if (!class_exists($controllerClass)) {
            return $this->notFound();
        }

        $controller = new $controllerClass();

        if (!method_exists($controller, $method)) {
            return $this->notFound();
        }

        call_user_func_array([$controller, $method], $this->params);
    }

    private function notFound() {
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
        exit();
    }

    public function getParam($index) {
        return $this->params[$index] ?? null;
    }
}
?>
