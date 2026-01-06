-- ===================================================================
-- SCRIPT PARA INSERTAR DATOS FRESCOS Y LIMPIOS
-- BASE DE DATOS SERGEVA_ERP
-- ===================================================================

-- Deshabilitar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- ===================================================================
-- 1. USUARIOS (solo agregar usuarios adicionales, mantener admin)
-- ===================================================================
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo) VALUES
('Supervisor General', 'supervisor@sergeva.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor', 1),
('José María López', 'jlopez@sergeva.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operador', 1),
('Ana Patricia Vega', 'avega@sergeva.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operador', 1),
('Carlos Eduardo Ruiz', 'cruiz@sergeva.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operador', 1);

-- ===================================================================
-- 2. PROVEEDORES
-- ===================================================================
INSERT INTO proveedores (nombre, contacto, telefono, email, direccion) VALUES
('Ferretería Industrial S.A.', 'Roberto Martínez', '04-2234567', 'ventas@ferrind.com', 'Av. 9 de Octubre 1234, Guayaquil'),
('Suministros Técnicos Ltda.', 'María Elena Gómez', '04-2345678', 'compras@sumtec.com', 'Cdla. Kennedy Norte, Mz. 15 Villa 8'),
('Materiales de Construcción El Hierro', 'Pedro Salinas', '04-2456789', 'info@elhierro.ec', 'Vía Daule Km 8.5'),
('Distribuidora Química Industrial', 'Sofía Mendoza', '02-2567890', 'sofia.mendoza@dqui.com', 'Av. Amazonas N21-76, Quito'),
('Herramientas Profesionales CIA', 'Diego Torres', '04-2678901', 'ventas@herpro.net', 'Av. Francisco de Orellana, Edif. Sky Building');

-- ===================================================================
-- 3. CLIENTES
-- ===================================================================
INSERT INTO clientes (nombre, contacto, telefono, email, direccion, ruc) VALUES
('Industrias Lácteas S.A.', 'Ing. Carmen Vera', '04-2123456', 'cvera@lacteos.com', 'Parque Industrial Pascuales', '0912345678001'),
('Constructora Ecuatoriana Ltda.', 'Arq. Miguel Santos', '04-2234567', 'msantos@construec.com', 'Av. 9 de Octubre 456', '0923456789001'),
('Alimentos Procesados Del Pacífico', 'Dr. Roberto Chang', '04-2345678', 'rchang@alimpac.ec', 'Zona Industrial Trinitaria', '0934567890001'),
('Textiles Andinos S.A.', 'Ing. Patricia Morales', '02-2456789', 'pmorales@textand.com', 'Av. Eloy Alfaro 234, Quito', '1745678901001'),
('Servicios Portuarios Guayaquil', 'Cap. Fernando Ríos', '04-2567890', 'frios@serpugua.gov.ec', 'Puerto Marítimo, Terminal 2', '0956789012001');

-- ===================================================================
-- 4. PRODUCTOS
-- ===================================================================
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

-- ===================================================================
-- 5. INVENTARIO
-- ===================================================================
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

-- ===================================================================
-- 6. COTIZACIONES
-- ===================================================================
INSERT INTO cotizaciones (numero_cotizacion, id_cliente, fecha_creacion, fecha_vigencia, estado, observaciones, total, iva, subtotal) VALUES
('COT-2024-001', 1, '2024-12-01', '2024-12-31', 'pendiente', 'Cotización para mantenimiento de equipos industriales', 2500.00, 300.00, 2200.00),
('COT-2024-002', 2, '2024-12-05', '2025-01-05', 'aprobada', 'Suministro de materiales para proyecto constructivo', 8750.50, 1050.06, 7700.44),
('COT-2024-003', 3, '2024-12-10', '2025-01-10', 'pendiente', 'Implementación de sistema eléctrico en planta procesadora', 15200.00, 1824.00, 13376.00),
('COT-2024-004', 4, '2024-12-12', '2025-01-12', 'rechazada', 'Equipamiento de seguridad industrial para planta textil', 3450.75, 414.09, 3036.66),
('COT-2024-005', 5, '2024-12-15', '2025-01-15', 'aprobada', 'Servicios de mantenimiento preventivo trimestral', 6800.00, 816.00, 5984.00);

