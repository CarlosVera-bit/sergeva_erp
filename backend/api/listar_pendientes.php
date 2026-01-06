<?php
// filepath: backend/api/listar_pendientes.php
// Endpoint para que admins vean solicitudes pendientes

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
    $id_admin = $_GET['id_admin'] ?? null;
    $id_supervisor = $_GET['id_supervisor'] ?? null;
    $estado = $_GET['estado'] ?? 'pendiente';
    
    // Verificar permisos
    if ($id_admin) {
        $sqlAdmin = "SELECT rol FROM usuarios WHERE id_usuario = ? AND rol = 'admin'";
        $stmtAdmin = $conn->prepare($sqlAdmin);
        $stmtAdmin->bind_param("i", $id_admin);
        $stmtAdmin->execute();
        $resultAdmin = $stmtAdmin->get_result();
        
        if ($resultAdmin->num_rows === 0) {
            Response::error('Usuario no encontrado o no es administrador', 403);
        }
    } elseif ($id_supervisor) {
        // Si es supervisor, solo puede ver sus propias solicitudes
        // No es estrictamente necesario verificar el rol aquí si filtramos por id_supervisor en la query principal
    } else {
        Response::error('Se requiere id_admin o id_supervisor', 400);
    }
    
    // Construir query con JOIN para obtener datos del supervisor
    $where = "WHERE 1=1";
    $params = [];
    $types = "";

    if ($estado !== 'todos') {
        $where .= " AND s.estado = ?";
        $params[] = $estado;
        $types .= "s";
    }

    if ($id_supervisor) {
        $where .= " AND s.id_supervisor = ?";
        $params[] = $id_supervisor;
        $types .= "i";
    }

    $sql = "SELECT 
                s.id_solicitud,
                s.id_supervisor,
                u.nombre_completo as nombre_supervisor,
                u.email as email_supervisor,
                s.tabla_objetivo,
                s.id_registro,
                s.motivo,
                s.estado,
                s.fecha_solicitud,
                s.fecha_respuesta,
                s.id_admin_respuesta,
                s.observaciones_admin,
                admin.nombre_completo as nombre_admin_respuesta
            FROM solicitudes_edicion s
            INNER JOIN usuarios u ON s.id_supervisor = u.id_usuario
            LEFT JOIN usuarios admin ON s.id_admin_respuesta = admin.id_usuario
            $where
            ORDER BY s.fecha_solicitud DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $solicitudes = [];
    while ($row = $result->fetch_assoc()) {
        $solicitudes[] = $row;
    }
    
    Response::success([
        'solicitudes' => $solicitudes,
        'total' => count($solicitudes)
    ], 'Solicitudes obtenidas correctamente', 200);
    
} else {
    Response::error('Método no permitido', 405);
}

$db->closeConnection();
