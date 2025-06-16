<?php
require_once 'autoload.php';
require_once __DIR__ . '/db_config.php'; // Needed for Database class auto-loading config

$auth = new Auth();
$auth->requireLogin(); // Ensure user is logged in to access this page

// Optionally, get user data if needed for the page header/menu later
$currentUser = $auth->getCurrentUser(); 
?>
<!DOCTYPE html>
<html lang="cs">
<head>
    <link rel="icon" type="image/png" href="favicon.png">
    <link rel="stylesheet" href="./css/toast.css">
    <script src="./js/toast.js"></script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Moje rezervace | CineBukay</title>
    <link href="https://fonts.googleapis.com/css?family=Lato&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="./css/vestylu.css">
    <link rel="stylesheet" href="./css/my-reservations.css">
</head>
<body>
    <header class="site-header">
        <div class="back-button">
            <a href="index.php" id="back-link">
                <span class="back-arrow">&#8592;</span>
                <span class="back-text">Zpět na program</span>
            </a>
        </div>
        <div class="logo">
            <a href="index.php" style="text-decoration: none; color: inherit;">
                <h1>CineBukay</h1>
            </a>
        </div>
        <?php
        require_once 'session_check.php';
        $userMenu = getUserMenuHTML();
        echo $userMenu;
        ?>
    </header>

    <main class="reservations-container">
        <h1 class="page-title">Moje rezervace</h1>
        
        <div class="tabs">
            <button class="tab-btn active" data-tab="upcoming">Aktuální</button>
            <button class="tab-btn" data-tab="past">Historie</button>
        </div>
        
        <!-- Loading indikátor -->
        <div id="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Načítám rezervace...</p>
        </div>
        
        <div class="tab-content" id="upcoming-tab">
            <!-- Aktuální rezervace budou načteny pomocí JS -->
            <div class="reservation-list">
                <!-- Obsah bude dynamicky vložen -->
            </div>
        </div>
        
        <div class="tab-content hidden" id="past-tab">
            <!-- Historie rezervací bude načtena pomocí JS -->
            <div class="reservation-list">
                <!-- Obsah bude dynamicky vložen -->
            </div>
        </div>
    </main>

    <!-- Modal pro potvrzení zrušení rezervace -->
    <div class="modal" id="cancel-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Zrušení rezervace</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <p>Opravdu chcete zrušit rezervaci na film <span id="cancel-movie-name">Název filmu</span>?</p>
                <div class="modal-actions">
                    <button class="secondary-btn">Zpět</button>
                    <button class="primary-btn confirm-cancel">Zrušit rezervaci</button>
                </div>
            </div>
        </div>
    </div>

    <script src="./js/my-reservations.js"></script>
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
