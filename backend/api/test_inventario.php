<?php
header('Content-Type: application/json');

require_once '../config/Database.php';

$db = new Database();
$conn = $db->connect();

// Verificar estructura de productos
echo "=== ESTRUCTURA PRODUCTOS ===\n";
$result = $conn->query('DESCRIBE productos');
while($row = $result->fetch_assoc()) {
    echo $row['Field'] . " - " . $row['Type'] . "\n";
}

echo "\n=== ESTRUCTURA INVENTARIO ===\n";
$result = $conn->query('DESCRIBE inventario');
while($row = $result->fetch_assoc()) {
    echo $row['Field'] . " - " . $row['Type'] . "\n";
}

echo "\n=== DATOS PRODUCTOS (primeros 2) ===\n";
$result = $conn->query('SELECT * FROM productos LIMIT 2');
while($row = $result->fetch_assoc()) {
    print_r($row);
}

echo "\n=== DATOS INVENTARIO (primeros 2) ===\n";
$result = $conn->query('SELECT * FROM inventario LIMIT 2');
while($row = $result->fetch_assoc()) {
    print_r($row);
}