-- ===================================================================
-- 7. DETALLE COTIZACIONES
-- ===================================================================
INSERT INTO detalle_cotizacion (id_cotizacion, id_producto, cantidad, precio_unitario, subtotal, iva) VALUES
-- Cotización 1
(1, 1, 10, 35.50, 355.00, 42.60),
(1, 2, 20, 8.75, 175.00, 21.00),
(1, 7, 15, 15.80, 237.00, 28.44),

-- Cotización 2  
(2, 3, 50, 28.90, 1445.00, 173.40),
(2, 4, 100, 7.25, 725.00, 87.00),

-- Cotización 3
(3, 5, 15, 85.00, 1275.00, 153.00),
(3, 6, 25, 23.50, 587.50, 70.50),

-- Cotización 4
(4, 7, 30, 15.80, 474.00, 56.88),
(4, 8, 50, 12.30, 615.00, 73.80),

-- Cotización 5
(5, 1, 20, 35.50, 710.00, 85.20),
(5, 9, 30, 9.45, 283.50, 34.02);

-- ===================================================================
-- 8. ÓRDENES DE TRABAJO
-- ===================================================================
INSERT INTO ordenes_trabajo (numero_ot, titulo, descripcion, id_cliente, fecha_inicio, fecha_fin_estimada, estado, prioridad, costo_estimado, costo_real) VALUES
('OT-2024-001', 'Mantenimiento Sistema Eléctrico - Industrias Lácteas', 'Revisión y mantenimiento preventivo del sistema eléctrico principal de la planta procesadora', 1, '2024-12-17', '2024-12-20', 'en_progreso', 'alta', 2500.00, 0.00),
('OT-2024-002', 'Instalación Tuberías - Constructora Ecuatoriana', 'Instalación de sistema de tuberías para nueva edificación en sector norte', 2, '2024-12-15', '2024-12-25', 'planificado', 'media', 8750.50, 0.00),
('OT-2024-003', 'Reparación Equipos - Alimentos Del Pacífico', 'Reparación de equipos de procesamiento y calibración de instrumentos', 3, '2024-12-10', '2024-12-18', 'en_progreso', 'alta', 15200.00, 8500.00),
('OT-2024-004', 'Auditoria Seguridad - Textiles Andinos', 'Auditoria de seguridad industrial y recomendaciones de mejora', 4, '2024-12-01', '2024-12-15', 'completado', 'baja', 3450.75, 3450.75),
('OT-2024-005', 'Mantenimiento Preventivo - Servicios Portuarios', 'Mantenimiento preventivo trimestral de equipos portuarios', 5, '2024-12-20', '2024-12-30', 'planificado', 'media', 6800.00, 0.00);

-- ===================================================================
-- 9. PEDIDOS DE COMPRA
-- ===================================================================
INSERT INTO pedidos_compra (numero_pedido, id_proveedor, id_ot, fecha_pedido, fecha_entrega_estimada, estado, observaciones, total) VALUES
('PED-2024-001', 1, 1, '2024-12-16', '2024-12-18', 'pendiente', 'Urgente para OT en curso', 850.75),
('PED-2024-002', 2, 2, '2024-12-14', '2024-12-20', 'aprobado', 'Entrega en obra directamente', 2100.00),
('PED-2024-003', 3, 3, '2024-12-09', '2024-12-17', 'entregado', 'Material recibido conforme', 1250.50),
('PED-2024-004', 4, NULL, '2024-12-12', '2024-12-19', 'pendiente', 'Pedido de stock general', 780.25),
('PED-2024-005', 5, 5, '2024-12-19', '2024-12-22', 'aprobado', 'Herramientas especializadas', 1450.90);

-- ===================================================================
-- 10. DETALLE PEDIDOS
-- ===================================================================
INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES
-- Pedido 1
(1, 1, 5, 35.50, 177.50),
(1, 2, 10, 8.75, 87.50),

-- Pedido 2
(2, 3, 20, 28.90, 578.00),
(2, 4, 40, 7.25, 290.00),

-- Pedido 3
(3, 5, 5, 85.00, 425.00),
(3, 6, 10, 23.50, 235.00),

