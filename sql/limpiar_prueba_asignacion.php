<?php
include '../backend/config/Database.php';
$db = new Database();
$conn = $db->connect();

$conn->query("DELETE FROM cronograma_asignaciones WHERE observaciones = 'Prueba manual'");
echo "Eliminadas: " . $conn->affected_rows . "\n";
?>
