<?php

class Database {
    private static $pdo = null;
    private static $config = null;

    /**
     * Private constructor to prevent direct instantiation.
     */
    private function __construct() {}

    /**
     * Loads database configuration.
     * Should be called once before the first getConnection call.
     * @param array $dbConfig Associative array with 'host', 'port', 'db_name', 'user', 'password'.
     */
    public static function loadConfig(array $dbConfig) {
        self::$config = $dbConfig;
    }

    /**
     * Gets the PDO database connection instance (Singleton pattern).
     * @return PDO The PDO connection object.
     * @throws Exception If configuration is not loaded or connection fails.
     */
    public static function getConnection() {
        if (self::$pdo === null) {
            if (self::$config === null) {
                // Attempt to load config from default location if not loaded explicitly
                $configFile = __DIR__ . '/../db_config.php';
                if (file_exists($configFile)) {
                    // Load the config array returned by db_config.php
                    $config = require $configFile; 
                    if (is_array($config)) {
                        self::loadConfig($config);
                    } else {
                         throw new Exception("db_config.php did not return a valid configuration array.");
                    }
                } else {
                    throw new Exception("Database configuration not loaded and db_config.php not found at: " . $configFile);
                }
            }

            try {
                $dsn = sprintf(
                    "pgsql:host=%s;port=%s;dbname=%s",
                    self::$config['host'],
                    self::$config['port'],
                    self::$config['db_name']
                );
                self::$pdo = new PDO($dsn, self::$config['user'], self::$config['password']);
                self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // Optional: Set default fetch mode
            } catch (PDOException $e) {
                // Log error instead of dying directly in a class context
                error_log("Database connection failed: " . $e->getMessage());
                throw new Exception("Database connection failed."); // Re-throw generic exception
            }
        }
        return self::$pdo;
    }

    /**
     * Closes the database connection.
     */
    public static function closeConnection() {
        self::$pdo = null;
    }
}
