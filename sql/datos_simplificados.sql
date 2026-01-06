-- ===================================================================
-- SCRIPT SIMPLIFICADO PARA INSERTAR DATOS FRESCOS Y LIMPIOS
-- BASE DE DATOS SERGEVA_ERP
-- ===================================================================

-- Deshabilitar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- ===================================================================
-- 1. LIMPIAR PRIMERO (en orden correcto)
-- ===================================================================

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

-- ===================================================================
-- 2. INSERTAR DATOS BÁSICOS
-- ===================================================================

-- PROVEEDORES
INSERT INTO proveedores (nombre, contacto, telefono, email, direccion) VALUES
('Ferretería Industrial S.A.', 'Roberto Martínez', '04-2234567', 'ventas@ferrind.com', 'Av. 9 de Octubre 1234, Guayaquil'),
('Suministros Técnicos Ltda.', 'María Elena Gómez', '04-2345678', 'compras@sumtec.com', 'Cdla. Kennedy Norte, Mz. 15 Villa 8'),
('Materiales de Construcción El Hierro', 'Pedro Salinas', '04-2456789', 'info@elhierro.ec', 'Vía Daule Km 8.5'),
('Distribuidora Química Industrial', 'Sofía Mendoza', '02-2567890', 'sofia.mendoza@dqui.com', 'Av. Amazonas N21-76, Quito'),
('Herramientas Profesionales CIA', 'Diego Torres', '04-2678901', 'ventas@herpro.net', 'Av. Francisco de Orellana, Edif. Sky Building');

-- CLIENTES
INSERT INTO clientes (nombre, contacto, telefono, email, direccion, ruc) VALUES
('Industrias Lácteas S.A.', 'Ing. Carmen Vera', '04-2123456', 'cvera@lacteos.com', 'Parque Industrial Pascuales', '0912345678001'),
('Constructora Ecuatoriana Ltda.', 'Arq. Miguel Santos', '04-2234567', 'msantos@construec.com', 'Av. 9 de Octubre 456', '0923456789001'),
('Alimentos Procesados Del Pacífico', 'Dr. Roberto Chang', '04-2345678', 'rchang@alimpac.ec', 'Zona Industrial Trinitaria', '0934567890001'),
('Textiles Andinos S.A.', 'Ing. Patricia Morales', '02-2456789', 'pmorales@textand.com', 'Av. Eloy Alfaro 234, Quito', '1745678901001'),
('Servicios Portuarios Guayaquil', 'Cap. Fernando Ríos', '04-2567890', 'frios@serpugua.gov.ec', 'Puerto Marítimo, Terminal 2', '0956789012001');

-- PRODUCTOS
INSERT INTO productos (codigo, nombre, descripcion, precio_unitario, categoria) VALUES
('TOOL-001', 'Llave inglesa 12"', 'Llave inglesa cromada, mango ergonómico, apertura 12 pulgadas', 35.50, 'herramientas'),
('TOOL-002', 'Destornillador Phillips #2', 'Destornillador Phillips punta magnética, mango antideslizante', 8.75, 'herramientas'),
('MAT-001', 'Tubería PVC 4" x 6m', 'Tubería PVC sanitaria 110mm diámetro, longitud 6 metros', 28.90, 'materiales'),
('MAT-002', 'Cemento Portland 50kg', 'Cemento tipo Portland, saco de 50 kg, para uso estructural', 7.25, 'materiales'),
('ELEC-001', 'Cable eléctrico 12 AWG', 'Cable eléctrico cobre 12 AWG, aislamiento THHN, rollo 100m', 85.00, 'electricos'),
('ELEC-002', 'Breaker 20A monofásico', 'Interruptor termomagnético 20A, 220V, marca Square D', 23.50, 'electricos'),
('SAFE-001', 'Casco de seguridad blanco', 'Casco de protección industrial, material ABS, color blanco', 15.80, 'seguridad'),
('SAFE-002', 'Guantes nitrilo talla L', 'Guantes resistentes a químicos, nitrilo azul, talla L', 12.30, 'seguridad'),
('CHEM-001', 'Desoxidante multiusos 500ml', 'Spray desoxidante penetrante, envase 500ml, uso industrial', 9.45, 'quimicos'),
('CHEM-002', 'Soldadura eléctrica 3/32"', 'Electrodo para soldadura E6013, diámetro 3/32", caja 5kg', 45.60, 'quimicos');

-- INVENTARIO
INSERT INTO inventario (id_producto, stock_actual, stock_minimo, ubicacion) VALUES
(1, 50, 10, 'Almacén A - Estante 1'),
(2, 75, 20, 'Almacén A - Estante 1'),
(3, 25, 5, 'Almacén B - Zona PVC'),
(4, 150, 30, 'Almacén B - Zona Cemento'),
(5, 8, 3, 'Almacén C - Eléctricos'),
(6, 40, 8, 'Almacén C - Eléctricos'),
(7, 60, 15, 'Almacén D - Seguridad'),
(8, 100, 25, 'Almacén D - Seguridad'),
(9, 35, 10, 'Almacén E - Químicos'),
(10, 12, 4, 'Almacén E - Químicos');

