<?php
// Script rápido para diagnosticar el problema
header('Content-Type: application/json; charset=utf-8');

require_once 'backend/config/Database.php';

$db = new Database();
$conn = $db->connect();

// 1. Contar proyectos activos
$sql1 = "SELECT COUNT(*) as total FROM proyectos_supervisados WHERE estado = 'ACTIVO'";
$res1 = $conn->query($sql1);
$row1 = $res1->fetch_assoc();

// 2. Contar OTs que tienen proyectos activos
$sql2 = "SELECT COUNT(DISTINCT ot.id_ot) as total 
         FROM ordenes_trabajo ot
         INNER JOIN proyectos_supervisados ps ON ot.id_ot = ps.id_ot
         WHERE ps.estado = 'ACTIVO' AND ot.estado != 'cancelada'";
$res2 = $conn->query($sql2);
$row2 = $res2->fetch_assoc();

// 3. Listar TODAS las OTs con sus proyectos
$sql3 = "SELECT 
           ot.id_ot,
           ot.numero_ot,
           ot.estado,
           c.nombre_razon_social,
           ps.id_proyecto,
           ps.nombre_proyecto,
           ps.estado as proyecto_estado
         FROM ordenes_trabajo ot
         LEFT JOIN clientes c ON ot.id_cliente = c.id_cliente
         LEFT JOIN proyectos_supervisados ps ON ot.id_ot = ps.id_ot
         WHERE ot.estado != 'cancelada'
         ORDER BY ot.id_ot, ps.id_proyecto";
$res3 = $conn->query($sql3);
$ots_data = [];
while ($row = $res3->fetch_assoc()) {
    $ots_data[] = $row;
}

// 4. Proyectos sin OT
$sql4 = "SELECT id_proyecto, nombre_proyecto, estado, id_ot 
         FROM proyectos_supervisados 
         WHERE estado = 'ACTIVO' AND (id_ot = 0 OR id_ot IS NULL)";
$res4 = $conn->query($sql4);
$proyectos_sin_ot = [];
while ($row = $res4->fetch_assoc()) {
    $proyectos_sin_ot[] = $row;
}

echo json_encode([
    'proyectos_activos_total' => $row1['total'],
    'ots_con_proyectos_activos' => $row2['total'],
    'ots_detalle' => $ots_data,
    'proyectos_sin_ot' => $proyectos_sin_ot
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