-- Pedido 4
(4, 7, 15, 15.80, 237.00),
(4, 8, 25, 12.30, 307.50),

-- Pedido 5
(5, 9, 10, 9.45, 94.50),
(5, 10, 3, 45.60, 136.80);

-- ===================================================================
-- 11. PROYECTOS SUPERVISADOS
-- ===================================================================
INSERT INTO proyectos_supervisados (nombre_proyecto, descripcion, id_supervisor, fecha_inicio, fecha_fin, estado, presupuesto) VALUES
('Modernización Planta Láctea', 'Proyecto integral de modernización de equipos y procesos en Industrias Lácteas S.A.', 2, '2024-12-01', '2025-02-28', 'activo', 85000.00),
('Construcción Torre Corporativa', 'Supervisión técnica para construcción de torre de oficinas en centro de Guayaquil', 2, '2024-11-15', '2025-06-30', 'activo', 1200000.00),
('Expansión Planta Procesadora', 'Ampliación de capacidad de procesamiento en planta de alimentos', 2, '2024-12-10', '2025-03-15', 'activo', 450000.00),
('Sistema Automatización Textil', 'Implementación de sistema de automatización en planta textil', 2, '2024-10-01', '2024-12-20', 'en_proceso', 320000.00),
('Mantenimiento Infraestructura Portuaria', 'Programa de mantenimiento mayor en instalaciones portuarias', 2, '2025-01-01', '2025-04-30', 'planificado', 180000.00);

-- ===================================================================
-- 12. CRONOGRAMA
-- ===================================================================
INSERT INTO cronograma (titulo, descripcion, fecha_inicio, fecha_fin, id_proyecto, estado, prioridad) VALUES
-- Proyecto Láctea
('Diagnóstico inicial equipos', 'Evaluación del estado actual de toda la maquinaria', '2024-12-01', '2024-12-07', 1, 'completado', 'alta'),
('Procurement equipos nuevos', 'Compra e importación de nuevos equipos industriales', '2024-12-08', '2024-12-20', 1, 'en_progreso', 'alta'),
('Instalación y pruebas', 'Montaje de equipos y realización de pruebas operativas', '2024-12-21', '2025-01-15', 1, 'planificado', 'media'),

-- Proyecto Torre
('Preparación terreno', 'Excavación y preparación de cimientos', '2024-11-15', '2024-11-30', 2, 'completado', 'alta'),
('Estructura base', 'Construcción de estructura de hormigón hasta piso 5', '2024-12-01', '2024-12-31', 2, 'en_progreso', 'alta'),
('Instalaciones técnicas', 'Sistemas eléctricos, sanitarios y de climatización', '2025-01-01', '2025-02-28', 2, 'planificado', 'media'),

-- Proyecto Expansión
('Estudios de factibilidad', 'Análisis técnico y económico de la expansión', '2024-12-10', '2024-12-17', 3, 'en_progreso', 'media'),
('Diseño arquitectónico', 'Elaboración de planos y especificaciones técnicas', '2024-12-18', '2025-01-10', 3, 'planificado', 'media'),

-- Proyecto Textil
('Análisis procesos actuales', 'Mapeo de procesos de producción existentes', '2024-10-01', '2024-10-15', 4, 'completado', 'media'),
('Implementación sistema', 'Instalación y configuración del sistema de automatización', '2024-11-01', '2024-12-20', 4, 'en_progreso', 'alta'),

-- Proyecto Portuario
('Planificación detallada', 'Elaboración del plan maestro de mantenimiento', '2025-01-01', '2025-01-07', 5, 'planificado', 'media');

-- ===================================================================
-- 13. ASIGNACIONES DE CRONOGRAMA
-- ===================================================================
INSERT INTO cronograma_asignaciones (id_cronograma, id_trabajador, fecha_asignacion, horas_estimadas, observaciones) VALUES
-- Asignaciones para diferentes tareas
(1, 1, '2024-12-01', 40, 'Responsable técnico del diagnóstico'),
(2, 2, '2024-12-08', 80, 'Coordinador de procurement'),
(4, 1, '2024-11-15', 120, 'Supervisor de preparación terreno'),
(5, 3, '2024-12-01', 200, 'Ingeniero estructural'),
(7, 4, '2024-12-10', 60, 'Analista de factibilidad'),
(9, 1, '2024-10-01', 80, 'Consultor de procesos'),
(10, 2, '2024-11-01', 150, 'Especialista en automatización'),
(11, 3, '2025-01-01', 40, 'Planificador de mantenimiento');

