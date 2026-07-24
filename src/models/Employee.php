<?php
require_once SRC_PATH . '/models/Model.php';
require_once SRC_PATH . '/models/User.php';

class Employee extends Model {
    protected $table = 'employees';
    protected $fillable = ['id', 'name', 'email', 'phone', 'department_id', 'position', 'status', 'date_recruited', 'contract_end_date', 'joined_date', 'salary', 'address'];

    public function findByDepartment($departmentId) {
        return $this->where('department_id', $departmentId);
    }

    public function findByStatus($status) {
        return $this->where('status', $status);
    }

    public function getWithDepartment() {
        $query = "
            SELECT e.*, d.name as department_name
            FROM {$this->table} e
            LEFT JOIN departments d ON e.department_id = d.id
            ORDER BY e.name
        ";
        
        $result = $this->db->query($query);
        return $this->formatResults($result);
    }

    /**
     * Create employee and associated user account
     */
    public function createWithUser($employeeData, $role = 'employee') {
        // Create employee
        $employeeId = $this->create($employeeData);
        
        if (!$employeeId) {
            return ['success' => false, 'message' => 'Failed to create employee'];
        }

        // Create user account for the employee
        $userModel = new User();
        $userResult = $userModel->createUser($employeeData['email'], $role, $employeeData['id']);

        if (!$userResult) {
            // Delete employee if user creation fails
            $this->delete($employeeData['id']);
            return ['success' => false, 'message' => 'Failed to create user account'];
        }

        // Return success with user info
        return [
            'success' => true,
            'message' => 'Employee and user account created successfully',
            'employee_id' => $employeeData['id'],
            'user_id' => $userResult['id'],
            'default_password' => $userResult['default_password'],
            'email' => $employeeData['email']
        ];
    }
}
?>
