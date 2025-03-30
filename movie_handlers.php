<?php
require_once 'db_config.php';
require_once 'session_check.php';

header('Content-Type: application/json');

// Debug logging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    error_log("Received POST data:");
    error_log(print_r($_POST, true));

    if (!isset($_POST['action'])) {
        echo json_encode(['status' => 'error', 'message' => 'Chybí parametr action']);
        exit;
    }

    try {
        $pdo = getDbConnection();

        switch ($_POST['action']) {
            case 'add':
                // Kontrola povinných polí
                $required = ['title', 'duration', 'screening_date', 'screening_time'];
                foreach ($required as $field) {
                    if (!isset($_POST[$field]) || empty($_POST[$field])) {
                        echo json_encode([
                            'status' => 'error',
                            'message' => "Chybí povinné pole: $field"
                        ]);
                        exit;
                    }
                }

                // Zpracování času - vezmeme první čas z JSON pole
                $times = json_decode($_POST['screening_time'], true);
                $firstTime = $times[0] ?? '00:00';

                // Příprava SQL dotazu
                $sql = "INSERT INTO screenings 
                        (title, duration, genre, description, screening_date, screening_time) 
                        VALUES 
                        (:title, :duration, :genre, :description, :screening_date, :screening_time)";

                $stmt = $pdo->prepare($sql);

                // Příprava parametrů
                $params = [
                    'title' => $_POST['title'],
                    'duration' => intval($_POST['duration']),
                    'genre' => $_POST['genre'] ?: 'Nezařazeno', // Výchozí hodnota pokud není žánr
                    'description' => $_POST['description'] ?? '',
                    'screening_date' => $_POST['screening_date'],
                    'screening_time' => $firstTime
                ];

                error_log("Executing SQL with params:");
                error_log(print_r($params, true));

                if ($stmt->execute($params)) {
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'Film byl úspěšně přidán'
                    ]);
                } else {
                    echo json_encode([
                        'status' => 'error',
                        'message' => 'Nepodařilo se přidat film'
                    ]);
                }
                break;

            default:
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Neznámá akce'
                ]);
        }
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        echo json_encode([
            'status' => 'error',
            'message' => 'Databázová chyba: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        error_log("General error: " . $e->getMessage());
        echo json_encode([
            'status' => 'error',
            'message' => 'Chyba: ' . $e->getMessage()
        ]);
    }
    exit;
}

// GET požadavky pro načtení filmů
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = getDbConnection();
        $stmt = $pdo->query("
            SELECT 
                id_screening,
                title,
                duration,
                genre,
                description,
                image,
                screening_date,
                screening_time::varchar as screening_time
            FROM screenings 
            ORDER BY screening_date DESC, screening_time ASC
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Chyba při načítání filmů: ' . $e->getMessage()
        ]);
    }
    exit;
}
?>