-- ===================================================================
-- 14. EGRESOS DE BODEGA
-- ===================================================================
INSERT INTO egresos_bodega (numero_egreso, fecha_egreso, id_trabajador, observaciones, estado) VALUES
('EGR-2024-001', '2024-12-16', 1, 'Herramientas para mantenimiento OT-2024-001', 'aprobado'),
('EGR-2024-002', '2024-12-15', 2, 'Materiales para proyecto constructivo', 'aprobado'),
('EGR-2024-003', '2024-12-14', 3, 'Equipos de seguridad para inspección', 'aprobado'),
('EGR-2024-004', '2024-12-13', 4, 'Químicos para limpieza de equipos', 'aprobado'),
('EGR-2024-005', '2024-12-17', 1, 'Herramientas adicionales OT urgente', 'pendiente');

-- ===================================================================
-- 15. DETALLE EGRESOS
-- ===================================================================
INSERT INTO detalle_egreso (id_egreso, id_producto, cantidad, observaciones) VALUES
-- Egreso 1
(1, 1, 2, 'Llaves para desmontaje'),
(1, 2, 5, 'Destornilladores varios'),

-- Egreso 2
(2, 3, 10, 'Tubería para instalación'),
(2, 4, 20, 'Cemento para cimientos'),

-- Egreso 3
(3, 7, 5, 'Cascos para equipo de trabajo'),
(3, 8, 10, 'Guantes para manipulación'),

-- Egreso 4
(4, 9, 3, 'Desoxidante para limpieza'),

-- Egreso 5
(5, 1, 1, 'Llave adicional urgente'),
(5, 6, 2, 'Breakers de repuesto');

-- ===================================================================
-- 16. ASISTENCIAS BIOMÉTRICAS (Datos de ejemplo recientes)
-- ===================================================================
INSERT INTO asistencias_biometricas (id_usuario, fecha_hora, tipo_registro, id_ot) VALUES
-- Asistencias de hoy para diferentes usuarios
(1, '2024-12-17 08:00:00', 'ENTRADA', 1),
(1, '2024-12-17 12:00:00', 'SALIDA_ALMUERZO', 1),
(1, '2024-12-17 13:00:00', 'ENTRADA_ALMUERZO', 1),
(1, '2024-12-17 17:00:00', 'SALIDA', 1),

(2, '2024-12-17 07:30:00', 'ENTRADA', 2),
(2, '2024-12-17 12:15:00', 'SALIDA_ALMUERZO', 2),
(2, '2024-12-17 13:15:00', 'ENTRADA_ALMUERZO', 2),

(3, '2024-12-17 08:15:00', 'ENTRADA', 3),
(3, '2024-12-17 11:45:00', 'SALIDA_ALMUERZO', 3),
(3, '2024-12-17 12:45:00', 'ENTRADA_ALMUERZO', 3),
(3, '2024-12-17 16:30:00', 'SALIDA', 3),

(4, '2024-12-17 09:00:00', 'ENTRADA', NULL),

-- Asistencias de días anteriores
(1, '2024-12-16 08:00:00', 'ENTRADA', 1),
(1, '2024-12-16 17:00:00', 'SALIDA', 1),
(2, '2024-12-16 07:45:00', 'ENTRADA', 2),
(2, '2024-12-16 16:45:00', 'SALIDA', 2);

-- ===================================================================
-- 17. REGISTRO DE HORAS
-- ===================================================================
INSERT INTO registro_horas (id_trabajador, id_proyecto, fecha, horas_normales, horas_extra, descripcion_actividades) VALUES
(1, 1, '2024-12-16', 8.0, 0.0, 'Diagnóstico de equipos industriales, revisión de manuales técnicos'),
(1, 1, '2024-12-17', 6.0, 2.0, 'Continuación diagnóstico, inicio de procurement'),
(2, 2, '2024-12-16', 7.5, 0.5, 'Coordinación con proveedores, seguimiento pedidos'),
(2, 2, '2024-12-17', 8.0, 0.0, 'Recepción de materiales, verificación calidad'),
(3, 3, '2024-12-16', 8.0, 0.0, 'Análisis estructural, cálculos de resistencia'),
(3, 3, '2024-12-17', 7.5, 0.0, 'Supervisión instalaciones, control calidad'),
(4, 4, '2024-12-16', 8.0, 1.0, 'Análisis de procesos, documentación técnica'),
(4, NULL, '2024-12-17', 8.0, 0.0, 'Actividades administrativas generales');

