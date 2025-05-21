<?php
// Do souboru session_check.php přidejte následující funkce
function setToastMessage($message, $type = 'success') {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION['toast_message'] = $message;
    $_SESSION['toast_type'] = $type;
}

function getToastMessage() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (isset($_SESSION['toast_message']) && isset($_SESSION['toast_type'])) {
        $message = $_SESSION['toast_message'];
        $type = $_SESSION['toast_type'];
        
        // Odstraníme zprávu ze session
        unset($_SESSION['toast_message']);
        unset($_SESSION['toast_type']);
        
        return ['message' => $message, 'type' => $type];
    }
    
    return null;
}
?>
<?php
// File: session_check.php
// Provides helper functions related to authentication state using the Auth class.

require_once __DIR__ . '/src/Auth.php'; // Include the Auth class
require_once __DIR__ . '/db_config.php'; // Needed for Database class auto-loading config

// Global instance of Auth for convenience in procedural files
// This also ensures session is started.
$auth = new Auth();

/**
 * Checks if user is logged in, redirects to login page if not.
 * Optionally checks for admin privileges.
 * Delegates to Auth class.
 * @param bool $adminRequired Whether admin privileges are required.
 */
function requireLogin($adminRequired = false) {
    global $auth; // Use the global instance
    $auth->requireLogin($adminRequired);
}

/**
 * Generate user menu HTML based on login status.
 * Delegates to Auth class.
 * @return string HTML for user menu.
 */
function getUserMenuHTML() {
    global $auth; // Use the global instance
    return $auth->getUserMenuHTML();
}

// Functions isLoggedIn(), isAdmin(), getCurrentUser() are now methods of the Auth class.
// Use $auth->isLoggedIn(), $auth->isAdmin(), $auth->getCurrentUser() directly if needed.

?>
