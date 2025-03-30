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
                try {
                    const response = await fetch('movie_handlers.php');
                    const movies = await response.json();

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
                    const screeningDate = new Date(movie.screening_date);
                    const isPast = screeningDate < now;
                    const isUpcoming = screeningDate > new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dní dopředu

                    const card = createMovieCard(movie, isPast, isUpcoming);
                    moviesWrapper.appendChild(card);
                });

                setupMobileCardClicks();
            }

            // Vytvoření karty filmu
            function createMovieCard(movie, isPast, isUpcoming) {
                const card = document.createElement('div');
                card.className = `movie-card${isPast ? ' past' : ''}${isUpcoming ? ' upcoming' : ''}`;

                const times = formatTimes(movie.screening_time);
                const dateRange = formatDateRange(movie.screening_date);

                card.innerHTML = `
            <div class="movie-image">
                <img src="data:image/jpeg;base64,${movie.image}" alt="${movie.title}">
                <div class="desktop-reserve">
                    ${isPast ? 
                        '<span class="ended-label">Projekce skončila</span>' :
                        isUpcoming ? 
                            '<span class="reserve-btn disabled">Rezervovat</span>' :
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
                        isUpcoming ? 
                            '<span class="reserve-btn disabled">Rezervovat</span>' :
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
        let noResultsMsg = document.getElementById('no-results-message');
        
        if (visibleCount === 0) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.id = 'no-results-message';
                noResultsMsg.className = 'no-results';
                noResultsMsg.innerHTML = `
                    <div class="no-results-icon">&#128269;</div>
                    <h3>Žádné filmy nenalezeny</h3>
                    <p>Zkuste upravit vaše hledání nebo filtr.</p>
                `;
                moviesWrapper.appendChild(noResultsMsg);
            }
        } else if (noResultsMsg) {
            noResultsMsg.remove();
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

    function formatDateRange(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        
        if (date < now) {
            return `Skončilo ${date.toLocaleDateString('cs-CZ')}`;
        }
        
        if (date > new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
            return `Od ${date.toLocaleDateString('cs-CZ')}`;
        }

        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 14); // předpokládáme 14denní promítání
        
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

    // Inicializace tooltipů
    setupTooltips();
});