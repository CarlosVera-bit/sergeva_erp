<?php
include '../backend/config/Database.php';

$db = new Database();
$conn = $db->connect();

$result = $conn->query("SELECT id_trabajador, CONCAT(nombres, ' ', apellidos) AS nombre FROM trabajadores LIMIT 50");
if (!$result) {
    echo "Error: " . $conn->error . "\n";
    exit;
}
while ($row = $result->fetch_assoc()) {
    echo $row['id_trabajador'] . ' - ' . $row['nombre'] . "\n";
}
?>
