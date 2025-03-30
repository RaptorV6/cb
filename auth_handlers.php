<?php
// File: auth_handlers.php
// Handles authentication related requests (login, register, logout)
// Delegates logic to the Auth class.

require_once __DIR__ . '/src/Auth.php'; // Include the Auth class
require_once __DIR__ . '/db_config.php'; // Needed for Database class auto-loading config

// Instantiate Auth class (this also starts the session)
$auth = new Auth();

// Handle AJAX POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];
    $response = ['status' => 'error', 'message' => 'Neplatná akce.']; // Default error response

    try {
        switch ($action) {
            case 'login':
                if (isset($_POST['username']) && isset($_POST['password'])) {
                    $remember = isset($_POST['remember']) && $_POST['remember'] === 'true';
                    $response = $auth->loginUser($_POST['username'], $_POST['password'], $remember);
                } else {
                    $response = ['status' => 'error', 'message' => 'Chybí uživatelské jméno nebo heslo.'];
                }
                break;

            case 'register':
                if (isset($_POST['username']) && isset($_POST['password'])) {
                    // Basic validation could be added here (e.g., password length) before calling register
                    $response = $auth->registerUser($_POST['username'], $_POST['password']);
                } else {
                    $response = ['status' => 'error', 'message' => 'Chybí uživatelské jméno nebo heslo.'];
                }
                break;
            
            // Note: AJAX logout is less common, usually done via GET link, but handle if needed
            case 'logout': 
                 $auth->logoutUser();
                 $response = ['status' => 'success', 'message' => 'Odhlášení proběhlo úspěšně.'];
                 break;
        }
    } catch (Exception $e) {
        // Catch potential exceptions from Auth methods (like DB connection issues)
        error_log("Auth Handler Error: " . $e->getMessage());
        $response = ['status' => 'error', 'message' => 'Došlo k systémové chybě.'];
    }

    // Return JSON response
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

// Handle GET logout request (e.g., from a link)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    $auth->logoutUser();
    // Redirect to login page after logout
    header("Location: login.php?success=Úspěšně jste se odhlásili.");
    exit;
}

// If no valid action is found or method is not POST/GET for logout
http_response_code(400); // Bad Request
header('Content-Type: application/json');
echo json_encode(['status' => 'error', 'message' => 'Neplatný požadavek.']);
exit;

?>
