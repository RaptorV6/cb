<?php

require_once __DIR__ . '/Database.php';

class Auth {
    private $pdo;

    public function __construct() {
        // Ensure session is started whenever Auth class is used
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $this->pdo = Database::getConnection();
    }

    /**
     * Register a new user.
     * @param string $username
     * @param string $password
     * @return array Result status and message.
     */
    public function registerUser($username, $password) {
        try {
            // Check if username already exists
            $stmt = $this->pdo->prepare("SELECT id_user FROM users WHERE username = :username");
            $stmt->bindParam(':username', $username);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return ['status' => 'error', 'message' => 'Uživatelské jméno již existuje.'];
            }

            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            // Insert new user (assuming is_admin defaults to false in DB)
            $stmt = $this->pdo->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':password', $hashedPassword);
            $stmt->execute();

            return ['status' => 'success', 'message' => 'Registrace proběhla úspěšně.'];
        } catch (PDOException $e) {
            error_log("Auth Error (registerUser): " . $e->getMessage());
            return ['status' => 'error', 'message' => 'Chyba při registraci.'];
        }
    }

    /**
     * Authenticate user login.
     * @param string $username
     * @param string $password
     * @param bool $remember Remember user flag (basic implementation)
     * @return array Result status, message, and redirect URL.
     */
    public function loginUser($username, $password, $remember = false) {
        try {
            // Get user by username
            $stmt = $this->pdo->prepare("SELECT id_user, username, password, is_admin FROM users WHERE username = :username");
            $stmt->bindParam(':username', $username);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                return ['status' => 'error', 'message' => 'Nesprávné uživatelské jméno nebo heslo.'];
            }

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Verify password
            if (!password_verify($password, $user['password'])) {
                return ['status' => 'error', 'message' => 'Nesprávné uživatelské jméno nebo heslo.'];
            }

            // Regenerate session ID upon login for security
            session_regenerate_id(true);

            // Set session variables
            $_SESSION['user_id'] = $user['id_user'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['is_admin'] = (bool) $user['is_admin']; // Ensure boolean type

            // Basic remember me cookie (consider more secure token implementation for production)
            if ($remember) {
                $token = bin2hex(random_bytes(16)); // Simple token
                setcookie('remember_token', $user['id_user'] . ':' . $token, time() + (86400 * 30), "/", "", false, true); // httponly
                // In a real app, store hash($token) in DB associated with user ID
            }

            return [
                'status' => 'success',
                'message' => 'Přihlášení úspěšné.',
                  'redirect' => 'index.php' 
            ];
        } catch (PDOException $e) {
            error_log("Auth Error (loginUser): " . $e->getMessage());
            return ['status' => 'error', 'message' => 'Chyba při přihlášení.'];
        }
    }

    /**
     * Logout current user.
     */
    public function logoutUser() {
        // Clear session data
        $_SESSION = array();

        // Delete session cookie
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }

        // Destroy the session
        session_destroy();

        // Clear remember me cookie
        if (isset($_COOKIE['remember_token'])) {
            setcookie('remember_token', '', time() - 3600, '/');
        }
    }

    /**
     * Check if user is currently logged in via session.
     * @return bool True if logged in, false otherwise.
     */
    public function isLoggedIn() {
        return isset($_SESSION['user_id']);
    }

    /**
     * Check if the logged-in user is an administrator.
     * @return bool True if admin, false otherwise.
     */
    public function isAdmin() {
        return $this->isLoggedIn() && isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
    }

    /**
     * Get data for the currently logged-in user.
     * @return array|null User data array or null if not logged in/error.
     */
    public function getCurrentUser() {
        if (!$this->isLoggedIn()) {
            return null;
        }

        try {
            $stmt = $this->pdo->prepare("SELECT id_user, username, is_admin FROM users WHERE id_user = :id");
            $stmt->bindParam(':id', $_SESSION['user_id'], PDO::PARAM_INT);
            $stmt->execute();

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                // Invalid session, force logout
                $this->logoutUser();
                return null;
            }
            // Ensure boolean type for is_admin
            $user['is_admin'] = (bool) $user['is_admin'];
            return $user;

        } catch (PDOException $e) {
            error_log("Auth Error (getCurrentUser): " . $e->getMessage());
            return null;
        }
    }

     /**
     * Checks if user is logged in, redirects to login page if not.
     * Optionally checks for admin privileges.
     * @param bool $adminRequired Whether admin privileges are required.
     */
    public function requireLogin($adminRequired = false) {
        if (!$this->isLoggedIn()) {
            // Store the requested URL in session to redirect back after login (optional)
            // $_SESSION['redirect_url'] = $_SERVER['REQUEST_URI'];
            header("Location: login.php?error=Pro přístup k této stránce je nutné se přihlásit.");
            exit;
        }

        if ($adminRequired && !$this->isAdmin()) {
            // Redirect non-admins trying to access admin pages
            header("Location: index.php?error=K této stránce nemáte přístup.");
            exit;
        }
    }

    /**
     * Generate user menu HTML based on login status.
     * @return string HTML for user menu.
     */
    public function getUserMenuHTML() {
        $currentUser = $this->getCurrentUser();

        if ($currentUser) {
            $isAdmin = $currentUser['is_admin'];
            $username = htmlspecialchars($currentUser['username']);

            $html = '<div class="user-menu-container">';
            $html .= '<div class="user-icon" id="user-icon">';
            $html .= '<span class="user-icon-symbol">👤</span>';
            $html .= '<span class="user-name">' . $username . '</span>';
            $html .= '</div>';
            $html .= '<div class="dropdown-menu" id="dropdown-menu">';
            $html .= '<ul>';

            if ($isAdmin) {
                $html .= '<li><a href="admin.php">Administrace</a></li>';
            }

            $html .= '<li><a href="my-reservations.php">Moje rezervace</a></li>';
            $html .= '<li><a href="auth_handlers.php?action=logout">Odhlásit se</a></li>';
            $html .= '</ul>';
            $html .= '</div>';
            $html .= '</div>';
        } else {
            $html = '<div class="user-menu-container">';
            $html .= '<a href="login.php" class="login-btn">Přihlásit se</a>';
            $html .= '</div>';
        }

        return $html;
    }
}
