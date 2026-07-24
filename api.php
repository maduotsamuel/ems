<?php
// api.php - Legacy insecure endpoint intentionally disabled.

header('Content-Type: application/json');
http_response_code(410);
echo json_encode([
    'success' => false,
    'error' => 'Legacy API endpoint disabled. Use /emm/api/* through public/index.php.'
]);
exit();

// ============================================
// DATABASE CONFIGURATION
// ============================================
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'workforcepro');
define('DEFAULT_PASSWORD', 'Welcome@123');

// Create connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
}

$conn->set_charset("utf8");

// ============================================
// API ROUTING
// ============================================
$request_method = $_SERVER['REQUEST_METHOD'];
$request_uri = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));
$resource = $request_uri[0] ?? '';
$action = $request_uri[1] ?? '';
$id = $request_uri[2] ?? '';

// Parse JSON body
$input = json_decode(file_get_contents('php://input'), true);

// Response wrapper
function response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

// ============================================
// AUTHENTICATION
// ============================================
function authenticate_user($email, $password) {
    global $conn;
    $stmt = $conn->prepare("SELECT id, email, password, role, employee_id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $user = $result->fetch_assoc();
    if (!$user) {
        return null;
    }

    $isValidPassword = password_verify($password, $user['password']) || $user['password'] === $password;
    if (!$isValidPassword) {
        return null;
    }

    unset($user['password']);
    return $user;
}

// ============================================
// EMPLOYEE ENDPOINTS
// ============================================
if ($resource === 'employees') {
    switch ($request_method) {
        case 'GET':
            if ($id) {
                // Get single employee
                $stmt = $conn->prepare("SELECT * FROM employees WHERE id = ?");
                $stmt->bind_param("s", $id);
            } else {
                // Get all employees
                $stmt = $conn->prepare("SELECT * FROM employees ORDER BY id");
            }
            $stmt->execute();
            $result = $stmt->get_result();
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            $stmt->close();
            response($data);
            break;

        case 'POST':
            // Create new employee
            $id = $input['id'];
            $name = $input['name'];
            $email = $input['email'];
            $phone = $input['phone'];
            $department_id = $input['department_id'];
            $position = $input['position'];
            $status = $input['status'] ?? 'Active';
            $joined_date = $input['joined_date'];
            $salary = $input['salary'];
            $address = $input['address'];
            $defaultPassword = DEFAULT_PASSWORD;
            $hashedPassword = password_hash($defaultPassword, PASSWORD_BCRYPT, ['cost' => 12]);

            $conn->begin_transaction();

            try {
                $stmt = $conn->prepare("INSERT INTO employees (id, name, email, phone, department_id, position, status, joined_date, salary, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("ssssssssss", $id, $name, $email, $phone, $department_id, $position, $status, $joined_date, $salary, $address);

                if (!$stmt->execute()) {
                    throw new Exception($stmt->error);
                }
                $stmt->close();

                $userStmt = $conn->prepare("INSERT INTO users (email, password, role, employee_id) VALUES (?, ?, 'employee', ?)");
                $userStmt->bind_param("sss", $email, $hashedPassword, $id);

                if (!$userStmt->execute()) {
                    throw new Exception($userStmt->error);
                }
                $userStmt->close();

                $conn->commit();
                response([
                    'message' => 'Employee created successfully. Login credentials generated.',
                    'id' => $id,
                    'email' => $email,
                    'default_password' => $defaultPassword
                ], 201);
            } catch (Exception $e) {
                $conn->rollback();
                if (isset($stmt) && $stmt instanceof mysqli_stmt) {
                    $stmt->close();
                }
                if (isset($userStmt) && $userStmt instanceof mysqli_stmt) {
                    $userStmt->close();
                }
                response(['error' => $e->getMessage()], 400);
            }
            break;

        case 'PUT':
            // Update employee
            $id = $input['id'];
            $fields = [];
            $types = '';
            $values = [];

            foreach (['name', 'email', 'phone', 'department_id', 'position', 'status', 'salary', 'address'] as $field) {
                if (isset($input[$field])) {
                    $fields[] = "$field = ?";
                    $types .= is_numeric($input[$field]) ? 'i' : 's';
                    $values[] = $input[$field];
                }
            }

            if (empty($fields)) {
                response(['error' => 'No fields to update'], 400);
            }

            $types .= 's'; // for id
            $values[] = $id;

            $query = "UPDATE employees SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param($types, ...$values);

            if ($stmt->execute()) {
                response(['message' => 'Employee updated successfully']);
            } else {
                response(['error' => $stmt->error], 400);
            }
            $stmt->close();
            break;

        case 'DELETE':
            // Delete employee
            $stmt = $conn->prepare("DELETE FROM employees WHERE id = ?");
            $stmt->bind_param("s", $id);
            
            if ($stmt->execute()) {
                response(['message' => 'Employee deleted successfully']);
            } else {
                response(['error' => $stmt->error], 400);
            }
            $stmt->close();
            break;
    }
}

// ============================================
// ATTENDANCE ENDPOINTS
// ============================================
else if ($resource === 'attendance') {
    switch ($request_method) {
        case 'GET':
            $date = $_GET['date'] ?? date('Y-m-d');
            $stmt = $conn->prepare("SELECT a.*, e.name FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE a.attendance_date = ? ORDER BY a.employee_id");
            $stmt->bind_param("s", $date);
            $stmt->execute();
            $result = $stmt->get_result();
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            $stmt->close();
            response($data);
            break;

        case 'POST':
            // Check-in/out
            $employee_id = $input['employee_id'];
            $date = $input['date'] ?? date('Y-m-d');
            $check_in = $input['check_in'] ?? null;
            $check_out = $input['check_out'] ?? null;
            $status = $input['status'] ?? 'Present';

            $stmt = $conn->prepare("INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE check_in = VALUES(check_in), check_out = VALUES(check_out), status = VALUES(status)");
            $stmt->bind_param("sssss", $employee_id, $date, $check_in, $check_out, $status);

            if ($stmt->execute()) {
                response(['message' => 'Attendance recorded'], 201);
            } else {
                response(['error' => $stmt->error], 400);
            }
            $stmt->close();
            break;
    }
}

// ============================================
// LEAVES ENDPOINTS
// ============================================
else if ($resource === 'leaves') {
    switch ($request_method) {
        case 'GET':
            if ($id) {
                $stmt = $conn->prepare("SELECT l.*, e.name, lt.type_name FROM leaves l JOIN employees e ON l.employee_id = e.id JOIN leave_types lt ON l.leave_type_id = lt.id WHERE l.id = ?");
                $stmt->bind_param("i", $id);
            } else {
                $stmt = $conn->prepare("SELECT l.*, e.name, lt.type_name FROM leaves l JOIN employees e ON l.employee_id = e.id JOIN leave_types lt ON l.leave_type_id = lt.id ORDER BY l.created_at DESC");
            }
            $stmt->execute();
            $result = $stmt->get_result();
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            $stmt->close();
            response($data);
            break;

        case 'POST':
            // Create leave request
            $employee_id = $input['employee_id'];
            $leave_type_id = $input['leave_type_id'];
            $start_date = $input['start_date'];
            $end_date = $input['end_date'];
            $reason = $input['reason'];

            $stmt = $conn->prepare("INSERT INTO leaves (employee_id, leave_type_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, 'Pending')");
            $stmt->bind_param("iisss", $employee_id, $leave_type_id, $start_date, $end_date, $reason);

            if ($stmt->execute()) {
                response(['message' => 'Leave request submitted', 'id' => $conn->insert_id], 201);
            } else {
                response(['error' => $stmt->error], 400);
            }
            $stmt->close();
            break;

        case 'PUT':
            // Approve/Reject leave
            $id = $input['id'];
            $status = $input['status'];
            $approved_by = $input['approved_by'];

            $stmt = $conn->prepare("UPDATE leaves SET status = ?, approved_by = ?, approved_date = NOW() WHERE id = ?");
            $stmt->bind_param("sii", $status, $approved_by, $id);

            if ($stmt->execute()) {
                response(['message' => 'Leave request updated']);
            } else {
                response(['error' => $stmt->error], 400);
            }
            $stmt->close();
            break;
    }
}

// ============================================
// PAYROLL ENDPOINTS
// ============================================
else if ($resource === 'payroll') {
    switch ($request_method) {
        case 'GET':
            $month = $_GET['month'] ?? date('Y-m-01');
            $stmt = $conn->prepare("SELECT pd.*, e.name FROM payroll_details pd JOIN employees e ON pd.employee_id = e.id WHERE SUBSTR(pd.created_at, 1, 7) = SUBSTR(?, 1, 7) ORDER BY e.name");
            $stmt->bind_param("s", $month);
            $stmt->execute();
            $result = $stmt->get_result();
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            $stmt->close();
            response($data);
            break;

        case 'POST':
            // Create payroll
            $payroll_run_id = $input['payroll_run_id'];
            $employee_id = $input['employee_id'];
            $base_salary = $input['base_salary'];
            $bonuses = $input['bonuses'] ?? 0;
            $deductions = $input['deductions'] ?? 0;
            $tax = $input['tax'] ?? 0;
            $net_salary = $base_salary + $bonuses - $deductions - $tax;

            $stmt = $conn->prepare("INSERT INTO payroll_details (payroll_run_id, employee_id, base_salary, bonuses, deductions, tax, net_salary) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("isiiiii", $payroll_run_id, $employee_id, $base_salary, $bonuses, $deductions, $tax, $net_salary);

            if ($stmt->execute()) {
                response(['message' => 'Payroll created', 'id' => $conn->insert_id], 201);
            } else {
                response(['error' => $stmt->error], 400);
            }
            $stmt->close();
            break;
    }
}

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================
else if ($resource === 'auth') {
    if ($action === 'login' && $request_method === 'POST') {
        $email = $input['email'];
        $password = $input['password'];
        
        $user = authenticate_user($email, $password);
        
        if ($user) {
            response(['message' => 'Login successful', 'user' => $user]);
        } else {
            response(['error' => 'Invalid credentials'], 401);
        }
    }
}

// ============================================
// DEPARTMENTS ENDPOINTS
// ============================================
else if ($resource === 'departments') {
    switch ($request_method) {
        case 'GET':
            $stmt = $conn->prepare("SELECT d.*, e.name as head_name FROM departments d LEFT JOIN employees e ON d.head_id = e.id ORDER BY d.name");
            $stmt->execute();
            $result = $stmt->get_result();
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            $stmt->close();
            response($data);
            break;

        case 'POST':
            $name = $input['name'];
            $head_id = $input['head_id'] ?? null;
            $budget = $input['budget'] ?? null;

            $stmt = $conn->prepare("INSERT INTO departments (name, head_id, budget) VALUES (?, ?, ?)");
            $stmt->bind_param("ssi", $name, $head_id, $budget);

            if ($stmt->execute()) {
                response(['message' => 'Department created', 'id' => $conn->insert_id], 201);
            } else {
                response(['error' => $stmt->error], 400);
            }
            $stmt->close();
            break;
    }
}

// ============================================
// DEFAULT RESPONSE
// ============================================
else {
    response(['error' => 'Endpoint not found'], 404);
}

$conn->close();
?>
