<?php
require_once 'db_config.php';
require_once 'session_check.php';

function getAllMovies() {
    try {
        $pdo = getDbConnection();
        $stmt = $pdo->query("
            SELECT * FROM screenings 
            ORDER BY screening_date DESC, screening_time ASC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return ['status' => 'error', 'message' => 'Chyba při načítání filmů: ' . $e->getMessage()];
    }
}

function addMovie($data) {
    try {
        $pdo = getDbConnection();
        
        $stmt = $pdo->prepare("
            INSERT INTO screenings (title, duration, genre, description, image, screening_date, screening_time)
            VALUES (:title, :duration, :genre, :description, :image, :screening_date, :screening_time)
        ");
        
        // Převod base64 obrázku na BYTEA
        $imageData = null;
        if (!empty($data['image'])) {
            $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $data['image']));
        }
        
        $stmt->execute([
            'title' => $data['title'],
            'duration' => $data['duration'],
            'genre' => $data['genre'],
            'description' => $data['description'],
            'image' => $imageData,
            'screening_date' => $data['screening_date'],
            'screening_time' => $data['screening_time']
        ]);
        
        return ['status' => 'success', 'message' => 'Film byl úspěšně přidán.'];
    } catch (PDOException $e) {
        return ['status' => 'error', 'message' => 'Chyba při přidávání filmu: ' . $e->getMessage()];
    }
}

function updateMovie($id, $data) {
    try {
        $pdo = getDbConnection();
        
        $sql = "UPDATE screenings SET 
                title = :title,
                duration = :duration,
                genre = :genre,
                description = :description,
                screening_date = :screening_date,
                screening_time = :screening_time";
        
        // Přidat image pouze pokud je poskytnut nový
        if (!empty($data['image'])) {
            $sql .= ", image = :image";
        }
        
        $sql .= " WHERE id_screening = :id";
        
        $stmt = $pdo->prepare($sql);
        
        $params = [
            'id' => $id,
            'title' => $data['title'],
            'duration' => $data['duration'],
            'genre' => $data['genre'],
            'description' => $data['description'],
            'screening_date' => $data['screening_date'],
            'screening_time' => $data['screening_time']
        ];
        
        if (!empty($data['image'])) {
            $params['image'] = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $data['image']));
        }
        
        $stmt->execute($params);
        
        return ['status' => 'success', 'message' => 'Film byl úspěšně aktualizován.'];
    } catch (PDOException $e) {
        return ['status' => 'error', 'message' => 'Chyba při aktualizaci filmu: ' . $e->getMessage()];
    }
}

function deleteMovie($id) {
    try {
        $pdo = getDbConnection();
        
        // Nejprve zkontrolujeme, zda neexistují související rezervace
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM reservations WHERE id_screening = :id");
        $stmt->execute(['id' => $id]);
        
        if ($stmt->fetchColumn() > 0) {
            return ['status' => 'error', 'message' => 'Film nelze smazat, protože k němu existují rezervace.'];
        }
        
        // Pokud nejsou rezervace, smažeme film
        $stmt = $pdo->prepare("DELETE FROM screenings WHERE id_screening = :id");
        $stmt->execute(['id' => $id]);
        
        return ['status' => 'success', 'message' => 'Film byl úspěšně smazán.'];
    } catch (PDOException $e) {
        return ['status' => 'error', 'message' => 'Chyba při mazání filmu: ' . $e->getMessage()];
    }
}

// Zpracování API požadavků
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireLogin(true); // Vyžadovat admin práva
    
    $action = $_POST['action'] ?? '';
    $response = ['status' => 'error', 'message' => 'Neplatný požadavek'];
    
    switch ($action) {
        case 'add':
            $response = addMovie($_POST);
            break;
            
        case 'update':
            if (isset($_POST['id'])) {
                $response = updateMovie($_POST['id'], $_POST);
            }
            break;
            
        case 'delete':
            if (isset($_POST['id'])) {
                $response = deleteMovie($_POST['id']);
            }
            break;
    }
    
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

// Pro GET požadavky vrátíme seznam filmů
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');
    echo json_encode(getAllMovies());
    exit;
}
?>