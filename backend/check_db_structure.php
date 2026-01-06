<?php
require_once 'config/Database.php';

$db = new Database();
$conn = $db->connect();

echo "=== ESTRUCTURA DE LA TABLA cotizaciones ===\n";
$result = $conn->query("DESCRIBE cotizaciones");
while ($row = $result->fetch_assoc()) {
    echo $row['Field'] . " - " . $row['Type'] . "\n";
}

echo "\n=== ESTRUCTURA DE LA TABLA detalle_cotizacion ===\n";
$result = $conn->query("DESCRIBE detalle_cotizacion");
while ($row = $result->fetch_assoc()) {
    echo $row['Field'] . " - " . $row['Type'] . "\n";
}

$db->closeConnection();
