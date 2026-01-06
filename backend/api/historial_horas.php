<?php
// filepath: backend/api/historial_horas.php
// Endpoint para obtener el historial de horas trabajadas con detalle de trabajadores, fecha, horas y OT
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

try {
    // Parámetros opcionales para filtrar
    $fecha_inicio = isset($_GET['fecha_inicio']) ? $conn->real_escape_string($_GET['fecha_inicio']) : date('Y-m-d', strtotime('-30 days'));
    $fecha_fin = isset($_GET['fecha_fin']) ? $conn->real_escape_string($_GET['fecha_fin']) : date('Y-m-d');
    $id_usuario = isset($_GET['id_usuario']) ? intval($_GET['id_usuario']) : null;
    $id_proyecto = isset($_GET['id_proyecto']) ? intval($_GET['id_proyecto']) : null;
    
    // Consulta para obtener entradas con sus salidas correspondientes y calcular horas
    $sql = "SELECT 
                entrada.id_asistencia as id_entrada,
                entrada.id_usuario,
                u.nombre_completo as nombre_trabajador,
                t.nombres as trabajador_nombres,
                t.apellidos as trabajador_apellidos,
                t.cedula as trabajador_cedula,
                t.especialidad as trabajador_cargo,
                DATE(entrada.fecha_hora) as fecha,
                TIME(entrada.fecha_hora) as hora_entrada,
                (
                    SELECT TIME(s.fecha_hora)
                    FROM asistencias_biometricas s
                    WHERE s.id_usuario = entrada.id_usuario
                    AND s.tipo_registro LIKE 'SALIDA%'
                    AND DATE(s.fecha_hora) = DATE(entrada.fecha_hora)
                    AND s.id_proyecto = entrada.id_proyecto
                    AND s.fecha_hora > entrada.fecha_hora
                    ORDER BY s.fecha_hora ASC
                    LIMIT 1
                ) as hora_salida,
                (
                    SELECT TIMESTAMPDIFF(MINUTE, entrada.fecha_hora, s.fecha_hora)
                    FROM asistencias_biometricas s
                    WHERE s.id_usuario = entrada.id_usuario
                    AND s.tipo_registro LIKE 'SALIDA%'
                    AND DATE(s.fecha_hora) = DATE(entrada.fecha_hora)
                    AND s.id_proyecto = entrada.id_proyecto
                    AND s.fecha_hora > entrada.fecha_hora
                    ORDER BY s.fecha_hora ASC
                    LIMIT 1
                ) as minutos_trabajados,
                entrada.id_proyecto,
                p.nombre_proyecto,
                p.numero_ot,
                entrada.tipo_registro_detectado,
                entrada.observaciones,
                entrada.latitud,
                entrada.longitud,
                entrada.direccion,
                entrada.dentro_radio
            FROM asistencias_biometricas entrada
            INNER JOIN usuarios u ON entrada.id_usuario = u.id_usuario
            LEFT JOIN trabajadores t ON u.id_trabajador = t.id_trabajador
            LEFT JOIN proyectos_supervisados p ON entrada.id_proyecto = p.id_proyecto
            WHERE entrada.tipo_registro LIKE 'ENTRADA%'
            AND DATE(entrada.fecha_hora) BETWEEN '{$fecha_inicio}' AND '{$fecha_fin}'";
    
    // Agregar filtros opcionales
    if ($id_usuario) {
        $sql .= " AND entrada.id_usuario = {$id_usuario}";
    }
    
    if ($id_proyecto) {
        $sql .= " AND entrada.id_proyecto = {$id_proyecto}";
    }
    
    $sql .= " ORDER BY entrada.fecha_hora DESC";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        Response::error('Error en la consulta: ' . $conn->error, 400);
    }
    
    $registros = [];
    $resumen = [
        'total_registros' => 0,
        'total_horas' => 0,
        'total_minutos' => 0,
        'trabajadores_unicos' => [],
        'proyectos_unicos' => []
    ];
    
    while ($row = $result->fetch_assoc()) {
        // Calcular horas formateadas
        $horas_formateadas = '--:--';
        $minutos = intval($row['minutos_trabajados']);
        
        if ($minutos > 0) {
            $horas = floor($minutos / 60);
            $mins = $minutos % 60;
            $horas_formateadas = sprintf('%02d:%02d', $horas, $mins);
            $resumen['total_minutos'] += $minutos;
        }
        
        // Nombre del trabajador (priorizar datos de tabla trabajadores)
        $nombre_trabajador = $row['nombre_completo'];
        if (!empty($row['trabajador_nombres']) && !empty($row['trabajador_apellidos'])) {
            $nombre_trabajador = $row['trabajador_nombres'] . ' ' . $row['trabajador_apellidos'];
        }
        
        $registro = [
            'id_entrada' => intval($row['id_entrada']),
            'id_usuario' => intval($row['id_usuario']),
            'nombre_trabajador' => $nombre_trabajador,
            'cedula' => $row['trabajador_cedula'],
            'cargo' => $row['trabajador_cargo'],
            'fecha' => $row['fecha'],
            'hora_entrada' => $row['hora_entrada'],
            'hora_salida' => $row['hora_salida'],
            'minutos_trabajados' => $minutos,
            'horas_formateadas' => $horas_formateadas,
            'tiene_salida' => !empty($row['hora_salida']),
            'id_proyecto' => $row['id_proyecto'] ? intval($row['id_proyecto']) : null,
            'nombre_proyecto' => $row['nombre_proyecto'],
            'numero_ot' => $row['numero_ot'],
            'tipo_registro_detectado' => $row['tipo_registro_detectado'],
            'observaciones' => $row['observaciones'],
            'ubicacion' => [
                'latitud' => $row['latitud'],
                'longitud' => $row['longitud'],
                'direccion' => $row['direccion'],
                'dentro_radio' => $row['dentro_radio']
            ]
        ];
        
        $registros[] = $registro;
        
        // Actualizar resumen
        $resumen['total_registros']++;
        if (!in_array($row['id_usuario'], $resumen['trabajadores_unicos'])) {
            $resumen['trabajadores_unicos'][] = intval($row['id_usuario']);
        }
        if ($row['id_proyecto'] && !in_array($row['id_proyecto'], $resumen['proyectos_unicos'])) {
            $resumen['proyectos_unicos'][] = intval($row['id_proyecto']);
        }
    }
    
    // Calcular total de horas formateado
    $resumen['total_horas'] = floor($resumen['total_minutos'] / 60);
    $resumen['total_minutos_restantes'] = $resumen['total_minutos'] % 60;
    $resumen['total_horas_formateado'] = sprintf('%02d:%02d', 
        $resumen['total_horas'], 
        $resumen['total_minutos_restantes']
    );
    $resumen['cantidad_trabajadores'] = count($resumen['trabajadores_unicos']);
    $resumen['cantidad_proyectos'] = count($resumen['proyectos_unicos']);
    
    // Limpiar arrays internos que no necesitamos exponer
    unset($resumen['trabajadores_unicos']);
    unset($resumen['proyectos_unicos']);
    
    Response::success([
        'registros' => $registros,
        'resumen' => $resumen,
        'filtros' => [
            'fecha_inicio' => $fecha_inicio,
            'fecha_fin' => $fecha_fin
        ]
    ], 'Historial de horas obtenido correctamente', 200);
    
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
