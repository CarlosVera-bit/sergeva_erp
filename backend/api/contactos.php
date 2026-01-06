<?php
// filepath: backend/api/contactos.php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
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
$debug_file = 'debug_contactos.log';

function log_debug($message, $file) {
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($file, "[$timestamp] $message\n", FILE_APPEND);
}


try {
    // ============================================
    // GET: Listar contactos de un cliente
    // ============================================
    if ($method === 'GET') {
        $id_cliente = isset($_GET['id_cliente']) ? intval($_GET['id_cliente']) : null;

        if (!$id_cliente) {
            Response::error('ID de cliente requerido', 400);
        }

        $sql = "SELECT * FROM clientes_contactos WHERE id_cliente = $id_cliente ORDER BY es_principal DESC, nombre_completo ASC";
        $result = $conn->query($sql);
        
        $data = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
        }
        
        Response::success($data, 'Contactos obtenidos correctamente', 200);
    }
    
    // ============================================
    // POST: Crear nuevo contacto
    // ============================================
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            log_debug("POST: Datos inválidos", $debug_file);
            Response::error('Datos inválidos', 400);
        }
        
        log_debug("POST: Input recibido: " . json_encode($input), $debug_file);
        
        // Verificar si es una acción especial de marcar como principal
        $action = isset($_GET['action']) ? $_GET['action'] : null;
        
        if ($action === 'set_principal') {
            // Marcar contacto como principal
            $id_contacto = $input['id_contacto'] ?? null;
            $id_cliente = $input['id_cliente'] ?? null;
            
            if (!$id_contacto || !$id_cliente) {
                Response::error('ID de contacto e ID de cliente son obligatorios', 400);
            }
            
            // Primero, quitar el principal actual
            $conn->query("UPDATE clientes_contactos SET es_principal = 0 WHERE id_cliente = $id_cliente");
            
            // Luego, marcar el nuevo como principal
            $stmt = $conn->prepare("UPDATE clientes_contactos SET es_principal = 1 WHERE id_contacto = ?");
            $stmt->bind_param("i", $id_contacto);
            
            if ($stmt->execute()) {
                Response::success(['id_contacto' => $id_contacto], 'Contacto marcado como principal', 200);
            } else {
                Response::error('Error al marcar contacto como principal: ' . $stmt->error, 500);
            }
        } else {
            // Crear nuevo contacto (lógica original)
            $id_cliente = $input['id_cliente'] ?? null;
            $nombre_completo = $input['nombre_completo'] ?? null;
            // Otros campos opcionales
            $cargo = $input['cargo'] ?? null;
            $telefono = $input['telefono'] ?? null;
            $email = $input['email'] ?? null;
            $departamento = $input['departamento'] ?? null;
            
            if (!$id_cliente || !$nombre_completo) {
                Response::error('ID de cliente y Nombre Completo son obligatorios', 400);
            }
            
            $stmt = $conn->prepare("INSERT INTO clientes_contactos (id_cliente, nombre_completo, email, telefono, cargo, es_principal) VALUES (?, ?, ?, ?, ?, 0)");
            $stmt->bind_param("issss", $id_cliente, $nombre_completo, $email, $telefono, $cargo);

            
            if ($stmt->execute()) {
                Response::success(['id_contacto' => $conn->insert_id], 'Contacto agregado correctamente', 201);
            } else {
                Response::error('Error al crear contacto: ' . $stmt->error, 500);
            }
        }
    }

    // ============================================
    // PUT: Actualizar contacto
    // ============================================
    if ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            log_debug("PUT: Datos inválidos", $debug_file);
            Response::error('Datos inválidos', 400);
        }
        
        log_debug("PUT: Input recibido: " . json_encode($input), $debug_file);
        
        $id_contacto = $input['id_contacto'] ?? null;
        $nombre_completo = $input['nombre_completo'] ?? null;
        $email = $input['email'] ?? null;
        $telefono = $input['telefono'] ?? null;
        $cargo = $input['cargo'] ?? null;
        
        if (!$id_contacto || !$nombre_completo) {
            Response::error('ID de contacto y Nombre Completo son obligatorios', 400);
        }
        
        $stmt = $conn->prepare("UPDATE clientes_contactos SET nombre_completo = ?, email = ?, telefono = ?, cargo = ? WHERE id_contacto = ?");
        $stmt->bind_param("ssssi", $nombre_completo, $email, $telefono, $cargo, $id_contacto);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0 || $conn->affected_rows === 0) {
                Response::success(['id_contacto' => $id_contacto], 'Contacto actualizado correctamente', 200);
            } else {
                Response::error('No se encontró el contacto', 404);
            }
        } else {
            Response::error('Error al actualizar contacto: ' . $stmt->error, 500);
        }
    }

    // ============================================
    // PATCH: Marcar contacto como principal
    // ============================================
    if ($method === 'PATCH') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            log_debug("PATCH: Datos inválidos", $debug_file);
            Response::error('Datos inválidos', 400);
        }
        
        $id_contacto = $input['id_contacto'] ?? null;
        $id_cliente = $input['id_cliente'] ?? null;
        
        if (!$id_contacto || !$id_cliente) {
            Response::error('ID de contacto e ID de cliente son obligatorios', 400);
        }
        
        // Primero, quitar el principal actual
        $conn->query("UPDATE clientes_contactos SET es_principal = 0 WHERE id_cliente = $id_cliente");
        
        // Luego, marcar el nuevo como principal
        $stmt = $conn->prepare("UPDATE clientes_contactos SET es_principal = 1 WHERE id_contacto = ?");
        $stmt->bind_param("i", $id_contacto);
        
        if ($stmt->execute()) {
            Response::success(['id_contacto' => $id_contacto], 'Contacto marcado como principal', 200);
        } else {
            Response::error('Error al marcar contacto como principal: ' . $stmt->error, 500);
        }
    }
 
    // ============================================
    // DELETE: Eliminar contacto
    // ============================================
    if ($method === 'DELETE') {
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        
        if (!$id) {
            Response::error('ID de contacto requerido', 400);
        }
        
        $sql = "DELETE FROM clientes_contactos WHERE id_contacto = $id";
        
        if ($conn->query($sql)) {
            Response::success(null, 'Contacto eliminado correctamente', 200);
        } else {
            Response::error('Error al eliminar contacto: ' . $conn->error, 500);
        }
    }

} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}
