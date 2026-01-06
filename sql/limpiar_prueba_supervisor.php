<?php
include '../backend/config/Database.php';
$database = new Database();
$conn = $database->connect();
$conn->query("DELETE FROM cronograma_asignaciones WHERE observaciones = 'Prueba supervisor inexistente'");
$afectadas = $conn->affected_rows;
$database->closeConnection();
echo "Asignaciones eliminadas: {$afectadas}\n";
?>
