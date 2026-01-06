<?php
// filepath: backend/api/dashboard.php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
$action = $_GET['action'] ?? '';

// Obtener filtros
$fecha_inicio = $_GET['fecha_inicio'] ?? date('Y-m-01');
$fecha_fin = $_GET['fecha_fin'] ?? date('Y-m-d');
$periodo = $_GET['periodo'] ?? 'mes';
$proyecto_id = isset($_GET['proyecto_id']) ? (int)$_GET['proyecto_id'] : null;
$personal_id = isset($_GET['personal_id']) ? (int)$_GET['personal_id'] : null;
$supervisor_id = isset($_GET['supervisor_id']) ? (int)$_GET['supervisor_id'] : null;
$cliente_id = isset($_GET['cliente_id']) ? (int)$_GET['cliente_id'] : null;

try {
    if ($method === 'GET') {
        switch ($action) {
            case 'kpis':
                // Calcular KPIs principales
                $kpis = calcularKPIs($conn, $fecha_inicio, $fecha_fin, $proyecto_id, $personal_id, $supervisor_id, $cliente_id);
                Response::success($kpis, 'KPIs obtenidos correctamente');
                break;

            case 'estado_ot':
                $data = getEstadoOT($conn, $fecha_inicio, $fecha_fin, $proyecto_id, $cliente_id);
                Response::success($data, 'Estado de OT obtenido');
                break;

            case 'personal_especialidad':
                $data = getPersonalEspecialidad($conn, $fecha_inicio, $fecha_fin);
                Response::success($data, 'Personal por especialidad obtenido');
                break;

            case 'consumo_materiales':
                $data = getConsumoMateriales($conn, $fecha_inicio, $fecha_fin, $proyecto_id);
                Response::success($data, 'Consumo de materiales obtenido');
                break;

            case 'asistencia_general':
                $data = getAsistenciaGeneral($conn, $fecha_inicio, $fecha_fin);
                Response::success($data, 'Asistencia general obtenida');
                break;

            case 'progreso_proyectos':
                $data = getProgresoProyectos($conn, $fecha_inicio, $fecha_fin);
                Response::success($data, 'Progreso de proyectos obtenido');
                break;

            case 'horas_proyecto':
                $data = getHorasProyecto($conn, $fecha_inicio, $fecha_fin, $proyecto_id);
                Response::success($data, 'Horas por proyecto obtenidas');
                break;

            case 'horas_personal':
                $data = getHorasPersonal($conn, $fecha_inicio, $fecha_fin, $personal_id);
                Response::success($data, 'Horas por personal obtenidas');
                break;

            case 'asistencia_semanal':
                $data = getAsistenciaSemanal($conn, $fecha_inicio, $fecha_fin);
                Response::success($data, 'Asistencia semanal obtenida');
                break;

            case 'valoracion_ot':
                $data = getValoracionOT($conn, $fecha_inicio, $fecha_fin, $proyecto_id);
                Response::success($data, 'Valoración OT obtenida');
                break;

            case 'ot_completadas_mes':
                $data = getOTCompletadasMes($conn, $fecha_inicio, $fecha_fin);
                Response::success($data, 'OT completadas por mes obtenidas');
                break;

            case 'stock_materiales':
                $data = getStockMateriales($conn);
                Response::success($data, 'Stock de materiales obtenido');
                break;

            case 'tabla_proyectos':
                $data = getTablaProyectos($conn, $fecha_inicio, $fecha_fin);
                Response::success($data, 'Tabla de proyectos obtenida');
                break;

            case 'tabla_personal':
                $data = getTablaPersonal($conn, $fecha_inicio, $fecha_fin);
                Response::success($data, 'Tabla de personal obtenida');
                break;

            default:
                Response::error('Acción no válida', 400);
        }
    } else {
        Response::error('Método no permitido', 405);
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}

// ==================== FUNCIONES ====================

function calcularKPIs($conn, $fecha_inicio, $fecha_fin, $proyecto_id, $personal_id, $supervisor_id, $cliente_id) {
    $where_clauses = ["fecha_inicio BETWEEN '$fecha_inicio' AND '$fecha_fin'"];
    
    if ($proyecto_id) $where_clauses[] = "id_ot = $proyecto_id";
    if ($supervisor_id) $where_clauses[] = "id_supervisor = $supervisor_id";
    if ($cliente_id) $where_clauses[] = "id_cliente = $cliente_id";
    
    $where = implode(' AND ', $where_clauses);
    
    // Total de OT
    $sqlTotalOT = "SELECT COUNT(*) as total FROM ordenes_trabajo WHERE $where AND deleted_at IS NULL";
    $resultTotal = $conn->query($sqlTotalOT);
    $totalOT = $resultTotal->fetch_assoc()['total'];
    
    // Ingresos totales (suma de cotizaciones aprobadas)
    $sqlIngresos = "SELECT COALESCE(SUM(total), 0) as ingresos FROM cotizaciones 
                    WHERE estado = 'aprobada' 
                    AND fecha_cotizacion BETWEEN '$fecha_inicio' AND '$fecha_fin'
                    AND deleted_at IS NULL";
    $resultIngresos = $conn->query($sqlIngresos);
    $ingresosTotal = $resultIngresos->fetch_assoc()['ingresos'];
    
    // Horas totales trabajadas
    $sqlHoras = "SELECT COALESCE(SUM(horas_trabajadas), 0) as horas 
                 FROM registro_horas 
                 WHERE fecha BETWEEN '$fecha_inicio' AND '$fecha_fin'";
    $resultHoras = $conn->query($sqlHoras);
    $horasTotales = $resultHoras->fetch_assoc()['horas'];
    
    // Tasa de asistencia
    $sqlAsistencia = "SELECT 
                      COUNT(*) as total,
                      SUM(CASE WHEN estado = 'asistido' THEN 1 ELSE 0 END) as asistidos
                      FROM asistencias_biometricas 
                      WHERE fecha BETWEEN '$fecha_inicio' AND '$fecha_fin'";
    $resultAsist = $conn->query($sqlAsistencia);
    $asist = $resultAsist->fetch_assoc();
    $tasaAsistencia = $asist['total'] > 0 ? ($asist['asistidos'] / $asist['total']) * 100 : 0;
    
    // Proyectos completados a tiempo
    $sqlProyectos = "SELECT 
                     COUNT(*) as total,
                     SUM(CASE WHEN estado = 'completada' AND fecha_fin <= fecha_fin_estimada THEN 1 ELSE 0 END) as a_tiempo
                     FROM ordenes_trabajo 
                     WHERE $where AND deleted_at IS NULL";
    $resultProy = $conn->query($sqlProyectos);
    $proy = $resultProy->fetch_assoc();
    $proyectosATiempo = $proy['total'] > 0 ? ($proy['a_tiempo'] / $proy['total']) * 100 : 0;
    
    // Desviación de costos (simplificado)
    $desviacionCostos = -5.3; // Placeholder
    
    return [
        'totalOT' => (int)$totalOT,
        'ingresosTotal' => (float)$ingresosTotal,
        'horasTotales' => (float)$horasTotales,
        'tasaAsistencia' => round($tasaAsistencia, 2),
        'proyectosATiempo' => round($proyectosATiempo, 2),
        'desviacionCostos' => $desviacionCostos
    ];
}

function getEstadoOT($conn, $fecha_inicio, $fecha_fin, $proyecto_id, $cliente_id) {
    $where = ["fecha_inicio BETWEEN '$fecha_inicio' AND '$fecha_fin'", "deleted_at IS NULL"];
    if ($proyecto_id) $where[] = "id_ot = $proyecto_id";
    if ($cliente_id) $where[] = "id_cliente = $cliente_id";
    
    $sql = "SELECT estado, COUNT(*) as cantidad 
            FROM ordenes_trabajo 
            WHERE " . implode(' AND ', $where) . "
            GROUP BY estado";
    
    $result = $conn->query($sql);
    $labels = [];
    $data = [];
    
    while ($row = $result->fetch_assoc()) {
        $labels[] = ucfirst($row['estado']);
        $data[] = (int)$row['cantidad'];
    }
    
    return [
        'labels' => $labels,
        'datasets' => [
            [
                'label' => 'Órdenes de Trabajo',
                'data' => $data,
                'backgroundColor' => [
                    '#3B82F6', // Azul - En progreso
                    '#10B981', // Verde - Completada
                    '#F59E0B', // Amarillo - Pendiente
                    '#EF4444', // Rojo - Pausada/Cancelada
                    '#6B7280'  // Gris
                ]
            ]
        ]
    ];
}

function getPersonalEspecialidad($conn, $fecha_inicio, $fecha_fin) {
    $sql = "SELECT especialidad, COUNT(*) as cantidad 
            FROM trabajadores 
            WHERE activo = 1
            GROUP BY especialidad";
    
    $result = $conn->query($sql);
    $labels = [];
    $data = [];
    
    while ($row = $result->fetch_assoc()) {
        $labels[] = $row['especialidad'];
        $data[] = (int)$row['cantidad'];
    }
    
    return [
        'labels' => $labels,
        'datasets' => [
            [
                'label' => 'Personal',
                'data' => $data,
                'backgroundColor' => [
                    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
                ]
            ]
        ]
    ];
}

function getConsumoMateriales($conn, $fecha_inicio, $fecha_fin, $proyecto_id) {
    // Datos de ejemplo - adaptar según tu estructura de BD
    return [
        'labels' => ['Proyecto A', 'Proyecto B', 'Proyecto C', 'Proyecto D', 'Proyecto E'],
        'datasets' => [
            [
                'label' => 'Consumo ($)',
                'data' => [1250, 2340, 890, 1560, 3200],
                'backgroundColor' => ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
            ]
        ]
    ];
}

function getAsistenciaGeneral($conn, $fecha_inicio, $fecha_fin) {
    $sql = "SELECT 
            SUM(CASE WHEN estado = 'asistido' THEN 1 ELSE 0 END) as asistidos,
            SUM(CASE WHEN estado = 'ausente' THEN 1 ELSE 0 END) as ausentes,
            SUM(CASE WHEN estado = 'permiso' THEN 1 ELSE 0 END) as permisos,
            SUM(CASE WHEN estado = 'incapacidad' THEN 1 ELSE 0 END) as incapacidades
            FROM asistencias_biometricas
            WHERE fecha BETWEEN '$fecha_inicio' AND '$fecha_fin'";
    
    $result = $conn->query($sql);
    $row = $result->fetch_assoc();
    
    return [
        'labels' => ['Asistidos', 'Ausentes', 'Permisos', 'Incapacidades'],
        'datasets' => [
            [
                'label' => 'Asistencia',
                'data' => [
                    (int)$row['asistidos'], 
                    (int)$row['ausentes'], 
                    (int)$row['permisos'], 
                    (int)$row['incapacidades']
                ],
                'backgroundColor' => ['#10B981', '#EF4444', '#F59E0B', '#6B7280']
            ]
        ]
    ];
}

function getProgresoProyectos($conn, $fecha_inicio, $fecha_fin) {
    // Datos de ejemplo
    return [
        'labels' => ['Proyecto Alpha', 'Proyecto Beta', 'Proyecto Gamma', 'Proyecto Delta'],
        'datasets' => [
            [
                'label' => '% Completado',
                'data' => [85, 65, 95, 40],
                'backgroundColor' => '#3B82F6'
            ]
        ]
    ];
}

function getHorasProyecto($conn, $fecha_inicio, $fecha_fin, $proyecto_id) {
    return [
        'labels' => ['Proyecto A', 'Proyecto B', 'Proyecto C', 'Proyecto D'],
        'datasets' => [
            [
                'label' => 'Horas Presupuestadas',
                'data' => [120, 150, 90, 200],
                'backgroundColor' => '#94A3B8'
            ],
            [
                'label' => 'Horas Reales',
                'data' => [135, 142, 105, 180],
                'backgroundColor' => '#3B82F6'
            ]
        ]
    ];
}

function getHorasPersonal($conn, $fecha_inicio, $fecha_fin, $personal_id) {
    $sql = "SELECT t.nombre, t.apellido, COALESCE(SUM(rh.horas_trabajadas), 0) as horas
            FROM trabajadores t
            LEFT JOIN registro_horas rh ON t.id_trabajador = rh.id_trabajador 
            AND rh.fecha BETWEEN '$fecha_inicio' AND '$fecha_fin'
            WHERE t.activo = 1
            GROUP BY t.id_trabajador
            ORDER BY horas DESC
            LIMIT 10";
    
    $result = $conn->query($sql);
    $labels = [];
    $data = [];
    
    while ($row = $result->fetch_assoc()) {
        $labels[] = $row['nombre'] . ' ' . $row['apellido'];
        $data[] = (float)$row['horas'];
    }
    
    return [
        'labels' => $labels,
        'datasets' => [
            [
                'label' => 'Horas Trabajadas',
                'data' => $data,
                'backgroundColor' => '#10B981'
            ]
        ]
    ];
}

function getAsistenciaSemanal($conn, $fecha_inicio, $fecha_fin) {
    return [
        'labels' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        'datasets' => [
            [
                'label' => 'Asistencias',
                'data' => [42, 45, 43, 44, 40],
                'backgroundColor' => '#10B981'
            ]
        ]
    ];
}

function getValoracionOT($conn, $fecha_inicio, $fecha_fin, $proyecto_id) {
    return [
        'labels' => ['OT-001', 'OT-002', 'OT-003', 'OT-004', 'OT-005'],
        'datasets' => [
            [
                'label' => 'Presupuestado',
                'data' => [5000, 7500, 3200, 9800, 6500],
                'backgroundColor' => '#94A3B8'
            ],
            [
                'label' => 'Real',
                'data' => [5200, 7100, 3500, 9500, 6800],
                'backgroundColor' => '#3B82F6'
            ]
        ]
    ];
}

function getOTCompletadasMes($conn, $fecha_inicio, $fecha_fin) {
    $sql = "SELECT DATE_FORMAT(fecha_fin, '%Y-%m') as mes, COUNT(*) as cantidad
            FROM ordenes_trabajo
            WHERE estado = 'completada' 
            AND fecha_fin BETWEEN DATE_SUB('$fecha_fin', INTERVAL 6 MONTH) AND '$fecha_fin'
            AND deleted_at IS NULL
            GROUP BY mes
            ORDER BY mes";
    
    $result = $conn->query($sql);
    $labels = [];
    $data = [];
    
    while ($row = $result->fetch_assoc()) {
        $labels[] = $row['mes'];
        $data[] = (int)$row['cantidad'];
    }
    
    return [
        'labels' => $labels,
        'datasets' => [
            [
                'label' => 'OT Completadas',
                'data' => $data,
                'backgroundColor' => '#10B981'
            ]
        ]
    ];
}

function getStockMateriales($conn) {
    $sql = "SELECT nombre_producto, stock_actual, stock_minimo
            FROM inventario
            WHERE stock_actual <= stock_minimo * 1.2
            ORDER BY (stock_actual / stock_minimo) ASC
            LIMIT 10";
    
    $result = $conn->query($sql);
    $labels = [];
    $data = [];
    
    while ($row = $result->fetch_assoc()) {
        $labels[] = $row['nombre_producto'];
        $data[] = (int)$row['stock_actual'];
    }
    
    return [
        'labels' => $labels,
        'datasets' => [
            [
                'label' => 'Stock Actual',
                'data' => $data,
                'backgroundColor' => '#EF4444'
            ]
        ]
    ];
}

function getTablaProyectos($conn, $fecha_inicio, $fecha_fin) {
    // Datos de ejemplo - adaptar según tu estructura
    return [
        [
            'proyecto' => 'Instalación Eléctrica Plaza Mayor',
            'estado' => 'En Progreso',
            'avance' => 75,
            'personalAsignado' => 8,
            'horas' => 320,
            'costoReal' => 15200,
            'presupuesto' => 15000,
            'variacion' => 1.3
        ],
        [
            'proyecto' => 'Mantenimiento Sistema HVAC',
            'estado' => 'Completada',
            'avance' => 100,
            'personalAsignado' => 5,
            'horas' => 180,
            'costoReal' => 8900,
            'presupuesto' => 9500,
            'variacion' => -6.3
        ]
    ];
}

function getTablaPersonal($conn, $fecha_inicio, $fecha_fin) {
    $sql = "
        SELECT 
            u.id_usuario,
            u.nombre_completo as empleado,
            COALESCE(u.especialidad, u.rol) as especialidad,
            
            -- Calcular horas del mes
            COALESCE(horas_mes.total_horas, 0) as horasMes,
            
            -- Contar proyectos únicos donde ha trabajado
            COALESCE(proyectos_count.total_proyectos, 0) as proyectos,
            
            -- Calcular tasa de asistencia (días con entrada vs días laborables)
            COALESCE(asistencia.tasa_asistencia, 0) as asistencia,
            
            -- Promedio de horas por día
            COALESCE(horas_mes.promedio_horas, 0) as promedioHoras,
            
            -- Estado actual (si tiene entrada hoy sin salida = activo)
            CASE 
                WHEN activo_hoy.id_usuario IS NOT NULL THEN 'activo'
                WHEN entrada_hoy.id_usuario IS NOT NULL THEN 'inactivo' 
                ELSE 'ausente'
            END as estado
            
        FROM usuarios u
        
        -- Calcular horas trabajadas en el período
        LEFT JOIN (
            SELECT 
                entrada.id_usuario,
                COUNT(*) * 8 as total_horas, -- Asumiendo 8 horas por día de trabajo
                ROUND(COUNT(*) * 8 / NULLIF(DATEDIFF('$fecha_fin', '$fecha_inicio'), 0), 1) as promedio_horas
            FROM (
                SELECT DISTINCT id_usuario, DATE(fecha_hora) as fecha
                FROM asistencias_biometricas 
                WHERE DATE(fecha_hora) BETWEEN '$fecha_inicio' AND '$fecha_fin'
                AND tipo_registro LIKE 'ENTRADA%'
            ) entrada
            GROUP BY entrada.id_usuario
        ) horas_mes ON u.id_usuario = horas_mes.id_usuario
        
        -- Contar proyectos únicos
        LEFT JOIN (
            SELECT 
                id_usuario,
                COUNT(DISTINCT COALESCE(id_proyecto, id_ot)) as total_proyectos
            FROM asistencias_biometricas
            WHERE DATE(fecha_hora) BETWEEN '$fecha_inicio' AND '$fecha_fin'
            AND (id_proyecto IS NOT NULL OR id_ot IS NOT NULL)
            GROUP BY id_usuario
        ) proyectos_count ON u.id_usuario = proyectos_count.id_usuario
        
        -- Calcular tasa de asistencia
        LEFT JOIN (
            SELECT 
                id_usuario,
                ROUND(
                    (COUNT(DISTINCT DATE(fecha_hora)) * 100.0) / 
                    NULLIF(DATEDIFF('$fecha_fin', '$fecha_inicio') + 1, 0), 
                    1
                ) as tasa_asistencia
            FROM asistencias_biometricas
            WHERE DATE(fecha_hora) BETWEEN '$fecha_inicio' AND '$fecha_fin'
            AND tipo_registro LIKE 'ENTRADA%'
            GROUP BY id_usuario
        ) asistencia ON u.id_usuario = asistencia.id_usuario
        
        -- Verificar si tiene entrada hoy
        LEFT JOIN (
            SELECT DISTINCT id_usuario
            FROM asistencias_biometricas
            WHERE DATE(fecha_hora) = CURDATE()
            AND tipo_registro LIKE 'ENTRADA%'
        ) entrada_hoy ON u.id_usuario = entrada_hoy.id_usuario
        
        -- Verificar si está activo hoy (entrada sin salida)
        LEFT JOIN (
            SELECT DISTINCT e.id_usuario
            FROM asistencias_biometricas e
            WHERE DATE(e.fecha_hora) = CURDATE()
            AND e.tipo_registro LIKE 'ENTRADA%'
            AND NOT EXISTS (
                SELECT 1 FROM asistencias_biometricas s
                WHERE s.id_usuario = e.id_usuario
                AND DATE(s.fecha_hora) = CURDATE()
                AND s.tipo_registro LIKE 'SALIDA%'
                AND s.fecha_hora > e.fecha_hora
            )
        ) activo_hoy ON u.id_usuario = activo_hoy.id_usuario
        
        WHERE u.rol IN ('empleado', 'supervisor', 'tecnico')
        ORDER BY u.nombre_completo
    ";
    
    $result = $conn->query($sql);
    $data = [];
    
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $data[] = [
                'empleado' => $row['empleado'],
                'especialidad' => $row['especialidad'],
                'horas_trabajadas' => (int)$row['horasMes'],
                'proyectos_asignados' => (int)$row['proyectos'],
                'tasa_asistencia' => (float)$row['asistencia'],
                'promedio_horas' => (float)$row['promedioHoras'],
                'estado' => $row['estado']
            ];
        }
    }
    
    return $data;
}
