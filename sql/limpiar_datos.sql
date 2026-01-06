-- ===================================================================
-- SCRIPT PARA LIMPIAR DATOS DE LA BASE DE DATOS SERGEVA_ERP
-- NOTA: NO BORRA LA TABLA 'trabajadores' porque ya tiene datos válidos
-- ===================================================================

-- Deshabilitar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar tablas en orden para evitar conflictos de foreign keys
-- (De dependientes a principales)

-- Tablas de detalle primero
DELETE FROM detalle_cotizacion;
DELETE FROM detalle_egreso;
DELETE FROM detalle_nomina;
DELETE FROM detalle_pedido;
DELETE FROM cronograma_asignaciones;
DELETE FROM archivo_cliente;
DELETE FROM inspecciones;
DELETE FROM registro_horas;
DELETE FROM movimientos_inventario;
DELETE FROM integracion_contifico;

-- Tablas principales
DELETE FROM egresos_bodega;
DELETE FROM asistencias_biometricas;
DELETE FROM nomina_operativa;
DELETE FROM pedidos_compra;
DELETE FROM cronograma;
DELETE FROM ordenes_trabajo;
DELETE FROM cotizaciones;
DELETE FROM inventario;
DELETE FROM proyectos_supervisados;
DELETE FROM productos;
DELETE FROM prestamo_personal;
DELETE FROM clientes;
DELETE FROM proveedores;
DELETE FROM usuarios WHERE id_usuario != 1; -- Usar el nombre correcto del campo

-- Resetear AUTO_INCREMENT en tablas que lo usen
ALTER TABLE archivo_cliente AUTO_INCREMENT = 1;
ALTER TABLE asistencias_biometricas AUTO_INCREMENT = 1;
ALTER TABLE clientes AUTO_INCREMENT = 1;
ALTER TABLE cotizaciones AUTO_INCREMENT = 1;
ALTER TABLE cronograma AUTO_INCREMENT = 1;
ALTER TABLE cronograma_asignaciones AUTO_INCREMENT = 1;
ALTER TABLE detalle_cotizacion AUTO_INCREMENT = 1;
ALTER TABLE detalle_egreso AUTO_INCREMENT = 1;
ALTER TABLE detalle_nomina AUTO_INCREMENT = 1;
ALTER TABLE detalle_pedido AUTO_INCREMENT = 1;
ALTER TABLE egresos_bodega AUTO_INCREMENT = 1;
ALTER TABLE inspecciones AUTO_INCREMENT = 1;
ALTER TABLE integracion_contifico AUTO_INCREMENT = 1;
ALTER TABLE inventario AUTO_INCREMENT = 1;
ALTER TABLE movimientos_inventario AUTO_INCREMENT = 1;
ALTER TABLE nomina_operativa AUTO_INCREMENT = 1;
ALTER TABLE ordenes_trabajo AUTO_INCREMENT = 1;
ALTER TABLE pedidos_compra AUTO_INCREMENT = 1;
ALTER TABLE prestamo_personal AUTO_INCREMENT = 1;
ALTER TABLE productos AUTO_INCREMENT = 1;
ALTER TABLE proveedores AUTO_INCREMENT = 1;
ALTER TABLE proyectos_supervisados AUTO_INCREMENT = 1;
ALTER TABLE registro_horas AUTO_INCREMENT = 1;

-- Rehabilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;