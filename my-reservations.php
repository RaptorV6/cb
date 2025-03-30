<!DOCTYPE html>
<html lang="cs">
<head>
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
        <div class="user-menu-container">
            <div class="user-icon active" id="user-icon">
                <span class="user-icon-symbol">&#128100;</span>
            </div>
            <div class="dropdown-menu" id="dropdown-menu">
                <ul>
                    <li><a href="#settings">Nastavení</a></li>
                    <li><a href="#logout">Odhlásit se</a></li>
                </ul>
            </div>
        </div>
    </header>

    <main class="reservations-container">
        <h1 class="page-title">Moje rezervace</h1>
        
        <div class="tabs">
            <button class="tab-btn active" data-tab="upcoming">Aktuální</button>
            <button class="tab-btn" data-tab="past">Historie</button>
        </div>
        
        <div class="tab-content" id="upcoming-tab">
            <!-- Aktuální rezervace -->
            <div class="reservation-list">
                <!-- Rezervace 1 -->
                <div class="reservation-card">
                    <div class="reservation-header">
                        <img src="https://via.placeholder.com/100x150?text=Deadpool+a+Wolverine" alt="Deadpool a Wolverine" class="movie-thumbnail">
                        <div class="reservation-info">
                            <h3 class="movie-title">Deadpool a Wolverine</h3>
                            <div class="movie-details">
                                <span class="movie-genre">Akční, Komedie</span>
                                <span class="movie-duration">122 min</span>
                            </div>
                            <div class="reservation-date">
                                <span class="date-icon">&#128197;</span>
                                <span>Pátek, 1. 3. 2025</span>
                                <span class="time-icon">&#128336;</span>
                                <span>17:30</span>
                            </div>
                        </div>
                    </div>
                    <div class="reservation-seats">
                        <h4>Rezervovaná místa</h4>
                        <div class="seats-grid">
                            <div class="seat">
                                <span class="seat-number">3</span>
                                <span class="seat-label">Gauč</span>
                            </div>
                            <div class="seat">
                                <span class="seat-number">4</span>
                                <span class="seat-label">Gauč</span>
                            </div>
                        </div>
                    </div>
                    <div class="reservation-actions">
                        <a href="reserve.php" class="view-btn">Zobrazit rezervaci</a>
                        <button class="cancel-btn">Zrušit rezervaci</button>
                    </div>
                </div>
                
                <!-- Rezervace 2 -->
                <div class="reservation-card">
                    <div class="reservation-header">
                        <img src="https://via.placeholder.com/100x150?text=Joker:+Folie+a+Deux" alt="Joker: Folie à Deux" class="movie-thumbnail">
                        <div class="reservation-info">
                            <h3 class="movie-title">Joker: Folie à Deux</h3>
                            <div class="movie-details">
                                <span class="movie-genre">Thriller, Drama</span>
                                <span class="movie-duration">138 min</span>
                            </div>
                            <div class="reservation-date">
                                <span class="date-icon">&#128197;</span>
                                <span>Středa, 6. 3. 2025</span>
                                <span class="time-icon">&#128336;</span>
                                <span>20:00</span>
                            </div>
                        </div>
                    </div>
                    <div class="reservation-seats">
                        <h4>Rezervovaná místa</h4>
                        <div class="seats-grid">
                            <div class="seat">
                                <span class="seat-number">1</span>
                                <span class="seat-label">Židle</span>
                            </div>
                        </div>
                    </div>
                    <div class="reservation-actions">
                        <a href="reserve.php" class="view-btn">Zobrazit rezervaci</a>
                        <button class="cancel-btn">Zrušit rezervaci</button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="tab-content hidden" id="past-tab">
            <!-- Historie rezervací -->
            <div class="reservation-list">
                <!-- Rezervace 3 - proběhlá -->
                <div class="reservation-card past">
                    <div class="reservation-header">
                        <img src="https://via.placeholder.com/100x150?text=Oppenheimer" alt="Oppenheimer" class="movie-thumbnail">
                        <div class="reservation-info">
                            <h3 class="movie-title">Oppenheimer</h3>
                            <div class="movie-details">
                                <span class="movie-genre">Životopisný, Drama</span>
                                <span class="movie-duration">180 min</span>
                            </div>
                            <div class="reservation-date">
                                <span class="date-icon">&#128197;</span>
                                <span>Neděle, 23. 2. 2025</span>
                                <span class="time-icon">&#128336;</span>
                                <span>19:00</span>
                            </div>
                        </div>
                    </div>
                    <div class="reservation-seats">
                        <h4>Rezervovaná místa</h4>
                        <div class="seats-grid">
                            <div class="seat">
                                <span class="seat-number">7</span>
                                <span class="seat-label">Bobik</span>
                            </div>
                            <div class="seat">
                                <span class="seat-number">8</span>
                                <span class="seat-label">Bobik</span>
                            </div>
                        </div>
                    </div>
                    <div class="reservation-actions">
                        <a href="reserve.php" class="view-btn">Zobrazit rezervaci</a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Prázdný stav -->
        <div class="empty-state hidden">
            <div class="empty-icon">&#128465;</div>
            <h3>Žádné rezervace</h3>
            <p>Zatím nemáte žádné rezervace v této kategorii.</p>
            <a href="index.php" class="browse-btn">Prohlédnout program</a>
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
                <p>Opravdu chcete zrušit rezervaci na film <span id="cancel-movie-name">Deadpool a Wolverine</span>?</p>
                <div class="modal-actions">
                    <button class="secondary-btn">Zpět</button>
                    <button class="primary-btn confirm-cancel">Zrušit rezervaci</button>
                </div>
            </div>
        </div>
    </div>



    <script src="./js/my-reservations.js"></script>
</body>
</html>