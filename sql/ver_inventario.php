<?php
include '../backend/config/Database.php';
$db = new Database();
$conn = $db->connect();
echo "Inventario:\n";
$result = $conn->query('DESCRIBE inventario');
while($row = $result->fetch_assoc()) {
    echo '- ' . $row['Field'] . ' (' . $row['Type'] . ")\n";
}

echo "\nProyectos supervisados:\n";
$result = $conn->query('DESCRIBE proyectos_supervisados');
while($row = $result->fetch_assoc()) {
    echo '- ' . $row['Field'] . ' (' . $row['Type'] . ")\n";
}
?>