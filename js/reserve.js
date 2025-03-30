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
        try {
            const formData = new FormData();
            formData.append('action', 'get_available_seats');
            formData.append('screening_id', screeningId);

            const response = await fetch('reservation_handlers.php', {
                method: 'POST',
                body: formData
            });

            const availableSeats = await response.json();

            // Označení obsazených míst
            seats.forEach(seat => {
                const seatId = seat.id.replace('seat', '');
                if (!availableSeats.find(s => s.id_seat === parseInt(seatId))) {
                    seat.classList.add('sold');
                    seat.style.cursor = 'not-allowed';
                }
            });
        } catch (error) {
            console.error('Chyba při načítání obsazených míst:', error);
        }
    }

    // Event listenery pro sedadla
    seats.forEach(seat => {
        seat.addEventListener('click', function() {
            if (!this.classList.contains('sold')) {
                this.classList.toggle('selected');

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

    // Vytvoření rezervace
    reserveBtn.addEventListener('click', async function() {
        try {
            for (const seatId of selectedSeats) {
                const formData = new FormData();
                formData.append('action', 'create');
                formData.append('screening_id', screeningId);
                formData.append('seat_id', seatId.replace('seat', ''));

                const response = await fetch('reservation_handlers.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.status === 'error') {
                    throw new Error(result.message);
                }
            }

            // Úspěšná rezervace
            alert('Rezervace byla úspěšně vytvořena!');

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

            // Přesměrování na seznam rezervací
            window.location.href = 'my-reservations.php';

        } catch (error) {
            console.error('Chyba při vytváření rezervace:', error);
            alert(error.message || 'Došlo k chybě při vytváření rezervace.');
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