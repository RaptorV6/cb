document.addEventListener('DOMContentLoaded', function() {
    const seats = document.querySelectorAll('.room-container .seat');
    const reserveBtn = document.getElementById('reserve-btn');
    const count = document.getElementById('count');
    const total = document.getElementById('total');
    const screeningId = new URLSearchParams(window.location.search).get('id');

    let selectedSeat = null;
    let totalPrice = 0;

    // Načtení obsazených míst při načtení stránky
    loadOccupiedSeats();

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
                    document.querySelector('.selection-info').style.display = 'none';
                    document.querySelector('.button-container').style.display = 'none';
                } else {
                    alert('Chyba: ' + result.message);
                }

                disableAllSeats();
                return;
            }

            // Nastavení všech sedadel jako základní
            seats.forEach(seat => {
                seat.classList.remove('sold', 'selected');
                seat.style.cursor = 'pointer';

                // Odstraníme případnou existující label se jménem uživatele
                let usernameLabel = seat.querySelector('.username-label');
                if (usernameLabel) {
                    usernameLabel.remove();
                }
            });

            // Označení obsazených sedadel a přidání jmen
            if (result.occupied && Array.isArray(result.occupied)) {
                result.occupied.forEach(occupiedSeat => {
                    const seat = document.getElementById('seat' + occupiedSeat.id_seat);
                    if (seat) {
                        seat.classList.add('sold');
                        seat.classList.remove('selected');
                        seat.style.cursor = 'not-allowed';

                        // Přidání jména uživatele nad sedadlem
                        if (occupiedSeat.username) {
                            usernameLabel = document.createElement('div');
                            usernameLabel.className = 'username-label';
                            usernameLabel.textContent = occupiedSeat.username;

                            // Vložíme jméno dovnitř sedadla, aby bylo umístěno přímo nad ním
                            seat.insertBefore(usernameLabel, seat.firstChild);
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
        reserveBtn.disabled = true;
    }

    // Event listenery pro sedadla - upraveno pro pouze jedno místo
    seats.forEach(seat => {
        seat.addEventListener("click", function() {
            if (!this.classList.contains("sold")) {
                // Odznačíme předchozí vybrané sedadlo
                if (selectedSeat) {
                    document.getElementById(selectedSeat).classList.remove('selected');
                }

                // Označíme nové sedadlo
                this.classList.add("selected");
                selectedSeat = this.id;
                totalPrice = parseInt(this.getAttribute('data-price'));

                updateUI();
            }
        });
    });

    // Aktualizace UI
    function updateUI() {
        // Aktualizace počtu a ceny
        count.textContent = selectedSeat ? 1 : 0;
        total.textContent = totalPrice;
        reserveBtn.disabled = !selectedSeat;
    }

    // Vytvoření rezervace - upraveno pro jedno místo
    reserveBtn.addEventListener('click', async function() {
        if (!selectedSeat) {
            alert('Prosím vyberte místo.');
            return;
        }

        reserveBtn.disabled = true;
        reserveBtn.textContent = 'Rezervuji...';

        try {
            const seatId = selectedSeat.replace('seat', '');

            const formData = new FormData();
            formData.append('action', 'create');
            formData.append('screening_id', screeningId);
            formData.append('seat_ids[]', seatId);

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

            alert(result.message || 'Rezervace byla úspěšně vytvořena!');

            // Znovu načteme obsazená místa pro aktualizaci UI
            loadOccupiedSeats();

            // Reset výběru
            selectedSeat = null;
            totalPrice = 0;
            updateUI();

            setTimeout(() => {
                window.location.href = 'my-reservations.php';
            }, 500);

        } catch (error) {
            console.error('Chyba při vytváření rezervace:', error);
            alert(error.message || 'Došlo k chybě při vytváření rezervace.');
            reserveBtn.disabled = false;
            reserveBtn.textContent = 'Rezervovat místo';
        }
    });
});