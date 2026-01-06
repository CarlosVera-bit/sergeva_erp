<?php
// filepath: backend/api/movimientos_inventario.php

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
        $sql = "SELECT id_movimiento, id_producto, id_ot, tipo_movimiento, cantidad, referencia_documento, id_usuario, fecha_movimiento, observaciones FROM movimientos_inventario";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            Response::error('Error en la consulta: ' . $conn->error, 400);
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        Response::success($data, 'Movimientos de inventario obtenidos correctamente', 200);
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}