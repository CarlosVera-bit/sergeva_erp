<?php
include '../backend/config/Database.php';

try {
    $db = new Database();
    $conn = $db->connect();
    $result = $conn->query('SHOW TABLES');
    
    echo "Tablas en la base de datos sergeva_erp:\n";
    while($row = $result->fetch_array()) {
        echo "- " . $row[0] . "\n";
    }
} catch(Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>