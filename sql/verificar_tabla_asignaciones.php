<?php
include '../backend/config/Database.php';
$db = new Database();
$conn = $db->connect();

$result = $conn->query("SHOW TABLES LIKE 'cronograma_asignaciones'");
if (!$result) {
    echo "Error: " . $conn->error . "\n";
    exit;
}
if ($result->num_rows === 0) {
    echo "Tabla cronograma_asignaciones NO existe\n";
} else {
    echo "Tabla cronograma_asignaciones existe\n";
}
?>
