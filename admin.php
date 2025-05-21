<?php
require_once 'session_check.php';
requireLogin(true); // Vyžaduje admin práva
?>
<!DOCTYPE html>
<html lang="cs">
<head>
    <link rel="icon" type="image/png" href="favicon.png">
    <link rel="stylesheet" href="./css/toast.css">
    <script src="./js/toast.js"></script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin | CineBukay</title>
    <link href="https://fonts.googleapis.com/css?family=Lato&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="./css/vestylu.css">
    <link rel="stylesheet" href="./css/admin.css">
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
    
    <!-- Navigace odstraněna -->
    
    <main class="main-content full-width"> <!-- Přidána třída pro plnou šířku, pokud sidebar zmizel -->
        <!-- Sekce Filmy -->
        <div id="movies-section" class="content-section active">
            <div class="section-header">
                <h2>Správa filmů</h2>
                <button class="add-btn" id="add-movie-btn">+ Přidat nový film</button>
            </div>
            
            <div class="search-container">
          <!--       <div class="search-box">
                    <input type="text" class="search-input" placeholder="Hledat film...">
                    <button class="search-btn">🔍</button>
                </div>
                <select class="filter-select">
    <option value="active">Aktuální</option>
    <option value="archive">Historie</option>
</select> -->
            </div>

            <!-- Loading stav -->
            <div id="movies-loading" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Načítám filmy...</p>
            </div>
            
            <!-- Mobile zobrazení -->
            <div class="movies-cards">
                <!-- Sem budou dynamicky vloženy karty filmů pro mobilní zobrazení -->
            </div>
            
            <!-- Desktop zobrazení -->
            <div class="movies-table">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Název</th>
                            <th>Žánr</th>
                            <th>Délka</th>
                            <th>Datum a čas promítání</th>
                            <th>Akce</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Sem budou dynamicky vloženy řádky filmů pro desktop zobrazení -->
                    </tbody>
                </table>
            </div>
            
            <div class="pagination">
                <button class="page-btn active">1</button>
                <button class="page-btn">2</button>
                <button class="next-btn">→</button>
            </div>
        </div>
        <!-- Ostatní sekce odstraněny -->
    </main>
    
    <!-- Modal pro přidání/úpravu filmu -->
    <div class="modal" id="movie-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Přidat nový film</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <form id="movie-form">
                    <input type="hidden" id="movie-id">
                    
                    <div class="form-group">
                        <label class="form-label">Název filmu *</label>
                        <input type="text" class="form-input" id="movie-title" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-col">
                            <label class="form-label">Délka (min) *</label>
                            <input type="number" class="form-input" id="movie-duration" min="1" required>
                        </div>
                        <div class="form-col">
                            <label class="form-label">Žánr *</label>
                            <input type="text" class="form-input" id="movie-genre" list="genres" placeholder="Přidat žánr" required>
                            <datalist id="genres">
                                <option value="Akční">
                                <option value="Animovaný">
                                <option value="Dobrodružný">
                                <option value="Drama">
                                <option value="Fantasy">
                                <option value="Horor">
                                <option value="Komedie">
                                <option value="Thriller">
                                <option value="Sci-fi">
                                <option value="Životopisný">
                            </datalist>
                        </div>
                    </div>
                    
                    <div class="genre-tags" id="genre-tags">
                        <!-- Tagy budou přidány JavaScriptem -->
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Obrázek filmu</label>
                        <div class="image-upload" id="image-upload">
                            <div class="upload-icon">📷</div>
                            <div>Nahrát obrázek</div>
                        </div>
                        <input type="file" id="movie-image" style="display:none" accept="image/*">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Datum a čas promítání *</label>
                        <input type="datetime-local" class="form-input" id="movie-datetime" required>
                    </div>
                    
                    <!-- Odstraněna sekce pro více časů -->
                    
                    <div class="form-group">
                        <label class="form-label">Popis filmu</label>
                        <textarea class="form-input" id="movie-description" rows="3"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="cancel-btn">Zrušit</button>
                        <button type="submit" class="save-btn">Uložit</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    
    <!-- Modal pro potvrzení smazání -->
    <div class="modal" id="delete-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Smazat film</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <p>Opravdu chcete smazat film <span id="delete-movie-name"></span>?</p>
                <div class="form-actions">
                    <button class="cancel-btn">Zrušit</button>
                    <button class="confirm-btn">Smazat</button>
                </div>
            </div>
        </div>
    </div>
    
    <script src="./js/admin.js"></script>
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
</html>
