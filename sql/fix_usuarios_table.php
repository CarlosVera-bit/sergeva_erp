<?php
include '../backend/config/Database.php';
$db = new Database();
$conn = $db->connect();

$queries = [
    "ALTER TABLE usuarios ADD PRIMARY KEY (id_usuario)",
    "ALTER TABLE usuarios MODIFY id_usuario INT(11) NOT NULL AUTO_INCREMENT"
];

foreach ($queries as $query) {
    if ($conn->query($query)) {
        echo "Ejecutado: $query\n";
    } else {
        echo "Error en '$query': " . $conn->error . "\n";
    }
}
?>
