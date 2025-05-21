<?php
// File: login.php
require_once 'session_check.php'; // Změna na session_check, který inicializuje $auth
global $auth; // Zpřístupnění globální instance $auth

// Redirect if already logged in
if ($auth->isLoggedIn()) {
    header("Location: " . ($auth->isAdmin() ? 'admin.php' : 'index.php'));
    exit;
}

// Check for error/success messages
?>
<!DOCTYPE html>
<html lang="cs">
<head>
    <link rel="stylesheet" href="./css/toast.css">
    <script src="./js/toast.js"></script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Přihlášení | CineBukay</title>
    <link href="https://fonts.googleapis.com/css?family=Lato&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="./css/vestylu.css">
    <!-- Link na login.css odstraněn, styly jsou v vestylu.css -->
</head>
<body>
    <header class="site-header">
      <a href="index.php" style="text-decoration: none; color: inherit;">
                <h1>CineBukay</h1>
            </a>
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
    <script src="./js/common.js"></script>
<?php
// Kontrola toast zprávy ze session
$toastMessage = getToastMessage();
if ($toastMessage): 
?>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        showToast('<?php echo addslashes($toastMessage['message']); ?>', '<?php echo $toastMessage['type']; ?>');
    });
</script>
<?php endif; ?>
</body>
</html>
