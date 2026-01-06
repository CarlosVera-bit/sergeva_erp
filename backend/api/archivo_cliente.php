<?php
// filepath: backend/api/archivo_cliente.php

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
        $sql = "SELECT id_archivo, id_cliente, id_ot, tipo_documento, numero_secuencial, nombre_archivo, ruta_archivo, descripcion, fecha_subida FROM archivo_cliente";
        
        // Filtrar por id_cliente si se proporciona
        if (isset($_GET['id_cliente'])) {
            $id_cliente = intval($_GET['id_cliente']);
            $sql .= " WHERE id_cliente = $id_cliente";
        }
        
        $sql .= " ORDER BY fecha_subida DESC";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            Response::error('Error en la consulta: ' . $conn->error, 400);
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        Response::success($data, 'Archivos de cliente obtenidos correctamente', 200);
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}