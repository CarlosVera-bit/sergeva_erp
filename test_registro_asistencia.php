<?php
// Script para insertar una asistencia de prueba y verificar el sistema

// Configurar zona horaria para Ecuador
date_default_timezone_set('America/Guayaquil');

// Incluir la configuración de la base de datos
require_once 'backend/config/Database.php';

$db = new Database();
$conn = $db->connect();

if (!$conn) {
    die("Error de conexión: " . $db->getConnection()->connect_error);
}

echo "<h1>🧪 Script de Prueba - Registro de Asistencia</h1>";
echo "<p><strong>Fecha y hora actual:</strong> " . date('Y-m-d H:i:s') . "</p>";

// Obtener el primer usuario disponible
$result = $conn->query("SELECT id_usuario, nombre_completo FROM usuarios WHERE rol IN ('empleado', 'supervisor', 'tecnico') LIMIT 1");
if (!$result || $result->num_rows === 0) {
    echo "<p style='color: red;'>❌ No hay usuarios disponibles para la prueba</p>";
    exit;
}

$usuario = $result->fetch_assoc();
echo "<h2>👤 Usuario para la prueba:</h2>";
echo "<p><strong>ID:</strong> " . $usuario['id_usuario'] . "</p>";
echo "<p><strong>Nombre:</strong> " . htmlspecialchars($usuario['nombre_completo']) . "</p>";

// Obtener el primer proyecto activo
$result = $conn->query("SELECT id_proyecto, nombre_proyecto FROM proyectos_supervisados WHERE estado = 'ACTIVO' LIMIT 1");
if (!$result || $result->num_rows === 0) {
    echo "<p style='color: red;'>❌ No hay proyectos activos disponibles para la prueba</p>";
    exit;
}

$proyecto = $result->fetch_assoc();
echo "<h2>📊 Proyecto para la prueba:</h2>";
echo "<p><strong>ID:</strong> " . $proyecto['id_proyecto'] . "</p>";
echo "<p><strong>Nombre:</strong> " . htmlspecialchars($proyecto['nombre_proyecto']) . "</p>";

// Verificar si el usuario ya tiene una entrada hoy sin salida
$hoy = date('Y-m-d');
$id_usuario = $usuario['id_usuario'];
$id_proyecto = $proyecto['id_proyecto'];

$check_sql = "SELECT id_asistencia, tipo_registro, fecha_hora 
              FROM asistencias_biometricas 
              WHERE id_usuario = $id_usuario 
              AND DATE(fecha_hora) = '$hoy'
              AND id_proyecto = $id_proyecto
              ORDER BY fecha_hora DESC";

$result = $conn->query($check_sql);

echo "<h2>📅 Estado actual de asistencias HOY para este usuario y proyecto:</h2>";
if ($result && $result->num_rows > 0) {
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Tipo</th><th>Fecha/Hora</th></tr>";
    $tiene_entrada_sin_salida = false;
    $ultima_entrada = null;
    
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['id_asistencia'] . "</td>";
        echo "<td>" . $row['tipo_registro'] . "</td>";
        echo "<td>" . $row['fecha_hora'] . "</td>";
        echo "</tr>";
        
        if (strpos($row['tipo_registro'], 'ENTRADA') !== false) {
            $ultima_entrada = $row['fecha_hora'];
        }
    }
    echo "</table>";
    
    // Verificar si tiene entrada sin salida
    $check_entrada = "SELECT COUNT(*) as count 
                      FROM asistencias_biometricas 
                      WHERE id_usuario = $id_usuario 
                      AND DATE(fecha_hora) = '$hoy'
                      AND id_proyecto = $id_proyecto
                      AND tipo_registro LIKE 'ENTRADA%'
                      AND NOT EXISTS (
                          SELECT 1 FROM asistencias_biometricas s
                          WHERE s.id_usuario = $id_usuario
                          AND s.id_proyecto = $id_proyecto
                          AND DATE(s.fecha_hora) = '$hoy'
                          AND s.tipo_registro LIKE 'SALIDA%'
                          AND s.fecha_hora > asistencias_biometricas.fecha_hora
                      )";
    
    $result_entrada = $conn->query($check_entrada);
    $tiene_entrada_sin_salida = $result_entrada->fetch_assoc()['count'] > 0;
    
    if ($tiene_entrada_sin_salida) {
        echo "<p style='color: orange;'>⚠️ El usuario ya tiene una ENTRADA sin SALIDA hoy. Se registrará una SALIDA.</p>";
        $tipo_registro = 'SALIDA';
    } else {
        echo "<p style='color: green;'>✅ El usuario puede registrar una nueva ENTRADA.</p>";
        $tipo_registro = 'ENTRADA';
    }
} else {
    echo "<p>No hay registros de asistencia hoy para este usuario y proyecto.</p>";
    $tipo_registro = 'ENTRADA';
}

