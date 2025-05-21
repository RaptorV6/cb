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
            const movieIdInput = document.getElementById('movie-id'); // Skryté pole pro ID
            const modalTitle = movieModal.querySelector('.modal-title'); // Nadpis modalu

            // Add pagination state variables
            let allMoviesData = []; // Pole pro uložení načtených dat filmů
            let currentPage = 1;
            const moviesPerPage = 10; // Number of movies per page

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

            // Odeslání formuláře (Add / Update)
            movieForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                const formData = new FormData();
                const movieId = movieIdInput.value;
                const formAction = movieId ? 'update' : 'add'; // Rozlišení akce

                formData.append('action', formAction);
                if (movieId) {
                    formData.append('id', movieId); // Přidat ID pro update
                }

                // Základní údaje
                const title = document.getElementById('movie-title').value;
                const duration = document.getElementById('movie-duration').value;
                const screeningDateTime = document.getElementById('movie-datetime').value;
                const description = document.getElementById('movie-description').value;
                const genreInputVal = document.getElementById('movie-genre').value.trim(); // Získat i hodnotu z inputu, pokud nebyl přidán tag

                // Povinná pole
                if (!title || !duration || !screeningDateTime) {
                    alert('Vyplňte prosím všechna povinná pole (název, délka, datum a čas)');
                    return;
                }

                // Rozdělení data a času a validace
                const parts = screeningDateTime.split('T');
                if (parts.length !== 2 || !parts[0] || !parts[1]) {
                    alert('Datum a čas promítání není ve správném formátu (očekáváno YYYY-MM-DDTHH:MM).');
                    return; // Zastavit odesílání, pokud formát není správný
                }
                const datePart = parts[0];
                const timePart = parts[1];

                formData.append('title', title);
                formData.append('duration', duration);
                formData.append('screening_date', datePart); // Odeslat pouze datum
                formData.append('screening_time', JSON.stringify([timePart])); // Odeslat čas jako JSON pole s jednou hodnotou
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
                    return; // Žánr je nyní povinný
                }
                formData.append('genre', genres.join(', ')); // Odeslat jako string oddělený čárkou

                // Přidání obrázku do FormData, pokud byl vybrán
                const imageInput = document.getElementById('movie-image');
                const imagePreview = imageUpload.querySelector('img');
                if (imageInput.files[0]) {
                    // Pokud je soubor, čteme ho jako base64
                    const reader = new FileReader();
                    reader.readAsDataURL(imageInput.files[0]);
                    await new Promise((resolve, reject) => {
                        reader.onload = () => {
                            formData.append('image', reader.result); // Odeslat jako base64 data URI
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
                    console.log('Server response:', result);

                    if (result.status === 'success') {
                        showToast(result.message, 'success');
                        closeModals();
                        loadMovies(); // Znovu načíst po úspěšné akci
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

            // Načtení filmů z API (api_endpoint.php)
            async function loadMovies() {
                // Zobrazit loading indikátor
                const loadingIndicator = document.getElementById('movies-loading');
                const tableBody = document.querySelector('.admin-table tbody');
                const cardsContainer = document.querySelector('.movies-cards');
                if (loadingIndicator) loadingIndicator.style.display = 'block';
                if (tableBody) tableBody.innerHTML = ''; // Vyčistit před načítáním
                if (cardsContainer) cardsContainer.innerHTML = ''; // Vyčistit před načítáním

                try {
                    const response = await fetch('api_endpoint.php'); // Použít správný endpoint
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const movies = await response.json();
                    allMoviesData = movies; // Uložit data pro pozdější použití (edit)

                    if (loadingIndicator) loadingIndicator.style.display = 'none'; // Skrýt loading

                    // Zpracování odpovědi - může obsahovat 'status' => 'error'
                    if (movies.status === 'error') {
                        console.error('Chyba při načítání filmů:', movies.message);
                        showToast('Nepodařilo se načíst filmy: ' + movies.message, 'error');
                        return;
                    }

                    if (Array.isArray(movies)) {
                        // Setup pagination
                        setupPagination();
                        // Display first page
                        displayMoviesPage(currentPage);
                    } else {
                        console.error('Neplatná odpověď ze serveru:', movies);
                        showToast('Obdržena neplatná odpověď ze serveru.', 'error');
                    }
                } catch (error) {
                    console.error('Chyba při načítání filmů:', error);
                    showToast('Chyba při komunikaci se serverem při načítání filmů.', 'error');
                    if (loadingIndicator) loadingIndicator.style.display = 'none'; // Skrýt loading i při chybě
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

                // Clear pagination container
                paginationContainer.innerHTML = '';

                // Add page buttons
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
                        // Add dots for pagination
                        const dots = document.createElement('span');
                        dots.className = 'pagination-dots';
                        dots.textContent = '...';
                        paginationContainer.appendChild(dots);
                    }
                }

                // Add next button if there are pages
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
                            // Řádek pro desktop tabulku
                            const row = document.createElement('tr');
                            row.innerHTML = `
                <td>
                    <div class="movie-name-with-image">
                        ${movie.image ? 
                            `<img src="data:image/jpeg;base64,${movie.image}" alt="${movie.title}">` :
                            '<div class="no-image">No image</div>'
                        }
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

            // Karta pro mobilní zobrazení
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.innerHTML = `
                <div class="movie-header">
                    ${movie.image ? 
                        `<img src="data:image/jpeg;base64,${movie.image}" alt="${movie.title}" class="movie-image">` :
                        '<div class="no-image">No image</div>'
                    }
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
                    // Alternativně: Zavolat API pro načtení detailu filmu podle ID
                }
            });
        });

        // Delete tlačítka
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                // Najít název filmu bezpečněji
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
        const cancelBtn = deleteModal.querySelector('.cancel-btn'); // Přidáno pro odpojení listeneru
        const closeBtn = deleteModal.querySelector('.close-btn'); // Přidáno pro odpojení listeneru

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
                loadMovies(); // Znovu načíst seznam filmů
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Chyba při mazání filmu:', error);
            showToast(`Chyba při mazání filmu: ${error.message}`, 'error');
            closeModals(); // Zavřít modal i při chybě
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
        movieIdInput.value = ''; // Vyčistit ID
        modalTitle.textContent = 'Přidat nový film'; // Resetovat nadpis
        genreTags.innerHTML = '';
        imageUpload.innerHTML = `
            <div class="upload-icon">📷</div>
            <div>Nahrát obrázek</div>
        `;
        document.getElementById('movie-datetime').value = ''; // Reset datetime pole
    }

    // Pomocná funkce pro formátování data a času
    function formatDateTime(dateStr, timeStr) {
        if (!dateStr) return 'N/A';
        
        try {
            const date = new Date(dateStr);
            
            // Pokud máme i čas, přidáme ho
            let timeFormatted = '';
            if (timeStr) {
                // Pokud je time JSON string, zpracujeme ho
                try {
                    const parsedTime = JSON.parse(timeStr);
                    if (Array.isArray(parsedTime) && parsedTime.length > 0) {
                        timeFormatted = ' ' + parsedTime[0].substring(0, 5); // HH:MM
                    } else {
                        timeFormatted = ' ' + timeStr.substring(0, 5); // HH:MM
                    }
                } catch (e) {
                    // Pokud nejde o JSON, použijeme přímo
                    timeFormatted = ' ' + timeStr.substring(0, 5); // HH:MM
                }
            }
            
            // Použití Intl pro lokalizovaný formát data
            const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
            return new Intl.DateTimeFormat('cs-CZ', options).format(date) + timeFormatted;
        } catch (e) {
            console.error("Chyba formátování data:", e);
            return dateStr; // Vrať původní string v případě chyby
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
        movieIdInput.value = ''; // Vyčistit ID
        modalTitle.textContent = 'Přidat nový film'; // Resetovat nadpis
        genreTags.innerHTML = '';
        imageUpload.innerHTML = `
            <div class="upload-icon">📷</div>
            <div>Nahrát obrázek</div>
        `;
        document.getElementById('movie-datetime').value = ''; // Reset datetime pole
    }
    
    function showToast(message, type = 'success', duration = 3000) {
        window.showToast(message, type, duration);
    }

    // --- Funkce pro úpravu filmu ---
    function editMovie(movieData) {
        resetForm(); // Nejprve resetovat formulář

        // Nastavit hodnoty formuláře
        movieIdInput.value = movieData.id_screening;
        modalTitle.textContent = 'Upravit film'; // Změnit nadpis modalu
        document.getElementById('movie-title').value = movieData.title || '';
        document.getElementById('movie-duration').value = movieData.duration || '';
        document.getElementById('movie-description').value = movieData.description || '';
        
        // Vyplnit datum a čas - potřebujeme formát YYYY-MM-DDTHH:MM
        if (movieData.screening_date) {
            try {
                let timeStr = movieData.screening_time || '00:00:00';
                // Pokud je čas JSON string s polem, extrahujeme první čas
                try {
                    const parsedTime = JSON.parse(timeStr);
                    if (Array.isArray(parsedTime) && parsedTime.length > 0) {
                        timeStr = parsedTime[0];
                    }
                } catch (e) {
                    // Pokud nejde o JSON, použijeme přímo
                }
                
                // Formátování pro datetime-local input (YYYY-MM-DDTHH:MM)
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
        genreTags.innerHTML = ''; // Nejprve vyčistit tagy
        if (movieData.genre && movieData.genre !== 'Nezařazeno') {
            movieData.genre.split(',').forEach(g => addGenreTag(g.trim()));
        }
        document.getElementById('movie-genre').value = ''; // Vyčistit input pro žánr

        // Zobrazit náhled obrázku, pokud existuje
        if (movieData.image) {
            imageUpload.innerHTML = `<img src="data:image/jpeg;base64,${movieData.image}" alt="Náhled" style="max-width: 100%; max-height: 100%;">`;
        }

        // Otevřít modal
        movieModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
});