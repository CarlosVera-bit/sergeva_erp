<?php
include '../backend/config/Database.php';

try {
    $db = new Database();
    $conn = $db->connect();
    
    echo "Estructura tabla usuarios:\n";
    $result = $conn->query("DESCRIBE usuarios");
    while($row = $result->fetch_assoc()) {
        echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
    }
    
    echo "\nUsuarios existentes:\n";
    $result = $conn->query("SELECT * FROM usuarios");
    while($row = $result->fetch_assoc()) {
        echo "ID: " . $row['id_usuario'] . " - " . $row['nombre'] . " - " . $row['email'] . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>