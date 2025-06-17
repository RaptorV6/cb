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
                    const response = await fetch('reservation_handlers.php?optimized=true');
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

                // OPTIMALIZOVANÝ obrázek
                const thumbnailHtml = reservation.image ?
                    `<img src="data:image/jpeg;base64,${reservation.image}" alt="${reservation.movie_title || reservation.title}" class="movie-thumbnail">` :
                    reservation.has_image ?
                    `<img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="120" viewBox="0 0 80 120">
                                <defs>
                                    <linearGradient id="reserveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
                                        <stop offset="50%" style="stop-color:#242333;stop-opacity:1" />
                                        <stop offset="100%" style="stop-color:#0f1419;stop-opacity:1" />
                                    </linearGradient>
                                    <linearGradient id="reserveShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" style="stop-color:rgba(12,184,0,0)" />
                                        <stop offset="50%" style="stop-color:rgba(12,184,0,0.4)" />
                                        <stop offset="100%" style="stop-color:rgba(12,184,0,0)" />
                                        <animateTransform attributeName="gradientTransform" type="translate"
                                            values="-80 0; 80 0; -80 0" dur="2.5s" repeatCount="indefinite"/>
                                    </linearGradient>
                                    <filter id="reserveGlow">
                                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                                    </filter>
                                </defs>
                                
                                <rect width="100%" height="100%" fill="url(#reserveGrad)" rx="6"/>
                                <rect x="5" y="5" width="70" height="110" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(12,184,0,0.2)" stroke-width="1"/>
                                
                                <!-- Film reel -->
                                <g transform="translate(40, 50)">
                                    <circle r="18" fill="none" stroke="#0cb800" stroke-width="2" filter="url(#reserveGlow)">
                                        <animate attributeName="stroke-dasharray" values="0 113; 56 56; 0 113" dur="2s" repeatCount="indefinite"/>
                                    </circle>
                                    <circle r="12" fill="rgba(12, 184, 0, 0.1)"/>
                                    <circle r="4" fill="#0cb800"/>
                                    <circle r="2" fill="#1a1a2e"/>
                                    
                                    <!-- Spokes -->
                                    <g>
                                        <rect x="-0.5" y="-10" width="1" height="8" fill="#0cb800" opacity="0.7"/>
                                        <rect x="-0.5" y="2" width="1" height="8" fill="#0cb800" opacity="0.7"/>
                                        <rect x="-10" y="-0.5" width="8" height="1" fill="#0cb800" opacity="0.7"/>
                                        <rect x="2" y="-0.5" width="8" height="1" fill="#0cb800" opacity="0.7"/>
                                        <animateTransform attributeName="transform" type="rotate"
                                            values="0; 360; 0" dur="3s" repeatCount="indefinite"/>
                                    </g>
                                </g>
                                
                                <text x="40" y="85" text-anchor="middle" fill="#999" font-size="9" font-weight="300">Načítám</text>
                                
                                <!-- Loading dots -->
                                <g transform="translate(40, 95)">
                                    <circle cx="-8" cy="0" r="1.5" fill="#0cb800">
                                        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
                                    </circle>
                                    <circle cx="0" cy="0" r="1.5" fill="#0cb800">
                                        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="0.5s" repeatCount="indefinite"/>
                                    </circle>
                                    <circle cx="8" cy="0" r="1.5" fill="#0cb800">
                                        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="1s" repeatCount="indefinite"/>
                                    </circle>
                                </g>
                                
                                <rect width="100%" height="100%" fill="url(#reserveShimmer)" rx="6"/>
                                
                                <text x="40" y="110" text-anchor="middle" fill="rgba(12, 184, 0, 0.3)" font-size="7" font-weight="bold">CineBukay</text>
                            </svg>
                        `)}" alt="Loading..." class="movie-thumbnail" data-movie-id="${reservation.id_screening}" style="opacity: 0.9;">` :
                        `<div class="movie-thumbnail" style="background: #444; display: flex; align-items: center; justify-content: center; color: #888;">No Image</div>`;

                card.innerHTML = `
                    <div class="reservation-header">
                        <div class="movie-thumbnail-container">
                            ${thumbnailHtml}
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

                // Event listener pro zrušení
                const cancelBtn = card.querySelector('.cancel-btn');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', function() {
                        showCancelConfirmation(reservation.id_reservation, reservation.movie_title || reservation.title);
                    });
                }

                // LAZY LOADING obrázku
                if (reservation.has_image && !reservation.image) {
                    setTimeout(() => {
                        loadImageLazyReservation(reservation.id_screening, card);
                    }, 50);
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

    // Opravená lazy loading pro rezervace - BEZ optional chaining
    async function loadImageLazyReservation(movieId, cardElement) {
        try {
            const response = await fetch(`api_endpoint.php?action=image&id=${movieId}`);
            const result = await response.json();
            
            if (result.status === 'success' && result.image) {
                if (cardElement) {
                    const imgElement = cardElement.querySelector('img[data-movie-id]');
                    if (imgElement) {
                        imgElement.src = `data:image/jpeg;base64,${result.image}`;
                        imgElement.style.opacity = '1';
                        imgElement.style.transition = 'opacity 0.3s ease';
                    }
                }
            }
        } catch (error) {
            console.error('Chyba při načítání obrázku v rezervacích:', error);
        }
    }
});