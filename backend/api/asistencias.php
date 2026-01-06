<?php
// filepath: backend/api/asistencias.php
// Comentario
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

try {
    if ($method === 'GET') {
        // Verificar si es consulta de entrada activa
        if (isset($_GET['verificar_entrada_activa']) && isset($_GET['id_usuario'])) {
            $id_usuario = intval($_GET['id_usuario']);
            $hoy = date('Y-m-d');
            
            // Buscar si el usuario tiene una entrada sin salida hoy
            // Maneja tanto personal operativo (con proyecto) como oficina (sin proyecto)
            $sql = "SELECT a.id_asistencia, a.id_proyecto, a.fecha_hora, p.nombre_proyecto, p.numero_ot
                    FROM asistencias_biometricas a
                    LEFT JOIN proyectos_supervisados p ON a.id_proyecto = p.id_proyecto
                    WHERE a.id_usuario = {$id_usuario}
                    AND DATE(a.fecha_hora) = '{$hoy}'
                    AND a.tipo_registro LIKE 'ENTRADA%'
                    AND NOT EXISTS (
                        SELECT 1 FROM asistencias_biometricas salida
                        WHERE salida.id_usuario = a.id_usuario
                        AND salida.tipo_registro LIKE 'SALIDA%'
                        AND DATE(salida.fecha_hora) = DATE(a.fecha_hora)
                        AND salida.fecha_hora > a.fecha_hora
                        AND (
                            (a.id_proyecto IS NULL AND salida.id_proyecto IS NULL)
                            OR (a.id_proyecto IS NOT NULL AND salida.id_proyecto = a.id_proyecto)
                        )
                    )
                    ORDER BY a.fecha_hora DESC
                    LIMIT 1";
            
            $result = $conn->query($sql);
            if ($result && $result->num_rows > 0) {
                $entrada = $result->fetch_assoc();
                Response::success([
                    'tiene_entrada_activa' => true,
                    'entrada' => $entrada
                ], 'Usuario tiene entrada activa', 200);
            } else {
                Response::success([
                    'tiene_entrada_activa' => false,
                    'entrada' => null
                ], 'Usuario no tiene entrada activa', 200);
            }
            exit;
        }
        
        // Obtener todas las asistencias con datos del usuario
        $sql = "SELECT 
                    a.id_asistencia,
                    a.id_usuario,
                    u.nombre_completo,
                    u.rol,
                    a.tipo_registro,
                    a.fecha_hora,
                    a.foto_base64,
                    a.score_facial,
                    a.latitud,
                    a.longitud,
                    a.precision_gps,
                    a.direccion,
                    a.dentro_radio,
                    a.user_agent,
                    a.ip_address,
                    a.id_ot,
                    a.observaciones,
                    a.fecha_creacion,
                    a.id_proyecto,
                    p.nombre_proyecto,
                    p.numero_ot,
                    p.descripcion as descripcion_proyecto,
                    a.tipo_registro_detectado,
                    a.minutos_diferencia
                FROM asistencias_biometricas a
                INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
                LEFT JOIN proyectos_supervisados p ON a.id_proyecto = p.id_proyecto
                ORDER BY a.fecha_hora DESC";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            Response::error('Error en la consulta: ' . $conn->error, 400);
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        Response::success($data, 'Asistencias obtenidas correctamente', 200);
        
    } elseif ($method === 'POST') {
        // Guardar nueva asistencia
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id_usuario']) || !isset($input['tipo_registro'])) {
            Response::error('Faltan campos requeridos', 400);
        }
        
        $id_usuario = intval($input['id_usuario']);
        $tipo_registro = $input['tipo_registro'];
        $hoy = date('Y-m-d');
        
        // Obtener id_proyecto del input (puede ser NULL para personal de oficina)
        $id_proyecto_entrada = isset($input['id_proyecto']) && $input['id_proyecto'] !== null ? intval($input['id_proyecto']) : null;
        
        // VALIDACIÓN: Si es ENTRADA con proyecto (personal operativo), verificar que no tenga otra entrada activa en OTRO proyecto
        // Esta validación NO aplica para personal de oficina (id_proyecto = NULL)
        if (strpos($tipo_registro, 'ENTRADA') !== false && $id_proyecto_entrada !== null) {
            $sql_check = "SELECT a.id_proyecto, p.nombre_proyecto
                          FROM asistencias_biometricas a
                          LEFT JOIN proyectos_supervisados p ON a.id_proyecto = p.id_proyecto
                          WHERE a.id_usuario = {$id_usuario}
                          AND DATE(a.fecha_hora) = '{$hoy}'
                          AND a.tipo_registro LIKE 'ENTRADA%'
                          AND a.id_proyecto IS NOT NULL
                          AND NOT EXISTS (
                              SELECT 1 FROM asistencias_biometricas salida
                              WHERE salida.id_usuario = a.id_usuario
                              AND salida.tipo_registro LIKE 'SALIDA%'
                              AND DATE(salida.fecha_hora) = DATE(a.fecha_hora)
                              AND salida.id_proyecto = a.id_proyecto
                              AND salida.fecha_hora > a.fecha_hora
                          )
                          LIMIT 1";
            
            $result_check = $conn->query($sql_check);
            if ($result_check && $result_check->num_rows > 0) {
                $entrada_activa = $result_check->fetch_assoc();
                $proyecto_activo = $entrada_activa['nombre_proyecto'] ?? 'otro proyecto';
                Response::error("Ya tienes una entrada activa en '{$proyecto_activo}'. Debes registrar tu SALIDA antes de entrar a otro proyecto.", 409);
            }
        }
        
        // Preparar valores con manejo correcto de NULL
        $id_proyecto = $id_proyecto_entrada;
        $tipo_registro_detectado = $input['tipo_registro_detectado'] ?? null;
        $minutos_diferencia = isset($input['minutos_diferencia']) && $input['minutos_diferencia'] !== null ? intval($input['minutos_diferencia']) : null;
        $id_prestamo = isset($input['id_prestamo']) && $input['id_prestamo'] !== null ? intval($input['id_prestamo']) : null;
        $id_ot = isset($input['id_ot']) && $input['id_ot'] !== null ? intval($input['id_ot']) : null;
        $observaciones = $input['observaciones'] ?? null;
        
        $stmt = $conn->prepare("INSERT INTO asistencias_biometricas 
            (id_usuario, tipo_registro, fecha_hora, foto_base64, score_facial, 
             latitud, longitud, precision_gps, direccion, dentro_radio, 
             user_agent, ip_address, id_ot, observaciones, id_proyecto, 
             tipo_registro_detectado, minutos_diferencia, id_prestamo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        if (!$stmt) {
            Response::error('Error preparando consulta: ' . $conn->error, 500);
        }
        
        $stmt->bind_param(
            "isssddddsissisisii",
            $input['id_usuario'],
            $input['tipo_registro'],
            $input['fecha_hora'],
            $input['foto_base64'],
            $input['score_facial'],
            $input['latitud'],
            $input['longitud'],
            $input['precision_gps'],
            $input['direccion'],
            $input['dentro_radio'],
            $input['user_agent'],
            $input['ip_address'],
            $id_ot,
            $observaciones,
            $id_proyecto,
            $tipo_registro_detectado,
            $minutos_diferencia,
            $id_prestamo
        );
        
        if ($stmt->execute()) {
            $id = $stmt->insert_id;
            Response::success(['id_asistencia' => $id], 'Asistencia registrada correctamente', 201);
        } else {
            Response::error('Error al guardar asistencia: ' . $stmt->error, 500);
        }
        
        $stmt->close();
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}
