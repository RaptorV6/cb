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

                // Kontrola prázdného stavu
                checkEmptyState(activeTab);
            }

            // Načtení rezervací
            async function loadReservations() {
                try {
                    const response = await fetch('reservation_handlers.php');
                    const result = await response.json();

                    if (response.ok && Array.isArray(result)) {
                        updateReservationsUI(result);
                        // Aktivujeme záložku "aktuální"
                        document.querySelector('[data-tab="upcoming"]').click();
                    } else {
                        console.error('Chyba při načítání rezervací:', result);
                        const errorMessage = result && result.message ? result.message : 'Nepodařilo se načíst rezervace. Zkuste to prosím znovu.';
                        alert(errorMessage);
                        updateReservationsUI([]);
                    }
                } catch (error) {
                    console.error('Chyba při zpracování odpovědi rezervací:', error);
                    alert('Došlo k chybě při komunikaci se serverem. Zkuste to prosím znovu.');
                }
            }

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

                        // JEDNODUCHÁ LOGIKA: Pokud datum promítání je v minulosti, je to historie
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
            <div class="empty-icon">&#128465;</div>
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

            // Vytvoření karty rezervace s lepší podporou responzivity
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

                card.innerHTML = `
        <div class="reservation-header">
            <div class="movie-thumbnail-container">
                <img src="data:image/jpeg;base64,${reservation.image}" alt="${reservation.movie_title || reservation.title}" class="movie-thumbnail">
            </div>
            <div class="reservation-info">
                <h3 class="movie-title">${reservation.movie_title || reservation.title}</h3>
                <div class="movie-details">
                    <span class="movie-genre">${reservation.genre}</span>
                    <span class="movie-duration">${reservation.duration} min</span>
                </div>
                <div class="reservation-date">
                    <span class="date-icon">&#128197;</span>
                    <span>${formattedDate}</span>
                    <span class="time-icon">&#128336;</span>
                    <span>${formatTime(reservation.screening_time)}</span>
                </div>
            </div>
        </div>
        <div class="reservation-seats">
            <h4>Rezervovaná místa</h4>
            <div class="seats-grid">
                <div class="seat">
                    <span class="seat-number">${reservation.seat_number}</span>
                    <span class="seat-label">Sedadlo</span>
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
                
                alert('Rezervace byla úspěšně zrušena.');
            } else {
                throw new Error(result.message || 'Nepodařilo se zrušit rezervaci.');
            }
        } catch (error) {
            console.error('Chyba při rušení rezervace:', error);
            alert(error.message || 'Došlo k chybě při rušení rezervace.');
            closeModals();
        }
    }

    // Helper funkce
    function formatTime(timeStr) {
        try {
            const times = JSON.parse(timeStr);
            return times.join(', ');
        } catch {
            return timeStr;
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
});