<?php

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Auth.php'; // Potřebujeme pro kontrolu uživatele

class Reservation {
    private $pdo;
    private $auth;

    public function __construct(Auth $auth) {
        $this->pdo = Database::getConnection();
        $this->auth = $auth; // Uložíme instanci Auth pro použití v metodách
    }

    /**
     * Get reservations, optionally filtered by user ID.
     * If user is not admin, automatically filters by logged-in user.
     * @return array List of reservations or error message.
     */
    public function getReservations() {
        if (!$this->auth->isLoggedIn()) {
             return ['status' => 'error', 'message' => 'Pro zobrazení rezervací musíte být přihlášeni.'];
        }

        $userId = !$this->auth->isAdmin() ? $_SESSION['user_id'] : null;

        try {
            $sql = "
                SELECT r.id_reservation, r.id_user, r.id_screening, r.id_seat, r.status, r.created_at, 
                       s.title, s.screening_date, s.screening_time, s.genre, s.duration, encode(s.image, 'base64') as image,
                       seat.seat_number
                FROM reservations r
                JOIN screenings s ON r.id_screening = s.id_screening
                JOIN seats seat ON r.id_seat = seat.id_seat
            ";

            if ($userId) {
                $sql .= " WHERE r.id_user = :userId ORDER BY r.created_at DESC"; // Oprava ORDER BY
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute(['userId' => $userId]);
            } else {
                // Admin gets all reservations
                $sql .= " ORDER BY r.created_at DESC"; // Oprava ORDER BY
                $stmt = $this->pdo->query($sql);
            }

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Reservation Error (getReservations): " . $e->getMessage());
            // Dočasně vracíme konkrétní PDOException message pro ladění
            return ['status' => 'error', 'message' => 'Chyba DB: ' . $e->getMessage()];
        }
    }

