<?php
/**
 * Password Utility Class
 * Handles password hashing and verification
 */
class PasswordUtil {
    const DEFAULT_PASSWORD = 'Welcome@123';
    
    /**
     * Hash a password
     * Uses bcrypt for secure hashing
     */
    public static function hash($password) {
        return password_hash($password, PASSWORD_BCRYPT, [
            'cost' => 12
        ]);
    }

    /**
     * Verify a password against a hash
     */
    public static function verify($password, $hash) {
        return password_verify($password, $hash);
    }

    /**
     * Generate a default password
     * Format: Welcome@123
     */
    public static function generateDefault() {
        return self::DEFAULT_PASSWORD;
    }

    /**
     * Check if password meets security requirements
     */
    public static function validate($password) {
        $errors = [];

        if (strlen($password) < 8) {
            $errors[] = 'Password must be at least 8 characters';
        }

        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain uppercase letter';
        }

        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain lowercase letter';
        }

        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password must contain digit';
        }

        if (!preg_match('/[@$!%*?&]/', $password)) {
            $errors[] = 'Password must contain special character (@$!%*?&)';
        }

        return $errors;
    }

    /**
     * Check if password is the default (first login)
     */
    public static function isDefault($plainPassword) {
        return $plainPassword === self::DEFAULT_PASSWORD;
    }
}
?>
