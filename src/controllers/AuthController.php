<?php
require_once SRC_PATH . '/controllers/Controller.php';
require_once SRC_PATH . '/models/User.php';
require_once SRC_PATH . '/utils/PasswordUtil.php';

class AuthController extends Controller {
    private $userModel;

    public function __construct() {
        parent::__construct();
        $this->userModel = new User();
    }

    public function login() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method not allowed', 405);
        }

        $email = $this->input['email'] ?? null;
        $password = $this->input['password'] ?? null;

        if (!$email || !$password) {
            $this->error('Email and password are required', 400, [
                'email' => $email ? null : 'Email is required',
                'password' => $password ? null : 'Password is required',
            ]);
        }

        $user = $this->userModel->authenticate($email, $password);

        if (!$user) {
            $this->error('Invalid email or password', 401);
        }

        Auth::login($user);

        $this->success([
            'user' => $user,
            'csrf_token' => Auth::csrfToken(),
        ], 'Login successful', 200);
    }

    public function logout() {
        Auth::logout();
        $this->success(null, 'Logout successful');
    }

    public function me() {
        Auth::requireAuth();
        $this->success([
            'user' => Auth::user(),
            'csrf_token' => Auth::csrfToken(),
        ]);
    }

    /**
     * Change user password
     */
    public function changePassword() {
        Auth::requireAuth();

        $userId = Auth::id();
        $oldPassword = $this->input['old_password'] ?? null;
        $newPassword = $this->input['new_password'] ?? null;
        $confirmPassword = $this->input['confirm_password'] ?? null;

        // Validate input
        if (!$oldPassword || !$newPassword || !$confirmPassword) {
            $this->error('All fields are required', 400);
        }

        if ($newPassword !== $confirmPassword) {
            $this->error('New passwords do not match', 400);
        }

        if ($oldPassword === $newPassword) {
            $this->error('New password must be different from current password', 400);
        }

        // Change password
        $result = $this->userModel->changePassword($userId, $oldPassword, $newPassword);

        if (!$result['success']) {
            $code = isset($result['errors']) ? 422 : 400;
            $this->error($result['message'], $code, $result['errors'] ?? null);
        }

        $this->success(null, $result['message']);
    }

    /**
     * Reset password (HR only)
     */
    public function resetPassword() {
        Auth::requireRole(['hr']);

        $userId = $this->input['user_id'] ?? null;

        if (!$userId) {
            $this->error('User ID is required', 400);
        }

        $newPassword = $this->userModel->resetPassword($userId);

        if (!$newPassword) {
            $this->error('Failed to reset password', 500);
        }

        $this->success([
            'message' => 'Password has been reset',
            'default_password' => $newPassword
        ], 'Password reset successful');
    }
}
?>
