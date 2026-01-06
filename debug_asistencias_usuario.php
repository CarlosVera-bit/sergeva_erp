<?php
// Script de debug para verificar asistencias de un usuario específico

// Configurar zona horaria para Ecuador
date_default_timezone_set('America/Guayaquil');

// Incluir la configuración de la base de datos
require_once 'backend/config/Database.php';

$db = new Database();
$conn = $db->connect();

if (!$conn) {
    die("Error de conexión: " . $db->getConnection()->connect_error);
}

echo "<h1>🔍 Debug de Asistencias - Sistema HR</h1>";
echo "<p><strong>Fecha y hora actual:</strong> " . date('Y-m-d H:i:s') . "</p>";

// 1. Verificar estructura de tabla de asistencias
echo "<h2>📋 Estructura de tabla asistencias_biometricas:</h2>";
$result = $conn->query("DESCRIBE asistencias_biometricas");
if ($result) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Clave</th><th>Predeterminado</th><th>Extra</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        foreach ($row as $value) {
            echo "<td>" . htmlspecialchars($value) . "</td>";
        }
        echo "</tr>";
    }
    echo "</table>";
}

// 2. Verificar estructura de tabla de proyectos
echo "<h2>📋 Estructura de tabla proyectos_supervisados:</h2>";
$result = $conn->query("DESCRIBE proyectos_supervisados");
if ($result) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Clave</th><th>Predeterminado</th><th>Extra</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        foreach ($row as $value) {
            echo "<td>" . htmlspecialchars($value) . "</td>";
        }
        echo "</tr>";
    }
    echo "</table>";
}

// 3. Verificar usuarios existentes
echo "<h2>👥 Usuarios en el sistema:</h2>";
$result = $conn->query("SELECT id_usuario, nombre_completo, email, rol FROM usuarios ORDER BY id_usuario");
if ($result) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['id_usuario'] . "</td>";
        echo "<td>" . htmlspecialchars($row['nombre_completo']) . "</td>";
        echo "<td>" . htmlspecialchars($row['email']) . "</td>";
        echo "<td>" . htmlspecialchars($row['rol']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
}

