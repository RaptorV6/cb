<!DOCTYPE html>
<html lang="cs">
<head>
    <link rel="stylesheet" href="./css/toast.css">
    <script src="./js/toast.js"></script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CineBukay | Programy filmů</title>
    <link href="https://fonts.googleapis.com/css?family=Lato&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="./css/vestylu.css">
    <link rel="stylesheet" href="./css/movies.css">
</head>
<body>
    <?php
    require_once 'session_check.php';
    $userMenu = getUserMenuHTML(); // Získá HTML pro menu podle stavu přihlášení
    ?>

    <header class="site-header">
        <div class="logo">
            <h1>CineBukay</h1>
        </div>
        <?php echo $userMenu; ?>
    </header>

    <main class="movies-container">
        <div class="filter-controls">
            <div class="search-box">
                <input type="text" id="search-input" placeholder="Hledat film...">
                <button id="search-btn">
                    <span>&#128269;</span>
                </button>
            </div>
            <div class="filter-box">
                <select id="filter-select">
                    <option value="all">Všechny filmy</option>
                    <option value="upcoming">Připravované</option>
                    <option value="now">Nyní promítáme</option>
                    <option value="past">Archiv</option>
                </select>
            </div>
        </div>

        <!-- Loading indikátor -->
        <div id="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Načítám filmy...</p>
        </div>

        <!-- Kontejner pro filmy -->
        <div class="movies-wrapper" id="movies-wrapper">
            <!-- Sem budou dynamicky vloženy karty filmů -->
        </div>

        <!-- Stav bez výsledků -->
        <div id="no-results" class="no-results">
            <div class="no-results-icon">&#128269;</div>
            <h3>Žádné filmy nenalezeny</h3>
            <p>Zkuste upravit vaše hledání nebo filtr.</p>
        </div>

        <!-- Stránkování -->
        <div class="pagination">
            <button class="pagination-btn active">1</button>
            <button class="pagination-btn">2</button>
            <button class="pagination-btn">3</button>
            <span class="pagination-dots">...</span>
            <button class="pagination-btn">10</button>
            <button class="pagination-next">
                <span>&#8594;</span>
            </button>
        </div>
    </main>

    <script src="./js/main.js"></script>
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
