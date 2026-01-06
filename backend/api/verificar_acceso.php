<?php
// filepath: backend/api/verificar_acceso.php
// Endpoint para verificar si un supervisor tiene acceso aprobado para editar un registro

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id_supervisor = $_GET['id_supervisor'] ?? null;
    $tabla = $_GET['tabla'] ?? null;
    $id_registro = $_GET['id_registro'] ?? null;
    
    // Validaciones
    if (!$id_supervisor || !$tabla || !$id_registro) {
        Response::error('Faltan parámetros: id_supervisor, tabla, id_registro', 400);
    }
    
    // Buscar solicitud aprobada para este supervisor/tabla/registro
    $sql = "SELECT id_solicitud, estado, fecha_respuesta, fecha_solicitud 
            FROM solicitudes_edicion 
            WHERE id_supervisor = ? 
            AND tabla_objetivo = ? 
            AND id_registro = ? 
            ORDER BY fecha_solicitud DESC
            LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("isi", $id_supervisor, $tabla, $id_registro);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $solicitud = $result->fetch_assoc();
        $tiene_acceso = ($solicitud['estado'] === 'aprobada');
        
        Response::success([
            'tiene_acceso' => $tiene_acceso,
            'estado' => $solicitud['estado'],
            'id_solicitud' => $solicitud['id_solicitud'],
            'fecha_solicitud' => $solicitud['fecha_solicitud'],
            'fecha_respuesta' => $solicitud['fecha_respuesta']
        ], $tiene_acceso ? 'Acceso aprobado' : 'Solicitud en estado: ' . $solicitud['estado'], 200);
    } else {
        Response::success([
            'tiene_acceso' => false,
            'estado' => 'ninguna',
            'id_solicitud' => null
        ], 'No hay solicitudes previas', 200);
    }
    
} else {
    Response::error('Método no permitido', 405);
}

$db->closeConnection();
