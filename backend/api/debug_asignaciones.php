<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once '../config/Database.php';

$db = new Database();
$conn = $db->connect();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $fecha = $_GET['fecha'] ?? date('Y-m-d');
    $id_trabajador = $_GET['id_trabajador'] ?? null;
    
    // Obtener todas las asignaciones para la fecha
    $sql = "SELECT ca.*, ot.numero_ot, ot.estado as ot_estado, t.nombres, t.apellidos
            FROM cronograma_asignaciones ca
            LEFT JOIN ordenes_trabajo ot ON ca.id_ot = ot.id_ot  
            LEFT JOIN trabajadores t ON ca.id_trabajador = t.id_trabajador
            WHERE ca.fecha_asignada = '$fecha'";
    
    if ($id_trabajador) {
        $sql .= " AND ca.id_trabajador = " . intval($id_trabajador);
    }
    
    $sql .= " ORDER BY ca.id_trabajador, ca.id_ot";
    
    $result = $conn->query($sql);
    $asignaciones = [];
    
    while ($row = $result->fetch_assoc()) {
        $asignaciones[] = $row;
    }
    
    // Información adicional
    $info = [
        'fecha_consultada' => $fecha,
        'total_asignaciones' => count($asignaciones),
        'asignaciones_activas' => array_filter($asignaciones, fn($a) => $a['estado'] === 'ACTIVA'),
        'trabajadores_con_asignaciones' => array_unique(array_column($asignaciones, 'id_trabajador')),
        'detalle_asignaciones' => $asignaciones
    ];
    
    echo json_encode([
        'success' => true,
        'data' => $info
    ], JSON_PRETTY_PRINT);
}
?>