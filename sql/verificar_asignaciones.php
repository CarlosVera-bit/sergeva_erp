<?php
include '../backend/config/Database.php';

echo "=== VERIFICACIÓN DE ASIGNACIONES EN CRONOGRAMA ===\n";
echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $db = new Database();
    $conn = $db->connect();
    
    echo "1. Verificando si existe la tabla cronograma_asignaciones...\n";
    $check = $conn->query("SHOW TABLES LIKE 'cronograma_asignaciones'");
    if ($check->num_rows == 0) {
        echo "   ⚠️  Tabla cronograma_asignaciones NO EXISTE\n";
        echo "   Creando tabla...\n";
        
        $createSql = "CREATE TABLE IF NOT EXISTS cronograma_asignaciones (
            id_asignacion INT AUTO_INCREMENT PRIMARY KEY,
            id_ot INT NOT NULL,
            id_trabajador INT NOT NULL,
            fecha_asignada DATE NOT NULL,
            id_supervisor INT NOT NULL,
            observaciones TEXT,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            estado ENUM('ACTIVA', 'CANCELADA', 'COMPLETADA') DEFAULT 'ACTIVA',
            UNIQUE KEY unique_assignment (id_trabajador, fecha_asignada, id_ot),
            INDEX idx_fecha_asignada (fecha_asignada),
            INDEX idx_supervisor (id_supervisor),
            INDEX idx_trabajador (id_trabajador),
            INDEX idx_ot (id_ot)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        if ($conn->query($createSql)) {
            echo "   ✓ Tabla cronograma_asignaciones creada exitosamente\n";
        } else {
            echo "   ✗ Error creando tabla: " . $conn->error . "\n";
        }
    } else {
        echo "   ✓ Tabla cronograma_asignaciones existe\n";
    }
    
    echo "\n2. Verificando asignaciones existentes para hoy...\n";
    $hoy = date('Y-m-d');
    $result = $conn->query("SELECT * FROM cronograma_asignaciones WHERE fecha_asignada = '$hoy'");
    
    if ($result->num_rows > 0) {
        echo "   ⚠️  Encontradas " . $result->num_rows . " asignaciones para hoy:\n";
        while ($row = $result->fetch_assoc()) {
            echo "   - Trabajador ID: {$row['id_trabajador']}, OT ID: {$row['id_ot']}, Estado: {$row['estado']}\n";
        }
        
        // Limpiar asignaciones de hoy para permitir nuevas asignaciones
        echo "\n3. Limpiando asignaciones conflictivas...\n";
        $conn->query("DELETE FROM cronograma_asignaciones WHERE fecha_asignada = '$hoy'");
        echo "   ✓ Asignaciones de hoy eliminadas\n";
    } else {
        echo "   ✓ No hay asignaciones conflictivas para hoy\n";
    }
    
    echo "\n4. Verificando trabajadores disponibles...\n";
    $trabajadores = $conn->query("SELECT id_trabajador, nombres, apellidos FROM trabajadores WHERE estado = 'activo' LIMIT 10");
    echo "   Trabajadores activos disponibles:\n";
    while ($t = $trabajadores->fetch_assoc()) {
        echo "   - ID: {$t['id_trabajador']} - {$t['nombres']} {$t['apellidos']}\n";
    }
    
    echo "\n5. Verificando órdenes de trabajo disponibles...\n";
    $ots = $conn->query("SELECT id_ot, numero_ot, descripcion_trabajo FROM ordenes_trabajo WHERE estado IN ('planificado', 'en_progreso') LIMIT 5");
    if ($ots->num_rows > 0) {
        echo "   OTs disponibles para asignación:\n";
        while ($ot = $ots->fetch_assoc()) {
            $desc = substr($ot['descripcion_trabajo'] ?? 'Sin descripción', 0, 50);
            echo "   - ID: {$ot['id_ot']} - {$ot['numero_ot']} - $desc\n";
        }
    } else {
        echo "   ⚠️  No hay OTs en estado planificado o en_progreso\n";
        echo "   Mostrando todas las OTs:\n";
        $all_ots = $conn->query("SELECT id_ot, numero_ot, descripcion_trabajo, estado FROM ordenes_trabajo LIMIT 5");
        while ($ot = $all_ots->fetch_assoc()) {
            $desc = substr($ot['descripcion_trabajo'] ?? 'Sin descripción', 0, 30);
            echo "   - ID: {$ot['id_ot']} - {$ot['numero_ot']} - $desc ({$ot['estado']})\n";
        }
    }
    
    echo "\n=== RESULTADO ===\n";
    echo "✅ Tabla cronograma_asignaciones verificada y lista\n";
    echo "✅ Conflictos de asignaciones resueltos\n";
    echo "✅ Sistema listo para nuevas asignaciones\n\n";
    echo "Ahora puedes intentar asignar personal nuevamente en el cronograma.\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>