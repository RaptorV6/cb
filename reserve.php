<!DOCTYPE html>
<html lang="cs">

<head>
    <link rel="stylesheet" href="./css/toast.css">
    <script src="./js/toast.js"></script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rezervační Systém</title>
    <link href="https://fonts.googleapis.com/css?family=Lato&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="./css/vestylu.css">
    <style>
        /* Zajištění správného umístění jmenovek v rámci kontejnerů */
        .couch-horizontal .seat,
        .couch-vertical .seat,
        .chair-top-right .seat,
        .chair-middle-left .seat,
        .chair-middle-top .seat {
            position: relative;
            overflow: visible; /* Důležité pro zobrazení jmenovky, která vystupuje mimo */
        }
        
        /* Zajištění, že kontejnery nepřekrývají jmenovky */
        .couch-horizontal,
        .couch-vertical,
        .chair-top-right,
        .chair-middle-left,
        .chair-middle-top {
            overflow: visible;
        }
    </style>
</head>

<body>

<?php
    require_once 'session_check.php';
    $userMenu = getUserMenuHTML(); // Získá HTML pro menu podle stavu přihlášení
    ?>

<header class="site-header">
    <div class="logo">
        <a href="index.php" style="text-decoration: none; color: inherit;">
            <h1>CineBukay</h1>
        </a>
    </div>
    <?php echo $userMenu; ?>
</header>

    <ul class="showcase">
        <li>
            <div class="seat"></div>
            <small>Volné</small>
        </li>
        <li>
            <div class="seat selected"></div>
            <small>Vybrané</small>
        </li>
        <li>
            <div class="seat sold"></div>
            <small>Obsazené</small>
        </li>
    </ul>

    <div class="room-container">
        <!-- TV Screen -->
        <div class="screen"></div>

        <!-- Chair top right -->
        <div class="chair-top-right">
            <div class="seat" id="seat1" data-price="250"></div>
            <div class="seat-label">BOBIG</div>
        </div>

        <!-- Chair middle left -->
        <div class="chair-middle-top">
            <div class="seat" id="seat2" data-price="250"></div>
            <div class="seat-label">ŽIDLE</div>
        </div>

        <div class="chair-middle-left">
            <div class="seat" id="seat9" data-price="250"></div>
            <div class="seat-label">KŘESLO</div>
        </div>

        <!-- Couch horizontal part -->
        <div class="couch-horizontal">
            <div class="seat" id="seat3" data-price="250"></div>
            <div class="seat" id="seat4" data-price="250"></div>
            <div class="seat" id="seat5" data-price="250"></div>
            <div class="seat" id="seat6" data-price="250"></div>
            <div class="seat-label" style="margin-left: 97px;">GAUČ</div>
        </div>

        <!-- Couch vertical part -->
        <div class="couch-vertical">
            <div class="seat" id="seat7" data-price="250"></div>
            <div class="seat" id="seat8" style="margin-bottom: 10px;" data-price="250"></div>

        </div>
    </div>

<div class="selection-info">
    <p>Vyberte místo, které si přejete rezervovat.</p>
</div>

    <div class="button-container">
        <button class="reserve-btn" id="reserve-btn" disabled>Rezervovat místa</button>
    </div>

    <script src="./js/reserve.js"></script>
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
