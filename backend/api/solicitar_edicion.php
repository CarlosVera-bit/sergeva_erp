<?php
// filepath: backend/api/solicitar_edicion.php
// Endpoint para que supervisores soliciten permiso de edición

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
    
    $id_supervisor = $input['id_supervisor'] ?? null;
    $tabla = $input['tabla'] ?? null;
    $id_registro = $input['id_registro'] ?? null;
    $motivo = trim($input['motivo'] ?? '');
    
    // Validaciones
    if (!$id_supervisor || !$tabla || !$id_registro || empty($motivo)) {
        Response::error('Faltan campos obligatorios: id_supervisor, tabla, id_registro, motivo', 400);
    }
    
    // Verificar que el usuario existe y es supervisor
    $sqlUser = "SELECT rol FROM usuarios WHERE id_usuario = ? AND rol = 'supervisor'";
    $stmtUser = $conn->prepare($sqlUser);
    $stmtUser->bind_param("i", $id_supervisor);
    $stmtUser->execute();
    $resultUser = $stmtUser->get_result();
    
    if ($resultUser->num_rows === 0) {
        Response::error('Usuario no encontrado o no es supervisor', 403);
    }
    
    // Whitelist de tablas permitidas
    $tablas_permitidas = [
        'ordenes_trabajo',
        'clientes',
        'cotizaciones',
        'proyectos',
        'trabajadores',
        'pedidos_compra'
    ];
    
    if (!in_array($tabla, $tablas_permitidas)) {
        Response::error('Tabla no permitida para solicitudes de edición', 400);
    }
    
    // Verificar si ya existe una solicitud pendiente o aprobada para este registro
    $sqlCheck = "SELECT id_solicitud, estado FROM solicitudes_edicion 
                 WHERE id_supervisor = ? 
                 AND tabla_objetivo = ? 
                 AND id_registro = ? 
                 AND estado IN ('pendiente', 'aprobada')";
    $stmtCheck = $conn->prepare($sqlCheck);
    $stmtCheck->bind_param("isi", $id_supervisor, $tabla, $id_registro);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();
    
    if ($resultCheck->num_rows > 0) {
        $existing = $resultCheck->fetch_assoc();
        if ($existing['estado'] === 'pendiente') {
            Response::error('Ya existe una solicitud pendiente para este registro', 400);
        } else if ($existing['estado'] === 'aprobada') {
            Response::success([
                'id_solicitud' => $existing['id_solicitud'],
                'ya_aprobada' => true
            ], 'Ya tienes acceso aprobado para editar este registro', 200);
        }
    }
    
    // Insertar nueva solicitud
    $sql = "INSERT INTO solicitudes_edicion (id_supervisor, tabla_objetivo, id_registro, motivo) 
            VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("isis", $id_supervisor, $tabla, $id_registro, $motivo);
    
    if ($stmt->execute()) {
        $id_solicitud = $conn->insert_id;
        Response::success([
            'id_solicitud' => $id_solicitud,
            'mensaje' => 'Solicitud enviada al administrador'
        ], 'Solicitud creada exitosamente', 201);
    } else {
        Response::error('Error al crear la solicitud: ' . $stmt->error, 500);
    }
} else {
    Response::error('Método no permitido', 405);
}

$db->closeConnection();
