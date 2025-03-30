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
