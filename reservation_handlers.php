<?php
require_once 'db_config.php';
require_once 'session_check.php';

function getReservations($userId = null) {
    try {
        $pdo = getDbConnection();
        
        $sql = "
            SELECT r.*, s.title, s.screening_date, s.screening_time, s.genre, s.duration, seat.seat_number
            FROM reservations r
            JOIN screenings s ON r.id_screening = s.id_screening
            JOIN seats seat ON r.id_seat = seat.id_seat
        ";
        
        if ($userId) {
            $sql .= " WHERE r.id_user = :userId";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['userId' => $userId]);
        } else {
            $stmt = $pdo->query($sql);
        }
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return ['status' => 'error', 'message' => 'Chyba při načítání rezervací: ' . $e->getMessage()];
    }
}

function getAvailableSeats($screeningId) {
    try {
        $pdo = getDbConnection();
        
        $stmt = $pdo->prepare("
            SELECT s.id_seat, s.seat_number
            FROM seats s
            WHERE s.id_seat NOT IN (
                SELECT r.id_seat 
                FROM reservations r 
                WHERE r.id_screening = :screeningId 
                AND r.status = 'active'
            )
        ");
        
        $stmt->execute(['screeningId' => $screeningId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return ['status' => 'error', 'message' => 'Chyba při načítání volných míst: ' . $e->getMessage()];
    }
}

function createReservation($data) {
    try {
        $pdo = getDbConnection();
        
        // Ověření, zda je místo volné
        $stmt = $pdo->prepare("
            SELECT COUNT(*) 
            FROM reservations 
            WHERE id_screening = :screeningId 
            AND id_seat = :seatId 
            AND status = 'active'
        ");
        
        $stmt->execute([
            'screeningId' => $data['screening_id'],
            'seatId' => $data['seat_id']
        ]);
        
        if ($stmt->fetchColumn() > 0) {
            return ['status' => 'error', 'message' => 'Vybrané místo je již obsazené.'];
        }
        
        // Vytvoření rezervace
        $stmt = $pdo->prepare("
            INSERT INTO reservations (id_user, id_screening, id_seat, status)
            VALUES (:userId, :screeningId, :seatId, 'active')
        ");
        
        $stmt->execute([
            'userId' => $_SESSION['user_id'],
            'screeningId' => $data['screening_id'],
            'seatId' => $data['seat_id']
        ]);
        
        return ['status' => 'success', 'message' => 'Rezervace byla úspěšně vytvořena.'];
    } catch (PDOException $e) {
        return ['status' => 'error', 'message' => 'Chyba při vytváření rezervace: ' . $e->getMessage()];
    }
}

function cancelReservation($reservationId) {
    try {
        $pdo = getDbConnection();
        
        // Ověření, zda rezervace patří přihlášenému uživateli nebo je admin
        $stmt = $pdo->prepare("
            SELECT id_user 
            FROM reservations 
            WHERE id_reservation = :id 
            AND status = 'active'
        ");
        
        $stmt->execute(['id' => $reservationId]);
        $reservation = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$reservation) {
            return ['status' => 'error', 'message' => 'Rezervace neexistuje nebo již byla zrušena.'];
        }
        
        if ($reservation['id_user'] !== $_SESSION['user_id'] && !isAdmin()) {
            return ['status' => 'error', 'message' => 'Nemáte oprávnění zrušit tuto rezervaci.'];
        }
        
        // Zrušení rezervace
        $stmt = $pdo->prepare("
            UPDATE reservations 
            SET status = 'canceled' 
            WHERE id_reservation = :id
        ");
        
        $stmt->execute(['id' => $reservationId]);
        
        return ['status' => 'success', 'message' => 'Rezervace byla úspěšně zrušena.'];
    } catch (PDOException $e) {
        return ['status' => 'error', 'message' => 'Chyba při rušení rezervace: ' . $e->getMessage()];
    }
}

// Zpracování API požadavků
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireLogin(); // Vyžadovat přihlášení
    
    $action = $_POST['action'] ?? '';
    $response = ['status' => 'error', 'message' => 'Neplatný požadavek'];
    
    switch ($action) {
        case 'create':
            $response = createReservation($_POST);
            break;
            
        case 'cancel':
            if (isset($_POST['reservation_id'])) {
                $response = cancelReservation($_POST['reservation_id']);
            }
            break;
            
        case 'get_available_seats':
            if (isset($_POST['screening_id'])) {
                $response = getAvailableSeats($_POST['screening_id']);
            }
            break;
    }
    
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

// Pro GET požadavky vrátíme seznam rezervací
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireLogin();
    
    $userId = !isAdmin() ? $_SESSION['user_id'] : null;
    header('Content-Type: application/json');
    echo json_encode(getReservations($userId));
    exit;
}
?>