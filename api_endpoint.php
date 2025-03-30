<?php
// File: api_endpoint.php
// Unified API endpoint for movie (screening) operations and potentially others later.

require_once 'db_config.php'; // Still needed for Database class auto-loading config
require_once 'src/Database.php'; // Include the new Database class
require_once 'session_check.php';

header('Content-Type: application/json');

// --- Movie (Screening) Functions ---

/**
 * Get all screenings from the database.
 * Includes image data encoded as base64.
 * @return array List of screenings or error message.
 */
function getAllMovies() {
    try {
        $pdo = Database::getConnection(); // Use Database class
        $stmt = $pdo->query("
            SELECT 
                id_screening,
                title,
                duration,
                genre,
                description,
                encode(image, 'base64') as image, -- Encode image to base64 for JSON
                screening_date,
                screening_time::varchar as screening_time -- Ensure time is string
            FROM screenings 
            ORDER BY screening_date DESC, screening_time ASC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("API Error (getAllMovies): " . $e->getMessage());
        return ['status' => 'error', 'message' => 'Chyba při načítání filmů.'];
    }
}

/**
 * Add a new screening to the database.
 * @param array $data Data from the POST request. Expects 'title', 'duration', 'screening_date', 'screening_time' (JSON array), 'genre', 'description', 'image' (base64).
 * @return array Result status and message.
 */
function addMovie($data) {
    // Basic validation
    $required = ['title', 'duration', 'screening_date', 'screening_time'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            return ['status' => 'error', 'message' => "Chybí povinné pole: $field"];
        }
    }

    try {
        $pdo = Database::getConnection(); // Use Database class
        
        $sql = "INSERT INTO screenings 
                (title, duration, genre, description, image, screening_date, screening_time) 
                VALUES 
                (:title, :duration, :genre, :description, :image, :screening_date, :screening_time)";
        
        $stmt = $pdo->prepare($sql);
        
        // Decode image from base64 if provided
        $imageData = null;
        if (!empty($data['image'])) {
            // Remove the data URI scheme prefix if present
            $base64Image = preg_replace('#^data:image/\w+;base64,#i', '', $data['image']);
            $imageData = base64_decode($base64Image);
            if ($imageData === false) {
                 return ['status' => 'error', 'message' => 'Neplatný formát obrázku (base64).'];
            }
        }

        // Decode screening times JSON and get the first one (or default)
        $screeningTimes = json_decode($data['screening_time'], true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($screeningTimes)) {
             return ['status' => 'error', 'message' => 'Neplatný formát časů promítání (JSON pole).'];
        }
        $firstTime = $screeningTimes[0] ?? '00:00:00'; // Use first time or default

        $params = [
            'title' => $data['title'],
            'duration' => intval($data['duration']),
            'genre' => $data['genre'] ?? 'Nezařazeno',
            'description' => $data['description'] ?? '',
            'image' => $imageData, // PDO handles BYTEA correctly with null or binary string
            'screening_date' => $data['screening_date'],
            'title' => $data['title'],
            'duration' => intval($data['duration']),
            'genre' => $data['genre'] ?? 'Nezařazeno',
            'description' => $data['description'] ?? '',
            // 'image' => $imageData, // Bind separately
            'screening_date' => $data['screening_date'],
            'screening_time' => $firstTime 
        ];

        // Bind parameters explicitly, especially LOB for image
        $stmt->bindParam(':title', $params['title']);
        $stmt->bindParam(':duration', $params['duration'], PDO::PARAM_INT);
        $stmt->bindParam(':genre', $params['genre']);
        $stmt->bindParam(':description', $params['description']);
        $stmt->bindParam(':image', $imageData, PDO::PARAM_LOB); // Specify LOB type for BYTEA
        $stmt->bindParam(':screening_date', $params['screening_date']);
        $stmt->bindParam(':screening_time', $params['screening_time']);

        $stmt->execute();
        
        return ['status' => 'success', 'message' => 'Film byl úspěšně přidán.'];
    } catch (PDOException $e) {
        error_log("API Error (addMovie): " . $e->getMessage());
        return ['status' => 'error', 'message' => 'Chyba při přidávání filmu: ' . $e->getMessage()];
    } catch (Exception $e) {
        error_log("API Error (addMovie - General): " . $e->getMessage());
        return ['status' => 'error', 'message' => 'Obecná chyba při přidávání filmu.'];
    }
}

/**
 * Update an existing screening.
 * @param int $id Screening ID.
 * @param array $data Data from the POST request.
 * @return array Result status and message.
 */
