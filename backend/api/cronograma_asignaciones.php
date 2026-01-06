<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Configurar zona horaria para Ecuador
date_default_timezone_set('America/Guayaquil');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/Database.php';
require_once '../config/Response.php';

$db = new Database();
$conn = $db->connect();
$method = $_SERVER['REQUEST_METHOD'];

function ensureCronogramaAsignacionesTable($conn): void {
    $checkResult = $conn->query("SHOW TABLES LIKE 'cronograma_asignaciones'");

    if (!$checkResult) {
        Response::error('Error verificando tabla cronograma_asignaciones: ' . $conn->error, 500);
    }

    if ($checkResult->num_rows === 0) {
        $createSql = "CREATE TABLE IF NOT EXISTS cronograma_asignaciones (\n            id_asignacion INT AUTO_INCREMENT PRIMARY KEY,\n            id_ot INT NOT NULL,\n            id_trabajador INT NOT NULL,\n            fecha_asignada DATE NOT NULL,\n            id_supervisor INT NOT NULL,\n            observaciones TEXT,\n            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n            fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n            estado ENUM('ACTIVA', 'CANCELADA', 'COMPLETADA') DEFAULT 'ACTIVA',\n            UNIQUE KEY unique_assignment (id_trabajador, fecha_asignada, id_ot),\n            INDEX idx_fecha_asignada (fecha_asignada),\n            INDEX idx_supervisor (id_supervisor),\n            INDEX idx_trabajador (id_trabajador),\n            INDEX idx_ot (id_ot),\n            CONSTRAINT fk_crono_ot FOREIGN KEY (id_ot) REFERENCES ordenes_trabajo(id_ot) ON DELETE CASCADE,\n            CONSTRAINT fk_crono_trabajador FOREIGN KEY (id_trabajador) REFERENCES trabajadores(id_trabajador) ON DELETE CASCADE,\n            CONSTRAINT fk_crono_supervisor FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE\n        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

        if (!$conn->query($createSql)) {
            Response::error('Error creando tabla cronograma_asignaciones: ' . $conn->error, 500);
        }
    }
}

ensureCronogramaAsignacionesTable($conn);