// 4. Verificar proyectos activos
echo "<h2>📊 Proyectos supervisados (ACTIVOS):</h2>";
$result = $conn->query("
    SELECT 
        p.id_proyecto,
        p.nombre_proyecto,
        p.numero_ot,
        p.estado,
        u.nombre_completo as supervisor,
        p.hora_ingreso,
        p.hora_salida,
        p.fecha_creacion
    FROM proyectos_supervisados p
    LEFT JOIN usuarios u ON p.id_supervisor = u.id_usuario
    WHERE p.estado = 'ACTIVO'
    ORDER BY p.id_proyecto
");

if ($result) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>ID Proyecto</th><th>Nombre</th><th>Número OT</th><th>Estado</th><th>Supervisor</th><th>Hora Ingreso</th><th>Hora Salida</th><th>Fecha Creación</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['id_proyecto'] . "</td>";
        echo "<td>" . htmlspecialchars($row['nombre_proyecto']) . "</td>";
        echo "<td>" . htmlspecialchars($row['numero_ot']) . "</td>";
        echo "<td>" . htmlspecialchars($row['estado']) . "</td>";
        echo "<td>" . htmlspecialchars($row['supervisor']) . "</td>";
        echo "<td>" . $row['hora_ingreso'] . "</td>";
        echo "<td>" . $row['hora_salida'] . "</td>";
        echo "<td>" . $row['fecha_creacion'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p style='color: red;'>❌ Error consultando proyectos: " . $conn->error . "</p>";
}

// 5. Verificar asistencias de HOY
echo "<h2>📅 Asistencias registradas HOY (" . date('Y-m-d') . "):</h2>";
$hoy = date('Y-m-d');
$result = $conn->query("
    SELECT 
        a.id_asistencia,
        a.id_usuario,
        u.nombre_completo,
        a.tipo_registro,
        a.fecha_hora,
        a.id_proyecto,
        p.nombre_proyecto,
        a.id_ot,
        ot.numero_ot,
        a.observaciones
    FROM asistencias_biometricas a
    LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
    LEFT JOIN proyectos_supervisados p ON a.id_proyecto = p.id_proyecto
    LEFT JOIN ordenes_trabajo ot ON a.id_ot = ot.id_ot
    WHERE DATE(a.fecha_hora) = '$hoy'
    ORDER BY a.fecha_hora DESC
");

if ($result) {
    if ($result->num_rows > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Usuario</th><th>Nombre</th><th>Tipo</th><th>Fecha/Hora</th><th>ID Proyecto</th><th>Proyecto</th><th>ID OT</th><th>Número OT</th><th>Observaciones</th></tr>";
        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id_asistencia'] . "</td>";
            echo "<td>" . $row['id_usuario'] . "</td>";
            echo "<td>" . htmlspecialchars($row['nombre_completo']) . "</td>";
            echo "<td style='color: " . (strpos($row['tipo_registro'], 'ENTRADA') !== false ? 'green' : 'red') . ";'>" . $row['tipo_registro'] . "</td>";
            echo "<td>" . $row['fecha_hora'] . "</td>";
            echo "<td>" . $row['id_proyecto'] . "</td>";
            echo "<td>" . htmlspecialchars($row['nombre_proyecto']) . "</td>";
            echo "<td>" . $row['id_ot'] . "</td>";
            echo "<td>" . htmlspecialchars($row['numero_ot']) . "</td>";
            echo "<td>" . htmlspecialchars($row['observaciones']) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color: orange;'>⚠️ No hay asistencias registradas hoy ($hoy)</p>";
    }
} else {
    echo "<p style='color: red;'>❌ Error consultando asistencias: " . $conn->error . "</p>";
}

// 6. Análisis de usuarios activos HOY
echo "<h2>📊 Análisis de usuarios activos HOY:</h2>";
$result = $conn->query("
    SELECT 
        u.id_usuario,
        u.nombre_completo,
        entrada.proyecto_entrada,
        entrada.fecha_entrada,
        salida.proyecto_salida,
        salida.fecha_salida,
        CASE 
            WHEN salida.fecha_salida IS NULL THEN 'ACTIVO'
            ELSE 'INACTIVO'
        END as estado_actual
    FROM usuarios u
    LEFT JOIN (
        SELECT DISTINCT
            a.id_usuario,
            a.id_proyecto as proyecto_entrada,
            a.fecha_hora as fecha_entrada,
            ROW_NUMBER() OVER (PARTITION BY a.id_usuario ORDER BY a.fecha_hora DESC) as rn
        FROM asistencias_biometricas a
        WHERE DATE(a.fecha_hora) = '$hoy'
        AND a.tipo_registro LIKE 'ENTRADA%'
    ) entrada ON u.id_usuario = entrada.id_usuario AND entrada.rn = 1
    LEFT JOIN (
        SELECT DISTINCT
            a.id_usuario,
            a.id_proyecto as proyecto_salida,
            a.fecha_hora as fecha_salida,
            ROW_NUMBER() OVER (PARTITION BY a.id_usuario ORDER BY a.fecha_hora DESC) as rn
        FROM asistencias_biometricas a
        WHERE DATE(a.fecha_hora) = '$hoy'
        AND a.tipo_registro LIKE 'SALIDA%'
    ) salida ON u.id_usuario = salida.id_usuario AND salida.rn = 1 AND salida.proyecto_salida = entrada.proyecto_entrada
    WHERE entrada.fecha_entrada IS NOT NULL
    ORDER BY u.nombre_completo
");

if ($result) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>ID Usuario</th><th>Nombre</th><th>Proyecto Entrada</th><th>Hora Entrada</th><th>Proyecto Salida</th><th>Hora Salida</th><th>Estado</th></tr>";
    $activos = 0;
    while ($row = $result->fetch_assoc()) {
        $color = $row['estado_actual'] === 'ACTIVO' ? 'background-color: #d4edda;' : '';
        if ($row['estado_actual'] === 'ACTIVO') $activos++;
        
        echo "<tr style='$color'>";
        echo "<td>" . $row['id_usuario'] . "</td>";
        echo "<td>" . htmlspecialchars($row['nombre_completo']) . "</td>";
        echo "<td>" . $row['proyecto_entrada'] . "</td>";
        echo "<td>" . $row['fecha_entrada'] . "</td>";
        echo "<td>" . $row['proyecto_salida'] . "</td>";
        echo "<td>" . $row['fecha_salida'] . "</td>";
        echo "<td style='font-weight: bold; color: " . ($row['estado_actual'] === 'ACTIVO' ? 'green' : 'red') . ";'>" . $row['estado_actual'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    echo "<p><strong>👥 Total de usuarios activos hoy: $activos</strong></p>";
}

// 7. Contar personal por proyecto HOY
echo "<h2>📊 Personal activo por proyecto HOY:</h2>";
$result = $conn->query("
    SELECT 
        COALESCE(p.nombre_proyecto, CONCAT('OT-', ot.numero_ot), 'Sin proyecto') as proyecto,
        p.id_proyecto,
        COUNT(DISTINCT entrada.id_usuario) as personal_con_entrada,
        COUNT(DISTINCT salida.id_usuario) as personal_con_salida,
        (COUNT(DISTINCT entrada.id_usuario) - COUNT(DISTINCT salida.id_usuario)) as personal_activo
    FROM (
        SELECT DISTINCT a.id_usuario, a.id_proyecto, a.id_ot
        FROM asistencias_biometricas a
        WHERE DATE(a.fecha_hora) = '$hoy'
        AND a.tipo_registro LIKE 'ENTRADA%'
    ) entrada
    LEFT JOIN proyectos_supervisados p ON entrada.id_proyecto = p.id_proyecto
    LEFT JOIN ordenes_trabajo ot ON entrada.id_ot = ot.id_ot
    LEFT JOIN (
        SELECT DISTINCT a.id_usuario, a.id_proyecto, a.id_ot
        FROM asistencias_biometricas a
        WHERE DATE(a.fecha_hora) = '$hoy'
        AND a.tipo_registro LIKE 'SALIDA%'
    ) salida ON entrada.id_usuario = salida.id_usuario 
        AND (entrada.id_proyecto = salida.id_proyecto OR entrada.id_ot = salida.id_ot)
    GROUP BY p.id_proyecto, p.nombre_proyecto, ot.numero_ot
    ORDER BY personal_activo DESC, p.nombre_proyecto
");

if ($result) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Proyecto</th><th>ID Proyecto</th><th>Con Entrada</th><th>Con Salida</th><th>Personal Activo</th></tr>";
    $total_activos = 0;
    while ($row = $result->fetch_assoc()) {
        $total_activos += $row['personal_activo'];
        echo "<tr>";
        echo "<td>" . htmlspecialchars($row['proyecto']) . "</td>";
        echo "<td>" . $row['id_proyecto'] . "</td>";
        echo "<td>" . $row['personal_con_entrada'] . "</td>";
        echo "<td>" . $row['personal_con_salida'] . "</td>";
        echo "<td style='font-weight: bold; color: green;'>" . $row['personal_activo'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    echo "<p><strong>🎯 Total general de personal activo: $total_activos</strong></p>";
}

// 8. Verificar la consulta específica del dashboard
echo "<h2>🔍 Simulando consulta del Dashboard (personal_asignado):</h2>";
$result = $conn->query("
    SELECT 
        p.id_proyecto,
        p.nombre_proyecto,
        p.estado,
        (SELECT COUNT(DISTINCT entrada.id_usuario)
         FROM asistencias_biometricas entrada
         WHERE entrada.id_proyecto = p.id_proyecto
           AND DATE(entrada.fecha_hora) = CURDATE()
           AND entrada.tipo_registro LIKE 'ENTRADA%'
           AND NOT EXISTS (
             SELECT 1 FROM asistencias_biometricas salida
             WHERE salida.id_usuario = entrada.id_usuario
               AND salida.id_proyecto = entrada.id_proyecto
               AND DATE(salida.fecha_hora) = CURDATE()
               AND salida.tipo_registro LIKE 'SALIDA%'
           )
        ) as personal_asignado
    FROM proyectos_supervisados p
    WHERE p.estado = 'ACTIVO'
    ORDER BY p.id_proyecto
");

if ($result) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>ID Proyecto</th><th>Nombre Proyecto</th><th>Estado</th><th>Personal Asignado</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['id_proyecto'] . "</td>";
        echo "<td>" . htmlspecialchars($row['nombre_proyecto']) . "</td>";
        echo "<td>" . htmlspecialchars($row['estado']) . "</td>";
        echo "<td style='font-weight: bold; color: " . ($row['personal_asignado'] > 0 ? 'green' : 'red') . ";'>" . $row['personal_asignado'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
}

$conn->close();
echo "<hr>";
echo "<p><em>Debug completado a las " . date('H:i:s') . "</em></p>";
?>