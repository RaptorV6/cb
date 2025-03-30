document.addEventListener('DOMContentLoaded', function() {
    // Prvky uživatelského menu
    const userIcon = document.getElementById('user-icon');
    const dropdownMenu = document.getElementById('dropdown-menu');

    // Filtrování a vyhledávání
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const filterSelect = document.getElementById('filter-select');
    const moviesWrapper = document.getElementById('movies-wrapper');
    const paginationBtns = document.querySelectorAll('.pagination-btn');
    const paginationNext = document.querySelector('.pagination-next');

    // Přidání funkcionality pro uživatelské menu
    userIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    });

    // Zavření menu při kliknutí mimo
    document.addEventListener('click', function() {
        if (dropdownMenu.classList.contains('active')) {
            dropdownMenu.classList.remove('active');
        }
    });

    // Zabránění šíření kliknutí v dropdown menu
    dropdownMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Funkce pro vyhledávání filmů
    function searchMovies() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filterValue = filterSelect.value;
        const movieCards = document.querySelectorAll('.movie-card');

        movieCards.forEach(card => {
            const title = card.querySelector('.movie-title').textContent.toLowerCase();
            const genre = card.querySelector('.movie-genre').textContent.toLowerCase();

            // Kontrola filtru kategorie
            let matchesFilter = true;
            if (filterValue !== 'all') {
                if (filterValue === 'upcoming' && !card.classList.contains('upcoming')) {
                    matchesFilter = false;
                } else if (filterValue === 'past' && !card.classList.contains('past')) {
                    matchesFilter = false;
                } else if (filterValue === 'now' && (card.classList.contains('past') || card.classList.contains('upcoming'))) {
                    matchesFilter = false;
                }
            }

            // Kontrola hledaného textu
            const isMatch = (title.includes(searchTerm) ||
                genre.includes(searchTerm)) && matchesFilter;

            card.style.display = isMatch ? '' : 'none';
        });

        // Kontrola, zda jsou nějaké filmy zobrazeny a případně zobrazení zprávy
        const visibleMovies = document.querySelectorAll('.movie-card[style="display: "]');

        let noResultsMsg = document.getElementById('no-results-message');
        if (visibleMovies.length === 0) {
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

    // Event listenery pro vyhledávání a filtrování
    searchBtn.addEventListener('click', searchMovies);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            searchMovies();
        }
    });

    filterSelect.addEventListener('change', searchMovies);

    // Funkce pro stránkování
    paginationBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Odstranění aktivní třídy ze všech tlačítek
            paginationBtns.forEach(b => b.classList.remove('active'));

            // Přidání aktivní třídy na kliknuté tlačítko
            this.classList.add('active');

            // Zde by normálně byla implementace skutečného stránkování
            // Pro účely ukázky jen posuneme k začátku stránky
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    paginationNext.addEventListener('click', function() {
        // Najdeme aktivní tlačítko
        const activeBtn = document.querySelector('.pagination-btn.active');
        const nextBtn = activeBtn.nextElementSibling;

        // Pokud existuje další tlačítko, klikneme na něj
        if (nextBtn && nextBtn.classList.contains('pagination-btn')) {
            nextBtn.click();
        }
    });

    // Tooltip pro dlouhé názvy filmů
    const movieTitles = document.querySelectorAll('.movie-title');
    movieTitles.forEach(title => {
        // Kontrola, zda je obsah delší než co se vejde do dvou řádků
        if (title.scrollHeight > title.clientHeight) {
            title.setAttribute('title', title.textContent);
        }
    });

    // Responzivní chování - detekce mobilního zobrazení
    function isMobileView() {
        return window.innerWidth < 768; // Breakpoint pro mobilní zobrazení
    }

    // Pro mobilní zařízení - kliknutí na celou kartu filmu
    function setupMobileCardClicks() {
        if (isMobileView()) {
            const movieCards = document.querySelectorAll('.movie-card:not(.past):not(.upcoming)');
            movieCards.forEach(card => {
                const reserveBtn = card.querySelector('.mobile-reserve .reserve-btn');
                if (!reserveBtn || reserveBtn.classList.contains('disabled')) return;

                const reserveLink = reserveBtn.getAttribute('href');

                // Přidáme event listener na celou kartu, ale vynecháme tlačítko
                card.addEventListener('click', function(e) {
                    // Pokud už je kliknuto přímo na tlačítko, nechceme duplikovat akci
                    if (e.target === reserveBtn || reserveBtn.contains(e.target)) {
                        return;
                    }

                    // Jinak přesměrujeme na odkaz rezervace
                    window.location.href = reserveLink;
                });
            });
        }
    }

    // Inicializace mobilních kliknutí
    setupMobileCardClicks();

    // Při změně velikosti okna aktualizujeme chování
    window.addEventListener('resize', function() {
        // Pokud bychom potřebovali reagovat na změnu zobrazení
        // Tento kód by se aktivoval při změně z mobilního na desktop zobrazení a naopak
    });
});