try {
    if ($method === 'GET') {
        // Obtener asignaciones por rango de fechas (TODAS, sin filtrar por supervisor)
        if (isset($_GET['fecha_inicio']) && isset($_GET['fecha_fin'])) {
            $fecha_inicio = $conn->real_escape_string($_GET['fecha_inicio']);
            $fecha_fin = $conn->real_escape_string($_GET['fecha_fin']);

            $sql = "SELECT 
                        ca.id_asignacion,
                        ca.id_ot,
                        ca.id_trabajador,
                        ca.fecha_asignada,
                        ca.id_supervisor,
                        ca.observaciones,
                        ca.estado,
                        ca.fecha_creacion,
                        ot.numero_ot,
                        c.nombre_razon_social as nombre_cliente,
                        ot.estado as estado_ot,
                        CONCAT(t.nombres, ' ', t.apellidos) as nombre_trabajador,
                        t.especialidad as cargo,
                        u.nombre_completo as nombre_supervisor
                    FROM cronograma_asignaciones ca
                    INNER JOIN ordenes_trabajo ot ON ca.id_ot = ot.id_ot
                    INNER JOIN clientes c ON ot.id_cliente = c.id_cliente
                    INNER JOIN trabajadores t ON ca.id_trabajador = t.id_trabajador
                    INNER JOIN usuarios u ON ca.id_supervisor = u.id_usuario
                    WHERE ca.fecha_asignada BETWEEN '{$fecha_inicio}' AND '{$fecha_fin}'
                    AND ca.estado = 'ACTIVA'
                    ORDER BY ca.fecha_asignada ASC, ot.numero_ot ASC";

            $result = $conn->query($sql);
            if (!$result) {
                Response::error('Error consultando asignaciones: ' . $conn->error, 500);
            }
            
            $asignaciones = [];
            while ($row = $result->fetch_assoc()) {
                $asignaciones[] = $row;
            }
            
            Response::success($asignaciones, 'Asignaciones obtenidas correctamente', 200);
        }
        // Verificar conflictos para un trabajador en una fecha
        else if (isset($_GET['verificar_conflicto'])) {
            $id_trabajador = intval($_GET['id_trabajador']);
            $fecha = $conn->real_escape_string($_GET['fecha']);

            $sql = "SELECT COUNT(*) as total 
                    FROM cronograma_asignaciones 
                    WHERE id_trabajador = {$id_trabajador}
                    AND fecha_asignada = '{$fecha}' 
                    AND estado = 'ACTIVA'";

            $result = $conn->query($sql);
            if (!$result) {
                Response::error('Error consultando conflicto: ' . $conn->error, 500);
            }
            $row = $result->fetch_assoc();
            
            Response::success([
                'tiene_conflicto' => $row['total'] > 0,
                'cantidad_asignaciones' => $row['total']
            ], 'Verificación completada', 200);
        }
        else {
            Response::error('Parámetros insuficientes', 400);
        }
        
    } else if ($method === 'POST') {
        // Crear nueva asignación
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id_ot']) || !isset($input['id_trabajador']) || 
            !isset($input['fecha_asignada']) || !isset($input['id_supervisor'])) {
            Response::error('Faltan campos requeridos', 400);
        }
        
        // Validar que la fecha no sea anterior a hoy (permitir el día actual)
        $fecha_asignada = $input['fecha_asignada'];
        $hoy = date('Y-m-d');
        $ayer = date('Y-m-d', strtotime('-1 day'));
        if ($fecha_asignada <= $ayer) {
            Response::error('No se puede asignar a fechas pasadas', 400);
        }
        
        $idTrabajadorCheck = intval($input['id_trabajador']);
        $idOtCheck = intval($input['id_ot']);
        $observaciones = $input['observaciones'] ?? null;
        
        // Verificar si el trabajador ya está ACTIVO en OTRA OT este día
        $sql_check_otra_ot = "SELECT ca.id_ot, ot.numero_ot 
                              FROM cronograma_asignaciones ca
                              INNER JOIN ordenes_trabajo ot ON ca.id_ot = ot.id_ot
                              WHERE ca.id_trabajador = {$idTrabajadorCheck}
                              AND ca.fecha_asignada = '{$fecha_asignada}' 
                              AND ca.estado = 'ACTIVA'
                              AND ca.id_ot != {$idOtCheck}";

        $result_check_otra = $conn->query($sql_check_otra_ot);
        if ($result_check_otra && $result_check_otra->num_rows > 0) {
            $row_otra = $result_check_otra->fetch_assoc();
            Response::error('El trabajador ya está asignado a otra OT (' . $row_otra['numero_ot'] . ') en esta fecha', 409);
        }
        
        // Verificar si ya está ACTIVO en ESTA misma OT
        $sql_check_misma = "SELECT id_asignacion FROM cronograma_asignaciones 
                           WHERE id_trabajador = {$idTrabajadorCheck}
                           AND id_ot = {$idOtCheck}
                           AND fecha_asignada = '{$fecha_asignada}' 
                           AND estado = 'ACTIVA'";
        $result_misma = $conn->query($sql_check_misma);
        if ($result_misma && $result_misma->num_rows > 0) {
            Response::error('El trabajador ya está asignado a esta OT en esta fecha', 409);
        }
        
        // Verificar si existe un registro CANCELADO para reactivarlo
        $sql_check_cancelado = "SELECT id_asignacion FROM cronograma_asignaciones 
                                WHERE id_trabajador = {$idTrabajadorCheck}
                                AND id_ot = {$idOtCheck}
                                AND fecha_asignada = '{$fecha_asignada}' 
                                AND estado = 'CANCELADA'";
        $result_cancelado = $conn->query($sql_check_cancelado);
        
        if ($result_cancelado && $result_cancelado->num_rows > 0) {
            // Reactivar el registro cancelado
            $row_cancelado = $result_cancelado->fetch_assoc();
            $id_reactivar = $row_cancelado['id_asignacion'];
            
            $sql_reactivar = "UPDATE cronograma_asignaciones 
                              SET estado = 'ACTIVA', 
                                  id_supervisor = ?, 
                                  observaciones = ?,
                                  fecha_modificacion = NOW()
                              WHERE id_asignacion = ?";
            $stmt_reactivar = $conn->prepare($sql_reactivar);
            $stmt_reactivar->bind_param('isi', $input['id_supervisor'], $observaciones, $id_reactivar);
            
            if ($stmt_reactivar->execute()) {
                Response::success([
                    'id_asignacion' => $id_reactivar,
                    'reactivado' => true
                ], 'Asignación reactivada correctamente', 200);
            } else {
                Response::error('Error al reactivar asignación: ' . $stmt_reactivar->error, 500);
            }
        } else {
            // Crear nueva asignación
            $sql = "INSERT INTO cronograma_asignaciones 
                    (id_ot, id_trabajador, fecha_asignada, id_supervisor, observaciones, estado) 
                    VALUES (?, ?, ?, ?, ?, 'ACTIVA')";
            
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                Response::error('Error preparando inserción de asignación: ' . $conn->error, 500);
            }
            $stmt->bind_param('iisis', 
                $input['id_ot'], 
                $input['id_trabajador'], 
                $fecha_asignada, 
                $input['id_supervisor'], 
                $observaciones
            );
            
            if ($stmt->execute()) {
                Response::success([
                    'id_asignacion' => $stmt->insert_id
                ], 'Asignación creada correctamente', 201);
            } else {
                Response::error('Error al crear asignación: ' . $stmt->error, 500);
            }
        }
        
    } else if ($method === 'DELETE') {
        // Eliminar asignación
        if (isset($_GET['id_asignacion'])) {
            $id_asignacion = intval($_GET['id_asignacion']);
            
            $sql = "UPDATE cronograma_asignaciones 
                    SET estado = 'CANCELADA' 
                    WHERE id_asignacion = ?";
            
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                Response::error('Error preparando eliminación de asignación: ' . $conn->error, 500);
            }
            $stmt->bind_param('i', $id_asignacion);
            
            if ($stmt->execute()) {
                Response::success([], 'Asignación eliminada correctamente', 200);
            } else {
                Response::error('Error al eliminar asignación', 500);
            }
        } else {
            Response::error('ID de asignación requerido', 400);
        }
    }
    
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}
