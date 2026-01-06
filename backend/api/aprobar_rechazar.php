<?php
// filepath: backend/api/aprobar_rechazar.php
// Endpoint para que admins aprueben o rechacen solicitudes

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

$db = new Database();
$conn = $db->connect();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::error('Datos inválidos o JSON malformado', 400);
    }
    
    $id_solicitud = $input['id_solicitud'] ?? null;
    $id_admin = $input['id_admin'] ?? null;
    $accion = $input['accion'] ?? null; // 'aprobar' o 'rechazar'
    $observaciones = trim($input['observaciones'] ?? '');
    
    // Validaciones
    if (!$id_solicitud || !$id_admin || !$accion) {
        Response::error('Faltan campos obligatorios: id_solicitud, id_admin, accion', 400);
    }
    
    if (!in_array($accion, ['aprobar', 'rechazar'])) {
        Response::error('Acción inválida. Debe ser "aprobar" o "rechazar"', 400);
    }
    
    // Verificar que el usuario es admin
    $sqlAdmin = "SELECT rol FROM usuarios WHERE id_usuario = ? AND rol = 'admin'";
    $stmtAdmin = $conn->prepare($sqlAdmin);
    $stmtAdmin->bind_param("i", $id_admin);
    $stmtAdmin->execute();
    $resultAdmin = $stmtAdmin->get_result();
    
    if ($resultAdmin->num_rows === 0) {
        Response::error('Usuario no encontrado o no es administrador', 403);
    }
    
    // Verificar que la solicitud existe y está pendiente
    $sqlCheck = "SELECT estado FROM solicitudes_edicion WHERE id_solicitud = ?";
    $stmtCheck = $conn->prepare($sqlCheck);
    $stmtCheck->bind_param("i", $id_solicitud);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();
    
    if ($resultCheck->num_rows === 0) {
        Response::error('Solicitud no encontrada', 404);
    }
    
    $solicitud = $resultCheck->fetch_assoc();
    if ($solicitud['estado'] !== 'pendiente') {
        Response::error('Esta solicitud ya fue procesada anteriormente', 400);
    }
    
    // Actualizar solicitud
    $nuevo_estado = ($accion === 'aprobar') ? 'aprobada' : 'rechazada';
    
    $sql = "UPDATE solicitudes_edicion 
            SET estado = ?, 
                id_admin_respuesta = ?, 
                fecha_respuesta = NOW(),
                observaciones_admin = ?
            WHERE id_solicitud = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sisi", $nuevo_estado, $id_admin, $observaciones, $id_solicitud);
    
    if ($stmt->execute()) {
        Response::success([
            'id_solicitud' => $id_solicitud,
            'nuevo_estado' => $nuevo_estado,
            'mensaje' => 'Solicitud ' . ($accion === 'aprobar' ? 'aprobada' : 'rechazada') . ' exitosamente'
        ], 'Solicitud procesada correctamente', 200);
    } else {
        Response::error('Error al procesar la solicitud: ' . $stmt->error, 500);
    }
    
} else {
    Response::error('Método no permitido', 405);
}

$db->closeConnection();
