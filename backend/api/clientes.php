<?php
// filepath: backend/api/clientes.php

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
$debug_file = 'debug.log';

function log_debug($message, $file) {
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($file, "[$timestamp] $message\n", FILE_APPEND);
}


try {
    // ============================================
    // GET: Listar clientes
    // ============================================
    if ($method === 'GET') {
        // Obtener ID si se solicita uno específico
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;

        if ($id) {
            $sql = "SELECT c.id_cliente, c.ruc_cedula, c.nombre_razon_social, c.direccion, c.telefono, c.email, 
                           cc.nombre_completo AS contacto_principal, c.fecha_registro 
                    FROM clientes c
                    LEFT JOIN clientes_contactos cc ON c.id_cliente = cc.id_cliente AND cc.es_principal = 1
                    WHERE c.id_cliente = $id AND c.deleted_at IS NULL";
            $result = $conn->query($sql);
            
            if ($result && $result->num_rows > 0) {
                Response::success($result->fetch_assoc(), 'Cliente obtenido correctamente', 200);
            } else {
                Response::error('Cliente no encontrado', 404);
            }
        } else {
            $sql = "SELECT c.id_cliente, c.ruc_cedula, c.nombre_razon_social, c.direccion, c.telefono, c.email, 
                           cc.nombre_completo AS contacto_principal, c.fecha_registro 
                    FROM clientes c
                    LEFT JOIN clientes_contactos cc ON c.id_cliente = cc.id_cliente AND cc.es_principal = 1
                    WHERE c.deleted_at IS NULL
                    ORDER BY c.id_cliente DESC";
            
            $result = $conn->query($sql);
            
            if (!$result) {
                Response::error('Error en la consulta: ' . $conn->error, 400);
            }
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            
            Response::success($data, 'Clientes obtenidos correctamente', 200);
        }
    }
    
    // ============================================
    // POST: Crear nuevo cliente
    // ============================================
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            log_debug("POST: Datos inválidos", $debug_file);
            Response::error('Datos inválidos', 400);
        }
        
        log_debug("POST: Input recibido: " . json_encode($input), $debug_file);
        
        $ruc_cedula = $input['ruc_cedula'] ?? null;
        $nombre_razon_social = $input['nombre_razon_social'] ?? null;
        $direccion = $input['direccion'] ?? null;
        $telefono = $input['telefono'] ?? null;
        $email = $input['email'] ?? null;
        $contacto_principal = $input['contacto_principal'] ?? null;
        
        if (!$ruc_cedula || !$nombre_razon_social || !$direccion || !$telefono || !$email || !$contacto_principal) {
            Response::error('Faltan campos obligatorios', 400);
        }
        
        // Verificar si ya existe un cliente con ese RUC
        $checkSql = "SELECT id_cliente FROM clientes WHERE ruc_cedula = ? AND deleted_at IS NULL";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bind_param("s", $ruc_cedula);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows > 0) {
            Response::error('Ya existe un cliente con ese RUC/Cédula', 400);
        }
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // 1. Insertar Cliente
            $stmt = $conn->prepare("INSERT INTO clientes (ruc_cedula, nombre_razon_social, direccion, telefono, email) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sssss", $ruc_cedula, $nombre_razon_social, $direccion, $telefono, $email);
            
            if (!$stmt->execute()) {
                throw new Exception("Error al crear cliente: " . $stmt->error);
            }
            
            $id_cliente = $conn->insert_id;
            
            // 2. Insertar Contacto Principal
            $stmtContact = $conn->prepare("INSERT INTO clientes_contactos (id_cliente, nombre_completo, es_principal) VALUES (?, ?, 1)");
            $stmtContact->bind_param("is", $id_cliente, $contacto_principal);
            
            if (!$stmtContact->execute()) {
                throw new Exception("Error al crear contacto principal: " . $stmtContact->error);
            }

            // 3. Insertar Contactos Adicionales
            if (isset($input['contactos_adicionales']) && is_array($input['contactos_adicionales'])) {
                $stmtAddContact = $conn->prepare("INSERT INTO clientes_contactos (id_cliente, nombre_completo, es_principal) VALUES (?, ?, 0)");
                foreach ($input['contactos_adicionales'] as $contacto) {
                    if (!empty($contacto['nombre_completo'])) {
                        $nombre = $contacto['nombre_completo'];
                        $stmtAddContact->bind_param("is", $id_cliente, $nombre);
                        if (!$stmtAddContact->execute()) {
                            throw new Exception("Error al crear contacto adicional: " . $stmtAddContact->error);
                        }
                    }
                }
            }
            
            $conn->commit();
            Response::success(['id_cliente' => $id_cliente], 'Cliente creado correctamente', 201);
            
        } catch (Exception $e) {
            $conn->rollback();
            Response::error($e->getMessage(), 500);
        }
    }

    // ============================================
    // PUT: Actualizar cliente
    // ============================================
    if ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id_cliente'])) {
            log_debug("PUT: Datos inválidos o ID faltante", $debug_file);
            Response::error('Datos inválidos o ID faltante', 400);
        }
        
        log_debug("PUT: Input recibido: " . json_encode($input), $debug_file);
        
        $id_cliente = intval($input['id_cliente']);
        $ruc_cedula = $input['ruc_cedula'] ?? null;
        $nombre_razon_social = $input['nombre_razon_social'] ?? null;
        $direccion = $input['direccion'] ?? null;
        $telefono = $input['telefono'] ?? null;
        $email = $input['email'] ?? null;
        $contacto_principal = $input['contacto_principal'] ?? null; // Nombre del contacto
        
        if (!$ruc_cedula || !$nombre_razon_social || !$direccion || !$telefono || !$email || !$contacto_principal) {
            Response::error('Faltan campos obligatorios', 400);
        }

        $conn->begin_transaction();
        
        try {
            // 1. Actualizar Cliente
            $stmt = $conn->prepare("UPDATE clientes SET ruc_cedula = ?, nombre_razon_social = ?, direccion = ?, telefono = ?, email = ? WHERE id_cliente = ?");
            $stmt->bind_param("sssssi", $ruc_cedula, $nombre_razon_social, $direccion, $telefono, $email, $id_cliente);
            
            if (!$stmt->execute()) {
                throw new Exception("Error al actualizar cliente: " . $stmt->error);
            }
            
            // 2. Actualizar o Insertar Contacto Principal
            // Primero verificamos si existe un contacto principal
            $checkContact = $conn->query("SELECT id_contacto FROM clientes_contactos WHERE id_cliente = $id_cliente AND es_principal = 1");
            
            if ($checkContact && $checkContact->num_rows > 0) {
                // Actualizar existente
                $stmtUpdContact = $conn->prepare("UPDATE clientes_contactos SET nombre_completo = ? WHERE id_cliente = ? AND es_principal = 1");
                $stmtUpdContact->bind_param("si", $contacto_principal, $id_cliente);
                if (!$stmtUpdContact->execute()) {
                    throw new Exception("Error al actualizar contacto: " . $stmtUpdContact->error);
                }
            } else {
                // Crear nuevo si no existe
                $stmtNewContact = $conn->prepare("INSERT INTO clientes_contactos (id_cliente, nombre_completo, es_principal) VALUES (?, ?, 1)");
                $stmtNewContact->bind_param("is", $id_cliente, $contacto_principal);
                if (!$stmtNewContact->execute()) {
                    throw new Exception("Error al crear contacto: " . $stmtNewContact->error);
                }
            }

            // 3. Sincronizar Contactos Adicionales
            if (isset($input['contactos_adicionales']) && is_array($input['contactos_adicionales'])) {
                // Obtener IDs de contactos adicionales existentes
                $existingIds = [];
                $resultIds = $conn->query("SELECT id_contacto FROM clientes_contactos WHERE id_cliente = $id_cliente AND es_principal = 0");
                while ($row = $resultIds->fetch_assoc()) {
                    $existingIds[] = $row['id_contacto'];
                }

                $incomingIds = [];
                $stmtUpdate = $conn->prepare("UPDATE clientes_contactos SET nombre_completo = ? WHERE id_contacto = ? AND id_cliente = ?");
                $stmtInsert = $conn->prepare("INSERT INTO clientes_contactos (id_cliente, nombre_completo, es_principal) VALUES (?, ?, 0)");

                foreach ($input['contactos_adicionales'] as $contacto) {
                    if (isset($contacto['id_contacto']) && $contacto['id_contacto']) {
                        // Actualizar existente
                        $incomingIds[] = $contacto['id_contacto'];
                        $stmtUpdate->bind_param("sii", $contacto['nombre_completo'], $contacto['id_contacto'], $id_cliente);
                        $stmtUpdate->execute();
                    } elseif (!empty($contacto['nombre_completo'])) {
                        // Insertar nuevo
                        $stmtInsert->bind_param("is", $id_cliente, $contacto['nombre_completo']);
                        $stmtInsert->execute();
                        $incomingIds[] = $conn->insert_id;
                    }
                }

                // Eliminar los que no vinieron en la lista
                $toDelete = array_diff($existingIds, $incomingIds);
                if (!empty($toDelete)) {
                    $idsToDelete = implode(',', $toDelete);
                    $conn->query("DELETE FROM clientes_contactos WHERE id_contacto IN ($idsToDelete)");
                }
            }
            
            $conn->commit();
            Response::success(['id_cliente' => $id_cliente], 'Cliente actualizado correctamente', 200);
            
        } catch (Exception $e) {
            $conn->rollback();
            Response::error($e->getMessage(), 500);
        }
    }

    // ============================================
    // DELETE: Eliminar cliente (Soft Delete)
    // ============================================
    if ($method === 'DELETE') {
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        
        if (!$id) {
            Response::error('ID de cliente requerido', 400);
        }
        
        $fecha = date('Y-m-d H:i:s');
        $sql = "UPDATE clientes SET deleted_at = '$fecha' WHERE id_cliente = $id";
        
        if ($conn->query($sql)) {
            Response::success(null, 'Cliente eliminado correctamente', 200);
        } else {
            Response::error('Error al eliminar cliente: ' . $conn->error, 500);
        }
    }

} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}