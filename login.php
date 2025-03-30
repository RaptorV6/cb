<?php
// File: login.php
require_once 'auth_handlers.php';

// Redirect if already logged in
if (isLoggedIn()) {
    header("Location: " . (isAdmin() ? 'admin.php' : 'index.php'));
    exit;
}

// Check for error/success messages
$errorMsg = '';
$successMsg = '';

if (isset($_GET['error'])) {
    $errorMsg = htmlspecialchars($_GET['error']);
}

if (isset($_GET['success'])) {
    $successMsg = htmlspecialchars($_GET['success']);
}
?>
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Přihlášení | CineBukay</title>
    <link href="https://fonts.googleapis.com/css?family=Lato&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="./css/vestylu.css">
    <link rel="stylesheet" href="./css/login.css">
</head>
<body>
    <header class="site-header">
      <h1>CineBukay</h1>
    </header>

    <div class="auth-container">
        <div class="auth-box">
            <div class="auth-header">
                <h1>Rezervační Systém</h1>
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Přihlášení</button>
                    <button class="auth-tab" data-tab="register">Registrace</button>
                </div>
            </div>

            <?php if ($errorMsg): ?>
            <div class="error-message visible"><?php echo $errorMsg; ?></div>
            <?php endif; ?>
            
            <?php if ($successMsg): ?>
            <div class="success-message visible"><?php echo $successMsg; ?></div>
            <?php endif; ?>

            <div class="auth-form-container">
                <!-- Login Form -->
                <form id="login-form" class="auth-form active">
                    <div class="form-group">
                        <label for="login-username">Přezdívka</label>
                        <input type="text" id="login-username" name="username" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="login-password">Heslo</label>
                        <input type="password" id="login-password" name="password" required>
                    </div>
                    
                    <div class="form-group checkbox">
                        <input type="checkbox" id="remember-me" name="remember">
                        <label for="remember-me">Zapamatovat si mě</label>
                    </div>
                    
                    <div class="form-group">
                        <button type="submit" class="submit-btn">Přihlásit se</button>
                    </div>
                </form>

                <!-- Register Form -->
                <form id="register-form" class="auth-form">
                    <div class="form-group">
                        <label for="register-username">Přezdívka</label>
                        <input type="text" id="register-username" name="username" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="register-password">Heslo</label>
                        <input type="password" id="register-password" name="password" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="register-password-confirm">Potvrzení hesla</label>
                        <input type="password" id="register-password-confirm" name="password_confirm" required>
                    </div>
                    
                    <div class="form-group checkbox">
                        <input type="checkbox" id="agree-terms" name="agree_terms" required>
                        <label for="agree-terms">Souhlasím s <a href="#"> podmínkami</a></label>
                    </div>
                    
                    <div class="form-group">
                        <button type="submit" class="submit-btn">Registrovat se</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    
    <script src="./js/login.js"></script>
</body>
</html>