<?php
// filepath: backend/api/prestamos_personal.php

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
        // Filtros para obtener préstamos
        $id_supervisor_prestamista = isset($_GET['id_supervisor_prestamista']) ? intval($_GET['id_supervisor_prestamista']) : null;
        $id_supervisor_prestatario = isset($_GET['id_supervisor_prestatario']) ? intval($_GET['id_supervisor_prestatario']) : null;
        $id_empleado = isset($_GET['id_empleado']) ? intval($_GET['id_empleado']) : null;
        $fecha = isset($_GET['fecha']) ? $_GET['fecha'] : null;
        $pendiente = isset($_GET['pendiente']) ? filter_var($_GET['pendiente'], FILTER_VALIDATE_BOOLEAN) : false;
        $estado_prestatario = isset($_GET['estado_prestatario']) ? $_GET['estado_prestatario'] : null;
        
        $sql = "SELECT 
                    pr.id_prestamo,
                    pr.id_empleado,
                    t.nombres,
                    t.apellidos,
                    CONCAT(t.nombres, ' ', t.apellidos) as nombre_empleado,
                    pr.id_supervisor_prestamista,
                    u1.nombre_completo as nombre_supervisor_prestamista,
                    pr.id_supervisor_prestatario,
                    u2.nombre_completo as nombre_supervisor_prestatario,
                    pr.id_proyecto_origen,
                    p1.nombre_proyecto as nombre_proyecto_origen,
                    pr.id_proyecto_destino,
                    p2.nombre_proyecto as nombre_proyecto_destino,
                    pr.id_ot_origen,
                    ot1.numero_ot as numero_ot_origen,
                    pr.id_ot_destino,
                    ot2.numero_ot as numero_ot_destino,
                    pr.fecha_prestamo,
                    pr.hora_fin_proyecto_origen,
                    pr.hora_inicio_proyecto_destino,
                    pr.estado_prestamista,
                    pr.estado_prestatario,
                    pr.tiempo_traslado_minutos,
                    pr.observaciones,
                    pr.fecha_creacion
                FROM prestamos_personal pr
                INNER JOIN trabajadores t ON pr.id_empleado = t.id_trabajador
                INNER JOIN usuarios u1 ON pr.id_supervisor_prestamista = u1.id_usuario
                INNER JOIN usuarios u2 ON pr.id_supervisor_prestatario = u2.id_usuario
                LEFT JOIN proyectos_supervisados p1 ON pr.id_proyecto_origen = p1.id_proyecto
                LEFT JOIN proyectos_supervisados p2 ON pr.id_proyecto_destino = p2.id_proyecto
                LEFT JOIN ordenes_trabajo ot1 ON pr.id_ot_origen = ot1.id_ot
                LEFT JOIN ordenes_trabajo ot2 ON pr.id_ot_destino = ot2.id_ot
                WHERE 1=1";
        
        if ($id_supervisor_prestamista) {
            $sql .= " AND pr.id_supervisor_prestamista = " . $id_supervisor_prestamista;
        }
        
        if ($id_supervisor_prestatario) {
            $sql .= " AND pr.id_supervisor_prestatario = " . $id_supervisor_prestatario;
        }
        
        if ($id_empleado) {
            $sql .= " AND pr.id_empleado = " . $id_empleado;
        }
        
        if ($fecha) {
            $sql .= " AND pr.fecha_prestamo = '" . $conn->real_escape_string($fecha) . "'";
        }
        
        if ($pendiente) {
            $sql .= " AND pr.estado_prestatario = 'PENDIENTE'";
        }
        
        if ($estado_prestatario) {
            $sql .= " AND pr.estado_prestatario = '" . $conn->real_escape_string($estado_prestatario) . "'";
        }
        
        $sql .= " ORDER BY pr.fecha_prestamo DESC, pr.fecha_creacion DESC";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            Response::error('Error en la consulta: ' . $conn->error, 400);
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        Response::success($data, 'Préstamos obtenidos correctamente', 200);
        
    } elseif ($method === 'POST') {
        // Crear nueva solicitud de préstamo
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id_empleado']) || !isset($input['id_supervisor_prestatario']) || 
            !isset($input['id_proyecto_destino']) || !isset($input['fecha_prestamo'])) {
            Response::error('Faltan campos requeridos', 400);
        }
        
        // Obtener id_supervisor_prestamista del contexto (debería venir del token/sesión)
        $id_supervisor_prestamista = $input['id_supervisor_prestamista'] ?? null;
        
        if (!$id_supervisor_prestamista) {
            Response::error('No se pudo identificar al supervisor prestamista', 401);
        }
        
        $stmt = $conn->prepare("INSERT INTO prestamos_personal 
            (id_empleado, id_supervisor_prestamista, id_supervisor_prestatario, 
             id_proyecto_origen, id_proyecto_destino, id_ot_origen, id_ot_destino, 
             fecha_prestamo, estado_prestamista, estado_prestatario, observaciones) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REPORTADO', 'PENDIENTE', ?)");
        
        $stmt->bind_param(
            "iiiiiiiss",
            $input['id_empleado'],
            $id_supervisor_prestamista,
            $input['id_supervisor_prestatario'],
            $input['id_proyecto_origen'],
            $input['id_proyecto_destino'],
            $input['id_ot_origen'],
            $input['id_ot_destino'],
            $input['fecha_prestamo'],
            $input['observaciones']
        );
        
        if ($stmt->execute()) {
            $id = $stmt->insert_id;
            
            // Obtener el préstamo recién creado
            $result = $conn->query("SELECT pr.*, 
                CONCAT(t.nombres, ' ', t.apellidos) as nombre_empleado,
                u1.nombre_completo as nombre_supervisor_prestamista,
                u2.nombre_completo as nombre_supervisor_prestatario,
                p1.nombre_proyecto as nombre_proyecto_origen,
                p2.nombre_proyecto as nombre_proyecto_destino
                FROM prestamos_personal pr
                INNER JOIN trabajadores t ON pr.id_empleado = t.id_trabajador
                INNER JOIN usuarios u1 ON pr.id_supervisor_prestamista = u1.id_usuario
                INNER JOIN usuarios u2 ON pr.id_supervisor_prestatario = u2.id_usuario
                LEFT JOIN proyectos_supervisados p1 ON pr.id_proyecto_origen = p1.id_proyecto
                LEFT JOIN proyectos_supervisados p2 ON pr.id_proyecto_destino = p2.id_proyecto
                WHERE pr.id_prestamo = $id");
            
            $prestamo = $result->fetch_assoc();
            
            Response::success($prestamo, 'Préstamo creado correctamente', 201);
        } else {
            Response::error('Error al crear préstamo: ' . $stmt->error, 500);
        }
        
        $stmt->close();
        
    } elseif ($method === 'PUT') {
        // Actualizar préstamo (confirmar fin o inicio)
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id_prestamo']) || !isset($input['accion'])) {
            Response::error('Se requiere id_prestamo y accion', 400);
        }
        
        $id_prestamo = intval($input['id_prestamo']);
        $accion = $input['accion'];
        
        if ($accion === 'CONFIRMAR_FIN') {
            // Supervisor prestamista confirma hora de fin en proyecto origen
            if (!isset($input['hora'])) {
                Response::error('Se requiere hora', 400);
            }
            
            $stmt = $conn->prepare("UPDATE prestamos_personal 
                SET hora_fin_proyecto_origen = ?, 
                    estado_prestamista = 'CONFIRMADO',
                    observaciones = CONCAT(COALESCE(observaciones, ''), '\n', ?)
                WHERE id_prestamo = ?");
            
            $observacion = $input['observaciones'] ?? 'Hora de fin confirmada por prestamista';
            
            $stmt->bind_param("ssi", $input['hora'], $observacion, $id_prestamo);
            
        } elseif ($accion === 'CONFIRMAR_INICIO') {
            // Supervisor prestatario confirma hora de inicio en proyecto destino
            if (!isset($input['hora'])) {
                Response::error('Se requiere hora', 400);
            }
            
            // Calcular tiempo de traslado
            $result = $conn->query("SELECT hora_fin_proyecto_origen FROM prestamos_personal WHERE id_prestamo = $id_prestamo");
            $prestamo = $result->fetch_assoc();
            
            $tiempo_traslado = 0;
            if ($prestamo && $prestamo['hora_fin_proyecto_origen']) {
                $hora_fin = new DateTime($prestamo['hora_fin_proyecto_origen']);
                $hora_inicio = new DateTime($input['hora']);
                $diff = $hora_inicio->getTimestamp() - $hora_fin->getTimestamp();
                $tiempo_traslado = round($diff / 60); // minutos
            }
            
            $stmt = $conn->prepare("UPDATE prestamos_personal 
                SET hora_inicio_proyecto_destino = ?, 
                    estado_prestatario = 'CONFIRMADO',
                    tiempo_traslado_minutos = ?,
                    observaciones = CONCAT(COALESCE(observaciones, ''), '\n', ?)
                WHERE id_prestamo = ?");
            
            $observacion = $input['observaciones'] ?? 'Hora de inicio confirmada por prestatario';
            
            $stmt->bind_param("sisi", $input['hora'], $tiempo_traslado, $observacion, $id_prestamo);
            
        } elseif ($accion === 'RECHAZAR') {
            // Prestatario rechaza el préstamo
            $stmt = $conn->prepare("UPDATE prestamos_personal 
                SET estado_prestatario = 'RECHAZADO',
                    observaciones = CONCAT(COALESCE(observaciones, ''), '\n', 'RECHAZADO: ', ?)
                WHERE id_prestamo = ?");
            
            $motivo = $input['observaciones'] ?? 'Sin motivo especificado';
            
            $stmt->bind_param("si", $motivo, $id_prestamo);
            
        } else {
            Response::error('Acción no válida', 400);
        }
        
        if ($stmt->execute()) {
            // Obtener el préstamo actualizado
            $result = $conn->query("SELECT pr.*, 
                CONCAT(t.nombres, ' ', t.apellidos) as nombre_empleado,
                u1.nombre_completo as nombre_supervisor_prestamista,
                u2.nombre_completo as nombre_supervisor_prestatario,
                p1.nombre_proyecto as nombre_proyecto_origen,
                p2.nombre_proyecto as nombre_proyecto_destino
                FROM prestamos_personal pr
                INNER JOIN trabajadores t ON pr.id_empleado = t.id_trabajador
                INNER JOIN usuarios u1 ON pr.id_supervisor_prestamista = u1.id_usuario
                INNER JOIN usuarios u2 ON pr.id_supervisor_prestatario = u2.id_usuario
                LEFT JOIN proyectos_supervisados p1 ON pr.id_proyecto_origen = p1.id_proyecto
                LEFT JOIN proyectos_supervisados p2 ON pr.id_proyecto_destino = p2.id_proyecto
                WHERE pr.id_prestamo = $id_prestamo");
            
            $prestamo = $result->fetch_assoc();
            
            Response::success($prestamo, 'Préstamo actualizado correctamente', 200);
        } else {
            Response::error('Error al actualizar préstamo: ' . $stmt->error, 500);
        }
        
        $stmt->close();
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}
