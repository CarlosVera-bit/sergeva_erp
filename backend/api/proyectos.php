<?php
// filepath: backend/api/proyectos.php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configurar zona horaria para Ecuador
date_default_timezone_set('America/Guayaquil');

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'php_errors.log');

// Verificar si podemos escribir en el directorio
if (!is_writable('.')) {
    file_put_contents('php://stderr', "Error: El directorio actual no es escribible por PHP\n");
}

require_once '../config/Database.php';
require_once '../config/Response.php';

$db = new Database();
$conn = $db->connect();

$method = $_SERVER['REQUEST_METHOD'];

try {
    // Logging para depuración
    if ($method === 'POST' || $method === 'PUT') {
        $input_raw = file_get_contents('php://input');
        error_log("Proyectos.php Method: $method, Input: $input_raw");
        file_put_contents('debug.log', "[" . date('Y-m-d H:i:s') . "] Method: $method, Input: $input_raw\n", FILE_APPEND);
    }

    if ($method === 'GET') {
        // Establecer zona horaria de MySQL a Ecuador
        $conn->query("SET time_zone = '-05:00'");
        
        // Endpoint especial: obtener trabajadores activos de un proyecto
        if (isset($_GET['trabajadores']) && isset($_GET['id_proyecto'])) {
            $id_proyecto = intval($_GET['id_proyecto']);
            
            $sql = "SELECT DISTINCT
                        u.id_usuario,
                        u.nombre_completo,
                        u.rol,
                        u.email,
                        entrada.fecha_hora as hora_entrada,
                        entrada.tipo_registro,
                        salida.fecha_hora as hora_salida,
                        CASE 
                            WHEN salida.fecha_hora IS NULL THEN 'ACTIVO'
                            ELSE 'INACTIVO'
                        END as estado_trabajador
                    FROM asistencias_biometricas entrada
                    JOIN usuarios u ON entrada.id_usuario = u.id_usuario
                    LEFT JOIN asistencias_biometricas salida ON salida.id_usuario = entrada.id_usuario 
                        AND salida.id_proyecto = entrada.id_proyecto 
                        AND salida.tipo_registro LIKE 'SALIDA%'
                        AND DATE(salida.fecha_hora) = CURDATE()
                        AND salida.fecha_hora > entrada.fecha_hora
                    WHERE entrada.id_proyecto = $id_proyecto 
                        AND entrada.tipo_registro LIKE 'ENTRADA%'
                        AND DATE(entrada.fecha_hora) = CURDATE()
                    ORDER BY entrada.fecha_hora DESC";
            
            $result = $conn->query($sql);
            
            if (!$result) {
                Response::error('Error en la consulta: ' . $conn->error, 400);
            }
            
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            
            Response::success($data, 'Trabajadores del proyecto obtenidos correctamente', 200);
        }
        
        // Filtros opcionales
        $id_supervisor = isset($_GET['id_supervisor']) ? intval($_GET['id_supervisor']) : null;
        $id_ot = isset($_GET['id_ot']) ? intval($_GET['id_ot']) : null;
        $id_proyecto = isset($_GET['id_proyecto']) ? intval($_GET['id_proyecto']) : null;
        $estado = isset($_GET['estado']) ? $_GET['estado'] : null;
        
        $sql = "SELECT 
                    p.id_proyecto,
                    p.id_ot,
                    p.id_supervisor,
                    COALESCE(ot.numero_ot, p.numero_ot) as numero_ot,
                    p.nombre_proyecto,
                    p.descripcion,
                    p.hora_ingreso,
                    p.hora_salida,
                    p.estado,
                    p.fecha_creacion,
                    p.es_externo,
                    p.es_interno,
                    pe.id_cliente,
                    pe.ubicacion_cliente,
                    pe.presupuesto_cotizado,
                    pi.id_departamento,
                    pi.area_solicitante,
                    pi.centro_costos,
                    u.nombre_completo as nombre_supervisor,
                    ot.descripcion_trabajo as descripcion_ot,
                    c.nombre_razon_social as cliente,
                    ot.ubicacion_trabajo as direccion_trabajo,
                    ot.fecha_inicio as fecha_inicio_ot,
                    ot.fecha_fin_estimada as fecha_fin_ot,
                    ot.estado as estado_ot,
                    coti.total as valor_ot,
                    (SELECT COUNT(DISTINCT entrada.id_usuario)
                     FROM asistencias_biometricas entrada
                     WHERE entrada.id_proyecto = p.id_proyecto
                       AND DATE(entrada.fecha_hora) = CURDATE()
                       AND entrada.tipo_registro LIKE 'ENTRADA%'
                    ) as personal_asignado
                FROM proyectos_supervisados p
                LEFT JOIN proyectos_externos pe ON p.id_proyecto = pe.id_proyecto
                LEFT JOIN proyectos_internos pi ON p.id_proyecto = pi.id_proyecto
                LEFT JOIN usuarios u ON p.id_supervisor = u.id_usuario
                LEFT JOIN ordenes_trabajo ot ON p.id_ot = ot.id_ot
                LEFT JOIN clientes c ON ot.id_cliente = c.id_cliente
                LEFT JOIN cotizaciones coti ON ot.id_cotizacion = coti.id_cotizacion
                WHERE 1=1";
        
        if ($id_supervisor) {
            $sql .= " AND p.id_supervisor = " . $id_supervisor;
        }
        
        if ($id_ot) {
            $sql .= " AND p.id_ot = " . $id_ot;
        }
        
        if ($id_proyecto) {
            $sql .= " AND p.id_proyecto = " . $id_proyecto;
        }
        
        if ($estado) {
            $sql .= " AND p.estado = '" . $conn->real_escape_string($estado) . "'";
        }
        
        $sql .= " GROUP BY p.id_proyecto ORDER BY p.fecha_creacion DESC";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            Response::error('Error en la consulta: ' . $conn->error, 400);
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $row['es_externo'] = intval($row['es_externo']);
            $row['es_interno'] = intval($row['es_interno']);
            $row['personal_asignado'] = intval($row['personal_asignado']); // Asegurar que sea número
            $data[] = $row;
        }
        
        // Debug: Obtener fecha actual de MySQL
        $debug_result = $conn->query("SELECT CURDATE() as fecha_actual, NOW() as fecha_hora_actual");
        $debug_info = $debug_result->fetch_assoc();
        
        // Debug: Contar asistencias de hoy
        $debug_count = $conn->query("SELECT COUNT(*) as total FROM asistencias_biometricas WHERE DATE(fecha_hora) = CURDATE() AND tipo_registro LIKE 'ENTRADA%'");
        $debug_asistencias = $debug_count->fetch_assoc();
        
        // Log para depuración
        error_log("DEBUG Proyectos - Fecha MySQL: " . $debug_info['fecha_actual'] . " | Hora: " . $debug_info['fecha_hora_actual']);
        error_log("DEBUG Proyectos - Total asistencias hoy: " . $debug_asistencias['total']);
        error_log("DEBUG Proyectos - Total proyectos retornados: " . count($data));
        
        Response::success($data, 'Proyectos obtenidos correctamente', 200);
        
    } elseif ($method === 'POST') {
        // Crear nuevo proyecto
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id_ot']) || !isset($input['id_supervisor']) || 
            !isset($input['nombre_proyecto']) || !isset($input['hora_ingreso']) || 
            !isset($input['hora_salida'])) {
            Response::error('Faltan campos requeridos', 400);
        }
        
        $conn->begin_transaction();
        
        try {
            $stmt = $conn->prepare("INSERT INTO proyectos_supervisados 
                (id_ot, id_supervisor, numero_ot, nombre_proyecto, descripcion, 
                 hora_ingreso, hora_salida, estado, es_externo, es_interno) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $estado = $input['estado'] ?? 'ACTIVO';
            // Asegurar que los flags sean 0 o 1
            $es_externo = (isset($input['es_externo']) && $input['es_externo']) ? 1 : 0;
            $es_interno = (isset($input['es_interno']) && $input['es_interno']) ? 1 : 0;
            
            $stmt->bind_param(
                "iissssssii",
                $input['id_ot'],
                $input['id_supervisor'],
                $input['numero_ot'],
                $input['nombre_proyecto'],
                $input['descripcion'],
                $input['hora_ingreso'],
                $input['hora_salida'],
                $estado,
                $es_externo,
                $es_interno
            );
            
            if (!$stmt->execute()) {
                throw new Exception('Error al crear proyecto base: ' . $stmt->error);
            }
            
            $id_proyecto = $stmt->insert_id;
            $stmt->close();
            
            // Insertar en tabla hija según el tipo (pueden ser ambos)
            if ($es_externo) {
                $stmt_ext = $conn->prepare("INSERT INTO proyectos_externos 
                    (id_proyecto, id_cliente, ubicacion_cliente, presupuesto_cotizado) 
                    VALUES (?, ?, ?, ?)");
                
                $id_cliente = intval($input['id_cliente'] ?? 0);
                $presupuesto = floatval($input['presupuesto_cotizado'] ?? 0);
                $ubicacion = $input['ubicacion_cliente'] ?? '';
                
                $stmt_ext->bind_param("iisd", 
                    $id_proyecto, 
                    $id_cliente, 
                    $ubicacion, 
                    $presupuesto
                );
                if (!$stmt_ext->execute()) {
                    throw new Exception('Error al crear detalles de proyecto externo: ' . $stmt_ext->error);
                }
                $stmt_ext->close();
            }
            
            if ($es_interno) {
                $stmt_int = $conn->prepare("INSERT INTO proyectos_internos 
                    (id_proyecto, id_departamento, area_solicitante, centro_costos) 
                    VALUES (?, ?, ?, ?)");
                
                $id_depto = intval($input['id_departamento'] ?? 0);
                $area = $input['area_solicitante'] ?? '';
                $centro = $input['centro_costos'] ?? '';
                
                $stmt_int->bind_param("iiss", 
                    $id_proyecto, 
                    $id_depto, 
                    $area, 
                    $centro
                );
                if (!$stmt_int->execute()) {
                    throw new Exception('Error al crear detalles de proyecto interno: ' . $stmt_int->error);
                }
                $stmt_int->close();
            }
            
            $conn->commit();
            
            // Obtener el proyecto recién creado con sus detalles
            $result = $conn->query("SELECT p.*, 
                pe.id_cliente, pe.ubicacion_cliente, pe.presupuesto_cotizado,
                pi.id_departamento, pi.area_solicitante, pi.centro_costos
                FROM proyectos_supervisados p
                LEFT JOIN proyectos_externos pe ON p.id_proyecto = pe.id_proyecto
                LEFT JOIN proyectos_internos pi ON p.id_proyecto = pi.id_proyecto
                WHERE p.id_proyecto = $id_proyecto");
            $proyecto = $result->fetch_assoc();
            
            Response::success($proyecto, 'Proyecto creado correctamente', 201);
            
        } catch (Exception $e) {
            $conn->rollback();
            file_put_contents('debug.log', "[" . date('Y-m-d H:i:s') . "] POST Error: " . $e->getMessage() . "\n", FILE_APPEND);
            Response::error($e->getMessage(), 500);
        }
        
    } elseif ($method === 'PUT') {
        // Actualizar proyecto
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id_proyecto'])) {
            Response::error('Se requiere id_proyecto', 400);
        }
        
        $id_proyecto = intval($input['id_proyecto']);
        $conn->begin_transaction();
        
        try {
            $updates = [];
            $types = '';
            $values = [];
            
            $fields = [
                'nombre_proyecto' => 's',
                'descripcion' => 's',
                'hora_ingreso' => 's',
                'hora_salida' => 's',
                'estado' => 's',
                'es_externo' => 'i',
                'es_interno' => 'i'
            ];
            
            foreach ($fields as $field => $type) {
                if (isset($input[$field])) {
                    $updates[] = "$field = ?";
                    $types .= $type;
                    $values[] = ($type === 'i') ? ($input[$field] ? 1 : 0) : $input[$field];
                }
            }
            
            if (!empty($updates)) {
                $sql = "UPDATE proyectos_supervisados SET " . implode(', ', $updates) . " WHERE id_proyecto = ?";
                $types .= 'i';
                $values[] = $id_proyecto;
                
                $stmt = $conn->prepare($sql);
                $stmt->bind_param($types, ...$values);
                if (!$stmt->execute()) {
                    throw new Exception('Error al actualizar proyecto base: ' . $stmt->error);
                }
                $stmt->close();
            }
            
            // Actualizar detalles según el tipo (pueden ser ambos)
            if (isset($input['es_externo']) && $input['es_externo']) {
                $stmt_ext = $conn->prepare("INSERT INTO proyectos_externos 
                    (id_proyecto, id_cliente, ubicacion_cliente, presupuesto_cotizado) 
                    VALUES (?, ?, ?, ?) 
                    ON DUPLICATE KEY UPDATE 
                    id_cliente = VALUES(id_cliente), 
                    ubicacion_cliente = VALUES(ubicacion_cliente), 
                    presupuesto_cotizado = VALUES(presupuesto_cotizado)");
                
                $id_cliente = intval($input['id_cliente'] ?? 0);
                $presupuesto = floatval($input['presupuesto_cotizado'] ?? 0);
                $ubicacion = $input['ubicacion_cliente'] ?? '';
                
                $stmt_ext->bind_param("iisd", 
                    $id_proyecto, 
                    $id_cliente, 
                    $ubicacion, 
                    $presupuesto
                );
                if (!$stmt_ext->execute()) {
                    throw new Exception('Error al actualizar detalles externos: ' . $stmt_ext->error);
                }
                $stmt_ext->close();
            } else {
                // Si ya no es externo o no se especificó como tal, borramos los detalles
                $conn->query("DELETE FROM proyectos_externos WHERE id_proyecto = $id_proyecto");
            }
            
            if (isset($input['es_interno']) && $input['es_interno']) {
                $stmt_int = $conn->prepare("INSERT INTO proyectos_internos 
                    (id_proyecto, id_departamento, area_solicitante, centro_costos) 
                    VALUES (?, ?, ?, ?) 
                    ON DUPLICATE KEY UPDATE 
                    id_departamento = VALUES(id_departamento), 
                    area_solicitante = VALUES(area_solicitante), 
                    centro_costos = VALUES(centro_costos)");
                
                $id_depto = intval($input['id_departamento'] ?? 0);
                $area = $input['area_solicitante'] ?? '';
                $centro = $input['centro_costos'] ?? '';
                
                $stmt_int->bind_param("iiss", 
                    $id_proyecto, 
                    $id_depto, 
                    $area, 
                    $centro
                );
                if (!$stmt_int->execute()) {
                    throw new Exception('Error al actualizar detalles internos: ' . $stmt_int->error);
                }
                $stmt_int->close();
            } else {
                // Si ya no es interno o no se especificó como tal, borramos los detalles
                $conn->query("DELETE FROM proyectos_internos WHERE id_proyecto = $id_proyecto");
            }
            
            $conn->commit();
            
            // Obtener el proyecto actualizado
            $result = $conn->query("SELECT p.*, 
                pe.id_cliente, pe.ubicacion_cliente, pe.presupuesto_cotizado,
                pi.id_departamento, pi.area_solicitante, pi.centro_costos
                FROM proyectos_supervisados p
                LEFT JOIN proyectos_externos pe ON p.id_proyecto = pe.id_proyecto
                LEFT JOIN proyectos_internos pi ON p.id_proyecto = pi.id_proyecto
                WHERE p.id_proyecto = $id_proyecto");
            $proyecto = $result->fetch_assoc();
            
            Response::success($proyecto, 'Proyecto actualizado correctamente', 200);
            
        } catch (Exception $e) {
            $conn->rollback();
            file_put_contents('debug.log', "[" . date('Y-m-d H:i:s') . "] PUT Error: " . $e->getMessage() . "\n", FILE_APPEND);
            Response::error($e->getMessage(), 500);
        }
        
    } elseif ($method === 'DELETE') {
        $id_proyecto = isset($_GET['id_proyecto']) ? intval($_GET['id_proyecto']) : null;
        
        if (!$id_proyecto) {
            Response::error('Se requiere id_proyecto', 400);
        }
        
        $stmt = $conn->prepare("DELETE FROM proyectos_supervisados WHERE id_proyecto = ?");
        $stmt->bind_param("i", $id_proyecto);
        
        if ($stmt->execute()) {
            Response::success(null, 'Proyecto eliminado correctamente', 200);
        } else {
            Response::error('Error al eliminar proyecto: ' . $stmt->error, 500);
        }
        
        $stmt->close();
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}
