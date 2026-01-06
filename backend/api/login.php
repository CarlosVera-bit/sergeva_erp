<?php
// backend/api/login.php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/Database.php';
require_once '../config/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Método no permitido. Use POST', 405);
}

// Obtener datos del body
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['password'])) {
    Response::error('Email y contraseña son requeridos', 400);
}

$email = $input['email'];
$password = $input['password'];

$db = new Database();
$conn = $db->connect();

try {
    // Buscar usuario por email
    $email_escaped = $conn->real_escape_string($email);
    $sql = "SELECT id_usuario, nombre_completo, email, password_hash, rol, activo 
            FROM usuarios 
            WHERE email = '$email_escaped'";
    
    $result = $conn->query($sql);
    
    if (!$result || $result->num_rows === 0) {
        Response::error('Email o contraseña incorrectos', 401);
    }
    
    $user = $result->fetch_assoc();
    
    // Verificar si el usuario está activo
    if (!$user['activo']) {
        Response::error('La cuenta de usuario está inactiva', 403);
    }
    
    // Verificar la contraseña con password_verify
    if (!password_verify($password, $user['password_hash'])) {
        Response::error('Email o contraseña incorrectos', 401);
    }
    
    // Remover el password_hash antes de enviar
    unset($user['password_hash']);
    
    Response::success($user, 'Login exitoso', 200);
    
} catch (Exception $e) {
    Response::error('Error en el servidor: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}