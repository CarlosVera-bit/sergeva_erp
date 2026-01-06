<?php
include '../backend/config/Database.php';

try {
    $db = new Database();
    $conn = $db->connect();
    
    echo "=== CARGA DE DATOS SIMPLIFICADOS ===\n";
    
    $sql = file_get_contents('datos_simplificados.sql');
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
                    echo "Error: " . substr($statement, 0, 50) . "... - " . $e->getMessage() . "\n";
                    $errores++;
                }
            }
        }
    }
    
    echo "Statements ejecutados: $ejecutados\n";
    echo "Errores encontrados: $errores\n";
    
    // Verificar resultados
    echo "\nVerificación:\n";
    $tablas = ['proveedores', 'clientes', 'productos', 'inventario', 'proyectos_supervisados', 'ordenes_trabajo', 'asistencias_biometricas'];
    
    foreach ($tablas as $tabla) {
        $result = $conn->query("SELECT COUNT(*) as total FROM $tabla");
        $row = $result->fetch_assoc();
        echo "- $tabla: " . $row['total'] . " registros\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>