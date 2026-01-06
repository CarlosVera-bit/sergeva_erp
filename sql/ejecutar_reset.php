<?php
include '../backend/config/Database.php';

echo "=== RESET COMPLETO BASE DE DATOS SERGEVA_ERP ===\n";
echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $db = new Database();
    $conn = $db->connect();
    
    echo "Ejecutando reset completo...\n";
    
    $sql = file_get_contents('reset_completo.sql');
    $statements = explode(';', $sql);
    $ejecutados = 0;
    $errores = 0;
    
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (!empty($statement) && !preg_match('/^--/', $statement)) {
            try {
                $conn->query($statement);
                $ejecutados++;
            } catch (Exception $e) {
                if (strpos($e->getMessage(), 'Empty query') === false) {
                    echo "Error: " . $e->getMessage() . "\n";
                    $errores++;
                }
            }
        }
    }
    
    echo "\nResultados:\n";
    echo "- Statements ejecutados: $ejecutados\n";
    echo "- Errores: $errores\n\n";
    
    // Verificar estado final
    echo "Estado final de las tablas:\n";
    $tablas = [
        'usuarios', 'trabajadores', 'proveedores', 'clientes', 'productos', 
        'inventario', 'proyectos_supervisados', 'ordenes_trabajo', 'asistencias_biometricas',
        'cotizaciones', 'pedidos_compra'
    ];
    
    foreach ($tablas as $tabla) {
        $result = $conn->query("SELECT COUNT(*) as total FROM $tabla");
        $row = $result->fetch_assoc();
        echo "- $tabla: " . $row['total'] . " registros\n";
    }
    
    echo "\n=== PROCESO COMPLETADO ===\n";
    echo "La base de datos ha sido reseteada con datos frescos.\n";
    echo "Tabla 'trabajadores' mantenida intacta.\n";
    echo "Usuario admin (ID=1) preservado.\n\n";
    
    // Mostrar algunos datos de ejemplo
    echo "Proyectos disponibles:\n";
    $result = $conn->query("SELECT nombre_proyecto, estado FROM proyectos_supervisados");
    while ($row = $result->fetch_assoc()) {
        echo "- " . $row['nombre_proyecto'] . " (" . $row['estado'] . ")\n";
    }
    
    echo "\nAsistencias de hoy:\n";
    $result = $conn->query("SELECT u.nombre_completo, a.fecha_hora, a.tipo_registro FROM asistencias_biometricas a JOIN usuarios u ON a.id_usuario = u.id_usuario WHERE DATE(a.fecha_hora) = CURDATE()");
    while ($row = $result->fetch_assoc()) {
        echo "- " . $row['nombre_completo'] . " - " . $row['fecha_hora'] . " (" . $row['tipo_registro'] . ")\n";
    }
    
} catch (Exception $e) {
    echo "ERROR CRÍTICO: " . $e->getMessage() . "\n";
}

$conn->close();
?>