<?php
require_once 'session_check.php';
requireLogin(true); // Vyžaduje admin práva
?>
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin | CineBukay</title>
    <link href="https://fonts.googleapis.com/css?family=Lato&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="./css/vestylu.css">
    <link rel="stylesheet" href="./css/admin.css">
</head>
<body>
    <header class="site-header">
        <h1 class="site-title">CineBukay | Admin</h1>
        <?php echo getUserMenuHTML(); ?>
    </header>
    
    <!-- Navigace pro mobil -->
    <nav class="mobile-nav">
        <a href="#" class="nav-item active" data-section="movies">Filmy</a>
        <a href="#" class="nav-item" data-section="reservations">Rezervace</a>
        <a href="#" class="nav-item" data-section="users">Uživatelé</a>
        <a href="#" class="nav-item" data-section="settings">Nastavení</a>
    </nav>
    
    <!-- Navigace pro desktop -->
    <nav class="sidebar">
        <a href="#" class="nav-item active" data-section="movies">Filmy</a>
        <a href="#" class="nav-item" data-section="reservations">Rezervace</a>
        <a href="#" class="nav-item" data-section="users">Uživatelé</a>
        <a href="#" class="nav-item" data-section="settings">Nastavení</a>
    </nav>
    
    <main class="main-content">
        <!-- Sekce Filmy -->
        <div id="movies-section" class="content-section active">
            <div class="section-header">
                <h2>Správa filmů</h2>
                <button class="add-btn" id="add-movie-btn">+ Přidat nový film</button>
            </div>
            
            <div class="search-container">
                <div class="search-box">
                    <input type="text" class="search-input" placeholder="Hledat film...">
                    <button class="search-btn">🔍</button>
                </div>
                <select class="filter-select">
                    <option value="all">Všechny filmy</option>
                    <option value="active">Aktuální</option>
                    <option value="archive">Archiv</option>
                </select>
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
                            <th>Datum promítání</th>
                            <th>Časy</th>
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

        <!-- Sekce Rezervace -->
        <div id="reservations-section" class="content-section">
            <h2>Správa rezervací</h2>
            <!-- Sem přijde obsah pro správu rezervací -->
        </div>

        <!-- Sekce Uživatelé -->
        <div id="users-section" class="content-section">
            <h2>Správa uživatelů</h2>
            <!-- Sem přijde obsah pro správu uživatelů -->
        </div>

        <!-- Sekce Nastavení -->
        <div id="settings-section" class="content-section">
            <h2>Nastavení</h2>
            <!-- Sem přijde obsah pro nastavení -->
        </div>
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
                    
                    <div class="form-row">
                        <div class="form-col">
                            <label class="form-label">Datum od *</label>
                            <input type="date" class="form-input" id="date-from" required>
                        </div>
                        <div class="form-col">
                            <label class="form-label">Datum do *</label>
                            <input type="date" class="form-input" id="date-to" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Časy promítání</label>
                        <div class="times-container" id="times-container">
                            <div class="time-group">
                                <input type="time" class="form-input time-input">
                                <button type="button" class="remove-time">&times;</button>
                            </div>
                            <button type="button" class="add-time" id="add-time">+ Přidat čas</button>
                        </div>
                    </div>
                    
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
</body>
</html>