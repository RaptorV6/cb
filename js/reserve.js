document.addEventListener('DOMContentLoaded', function() {
    const seats = document.querySelectorAll('.room-container .seat');
    const reserveBtn = document.getElementById('reserve-btn');
    const screeningId = new URLSearchParams(window.location.search).get('id');
    const csrfToken = document.getElementById('csrf_token') ? document.getElementById('csrf_token').value : '';

    // Odstranění nebo upravení info textu
    const selectionInfo = document.querySelector('.selection-info');
    if (selectionInfo) {
        selectionInfo.innerHTML = '<p>Vyberte místo, které si přejete rezervovat.</p>';
    }

    let selectedSeat = null;
    let userHasReservation = false;
    let userReservationSeatId = null;

    // Načtení dat při načtení stránky
    init();

    async function init() {
        try {
            // Nejdříve zkontrolujeme, zda uživatel již nemá rezervaci
            await checkExistingReservation();
            // Poté načteme obsazená místa
            await loadOccupiedSeats();
        } catch (error) {
            console.error('Chyba při inicializaci:', error);
            alert('Došlo k chybě při načítání. Prosím, obnovte stránku.');
        }
    }

    // Kontrola, zda uživatel již má rezervaci na toto promítání
    async function checkExistingReservation() {
        try {
            const formData = new FormData();
            formData.append('action', 'get_user_reservation');
            formData.append('screening_id', screeningId);
            formData.append('csrf_token', csrfToken);

            const response = await fetch('reservation_handlers.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Kontrola existující rezervace:", result);

            // Opravená kontrola
            if (result && result.found === true && result.id_seat && result.seat_number) {
                userHasReservation = true;
                userReservationSeatId = result.id_seat;

                // Aktualizujeme text a tlačítko
                if (selectionInfo) {
                    selectionInfo.innerHTML = `<p>Máte rezervované sedadlo č. <strong>${result.seat_number}</strong>. Vyberte jiné místo pro přesun rezervace.</p>`;
                }
                if (reserveBtn) {
                    reserveBtn.textContent = "Přesunout rezervaci";
                }
            } else {
                userHasReservation = false;
                userReservationSeatId = null;

                // Aktualizujeme text a tlačítko
                if (selectionInfo) {
                    selectionInfo.innerHTML = '<p>Vyberte místo, které si přejete rezervovat.</p>';
                }
                if (reserveBtn) {
                    reserveBtn.textContent = "Rezervovat místo";
                }
            }
        } catch (error) {
            console.error('Chyba při kontrole existující rezervace:', error);
            userHasReservation = false;
            userReservationSeatId = null;

            // V případě chyby nastavíme text pro vytvoření nové rezervace
            if (selectionInfo) {
                selectionInfo.innerHTML = '<p>Vyberte místo, které si přejete rezervovat.</p>';
            }
            if (reserveBtn) {
                reserveBtn.textContent = "Rezervovat místo";
            }
            throw error;
        }
    }

    // Funkce pro načtení obsazených míst
    async function loadOccupiedSeats() {
        console.log("Načítám obsazená místa pro screening ID:", screeningId);
        if (!screeningId) {
            console.error("Chybí screening ID v URL!");
            alert("Chyba: Chybí identifikátor promítání.");
            seats.forEach(seat => {
                seat.classList.add('sold');
                seat.style.cursor = 'not-allowed';
            });
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'get_available_seats');
            formData.append('screening_id', screeningId);
            formData.append('csrf_token', csrfToken);

            const response = await fetch('reservation_handlers.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Obdržená data o sedadlech:", result);

            // Kontrola chybové zprávy
            if (typeof result === 'object' && result !== null && result.status === 'error') {
                console.error('Chyba z backendu:', result.message);

                if (result.message.includes("Promítání již začalo")) {
                    document.querySelector('.room-container').innerHTML =
                        '<div style="text-align: center; padding: 50px; background: rgba(0,0,0,0.3); border-radius: 10px;">' +
                        '<h2>Projekce skončila</h2>' +
                        '<p>Rezervace již není možná.</p>' +
                        '</div>';
                    if (selectionInfo) selectionInfo.style.display = 'none';
                    if (reserveBtn) reserveBtn.style.display = 'none';
                } else {
                    alert('Chyba: ' + result.message);
                }

                disableAllSeats();
                return;
            }

            // Reset všech sedadel
            seats.forEach(seat => {
                // Odstraníme všechny třídy a labely
                seat.classList.remove('sold', 'selected', 'user-reserved');
                const usernameLabel = seat.querySelector('.username-label');
                if (usernameLabel) usernameLabel.remove();

                // Výchozí styl pro všechna sedadla
                seat.style.cursor = 'pointer';
            });

            // Označení obsazených sedadel a přidání jmen
            if (result.occupied && Array.isArray(result.occupied)) {
                result.occupied.forEach(occupiedSeat => {
                    const seat = document.getElementById('seat' + occupiedSeat.id_seat);
                    if (seat) {
                        // Zkontrolujeme, zda toto sedadlo patří aktuálnímu uživateli
                        const isUserSeat = userHasReservation && occupiedSeat.id_seat == userReservationSeatId;

                        if (isUserSeat) {
                            // Sedadlo patří aktuálnímu uživateli
                            seat.classList.add('user-reserved');
                            seat.classList.remove('sold');
                            seat.style.cursor = 'default';

                            // Přidání speciální jmenovky pro vlastní rezervaci
                            const usernameLabel = document.createElement('div');
                            usernameLabel.className = 'username-label user-label';
                            usernameLabel.textContent = occupiedSeat.username;
                            seat.insertBefore(usernameLabel, seat.firstChild);
                        } else {
                            // Obsazené místo jiným uživatelem
                            seat.classList.add('sold');
                            seat.style.cursor = 'not-allowed';

                            // Přidání jmenovky s uživatelským jménem
                            if (occupiedSeat.username) {
                                const usernameLabel = document.createElement('div');
                                usernameLabel.className = 'username-label';
                                usernameLabel.textContent = occupiedSeat.username;
                                seat.insertBefore(usernameLabel, seat.firstChild);
                            }
                        }
                    }
                });
            }

            updateUI();

        } catch (error) {
            console.error('Chyba při fetchování/zpracování obsazených míst:', error);
            alert('Došlo k chybě při načítání dostupnosti míst. Zkuste obnovit stránku.');
            disableAllSeats();
        }
    }

    // Pomocná funkce pro zakázání všech sedadel
    function disableAllSeats() {
        seats.forEach(seat => {
            seat.classList.add("sold");
            seat.style.cursor = "not-allowed";
        });
        if (reserveBtn) reserveBtn.disabled = true;
    }

    // Event listenery pro sedadla
    seats.forEach(seat => {
        seat.addEventListener("click", function() {
            // Ignorujeme kliknutí na prodaná místa a na vlastní rezervaci
            if (this.classList.contains("sold") || this.classList.contains("user-reserved")) {
                return;
            }

            // Odznačíme předchozí vybrané sedadlo
            if (selectedSeat) {
                document.getElementById(selectedSeat).classList.remove('selected');
            }

            // Označíme nové sedadlo
            this.classList.add("selected");
            selectedSeat = this.id;

            updateUI();
        });
    });

    // Aktualizace UI
    function updateUI() {
        // Aktivace/deaktivace tlačítka rezervace
        if (reserveBtn) {
            reserveBtn.disabled = !selectedSeat;

            // Aktualizace textu tlačítka podle toho, zda jde o novou rezervaci nebo přesun
            if (userHasReservation) {
                reserveBtn.textContent = "Přesunout rezervaci";
            } else {
                reserveBtn.textContent = "Rezervovat místo";
            }
        }
    }

    // Vytvoření rezervace nebo přesun existující
    if (reserveBtn) {
        reserveBtn.addEventListener('click', async function() {
            if (!selectedSeat) {
                alert('Prosím vyberte místo.');
                return;
            }

            const originalBtnText = this.textContent;
            this.disabled = true;
            this.textContent = userHasReservation ? "Přesouvám..." : "Rezervuji...";

            try {
                const seatId = selectedSeat.replace('seat', '');

                const formData = new FormData();
                formData.append('action', 'create');
                formData.append('screening_id', screeningId);
                formData.append('seat_ids[]', seatId);
                formData.append('csrf_token', csrfToken);

                const response = await fetch('reservation_handlers.php', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();

                if (result.status === 'error') {
                    throw new Error(result.message);
                }

                // Oznamujeme úspěch
                alert(result.message || 'Rezervace byla úspěšně vytvořena!');

                // Resetujeme a znovu načteme data
                selectedSeat = null;

                // Znovu inicializujeme stránku
                await init();

            } catch (error) {
                console.error('Chyba při vytváření/přesouvání rezervace:', error);
                alert(error.message || 'Došlo k chybě při zpracování rezervace.');
                this.disabled = false;
                this.textContent = originalBtnText;
            }
        });
    }
});