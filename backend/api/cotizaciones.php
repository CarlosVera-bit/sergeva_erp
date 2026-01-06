<?php
// filepath: backend/api/cotizaciones.php

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
        // Verificar si se solicita el detalle de una cotización
        if (isset($_GET['action']) && $_GET['action'] === 'detalle' && isset($_GET['id'])) {
            $id_cotizacion = (int)$_GET['id'];
            
            // Obtener cotización con datos del cliente
            $sqlCot = "SELECT c.*, cl.nombre_razon_social, cl.ruc_cedula, cl.direccion, cl.telefono, cl.email, cc.nombre_completo AS contacto_principal 
                       FROM cotizaciones c 
                       JOIN clientes cl ON c.id_cliente = cl.id_cliente 
                       LEFT JOIN clientes_contactos cc ON cl.id_cliente = cc.id_cliente AND cc.es_principal = 1
                       WHERE c.id_cotizacion = $id_cotizacion AND c.deleted_at IS NULL";
            $resultCot = $conn->query($sqlCot);
            
            if (!$resultCot || $resultCot->num_rows === 0) {
                Response::error('Cotización no encontrada', 404);
            }
            
            $cotizacion = $resultCot->fetch_assoc();
            
            // Obtener items de la cotización
            $sqlItems = "SELECT * FROM detalle_cotizacion WHERE id_cotizacion = $id_cotizacion AND deleted_at IS NULL ORDER BY id_detalle";
            $resultItems = $conn->query($sqlItems);
            
            $items = [];
            while ($row = $resultItems->fetch_assoc()) {
                $items[] = $row;
            }
            
            $cotizacion['items'] = $items;
            
            Response::success($cotizacion, 'Detalle de cotización obtenido', 200);
            exit;
        }
        
        // Verificar si se solicita el siguiente número secuencial
        if (isset($_GET['action']) && $_GET['action'] === 'next_sequential') {
            // Generar secuencial por AÑO con formato: PR-YYYY-NNNN
            $year = date('Y');
            // Buscar la última cotización del año actual
            $sqlMax = "SELECT numero_cotizacion FROM cotizaciones WHERE numero_cotizacion LIKE 'PR-" . $year . "-%' AND deleted_at IS NULL ORDER BY id_cotizacion DESC LIMIT 1";
            $resultMax = $conn->query($sqlMax);

            $nextNumber = 1; // Si no hay registros para el año, comenzar en 1

            if ($resultMax && $resultMax->num_rows > 0) {
                $lastCot = $resultMax->fetch_assoc();
                // Extraer la parte numérica final (NNNN) usando regex
                if (preg_match('/-(\d+)$/', $lastCot['numero_cotizacion'], $matches)) {
                    $lastSeq = intval($matches[1]);
                    $nextNumber = $lastSeq + 1;
                }
            }

            // Formatear con 4 dígitos: PR-2025-0001, PR-2025-0002
            $nextCotizacion = 'PR-' . $year . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

            Response::success([
                'numero_cotizacion' => $nextCotizacion,
                'secuencial' => $nextNumber,
                'year' => $year
            ], 'Siguiente secuencial obtenido correctamente', 200);
            exit;
        }
        
        $sql = "SELECT id_cotizacion, id_ot, numero_cotizacion, id_cliente, fecha_validez, fecha_cotizacion, total, subtotal, iva, observaciones, fecha_creacion, estado FROM cotizaciones WHERE deleted_at IS NULL ORDER BY id_cotizacion DESC";
        $result = $conn->query($sql);
        
        if (!$result) {
            Response::error('Error en la consulta: ' . $conn->error, 400);
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        Response::success($data, 'Cotizaciones obtenidas correctamente', 200);
    }
    
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::error('Datos inválidos o JSON malformado', 400);
        }
        
        $numero_cotizacion = $input['numero_cotizacion'] ?? null;
        $id_cliente = $input['id_cliente'] ?? null;
        $fecha_cotizacion = $input['fecha_cotizacion'] ?? null;
        $fecha_validez = $input['fecha_validez'] ?? null;
        $subtotal = $input['subtotal'] ?? 0;
        $iva = $input['iva'] ?? 0;
        $descuento = $input['descuento'] ?? 0;
        $tipo_descuento = $input['tipoDescuento'] ?? 'monto';
        $total = $input['total'] ?? 0;
        $observaciones = $input['observaciones'] ?? '';
        $plaza_parque = $input['plazaParque'] ?? 'PLAZA PARQUE';
        $tiempo_entrega = $input['tiempoEntrega'] ?? '1 semana';
        $condiciones_pago = $input['condicionesPago'] ?? 'Pago a los 60 días';
        $items = $input['items'] ?? [];
        
        if (!$numero_cotizacion || !$id_cliente || !$fecha_cotizacion || !$fecha_validez) {
            Response::error('Faltan campos obligatorios: numero_cotizacion, id_cliente, fecha_cotizacion, fecha_validez', 400);
        }
        
        if (empty($items)) {
            Response::error('Se requiere al menos un item en la cotización', 400);
        }
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // Insertar cotización
            $stmt = $conn->prepare("INSERT INTO cotizaciones (numero_cotizacion, id_cliente, fecha_cotizacion, fecha_validez, subtotal, iva, descuento, tipo_descuento, total, observaciones, plaza_parque, tiempo_entrega, condiciones_pago, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'enviada')");
            
            if (!$stmt) {
                Response::error('Error en preparar la consulta: ' . $conn->error, 500);
            }
            
            $stmt->bind_param("sissdddsdssss", $numero_cotizacion, $id_cliente, $fecha_cotizacion, $fecha_validez, $subtotal, $iva, $descuento, $tipo_descuento, $total, $observaciones, $plaza_parque, $tiempo_entrega, $condiciones_pago);
            
            if (!$stmt->execute()) {
                Response::error('Error al ejecutar INSERT: ' . $stmt->error, 500);
            }
            
            $id_cotizacion = $conn->insert_id;
            
            // Insertar items
            if (!empty($items)) {
                // Usar tabla detalle_cotizacion (singular) y estructura real
                $stmt_items = $conn->prepare("INSERT INTO detalle_cotizacion (id_cotizacion, descripcion, cantidad, precio_unitario, iva_porcentaje, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
                
                if (!$stmt_items) {
                    Response::error('Error preparando insert items: ' . $conn->error, 500);
                }
                
                foreach ($items as $idx => $item) {
                    $descripcion = $item['descripcion'] ?? '';
                    $cantidad = (float)($item['cantidad'] ?? 0);
                    $precio_unitario = (float)($item['precio_unitario'] ?? 0);
                    $iva_item = (float)($item['iva'] ?? 15);
                    $subtotal_item = (float)($item['subtotal'] ?? 0);
                    
                    $stmt_items->bind_param("isdddd", $id_cotizacion, $descripcion, $cantidad, $precio_unitario, $iva_item, $subtotal_item);
                    
                    if (!$stmt_items->execute()) {
                        Response::error('Error al insertar item ' . ($idx + 1) . ': ' . $stmt_items->error, 500);
                    }
                }
            }
            
            $conn->commit();
            Response::success(['id_cotizacion' => $id_cotizacion], 'Cotización creada correctamente', 201);
            
        } catch (Exception $e) {
            $conn->rollback();
            Response::error('Error en transacción: ' . $e->getMessage(), 500);
        }
    }
    
    if ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Verificar si es actualización de estado o actualización completa
        if (isset($input['estado']) && !isset($input['items'])) {
            // Actualización solo de estado
            if (!isset($input['id_cotizacion'])) {
                Response::error('Faltan datos requeridos (id_cotizacion)', 400);
            }
            
            $id_cotizacion = (int)$input['id_cotizacion'];
            $estado = $conn->real_escape_string($input['estado']);
            
            // Validar que el estado sea válido
            $estadosValidos = ['enviada', 'aprobada', 'rechazada'];
            if (!in_array($estado, $estadosValidos)) {
                Response::error('Estado inválido. Valores permitidos: ' . implode(', ', $estadosValidos), 400);
            }
            
            $sql = "UPDATE cotizaciones SET estado = '$estado' WHERE id_cotizacion = $id_cotizacion";
            
            if ($conn->query($sql)) {
                if ($conn->affected_rows > 0) {
                    Response::success(['id_cotizacion' => $id_cotizacion, 'estado' => $estado], 'Estado actualizado correctamente', 200);
                } else {
                    Response::error('No se encontró la cotización o el estado ya era el mismo', 404);
                }
            } else {
                Response::error('Error al actualizar: ' . $conn->error, 500);
            }
        } else {
            // Actualización completa de cotización con items
            if (!isset($_GET['id']) || !$input) {
                Response::error('ID de cotización y datos requeridos', 400);
            }
            
            $id_cotizacion = (int)$_GET['id'];
            $numero_cotizacion = $input['numero_cotizacion'] ?? null;
            $id_cliente = $input['id_cliente'] ?? null;
            $fecha_cotizacion = $input['fecha_cotizacion'] ?? null;
            $fecha_validez = $input['fecha_validez'] ?? null;
            $subtotal = $input['subtotal'] ?? 0;
            $iva = $input['iva'] ?? 0;
            $descuento = $input['descuento'] ?? 0;
            $tipo_descuento = $input['tipoDescuento'] ?? 'monto';
            $total = $input['total'] ?? 0;
            $observaciones = $input['observaciones'] ?? '';
            $plaza_parque = $input['plazaParque'] ?? 'PLAZA PARQUE';
            $tiempo_entrega = $input['tiempoEntrega'] ?? '1 semana';
            $condiciones_pago = $input['condicionesPago'] ?? 'Pago a los 60 días';
            $items = $input['items'] ?? [];
            
            if (!$numero_cotizacion || !$id_cliente || !$fecha_cotizacion || !$fecha_validez) {
                Response::error('Faltan campos obligatorios', 400);
            }
            
            // Iniciar transacción
            $conn->begin_transaction();
            
            try {
                // 1. Actualizar cotización
                $stmt = $conn->prepare("UPDATE cotizaciones SET numero_cotizacion = ?, id_cliente = ?, fecha_cotizacion = ?, fecha_validez = ?, subtotal = ?, iva = ?, descuento = ?, tipo_descuento = ?, total = ?, observaciones = ?, plaza_parque = ?, tiempo_entrega = ?, condiciones_pago = ? WHERE id_cotizacion = ?");
                $stmt->bind_param("sisddddsdssssi", $numero_cotizacion, $id_cliente, $fecha_cotizacion, $fecha_validez, $subtotal, $iva, $descuento, $tipo_descuento, $total, $observaciones, $plaza_parque, $tiempo_entrega, $condiciones_pago, $id_cotizacion);
                $stmt->execute();
                
                // 2. Marcar items antiguos como eliminados (borrado lógico)
                $fecha_eliminacion = date('Y-m-d H:i:s');
                $sqlDeleteItems = "UPDATE detalle_cotizacion SET deleted_at = '$fecha_eliminacion' WHERE id_cotizacion = $id_cotizacion AND deleted_at IS NULL";
                $conn->query($sqlDeleteItems);
                
                // 3. Insertar nuevos items
                if (!empty($items)) {
                    $stmt_items = $conn->prepare("INSERT INTO detalle_cotizacion (id_cotizacion, descripcion, cantidad, precio_unitario, iva_porcentaje, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
                    
                    foreach ($items as $item) {
                        $descripcion = $item['descripcion'];
                        $cantidad = (float)$item['cantidad'];
                        $precio_unitario = (float)$item['precio_unitario'];
                        $iva_item = (float)($item['iva'] ?? 15);
                        $subtotal_item = (float)$item['subtotal'];
                        
                        $stmt_items->bind_param("isdddd", $id_cotizacion, $descripcion, $cantidad, $precio_unitario, $iva_item, $subtotal_item);
                        $stmt_items->execute();
                    }
                }
                
                $conn->commit();
                Response::success(['id_cotizacion' => $id_cotizacion], 'Cotización actualizada correctamente', 200);
                
            } catch (Exception $e) {
                $conn->rollback();
                throw $e;
            }
        }
    }
    
    if ($method === 'DELETE') {
        if (!isset($_GET['id'])) {
            Response::error('ID de cotización requerido', 400);
        }
        
        $id_cotizacion = (int)$_GET['id'];
        $fecha_eliminacion = date('Y-m-d H:i:s');
        
        // Iniciar transacción para borrado lógico de cotización e items
        $conn->begin_transaction();
        
        try {
            // Primero marcar items como eliminados (borrado lógico)
            $sqlDeleteItems = "UPDATE detalle_cotizacion SET deleted_at = '$fecha_eliminacion' WHERE id_cotizacion = $id_cotizacion AND deleted_at IS NULL";
            $conn->query($sqlDeleteItems);
            
            // Luego marcar cotización como eliminada (borrado lógico)
            $sqlDelete = "UPDATE cotizaciones SET deleted_at = '$fecha_eliminacion' WHERE id_cotizacion = $id_cotizacion AND deleted_at IS NULL";
            $resultDelete = $conn->query($sqlDelete);
            
            if ($resultDelete && $conn->affected_rows > 0) {
                $conn->commit();
                Response::success(['id_cotizacion' => $id_cotizacion, 'deleted_at' => $fecha_eliminacion], 'Cotización eliminada correctamente', 200);
            } else {
                $conn->rollback();
                Response::error('No se encontró la cotización o ya fue eliminada', 404);
            }
        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}