-- ===================================================================
-- 18. MOVIMIENTOS DE INVENTARIO
-- ===================================================================
INSERT INTO movimientos_inventario (id_producto, tipo_movimiento, cantidad, fecha_movimiento, observaciones, documento_referencia) VALUES
(1, 'entrada', 20, '2024-12-01', 'Compra mensual de herramientas', 'PED-2024-001'),
(1, 'salida', 5, '2024-12-16', 'Asignación para OT-2024-001', 'EGR-2024-001'),
(2, 'entrada', 50, '2024-12-01', 'Restock de destornilladores', 'PED-2024-002'),
(2, 'salida', 10, '2024-12-15', 'Distribución a técnicos', 'EGR-2024-002'),
(3, 'entrada', 100, '2024-11-30', 'Compra tubería para proyectos', 'PED-2024-003'),
(3, 'salida', 25, '2024-12-10', 'Proyecto construcción', 'EGR-2024-003'),
(4, 'entrada', 200, '2024-12-05', 'Stock cemento temporada alta', 'PED-2024-004'),
(4, 'salida', 50, '2024-12-12', 'Obra constructora ecuatoriana', 'EGR-2024-004'),
(7, 'entrada', 100, '2024-11-25', 'Renovación equipos seguridad', 'PED-2024-005'),
(7, 'salida', 15, '2024-12-14', 'Dotación personal nuevo', 'EGR-2024-005');

-- ===================================================================
-- 19. INSPECCIONES
-- ===================================================================
INSERT INTO inspecciones (id_ot, fecha_inspeccion, tipo_inspeccion, resultado, observaciones, inspector) VALUES
(1, '2024-12-16', 'seguridad', 'aprobado', 'Cumple con normativas de seguridad eléctrica', 'Ing. Patricia Morales'),
(2, '2024-12-15', 'calidad', 'observaciones', 'Requiere ajustes menores en soldadura tubería 3', 'Ing. Roberto Chang'),
(3, '2024-12-10', 'progreso', 'aprobado', 'Avance del 75% según cronograma establecido', 'Arq. Miguel Santos'),
(4, '2024-12-05', 'final', 'aprobado', 'Proyecto completado satisfactoriamente', 'Dr. Carmen Vera'),
(1, '2024-12-17', 'progreso', 'aprobado', 'Avance del 60%, dentro del tiempo estimado', 'Ing. Patricia Morales');

-- ===================================================================
-- 20. NÓMINA OPERATIVA
-- ===================================================================
INSERT INTO nomina_operativa (periodo, id_trabajador, sueldo_base, horas_extra, bonificaciones, descuentos, total_pagar, fecha_pago) VALUES
('2024-12', 1, 1200.00, 150.00, 100.00, 120.00, 1330.00, '2024-12-15'),
('2024-12', 2, 1100.00, 75.00, 80.00, 110.00, 1145.00, '2024-12-15'),
('2024-12', 3, 1300.00, 200.00, 120.00, 130.00, 1490.00, '2024-12-15'),
('2024-12', 4, 1000.00, 50.00, 60.00, 100.00, 1010.00, '2024-12-15'),
('2024-11', 1, 1200.00, 100.00, 100.00, 120.00, 1280.00, '2024-11-15'),
('2024-11', 2, 1100.00, 125.00, 80.00, 110.00, 1195.00, '2024-11-15'),
('2024-11', 3, 1300.00, 175.00, 120.00, 130.00, 1465.00, '2024-11-15'),
('2024-11', 4, 1000.00, 25.00, 60.00, 100.00, 985.00, '2024-11-15');

-- Rehabilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Mensaje de confirmación
SELECT 'Datos frescos insertados exitosamente en todas las tablas' as mensaje;