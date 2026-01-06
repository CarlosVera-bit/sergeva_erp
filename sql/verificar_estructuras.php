<?php
include '../backend/config/Database.php';
try {
    $db = new Database();
    $conn = $db->connect();
    
    echo "Estructura tabla productos:\n";
    $result = $conn->query('DESCRIBE productos');
    while($row = $result->fetch_assoc()) {
        echo '- ' . $row['Field'] . ' (' . $row['Type'] . ")\n";
    }
    
    echo "\nEstructura tabla clientes:\n";
    $result = $conn->query('DESCRIBE clientes');
    while($row = $result->fetch_assoc()) {
        echo '- ' . $row['Field'] . ' (' . $row['Type'] . ")\n";
    }
    
    echo "\nEstructura tabla proveedores:\n";
    $result = $conn->query('DESCRIBE proveedores');
    while($row = $result->fetch_assoc()) {
        echo '- ' . $row['Field'] . ' (' . $row['Type'] . ")\n";
    }
    
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
}
?>