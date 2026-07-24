<?php
require_once SRC_PATH . '/models/Model.php';
require_once SRC_PATH . '/utils/PasswordUtil.php';

class User extends Model {
    protected $table = 'users';
    protected $fillable = ['email', 'password', 'role', 'employee_id'];
    protected $hidden = ['password'];

    public function findByEmail($email) {
        return $this->where('email', $email)[0] ?? null;
    }

    public function authenticate($email, $password) {
        $user = $this->findByEmail($email);
        
        if (!$user) {
            return null;
        }

        // Use password_verify for hashed passwords
        if (PasswordUtil::verify($password, $user['password'])) {
            unset($user['password']);
            return $user;
        }

        return null;
    }

    /**
     * Create a new user with hashed password
     */
    public function createUser($email, $role, $employeeId = null) {
        $password = PasswordUtil::generateDefault();
        $hashedPassword = PasswordUtil::hash($password);

        $stmt = $this->db->prepare("INSERT INTO users (email, password, role, employee_id) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $email, $hashedPassword, $role, $employeeId);
        
        if ($stmt->execute()) {
            $stmt->close();
            return [
                'id' => $this->db->insert_id,
                'email' => $email,
                'role' => $role,
                'employee_id' => $employeeId,
                'default_password' => $password  // Return only for initial setup
            ];
        }

        $stmt->close();
        return false;
    }

    /**
     * Change user password
     */
    public function changePassword($userId, $oldPassword, $newPassword) {
        // Get user
        $stmt = $this->db->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        if (!$user) {
            return ['success' => false, 'message' => 'User not found'];
        }

        // Verify old password
        if (!PasswordUtil::verify($oldPassword, $user['password'])) {
            return ['success' => false, 'message' => 'Current password is incorrect'];
        }

        // Validate new password
        $errors = PasswordUtil::validate($newPassword);
        if (!empty($errors)) {
            return ['success' => false, 'message' => 'Password does not meet requirements', 'errors' => $errors];
        }

        // Hash and update new password
        $hashedPassword = PasswordUtil::hash($newPassword);
        $stmt = $this->db->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->bind_param("si", $hashedPassword, $userId);
        
        $result = $stmt->execute();
        $stmt->close();

        if ($result) {
            return ['success' => true, 'message' => 'Password changed successfully'];
        }

        return ['success' => false, 'message' => 'Failed to change password'];
    }

    /**
     * Reset password to default (admin only)
     */
    public function resetPassword($userId) {
        $defaultPassword = PasswordUtil::generateDefault();
        $hashedPassword = PasswordUtil::hash($defaultPassword);

        $stmt = $this->db->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->bind_param("si", $hashedPassword, $userId);
        
        $result = $stmt->execute();
        $stmt->close();

        return $result ? $defaultPassword : false;
    }
}
?>
