document.addEventListener('DOMContentLoaded', function() {
            // Add pagination state variables
            let allMovies = []; // Store all movies for pagination
            let currentPage = 1;
            const moviesPerPage = 8; // Adjust based on your design preference

            // Načtení filmů při startu
            loadMovies();

            // Elementy pro vyhledávání a filtrování
            const searchInput = document.getElementById('search-input');
            const searchBtn = document.getElementById('search-btn'); // Fixed selector
            const filterSelect = document.getElementById('filter-select');
            const moviesWrapper = document.getElementById('movies-wrapper');
            const paginationContainer = document.querySelector('.pagination');

            // Event listeners pro vyhledávání a filtrování
            searchBtn.addEventListener('click', filterMovies);
            searchInput.addEventListener('keyup', e => {
                if (e.key === 'Enter') filterMovies();
            });
            filterSelect.addEventListener('change', filterMovies);

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
                        // Store all movies for pagination
                        allMovies = movies;
                        // Update pagination UI
                        setupPagination();
                        // Display first page of movies
                        displayMoviesPage(currentPage);
                    }
                } catch (error) {
                    console.error('Chyba při načítání filmů:', error);
                    showError('Nepodařilo se načíst filmy. Zkuste to prosím znovu.');
                }
            }

            // Function to display a specific page of movies
            function displayMoviesPage(page, movies) {
                // Use the provided movies array or fallback to allMovies
                const moviesToShow = movies || allMovies;
                // Calculate start and end indices
                const startIndex = (page - 1) * moviesPerPage;
                const endIndex = Math.min(startIndex + moviesPerPage, moviesToShow.length);
                const pagesToShow = moviesToShow.slice(startIndex, endIndex);
                updateMoviesUI(pagesToShow);
                // Update active page button
                updateActivePaginationButton();
            }

            // Setup pagination based on total movies
            function setupPagination(movies) {
                // Use the provided movies array or fallback to allMovies
                const moviesToShow = movies || allMovies;
                const totalPages = Math.ceil(moviesToShow.length / moviesPerPage);
                // Clear pagination container
                paginationContainer.innerHTML = '';
                // Add page buttons
                if (totalPages <= 5) {
                    // Show all pages
                    for (let i = 1; i <= totalPages; i++) {
                        addPaginationButton(i);
                    }
                } else {
                    // Show first page
                    addPaginationButton(1);
                    // Show dots or surrounding pages
                    if (currentPage <= 3) {
                        // Close to the beginning
                        for (let i = 2; i <= 4; i++) {
                            if (i <= totalPages) addPaginationButton(i);
                        }
                        if (totalPages > 4) {
                            addPaginationDots();
                            addPaginationButton(totalPages);
                        }
                    } else if (currentPage >= totalPages - 2) {
                        // Close to the end
                        addPaginationDots();
                        for (let i = totalPages - 3; i <= totalPages; i++) {
                            if (i > 1) addPaginationButton(i);
                        }
                    } else {
                        // Middle pages
                        addPaginationDots();
                        addPaginationButton(currentPage - 1);
                        addPaginationButton(currentPage);
                        addPaginationButton(currentPage + 1);
                        addPaginationDots();
                        addPaginationButton(totalPages);
                    }
                }
                // Add next button
                const nextBtn = document.createElement('button');
                nextBtn.className = 'pagination-next';
                nextBtn.innerHTML = '<span>&#8594;</span>';
                nextBtn.addEventListener('click', goToNextPage);
                paginationContainer.appendChild(nextBtn);
            }

            // Helper function to add a pagination button
            function addPaginationButton(pageNum) {
                const btn = document.createElement('button');
                btn.className = 'pagination-btn';
                if (pageNum === currentPage) {
                    btn.classList.add('active');
                }
                btn.textContent = pageNum;
                btn.addEventListener('click', function() {
                    currentPage = pageNum;
                    displayMoviesPage(currentPage, movies);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                paginationContainer.appendChild(btn);
            }

            // Helper function to add pagination dots
            function addPaginationDots() {
                const dots = document.createElement('span');
                dots.className = "pagination-dots";
                dots.textContent = "...";
                paginationContainer.appendChild(dots);
            }

            // Update the active pagination button
            function updateActivePaginationButton() {
                const buttons = paginationContainer.querySelectorAll('.pagination-btn');
                buttons.forEach(btn => {
                    if (parseInt(btn.textContent) === currentPage) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }

            // Go to next page
            function goToNextPage() {
                const totalPages = Math.ceil(allMovies.length / moviesPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    displayMoviesPage(currentPage);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }

            // Aktualizace UI
            function updateMoviesUI(movies) {
                moviesWrapper.innerHTML = '';

                const now = new Date();
                movies.forEach(movie => {
                    // Získání data a času projekce
                    const screeningDateStr = movie.screening_date; // např. "2025-04-28"
                    let screeningTimeStr = movie.screening_time; // např. "10:10:00"

                    // Vytvoření úplného data a času promítání
                    const screeningDateTime = new Date(screeningDateStr + 'T' + screeningTimeStr);

                    // Jednoduchá kontrola - film je minulý, pokud datum a čas promítání už uplynuly
                    const isPast = screeningDateTime < now;

                    // Kontrola, zda je film "nadcházející" (začíná za více než 7 dní)
                    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    const isUpcoming = screeningDateTime > sevenDaysFromNow;

                    const card = createMovieCard(movie, isPast, isUpcoming);
                    moviesWrapper.appendChild(card);
                });

                setupMobileCardClicks();
                setupTooltips();
            }

            // Filtrování filmů
            function filterMovies() {
                const searchTerm = searchInput.value.toLowerCase();
                const filterValue = filterSelect.value;
                const now = new Date();

                // Make a copy of allMovies so we don't lose the original data
                const moviesToFilter = [...allMovies];

                // Filter the movies array
                const filteredMovies = moviesToFilter.filter(movie => {
                    const title = movie.title.toLowerCase();
                    const genre = movie.genre.toLowerCase();

                    // Convert screening_date and screening_time to Date object
                    const screeningDateTime = new Date(movie.screening_date + 'T' + movie.screening_time);

                    // Determine if movie is past
                    const isPast = screeningDateTime < now;

                    // Match based on filter selection
                    let matchesFilter = true;
                    if (filterValue === 'past') {
                        matchesFilter = isPast;
                    } else if (filterValue === 'now') {
                        matchesFilter = !isPast; // Not past means current
                    }
                    // 'all' option would keep matchesFilter as true

                    const matchesSearch = title.includes(searchTerm) || genre.includes(searchTerm);
                    return matchesSearch && matchesFilter;
                });

                // Update the UI with filtered results
                if (filteredMovies.length === 0) {
                    handleNoResults(0);
                } else {
                    // Show the filtered movies
                    document.getElementById('no-results').style.display = 'none';
                    document.getElementById('movies-wrapper').style.display = '';

                    // Reset to first page whenever filters change
                    currentPage = 1;
                    // Update filtered movies but DON't replace the original allMovies
                    const tempMovies = filteredMovies;
                    setupPagination(tempMovies);
                    // Display first page
                    displayMoviesPage(currentPage, tempMovies);
                }
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

            // Helper function to show error
            function showError(message) {
                alert(message); // Simple error display, you could enhance this
            }

            // Vytvoření karty filmu
            function createMovieCard(movie, isPast, isUpcoming) {
                const card = document.createElement('div');
                card.className = `movie-card${isPast ? " past" : ""}${isUpcoming ? " upcoming" : ""}`;

                const times = formatTimes(movie.screening_time);
                const dateRange = formatDateRange(movie.screening_date, movie, isPast);
                const imgSrc = movie.image ? `data:image/jpeg;base64,${movie.image}` : 'https://via.placeholder.com/260x390?text=No+Image';

                // Zkrácený popis s omezením na 100 znaků
                const shortDescription = movie.description ?
                    (movie.description.length > 100 ?
                        movie.description.substring(0, 100) + '...' :
                        movie.description) :
                    'Bez popisu';

                card.innerHTML = `
        <div class="movie-image">
            <img src="${imgSrc}" alt="${movie.title}">
            <div class="desktop-reserve">
                ${isPast ?
                    "<span class='ended-label'>Projekce skončila</span>" :
                    `<a href="reserve.php?id=${movie.id_screening}" class="reserve-btn">Rezervovat</a>`
                }
            </div>
            <div class="movie-description-overlay">
                <p>${movie.description || 'Popis filmu není k dispozici.'}</p>
            </div>
        </div>
        <div class="movie-content">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-details">
                <div class="movie-meta">
                    <span class="movie-duration">${movie.duration} min</span>
                    <span class="movie-genre">${movie.genre}</span>
                </div>
                <div class="movie-short-description">${shortDescription}</div>
                <div class="movie-time">
                    <span class="date">${dateRange}</span>
                    ${!isUpcoming && !isPast ? `<span class="time">${times}</span>` : ''}
                </div>
            </div>
            <div class="mobile-reserve">
                ${isPast ?
                    "<span class='ended-label'>Projekce skončila</span>" :
                    `<a href="reserve.php?id=${movie.id_screening}" class="reserve-btn">Rezervovat</a>`
                }
            </div>
        </div>
    `;

    return card;
}

    // Nastavení klikání na karty na mobilních zařízeních
 function setupMobileCardClicks() {
    if (window.innerWidth < 768) {
        const movieCards = document.querySelectorAll('.movie-card:not(.past):not(.upcoming)');
        
        movieCards.forEach(card => {
            const reserveBtn = card.querySelector('.mobile-reserve .reserve-btn');
            if (!reserveBtn || reserveBtn.classList.contains('disabled')) return;

            const reserveLink = reserveBtn.getAttribute('href');
            
            // Při kliknutí na kartu (mimo tlačítko rezervace) přejde na stránku rezervace
            card.addEventListener('click', function(e) {
                if (e.target === reserveBtn || reserveBtn.contains(e.target)) return;
                window.location.href = reserveLink;
            });
        });
    }
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

    // Helper functions from original code
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

    // Event listener pro změnu velikosti okna
    window.addEventListener('resize', function() {
        setupMobileCardClicks();
        setupTooltips();
    });
});