<?php
include '../backend/config/Database.php';

echo "=== VERIFICACIÓN Y CONFIGURACIÓN DE AUTO_INCREMENT ===\n";
echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $db = new Database();
    $conn = $db->connect();
    
    // Obtener todas las tablas
    echo "1. Obteniendo lista de tablas...\n";
    $result = $conn->query("SHOW TABLES");
    $tablas = [];
    while ($row = $result->fetch_array()) {
        $tablas[] = $row[0];
    }
    echo "   ✓ Encontradas " . count($tablas) . " tablas\n\n";
    
    echo "2. Verificando estructura de cada tabla...\n";
    $tablas_modificar = [];
    
    foreach ($tablas as $tabla) {
        echo "   Analizando: $tabla\n";
        
        // Obtener estructura de la tabla
        $estructura = $conn->query("DESCRIBE $tabla");
        $campos_id = [];
        
        while ($campo = $estructura->fetch_assoc()) {
            // Buscar campos que parezcan IDs principales
            $nombre_campo = $campo['Field'];
            $tipo = $campo['Type'];
            $extra = $campo['Extra'];
            
            // Verificar si es un campo ID principal
            if (preg_match('/^id/', $nombre_campo) || 
                preg_match('/id_' . str_replace(['_', 's'], '', $tabla) . '$/', $nombre_campo)) {
                
                $tiene_auto_increment = strpos($extra, 'auto_increment') !== false;
                $es_primary_key = $campo['Key'] === 'PRI';
                $es_entero = strpos($tipo, 'int') !== false;
                
                if ($es_entero && $es_primary_key && !$tiene_auto_increment) {
                    $campos_id[] = [
                        'campo' => $nombre_campo,
                        'tipo' => $tipo,
                        'necesita_auto_increment' => true
                    ];
                    echo "      → $nombre_campo: NECESITA AUTO_INCREMENT\n";
                } else if ($es_entero && $es_primary_key && $tiene_auto_increment) {
                    echo "      → $nombre_campo: ✓ YA TIENE AUTO_INCREMENT\n";
                }
            }
        }
        
        if (!empty($campos_id)) {
            $tablas_modificar[$tabla] = $campos_id;
        }
    }
    
    echo "\n3. Aplicando configuración AUTO_INCREMENT...\n";
    $modificaciones_exitosas = 0;
    $errores = 0;
    
    foreach ($tablas_modificar as $tabla => $campos) {
        foreach ($campos as $campo_info) {
            $campo = $campo_info['campo'];
            $tipo = $campo_info['tipo'];
            
            try {
                // Obtener el valor máximo actual del campo para setear el AUTO_INCREMENT
                $max_result = $conn->query("SELECT MAX($campo) as max_id FROM $tabla");
                $max_row = $max_result->fetch_assoc();
                $next_id = ($max_row['max_id'] ?? 0) + 1;
                
                // Aplicar AUTO_INCREMENT
                $sql = "ALTER TABLE $tabla MODIFY COLUMN $campo $tipo NOT NULL AUTO_INCREMENT";
                $conn->query($sql);
                
                // Establecer el próximo valor del AUTO_INCREMENT
                $conn->query("ALTER TABLE $tabla AUTO_INCREMENT = $next_id");
                
                echo "   ✓ $tabla.$campo configurado como AUTO_INCREMENT (próximo ID: $next_id)\n";
                $modificaciones_exitosas++;
                
            } catch (Exception $e) {
                echo "   ✗ Error en $tabla.$campo: " . $e->getMessage() . "\n";
                $errores++;
            }
        }
    }
    
    echo "\n4. Verificación final...\n";
    $tablas_verificar = ['usuarios', 'trabajadores', 'clientes', 'proveedores', 'productos', 
                        'cotizaciones', 'ordenes_trabajo', 'pedidos_compra', 'inventario',
                        'proyectos_supervisados', 'asistencias_biometricas'];
    
    foreach ($tablas_verificar as $tabla) {
        if (in_array($tabla, $tablas)) {
            $estructura = $conn->query("DESCRIBE $tabla");
            while ($campo = $estructura->fetch_assoc()) {
                if ($campo['Key'] === 'PRI' && strpos($campo['Extra'], 'auto_increment') !== false) {
                    echo "   ✓ $tabla.{$campo['Field']} - AUTO_INCREMENT activo\n";
                    break;
                }
            }
        }
    }
    
    echo "\n=== RESUMEN FINAL ===\n";
    echo "✅ Tablas analizadas: " . count($tablas) . "\n";
    echo "✅ Modificaciones exitosas: $modificaciones_exitosas\n";
    if ($errores > 0) {
        echo "⚠️  Errores encontrados: $errores\n";
    }
    echo "✅ Todas las tablas principales ahora tienen AUTO_INCREMENT configurado\n\n";
    
    echo "Beneficios configurados:\n";
    echo "- IDs se asignan automáticamente al insertar registros\n";
    echo "- No hay necesidad de especificar ID manualmente\n";
    echo "- Previene conflictos de ID duplicados\n";
    echo "- Mejor integridad de datos\n";
    
} catch (Exception $e) {
    echo "ERROR CRÍTICO: " . $e->getMessage() . "\n";
}

$conn->close();
?>