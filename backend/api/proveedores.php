<?php
// filepath: backend/api/proveedores.php

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
        $sql = "SELECT id_proveedor, ruc, nombre_razon_social, direccion, telefono, email, contacto, activo, fecha_registro FROM proveedores ORDER BY fecha_registro DESC";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            Response::error('Error en la consulta: ' . $conn->error, 400);
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $row['activo'] = (int)$row['activo']; // Ensure boolean/int type
            $data[] = $row;
        }
        
        Response::success($data, 'Proveedores obtenidos correctamente', 200);
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['ruc']) || !isset($data['nombre_razon_social'])) {
            Response::error('RUC y Razón Social son obligatorios', 400);
        }

        $ruc = $conn->real_escape_string($data['ruc']);
        
        // Validar RUC único
        $checkSql = "SELECT id_proveedor FROM proveedores WHERE ruc = '$ruc'";
        $checkResult = $conn->query($checkSql);
        if ($checkResult->num_rows > 0) {
            Response::error('El RUC ya está registrado', 409);
        }

        $nombre = $conn->real_escape_string($data['nombre_razon_social']);
        $direccion = isset($data['direccion']) ? "'" . $conn->real_escape_string($data['direccion']) . "'" : "NULL";
        $telefono = isset($data['telefono']) ? "'" . $conn->real_escape_string($data['telefono']) . "'" : "NULL";
        $email = isset($data['email']) ? "'" . $conn->real_escape_string($data['email']) . "'" : "NULL";
        $contacto = isset($data['contacto']) ? "'" . $conn->real_escape_string($data['contacto']) . "'" : "NULL";
        $activo = isset($data['activo']) ? (int)$data['activo'] : 1;

        $sql = "INSERT INTO proveedores (ruc, nombre_razon_social, direccion, telefono, email, contacto, activo) 
                VALUES ('$ruc', '$nombre', $direccion, $telefono, $email, $contacto, $activo)";

        if ($conn->query($sql)) {
            $id = $conn->insert_id;
            $newProvider = [
                'id_proveedor' => $id,
                'ruc' => $data['ruc'],
                'nombre_razon_social' => $data['nombre_razon_social'],
                'direccion' => $data['direccion'] ?? null,
                'telefono' => $data['telefono'] ?? null,
                'email' => $data['email'] ?? null,
                'contacto' => $data['contacto'] ?? null,
                'activo' => $activo,
                'fecha_registro' => date('Y-m-d H:i:s')
            ];
            Response::success($newProvider, 'Proveedor creado correctamente', 201);
        } else {
            Response::error('Error al crear proveedor: ' . $conn->error, 500);
        }
    } elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['id_proveedor']) || !isset($data['ruc']) || !isset($data['nombre_razon_social'])) {
            Response::error('ID, RUC y Razón Social son obligatorios', 400);
        }

        $id = (int)$data['id_proveedor'];
        $ruc = $conn->real_escape_string($data['ruc']);
        
        // Validar RUC único (excluyendo el actual)
        $checkSql = "SELECT id_proveedor FROM proveedores WHERE ruc = '$ruc' AND id_proveedor != $id";
        $checkResult = $conn->query($checkSql);
        if ($checkResult->num_rows > 0) {
            Response::error('El RUC ya está registrado por otro proveedor', 409);
        }

        $nombre = $conn->real_escape_string($data['nombre_razon_social']);
        $direccion = isset($data['direccion']) ? "'" . $conn->real_escape_string($data['direccion']) . "'" : "NULL";
        $telefono = isset($data['telefono']) ? "'" . $conn->real_escape_string($data['telefono']) . "'" : "NULL";
        $email = isset($data['email']) ? "'" . $conn->real_escape_string($data['email']) . "'" : "NULL";
        $contacto = isset($data['contacto']) ? "'" . $conn->real_escape_string($data['contacto']) . "'" : "NULL";
        $activo = isset($data['activo']) ? (int)$data['activo'] : 1;

        $sql = "UPDATE proveedores SET 
                ruc = '$ruc', 
                nombre_razon_social = '$nombre', 
                direccion = $direccion, 
                telefono = $telefono, 
                email = $email, 
                contacto = $contacto, 
                activo = $activo 
                WHERE id_proveedor = $id";

        if ($conn->query($sql)) {
            Response::success($data, 'Proveedor actualizado correctamente', 200);
        } else {
            Response::error('Error al actualizar proveedor: ' . $conn->error, 500);
        }
    } elseif ($method === 'DELETE') {
        if (!isset($_GET['id'])) {
            Response::error('ID es obligatorio', 400);
        }

        $id = (int)$_GET['id'];
        
        // Verificar si tiene dependencias (opcional, pero recomendado)
        // Por ahora hacemos borrado lógico (soft delete) cambiando activo a 0, 
        // o borrado físico si se prefiere. El usuario pidió "eliminar", 
        // pero en sistemas ERP suele ser soft delete. 
        // Sin embargo, la tabla tiene columna 'activo'. 
        // Voy a implementar borrado físico para seguir el estándar de "eliminar", 
        // pero si falla por FK, el usuario debería recibir el error.
        // O mejor, dado que hay campo 'activo', el "eliminar" podría ser desactivar?
        // El usuario dijo "eliminar", y en purchasing.service.ts vi un DELETE real.
        // Haré DELETE real.

        $sql = "DELETE FROM proveedores WHERE id_proveedor = $id";

        if ($conn->query($sql)) {
            Response::success(null, 'Proveedor eliminado correctamente', 200);
        } else {
            // Si falla por foreign key constraint
            if ($conn->errno == 1451) {
                Response::error('No se puede eliminar el proveedor porque tiene registros asociados.', 409);
            } else {
                Response::error('Error al eliminar proveedor: ' . $conn->error, 500);
            }
        }
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}