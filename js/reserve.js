document.addEventListener('DOMContentLoaded', function() {
    const seats = document.querySelectorAll('.room-container .seat:not(.sold)');
    const reserveBtn = document.getElementById('reserve-btn');
    const count = document.getElementById('count');
    const total = document.getElementById('total');
    const screeningId = new URLSearchParams(window.location.search).get('id');

    let selectedSeats = [];
    let totalPrice = 0;

    // Načtení obsazených míst při načtení stránky
    loadOccupiedSeats();

    // Funkce pro načtení obsazených míst
    async function loadOccupiedSeats() {
        console.log("Načítám obsazená místa pro screening ID:", screeningId); // Log screening ID
        if (!screeningId) {
            console.error("Chybí screening ID v URL!");
            alert("Chyba: Chybí identifikátor promítání.");
            // Disable all seats as we can't determine availability
            seats.forEach(seat => {
                seat.classList.add('sold'); // Mark as sold visually
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

            const availableSeatsResult = await response.json();
            console.log("Obdržená dostupná místa:", availableSeatsResult);

            // Kontrola chybové zprávy
            if (typeof availableSeatsResult === 'object' && availableSeatsResult !== null && availableSeatsResult.status === 'error') {
                console.error('Chyba z backendu:', availableSeatsResult.message);

                // Speciální zpráva pro již začaté promítání
                if (availableSeatsResult.message.includes("Promítání již začalo")) {
                    //alert('Promítání již začalo, rezervace není možná.');
                    // Nahradit formulář informační zprávou
                    document.querySelector('.room-container').innerHTML =
                        '<div style="text-align: center; padding: 50px; background: rgba(0,0,0,0.3); border-radius: 10px;">' +
                        '<h2>Projekce skončila</h2>' +
                        '<p>Rezervace již není možná.</p>' +
                        '</div>';
                    document.querySelector('.selection-info').style.display = 'none';
                    document.querySelector('.button-container').style.display = 'none';
                } else {
                    alert('Chyba: ' + availableSeatsResult.message);
                }

                disableAllSeats();
                return;
            }

            // Ensure it's an array before proceeding
            if (!Array.isArray(availableSeatsResult)) {
                console.error('Neočekávaná odpověď z backendu:', availableSeatsResult);
                alert('Chyba: Server vrátil neplatná data o dostupnosti míst.');
                // Disable all seats on unexpected data
                seats.forEach(seat => {
                    seat.classList.add('sold');
                    seat.style.cursor = 'not-allowed';
                });
                return;
            }

            // Process the array of available seats
            const availableSeatIds = availableSeatsResult.map(s => s.id_seat); // Get just the IDs
            console.log("Dostupná ID míst:", availableSeatIds);

            seats.forEach(seat => {
                const seatId = parseInt(seat.id.replace('seat', ''), 10); // Ensure seatId is a number

                if (availableSeatIds.includes(seatId)) {
                    // Seat is available
                    seat.classList.remove('sold', 'selected'); // Ensure it's not marked sold or selected initially
                    seat.style.cursor = 'pointer';
                } else {
                    // Seat is occupied or doesn't exist in 'seats' table (shouldn't happen with current query)
                    seat.classList.add('sold');
                    seat.classList.remove('selected'); // Ensure it's not selected
                    seat.style.cursor = 'not-allowed';
                }
            });

            // Initial UI update in case all seats start occupied
            updateUI();

        } catch (error) {
            console.error('Chyba při fetchování/zpracování obsazených míst:', error);
            alert('Došlo k chybě při načítání dostupnosti míst. Zkuste obnovit stránku.');
            // Disable all seats on fetch error
            seats.forEach(seat => {
                seat.classList.add('sold');
                seat.style.cursor = 'not-allowed';
            });
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

    // Event listenery pro sedadla
    seats.forEach(seat => {
        seat.addEventListener("click", function() {
            if (!this.classList.contains("sold")) {
                this.classList.toggle("selected");

                const seatId = this.id;
                const seatPrice = parseInt(this.getAttribute('data-price'));

                if (this.classList.contains('selected')) {
                    selectedSeats.push(seatId);
                    totalPrice += seatPrice;
                } else {
                    const index = selectedSeats.indexOf(seatId);
                    if (index > -1) {
                        selectedSeats.splice(index, 1);
                        totalPrice -= seatPrice;
                    }
                }

                updateUI();
            }
        });
    });

    // Aktualizace UI
    function updateUI() {
        count.textContent = selectedSeats.length;
        total.textContent = totalPrice;
        reserveBtn.disabled = selectedSeats.length === 0;
    }

    // Vytvoření rezervace (odeslání všech míst najednou)
    reserveBtn.addEventListener('click', async function() {
        if (selectedSeats.length === 0) {
            alert('Prosím vyberte alespoň jedno místo.');
            return;
        }

        // Deaktivovat tlačítko během zpracování
        reserveBtn.disabled = true;
        reserveBtn.textContent = 'Rezervuji...';

        try {
            const seatIdsOnly = selectedSeats.map(seatElementId => seatElementId.replace('seat', ''));

            const formData = new FormData();
            formData.append('action', 'create');
            formData.append('screening_id', screeningId);
            // Odeslat pole ID sedadel
            seatIdsOnly.forEach(id => formData.append('seat_ids[]', id));

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

            // Úspěšná rezervace
            alert(result.message || 'Rezervace byla úspěšně vytvořena!');

            // Označení vybraných míst jako prodaných
            selectedSeats.forEach(seatId => {
                const seat = document.getElementById(seatId);
                seat.classList.remove('selected');
                seat.classList.add('sold');
                seat.style.cursor = 'not-allowed';
            });

            // Reset výběru
            selectedSeats = [];
            totalPrice = 0;
            updateUI();

            // Přesměrování na seznam rezervací po krátké pauze
            setTimeout(() => {
                window.location.href = 'my-reservations.php';
            }, 500); // Krátká pauza, aby uživatel viděl změnu stavu

        } catch (error) {
            console.error('Chyba při vytváření rezervace:', error);
            alert(error.message || 'Došlo k chybě při vytváření rezervace.');
            // Znovu povolit tlačítko při chybě
            reserveBtn.disabled = false;
            reserveBtn.textContent = 'Rezervovat místa';
        }
    });

    // UI pro přihlášeného uživatele
    const userIcon = document.getElementById('user-icon');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const backLink = document.getElementById('back-link');

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

    backLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.history.back();
    });
});