<?php
// This partial outputs the site header with logo and user menu.
require_once __DIR__ . '/../session_check.php';
$userMenu = getUserMenuHTML();
$headerExtra = $headerExtra ?? '';
?>
<header class="site-header">
    <?php echo $headerExtra; ?>
    <div class="logo">
        <a href="index.php" style="text-decoration: none; color: inherit;">
            <h1>CineBukay</h1>
        </a>
    </div>
    <?php echo $userMenu; ?>
</header>
