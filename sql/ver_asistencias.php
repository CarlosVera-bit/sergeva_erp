<?php
include '../backend/config/Database.php';

$db = new Database();
$conn = $db->connect();

$result = $conn->query("SELECT id_asistencia, id_usuario, tipo_registro, fecha_hora, id_proyecto FROM asistencias_biometricas ORDER BY id_asistencia DESC LIMIT 10");
while ($row = $result->fetch_assoc()) {
    echo 'ID: ' . $row['id_asistencia'] . ' | Usuario: ' . $row['id_usuario'] . ' | Tipo: ' . $row['tipo_registro'] . ' | Fecha: ' . $row['fecha_hora'] . ' | Proyecto: ' . $row['id_proyecto'] . "\n";
}

?>
