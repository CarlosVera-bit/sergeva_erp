<?php
require_once 'config/Database.php';

$db = new Database();
$conn = $db->connect();

// Actualizar proyectos del supervisor 3 al supervisor 1
$sql = "UPDATE proyectos_supervisados SET id_supervisor = 1 WHERE id_supervisor = 3";

if ($conn->query($sql)) {
    echo json_encode([
        'success' => true,
        'message' => 'Proyectos actualizados correctamente',
        'affected_rows' => $conn->affected_rows
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $conn->error
    ]);
}

$conn->close();
