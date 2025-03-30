<?php
// File: auth_handlers.php
require_once 'db_config.php';

session_start();

/**
 * Register a new user
 * @param string $username Username
 * @param string $password Password
 * @return array Result with status and message
 */
function registerUser($username, $password) {
    try {
        $pdo = getDbConnection();
        
        // Check if username already exists
        $stmt = $pdo->prepare("SELECT id_user FROM users WHERE username = :username");
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            return ['status' => 'error', 'message' => 'Uživatelské jméno již existuje.'];
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert new user
        $stmt = $pdo->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->execute();
        
        return ['status' => 'success', 'message' => 'Registrace proběhla úspěšně.'];
    } catch (PDOException $e) {
        return ['status' => 'error', 'message' => 'Chyba při registraci: ' . $e->getMessage()];
    }
}

/**
 * Authenticate user login
 * @param string $username Username
 * @param string $password Password
 * @param bool $remember Remember user flag
 * @return array Result with status and message
 */
function loginUser($username, $password, $remember = false) {
    try {
        $pdo = getDbConnection();
        
        // Get user by username
        $stmt = $pdo->prepare("SELECT id_user, username, password, is_admin FROM users WHERE username = :username");
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
        
        // Set session variables
        $_SESSION['user_id'] = $user['id_user'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['is_admin'] = $user['is_admin'];
        
        // If remember is checked, set cookie
        if ($remember) {
            $token = bin2hex(random_bytes(32));
            setcookie('remember_token', $token, time() + (86400 * 30), "/"); // 30 days
            
            // Save token in database for verification later
            // Note: In a real-world app, you would store this token securely
            // This is a simplified version
        }
        
        return [
            'status' => 'success', 
            'message' => 'Přihlášení úspěšné.', 
            'redirect' => $user['is_admin'] ? 'admin.php' : 'index.php'
        ];
    } catch (PDOException $e) {
        return ['status' => 'error', 'message' => 'Chyba při přihlášení: ' . $e->getMessage()];
    }
}

/**
 * Logout current user
 */
function logoutUser() {
    // Clear session
    $_SESSION = array();
    
    // Clear session cookie
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    // Destroy session
    session_destroy();
    
    // Clear remember cookie if set
    if (isset($_COOKIE['remember_token'])) {
        setcookie('remember_token', '', time() - 3600, '/');
    }
    
    // Redirect to login page
    header("Location: login.php");
    exit;
}

/**
 * Check if user is logged in
 * @return bool True if logged in, false otherwise
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

/**
 * Check if logged in user is admin
 * @return bool True if admin, false otherwise
 */
function isAdmin() {
    return isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
}

// Handle AJAX requests for login and registration
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];
    $response = ['status' => 'error', 'message' => 'Neplatný požadavek.'];
    
    if ($action === 'login' && isset($_POST['username']) && isset($_POST['password'])) {
        $remember = isset($_POST['remember']) && $_POST['remember'] === 'true';
        $response = loginUser($_POST['username'], $_POST['password'], $remember);
    } elseif ($action === 'register' && isset($_POST['username']) && isset($_POST['password'])) {
        $response = registerUser($_POST['username'], $_POST['password']);
    } elseif ($action === 'logout') {
        logoutUser();
        $response = ['status' => 'success', 'message' => 'Odhlášení proběhlo úspěšně.'];
    }
    
    // Return JSON response for AJAX requests
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

// Handle GET logout request
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    logoutUser();
    // If we get here, redirect to login page with success message
    header("Location: login.php?success=Úspěšně jste se odhlásili.");
    exit;
}
?>