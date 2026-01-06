<?php
// filepath: backend/api/ot_links.php
// API REST para gestionar links de órdenes de trabajo

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
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
        // Obtener links de una orden de trabajo
        $id_ot = isset($_GET['id_ot']) ? intval($_GET['id_ot']) : null;
        
        if (!$id_ot) {
            Response::error('Se requiere el ID de la orden de trabajo', 400);
        }
        
        $sql = "SELECT 
                    l.id_link,
                    l.id_ot,
                    l.id_usuario,
                    l.url,
                    l.titulo,
                    l.descripcion,
                    l.fecha_creacion,
                    u.nombre_completo as usuario_nombre
                FROM ot_links l
                LEFT JOIN usuarios u ON l.id_usuario = u.id_usuario
                WHERE l.id_ot = ?
                ORDER BY l.fecha_creacion DESC";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id_ot);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $links = [];
        while ($row = $result->fetch_assoc()) {
            $links[] = $row;
        }
        
        Response::success($links, 'Links obtenidos correctamente', 200);
        
    } elseif ($method === 'POST') {
        // Crear nuevo link
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos requeridos
        if (!isset($input['id_ot']) || !isset($input['url'])) {
            Response::error('Faltan campos requeridos: id_ot, url', 400);
        }
        
        $id_ot = intval($input['id_ot']);
        $id_usuario = isset($input['id_usuario']) ? intval($input['id_usuario']) : 1; // Default admin
        $url = $conn->real_escape_string($input['url']);
        $titulo = isset($input['titulo']) ? $conn->real_escape_string($input['titulo']) : null;
        $descripcion = isset($input['descripcion']) ? $conn->real_escape_string($input['descripcion']) : null;
        
        // Validar que la URL sea válida
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            Response::error('La URL proporcionada no es válida', 400);
        }
        
        // Verificar que la OT existe
        $check = $conn->query("SELECT id_ot FROM ordenes_trabajo WHERE id_ot = $id_ot");
        if ($check->num_rows === 0) {
            Response::error('La orden de trabajo no existe', 404);
        }
        
        // Insertar link
        $stmt = $conn->prepare("INSERT INTO ot_links (id_ot, id_usuario, url, titulo, descripcion) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("iisss", $id_ot, $id_usuario, $url, $titulo, $descripcion);
        
        if ($stmt->execute()) {
            $id_link = $stmt->insert_id;
            
            // Obtener el link recién creado
            $result = $conn->query("SELECT l.*, u.nombre_completo as usuario_nombre 
                                    FROM ot_links l 
                                    LEFT JOIN usuarios u ON l.id_usuario = u.id_usuario 
                                    WHERE l.id_link = $id_link");
            $link = $result->fetch_assoc();
            
            Response::success($link, 'Link agregado correctamente', 201);
        } else {
            Response::error('Error al agregar link: ' . $conn->error, 500);
        }
        
        $stmt->close();
        
    } elseif ($method === 'DELETE') {
        // Eliminar link
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        
        if (!$id) {
            Response::error('Se requiere el ID del link', 400);
        }
        
        // Verificar que el link existe
        $check = $conn->query("SELECT id_link FROM ot_links WHERE id_link = $id");
        if ($check->num_rows === 0) {
            Response::error('Link no encontrado', 404);
        }
        
        // Eliminar link
        $stmt = $conn->prepare("DELETE FROM ot_links WHERE id_link = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            Response::success(null, 'Link eliminado correctamente', 200);
        } else {
            Response::error('Error al eliminar link: ' . $conn->error, 500);
        }
        
        $stmt->close();
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}
