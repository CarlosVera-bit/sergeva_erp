<?php
// filepath: C:\xampp\htdocs\sergeva-os\backend\api\productos.php

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
        $where = $solo_activos ? " WHERE activo = 1" : "";

        $sql = "SELECT id_producto, codigo_producto, nombre, descripcion, unidad_medida, categoria, stock_minimo, stock_actual, precio_unitario, activo, fecha_creacion FROM productos" . $where;

        $result = $conn->query($sql);

        if (!$result) {
            Response::error('Error en la consulta: ' . $conn->error, 400);
        }

        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        Response::success($data, 'Productos obtenidos correctamente', 200);
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}