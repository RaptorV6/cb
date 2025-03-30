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

            let allMoviesData = []; // Pole pro uložení načtených dat filmů

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
                const dateFrom = document.getElementById('date-from').value;
                const description = document.getElementById('movie-description').value;

                // Povinná pole
                if (!title || !duration || !dateFrom) {
                    alert('Vyplňte prosím všechna povinná pole (název, délka, datum)');
                    return;
                }

                formData.append('title', title);
                formData.append('duration', duration);
                formData.append('screening_date', dateFrom);
                formData.append('description', description);

                // Žánry
                const genres = Array.from(genreTags.querySelectorAll('.genre-tag'))
                    .map(tag => tag.textContent.replace('×', '').trim())
                    .filter(genre => genre);
                formData.append('genre', genres.length ? genres.join(', ') : 'Nezařazeno');

                // Časy promítání
                const times = Array.from(document.querySelectorAll('.time-input'))
                    .map(input => input.value)
                    .filter(time => time);
                if (!times.length) {
                    alert('Přidejte prosím alespoň jeden čas promítání');
                    return;
                }
                formData.append('screening_time', JSON.stringify(times));

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


                // Debug výpis - POZOR: Může logovat base64 obrázek!
                // console.log('Odesílaná data:', Object.fromEntries(formData));

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
                        alert(result.message);
                        closeModals();
                        loadMovies(); // Znovu načíst po úspěšné akci
                    } else {
                        throw new Error(result.message || 'Neznámá chyba serveru.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert(`Chyba při ${formAction === 'add' ? 'přidávání' : 'aktualizaci'} filmu: ${error.message}`);
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
                        alert('Prosím vyberte pouze obrázky');
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function(e) {
                        imageUpload.innerHTML = `<img src="${e.target.result}" alt="Náhled" style="max-width: 100%; max-height: 100%;">`;
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Přidávání časů promítání
            document.getElementById('add-time').addEventListener('click', addTimeInput);

            function addTimeInput(value = '') {
                const timeGroup = document.createElement('div');
                timeGroup.className = 'time-group';
                timeGroup.innerHTML = `
            <input type="time" class="form-input time-input" value="${value}">
            <button type="button" class="remove-time">&times;</button>
        `;

                const timesContainer = document.getElementById('times-container');
                timesContainer.insertBefore(timeGroup, document.getElementById('add-time'));

                timeGroup.querySelector('.remove-time').addEventListener('click', function() {
                    const timeGroups = document.querySelectorAll('.time-group');
                    if (timeGroups.length > 1) {
                        timeGroup.remove();
                    } else {
                        timeGroup.querySelector('input').value = '';
                    }
                });
            }

            // Načtení filmů z API (api_endpoint.php)
            async function loadMovies() {
                // Zobrazit loading indikátor (předpokládáme existenci #movies-loading)
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
                        alert('Nepodařilo se načíst filmy: ' + movies.message);
                        return;
                    }

                    if (Array.isArray(movies)) {
                        updateMoviesUI(movies);
                    } else {
                        console.error('Neplatná odpověď ze serveru:', movies);
                        alert('Obdržena neplatná odpověď ze serveru.');
                    }
                } catch (error) {
                    console.error('Chyba při načítání filmů:', error);
                    alert('Chyba při komunikaci se serverem při načítání filmů.');
                    if (loadingIndicator) loadingIndicator.style.display = 'none'; // Skrýt loading i při chybě
                }
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
                <td>${movie.genre}</td>
                <td>${movie.duration} min</td>
                <td>${formatDate(movie.screening_date)}</td>
                <td>${formatTime(movie.screening_time)}</td>
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
                    <div class="movie-dates">
                        <div><span class="date-label">Datum:</span> ${formatDate(movie.screening_date)}</div>
                        <div><span class="time-label">Časy:</span> ${formatTime(movie.screening_time)}</div>
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
                    alert('Data filmu pro úpravu nebyla nalezena.');
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
                alert(result.message);
                closeModals();
                loadMovies(); // Znovu načíst seznam filmů
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Chyba při mazání filmu:', error);
            alert(`Chyba při mazání filmu: ${error.message}`);
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

        // Reset časů
        const timeGroups = document.querySelectorAll('.time-group');
        timeGroups.forEach((group, index) => {
            if (index > 0) group.remove();
        });
        if (timeGroups.length === 0) {
            addTimeInput();
        } else {
            timeGroups[0].querySelector('input').value = '';
        }
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('cs-CZ');
    }

    function formatTime(timeStr) {
        if (!timeStr) return '';
        return timeStr;
    }

    // Init
    if (!document.querySelector('.time-group')) {
        addTimeInput();
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
        document.getElementById('date-from').value = movieData.screening_date || '';
        // document.getElementById('date-to').value = ''; // 'date-to' není v DB, nechat prázdné nebo odstranit z formuláře?

        // Vyplnit žánry
        if (movieData.genre && movieData.genre !== 'Nezařazeno') {
            movieData.genre.split(',').forEach(g => addGenreTag(g.trim()));
        }

        // Vyplnit časy (očekáváme jeden čas)
        const timeInput = document.querySelector('.time-input');
        if (timeInput && movieData.screening_time) {
             // Zajistit správný formát HH:MM
             const timeParts = movieData.screening_time.split(':');
             if (timeParts.length >= 2) {
                 timeInput.value = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
             } else {
                 timeInput.value = movieData.screening_time; // Fallback
             }
        }
        // Odstranit případné další prázdné time inputy přidané resetem
        document.querySelectorAll('.time-group').forEach((group, index) => {
            if (index > 0 && !group.querySelector('input').value) {
                group.remove();
            }
        });


        // Zobrazit náhled obrázku, pokud existuje
        if (movieData.image) {
            imageUpload.innerHTML = `<img src="data:image/jpeg;base64,${movieData.image}" alt="Náhled" style="max-width: 100%; max-height: 100%;">`;
        }

        // Otevřít modal
        movieModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

});