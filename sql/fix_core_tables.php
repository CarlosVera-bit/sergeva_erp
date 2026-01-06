<?php
include '../backend/config/Database.php';
$db = new Database();
$conn = $db->connect();

define('NL', "\n");

$queries = [
    "ALTER TABLE ordenes_trabajo ADD PRIMARY KEY (id_ot)",
    "ALTER TABLE ordenes_trabajo MODIFY id_ot INT(11) NOT NULL AUTO_INCREMENT",
    "ALTER TABLE trabajadores ADD PRIMARY KEY (id_trabajador)",
    "ALTER TABLE trabajadores MODIFY id_trabajador INT(11) NOT NULL AUTO_INCREMENT"
];

foreach ($queries as $query) {
    if ($conn->query($query)) {
        echo "OK: $query" . NL;
    } else {
        echo "Error en '$query': " . $conn->error . NL;
    }
}
?>
