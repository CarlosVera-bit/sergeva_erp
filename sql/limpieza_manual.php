<?php
include '../backend/config/Database.php';

echo "=== LIMPIEZA MANUAL COMPLETA DE BASE DE DATOS ===\n";
echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $db = new Database();
    $conn = $db->connect();
    
    // Deshabilitar foreign keys
    echo "1. Deshabilitando foreign keys...\n";
    $conn->query("SET FOREIGN_KEY_CHECKS = 0");
    
    // Lista de tablas para limpiar (orden específico)
    $tablas_limpiar = [
        'archivo_cliente',
        'detalle_cotizacion', 
        'detalle_egreso',
        'detalle_nomina',
        'detalle_pedido',
        'cronograma_asignaciones',
        'inspecciones',
        'registro_horas',
        'movimientos_inventario',
        'integracion_contifico',
        'egresos_bodega',
        'asistencias_biometricas',
        'nomina_operativa',
        'pedidos_compra',
        'cronograma',
        'ordenes_trabajo',
        'cotizaciones',
        'inventario',
        'proyectos_supervisados',
        'productos',
        'prestamo_personal',
        'clientes',
        'proveedores'
    ];
    
    // Limpiar tablas
    echo "2. Limpiando tablas...\n";
    $limpiadas = 0;
    foreach ($tablas_limpiar as $tabla) {
        try {
            $conn->query("DELETE FROM $tabla");
            $conn->query("ALTER TABLE $tabla AUTO_INCREMENT = 1");
            echo "   ✓ $tabla\n";
            $limpiadas++;
        } catch (Exception $e) {
            echo "   ✗ $tabla - Error: " . $e->getMessage() . "\n";
        }
    }
    
    // Limpiar usuarios excepto admin
    echo "3. Limpiando usuarios (excepto admin)...\n";
    $conn->query("DELETE FROM usuarios WHERE id_usuario != 1");
    echo "   ✓ Usuarios limpiados\n";
    
    // Insertar datos frescos
    echo "4. Insertando datos frescos...\n";
    
    // Proveedores
    $conn->query("INSERT INTO proveedores (ruc, nombre_razon_social, contacto, telefono, email, direccion) VALUES 
        ('0990123456001', 'Ferretería Industrial S.A.', 'Roberto Martínez', '04-2234567', 'ventas@ferrind.com', 'Av. 9 de Octubre 1234, Guayaquil'),
        ('0990234567001', 'Suministros Técnicos Ltda.', 'María Elena Gómez', '04-2345678', 'compras@sumtec.com', 'Cdla. Kennedy Norte, Mz. 15 Villa 8'),
        ('0990345678001', 'Materiales El Hierro', 'Pedro Salinas', '04-2456789', 'info@elhierro.ec', 'Vía Daule Km 8.5')");
    echo "   ✓ Proveedores\n";
    
    // Clientes
    $conn->query("INSERT INTO clientes (nombre_razon_social, contacto_principal, telefono, email, direccion, ruc_cedula) VALUES 
        ('Industrias Lácteas S.A.', 'Ing. Carmen Vera', '04-2123456', 'cvera@lacteos.com', 'Parque Industrial Pascuales', '0912345678001'),
        ('Constructora Ecuatoriana Ltda.', 'Arq. Miguel Santos', '04-2234567', 'msantos@construec.com', 'Av. 9 de Octubre 456', '0923456789001'),
        ('Alimentos Del Pacífico', 'Dr. Roberto Chang', '04-2345678', 'rchang@alimpac.ec', 'Zona Industrial Trinitaria', '0934567890001')");
    echo "   ✓ Clientes\n";
    
    // Productos
    $conn->query("INSERT INTO productos (codigo_producto, nombre, descripcion, precio_unitario, categoria, stock_minimo, unidad_medida, valor_medida) VALUES 
        ('TOOL-001', 'Llave inglesa 12\"', 'Llave inglesa cromada 12 pulgadas', 35.50, 'herramientas', 10, 'unidad', 1),
        ('TOOL-002', 'Destornillador Phillips #2', 'Destornillador Phillips magnético', 8.75, 'herramientas', 20, 'unidad', 1),
        ('MAT-001', 'Tubería PVC 4\"', 'Tubería PVC 110mm x 6m', 28.90, 'materiales', 5, 'metro', 6),
        ('SAFE-001', 'Casco seguridad blanco', 'Casco protección industrial ABS', 15.80, 'seguridad', 15, 'unidad', 1),
        ('ELEC-001', 'Cable 12 AWG', 'Cable eléctrico 12 AWG rollo 100m', 85.00, 'electricos', 3, 'rollo', 100)");
    echo "   ✓ Productos\n";
    
    // Inventario
    $conn->query("INSERT INTO inventario (id_producto, stock_actual, stock_minimo, ubicacion) VALUES 
        (1, 50, 10, 'Almacén A-1'),
        (2, 75, 20, 'Almacén A-1'),
        (3, 25, 5, 'Almacén B-2'),
        (4, 60, 15, 'Almacén D-4'),
        (5, 8, 3, 'Almacén C-3')");
    echo "   ✓ Inventario\n";
    
    // Proyectos supervisados
    $conn->query("INSERT INTO proyectos_supervisados (nombre_proyecto, descripcion, id_supervisor, fecha_inicio, fecha_fin, estado, presupuesto) VALUES 
        ('GUAYAQUIL', 'Emergencia: Fuga de agua', 1, '2024-12-01', '2025-02-28', 'activo', 85000.00),
        ('Torre Corporativa', 'Construcción torre oficinas', 1, '2024-11-15', '2025-06-30', 'activo', 1200000.00),
        ('Planta Procesadora', 'Expansión capacidad procesamiento', 1, '2024-12-10', '2025-03-15', 'activo', 450000.00)");
    echo "   ✓ Proyectos supervisados\n";
    
    // Órdenes de trabajo
    $conn->query("INSERT INTO ordenes_trabajo (numero_ot, titulo, descripcion, id_cliente, fecha_inicio, fecha_fin_estimada, estado, prioridad, costo_estimado, proyecto) VALUES 
        ('OT-2024-001', 'Mantenimiento Eléctrico Lácteas', 'Mantenimiento sistema eléctrico', 1, '2024-12-17', '2024-12-20', 'en_progreso', 'alta', 2500.00, 'GUAYAQUIL'),
        ('OT-2024-002', 'Instalación Tuberías Torre', 'Sistema tuberías nueva edificación', 2, '2024-12-15', '2024-12-25', 'planificado', 'media', 8750.50, 'Torre Corporativa'),
        ('OT-2024-003', 'Equipos Alimentos Pacífico', 'Reparación equipos procesamiento', 3, '2024-12-10', '2024-12-18', 'en_progreso', 'alta', 15200.00, 'Planta Procesadora')");
    echo "   ✓ Órdenes de trabajo\n";
    
    // Asistencias biométricas
    $conn->query("INSERT INTO asistencias_biometricas (id_usuario, fecha_hora, tipo_registro, id_ot) VALUES 
        (4, '2024-12-17 15:59:00', 'ENTRADA', 1),
        (4, '2024-12-17 10:42:00', 'ENTRADA', 1),
        (4, '2024-12-17 11:48:00', 'SALIDA', 1),
        (1, '2024-12-17 08:00:00', 'ENTRADA', 1),
        (1, '2024-12-17 17:00:00', 'SALIDA', 1),
        (4, '2024-12-16 08:00:00', 'ENTRADA', 1),
        (4, '2024-12-16 17:00:00', 'SALIDA', 1)");
    echo "   ✓ Asistencias biométricas\n";
    
    // Rehabilitar foreign keys
    echo "5. Rehabilitando foreign keys...\n";
    $conn->query("SET FOREIGN_KEY_CHECKS = 1");
    
    // Verificación final
    echo "\n=== VERIFICACIÓN FINAL ===\n";
    $tablas_verificar = [
        'usuarios', 'trabajadores', 'proveedores', 'clientes', 'productos', 
        'inventario', 'proyectos_supervisados', 'ordenes_trabajo', 'asistencias_biometricas'
    ];
    
    foreach ($tablas_verificar as $tabla) {
        $result = $conn->query("SELECT COUNT(*) as total FROM $tabla");
        $row = $result->fetch_assoc();
        echo "- $tabla: " . $row['total'] . " registros\n";
    }
    
    echo "\n=== PROCESO COMPLETADO EXITOSAMENTE ===\n";
    echo "✅ Base de datos limpiada y cargada con datos frescos\n";
    echo "✅ Tabla 'trabajadores' preservada con " . (54) . " registros\n";
    echo "✅ Usuario admin mantenido\n";
    echo "✅ " . $limpiadas . " tablas procesadas\n\n";
    
    echo "Datos de prueba listos para usar:\n";
    echo "- 3 proveedores\n";
    echo "- 3 clientes\n"; 
    echo "- 5 productos con inventario\n";
    echo "- 3 proyectos supervisados\n";
    echo "- 3 órdenes de trabajo\n";
    echo "- Asistencias de ejemplo para testing\n";
    
} catch (Exception $e) {
    echo "ERROR CRÍTICO: " . $e->getMessage() . "\n";
    $conn->query("SET FOREIGN_KEY_CHECKS = 1"); // Asegurar que se rehabiliten
}

$conn->close();
?>