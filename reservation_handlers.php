<?php
// File: reservation_handlers.php
// Handles reservation related requests. Delegates logic to Reservation class.

require_once 'autoload.php';
require_once __DIR__ . '/db_config.php';      // Needed for Database class auto-loading config

// Instantiate Auth first (starts session)
$auth = new Auth();
// Instantiate Reservation, passing the Auth instance
$reservationService = new Reservation($auth);

// --- Request Handling ---
header('Content-Type: application/json');

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // All POST actions require login (checked within Reservation methods or requireLogin below)
    // requireLogin(); // Can be called here, or rely on checks within methods

    $action = $_POST['action'] ?? '';
    $response = ['status' => 'error', 'message' => 'Neplatná akce.'];

    try {
        switch ($action) {
            case 'create':
                // Use the new method for multiple reservations
                if (isset($_POST['screening_id']) && isset($_POST['seat_ids']) && is_array($_POST['seat_ids'])) {
                     // Basic validation: ensure seat_ids are integers
                    $seatIds = array_map('intval', $_POST['seat_ids']);
                    $seatIds = array_filter($seatIds, function($id) { return $id > 0; }); // Remove non-positive IDs
                    
                    if (!empty($seatIds)) {
                        $response = $reservationService->createMultipleReservations($_POST['screening_id'], $seatIds);
                    } else {
                        $response = ['status' => 'error', 'message' => 'Nebyla vybrána platná místa.'];
                    }
                } else {
                    $response = ['status' => 'error', 'message' => 'Chybí ID promítání nebo pole ID míst (seat_ids).'];
                }
                break;

            case 'cancel':
                if (isset($_POST['reservation_id'])) {
                    $response = $reservationService->cancelReservation($_POST['reservation_id']);
                } else {
                     $response = ['status' => 'error', 'message' => 'Chybí ID rezervace pro zrušení.'];
                }
                break;

            case 'get_available_seats':
                if (isset($_POST['screening_id'])) {
                    $screeningId = $_POST['screening_id'];
                    $availableSeats = $reservationService->getAvailableSeats($screeningId);

                    // Check if it's an error object with a specific message
                    if (is_object($availableSeats) && isset($availableSeats->status) && $availableSeats->status === 'error' && strpos($availableSeats->message, 'Promítání již začalo') !== false) {
                        // Propagate the error message
                        $response = (array) $availableSeats; // Cast object to array
                    } else {
                        $response = $availableSeats; // Return the array of available seats
                    }
                } else {
                    $response = ['status' => 'error', 'message' => 'Chybí ID promítání pro načtení míst.'];
                }
                break;
            case 'get_user_reservation':
                if (isset($_POST['screening_id'])) {
                    $screeningId = $_POST['screening_id'];
        $screeningId = $_POST['screening_id'];
        $reservationData = $reservationService->getUserReservationForScreening($screeningId);
        
        // Důkladnější kontrola výsledku
        if ($reservationData && isset($reservationData['id_reservation']) && 
            isset($reservationData['id_seat']) && isset($reservationData['seat_number'])) {
            
            $response = $reservationData;
            $response['found'] = true;
        } else {
            $response = ['found' => false];
        }
    } else {
        $response = ['status' => 'error', 'message' => 'Chybí ID promítání.'];
    }
    break;
            default:
                $response = ['status' => 'error', 'message' => 'Neznámá akce.'];
                break;
        }
    } catch (Exception $e) {
        error_log("Reservation Handler Error: " . $e->getMessage());
        $response = ['status' => 'error', 'message' => 'Došlo k systémové chybě.'];
    }

    echo json_encode($response);
    exit;
}

// Handle GET requests (for fetching user's reservations)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // requireLogin(); // Checked within getReservations method
    try {
        $response = $reservationService->getReservations();
    } catch (Exception $e) {
         error_log("Reservation Handler Error (GET): " . $e->getMessage());
         $response = ['status' => 'error', 'message' => 'Došlo k systémové chybě při načítání rezervací.'];
    }
    echo json_encode($response);
    exit;
}

// If no valid action/method
http_response_code(400); // Bad Request
echo json_encode(['status' => 'error', 'message' => 'Neplatný požadavek nebo metoda.']);
exit;

/* --- Old procedural functions removed ---

function getReservations($userId = null) {
    try {
        $pdo = Database::getConnection(); // Use Database class
        $sql = "
            SELECT r.id_reservation, r.id_user, r.id_screening, r.id_seat, r.status, r.reservation_time,
                   s.title, s.screening_date, s.screening_time, s.genre, s.duration, encode(s.image, 'base64') as image,
                   seat.seat_number
            FROM reservations r
            JOIN screenings s ON r.id_screening = s.id_screening
            JOIN seats seat ON r.id_seat = seat.id_seat
        ";
        
        if ($userId) {
            $sql .= " WHERE r.id_user = :userId";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['userId' => $userId]);
        } else {
*/
?>