function updateMovie($id, $data) {
     // Basic validation
    $required = ['title', 'duration', 'screening_date', 'screening_time', 'genre', 'description'];
     foreach ($required as $field) {
        if (!isset($data[$field])) { // Allow empty description/genre
            return ['status' => 'error', 'message' => "Chybí pole: $field"];
        }
    }
    
    try {
        $pdo = Database::getConnection(); // Use Database class
        
        $sql = "UPDATE screenings SET 
                title = :title,
                duration = :duration,
                genre = :genre,
                description = :description,
                screening_date = :screening_date,
                screening_time = :screening_time";
        
        $params = [
            'id' => $id,
            'title' => $data['title'],
            'duration' => intval($data['duration']),
            'genre' => $data['genre'] ?? 'Nezařazeno',
            'description' => $data['description'] ?? '',
            'screening_date' => $data['screening_date'],
        ];

        // Decode screening times JSON and get the first one
        $screeningTimes = json_decode($data['screening_time'], true);
         if (json_last_error() !== JSON_ERROR_NONE || !is_array($screeningTimes)) {
             return ['status' => 'error', 'message' => 'Neplatný formát časů promítání (JSON pole).'];
        }
        $params['screening_time'] = $screeningTimes[0] ?? '00:00:00';

        // Add image update only if a new image is provided
        if (!empty($data['image'])) {
            $base64Image = preg_replace('#^data:image/\w+;base64,#i', '', $data['image']);
            $imageData = base64_decode($base64Image);
             if ($imageData === false) {
                 return ['status' => 'error', 'message' => 'Neplatný formát obrázku (base64).'];
            }
            $sql .= ", image = :image";
            $params['image'] = $imageData;
        }
        
        $sql .= " WHERE id_screening = :id";
        
        $stmt = $pdo->prepare($sql);

        // Bind parameters explicitly
        $stmt->bindParam(':id', $params['id'], PDO::PARAM_INT);
        $stmt->bindParam(':title', $params['title']);
        $stmt->bindParam(':duration', $params['duration'], PDO::PARAM_INT);
        $stmt->bindParam(':genre', $params['genre']);
        $stmt->bindParam(':description', $params['description']);
        $stmt->bindParam(':screening_date', $params['screening_date']);
        $stmt->bindParam(':screening_time', $params['screening_time']);
        if (isset($params['image'])) {
            $stmt->bindParam(':image', $params['image'], PDO::PARAM_LOB); // Specify LOB type
        }
        
        $stmt->execute();
        
        // Check if any row was actually updated
        if ($stmt->rowCount() > 0) {
            return ['status' => 'success', 'message' => 'Film byl úspěšně aktualizován.'];
        } else {
            // It's possible the movie ID didn't exist or no data changed
            // Check if movie exists to give a better message
            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM screenings WHERE id_screening = :id");
            $checkStmt->execute(['id' => $id]);
            if ($checkStmt->fetchColumn() == 0) { // Use == instead of === for potential string '0' from fetchColumn
                 return ['status' => 'error', 'message' => 'Film s daným ID nebyl nalezen.'];
            }
            // If it exists, maybe no data changed
            return ['status' => 'success', 'message' => 'Film aktualizován (žádné změny dat).'];
        }
    } catch (PDOException $e) {
        error_log("API Error (updateMovie): " . $e->getMessage());
        return ['status' => 'error', 'message' => 'Chyba při aktualizaci filmu: ' . $e->getMessage()];
     } catch (Exception $e) {
        error_log("API Error (updateMovie - General): " . $e->getMessage());
        return ['status' => 'error', 'message' => 'Obecná chyba při aktualizaci filmu.'];
    }
}

/**
 * Delete a screening.
 * @param int $id Screening ID.
 * @return array Result status and message.
 */
function deleteMovie($id) {
    try {
        $pdo = Database::getConnection(); // Use Database class
        
        // Check for related reservations first
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM reservations WHERE id_screening = :id AND status = 'active'");
        $stmt->execute(['id' => $id]);
        
        if ($stmt->fetchColumn() > 0) {
            return ['status' => 'error', 'message' => 'Film nelze smazat, protože k němu existují aktivní rezervace.'];
        }
        
        // Delete the screening
        $stmt = $pdo->prepare("DELETE FROM screenings WHERE id_screening = :id");
        $stmt->execute(['id' => $id]);
        
        // Check if a row was actually deleted
        if ($stmt->rowCount() > 0) {
            return ['status' => 'success', 'message' => 'Film byl úspěšně smazán.'];
        } else {
            return ['status' => 'error', 'message' => 'Film s daným ID nebyl nalezen nebo již byl smazán.'];
        }
    } catch (PDOException $e) {
         error_log("API Error (deleteMovie): " . $e->getMessage());
        // Check for foreign key constraint violation (though we checked reservations, maybe others exist)
        if ($e->getCode() == '23503') { // PostgreSQL foreign key violation code
             return ['status' => 'error', 'message' => 'Film nelze smazat kvůli existujícím závislostem (např. rezervace).'];
        }
        return ['status' => 'error', 'message' => 'Chyba při mazání filmu: ' . $e->getMessage()];
    }
}

// --- Request Handling ---

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // No authentication needed for getting movies (public view)
    $response = getAllMovies();
    echo json_encode($response);
    exit;
}

if ($method === 'POST') {
    // All POST actions require admin login
    global $auth; // Make the $auth instance from session_check.php available
    $auth->requireLogin(true); // Call the method on the $auth instance
    
    $action = $_POST['action'] ?? '';
    $response = ['status' => 'error', 'message' => 'Neplatná akce nebo chybějící parametr action.'];
    
    switch ($action) {
        case 'add':
            $response = addMovie($_POST);
            break;
            
        case 'update':
            if (isset($_POST['id'])) {
                $response = updateMovie($_POST['id'], $_POST);
            } else {
                 $response = ['status' => 'error', 'message' => 'Chybí ID filmu pro aktualizaci.'];
            }
            break;
            
        case 'delete':
            if (isset($_POST['id'])) {
                $response = deleteMovie($_POST['id']);
            } else {
                 $response = ['status' => 'error', 'message' => 'Chybí ID filmu pro smazání.'];
            }
            break;
        
        // Add other POST actions here if needed in the future
    }
    
    echo json_encode($response);
    exit;
}

// Handle other methods if necessary (PUT, DELETE, etc.)
http_response_code(405); // Method Not Allowed
echo json_encode(['status' => 'error', 'message' => 'Metoda není povolena.']);
exit;
?>
