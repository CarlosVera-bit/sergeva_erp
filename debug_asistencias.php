<?php
require_once 'backend/config/Database.php';
$db = new Database();
$conn = $db->connect();

echo "=== ASISTENCIAS DE HOY ===\n";
$sql = "SELECT a.*, p.nombre_proyecto, u.nombre_completo 
        FROM asistencias_biometricas a 
        LEFT JOIN proyectos_supervisados p ON a.id_proyecto = p.id_proyecto 
        LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
        WHERE DATE(a.fecha_hora) = CURDATE() 
        ORDER BY a.fecha_hora DESC";
$result = $conn->query($sql);
while($row = $result->fetch_assoc()) {
    echo "Usuario: {$row['nombre_completo']} | Proyecto: {$row['nombre_proyecto']} (ID: {$row['id_proyecto']}) | Tipo: {$row['tipo_registro']} | Hora: {$row['fecha_hora']}\n";
}

echo "\n=== PROYECTOS ACTIVOS ===\n";
$sql2 = "SELECT id_proyecto, nombre_proyecto, estado FROM proyectos_supervisados WHERE estado = 'ACTIVO'";
$result2 = $conn->query($sql2);
while($row2 = $result2->fetch_assoc()) {
    echo "ID: {$row2['id_proyecto']} | Nombre: {$row2['nombre_proyecto']} | Estado: {$row2['estado']}\n";
}
?>