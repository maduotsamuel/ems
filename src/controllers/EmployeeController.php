<?php
require_once SRC_PATH . '/controllers/Controller.php';
require_once SRC_PATH . '/models/Employee.php';
require_once SRC_PATH . '/models/User.php';

class EmployeeController extends Controller {
    private $employeeModel;

    public function __construct() {
        parent::__construct();
        $this->employeeModel = new Employee();
    }

    public function index() {
        Auth::requireAuth();

        $employees = $this->employeeModel->getWithDepartment();
        $this->success($employees);
    }

    public function show($id) {
        Auth::requireAuth();

        $employee = $this->employeeModel->find($id);

        if (!$employee) {
            $this->notFound();
        }

        $this->success($employee);
    }

    public function store() {
        Auth::requireRole(['hr']);

        if (empty($this->input['date_recruited']) && !empty($this->input['joined_date'])) {
            $this->input['date_recruited'] = $this->input['joined_date'];
        }

        if (empty($this->input['joined_date']) && !empty($this->input['date_recruited'])) {
            $this->input['joined_date'] = $this->input['date_recruited'];
        }

        $rules = [
            'id' => 'required',
            'name' => 'required',
            'email' => 'required|email',
            'position' => 'required',
            'date_recruited' => 'required',
        ];

        $errors = $this->validate($this->input, $rules);

        if (!empty($errors)) {
            $this->error('Validation failed', 422, $errors);
        }

        // Check if employee with same ID already exists
        $exists = $this->employeeModel->find($this->input['id']);
        if ($exists) {
            $this->error('Employee ID already exists', 400);
        }

        // Check if email is already used
        $userModel = new User();
        $existingUser = $userModel->findByEmail($this->input['email']);
        if ($existingUser) {
            $this->error('Email already in use', 400);
        }

        // Create employee with user account
        $result = $this->employeeModel->createWithUser($this->input, 'employee');

        if (!$result['success']) {
            $this->error($result['message'], 500);
        }

        // Prepare response with credentials info
        $response = [
            'employee_id' => $result['employee_id'],
            'email' => $result['email'],
            'default_password' => $result['default_password'],
            'message' => 'Login credentials have been created. Default password: ' . $result['default_password']
        ];

        $this->success($response, $result['message'], 201);
    }

    public function update($id) {
        Auth::requireRole(['hr']);

        if (empty($this->input['date_recruited']) && !empty($this->input['joined_date'])) {
            $this->input['date_recruited'] = $this->input['joined_date'];
        }

        if (empty($this->input['joined_date']) && !empty($this->input['date_recruited'])) {
            $this->input['joined_date'] = $this->input['date_recruited'];
        }

        $employee = $this->employeeModel->find($id);

        if (!$employee) {
            $this->notFound();
        }

        $result = $this->employeeModel->update($id, $this->input);

        if (!$result) {
            $this->error('Failed to update employee', 500);
        }

        $updated = $this->employeeModel->find($id);
        $this->success($updated, 'Employee updated successfully');
    }

    public function destroy($id) {
        Auth::requireRole(['hr']);

        $employee = $this->employeeModel->find($id);

        if (!$employee) {
            $this->notFound();
        }

        $result = $this->employeeModel->delete($id);

        if (!$result) {
            $this->error('Failed to delete employee', 500);
        }

        // Also delete associated user account
        $userModel = new User();
        $user = $userModel->findByEmail($employee['email']);
        if ($user) {
            $userModel->delete($user['id']);
        }

        $this->success(null, 'Employee deleted successfully');
    }
}
?>
