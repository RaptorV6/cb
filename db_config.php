<?php
// File: db_config.php
// Returns the database connection parameters array.

return [ // Use return instead of defining a global variable
    'host' => '10.40.20.201',
    'port' => '5432',
    'db_name' => 'cb',
    'user' => 'cb_user',
    'password' => 'mEga_cbA_pAsS*3289'
];

// Funkce getDbConnection() byla přesunuta do třídy Database (src/Database.php)
// Tento soubor nyní pouze vrací konfigurační pole.
// Extra ']' removed below
?>
