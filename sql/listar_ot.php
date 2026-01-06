<?php
include '../backend/config/Database.php';

$db = new Database();
$conn = $db->connect();

$result = $conn->query("SELECT id_ot, numero_ot, estado FROM ordenes_trabajo LIMIT 20");
if (!$result) {
    echo "Error: " . $conn->error . "\n";
    exit;
}
while ($row = $result->fetch_assoc()) {
    echo $row['id_ot'] . ' - ' . $row['numero_ot'] . ' - ' . $row['estado'] . "\n";
}
?>
