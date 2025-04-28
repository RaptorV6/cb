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

                // Časy promítání - odstraněno

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

            // Přidávání časů promítání - odstraněno

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
                <td>${movie.genre || 'N/A'}</td>
                <td>${movie.duration} min</td>
                <td>${formatDateTime(movie.screening_datetime)}</td>
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
                        <span class="datetime-label">Promítání:</span> ${formatDateTime(movie.screening_datetime)}
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
        document.getElementById('movie-datetime').value = ''; // Reset datetime pole

        // Reset časů - odstraněno
    }

    // Pomocná funkce pro formátování data a času
    function formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return 'N/A';
        try {
            const date = new Date(dateTimeStr);
            // Ověření platnosti data
            if (isNaN(date.getTime())) {
                // Pokud je formát nekompatibilní s new Date(), zkusíme parsovat manuálně
                // Očekáváme formát YYYY-MM-DD HH:MM:SS nebo YYYY-MM-DDTHH:MM
                const parts = dateTimeStr.split(/[\sT]/);
                if (parts.length >= 2) {
                    const dateParts = parts[0].split('-');
                    const timeParts = parts[1].split(':');
                    if (dateParts.length === 3 && timeParts.length >= 2) {
                         // Sestavení data pro český formát
                         return `${parseInt(dateParts[2])}.${parseInt(dateParts[1])}.${dateParts[0]} ${timeParts[0]}:${timeParts[1]}`;
                    }
                }
                return dateTimeStr; // Fallback na původní string, pokud parsování selže
            }
            // Použití Intl pro lokalizovaný formát
            const options = {
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            };
            return new Intl.DateTimeFormat('cs-CZ', options).format(date);
        } catch (e) {
            console.error("Chyba formátování data:", dateTimeStr, e);
            return dateTimeStr; // Vrať původní string v případě chyby
        }
    }

    // Init - odstraněno volání addTimeInput

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
        if (movieData.screening_datetime) {
             try {
                 const date = new Date(movieData.screening_datetime);
                 if (!isNaN(date.getTime())) {
                     // Formátování pro datetime-local input (YYYY-MM-DDTHH:MM)
                     const year = date.getFullYear();
                     const month = (date.getMonth() + 1).toString().padStart(2, '0');
                     const day = date.getDate().toString().padStart(2, '0');
                     const hours = date.getHours().toString().padStart(2, '0');
                     const minutes = date.getMinutes().toString().padStart(2, '0');
                     document.getElementById('movie-datetime').value = `${year}-${month}-${day}T${hours}:${minutes}`;
                 } else {
                     // Pokud new Date() selže, zkusíme zachovat původní hodnotu, pokud je v očekávaném formátu
                     if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(movieData.screening_datetime)) {
                         document.getElementById('movie-datetime').value = movieData.screening_datetime;
                     } else {
                         console.warn("Nepodařilo se převést screening_datetime do formátu YYYY-MM-DDTHH:MM:", movieData.screening_datetime);
                         document.getElementById('movie-datetime').value = ''; // Resetovat, pokud formát není správný
                     }
                 }
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

        // Časy - odstraněno

        // Zobrazit náhled obrázku, pokud existuje
        if (movieData.image) {
            imageUpload.innerHTML = `<img src="data:image/jpeg;base64,${movieData.image}" alt="Náhled" style="max-width: 100%; max-height: 100%;">`;
        }

        // Otevřít modal
        movieModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

});