<?php
// filepath: backend/api/pedidos_compra.php

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
    // ============================================
    // GET: Listar pedidos o obtener uno por ID
    // ============================================
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            // Obtener pedido específico con detalles
            $id_pedido = (int)$_GET['id'];
            
            // 1. Obtener cabecera
            $sql = "SELECT pc.*, p.nombre_razon_social as proveedor_nombre 
                    FROM pedidos_compra pc 
                    LEFT JOIN proveedores p ON pc.id_proveedor = p.id_proveedor 
                    WHERE pc.id_pedido = $id_pedido";
            
            $result = $conn->query($sql);
            $pedido = $result->fetch_assoc();
            
            if (!$pedido) {
                Response::error('Pedido no encontrado', 404);
            }
            
            // 2. Obtener detalles
            $sqlDetalles = "SELECT dp.*, p.nombre as producto_nombre, p.codigo_producto 
                           FROM detalle_pedido dp 
                           LEFT JOIN productos p ON dp.id_producto = p.id_producto 
                           WHERE dp.id_pedido = $id_pedido";
            
            $resultDetalles = $conn->query($sqlDetalles);
            $detalles = [];
            while ($row = $resultDetalles->fetch_assoc()) {
                $row['id_detalle'] = (int)$row['id_detalle'];
                $row['id_pedido'] = (int)$row['id_pedido'];
                $row['id_producto'] = (int)$row['id_producto'];
                $row['cantidad'] = (int)$row['cantidad'];
                $row['precio_unitario'] = (float)$row['precio_unitario'];
                $row['subtotal'] = (float)$row['subtotal'];
                $detalles[] = $row;
            }
            
            $pedido['detalles'] = $detalles;
            
            Response::success($pedido, 'Pedido obtenido correctamente', 200);
            
        } else {
            // Listar todos los pedidos
            $sql = "SELECT pc.*, p.nombre_razon_social as proveedor_nombre, 
                    (SELECT COUNT(*) FROM detalle_pedido WHERE id_pedido = pc.id_pedido) as items_count
                    FROM pedidos_compra pc 
                    LEFT JOIN proveedores p ON pc.id_proveedor = p.id_proveedor 
                    ORDER BY pc.fecha_pedido DESC";
            
            $result = $conn->query($sql);
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $row['id_pedido'] = (int)$row['id_pedido'];
                $row['id_proveedor'] = (int)$row['id_proveedor'];
                $row['total'] = (float)$row['total'];
                $data[] = $row;
            }
            
            Response::success($data, 'Pedidos obtenidos correctamente', 200);
        }
    }

    // ============================================
    // POST: Crear nuevo pedido (Transacción)
    // ============================================
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['id_proveedor']) || !isset($data['detalles']) || empty($data['detalles'])) {
            Response::error('Datos incompletos', 400);
        }

        $conn->begin_transaction();

        try {
            // 1. Insertar Pedido (Maestro)
            $numero_pedido = isset($data['numero_pedido']) ? $conn->real_escape_string($data['numero_pedido']) : 'PED-' . time();
            $id_proveedor = (int)$data['id_proveedor'];
            $fecha_pedido = isset($data['fecha_pedido']) ? $conn->real_escape_string($data['fecha_pedido']) : date('Y-m-d H:i:s');
            $estado = isset($data['estado']) ? $conn->real_escape_string($data['estado']) : 'recibido'; // Asumimos recibido para sumar stock según requerimiento
            $observaciones = isset($data['observaciones']) ? $conn->real_escape_string($data['observaciones']) : '';
            $total = (float)$data['total'];

            $sqlPedido = "INSERT INTO pedidos_compra (numero_pedido, id_proveedor, fecha_pedido, estado, total, observaciones) 
                         VALUES ('$numero_pedido', $id_proveedor, '$fecha_pedido', '$estado', $total, '$observaciones')";
            
            if (!$conn->query($sqlPedido)) {
                throw new Exception("Error al crear pedido: " . $conn->error);
            }
            
            $id_pedido = $conn->insert_id;

            // 2. Insertar Detalles y Actualizar Stock
            foreach ($data['detalles'] as $item) {
                $id_producto = (int)$item['id_producto'];
                $cantidad = (int)$item['cantidad'];
                $precio = (float)$item['precio_unitario'];
                $subtotal = (float)$item['subtotal'];

                // a. Insertar detalle
                $sqlDetalle = "INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) 
                              VALUES ($id_pedido, $id_producto, $cantidad, $precio, $subtotal)";
                
                if (!$conn->query($sqlDetalle)) {
                    throw new Exception("Error al insertar detalle: " . $conn->error);
                }

                // b. Actualizar Stock (Solo si el estado implica entrada de mercancía, pero el prompt pide hacerlo al guardar)
                // Actualizamos la tabla inventario
                // Primero verificamos si existe registro en inventario
                $checkInv = $conn->query("SELECT id_inventario FROM inventario WHERE id_producto = $id_producto");
                
                if ($checkInv->num_rows > 0) {
                    $sqlUpdateStock = "UPDATE inventario SET stock_actual = stock_actual + $cantidad, ultima_actualizacion = NOW() WHERE id_producto = $id_producto";
                    if (!$conn->query($sqlUpdateStock)) {
                        throw new Exception("Error al actualizar stock: " . $conn->error);
                    }
                } else {
                    // Si no existe en inventario, lo creamos
                    $sqlInsertStock = "INSERT INTO inventario (id_producto, stock_actual, ubicacion_bodega, ultima_actualizacion) 
                                      VALUES ($id_producto, $cantidad, 'Bodega General', NOW())";
                    if (!$conn->query($sqlInsertStock)) {
                        throw new Exception("Error al crear inventario: " . $conn->error);
                    }
                }
            }

            $conn->commit();
            
            Response::success(['id_pedido' => $id_pedido, 'numero_pedido' => $numero_pedido], 'Pedido creado y stock actualizado', 201);

        } catch (Exception $e) {
            $conn->rollback();
            Response::error($e->getMessage(), 500);
        }
    }

    // ============================================
    // PUT: Actualizar pedido completo
    // ============================================
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['id_pedido'])) {
            Response::error('ID de pedido requerido', 400);
        }

        $id_pedido = (int)$data['id_pedido'];
        
        // Si solo viene estado, actualizamos solo estado (lógica anterior)
        if (isset($data['estado']) && !isset($data['detalles'])) {
            $estado = $conn->real_escape_string($data['estado']);
            $sql = "UPDATE pedidos_compra SET estado = '$estado' WHERE id_pedido = $id_pedido";
            if ($conn->query($sql)) {
                Response::success(null, 'Estado actualizado correctamente', 200);
            } else {
                Response::error('Error al actualizar estado: ' . $conn->error, 500);
            }
            exit;
        }

        // Actualización completa (Header + Detalles)
        if (!isset($data['id_proveedor']) || !isset($data['detalles'])) {
            Response::error('Datos incompletos para actualización', 400);
        }

        $conn->begin_transaction();

        try {
            // 1. Revertir Stock si el pedido anterior estaba 'recibido'
            // (Simplificación: Asumimos que si se edita, se recalcula todo. 
            // Si el pedido YA estaba recibido, restamos el stock que sumó para dejarlo "limpio")
            $sqlCheck = "SELECT estado FROM pedidos_compra WHERE id_pedido = $id_pedido";
            $resCheck = $conn->query($sqlCheck);
            $rowCheck = $resCheck->fetch_assoc();
            
            if ($rowCheck && $rowCheck['estado'] === 'recibido') {
                $sqlOld = "SELECT id_producto, cantidad FROM detalle_pedido WHERE id_pedido = $id_pedido";
                $resOld = $conn->query($sqlOld);
                while ($row = $resOld->fetch_assoc()) {
                    $prodId = $row['id_producto'];
                    $qty = $row['cantidad'];
                    $conn->query("UPDATE inventario SET stock_actual = stock_actual - $qty WHERE id_producto = $prodId");
                }
            }

            // 2. Eliminar detalles anteriores
            $conn->query("DELETE FROM detalle_pedido WHERE id_pedido = $id_pedido");

            // 3. Actualizar Cabecera
            $id_proveedor = (int)$data['id_proveedor'];
            $fecha_pedido = $conn->real_escape_string($data['fecha_pedido']);
            $estado = $conn->real_escape_string($data['estado']);
            $observaciones = isset($data['observaciones']) ? $conn->real_escape_string($data['observaciones']) : '';
            $total = (float)$data['total'];

            $stmt = $conn->prepare("UPDATE pedidos_compra SET id_proveedor=?, fecha_pedido=?, estado=?, observaciones=?, total=? WHERE id_pedido=?");
            $stmt->bind_param("isssdi", $id_proveedor, $fecha_pedido, $estado, $observaciones, $total, $id_pedido);
            $stmt->execute();

            // 4. Insertar nuevos detalles
            foreach ($data['detalles'] as $item) {
                $id_producto = (int)$item['id_producto'];
                $cantidad = (int)$item['cantidad'];
                $precio_unitario = (float)$item['precio_unitario'];
                $subtotal = $cantidad * $precio_unitario;

                $stmtDet = $conn->prepare("INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)");
                $stmtDet->bind_param("iiidd", $id_pedido, $id_producto, $cantidad, $precio_unitario, $subtotal);
                $stmtDet->execute();

                // 5. Si el NUEVO estado es 'recibido', sumar al stock
                if ($estado === 'recibido') {
                    $sqlUpdate = "UPDATE inventario SET stock_actual = stock_actual + $cantidad, precio_compra = $precio_unitario WHERE id_producto = $id_producto";
                    $conn->query($sqlUpdate);
                }
            }

            $conn->commit();
            Response::success(['id_pedido' => $id_pedido], 'Pedido actualizado correctamente', 200);

        } catch (Exception $e) {
            $conn->rollback();
            Response::error($e->getMessage(), 500);
        }
    }

    // ============================================
    // DELETE: Eliminar pedido
    // ============================================
    elseif ($method === 'DELETE') {
        if (!isset($_GET['id'])) {
            Response::error('ID no proporcionado', 400);
        }

        $id = (int)$_GET['id'];
        
        // Nota: La eliminación en cascada de la BD se encargará de los detalles.
        // No revertimos stock automáticamente para simplificar, a menos que se requiera explícitamente.
        
        $sql = "DELETE FROM pedidos_compra WHERE id_pedido = $id";

        if ($conn->query($sql)) {
            Response::success(null, 'Pedido eliminado exitosamente', 200);
        } else {
            Response::error('Error al eliminar pedido: ' . $conn->error, 500);
        }
    }

} catch (Exception $e) {
    Response::error('Error del servidor: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}