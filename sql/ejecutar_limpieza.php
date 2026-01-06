<?php
// Script para ejecutar la limpieza y carga de datos frescos

include '../backend/config/Database.php';

echo "=== SERGEVA ERP - LIMPIEZA Y CARGA DE DATOS FRESCOS ===\n";
echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $db = new Database();
    $conn = $db->connect();
    
    // Función para ejecutar archivo SQL
    function ejecutarSQL($conn, $archivo) {
        $sql = file_get_contents($archivo);
        
        // Dividir en statements individuales
        $statements = explode(';', $sql);
        $ejecutados = 0;
        
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (!empty($statement) && !preg_match('/^--/', $statement)) {
                try {
                    $conn->query($statement);
                    $ejecutados++;
                } catch (Exception $e) {
                    if (strpos($e->getMessage(), 'Empty query') === false) {
                        echo "Advertencia en statement: " . substr($statement, 0, 50) . "... - " . $e->getMessage() . "\n";
                    }
                }
            }
        }
        
        return $ejecutados;
    }
    
    // PASO 1: Limpiar datos existentes
    echo "PASO 1: Limpiando datos existentes...\n";
    $ejecutados1 = ejecutarSQL($conn, 'limpiar_datos.sql');
    echo "✓ Datos limpiados - Statements ejecutados: $ejecutados1\n\n";
    
    // PASO 2: Insertar datos frescos
    echo "PASO 2: Insertando datos frescos...\n";
    $ejecutados2 = ejecutarSQL($conn, 'datos_frescos.sql');
    echo "✓ Datos frescos insertados - Statements ejecutados: $ejecutados2\n\n";
    
    // PASO 3: Verificar resultados
    echo "PASO 3: Verificando resultados...\n";
    $tablas_verificar = [
        'usuarios', 'clientes', 'proveedores', 'productos', 'cotizaciones', 
        'ordenes_trabajo', 'pedidos_compra', 'asistencias_biometricas',
        'inventario', 'proyectos_supervisados'
    ];
    
    foreach ($tablas_verificar as $tabla) {
        $result = $conn->query("SELECT COUNT(*) as total FROM $tabla");
        $row = $result->fetch_assoc();
        echo "- $tabla: {$row['total']} registros\n";
    }
    
    echo "\n=== PROCESO COMPLETADO EXITOSAMENTE ===\n";
    echo "La base de datos ha sido limpiada y cargada con datos frescos.\n";
    echo "Nota: La tabla 'trabajadores' se mantuvo intacta como solicitado.\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "El proceso no se completó correctamente.\n";
}

$conn->close();
?>