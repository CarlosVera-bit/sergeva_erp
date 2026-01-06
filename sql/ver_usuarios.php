<?php
include '../backend/config/Database.php';

$db = new Database();
$conn = $db->connect();

echo "Estructura tabla usuarios:\n";
$result = $conn->query("DESCRIBE usuarios");
while($row = $result->fetch_assoc()) {
    echo "- {$row['Field']} ({$row['Type']})\n";
}

echo "\nContenido tabla usuarios:\n";
$result = $conn->query("SELECT * FROM usuarios");
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        print_r($row);
    }
} else {
    echo "⚠️  Tabla usuarios está vacía\n";
}
?>
