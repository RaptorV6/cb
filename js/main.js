document.addEventListener('DOMContentLoaded', function() {
            // Načtení filmů při startu
            loadMovies();

            // Elementy pro vyhledávání a filtrování
            const searchInput = document.getElementById('search-input');
            const searchBtn = document.getElementById('search-btn');
            const filterSelect = document.getElementById('filter-select');
            const moviesWrapper = document.getElementById('movies-wrapper');
            const paginationBtns = document.querySelectorAll('.pagination-btn');
            const paginationNext = document.querySelector('.pagination-next');

            // User menu
            const userIcon = document.getElementById('user-icon');
            const dropdownMenu = document.getElementById('dropdown-menu');

            // Event listeners pro vyhledávání a filtrování
            searchBtn.addEventListener('click', filterMovies);
            searchInput.addEventListener('keyup', e => {
                if (e.key === 'Enter') filterMovies();
            });
            filterSelect.addEventListener('change', filterMovies);

            // User menu toggle
            userIcon.addEventListener('click', function(e) {
                e.stopPropagation();
                dropdownMenu.classList.toggle('active');
            });

            document.addEventListener('click', function() {
                if (dropdownMenu.classList.contains('active')) {
                    dropdownMenu.classList.remove('active');
                }
            });

            // Načtení filmů
            async function loadMovies() {
                // Zobrazit loading indikátor
                const loadingIndicator = document.getElementById('loading');
                const moviesWrapper = document.getElementById('movies-wrapper');
                const noResultsDiv = document.getElementById('no-results');
                loadingIndicator.style.display = 'flex';
                moviesWrapper.style.display = 'none';
                noResultsDiv.style.display = 'none';

                try {
                    // Použít api_endpoint.php
                    const response = await fetch('api_endpoint.php');
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const movies = await response.json();

                    // Skrýt loading indikátor
                    loadingIndicator.style.display = 'none';
                    moviesWrapper.style.display = ''; // Zobrazit wrapper (bude grid nebo flex podle CSS)

                    // Zpracování odpovědi - může obsahovat 'status' => 'error'
                    if (movies.status === 'error') {
                        console.error('Chyba při načítání filmů:', movies.message);
                        showError('Nepodařilo se načíst filmy: ' + movies.message);
                        handleNoResults(0); // Zobrazit "žádné výsledky"
                        return;
                    }

                    if (Array.isArray(movies)) {
                        updateMoviesUI(movies);
                    }
                } catch (error) {
                    console.error('Chyba při načítání filmů:', error);
                    showError('Nepodařilo se načíst filmy. Zkuste to prosím znovu.');
                }
            }

            // Aktualizace UI
            function updateMoviesUI(movies) {
                moviesWrapper.innerHTML = '';

                const now = new Date();
                movies.forEach(movie => {
                    // Získání data a časů projekce
                    const screeningDateStr = movie.screening_date; // např. "2025-04-28"
                    let screeningTimes = [];
                    try {
                        // Časy jsou uloženy jako JSON string pole
                        screeningTimes = JSON.parse(movie.screening_time); // např. ["18:00", "20:30"]
                        if (!Array.isArray(screeningTimes)) screeningTimes = []; // Zajistit, že je to pole
                    } catch (e) {
                        console.error("Chyba při parsování časů projekce:", movie.screening_time, e);
                        screeningTimes = []; // V případě chyby použít prázdné pole
                    }

                    let lastScreeningEndDateTime = null;
                    if (screeningTimes.length > 0 && movie.duration) {
                        // Najdeme poslední čas projekce (předpokládáme, že jsou seřazené nebo vezmeme poslední)
                        const lastTimeStr = screeningTimes[screeningTimes.length - 1]; // např. "20:30"

                        // Spojíme datum a poslední čas začátku
                        const lastScreeningStartDateTimeStr = `${screeningDateStr}T${lastTimeStr}:00`; // např. "2025-04-28T20:30:00"
                        const lastScreeningStartDateTime = new Date(lastScreeningStartDateTimeStr);

                        // Přidáme délku filmu k poslednímu času začátku, abychom získali čas konce
                        if (!isNaN(lastScreeningStartDateTime.getTime())) {
                            lastScreeningEndDateTime = new Date(lastScreeningStartDateTime.getTime() + movie.duration * 60000);
                        } else {
                            console.warn("Neplatný formát data/času pro výpočet konce:", movie.title, lastScreeningStartDateTimeStr);
                            // Fallback: použijeme konec dne data projekce
                            const screeningDateOnly = new Date(screeningDateStr);
                            screeningDateOnly.setHours(23, 59, 59, 999);
                            lastScreeningEndDateTime = screeningDateOnly;
                        }
                    } else {
                        // Pokud nejsou časy nebo délka, použijeme konec dne data projekce
                        const screeningDateOnly = new Date(screeningDateStr);
                        screeningDateOnly.setHours(23, 59, 59, 999);
                        lastScreeningEndDateTime = screeningDateOnly;
                    }

                    // Porovnání s aktuálním časem
                    const isPast = lastScreeningEndDateTime ? now > lastScreeningEndDateTime : false;

                    // Kontrola, zda je film "nadcházející" (začíná za více než 7 dní)
                    // Použijeme začátek dne data projekce pro toto porovnání
                    const screeningStartDateOnly = new Date(screeningDateStr);
                    screeningStartDateOnly.setHours(0, 0, 0, 0); // Začátek dne
                    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    const isUpcoming = screeningStartDateOnly > sevenDaysFromNow;

                    const card = createMovieCard(movie, isPast, isUpcoming);
                    moviesWrapper.appendChild(card);
                });

                setupMobileCardClicks();
                setupTooltips(); // Nastavení tooltipů po přidání karet
            }

            // Vytvoření karty filmu
            function createMovieCard(movie, isPast, isUpcoming) {
                const card = document.createElement('div');
                card.className = `movie-card${isPast ? ' past' : ''}${isUpcoming ? ' upcoming' : ''}`;

                const times = formatTimes(movie.screening_time);
                // Předáváme isPast do formatDateRange
                const dateRange = formatDateRange(movie.screening_date, movie, isPast);

                // Použití base64 obrázku z api_endpoint.php
                const imgSrc = movie.image ? `data:image/jpeg;base64,${movie.image}` : 'https://via.placeholder.com/260x390?text=No+Image'; // Placeholder if no image

                card.innerHTML = `
            <div class="movie-image">
                <img src="${imgSrc}" alt="${movie.title}">
                <div class="desktop-reserve">
                    ${isPast ?
                        '<span class="ended-label">Projekce skončila</span>' :
                        `<a href="reserve.php?id=${movie.id_screening}" class="reserve-btn">Rezervovat</a>`
                    }
                </div>
            </div>
            <div class="movie-content">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-details">
                    <div class="movie-meta">
                        <span class="movie-duration">${movie.duration} min</span>
                        <span class="movie-genre">${movie.genre}</span>
                    </div>
                    <div class="movie-time">
                        <span class="date">${dateRange}</span>
                        ${!isUpcoming && !isPast ? `<span class="time">${times}</span>` : ''}
                    </div>
                </div>
                <div class="mobile-reserve">
                     ${isPast ?
                        '<span class="ended-label">Projekce skončila</span>' :
                        `<a href="reserve.php?id=${movie.id_screening}" class="reserve-btn">Rezervovat</a>`
                    }
                </div>
            </div>
        `;

        return card;
    }

    // Filtrování filmů
    function filterMovies() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;
        const cards = document.querySelectorAll('.movie-card');

        let visibleCount = 0;
        cards.forEach(card => {
            const title = card.querySelector('.movie-title').textContent.toLowerCase();
            const genre = card.querySelector('.movie-genre').textContent.toLowerCase();
            const isPast = card.classList.contains('past');
            const isUpcoming = card.classList.contains('upcoming');

            let matchesFilter = true;
            switch (filterValue) {
                case 'upcoming':
                    matchesFilter = isUpcoming;
                    break;
                case 'now':
                    matchesFilter = !isPast && !isUpcoming;
                    break;
                case 'past':
                    matchesFilter = isPast;
                    break;
            }

            const matchesSearch = title.includes(searchTerm) || genre.includes(searchTerm);
            const shouldShow = matchesSearch && matchesFilter;
            
            card.style.display = shouldShow ? '' : 'none';
            if (shouldShow) visibleCount++;
        });

        // Zobrazení zprávy, pokud nejsou nalezeny žádné filmy
        handleNoResults(visibleCount);
    }

    // Zobrazení/skrytí zprávy o nenalezených filmech
    function handleNoResults(visibleCount) {
        const noResultsDiv = document.getElementById('no-results');
        if (visibleCount === 0) {
            noResultsDiv.style.display = 'flex'; // Použít existující div
            moviesWrapper.style.display = 'none'; // Skrýt wrapper, pokud nejsou výsledky
        } else {
            noResultsDiv.style.display = 'none';
            moviesWrapper.style.display = ''; // Zobrazit wrapper (bude grid nebo flex podle CSS)
        }
    }

    // Nastavení klikání na karty na mobilních zařízeních
    function setupMobileCardClicks() {
        if (window.innerWidth < 768) {
            const movieCards = document.querySelectorAll('.movie-card:not(.past):not(.upcoming)');
            
            movieCards.forEach(card => {
                const reserveBtn = card.querySelector('.mobile-reserve .reserve-btn');
                if (!reserveBtn || reserveBtn.classList.contains('disabled')) return;

                const reserveLink = reserveBtn.getAttribute('href');
                
                card.addEventListener('click', function(e) {
                    if (e.target === reserveBtn || reserveBtn.contains(e.target)) return;
                    window.location.href = reserveLink;
                });
            });
        }
    }

    // Pagination
    paginationBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            paginationBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    paginationNext.addEventListener('click', function() {
        const activeBtn = document.querySelector('.pagination-btn.active');
        const nextBtn = activeBtn.nextElementSibling;
        
        if (nextBtn && nextBtn.classList.contains('pagination-btn')) {
            nextBtn.click();
        }
    });

    // Helper funkce
    function formatTimes(timeStr) {
        try {
            const times = JSON.parse(timeStr);
            return times.join(', ');
        } catch {
            return timeStr;
        }
    }

    function formatDateRange(dateStr, movie, isPastFilm) {
        const date = new Date(dateStr);
        const now = new Date();
        
        // Použití isPastFilm parametru namísto prosté kontroly date < now
        if (isPastFilm) {
            return `Skončilo ${date.toLocaleDateString('cs-CZ')}`;
        }
        
        if (date > new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
            return `Od ${date.toLocaleDateString('cs-CZ')}`;
        }

        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 14);
        
        return `${date.toLocaleDateString('cs-CZ')} - ${endDate.toLocaleDateString('cs-CZ')}`;
    }

    // Tooltip pro dlouhé názvy
    function setupTooltips() {
        const movieTitles = document.querySelectorAll('.movie-title');
        movieTitles.forEach(title => {
            if (title.scrollHeight > title.clientHeight) {
                title.setAttribute('title', title.textContent);
            }
        });
    }

    // Event listener pro změnu velikosti okna
    window.addEventListener('resize', function() {
        setupMobileCardClicks();
        setupTooltips();
    });

    // Event listener pro změnu velikosti okna
    window.addEventListener('resize', function() {
        setupMobileCardClicks();
        setupTooltips(); // Aktualizace tooltipů při změně velikosti
    });

    // Inicializace tooltipů se již volá v updateMoviesUI po načtení filmů
});