-- PROYECTOS SUPERVISADOS (usando ID 1 para admin/supervisor)
INSERT INTO proyectos_supervisados (nombre_proyecto, descripcion, id_supervisor, fecha_inicio, fecha_fin, estado, presupuesto) VALUES
('GUAYAQUIL', 'Emergencia: Fuga de agua', 1, '2024-12-01', '2025-02-28', 'activo', 85000.00),
('Construcción Torre Corporativa', 'Supervisión técnica para construcción de torre de oficinas en centro de Guayaquil', 1, '2024-11-15', '2025-06-30', 'activo', 1200000.00),
('Expansión Planta Procesadora', 'Ampliación de capacidad de procesamiento en planta de alimentos', 1, '2024-12-10', '2025-03-15', 'activo', 450000.00),
('Sistema Automatización Textil', 'Implementación de sistema de automatización en planta textil', 1, '2024-10-01', '2024-12-20', 'en_proceso', 320000.00),
('Mantenimiento Infraestructura Portuaria', 'Programa de mantenimiento mayor en instalaciones portuarias', 1, '2025-01-01', '2025-04-30', 'planificado', 180000.00);

-- ÓRDENES DE TRABAJO
INSERT INTO ordenes_trabajo (numero_ot, titulo, descripcion, id_cliente, fecha_inicio, fecha_fin_estimada, estado, prioridad, costo_estimado, costo_real, proyecto) VALUES
('OT-2024-001', 'Mantenimiento Sistema Eléctrico - Industrias Lácteas', 'Revisión y mantenimiento preventivo del sistema eléctrico principal de la planta procesadora', 1, '2024-12-17', '2024-12-20', 'en_progreso', 'alta', 2500.00, 0.00, 'GUAYAQUIL'),
('OT-2024-002', 'Instalación Tuberías - Constructora Ecuatoriana', 'Instalación de sistema de tuberías para nueva edificación en sector norte', 2, '2024-12-15', '2024-12-25', 'planificado', 'media', 8750.50, 0.00, 'Construcción Torre Corporativa'),
('OT-2024-003', 'Reparación Equipos - Alimentos Del Pacífico', 'Reparación de equipos de procesamiento y calibración de instrumentos', 3, '2024-12-10', '2024-12-18', 'en_progreso', 'alta', 15200.00, 8500.00, 'Expansión Planta Procesadora'),
('OT-2024-004', 'Auditoria Seguridad - Textiles Andinos', 'Auditoria de seguridad industrial y recomendaciones de mejora', 4, '2024-12-01', '2024-12-15', 'completado', 'baja', 3450.75, 3450.75, 'Sistema Automatización Textil'),
('OT-2024-005', 'Mantenimiento Preventivo - Servicios Portuarios', 'Mantenimiento preventivo trimestral de equipos portuarios', 5, '2024-12-20', '2024-12-30', 'planificado', 'media', 6800.00, 0.00, 'Mantenimiento Infraestructura Portuaria');

-- ASISTENCIAS BIOMÉTRICAS (datos de hoy)
INSERT INTO asistencias_biometricas (id_usuario, fecha_hora, tipo_registro, id_ot) VALUES
-- Usuario 4 (Joshue) - en sitio
(4, '2024-12-17 15:59:00', 'ENTRADA', 1),

-- Usuario 4 - ya salió
(4, '2024-12-17 10:42:00', 'ENTRADA', 1),
(4, '2024-12-17 11:48:00', 'SALIDA', 1),

-- Otros usuarios con actividad reciente
(5, '2024-12-17 08:00:00', 'ENTRADA', 2),
(5, '2024-12-17 12:00:00', 'SALIDA_ALMUERZO', 2),
(5, '2024-12-17 13:00:00', 'ENTRADA_ALMUERZO', 2),
(5, '2024-12-17 17:00:00', 'SALIDA', 2),

(6, '2024-12-17 07:30:00', 'ENTRADA', 3),
(6, '2024-12-17 12:15:00', 'SALIDA_ALMUERZO', 3),
(6, '2024-12-17 13:15:00', 'ENTRADA_ALMUERZO', 3),

-- Asistencias de días anteriores
(4, '2024-12-16 08:00:00', 'ENTRADA', 1),
(4, '2024-12-16 17:00:00', 'SALIDA', 1),
(5, '2024-12-16 07:45:00', 'ENTRADA', 2),
(5, '2024-12-16 16:45:00', 'SALIDA', 2);

-- Rehabilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;