<?php
// File: session_check.php
require_once 'auth_handlers.php';

/**
 * Checks if user is logged in, redirects to login page if not
 * @param bool $adminRequired Whether admin privileges are required
 */
function requireLogin($adminRequired = false) {
    if (!isLoggedIn()) {
        header("Location: login.php?error=Pro přístup k této stránce je nutné se přihlásit.");
        exit;
    }
    
    if ($adminRequired && !isAdmin()) {
        header("Location: index.php?error=K této stránce nemáte přístup.");
        exit;
    }
}

/**
 * Gets current user information from database
 * @return array|null User data or null if not logged in
 */
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    try {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT id_user, username, is_admin FROM users WHERE id_user = :id");
        $stmt->bindParam(':id', $_SESSION['user_id']);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            // Invalid session data, log out user
            logoutUser();
            return null;
        }
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // Error handling
        error_log("Error fetching current user: " . $e->getMessage());
        return null;
    }
}

/**
 * Generate user menu HTML based on login status
 * @return string HTML for user menu
 */
function getUserMenuHTML() {
    $currentUser = getCurrentUser();
    
    if ($currentUser) {
        $isAdmin = $currentUser['is_admin'] ? true : false;
        $html = '<div class="user-menu-container">';
        $html .= '<div class="user-icon" id="user-icon">';
        $html .= '<span class="user-icon-symbol">👤</span>';
        $html .= '<span class="user-name">' . htmlspecialchars($currentUser['username']) . '</span>';
        $html .= '</div>';
        $html .= '<div class="dropdown-menu" id="dropdown-menu">';
        $html .= '<ul>';
        
        // Add admin link if user is admin
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
?>