<?php
// filepath: backend/api/ordenes_trabajo.php
// API para gestión de Órdenes de Trabajo
// Soporta: GET (listar), POST (crear con secuencial automático)

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Manejar preflight CORS
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
    // GET: Obtener órdenes de trabajo o siguiente secuencial
    // ============================================
    if ($method === 'GET') {
        
        // DEBUG: Log de parámetros GET
        error_log('DEBUG ordenes_trabajo.php GET params: ' . print_r($_GET, true));

        // Obtener OT por ID con detalles completos (incluyendo materiales)
        if (isset($_GET['id']) && !empty($_GET['id'])) {
            $idOT = intval($_GET['id']);
            
            // 1. Obtener Datos Principales
            $sql = "SELECT 
                        ot.*,
                        ot.total_ot,
                        ot.estado_factura,
                        c.nombre_razon_social AS cliente_nombre,
                        c.ruc_cedula AS cliente_ruc,
                        c.email AS cliente_email,
                        c.direccion AS cliente_direccion,
                        cc.nombre_completo AS cliente_contacto,
                        u.nombre_completo AS supervisor_nombre,
                        coti.numero_cotizacion
                    FROM ordenes_trabajo ot
                    LEFT JOIN clientes c ON ot.id_cliente = c.id_cliente
                    LEFT JOIN clientes_contactos cc ON c.id_cliente = cc.id_cliente AND cc.es_principal = 1
                    LEFT JOIN usuarios u ON ot.id_supervisor = u.id_usuario
                    LEFT JOIN cotizaciones coti ON ot.id_cotizacion = coti.id_cotizacion
                    WHERE ot.id_ot = $idOT";
            
            $result = $conn->query($sql);
            if (!$result || $result->num_rows === 0) {
                Response::error('Orden de trabajo no encontrada', 404);
            }
            
            $otData = $result->fetch_assoc();
            $otData['cliente'] = $otData['cliente_nombre'];
            $otData['supervisor'] = $otData['supervisor_nombre'];

            // 2. Obtener Materiales (desde egresos_bodega -> detalle_egreso)
            // Buscamos todos los egresos vinculados a esta OT y sus detalles
            $sqlMateriales = "SELECT 
                                de.id_producto,
                                SUM(de.cantidad) as cantidad,
                                p.nombre as nombre_producto,
                                p.codigo_producto,
                                p.precio_unitario,
                                IFNULL(i.stock_actual, 0) as stock_actual
                              FROM egresos_bodega eb
                              JOIN detalle_egreso de ON eb.id_egreso = de.id_egreso
                              JOIN productos p ON de.id_producto = p.id_producto
                              LEFT JOIN inventario i ON p.id_producto = i.id_producto
                              WHERE eb.id_ot = $idOT
                              GROUP BY de.id_producto, p.nombre, p.codigo_producto, p.precio_unitario, i.stock_actual";
            
            $resMateriales = $conn->query($sqlMateriales);
            $materiales = [];
            if ($resMateriales) {
                while ($row = $resMateriales->fetch_assoc()) {
                    $row['cantidad'] = floatval($row['cantidad']);
                    $row['precio_unitario'] = floatval($row['precio_unitario']);
                    $row['stock_actual'] = floatval($row['stock_actual']);
                    $materiales[] = $row;
                }
            }
            
            $otData['materiales_egreso'] = $materiales;

            // 3. Obtener Proyectos Vinculados
            $sqlProyectos = "SELECT * FROM proyectos_supervisados WHERE id_ot = $idOT";
            $resProyectos = $conn->query($sqlProyectos);
            $proyectos = [];
            if ($resProyectos) {
                while ($row = $resProyectos->fetch_assoc()) {
                    $proyectos[] = $row;
                }
            }
            $otData['proyectos'] = $proyectos;
            
            // Mantener compatibilidad con 'proyecto' (el primero de la lista)
            $otData['proyecto'] = count($proyectos) > 0 ? $proyectos[0] : null;
            
            Response::success($otData, 'Orden de trabajo obtenida correctamente', 200);
            exit;
        }
        
        // Verificar si se solicita el siguiente número secuencial
        if (isset($_GET['action']) && $_GET['action'] === 'next_sequential') {
            error_log('DEBUG: Entering next_sequential block');
            // Generar secuencial por AÑO con formato: OT-YYYY-NNN
            $year = date('Y');
            // Buscar la última OT del año actual
            $sqlMax = "SELECT numero_ot FROM ordenes_trabajo WHERE numero_ot LIKE 'OT-" . $year . "-%' ORDER BY id_ot DESC LIMIT 1";
            $resultMax = $conn->query($sqlMax);

            $nextNumber = 1; // Si no hay registros para el año, comenzar en 1

            if ($resultMax && $resultMax->num_rows > 0) {
                $lastOT = $resultMax->fetch_assoc();
                // Extraer la parte numérica final (NNN) usando regex
                if (preg_match('/-(\d+)$/', $lastOT['numero_ot'], $matches)) {
                    $lastSeq = intval($matches[1]);
                    $nextNumber = $lastSeq + 1;
                }
            }

            // Formatear con 4 dígitos: OT-2025-0001, OT-2025-0123
            $nextOT = 'OT-' . $year . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

            Response::success([
                'numero_ot' => $nextOT,
                'secuencial' => $nextNumber,
                'year' => $year
            ], 'Siguiente secuencial obtenido correctamente', 200);
            exit;
        }
        
        // Obtener lista de clientes si se solicita
        if (isset($_GET['action']) && $_GET['action'] === 'get_clients') {
            $sqlClientes = "SELECT c.id_cliente, c.nombre_razon_social, cc.nombre_completo AS contacto_principal, c.ruc_cedula, c.email, c.direccion 
                            FROM clientes c 
                            LEFT JOIN clientes_contactos cc ON c.id_cliente = cc.id_cliente AND cc.es_principal = 1
                            ORDER BY c.nombre_razon_social ASC";
            $resultClientes = $conn->query($sqlClientes);
            
            if (!$resultClientes) {
                Response::error('Error al obtener clientes: ' . $conn->error, 400);
            }
            
            $clientes = [];
            while ($row = $resultClientes->fetch_assoc()) {
                $clientes[] = $row;
            }
            
            Response::success($clientes, 'Clientes obtenidos correctamente', 200);
            exit;
        }
        
        // Obtener supervisores (usuarios) si se solicita
        if (isset($_GET['action']) && $_GET['action'] === 'get_supervisors') {
            $sqlSupervisores = "SELECT id_usuario, nombre_completo, email FROM usuarios WHERE rol IN ('supervisor') ORDER BY nombre_completo ASC";
            $resultSupervisores = $conn->query($sqlSupervisores);
            
            if (!$resultSupervisores) {
                Response::error('Error al obtener supervisores: ' . $conn->error, 400);
            }
            
            $supervisores = [];
            while ($row = $resultSupervisores->fetch_assoc()) {
                $supervisores[] = $row;
            }
            
            Response::success($supervisores, 'Supervisores obtenidos correctamente', 200);
            exit;
        }
        
        // DEBUG: Si llega aquí, no entró en ningún action
        error_log('DEBUG: Falling through to main query, action=' . ($_GET['action'] ?? 'not set'));
        
        // Consulta principal: Obtener todas las órdenes de trabajo con datos relacionados
        $sql = "SELECT 
                    ot.id_ot, 
                    ot.numero_ot, 
                    ot.id_cliente, 
                    ot.representante,
                    ot.factura,
                    ot.id_cotizacion, 
                    ot.id_supervisor, 
                    ot.fecha_inicio,
                    ot.fecha_fin_estimada, 
                    ot.fecha_fin_real, 
                    ot.descripcion_trabajo, 
                    ot.estado, 
                    ot.prioridad, 
                    ot.ubicacion_trabajo,
                    ot.total_ot,
                    ot.estado_factura,
                    c.nombre_razon_social AS cliente_nombre,
                    cc.nombre_completo AS cliente_contacto,
                    u.nombre_completo AS supervisor_nombre,
                    coti.numero_cotizacion,
                    ps.id_proyecto,
                    ps.nombre_proyecto,
                    ps.estado AS estado_proyecto
                FROM ordenes_trabajo ot
                LEFT JOIN clientes c ON ot.id_cliente = c.id_cliente
                LEFT JOIN clientes_contactos cc ON c.id_cliente = cc.id_cliente AND cc.es_principal = 1
                LEFT JOIN usuarios u ON ot.id_supervisor = u.id_usuario
                LEFT JOIN cotizaciones coti ON ot.id_cotizacion = coti.id_cotizacion
                LEFT JOIN proyectos_supervisados ps ON ot.id_ot = ps.id_ot
                ORDER BY ot.id_ot DESC";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            Response::error('Error en la consulta: ' . $conn->error, 400);
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            // Agregar campos de compatibilidad
            $row['cliente'] = $row['cliente_nombre'];
            $row['supervisor'] = $row['supervisor_nombre'];
            $data[] = $row;
        }
        
        Response::success($data, 'Órdenes de trabajo obtenidas correctamente', 200);
    }
    
    // ============================================
    // POST: Crear nueva orden de trabajo
    // ============================================
    else if ($method === 'POST') {
        // Obtener datos del cuerpo de la solicitud
        $inputData = json_decode(file_get_contents('php://input'), true);
        
        if (!$inputData) {
            Response::error('No se recibieron datos válidos', 400);
        }

        // ---------------------------------------------------------
        // NUEVA LÓGICA: Creación Completa (Transaccional)
        // ---------------------------------------------------------
        if (isset($inputData['action']) && $inputData['action'] === 'create_full') {
            error_log('🚀 [PHP] Iniciando creación completa de OT (Transaccional)');
            
            // Validar campos requeridos básicos
            if (empty($inputData['id_cliente']) || empty($inputData['descripcion_trabajo'])) {
                Response::error('Cliente y descripción son requeridos', 400);
            }

            // Iniciar Transacción
            $conn->begin_transaction();

            try {
                // 1. Generar Secuencial OT (ROBUSTO)
                $year = date('Y');
                
                // Obtener último número real
                $sqlMax = "SELECT numero_ot FROM ordenes_trabajo 
                           WHERE numero_ot LIKE 'OT-" . $year . "-%' 
                           ORDER BY LENGTH(numero_ot) DESC, numero_ot DESC 
                           LIMIT 1";
                $resultMax = $conn->query($sqlMax);
                
                $nextNumber = 1;
                if ($resultMax && $resultMax->num_rows > 0) {
                    $lastOT = $resultMax->fetch_assoc();
                    if (preg_match('/-(\d+)$/', $lastOT['numero_ot'], $matches)) {
                        $nextNumber = intval($matches[1]) + 1;
                    }
                }

                // Loop de seguridad para garantizar unicidad
                $maxAttempts = 10;
                $attempt = 0;
                do {
                    $numeroOT = 'OT-' . $year . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
                    
                    // Verificar si ya existe (dentro de la transacción, aunque no ve uncommitted de otros, ayuda con datos existentes)
                    $checkSql = "SELECT 1 FROM ordenes_trabajo WHERE numero_ot = '$numeroOT'";
                    $checkRes = $conn->query($checkSql);
                    
                    if ($checkRes->num_rows === 0) {
                        break; // No existe
                    }
                    
                    $nextNumber++;
                    $attempt++;
                } while ($attempt < $maxAttempts);

                if ($attempt >= $maxAttempts) {
                    throw new Exception("No se pudo generar un número de OT único. Por favor intente nuevamente.");
                }
                
                error_log("✅ Generado Numero OT: $numeroOT");
                // $numeroOT ya está definido en el loop

                // 2. Insertar Orden de Trabajo
                $idCliente = intval($inputData['id_cliente']);
                $representante = isset($inputData['representante']) ? $conn->real_escape_string($inputData['representante']) : null;
                $factura = isset($inputData['factura']) ? $conn->real_escape_string($inputData['factura']) : null;
                $idCotizacion = !empty($inputData['id_cotizacion']) ? intval($inputData['id_cotizacion']) : "NULL";
                $idSupervisor = !empty($inputData['id_supervisor']) ? intval($inputData['id_supervisor']) : "NULL";
                $fechaInicio = isset($inputData['fecha_inicio']) ? $conn->real_escape_string($inputData['fecha_inicio']) : date('Y-m-d');
                $fechaFinEstimada = isset($inputData['fecha_fin_estimada']) ? "'" . $conn->real_escape_string($inputData['fecha_fin_estimada']) . "'" : "NULL";
                $descripcionTrabajo = $conn->real_escape_string($inputData['descripcion_trabajo']);
                $estado = isset($inputData['estado']) ? $conn->real_escape_string($inputData['estado']) : 'pendiente';
                $prioridad = isset($inputData['prioridad']) ? $conn->real_escape_string($inputData['prioridad']) : 'media';
                $ubicacionTrabajo = isset($inputData['ubicacion_trabajo']) ? "'" . $conn->real_escape_string($inputData['ubicacion_trabajo']) . "'" : "NULL";
                $totalOT = isset($inputData['total_ot']) ? round(floatval($inputData['total_ot']), 2) : 0.00;
                error_log("💰 [PHP] Create Full - Total OT: " . $totalOT);

                $sqlOT = "INSERT INTO ordenes_trabajo (
                            numero_ot, id_cliente, representante, factura, id_cotizacion, id_supervisor, 
                            fecha_inicio, fecha_fin_estimada, descripcion_trabajo, estado, prioridad, ubicacion_trabajo, total_ot, estado_factura
                        ) VALUES (
                            '$numeroOT', $idCliente, " . ($representante ? "'$representante'" : "NULL") . ", 
                            " . ($factura ? "'$factura'" : "NULL") . ", $idCotizacion, $idSupervisor, 
                            '$fechaInicio', $fechaFinEstimada, '$descripcionTrabajo', '$estado', '$prioridad', $ubicacionTrabajo, $totalOT,
                            " . (isset($inputData['estado_factura']) ? "'" . $conn->real_escape_string($inputData['estado_factura']) . "'" : "'pendiente'") . "
                        )";

                if (!$conn->query($sqlOT)) {
                    throw new Exception("Error al crear OT: " . $conn->error);
                }
                $idOT = $conn->insert_id;
                error_log("✅ OT creada con ID: $idOT");

                // 2.1 Actualizar Cotización (si existe)
                if ($idCotizacion && $idCotizacion != 'NULL') {
                    $sqlUpdCot = "UPDATE cotizaciones SET id_ot = $idOT, estado = 'aprobada' WHERE id_cotizacion = $idCotizacion";
                    if (!$conn->query($sqlUpdCot)) {
                        // No lanzamos excepción crítica, pero logueamos el error
                        error_log("⚠️ Advertencia: No se pudo actualizar la cotización $idCotizacion: " . $conn->error);
                    } else {
                        error_log("✅ Cotización $idCotizacion actualizada a 'aprobada' y vinculada a OT $idOT");
                    }
                }

                // 3. Procesar Proyecto (Nuevo o Vinculación)
                if (isset($inputData['nuevo_proyecto']) && !empty($inputData['nuevo_proyecto'])) {
                    $proj = $inputData['nuevo_proyecto'];
                    $nombreProj = $conn->real_escape_string($proj['nombre_proyecto']);
                    $descProj = isset($proj['descripcion']) ? "'" . $conn->real_escape_string($proj['descripcion']) . "'" : "NULL";
                    $ubicProj = isset($proj['ubicacion']) ? "'" . $conn->real_escape_string($proj['ubicacion']) . "'" : "NULL";
                    $estadoProj = isset($proj['estado']) ? $conn->real_escape_string($proj['estado']) : 'ACTIVO';
                    $esExterno = (isset($proj['es_externo']) && $proj['es_externo']) ? 1 : 0;
                    $esInterno = (isset($proj['es_interno']) && $proj['es_interno']) ? 1 : 0;
                    
                    $horaIngreso = isset($proj['hora_ingreso']) ? "'" . $conn->real_escape_string($proj['hora_ingreso']) . "'" : "'08:00:00'";
                    $horaSalida = isset($proj['hora_salida']) ? "'" . $conn->real_escape_string($proj['hora_salida']) . "'" : "'17:00:00'";

                    $sqlProj = "INSERT INTO proyectos_supervisados (
                                    id_ot, id_supervisor, numero_ot, nombre_proyecto, descripcion, 
                                    hora_ingreso, hora_salida, estado, es_externo, es_interno
                                ) VALUES (
                                    $idOT, $idSupervisor, '$numeroOT', '$nombreProj', $descProj, 
                                    $horaIngreso, $horaSalida, '$estadoProj', $esExterno, $esInterno
                                )";
                    
                    if (!$conn->query($sqlProj)) {
                        throw new Exception("Error al crear proyecto: " . $conn->error);
                    }
                    $idProyecto = $conn->insert_id;

                    // Insertar en tabla hija según el tipo
                    if ($esExterno) {
                        $idClienteProj = intval($proj['id_cliente'] ?? $idCliente);
                        $presupuesto = floatval($proj['presupuesto_cotizado'] ?? $totalOT);
                        $ubicacionCli = isset($proj['ubicacion_cliente']) ? "'" . $conn->real_escape_string($proj['ubicacion_cliente']) . "'" : $ubicProj;
                        
                        $sqlExt = "INSERT INTO proyectos_externos (id_proyecto, id_cliente, ubicacion_cliente, presupuesto_cotizado) 
                                   VALUES ($idProyecto, $idClienteProj, $ubicacionCli, $presupuesto)";
                        if (!$conn->query($sqlExt)) {
                            throw new Exception("Error al crear detalles de proyecto externo: " . $conn->error);
                        }
                    }
                    
                    if ($esInterno) {
                        $idDepto = intval($proj['id_departamento'] ?? 0);
                        $area = isset($proj['area_solicitante']) ? "'" . $conn->real_escape_string($proj['area_solicitante']) . "'" : "NULL";
                        $centro = isset($proj['centro_costos']) ? "'" . $conn->real_escape_string($proj['centro_costos']) . "'" : "NULL";
                        
                        $sqlInt = "INSERT INTO proyectos_internos (id_proyecto, id_departamento, area_solicitante, centro_costos) 
                                   VALUES ($idProyecto, $idDepto, $area, $centro)";
                        if (!$conn->query($sqlInt)) {
                            throw new Exception("Error al crear detalles de proyecto interno: " . $conn->error);
                        }
                    }
                    error_log("✅ Proyecto nuevo ($idProyecto) creado y vinculado como " . ($esExterno ? "Externo" : "") . ($esInterno ? " Interno" : ""));
                } 
                elseif (isset($inputData['proyectos_ids_seleccionados']) && is_array($inputData['proyectos_ids_seleccionados'])) {
                    // Vincular múltiples proyectos existentes
                    foreach ($inputData['proyectos_ids_seleccionados'] as $idProyecto) {
                        $idProyecto = intval($idProyecto);
                        $sqlLink = "UPDATE proyectos_supervisados SET id_ot = $idOT WHERE id_proyecto = $idProyecto";
                        if (!$conn->query($sqlLink)) {
                            throw new Exception("Error al vincular proyecto existente ($idProyecto): " . $conn->error);
                        }
                    }
                    error_log("✅ Proyectos existentes vinculados: " . implode(',', $inputData['proyectos_ids_seleccionados']));
                }
                elseif (isset($inputData['proyecto_id_seleccionado']) && !empty($inputData['proyecto_id_seleccionado'])) {
                    // Vincular proyecto existente
                    $idProyecto = intval($inputData['proyecto_id_seleccionado']);
                    $sqlLink = "UPDATE proyectos_supervisados SET id_ot = $idOT WHERE id_proyecto = $idProyecto";
                    if (!$conn->query($sqlLink)) {
                        throw new Exception("Error al vincular proyecto existente: " . $conn->error);
                    }
                    error_log("✅ Proyecto existente vinculado ($idProyecto)");
                }

                // 4. Procesar Materiales (Egreso de Inventario)
                if (isset($inputData['materiales_egreso']) && is_array($inputData['materiales_egreso']) && count($inputData['materiales_egreso']) > 0) {
                    
                    // a. Generar Numero Egreso
                    $sqlSeq = "SELECT COUNT(*) as total FROM egresos_bodega";
                    $resSeq = $conn->query($sqlSeq);
                    $rowSeq = $resSeq->fetch_assoc();
                    $nextNum = $rowSeq['total'] + 1;
                    $numeroEgreso = 'EGR-' . str_pad($nextNum, 3, '0', STR_PAD_LEFT);

                    // b. Insertar Cabecera Egreso
                    $fechaEgreso = date('Y-m-d H:i:s');
                    $idAutorizado = 1; // Default Admin
                    $obsEgreso = "Generado automáticamente desde OT $numeroOT";
                    $valorTotal = 0;

                    $sqlEgreso = "INSERT INTO egresos_bodega (numero_egreso, id_ot, id_cliente, fecha_egreso, id_autorizado_por, observaciones, valor_total) 
                                  VALUES ('$numeroEgreso', $idOT, $idCliente, '$fechaEgreso', $idAutorizado, '$obsEgreso', 0)";
                    
                    if (!$conn->query($sqlEgreso)) {
                        throw new Exception("Error al crear cabecera de egreso: " . $conn->error);
                    }
                    $idEgreso = $conn->insert_id;

                    // c. Procesar Detalles
                    foreach ($inputData['materiales_egreso'] as $material) {
                        $idProducto = intval($material['id_producto']);
                        $cantidad = floatval($material['cantidad']);
                        // El precio viene del frontend, pero deberíamos verificarlo o usar el de la BD. 
                        // Por consistencia con egresos_bodega.php, usaremos el de la BD (inventario/productos).
                        
                        // Verificar Stock y Precio
                        $sqlStock = "SELECT i.stock_actual, p.precio_unitario 
                                     FROM inventario i 
                                     JOIN productos p ON i.id_producto = p.id_producto 
                                     WHERE i.id_producto = $idProducto FOR UPDATE";
                        $resStock = $conn->query($sqlStock);
                        
                        if (!$resStock || $resStock->num_rows === 0) {
                            throw new Exception("Producto ID $idProducto no encontrado en inventario");
                        }
                        
                        $prodData = $resStock->fetch_assoc();
                        $stockActual = floatval($prodData['stock_actual']);
                        $precioUnitario = floatval($prodData['precio_unitario']);

                        if ($stockActual < $cantidad) {
                            throw new Exception("Stock insuficiente para producto ID $idProducto. Disponible: $stockActual, Solicitado: $cantidad");
                        }

                        // Insertar Detalle Egreso (vinculado a id_egreso, NO id_ot)
                        // Nota: detalle_egreso(id_egreso, id_producto, cantidad) - segun egresos_bodega.php
                        $sqlDetalle = "INSERT INTO detalle_egreso (id_egreso, id_producto, cantidad) 
                                       VALUES ($idEgreso, $idProducto, $cantidad)";
                        
                        if (!$conn->query($sqlDetalle)) {
                            throw new Exception("Error al registrar detalle de egreso: " . $conn->error);
                        }

                        // Actualizar Stock
                        $sqlUpdateStock = "UPDATE inventario SET stock_actual = stock_actual - $cantidad WHERE id_producto = $idProducto";
                        if (!$conn->query($sqlUpdateStock)) {
                            throw new Exception("Error al descontar stock: " . $conn->error);
                        }

                        $valorTotal += ($cantidad * $precioUnitario);
                    }

                    // d. Actualizar Total Egreso
                    $conn->query("UPDATE egresos_bodega SET valor_total = $valorTotal WHERE id_egreso = $idEgreso");
                    error_log("✅ Egreso $numeroEgreso creado con valor $valorTotal");
                }

                $conn->commit();
                
                // Obtener datos finales para respuesta
                $sqlFinal = "SELECT ot.*, c.nombre_razon_social as cliente FROM ordenes_trabajo ot 
                             LEFT JOIN clientes c ON ot.id_cliente = c.id_cliente 
                             WHERE ot.id_ot = $idOT";
                $resFinal = $conn->query($sqlFinal);
                $dataFinal = $resFinal->fetch_assoc();
                
                Response::success($dataFinal, 'Orden de Trabajo creada exitosamente con todos sus componentes', 201);

            } catch (Exception $e) {
                $conn->rollback();
                error_log("❌ [PHP] Error Transacción: " . $e->getMessage());
                Response::error($e->getMessage(), 500);
            }
            exit; // Importante salir aquí
        }

        // ---------------------------------------------------------
        // FIN NUEVA LÓGICA
        // ---------------------------------------------------------
        
        // Validar campos requeridos
        $camposRequeridos = ['id_cliente', 'descripcion_trabajo'];
        foreach ($camposRequeridos as $campo) {
            if (!isset($inputData[$campo]) || empty($inputData[$campo])) {
                Response::error("El campo '$campo' es requerido", 400);
            }
        }
        
        // Generar número de OT secuencial automáticamente por año (OT-YYYY-NNN)
        // CORRECCION: Usar ordenamiento por longitud y valor para obtener el verdadero último número
        // y verificar existencia para evitar duplicados
        $year = date('Y');
        
        // 1. Obtener el último número usado (independientemente del ID)
        $sqlMax = "SELECT numero_ot FROM ordenes_trabajo 
                   WHERE numero_ot LIKE 'OT-" . $year . "-%' 
                   ORDER BY LENGTH(numero_ot) DESC, numero_ot DESC 
                   LIMIT 1";
        $resultMax = $conn->query($sqlMax);

        $nextNumber = 1;
        if ($resultMax && $resultMax->num_rows > 0) {
            $lastOT = $resultMax->fetch_assoc();
            if (preg_match('/-(\d+)$/', $lastOT['numero_ot'], $matches)) {
                $lastSeq = intval($matches[1]);
                $nextNumber = $lastSeq + 1;
            }
        }

        // 2. Loop de seguridad para garantizar unicidad
        $maxAttempts = 10;
        $attempt = 0;
        do {
            $numeroOT = 'OT-' . $year . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            
            // Verificar si ya existe
            $checkSql = "SELECT 1 FROM ordenes_trabajo WHERE numero_ot = '$numeroOT'";
            $checkRes = $conn->query($checkSql);
            
            if ($checkRes->num_rows === 0) {
                break; // No existe, es válido
            }
            
            // Si existe, incrementamos y probamos de nuevo
            $nextNumber++;
            $attempt++;
        } while ($attempt < $maxAttempts);

        if ($attempt >= $maxAttempts) {
            Response::error("Error al generar número de OT único después de varios intentos", 500);
        }
        
        // Preparar datos para inserción
        $idCliente = intval($inputData['id_cliente']);
        $representante = isset($inputData['representante']) ? $conn->real_escape_string($inputData['representante']) : null;
        $factura = isset($inputData['factura']) ? $conn->real_escape_string($inputData['factura']) : null;
        $idCotizacion = isset($inputData['id_cotizacion']) && !empty($inputData['id_cotizacion']) ? intval($inputData['id_cotizacion']) : null;
        $idSupervisor = isset($inputData['id_supervisor']) && !empty($inputData['id_supervisor']) ? intval($inputData['id_supervisor']) : null;
        $fechaInicio = isset($inputData['fecha_inicio']) ? $conn->real_escape_string($inputData['fecha_inicio']) : date('Y-m-d');
        $fechaFinEstimada = isset($inputData['fecha_fin_estimada']) ? $conn->real_escape_string($inputData['fecha_fin_estimada']) : null;
        $descripcionTrabajo = $conn->real_escape_string($inputData['descripcion_trabajo']);
        $estado = isset($inputData['estado']) ? $conn->real_escape_string($inputData['estado']) : 'pendiente';
        $prioridad = isset($inputData['prioridad']) ? $conn->real_escape_string($inputData['prioridad']) : 'media';
        $ubicacionTrabajo = isset($inputData['ubicacion_trabajo']) ? $conn->real_escape_string($inputData['ubicacion_trabajo']) : null;
        $totalOT = isset($inputData['total_ot']) ? round(floatval($inputData['total_ot']), 2) : 0.00;
        
        // Construir query de inserción
        $sql = "INSERT INTO ordenes_trabajo (
                    numero_ot, 
                    id_cliente, 
                    representante,
                    factura,
                    id_cotizacion, 
                    id_supervisor, 
                    fecha_inicio, 
                    fecha_fin_estimada, 
                    descripcion_trabajo, 
                    estado, 
                    prioridad, 
                    ubicacion_trabajo,
                    total_ot,
                    estado_factura
                ) VALUES (
                    '$numeroOT',
                    $idCliente,
                    " . ($representante ? "'$representante'" : "NULL") . ",
                    " . ($factura ? "'$factura'" : "NULL") . ",
                    " . ($idCotizacion ? $idCotizacion : "NULL") . ",
                    " . ($idSupervisor ? $idSupervisor : "NULL") . ",
                    '$fechaInicio',
                    " . ($fechaFinEstimada ? "'$fechaFinEstimada'" : "NULL") . ",
                    '$descripcionTrabajo',
                    '$estado',
                    '$prioridad',
                    " . ($ubicacionTrabajo ? "'$ubicacionTrabajo'" : "NULL") . ",
                    $totalOT,
                    " . (isset($inputData['estado_factura']) ? "'" . $conn->real_escape_string($inputData['estado_factura']) . "'" : "'pendiente'") . "
                )";
        
        if ($conn->query($sql)) {
            $newId = $conn->insert_id;
            
            // Obtener la orden recién creada con sus datos relacionados
            $sqlNew = "SELECT 
                        ot.*, 
                        c.nombre_razon_social AS cliente_nombre,
                        u.nombre_completo AS supervisor_nombre
                    FROM ordenes_trabajo ot
                    LEFT JOIN clientes c ON ot.id_cliente = c.id_cliente
                    LEFT JOIN usuarios u ON ot.id_supervisor = u.id_usuario
                    WHERE ot.id_ot = $newId";
            
            $resultNew = $conn->query($sqlNew);
            $newOrder = $resultNew->fetch_assoc();
            $newOrder['cliente'] = $newOrder['cliente_nombre'];
            $newOrder['supervisor'] = $newOrder['supervisor_nombre'];
            
            Response::success($newOrder, 'Orden de trabajo creada correctamente', 201);
        } else {
            Response::error('Error al crear la orden: ' . $conn->error, 500);
        }
    }
    
    // ============================================
    // PUT: Actualizar orden de trabajo existente
    // ============================================
    else if ($method === 'PUT') {
        // Obtener datos del cuerpo de la solicitud
        $inputData = json_decode(file_get_contents('php://input'), true);
        
        if (!$inputData) {
            Response::error('No se recibieron datos válidos', 400);
        }
        
        // Validar ID
        if (!isset($inputData['id_ot']) || empty($inputData['id_ot'])) {
            Response::error('El ID de la orden es requerido', 400);
        }
        
        $idOT = intval($inputData['id_ot']);
        
        // Verificar si es una actualización parcial (solo campos específicos)
        if (isset($inputData['action']) && $inputData['action'] === 'update_partial') {
            // ... (Lógica de update_partial existente) ...
            error_log("🔵 [PHP] Actualización parcial de orden: " . $idOT . " Data: " . json_encode($inputData));
            
            // Construir query dinámica solo con los campos enviados
            $updates = [];
            
            if (isset($inputData['estado'])) {
                $estado = $conn->real_escape_string($inputData['estado']);
                $updates[] = "estado = '$estado'";
            }
            
            if (isset($inputData['prioridad'])) {
                if ($inputData['prioridad'] === null) {
                    $updates[] = "prioridad = NULL";
                } else {
                    $prioridad = $conn->real_escape_string($inputData['prioridad']);
                    $updates[] = "prioridad = '$prioridad'";
                }
            }
            
            if (isset($inputData['id_supervisor'])) {
                $idSupervisor = intval($inputData['id_supervisor']);
                $updates[] = "id_supervisor = $idSupervisor";
            }
            
            if (isset($inputData['fecha_fin_real'])) {
                $fechaFinReal = $conn->real_escape_string($inputData['fecha_fin_real']);
                $updates[] = "fecha_fin_real = '$fechaFinReal'";
            }

            if (isset($inputData['total_ot'])) {
                $totalOT = round(floatval($inputData['total_ot']), 2);
                $updates[] = "total_ot = $totalOT";
            }

            if (isset($inputData['estado_factura'])) {
                $estadoFactura = $conn->real_escape_string($inputData['estado_factura']);
                $updates[] = "estado_factura = '$estadoFactura'";
            }
            
            if (empty($updates)) {
                Response::error('No se proporcionaron campos para actualizar', 400);
            }
            
            $sql = "UPDATE ordenes_trabajo SET " . implode(", ", $updates) . " WHERE id_ot = $idOT";
            
            if ($conn->query($sql)) {
                Response::success(['id_ot' => $idOT], 'Campo actualizado correctamente', 200);
            } else {
                Response::error('Error al actualizar: ' . $conn->error, 500);
            }
            exit;
        }
        
        // ---------------------------------------------------------
        // ACTUALIZACIÓN COMPLETA (TRANSACCIONAL)
        // ---------------------------------------------------------
        
        $conn->begin_transaction();
        
        try {
            // 1. Actualizar Datos Principales de la OT
            $camposRequeridos = ['id_cliente', 'descripcion_trabajo'];
            foreach ($camposRequeridos as $campo) {
                if (!isset($inputData[$campo]) || empty($inputData[$campo])) {
                    throw new Exception("El campo '$campo' es requerido");
                }
            }
            
            $idCliente = intval($inputData['id_cliente']);
            $representante = isset($inputData['representante']) ? $conn->real_escape_string($inputData['representante']) : null;
            $factura = isset($inputData['factura']) ? $conn->real_escape_string($inputData['factura']) : null;
            $idCotizacion = isset($inputData['id_cotizacion']) && !empty($inputData['id_cotizacion']) ? intval($inputData['id_cotizacion']) : null;
            $idSupervisor = isset($inputData['id_supervisor']) && !empty($inputData['id_supervisor']) ? intval($inputData['id_supervisor']) : null;
            $fechaInicio = isset($inputData['fecha_inicio']) ? $conn->real_escape_string($inputData['fecha_inicio']) : date('Y-m-d');
            $fechaFinEstimada = isset($inputData['fecha_fin_estimada']) ? $conn->real_escape_string($inputData['fecha_fin_estimada']) : null;
            $descripcionTrabajo = $conn->real_escape_string($inputData['descripcion_trabajo']);
            $estado = isset($inputData['estado']) ? $conn->real_escape_string($inputData['estado']) : 'pendiente';
            $prioridad = isset($inputData['prioridad']) ? $conn->real_escape_string($inputData['prioridad']) : 'media';
            $ubicacionTrabajo = isset($inputData['ubicacion_trabajo']) ? $conn->real_escape_string($inputData['ubicacion_trabajo']) : null;
            $totalOT = isset($inputData['total_ot']) ? round(floatval($inputData['total_ot']), 2) : 0.00;
            error_log("💰 [PHP] Update Full - Total OT: " . $totalOT);
            
            $sql = "UPDATE ordenes_trabajo SET 
                        id_cliente = $idCliente,
                        representante = " . ($representante ? "'$representante'" : "NULL") . ",
                        factura = " . ($factura ? "'$factura'" : "NULL") . ",
                        id_cotizacion = " . ($idCotizacion ? $idCotizacion : "NULL") . ",
                        id_supervisor = " . ($idSupervisor ? $idSupervisor : "NULL") . ",
                        fecha_inicio = '$fechaInicio',
                        fecha_fin_estimada = " . ($fechaFinEstimada ? "'$fechaFinEstimada'" : "NULL") . ",
                        descripcion_trabajo = '$descripcionTrabajo',
                        estado = '$estado',
                        prioridad = '$prioridad',
                        ubicacion_trabajo = " . ($ubicacionTrabajo ? "'$ubicacionTrabajo'" : "NULL") . ",
                        total_ot = $totalOT,
                        estado_factura = " . (isset($inputData['estado_factura']) ? "'" . $conn->real_escape_string($inputData['estado_factura']) . "'" : "estado_factura") . "
                    WHERE id_ot = $idOT";
            
            error_log("📝 [PHP] SQL Update: " . $sql);

            if (!$conn->query($sql)) {
                throw new Exception("Error al actualizar OT: " . $conn->error);
            } else {
                error_log("✅ [PHP] Update query executed successfully. Affected rows: " . $conn->affected_rows);
            }

            // 1.1 Actualizar Cotización (si existe y cambió)
            if ($idCotizacion && $idCotizacion != 'NULL') {
                $sqlUpdCot = "UPDATE cotizaciones SET id_ot = $idOT, estado = 'aprobada' WHERE id_cotizacion = $idCotizacion";
                $conn->query($sqlUpdCot); // Ignoramos error si falla, no es crítico
            }

            // 2. Procesar Proyecto (Nuevo o Vinculación)
            if (isset($inputData['nuevo_proyecto']) && !empty($inputData['nuevo_proyecto'])) {
                $proj = $inputData['nuevo_proyecto'];
                $nombreProj = $conn->real_escape_string($proj['nombre_proyecto']);
                $descProj = isset($proj['descripcion']) ? "'" . $conn->real_escape_string($proj['descripcion']) . "'" : "NULL";
                // $ubicProj = isset($proj['ubicacion']) ? "'" . $conn->real_escape_string($proj['ubicacion']) . "'" : "NULL"; // Campo no existe
                $estadoProj = isset($proj['estado']) ? $conn->real_escape_string($proj['estado']) : 'planificacion';
                
                // Obtener datos faltantes para proyecto
                if (!$idSupervisor) {
                    $resSup = $conn->query("SELECT id_supervisor FROM ordenes_trabajo WHERE id_ot = $idOT");
                    if ($rowSup = $resSup->fetch_assoc()) {
                        $idSupervisor = $rowSup['id_supervisor'];
                    }
                }
                if (!$idSupervisor) {
                    throw new Exception("Se requiere un supervisor asignado para crear un proyecto.");
                }

                $resNum = $conn->query("SELECT numero_ot FROM ordenes_trabajo WHERE id_ot = $idOT");
                $rowNum = $resNum->fetch_assoc();
                $numeroOT = $rowNum['numero_ot'];

                $horaIngreso = isset($proj['hora_ingreso']) ? "'" . $conn->real_escape_string($proj['hora_ingreso']) . "'" : "'08:00:00'";
                $horaSalida = isset($proj['hora_salida']) ? "'" . $conn->real_escape_string($proj['hora_salida']) . "'" : "'17:00:00'";

                $sqlProj = "INSERT INTO proyectos_supervisados (
                                id_ot, id_supervisor, numero_ot, nombre_proyecto, descripcion, 
                                hora_ingreso, hora_salida, estado
                            ) VALUES (
                                $idOT, $idSupervisor, '$numeroOT', '$nombreProj', $descProj, 
                                $horaIngreso, $horaSalida, '$estadoProj'
                            )";
                
                if (!$conn->query($sqlProj)) {
                    throw new Exception("Error al crear proyecto: " . $conn->error);
                }
            } 
            elseif (isset($inputData['proyectos_ids_seleccionados']) && is_array($inputData['proyectos_ids_seleccionados'])) {
                // Desvincular proyectos anteriores
                $conn->query("UPDATE proyectos_supervisados SET id_ot = NULL WHERE id_ot = $idOT");
                
                // Vincular nuevos proyectos
                foreach ($inputData['proyectos_ids_seleccionados'] as $idProyecto) {
                    $idProyecto = intval($idProyecto);
                    $sqlLink = "UPDATE proyectos_supervisados SET id_ot = $idOT WHERE id_proyecto = $idProyecto";
                    if (!$conn->query($sqlLink)) {
                        throw new Exception("Error al vincular proyecto existente ($idProyecto): " . $conn->error);
                    }
                }
            }
            elseif (isset($inputData['proyecto_id_seleccionado']) && !empty($inputData['proyecto_id_seleccionado'])) {
                // Desvincular proyectos anteriores (compatibilidad)
                $conn->query("UPDATE proyectos_supervisados SET id_ot = NULL WHERE id_ot = $idOT");
                
                $idProyecto = intval($inputData['proyecto_id_seleccionado']);
                $sqlLink = "UPDATE proyectos_supervisados SET id_ot = $idOT WHERE id_proyecto = $idProyecto";
                if (!$conn->query($sqlLink)) {
                    throw new Exception("Error al vincular proyecto existente: " . $conn->error);
                }
            }

            // 3. Procesar Materiales (Egreso de Inventario)
            // ---------------------------------------------------------
            // CORRECCION: Reemplazo total de materiales (Snapshot)
            // Primero devolvemos el stock de los egresos anteriores y los eliminamos
            // para asegurar que el inventario y la lista de materiales coincidan con el formulario.
            // ---------------------------------------------------------
            
            $sqlOldEgresos = "SELECT id_egreso FROM egresos_bodega WHERE id_ot = $idOT";
            $resOldEgresos = $conn->query($sqlOldEgresos);
            
            if ($resOldEgresos) {
                while ($rowEgreso = $resOldEgresos->fetch_assoc()) {
                    $oldIdEgreso = $rowEgreso['id_egreso'];
                    
                    // 1. Devolver Stock
                    $sqlOldDetalles = "SELECT id_producto, cantidad FROM detalle_egreso WHERE id_egreso = $oldIdEgreso";
                    $resOldDetalles = $conn->query($sqlOldDetalles);
                    if ($resOldDetalles) {
                        while ($rowDetalle = $resOldDetalles->fetch_assoc()) {
                            $pId = $rowDetalle['id_producto'];
                            $pCant = $rowDetalle['cantidad'];
                            $conn->query("UPDATE inventario SET stock_actual = stock_actual + $pCant WHERE id_producto = $pId");
                        }
                    }
                    
                    // 2. Eliminar registros antiguos
                    $conn->query("DELETE FROM detalle_egreso WHERE id_egreso = $oldIdEgreso");
                    $conn->query("DELETE FROM egresos_bodega WHERE id_egreso = $oldIdEgreso");
                }
            }

            // 4. Insertar Nuevos Materiales (si existen)
            if (isset($inputData['materiales_egreso']) && is_array($inputData['materiales_egreso']) && count($inputData['materiales_egreso']) > 0) {
                
                // a. Generar Numero Egreso
                $sqlSeq = "SELECT COUNT(*) as total FROM egresos_bodega";
                $resSeq = $conn->query($sqlSeq);
                $rowSeq = $resSeq->fetch_assoc();
                $nextNum = $rowSeq['total'] + 1;
                $numeroEgreso = 'EGR-' . str_pad($nextNum, 3, '0', STR_PAD_LEFT);

                // b. Obtener numero_ot para las observaciones
                $sqlNumOT = "SELECT numero_ot FROM ordenes_trabajo WHERE id_ot = $idOT";
                $resNumOT = $conn->query($sqlNumOT);
                $rowNumOT = $resNumOT->fetch_assoc();
                $numeroOTEgreso = $rowNumOT['numero_ot'] ?? "OT-$idOT";

                // c. Insertar Cabecera Egreso
                $fechaEgreso = date('Y-m-d H:i:s');
                $idAutorizado = 1; // Default Admin
                $obsEgreso = "Actualizado desde $numeroOTEgreso";
                $valorTotal = 0;

                $sqlEgreso = "INSERT INTO egresos_bodega (numero_egreso, id_ot, id_cliente, fecha_egreso, id_autorizado_por, observaciones, valor_total) 
                              VALUES ('$numeroEgreso', $idOT, $idCliente, '$fechaEgreso', $idAutorizado, '$obsEgreso', 0)";
                
                if (!$conn->query($sqlEgreso)) {
                    throw new Exception("Error al crear cabecera de egreso: " . $conn->error);
                }
                $idEgreso = $conn->insert_id;

                // c. Procesar Detalles
                foreach ($inputData['materiales_egreso'] as $material) {
                    $idProducto = intval($material['id_producto']);
                    $cantidad = floatval($material['cantidad']);
                    
                    // Verificar Stock y Precio
                    $sqlStock = "SELECT i.stock_actual, p.precio_unitario 
                                 FROM inventario i 
                                 JOIN productos p ON i.id_producto = p.id_producto 
                                 WHERE i.id_producto = $idProducto FOR UPDATE";
                    $resStock = $conn->query($sqlStock);
                    
                    if (!$resStock || $resStock->num_rows === 0) {
                        throw new Exception("Producto ID $idProducto no encontrado en inventario");
                    }
                    
                    $prodData = $resStock->fetch_assoc();
                    $stockActual = floatval($prodData['stock_actual']);
                    $precioUnitario = floatval($prodData['precio_unitario']);

                    if ($stockActual < $cantidad) {
                        throw new Exception("Stock insuficiente para producto ID $idProducto. Disponible: $stockActual, Solicitado: $cantidad");
                    }

                    // Insertar Detalle Egreso
                    $sqlDetalle = "INSERT INTO detalle_egreso (id_egreso, id_producto, cantidad) 
                                   VALUES ($idEgreso, $idProducto, $cantidad)";
                    
                    if (!$conn->query($sqlDetalle)) {
                        throw new Exception("Error al registrar detalle de egreso: " . $conn->error);
                    }

                    // Actualizar Stock
                    $sqlUpdateStock = "UPDATE inventario SET stock_actual = stock_actual - $cantidad WHERE id_producto = $idProducto";
                    if (!$conn->query($sqlUpdateStock)) {
                        throw new Exception("Error al descontar stock: " . $conn->error);
                    }

                    $valorTotal += ($cantidad * $precioUnitario);
                }

                // d. Actualizar Total Egreso
                $conn->query("UPDATE egresos_bodega SET valor_total = $valorTotal WHERE id_egreso = $idEgreso");
            }

            $conn->commit();
            
            // Obtener datos finales para respuesta
            $sqlFinal = "SELECT ot.*, c.nombre_razon_social as cliente FROM ordenes_trabajo ot 
                         LEFT JOIN clientes c ON ot.id_cliente = c.id_cliente 
                         WHERE ot.id_ot = $idOT";
            $resFinal = $conn->query($sqlFinal);
            $dataFinal = $resFinal->fetch_assoc();
            
            Response::success($dataFinal, 'Orden de Trabajo actualizada exitosamente', 200);

        } catch (Exception $e) {
            $conn->rollback();
            error_log("❌ [PHP] Error Transacción Update: " . $e->getMessage());
            Response::error($e->getMessage(), 500);
        }
    }
    
    // ============================================
    // DELETE: Eliminar orden de trabajo
    // ============================================
    else if ($method === 'DELETE') {
        // Obtener ID de la URL
        if (!isset($_GET['id']) || empty($_GET['id'])) {
            Response::error('El ID de la orden es requerido', 400);
        }
        
        $idOT = intval($_GET['id']);
        
        // Verificar si existe
        $sqlCheck = "SELECT numero_ot FROM ordenes_trabajo WHERE id_ot = $idOT";
        $resultCheck = $conn->query($sqlCheck);
        
        if ($resultCheck->num_rows === 0) {
            Response::error('La orden de trabajo no existe', 404);
        }
        
        // Eliminar orden (las relaciones deberían manejarse por ON DELETE CASCADE si está configurado,
        // de lo contrario, habría que eliminar manualmente los registros relacionados)
        $sql = "DELETE FROM ordenes_trabajo WHERE id_ot = $idOT";
        
        if ($conn->query($sql)) {
            Response::success(null, 'Orden de trabajo eliminada correctamente', 200);
        } else {
            Response::error('Error al eliminar la orden: ' . $conn->error, 500);
        }
    }
    
    else {
        Response::error('Método no permitido', 405);
    }

} catch (Exception $e) {
    Response::error('Error interno del servidor: ' . $e->getMessage(), 500);
}
?>