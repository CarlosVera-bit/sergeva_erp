<?php
// filepath: backend/api/egresos_bodega.php

// DEBUGGING: Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// DEBUG: Dump GET parameters
if (isset($_GET['debug'])) {
    var_dump($_GET);
    exit;
}

// Log request for debugging
error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
if ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents("php://input");
    error_log("Raw Input: " . $rawInput);
}

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
        // Si se solicita un ID específico
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            
            // 1. Obtener Cabecera
            $sql = "SELECT 
                        e.id_egreso, 
                        e.numero_egreso, 
                        e.id_ot, 
                        ot.numero_ot as ot_numero,
                        e.id_cliente, 
                        c.nombre_razon_social as cliente_nombre,
                        e.fecha_egreso, 
                        e.id_autorizado_por, 
                        u.nombre_completo as autorizado_por_nombre,
                        e.observaciones, 
                        e.valor_total
                    FROM egresos_bodega e
                    LEFT JOIN ordenes_trabajo ot ON e.id_ot = ot.id_ot
                    LEFT JOIN clientes c ON e.id_cliente = c.id_cliente
                    LEFT JOIN usuarios u ON e.id_autorizado_por = u.id_usuario
                    WHERE e.id_egreso = $id";
            
            $result = $conn->query($sql);
            $egreso = $result->fetch_assoc();
            
            if (!$egreso) {
                Response::error('Egreso no encontrado', 404);
            }
            
            // 2. Obtener Detalles
            $sqlDetail = "SELECT 
                            d.*, 
                            p.nombre as producto_nombre, 
                            p.codigo_producto 
                          FROM detalle_egreso d
                          JOIN productos p ON d.id_producto = p.id_producto
                          WHERE d.id_egreso = $id";
            
            $resultDetail = $conn->query($sqlDetail);
            $detalles = [];
            while ($row = $resultDetail->fetch_assoc()) {
                $detalles[] = $row;
            }
            
            $egreso['detalles'] = $detalles;
            Response::success($egreso, 'Egreso obtenido correctamente', 200);
            
        } elseif (isset($_GET['id_ot'])) {
            // Listar materiales por OT (Flattened for Project Details)
            $id_ot = intval($_GET['id_ot']);
            error_log("DEBUG: Fetching materials for OT ID: $id_ot");
            
            $sql = "SELECT 
                        d.id_detalle,
                        e.id_egreso,
                        d.id_producto,
                        p.codigo_producto,
                        p.nombre as producto_nombre,
                        p.unidad_medida,
                        d.cantidad,
                        e.fecha_egreso,
                        e.numero_egreso,
                        u.nombre_completo as autorizado_por
                    FROM detalle_egreso d
                    JOIN egresos_bodega e ON d.id_egreso = e.id_egreso
                    JOIN productos p ON d.id_producto = p.id_producto
                    LEFT JOIN usuarios u ON e.id_autorizado_por = u.id_usuario
                    WHERE e.id_ot = $id_ot
                    ORDER BY e.fecha_egreso DESC";

            $result = $conn->query($sql);

            error_log("DEBUG: SQL Query: $sql");

            if (!$result) {
                Response::error('Error en la consulta: ' . $conn->error, 400);
            }

            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            Response::success($data, 'Materiales del proyecto obtenidos correctamente', 200);

        } else {
            // Listar todos
            $sql = "SELECT 
                        e.id_egreso, 
                        e.numero_egreso, 
                        e.id_ot, 
                        ot.numero_ot as ot_numero,
                        e.id_cliente, 
                        c.nombre_razon_social as cliente_nombre,
                        e.fecha_egreso, 
                        e.id_autorizado_por, 
                        u.nombre_completo as autorizado_por_nombre,
                        e.observaciones, 
                        e.valor_total,
                        (SELECT COUNT(*) FROM detalle_egreso d WHERE d.id_egreso = e.id_egreso) as items_count
                    FROM egresos_bodega e
                    LEFT JOIN ordenes_trabajo ot ON e.id_ot = ot.id_ot
                    LEFT JOIN clientes c ON e.id_cliente = c.id_cliente
                    LEFT JOIN usuarios u ON e.id_autorizado_por = u.id_usuario
                    ORDER BY e.fecha_egreso DESC";
            
            $result = $conn->query($sql);
            
            if (!$result) {
                Response::error('Error en la consulta: ' . $conn->error, 400);
            }
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            Response::success($data, 'Egresos de bodega obtenidos correctamente', 200);
        }
    }
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['id_ot']) || !isset($data['detalles']) || empty($data['detalles'])) {
            Response::error('Faltan datos requeridos (OT o detalles)', 400);
        }

        $conn->begin_transaction();

        try {
            // 1. Generate Numero Egreso
            $sqlSeq = "SELECT COUNT(*) as total FROM egresos_bodega";
            $resSeq = $conn->query($sqlSeq);
            $rowSeq = $resSeq->fetch_assoc();
            $nextNum = $rowSeq['total'] + 1;
            $numero_egreso = 'EGR-' . str_pad($nextNum, 3, '0', STR_PAD_LEFT);

            // 2. Get Client ID from OT if not provided
            $id_ot = $data['id_ot'];
            $id_cliente = $data['id_cliente'] ?? 0;
            
            if ($id_cliente == 0) {
                $sqlClient = "SELECT id_cliente FROM ordenes_trabajo WHERE id_ot = $id_ot";
                $resClient = $conn->query($sqlClient);
                if ($rowClient = $resClient->fetch_assoc()) {
                    $id_cliente = $rowClient['id_cliente'];
                }
            }

            $fecha_egreso = $data['fecha_egreso'] ?? date('Y-m-d H:i:s');
            $id_autorizado_por = $data['id_autorizado_por'] ?? 1; // Default to admin if not sent
            $observaciones = $data['observaciones'] ?? '';
            $valor_total = 0;

            // 3. Insert Header
            $stmt = $conn->prepare("INSERT INTO egresos_bodega (numero_egreso, id_ot, id_cliente, fecha_egreso, id_autorizado_por, observaciones, valor_total) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("siisiss", $numero_egreso, $id_ot, $id_cliente, $fecha_egreso, $id_autorizado_por, $observaciones, $valor_total);
            
            if (!$stmt->execute()) {
                throw new Exception("Error al crear cabecera de egreso: " . $stmt->error);
            }
            $id_egreso = $conn->insert_id;

            // 4. Process Details
            foreach ($data['detalles'] as $item) {
                $id_producto = $item['id_producto'];
                $cantidad = $item['cantidad'];
                
                // Get current price and stock
                // FIXED: Join with productos to get price
                $sqlProd = "SELECT p.precio_unitario as precio_compra, i.stock_actual 
                            FROM inventario i 
                            JOIN productos p ON i.id_producto = p.id_producto 
                            WHERE i.id_producto = $id_producto FOR UPDATE";
                $resProd = $conn->query($sqlProd);
                $prodData = $resProd->fetch_assoc();
                
                if (!$prodData) {
                    throw new Exception("Producto ID $id_producto no encontrado");
                }
                
                if ($prodData['stock_actual'] < $cantidad) {
                    throw new Exception("Stock insuficiente para el producto ID $id_producto");
                }

                $precio_unitario = $prodData['precio_compra'] ?? 0; 
                $subtotal = $cantidad * $precio_unitario;
                $valor_total += $subtotal;

                // Insert Detail
                // FIXED: Removed id_ot, precio_unitario, subtotal
                $stmtDet = $conn->prepare("INSERT INTO detalle_egreso (id_egreso, id_producto, cantidad) VALUES (?, ?, ?)");
                $stmtDet->bind_param("iid", $id_egreso, $id_producto, $cantidad);
                
                if (!$stmtDet->execute()) {
                    throw new Exception("Error al insertar detalle: " . $stmtDet->error);
                }

                // Update Inventory
                $sqlUpdate = "UPDATE inventario SET stock_actual = stock_actual - $cantidad WHERE id_producto = $id_producto";
                if (!$conn->query($sqlUpdate)) {
                    throw new Exception("Error al actualizar stock");
                }
            }

            // 5. Update Total in Header
            $conn->query("UPDATE egresos_bodega SET valor_total = $valor_total WHERE id_egreso = $id_egreso");

            $conn->commit();
            Response::success(['id_egreso' => $id_egreso, 'numero_egreso' => $numero_egreso], 'Egreso registrado correctamente', 201);

        } catch (Exception $e) {
            $conn->rollback();
            Response::error($e->getMessage(), 500);
        }
    }
    elseif ($method === 'PUT') {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Response::error('JSON inválido: ' . json_last_error_msg(), 400);
        }

        if (!isset($data['id_egreso']) || !isset($data['detalles']) || empty($data['detalles'])) {
            Response::error('Faltan datos requeridos (ID o detalles)', 400);
        }

        $id_egreso = intval($data['id_egreso']);
        $conn->begin_transaction();

        try {
            // 1. Restore Stock from Old Details
            error_log("Restoring stock for egreso ID: $id_egreso");
            $sqlOld = "SELECT id_producto, cantidad FROM detalle_egreso WHERE id_egreso = $id_egreso";
            $resOld = $conn->query($sqlOld);
            
            if ($resOld) {
                while ($row = $resOld->fetch_assoc()) {
                    $prodId = intval($row['id_producto']);
                    $qty = floatval($row['cantidad']);
                    $conn->query("UPDATE inventario SET stock_actual = stock_actual + $qty WHERE id_producto = $prodId");
                }
            } else {
                error_log("Error reading old details: " . $conn->error);
            }

            // 2. Delete Old Details
            error_log("Deleting old details");
            if (!$conn->query("DELETE FROM detalle_egreso WHERE id_egreso = $id_egreso")) {
                throw new Exception("Error deleting old details: " . $conn->error);
            }

            // 3. Update Header
            $id_ot = isset($data['id_ot']) ? intval($data['id_ot']) : 0;
            $id_cliente = isset($data['id_cliente']) ? intval($data['id_cliente']) : 0;
            
            if ($id_ot > 0 && $id_cliente == 0) {
                $sqlClient = "SELECT id_cliente FROM ordenes_trabajo WHERE id_ot = $id_ot";
                $resClient = $conn->query($sqlClient);
                if ($resClient && $rowClient = $resClient->fetch_assoc()) {
                    $id_cliente = $rowClient['id_cliente'];
                }
            }

            $fecha_egreso = $data['fecha_egreso'] ?? date('Y-m-d H:i:s');
            $id_autorizado_por = isset($data['id_autorizado_por']) ? intval($data['id_autorizado_por']) : 1;
            $observaciones = $data['observaciones'] ?? '';
            $valor_total = 0;

            error_log("Updating header: OT=$id_ot, Client=$id_cliente, Date=$fecha_egreso");
            $stmt = $conn->prepare("UPDATE egresos_bodega SET id_ot=?, id_cliente=?, fecha_egreso=?, id_autorizado_por=?, observaciones=? WHERE id_egreso=?");
            if (!$stmt) {
                throw new Exception("Error preparando update header: " . $conn->error);
            }
            $stmt->bind_param("iisisi", $id_ot, $id_cliente, $fecha_egreso, $id_autorizado_por, $observaciones, $id_egreso);
            if (!$stmt->execute()) {
                throw new Exception("Error ejecutando update header: " . $stmt->error);
            }

            // 4. Insert New Details and Deduct Stock
            error_log("Processing new details");
            foreach ($data['detalles'] as $item) {
                $id_producto = intval($item['id_producto']);
                $cantidad = floatval($item['cantidad']);
                
                // FIXED: Join with productos to get price, as inventario only has stock
                $sqlProd = "SELECT p.precio_unitario as precio_compra, i.stock_actual 
                            FROM inventario i 
                            JOIN productos p ON i.id_producto = p.id_producto 
                            WHERE i.id_producto = $id_producto FOR UPDATE";
                $resProd = $conn->query($sqlProd);
                
                if (!$resProd || $resProd->num_rows === 0) {
                    throw new Exception("Producto ID $id_producto no encontrado en inventario");
                }
                
                $prodData = $resProd->fetch_assoc();
                
                if ($prodData['stock_actual'] < $cantidad) {
                    throw new Exception("Stock insuficiente para el producto ID $id_producto. Stock actual: " . $prodData['stock_actual']);
                }

                $precio_unitario = floatval($prodData['precio_compra'] ?? 0); 
                $subtotal = $cantidad * $precio_unitario;
                $valor_total += $subtotal;

                // CHECK IF id_ot COLUMN EXISTS IN detalle_egreso
                // If your table structure does NOT have id_ot in detalle_egreso, remove it from here.
                // Assuming it DOES based on previous code, but this is a common failure point.
                // FIXED: Removed id_ot, precio_unitario, subtotal
                $stmtDet = $conn->prepare("INSERT INTO detalle_egreso (id_egreso, id_producto, cantidad) VALUES (?, ?, ?)");
                if (!$stmtDet) {
                    throw new Exception("Error preparando insert detalle (Check columns): " . $conn->error);
                }
                $stmtDet->bind_param("iid", $id_egreso, $id_producto, $cantidad);
                if (!$stmtDet->execute()) {
                    throw new Exception("Error insertando detalle: " . $stmtDet->error);
                }

                $sqlUpdateStock = "UPDATE inventario SET stock_actual = stock_actual - $cantidad WHERE id_producto = $id_producto";
                if (!$conn->query($sqlUpdateStock)) {
                    throw new Exception("Error actualizando stock: " . $conn->error);
                }
            }

            // 5. Update Total
            $sqlUpdateTotal = "UPDATE egresos_bodega SET valor_total = $valor_total WHERE id_egreso = $id_egreso";
            if (!$conn->query($sqlUpdateTotal)) {
                throw new Exception("Error actualizando total: " . $conn->error);
            }

            $conn->commit();
            error_log("Transaction committed successfully");
            Response::success(['id_egreso' => $id_egreso], 'Egreso actualizado correctamente', 200);

        } catch (Exception $e) {
            $conn->rollback();
            error_log("Transaction failed: " . $e->getMessage());
            Response::error($e->getMessage(), 500);
        }
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}