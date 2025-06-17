document.addEventListener('DOMContentLoaded', function() {
            // Načtení rezervací při startu
            loadReservations();

            // Přepínání záložek
            const tabBtns = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');

            tabBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const tabId = this.getAttribute('data-tab');
                    switchTab(tabId);
                });
            });

            function switchTab(tabId) {
                // Aktualizace tlačítek
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

                // Aktualizace obsahu
                tabContents.forEach(c => c.classList.add('hidden'));
                const activeTab = document.getElementById(`${tabId}-tab`);
                activeTab.classList.remove('hidden');
            }

            // Načtení rezervací
            async function loadReservations() {
                // Zobrazit loading indikátor
                const loadingIndicator = document.getElementById('loading');
                const tabContents = document.querySelectorAll('.tab-content');
                loadingIndicator.style.display = 'flex';
                tabContents.forEach(c => c.classList.add('hidden')); // Skrýt záložky během načítání

                try {
                    const response = await fetch('reservation_handlers.php');
                    const result = await response.json();

                    if (response.ok && Array.isArray(result)) {
                        updateReservationsUI(result);

                        // DŮLEŽITÁ ZMĚNA: Nejprve zajistíme, že jsou všechny záložky správně inicializovány
                        tabContents.forEach(c => c.classList.add('hidden'));
                        const upcomingTab = document.getElementById('upcoming-tab');
                        upcomingTab.classList.remove('hidden');

                        // Aktivujeme záložku "aktuální" pomocí switchTab, která správně aktualizuje UI
                        const upcomingBtn = document.querySelector('[data-tab="upcoming"]');
                        tabBtns.forEach(b => b.classList.remove('active'));
                        upcomingBtn.classList.add('active');
                    } else {
                        console.error('Chyba při načítání rezervací:', result);
                        const errorMessage = result && result.message ? result.message : 'Nepodařilo se načíst rezervace. Zkuste to prosím znovu.';
                        showToast(errorMessage, 'error');
                        updateReservationsUI([]);
                    }
                } catch (error) {
                    console.error('Chyba při zpracování odpovědi rezervací:', error);
                    showToast('Došlo k chybě při komunikaci se serverem. Zkuste to prosím znovu.', 'error');
                    updateReservationsUI([]);
                } finally {
                    // Skrýt loading indikátor po načtení
                    loadingIndicator.style.display = 'none';
                }
            }

            // Aktualizace UI rezervací
            // Aktualizace UI rezervací
            function updateReservationsUI(reservations) {
                const upcomingTab = document.getElementById('upcoming-tab');
                const pastTab = document.getElementById('past-tab');

                // Vyčistíme kontejnery
                upcomingTab.querySelector('.reservation-list').innerHTML = '';
                pastTab.querySelector('.reservation-list').innerHTML = '';

                const now = new Date();
                let upcomingCount = 0;
                let pastCount = 0;

                // Filtrujeme pouze aktivní rezervace
                reservations = reservations.filter(reservation =>
                    reservation.status === undefined || reservation.status === 'active'
                );

                reservations.forEach(reservation => {
                    try {
                        // Vytvoření kompletního datetime z datumu a času projekce
                        let screeningDate = reservation.screening_date;
                        let screeningTime = reservation.screening_time;

                        // Zpracování času promítání
                        try {
                            const parsedTime = JSON.parse(screeningTime);
                            if (Array.isArray(parsedTime) && parsedTime.length > 0) {
                                screeningTime = parsedTime[0];
                            }
                        } catch (e) {
                            // Pokud není JSON, použij tak jak je
                        }

                        // Vytvoříme datum promítání
                        const screeningDateTime = new Date(`${screeningDate}T${screeningTime}`);

                        // DŮLEŽITÁ ZMĚNA: Pokud datum promítání je v minulosti, je to historie
                        const isPast = screeningDateTime < now;

                        // Vytvoříme kartu rezervace
                        const card = createReservationCard(reservation, isPast);

                        // Vložíme do správné záložky
                        if (isPast) {
                            pastTab.querySelector('.reservation-list').appendChild(card);
                            pastCount++;
                        } else {
                            upcomingTab.querySelector('.reservation-list').appendChild(card);
                            upcomingCount++;
                        }
                    } catch (e) {
                        console.error("Chyba při zpracování rezervace:", e);
                    }
                });

                console.log(`Aktuální: ${upcomingCount}, Historie: ${pastCount}`);

                // Zkontrolujeme prázdné stavy pro obě záložky
                if (upcomingCount === 0) {
                    showEmptyState(upcomingTab);
                }

                if (pastCount === 0) {
                    showEmptyState(pastTab);
                }
            }

            // Zobrazení prázdného stavu
            function showEmptyState(tab) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerHTML = `
            <div class="empty-icon">🗑️</div>
            <h3>Žádné rezervace</h3>
            <p>Zatím nemáte žádné rezervace v této kategorii.</p>
            <a href="index.php" class="browse-btn">Prohlédnout program</a>
        `;

                const reservationList = tab.querySelector('.reservation-list');
                reservationList.innerHTML = '';
                reservationList.appendChild(emptyState);
            }

            // Kontrola prázdného stavu
            function checkEmptyState(tab) {
                const cards = tab.querySelectorAll('.reservation-card');
                if (cards.length === 0) {
                    showEmptyState(tab);
                }
            }

            // Vytvoření karty rezervace
            // Vytvoření karty rezervace
            function createReservationCard(reservation, isPast) {
                const card = document.createElement('div');
                card.className = `reservation-card${isPast ? ' past' : ''}`;
                card.id = `reservation-${reservation.id_reservation}`;

                const screeningDate = new Date(reservation.screening_date);
                const formattedDate = screeningDate.toLocaleDateString('cs-CZ', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric'
                });

                // Funkce pro získání názvu místa podle čísla sedadla
                function getSeatLabel(seatNumber) {
                    const seatNum = parseInt(seatNumber);
                    switch (seatNum) {
                        case 1:
                            return "bobig | 1";
                        case 2:
                            return "židle | 2";
                        case 3:
                        case 4:
                        case 5:
                        case 6:
                        case 7:
                        case 8:
                            return `gauč | ${seatNum}`;
                        case 9:
                            return "křeslo | 9";
                        default:
                            return `místo | ${seatNum}`;
                    }
                }

                card.innerHTML = `
                    <div class="reservation-header">
                        <div class="movie-thumbnail-container">
                            ${reservation.image ? 
                                `<img src="data:image/jpeg;base64,${reservation.image}" alt="${reservation.movie_title || reservation.title}" class="movie-thumbnail">` :
                                `<img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="120"><rect width="100%" height="100%" fill="#666"/></svg>')}" alt="Loading..." class="movie-thumbnail" data-movie-id="${reservation.id_screening}">`
                            }
                        </div>
                        <div class="reservation-info">
                            <h3 class="movie-title">${reservation.movie_title || reservation.title}</h3>
                            <div class="movie-details">
                                <span class="movie-genre">${reservation.genre}</span>
                                <span class="movie-duration">${reservation.duration} min</span>
                            </div>
                            <div class="reservation-date">
                                <span class="date-icon">📅</span>
                                <span>${formattedDate}</span>
                                <span class="time-icon">🕒</span>
                                <span>${formatTime(reservation.screening_time)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="reservation-seats">
                        <h4>Rezervované místo</h4>
                        <div class="seats-grid">
                            <div class="seat">
                                <span class="seat-number">${getSeatLabel(reservation.seat_number)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="reservation-actions">
                        <a href="reserve.php?id=${reservation.id_screening}" class="view-btn">Zobrazit rezervaci</a>
                        ${!isPast ? `<button class="cancel-btn" data-id="${reservation.id_reservation}">Zrušit rezervaci</button>` : ''}
                    </div>
                `;

                // Přidání event listeneru pro zrušení rezervace
                const cancelBtn = card.querySelector('.cancel-btn');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', function() {
                        showCancelConfirmation(reservation.id_reservation, reservation.movie_title || reservation.title); 
                    });
                }

                // NOVÉ: Lazy load obrázků i v my-reservations
                if (reservation.has_image && !reservation.image) {
                    const imgElement = card.querySelector('.movie-thumbnail');
                    if (imgElement) loadImageLazyMyReservations(reservation.id_screening, imgElement);
                }

                return card;
            }

    // Zobrazení potvrzení zrušení
    function showCancelConfirmation(reservationId, movieTitle) {
        const cancelModal = document.getElementById('cancel-modal');
        document.getElementById('cancel-movie-name').textContent = movieTitle || 'tento film';
        
        const confirmBtn = cancelModal.querySelector('.confirm-cancel');
        confirmBtn.onclick = () => cancelReservation(reservationId);

        cancelModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Zrušení rezervace
    async function cancelReservation(reservationId) {
        try {
            const formData = new FormData();
            formData.append('action', 'cancel');
            formData.append('reservation_id', reservationId);

            const response = await fetch('reservation_handlers.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.status === 'success') {
                // Odstranění karty rezervace
                const card = document.getElementById(`reservation-${reservationId}`);
                if (card) {
                    const parentTab = card.closest('.tab-content');
                    card.remove();
                    
                    // Kontrola prázdného stavu
                    checkEmptyState(parentTab);
                }
                
                // Zavření modálu
                closeModals();
                
                showToast('Rezervace byla úspěšně zrušena.', 'success');
            } else {
                throw new Error(result.message || 'Nepodařilo se zrušit rezervaci.');
            }
        } catch (error) {
            console.error('Chyba při rušení rezervace:', error);
            showToast(error.message || 'Došlo k chybě při rušení rezervace.', 'error');
            closeModals();
        }
    }

    // Helper funkce
    function formatTime(timeStr) {
        try {
            const times = JSON.parse(timeStr);
            if (Array.isArray(times) && times.length > 0) {
                return times[0].substring(0, 5);
            }
            return timeStr.substring(0, 5);
        } catch {
            return timeStr.substring(0, 5);
        }
    }

    // Zobrazení toast notifikace
    function showToast(message, type = 'success', duration = 3000) {
        if (window.showToast) {
            window.showToast(message, type, duration);
        } else {
            alert(message);
        }
    }

    // Zavírání modálů
    const closeBtns = document.querySelectorAll('.close-btn');
    const secondaryBtns = document.querySelectorAll('.secondary-btn');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    secondaryBtns.forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    function closeModals() {
        const cancelModal = document.getElementById('cancel-modal');
        if (cancelModal) {
            cancelModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Zavření modálů při kliknutí mimo
    window.addEventListener('click', function(e) {
        const cancelModal = document.getElementById('cancel-modal');
        if (e.target === cancelModal) {
            closeModals();
        }
    });

    // NOVÁ FUNKCE: Lazy load obrázků pro my-reservations
    async function loadImageLazyMyReservations(movieId, imgElement) {
        try {
            const response = await fetch(`api_endpoint.php?action=image&id=${movieId}`);
            const result = await response.json();
            
            if (result.status === 'success' && result.image) {
                imgElement.src = `data:image/jpeg;base64,${result.image}`;
            }
        } catch (error) {
            console.error('Chyba při načítání obrázku v my-reservations:', error);
        }
    }
});