// Crear el registro de asistencia
echo "<h2>➕ Creando nuevo registro de asistencia:</h2>";
echo "<p><strong>Tipo:</strong> " . $tipo_registro . "</p>";

$fecha_hora = date('Y-m-d H:i:s');
$stmt = $conn->prepare("
    INSERT INTO asistencias_biometricas 
    (id_usuario, tipo_registro, fecha_hora, foto_base64, score_facial, 
     latitud, longitud, precision_gps, direccion, dentro_radio, 
     user_agent, ip_address, id_ot, observaciones, id_proyecto, 
     tipo_registro_detectado, minutos_diferencia, id_prestamo) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

if (!$stmt) {
    echo "<p style='color: red;'>❌ Error preparando consulta: " . $conn->error . "</p>";
    exit;
}

// Datos de prueba
$foto_base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
$score_facial = 95.5;
$latitud = -0.220966;  // Quito, Ecuador
$longitud = -78.512526;
$precision_gps = 10.0;
$direccion = 'Quito, Ecuador (Prueba)';
$dentro_radio = 1;
$user_agent = 'Mozilla/5.0 (Test Script)';
$ip_address = '127.0.0.1';
$id_ot = null;
$observaciones = 'Registro de prueba generado por script';
$tipo_registro_detectado = null;
$minutos_diferencia = null;
$id_prestamo = null;

$stmt->bind_param(
    "isssddddsissisisii",
    $id_usuario,
    $tipo_registro,
    $fecha_hora,
    $foto_base64,
    $score_facial,
    $latitud,
    $longitud,
    $precision_gps,
    $direccion,
    $dentro_radio,
    $user_agent,
    $ip_address,
    $id_ot,
    $observaciones,
    $id_proyecto,
    $tipo_registro_detectado,
    $minutos_diferencia,
    $id_prestamo
);

if ($stmt->execute()) {
    $id_asistencia = $stmt->insert_id;
    echo "<p style='color: green;'>✅ Asistencia registrada exitosamente!</p>";
    echo "<p><strong>ID de asistencia:</strong> " . $id_asistencia . "</p>";
    echo "<p><strong>Fecha/Hora:</strong> " . $fecha_hora . "</p>";
} else {
    echo "<p style='color: red;'>❌ Error al registrar asistencia: " . $stmt->error . "</p>";
}

// Verificar el conteo de personal activo después del registro
echo "<h2>📊 Verificación post-registro:</h2>";
$result = $conn->query("
    SELECT 
        p.id_proyecto,
        p.nombre_proyecto,
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
        ) as personal_activo
    FROM proyectos_supervisados p
    WHERE p.estado = 'ACTIVO'
    AND p.id_proyecto = $id_proyecto
");

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "<p><strong>Personal activo en " . htmlspecialchars($row['nombre_proyecto']) . ":</strong> " . $row['personal_activo'] . "</p>";
} else {
    echo "<p style='color: orange;'>⚠️ No se pudo verificar el conteo de personal activo</p>";
}

$conn->close();

echo "<hr>";
echo "<p><em>Prueba completada a las " . date('H:i:s') . "</em></p>";
echo "<p><a href='debug_asistencias_usuario.php'>Ver debug completo</a></p>";
?>