// Opravy pro js/admin.js
document.addEventListener('DOMContentLoaded', function() {
            // Základní reference na elementy
            const movieModal = document.getElementById('movie-modal');
            const deleteModal = document.getElementById('delete-modal');
            const addMovieBtn = document.getElementById('add-movie-btn');
            const movieForm = document.getElementById('movie-form');
            const genreInput = document.getElementById('movie-genre');
            const genreTags = document.getElementById('genre-tags');
            const imageUpload = document.getElementById('image-upload');
            const movieImage = document.getElementById('movie-image');
            const movieIdInput = document.getElementById('movie-id');
            const modalTitle = movieModal.querySelector('.modal-title');

            // State pro řazení
            let sortField = null;
            let sortDirection = 'asc';
            let allMoviesData = [];
            let currentPage = 1;
            const moviesPerPage = 10;

            // Načtení filmů při startu
            loadMovies();

            // Přidání nového filmu - otevření modalu
            addMovieBtn.addEventListener('click', function() {
                resetForm();
                movieModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            // Zavření modálů
            document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
                btn.addEventListener('click', closeModals);
            });

            // Přidání event listenerů na záhlaví tabulky pro řazení
            const tableHeaders = document.querySelectorAll('.admin-table th');
            tableHeaders.forEach(th => {
                const field = getFieldFromHeaderText(th.textContent.trim());
                if (field) {
                    th.style.cursor = 'pointer';
                    th.addEventListener('click', () => {
                        sortMovies(field);
                    });
                    // Přidat indikátor řazení (šipky)
                    th.innerHTML = `${th.textContent.trim()} <span class="sort-indicator"></span>`;
                }
            });

            // Převede text záhlaví na název pole v datech
            function getFieldFromHeaderText(text) {
                switch (text) {
                    case 'Název':
                        return 'title';
                    case 'Žánr':
                        return 'genre';
                    case 'Délka':
                        return 'duration';
                    case 'Datum a čas promítání':
                        return 'screening_date';
                    default:
                        return null;
                }
            }

            // Funkce pro řazení filmů
            function sortMovies(field) {
                // Resetujeme indikátory u všech záhlaví
                document.querySelectorAll('.sort-indicator').forEach(indicator => {
                    indicator.textContent = '';
                });

                // Nastavíme nový směr řazení
                if (sortField === field) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortField = field;
                    sortDirection = 'asc';
                }

                // Aktualizujeme indikátor řazení u aktivního záhlaví
                const activeHeader = Array.from(tableHeaders).find(th => getFieldFromHeaderText(th.textContent.trim()) === field);
                if (activeHeader) {
                    const indicator = activeHeader.querySelector('.sort-indicator');
                    indicator.textContent = sortDirection === 'asc' ? ' ↑' : ' ↓';
                }

                // Seřadíme data
                allMoviesData.sort((a, b) => {
                    let valA, valB;

                    // Speciální zacházení pro datum a čas
                    if (field === 'screening_date') {
                        const dateA = new Date(a.screening_date + 'T' + (typeof a.screening_time === 'string' ? a.screening_time : '00:00:00'));
                        const dateB = new Date(b.screening_date + 'T' + (typeof b.screening_time === 'string' ? b.screening_time : '00:00:00'));
                        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
                    }

                    // Pro číselné hodnoty
                    if (field === 'duration') {
                        valA = parseInt(a[field], 10) || 0;
                        valB = parseInt(b[field], 10) || 0;
                    } else {
                        // Pro textové hodnoty
                        valA = (a[field] || '').toString().toLowerCase();
                        valB = (b[field] || '').toString().toLowerCase();
                    }

                    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                });

                // Zobrazíme seřazená data
                displayMoviesPage(currentPage);
            }

            // Odeslání formuláře (Add / Update)
            movieForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                const formData = new FormData();
                const movieId = movieIdInput.value;
                const formAction = movieId ? 'update' : 'add';

                formData.append('action', formAction);
                if (movieId) {
                    formData.append('id', movieId);
                }

                // Základní údaje
                const title = document.getElementById('movie-title').value;
                const duration = document.getElementById('movie-duration').value;
                const screeningDateTime = document.getElementById('movie-datetime').value;
                const description = document.getElementById('movie-description').value;
                const genreInputVal = document.getElementById('movie-genre').value.trim();

                // Povinná pole
                if (!title || !duration || !screeningDateTime) {
                    alert('Vyplňte prosím všechna povinná pole (název, délka, datum a čas)');
                    return;
                }

                // Rozdělení data a času a validace
                const parts = screeningDateTime.split('T');
                if (parts.length !== 2 || !parts[0] || !parts[1]) {
                    alert('Datum a čas promítání není ve správném formátu (očekáváno YYYY-MM-DDTHH:MM).');
                    return;
                }
                const datePart = parts[0];
                const timePart = parts[1];

                formData.append('title', title);
                formData.append('duration', duration);
                formData.append('screening_date', datePart);
                formData.append('screening_time', JSON.stringify([timePart]));
                formData.append('description', description);

                // Žánry - sběr z tagů
                let genres = Array.from(genreTags.querySelectorAll('.genre-tag'))
                    .map(tag => tag.textContent.replace('×', '').trim())
                    .filter(genre => genre);

                // Pokud je něco v inputu a není to už v tazích, přidej to
                if (genreInputVal && !genres.map(g => g.toLowerCase()).includes(genreInputVal.toLowerCase())) {
                    genres.push(genreInputVal);
                }

                if (!genres.length) {
                    alert('Přidejte prosím alespoň jeden žánr.');
                    return;
                }
                formData.append('genre', genres.join(', '));

                // Přidání obrázku do FormData, pokud byl vybrán
                const imageInput = document.getElementById('movie-image');
                const imagePreview = imageUpload.querySelector('img');
                if (imageInput.files[0]) {
                    // Pokud je soubor, čteme ho jako base64
                    const reader = new FileReader();
                    reader.readAsDataURL(imageInput.files[0]);
                    await new Promise((resolve, reject) => {
                        reader.onload = () => {
                            formData.append('image', reader.result);
                            resolve();
                        };
                        reader.onerror = reject;
                    });
                } else if (imagePreview && imagePreview.src.startsWith('data:image')) {
                    // Pokud není nový soubor, ale je náhled (při úpravě), pošli stávající base64
                    formData.append('image', imagePreview.src);
                }

                try {
                    // Použít api_endpoint.php
                    const response = await fetch('api_endpoint.php', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();

                    if (result.status === 'success') {
                        showToast(result.message, 'success');
                        closeModals();
                        loadMovies();
                    } else {
                        showToast(result.message, 'error');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showToast(`Chyba při ${formAction === 'add' ? 'přidávání' : 'aktualizaci'} filmu: ${error.message}`, 'error');
                }
            });

            // Správa žánrů
            genreInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addGenreTag(this.value);
                    this.value = '';
                }
            });

            function addGenreTag(genre) {
                genre = genre.trim();
                if (!genre) return;

                // Kontrola duplicity
                const existingTags = Array.from(genreTags.querySelectorAll('.genre-tag'))
                    .map(tag => tag.textContent.replace('×', '').trim().toLowerCase());

                if (existingTags.includes(genre.toLowerCase())) return;

                const tag = document.createElement('div');
                tag.className = 'genre-tag';
                tag.innerHTML = `
            ${genre}
            <button type="button" class="remove-tag">&times;</button>
        `;

                tag.querySelector('.remove-tag').addEventListener('click', () => tag.remove());
                genreTags.appendChild(tag);
            }

            // Správa obrázku
            imageUpload.addEventListener('click', () => movieImage.click());

            movieImage.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    if (!file.type.startsWith('image/')) {
                        showToast('Prosím vyberte pouze obrázky', 'error');
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function(e) {
                        imageUpload.innerHTML = `<img src="${e.target.result}" alt="Náhled" style="max-width: 100%; max-height: 100%;">`;
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Načtení filmů z API
            async function loadMovies() {
                const loadingIndicator = document.getElementById('movies-loading');
                const tableBody = document.querySelector('.admin-table tbody');
                const cardsContainer = document.querySelector('.movies-cards');
                if (loadingIndicator) loadingIndicator.style.display = 'block';
                if (tableBody) tableBody.innerHTML = '';
                if (cardsContainer) cardsContainer.innerHTML = '';

                try {
                    const response = await fetch('api_endpoint.php?optimized=true', { // PŘIDAT ?optimized=true
                        method: 'GET'
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const movies = await response.json();
                    allMoviesData = movies;

                    if (loadingIndicator) loadingIndicator.style.display = 'none';

                    if (movies.status === 'error') {
                        console.error('Chyba při načítání filmů:', movies.message);
                        showToast('Nepodařilo se načíst filmy: ' + movies.message, 'error');
                        return;
                    }

                    if (Array.isArray(movies)) {
                        setupPagination();
                        // Pokud bylo nastaveno řazení, aplikujeme ho
                        if (sortField) {
                            sortMovies(sortField);
                        } else {
                            displayMoviesPage(currentPage);
                        }
                    } else {
                        console.error('Neplatná odpověď ze serveru:', movies);
                        showToast('Obdržena neplatná odpověď ze serveru.', 'error');
                    }
                } catch (error) {
                    console.error('Chyba při načítání filmů:', error);
                    showToast('Chyba při komunikaci se serverem při načítání filmů.', 'error');
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                }
            }

            // Function to display a specific page of movies
            function displayMoviesPage(page) {
                const startIndex = (page - 1) * moviesPerPage;
                const endIndex = Math.min(startIndex + moviesPerPage, allMoviesData.length);
                const moviesToShow = allMoviesData.slice(startIndex, endIndex);

                updateMoviesUI(moviesToShow);
                updateActivePaginationButton();
            }

            // Setup pagination based on total movies
            function setupPagination() {
                const totalPages = Math.ceil(allMoviesData.length / moviesPerPage);
                const paginationContainer = document.querySelector('.pagination');

                paginationContainer.innerHTML = '';

                for (let i = 1; i <= totalPages; i++) {
                    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                        const btn = document.createElement('button');
                        btn.className = 'page-btn';
                        if (i === currentPage) btn.classList.add('active');
                        btn.textContent = i;
                        btn.addEventListener('click', function() {
                            currentPage = i;
                            displayMoviesPage(currentPage);
                        });
                        paginationContainer.appendChild(btn);
                    } else if ((i === 2 && currentPage > 3) || (i === totalPages - 1 && currentPage < totalPages - 2)) {
                        const dots = document.createElement('span');
                        dots.className = 'pagination-dots';
                        dots.textContent = '...';
                        paginationContainer.appendChild(dots);
                    }
                }

                if (totalPages > 0) {
                    const nextBtn = document.createElement('button');
                    nextBtn.className = 'next-btn';
                    nextBtn.innerHTML = '→';
                    nextBtn.addEventListener('click', function() {
                        if (currentPage < totalPages) {
                            currentPage++;
                            displayMoviesPage(currentPage);
                        }
                    });
                    paginationContainer.appendChild(nextBtn);
                }
            }

            // Update the active pagination button
            function updateActivePaginationButton() {
                const buttons = document.querySelectorAll('.page-btn');
                buttons.forEach(btn => {
                    if (parseInt(btn.textContent) === currentPage) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }

            // Aktualizace UI s filmy
            function updateMoviesUI(movies) {
                const tableBody = document.querySelector('.admin-table tbody');
                const cardsContainer = document.querySelector('.movies-cards');

                tableBody.innerHTML = '';
                cardsContainer.innerHTML = '';

                movies.forEach(movie => {
                            // DESKTOP řádek - optimalizovaný obrázek
                            const row = document.createElement('tr');

                            const imageHtml = movie.image ?
                                `<img src="data:image/jpeg;base64,${movie.image}" alt="${movie.title}">` :
                                movie.has_image ?
                                `<img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="60" viewBox="0 0 40 60">
                            <defs>
                                <linearGradient id="adminGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:#0f1419;stop-opacity:1" />
                                </linearGradient>
                                <linearGradient id="adminShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style="stop-color:rgba(12,184,0,0);stop-opacity:0" />
                                    <stop offset="50%" style="stop-color:rgba(12,184,0,0.3);stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:rgba(12,184,0,0);stop-opacity:0" />
                                    <animateTransform attributeName="gradientTransform" type="translate"
                                        values="-40 0; 40 0; -40 0" dur="2s" repeatCount="indefinite"/>
                                </linearGradient>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#adminGrad)" rx="2"/>
                            <circle cx="20" cy="25" r="8" fill="none" stroke="#0cb800" stroke-width="1">
                                <animate attributeName="stroke-dasharray" values="0 50; 25 25; 0 50" dur="2s" repeatCount="indefinite"/>
                            </circle>
                            <circle cx="20" cy="25" r="3" fill="#0cb800"/>
                            <text x="20" y="45" text-anchor="middle" fill="#888" font-size="6">Loading</text>
                            <rect width="100%" height="100%" fill="url(#adminShimmer)" rx="2"/>
                        </svg>
                    `)}" alt="Loading..." data-movie-id="${movie.id_screening}" style="opacity: 0.8;">` :
                    '<div class="no-image">No image</div>';

            row.innerHTML = `
                <td>
                    <div class="movie-name-with-image">
                        ${imageHtml}
                        <span>${movie.title}</span>
                    </div>
                </td>
                <td>${movie.genre || 'N/A'}</td>
                <td>${movie.duration} min</td>
                <td>${formatDateTime(movie.screening_date, movie.screening_time)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" data-id="${movie.id_screening}">Upravit</button>
                        <button class="delete-btn" data-id="${movie.id_screening}">Smazat</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);

            // MOBILE karta - optimalizovaný obrázek
            const card = document.createElement('div');
            card.className = 'movie-card';

            const cardImageHtml = movie.image ?
                `<img src="data:image/jpeg;base64,${movie.image}" alt="${movie.title}" class="movie-image">` :
                movie.has_image ?
                    `<img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="90" viewBox="0 0 60 90">
                            <defs>
                                <linearGradient id="adminMobileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:#0f1419;stop-opacity:1" />
                                </linearGradient>
                                <linearGradient id="adminMobileShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style="stop-color:rgba(12,184,0,0)" />
                                    <stop offset="50%" style="stop-color:rgba(12,184,0,0.3)" />
                                    <stop offset="100%" style="stop-color:rgba(12,184,0,0)" />
                                    <animateTransform attributeName="gradientTransform" type="translate"
                                        values="-60 0; 60 0; -60 0" dur="2s" repeatCount="indefinite"/>
                                </linearGradient>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#adminMobileGrad)" rx="4"/>
                            <circle cx="30" cy="35" r="12" fill="none" stroke="#0cb800" stroke-width="1.5">
                                <animate attributeName="stroke-dasharray" values="0 75; 37 37; 0 75" dur="2s" repeatCount="indefinite"/>
                            </circle>
                            <circle cx="30" cy="35" r="4" fill="#0cb800"/>
                            <text x="30" y="65" text-anchor="middle" fill="#888" font-size="8">Loading</text>
                            <rect width="100%" height="100%" fill="url(#adminMobileShimmer)" rx="4"/>
                        </svg>
                    `)}" alt="Loading..." class="movie-image" data-movie-id="${movie.id_screening}" style="opacity: 0.8;">` :
                    '<div class="no-image">No image</div>';

            card.innerHTML = `
                <div class="movie-header">
                    ${cardImageHtml}
                    <div>
                        <div class="movie-title">${movie.title}</div>
                        <div class="movie-meta">${movie.genre} • ${movie.duration} min</div>
                    </div>
                </div>
                <div class="movie-details">
                    <div class="movie-datetime">
                        <span class="datetime-label">Promítání:</span> ${formatDateTime(movie.screening_date, movie.screening_time)}
                    </div>
                </div>
                <div class="movie-actions">
                    <button class="action-btn edit-btn" data-id="${movie.id_screening}">Upravit</button>
                    <button class="action-btn delete-btn" data-id="${movie.id_screening}">Smazat</button>
                </div>
            `;
            cardsContainer.appendChild(card);

            // LAZY LOADING pro admin
            if (movie.has_image && !movie.image) {
                const movieIndex = allMoviesData.indexOf(movie);
                setTimeout(() => {
                    loadImageLazyAdmin(movie.id_screening, row, card);
                }, 100 * movieIndex); // Postupné načítání
            }
        });

        // Přidání event listenerů pro akční tlačítka
        setupActionButtons();
    }

    // Nastavení event listenerů pro tlačítka
    function setupActionButtons() {
        // Edit tlačítka
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                // Najít data filmu v uloženém poli
                const movieData = allMoviesData.find(movie => movie.id_screening == id);
                if (movieData) {
                    editMovie(movieData);
                } else {
                    showToast('Data filmu pro úpravu nebyla nalezena.', 'error');
                }
            });
        });

        // Delete tlačítka
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const cardOrRow = this.closest('tr') || this.closest('.movie-card');
                let title = 'tento film';
                if (cardOrRow) {
                    const titleElement = cardOrRow.querySelector('.movie-title') || cardOrRow.querySelector('.movie-name-with-image span');
                    if (titleElement) {
                        title = titleElement.textContent.trim();
                    }
                }
                showDeleteConfirmation(id, title);
            });
        });
    }

    // Zobrazení potvrzení smazání
    function showDeleteConfirmation(id, title) {
        const deleteModal = document.getElementById('delete-modal');
        const movieNameSpan = document.getElementById('delete-movie-name');
        const confirmBtn = deleteModal.querySelector('.confirm-btn');
        const cancelBtn = deleteModal.querySelector('.cancel-btn');
        const closeBtn = deleteModal.querySelector('.close-btn');

        if (!deleteModal || !movieNameSpan || !confirmBtn || !cancelBtn || !closeBtn) {
            console.error('Chybí elementy v delete modalu!');
            showToast('Chybí elementy v delete modalu!', 'error');
            return;
        }

        movieNameSpan.textContent = title;

        // Odstranit starý listener, aby se neduplikoval
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        // Přidat nový listener
        newConfirmBtn.addEventListener('click', () => deleteMovie(id));

        // Zajistit zavření modalu
        cancelBtn.onclick = closeModals;
        closeBtn.onclick = closeModals;

        deleteModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Funkce pro smazání filmu
    async function deleteMovie(id) {
        try {
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('id', id);

            const response = await fetch('api_endpoint.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.status === 'success') {
                showToast(result.message, 'success');
                closeModals();
                loadMovies();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Chyba při mazání filmu:', error);
            showToast(`Chyba při mazání filmu: ${error.message}`, 'error');
            closeModals();
        }
    }

    // Helper funkce
    function closeModals() {
        movieModal.classList.remove('active');
        deleteModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function resetForm() {
        movieForm.reset();
        movieIdInput.value = '';
        modalTitle.textContent = 'Přidat nový film';
        genreTags.innerHTML = '';
        imageUpload.innerHTML = `
            <div class="upload-icon">📷</div>
            <div>Nahrát obrázek</div>
        `;
        document.getElementById('movie-datetime').value = '';
    }

    // Pomocná funkce pro formátování data a času
    function formatDateTime(dateStr, timeStr) {
        if (!dateStr) return 'N/A';

        try {
            const date = new Date(dateStr);

            // Pokud máme i čas, přidáme ho
            let timeFormatted = '';
            if (timeStr) {
                try {
                    const parsedTime = JSON.parse(timeStr);
                    if (Array.isArray(parsedTime) && parsedTime.length > 0) {
                        timeFormatted = ' ' + parsedTime[0].substring(0, 5);
                    } else {
                        timeFormatted = ' ' + timeStr.substring(0, 5);
                    }
                } catch (e) {
                    timeFormatted = ' ' + timeStr.substring(0, 5);
                }
            }

            const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
            const formattedDate = new Intl.DateTimeFormat('cs-CZ', options).format(date).replace(/\s/g, '');
            return formattedDate + ' ' + timeFormatted;
        } catch (e) {
            console.error("Chyba formátování data:", e);
            return dateStr;
        }
    }

    // OPRAVA: Problém s mizením obrázku při editaci filmu
    // Vylepšená funkce pro úpravu filmu
    function editMovie(movieData) {
        resetForm();

        // Nastavit hodnoty formuláře
        movieIdInput.value = movieData.id_screening;
        modalTitle.textContent = 'Upravit film';
        document.getElementById('movie-title').value = movieData.title || '';
        document.getElementById('movie-duration').value = movieData.duration || '';
        document.getElementById('movie-description').value = movieData.description || '';

        // Vyplnit datum a čas
        if (movieData.screening_date) {
            try {
                let timeStr = movieData.screening_time || '00:00:00';
                try {
                    const parsedTime = JSON.parse(timeStr);
                    if (Array.isArray(parsedTime) && parsedTime.length > 0) {
                        timeStr = parsedTime[0];
                    }
                } catch (e) {
                    // Pokud nejde o JSON, použijeme přímo
                }

                const dateTimeStr = `${movieData.screening_date}T${timeStr.substring(0, 5)}`;
                document.getElementById('movie-datetime').value = dateTimeStr;
            } catch (e) {
                console.error("Chyba při nastavování data a času pro úpravu:", e);
                document.getElementById('movie-datetime').value = '';
            }
        } else {
            document.getElementById('movie-datetime').value = '';
        }

        // Vyplnit žánry
        genreTags.innerHTML = '';
        if (movieData.genre && movieData.genre !== 'Nezařazeno') {
            movieData.genre.split(',').forEach(g => addGenreTag(g.trim()));
        }
        document.getElementById('movie-genre').value = '';

        // OPRAVA: Správné zachování obrázku při editaci
        if (movieData.image) {
            imageUpload.innerHTML = `<img src="data:image/jpeg;base64,${movieData.image}" alt="Náhled" style="max-width: 100%; max-height: 100%;">`;
        }

        movieModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function showToast(message, type = 'success', duration = 3000) {
        window.showToast(message, type, duration);
    }

    // Opravená lazy loading pro admin panel - BEZ optional chaining
    async function loadImageLazyAdmin(movieId, row, card) {
        try {
            const response = await fetch(`api_endpoint.php?action=image&id=${movieId}`);
            const result = await response.json();

            if (result.status === 'success' && result.image) {
                // Desktop tabulka
                if (row) {
                    const desktopImg = row.querySelector('img[data-movie-id]');
                    if (desktopImg) {
                        desktopImg.src = `data:image/jpeg;base64,${result.image}`;
                        desktopImg.style.opacity = '1';
                        desktopImg.style.transition = 'opacity 0.3s ease';
                    }
                }

                // Mobile karta
                if (card) {
                    const mobileImg = card.querySelector('img[data-movie-id]');
                    if (mobileImg) {
                        mobileImg.src = `data:image/jpeg;base64,${result.image}`;
                        mobileImg.style.opacity = '1';
                        mobileImg.style.transition = 'opacity 0.3s ease';
                    }
                }
            }
        } catch (error) {
            console.error('Chyba při načítání obrázku v admin:', error);
        }
    }
});