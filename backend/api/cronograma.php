<?php
// filepath: backend/api/cronograma.php

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
        $sql = "SELECT id_cronograma, id_ot, id_trabajador, fecha_inicio, fecha_fin, fecha_asignacion, id_supervisor, observaciones, estado FROM cronograma";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            Response::error('Error en la consulta: ' . $conn->error, 400);
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        Response::success($data, 'Cronograma obtenido correctamente', 200);
        
    } elseif ($method === 'POST') {
        // Crear nueva asignación
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id_ot']) || !isset($input['id_trabajador']) || 
            !isset($input['fecha_inicio']) || !isset($input['fecha_fin'])) {
            Response::error('Faltan campos requeridos', 400);
        }
        
        $stmt = $conn->prepare("INSERT INTO cronograma 
            (id_ot, id_trabajador, fecha_inicio, fecha_fin, fecha_asignacion, observaciones, estado) 
            VALUES (?, ?, ?, ?, NOW(), ?, ?)");
        
        $estado = $input['estado'] ?? 'asignado';
        $observaciones = $input['observaciones'] ?? '';
        
        $stmt->bind_param(
            "iissss",
            $input['id_ot'],
            $input['id_trabajador'],
            $input['fecha_inicio'],
            $input['fecha_fin'],
            $observaciones,
            $estado
        );
        
        if ($stmt->execute()) {
            Response::success([
                'id_cronograma' => $stmt->insert_id
            ], 'Asignación creada exitosamente', 201);
        } else {
            Response::error('Error al crear asignación: ' . $stmt->error, 400);
        }
        
    } elseif ($method === 'PUT') {
        // Actualizar asignación
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        
        if (!$id) {
            Response::error('ID de cronograma no proporcionado', 400);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $updates = [];
        $types = "";
        $values = [];
        
        if (isset($input['id_ot'])) {
            $updates[] = "id_ot = ?";
            $types .= "i";
            $values[] = $input['id_ot'];
        }
        if (isset($input['id_trabajador'])) {
            $updates[] = "id_trabajador = ?";
            $types .= "i";
            $values[] = $input['id_trabajador'];
        }
        if (isset($input['fecha_inicio'])) {
            $updates[] = "fecha_inicio = ?";
            $types .= "s";
            $values[] = $input['fecha_inicio'];
        }
        if (isset($input['fecha_fin'])) {
            $updates[] = "fecha_fin = ?";
            $types .= "s";
            $values[] = $input['fecha_fin'];
        }
        if (isset($input['observaciones'])) {
            $updates[] = "observaciones = ?";
            $types .= "s";
            $values[] = $input['observaciones'];
        }
        if (isset($input['estado'])) {
            $updates[] = "estado = ?";
            $types .= "s";
            $values[] = $input['estado'];
        }
        
        if (empty($updates)) {
            Response::error('No hay campos para actualizar', 400);
        }
        
        $values[] = $id;
        $types .= "i";
        
        $sql = "UPDATE cronograma SET " . implode(", ", $updates) . " WHERE id_cronograma = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$values);
        
        if ($stmt->execute()) {
            Response::success(null, 'Asignación actualizada exitosamente', 200);
        } else {
            Response::error('Error al actualizar asignación: ' . $stmt->error, 400);
        }
        
    } elseif ($method === 'DELETE') {
        // Eliminar asignación
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        
        if (!$id) {
            Response::error('ID de cronograma no proporcionado', 400);
        }
        
        $stmt = $conn->prepare("DELETE FROM cronograma WHERE id_cronograma = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            Response::success(null, 'Asignación eliminada exitosamente', 200);
        } else {
            Response::error('Error al eliminar asignación: ' . $stmt->error, 400);
        }
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}