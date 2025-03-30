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

            // Odeslání formuláře
            movieForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                const formData = new FormData();
                formData.append('action', 'add');

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

                // Debug výpis
                console.log('Odesílaná data:');
                for (let [key, value] of formData.entries()) {
                    console.log(`${key}: ${value}`);
                }

                try {
                    const response = await fetch('movie_handlers.php', {
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
                        loadMovies();
                    } else {
                        throw new Error(result.message);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert(`Chyba při ukládání filmu: ${error.message}`);
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

            // Načtení filmů z API
            async function loadMovies() {
                try {
                    const response = await fetch('movie_handlers.php');
                    const movies = await response.json();

                    if (Array.isArray(movies)) {
                        updateMoviesUI(movies);
                    } else {
                        console.error('Neplatná odpověď ze serveru:', movies);
                    }
                } catch (error) {
                    console.error('Chyba při načítání filmů:', error);
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
                editMovie(id);
            });
        });

        // Delete tlačítka
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const title = this.closest('tr, .movie-card')
                    .querySelector('.movie-title, .movie-name-with-image span').textContent;
                showDeleteConfirmation(id, title);
            });
        });
    }

    // Helper funkce
    function closeModals() {
        movieModal.classList.remove('active');
        deleteModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function resetForm() {
        movieForm.reset();
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
});