    /**
     * Get available seats for a specific screening.
     * @param int $screeningId
     * @return array List of available seats or error message.
     */
    public function getAvailableSeats($screeningId) {
         try {
            $this->auth->requireLogin(); // Require login for this action

            $pdo = Database::getConnection();

            // Check if the screening exists and has not yet started
            $screeningCheckSql = "
                SELECT screening_date, screening_time FROM screenings WHERE id_screening = :screening_id
            ";
            $screeningCheckStmt = $pdo->prepare($screeningCheckSql);
            $screeningCheckStmt->execute(['screening_id' => $screeningId]);
            $screening = $screeningCheckStmt->fetch(PDO::FETCH_ASSOC);

            if (!$screening) {
                return (object) ['status' => 'error', 'message' => 'Neplatné ID promítání.'];
            }

            $screeningDateTimeStr = $screening['screening_date'] . ' ' . $screening['screening_time'];
            $screeningDateTime = new DateTime($screeningDateTimeStr);
            $now = new DateTime();

            if ($screeningDateTime <= $now) {
                return (object) ['status' => 'error', 'message' => 'Promítání již začalo.'];
            }

            // If screening is valid and has not started, proceed to fetch available seats
            $sql = "
                SELECT s.id_seat
                FROM seats s
                LEFT JOIN reservations r ON s.id_seat = r.id_seat AND r.id_screening = :screening_id AND r.status = 'active'
                WHERE r.id_seat IS NULL
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['screening_id' => $screeningId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            error_log("Reservation::getAvailableSeats - DB error: " . $e->getMessage());
            return (object) ['status' => 'error', 'message' => 'Chyba při načítání dostupných míst.'];
        } catch (Exception $e) {
            error_log("Reservation::getAvailableSeats - General error: " . $e->getMessage());
            return (object) ['status' => 'error', 'message' => 'Došlo k systémové chybě.'];
        }
    }

    /**
     * Create a new reservation for the logged-in user.
     * @param int $screeningId
     * @param int $seatId
     * @return array Result status and message.
     */
    public function createReservation($screeningId, $seatId) {
        if (!$this->auth->isLoggedIn()) {
            return ['status' => 'error', 'message' => 'Pro vytvoření rezervace musíte být přihlášeni.'];
        }
        $userId = $_SESSION['user_id'];

        try {
            // Start transaction
            $this->pdo->beginTransaction();

            // Check if seat is still available (lock for update might be better in high concurrency)
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) 
                FROM reservations 
                WHERE id_screening = :screeningId 
                AND id_seat = :seatId 
                AND status = 'active'
            ");
            $stmt->execute(['screeningId' => $screeningId, 'seatId' => $seatId]);

            if ($stmt->fetchColumn() > 0) {
                 $this->pdo->rollBack(); // Rollback transaction
                return ['status' => 'error', 'message' => 'Vybrané místo (' . $seatId . ') je již obsazené.'];
            }

            // Create reservation
            $stmt = $this->pdo->prepare("
                INSERT INTO reservations (id_user, id_screening, id_seat, status)
                VALUES (:userId, :screeningId, :seatId, 'active')
            ");
            $stmt->execute([
                'userId' => $userId,
                'screeningId' => $screeningId,
                'seatId' => $seatId
            ]);

            // Commit transaction
            $this->pdo->commit();

            return ['status' => 'success', 'message' => 'Rezervace byla úspěšně vytvořena.'];
        } catch (PDOException $e) {
             $this->pdo->rollBack(); // Rollback on error
            error_log("Reservation Error (createReservation): " . $e->getMessage());
            return ['status' => 'error', 'message' => 'Chyba při vytváření rezervace.'];
        }
    }
    
    /**
     * Create multiple reservations for the logged-in user in a single transaction.
     * @param int $screeningId
     * @param array $seatIds Array of seat IDs to reserve.
     * @return array Result status and message.
     */
    public function createMultipleReservations($screeningId, array $seatIds) {
        if (!$this->auth->isLoggedIn()) {
            return ['status' => 'error', 'message' => 'Pro vytvoření rezervace musíte být přihlášeni.'];
        }
        if (empty($seatIds)) {
             return ['status' => 'error', 'message' => 'Nebyla vybrána žádná místa k rezervaci.'];
        }
        $userId = $_SESSION['user_id'];

        try {
            $this->pdo->beginTransaction();

            // Check availability of all seats first
            $placeholders = implode(',', array_fill(0, count($seatIds), '?'));
            $stmtCheck = $this->pdo->prepare("
                SELECT id_seat 
                FROM reservations 
                WHERE id_screening = ? 
                AND id_seat IN ($placeholders)
                AND status = 'active'
            ");
            $paramsCheck = array_merge([$screeningId], $seatIds);
            $stmtCheck->execute($paramsCheck);
            $occupiedSeats = $stmtCheck->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($occupiedSeats)) {
                $this->pdo->rollBack();
                return ['status' => 'error', 'message' => 'Některá vybraná místa jsou již obsazená: ' . implode(', ', $occupiedSeats)];
            }

            // Insert all reservations
            $stmtInsert = $this->pdo->prepare("
                INSERT INTO reservations (id_user, id_screening, id_seat, status)
                VALUES (?, ?, ?, 'active')
            ");

            foreach ($seatIds as $seatId) {
                if (!$stmtInsert->execute([$userId, $screeningId, $seatId])) {
                     // If any insert fails, rollback
                     $this->pdo->rollBack();
                     error_log("Reservation Error (createMultipleReservations): Failed to insert seat ID " . $seatId);
                     return ['status' => 'error', 'message' => 'Chyba při vytváření rezervace pro místo ' . $seatId];
                }
            }

            $this->pdo->commit();
            return ['status' => 'success', 'message' => 'Rezervace byla úspěšně vytvořena.'];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Reservation Error (createMultipleReservations): " . $e->getMessage());
            return ['status' => 'error', 'message' => 'Chyba při vytváření rezervací.'];
        }
    }


    /**
     * Cancel a reservation.
     * @param int $reservationId
     * @return array Result status and message.
     */
    public function cancelReservation($reservationId) {
        if (!$this->auth->isLoggedIn()) {
            return ['status' => 'error', 'message' => 'Pro zrušení rezervace musíte být přihlášeni.'];
        }
        $currentUserId = $_SESSION['user_id'];

        try {
            // Get reservation owner
            $stmt = $this->pdo->prepare("SELECT id_user FROM reservations WHERE id_reservation = :id AND status = 'active'");
            $stmt->execute(['id' => $reservationId]);
            $reservation = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$reservation) {
                return ['status' => 'error', 'message' => 'Rezervace neexistuje nebo již byla zrušena.'];
            }

            // Check permissions
            if ($reservation['id_user'] !== $currentUserId && !$this->auth->isAdmin()) {
                return ['status' => 'error', 'message' => 'Nemáte oprávnění zrušit tuto rezervaci.'];
            }

            // Cancel reservation
            $stmt = $this->pdo->prepare("UPDATE reservations SET status = 'canceled' WHERE id_reservation = :id");
            $stmt->execute(['id' => $reservationId]);

            if ($stmt->rowCount() > 0) {
                 return ['status' => 'success', 'message' => 'Rezervace byla úspěšně zrušena.'];
            } else {
                 // Should not happen if fetch worked, but good to handle
                 return ['status' => 'error', 'message' => 'Rezervaci se nepodařilo zrušit.'];
            }
        } catch (PDOException $e) {
            error_log("Reservation Error (cancelReservation): " . $e->getMessage());
            return ['status' => 'error', 'message' => 'Chyba při rušení rezervace.'];
        }
    }
}
