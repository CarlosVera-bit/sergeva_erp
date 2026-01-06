<?php
include '../backend/config/Database.php';
$db = new Database();
$conn = $db->connect();
echo "Estructura ordenes_trabajo:\n";
$result = $conn->query('DESCRIBE ordenes_trabajo');
while($row = $result->fetch_assoc()) {
    echo '- ' . $row['Field'] . "\n";
}
?>