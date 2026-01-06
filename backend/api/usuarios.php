<?php
// backend/api/usuarios.php

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
        if (isset($_GET['email'])) {
            // Obtener usuario por email (para login)
            $email = $conn->real_escape_string($_GET['email']);
            
            $sql = "SELECT id_usuario, nombre_completo, email, password_hash, rol, activo FROM usuarios WHERE email = '$email'";
            
            $result = $conn->query($sql);
            
            if (!$result) {
                Response::error('Error en la consulta: ' . $conn->error, 400);
            }
            
            if ($result->num_rows === 0) {
                Response::error('Usuario no encontrado', 404);
            }
            
            $data = $result->fetch_assoc();
            
            Response::success($data, 'Usuario encontrado', 200);
            
        } else {
            // Obtener todos los usuarios (sin password_hash)
            $sql = "SELECT id_usuario, nombre_completo, email, rol, activo FROM usuarios";
            
            $result = $conn->query($sql);
            
            if (!$result) {
                Response::error('Error en la consulta: ' . $conn->error, 400);
            }
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            
            Response::success($data, 'Usuarios obtenidos correctamente', 200);
        }
    } else {
        Response::error('Método no permitido', 405);
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}