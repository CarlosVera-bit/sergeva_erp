<?php
// filepath: backend/api/inventario.php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/Database.php';
require_once '../config/Response.php';

$db = new Database();
$conn = $db->connect();

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $solo_activos = isset($_GET['solo_activos']) && $_GET['solo_activos'] == '1';

        // JOIN con la tabla productos para obtener todos los campos necesarios
        $sql = "SELECT 
                    i.id_inventario,
                    i.id_producto,
                    i.stock_actual,
                    i.ubicacion_bodega,
                    i.ultima_actualizacion,
                    p.codigo_producto,
                    p.nombre,
                    p.descripcion,
                    p.unidad_medida,
                    p.stock_minimo,
                    p.precio_unitario,
                    p.categoria,
                    p.activo
                FROM inventario i
                INNER JOIN productos p ON i.id_producto = p.id_producto
                " . ($solo_activos ? " WHERE p.activo = 1" : "") . "
                ORDER BY p.nombre ASC";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            Response::error('Error en la consulta: ' . $conn->error, 400);
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            // Convertir tipos numéricos
            $row['id_inventario'] = (int)$row['id_inventario'];
            $row['id_producto'] = (int)$row['id_producto'];
            $row['stock_actual'] = (int)$row['stock_actual'];
            $row['stock_minimo'] = (int)$row['stock_minimo'];
            $row['precio_unitario'] = $row['precio_unitario'] ? (float)$row['precio_unitario'] : null;
            $row['activo'] = isset($row['activo']) ? (int)$row['activo'] : null;
            
            $data[] = $row;
        }
        
        Response::success($data, 'Inventario obtenido correctamente', 200);
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}