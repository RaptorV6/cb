document.addEventListener('DOMContentLoaded', function() {
            // Načtení rezervací při startu
            loadReservations();

            // Přepínání záložek
            const tabBtns = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');
            const emptyState = document.querySelector('.empty-state');

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
                    const reservations = await response.json();

                    if (Array.isArray(reservations)) {
                        updateReservationsUI(reservations);
                    }
                } catch (error) {
                    console.error('Chyba při načítání rezervací:', error);
                    alert('Nepodařilo se načíst rezervace. Zkuste to prosím znovu.');
                }
            }

            // Aktualizace UI rezervací
            function updateReservationsUI(reservations) {
                const upcomingTab = document.getElementById('upcoming-tab');
                const pastTab = document.getElementById('past-tab');

                upcomingTab.querySelector('.reservation-list').innerHTML = '';
                pastTab.querySelector('.reservation-list').innerHTML = '';

                const now = new Date();

                reservations.forEach(reservation => {
                    const screeningDate = new Date(reservation.screening_date);
                    const isPast = screeningDate < now;

                    const card = createReservationCard(reservation);
                    const targetTab = isPast ? pastTab : upcomingTab;
                    targetTab.querySelector('.reservation-list').appendChild(card);
                });

                // Kontrola prázdných stavů
                checkEmptyState(upcomingTab);
                checkEmptyState(pastTab);
            }

            // Vytvoření karty rezervace
            function createReservationCard(reservation) {
                const card = document.createElement('div');
                card.className = `reservation-card${new Date(reservation.screening_date) < new Date() ? ' past' : ''}`;
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
                <img src="data:image/jpeg;base64,${reservation.image}" alt="${reservation.title}" class="movie-thumbnail">
                <div class="reservation-info">
                    <h3 class="movie-title">${reservation.title}</h3>
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
                ${new Date(reservation.screening_date) > new Date() ? 
                    `<button class="cancel-btn" data-id="${reservation.id_reservation}">Zrušit rezervaci</button>` : 
                    ''}
            </div>
        `;

        // Přidání event listeneru pro zrušení rezervace
        const cancelBtn = card.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                showCancelConfirmation(reservation.id_reservation, reservation.title);
            });
        }

        return card;
    }

    // Kontrola prázdného stavu
    function checkEmptyState(tab) {
        const cards = tab.querySelectorAll('.reservation-card');
        const emptyState = document.querySelector('.empty-state');
        
        if (cards.length === 0) {
            emptyState.classList.remove('hidden');
            tab.appendChild(emptyState);
        } else {
            emptyState.classList.add('hidden');
        }
    }

    // Zobrazení potvrzení zrušení
    function showCancelConfirmation(reservationId, movieTitle) {
        const cancelModal = document.getElementById('cancel-modal');
        document.getElementById('cancel-movie-name').textContent = movieTitle;
        
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
                const parentTab = card.closest('.tab-content');
                card.remove();
                
                // Kontrola prázdného stavu
                checkEmptyState(parentTab);
                
                // Zavření modálu
                closeModals();
                
                alert('Rezervace byla úspěšně zrušena.');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Chyba při rušení rezervace:', error);
            alert(error.message || 'Došlo k chybě při rušení rezervace.');
        }
    }

    // User menu
    const userIcon = document.getElementById('user-icon');
    const dropdownMenu = document.getElementById('dropdown-menu');

    userIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    });

    document.addEventListener('click', function() {
        if (dropdownMenu.classList.contains('active')) {
            dropdownMenu.classList.remove('active');
        }
    });

    dropdownMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });

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

    // Navigace zpět
    const backLink = document.getElementById('back-link');
    if (backLink) {
        backLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.history.back();
        });
    }
});