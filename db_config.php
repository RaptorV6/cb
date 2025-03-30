<?php
// File: db_config.php
// Database connection parameters
$db_config = [
    'host' => '10.40.20.201',
    'port' => '5432',
    'db_name' => 'cb',
    'user' => 'cb_user',
    'password' => 'mEga_cbA_pAsS*3289'
];

/**
 * Function to get database connection
 * @return PDO Database connection object
 */
function getDbConnection() {
    global $db_config;
    
    try {
        // Create a new PDO instance
        $dsn = "pgsql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['db_name']}";
        $pdo = new PDO($dsn, $db_config['user'], $db_config['password']);
        
        // Set error mode to exception
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        return $pdo;
    } catch (PDOException $e) {
        // Handle connection error
        die("Database connection failed: " . $e->getMessage());
    }
}
?>