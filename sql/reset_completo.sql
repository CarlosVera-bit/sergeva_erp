-- ===================================================================
-- SCRIPT FINAL - LIMPIEZA TOTAL Y DATOS FRESCOS
-- MANEJA CORRECTAMENTE TODAS LAS FOREIGN KEYS
-- ===================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ELIMINAR TODO (excepto trabajadores)
TRUNCATE TABLE archivo_cliente;
TRUNCATE TABLE detalle_cotizacion;
TRUNCATE TABLE detalle_egreso;
TRUNCATE TABLE detalle_nomina;
TRUNCATE TABLE detalle_pedido;
TRUNCATE TABLE cronograma_asignaciones;
TRUNCATE TABLE inspecciones;
TRUNCATE TABLE registro_horas;
TRUNCATE TABLE movimientos_inventario;
TRUNCATE TABLE integracion_contifico;
TRUNCATE TABLE egresos_bodega;
TRUNCATE TABLE asistencias_biometricas;
TRUNCATE TABLE nomina_operativa;
TRUNCATE TABLE pedidos_compra;
TRUNCATE TABLE cronograma;
TRUNCATE TABLE ordenes_trabajo;
TRUNCATE TABLE cotizaciones;
TRUNCATE TABLE inventario;
TRUNCATE TABLE proyectos_supervisados;
TRUNCATE TABLE productos;
TRUNCATE TABLE prestamo_personal;
TRUNCATE TABLE clientes;
TRUNCATE TABLE proveedores;

-- Limpiar usuarios excepto admin
DELETE FROM usuarios WHERE id_usuario != 1;

SET FOREIGN_KEY_CHECKS = 1;

-- INSERTAR DATOS FRESCOS

-- PROVEEDORES
INSERT INTO proveedores (nombre, contacto, telefono, email, direccion) VALUES
('Ferretería Industrial S.A.', 'Roberto Martínez', '04-2234567', 'ventas@ferrind.com', 'Av. 9 de Octubre 1234, Guayaquil'),
('Suministros Técnicos Ltda.', 'María Elena Gómez', '04-2345678', 'compras@sumtec.com', 'Cdla. Kennedy Norte, Mz. 15 Villa 8'),
('Materiales El Hierro', 'Pedro Salinas', '04-2456789', 'info@elhierro.ec', 'Vía Daule Km 8.5');

-- CLIENTES
INSERT INTO clientes (nombre, contacto, telefono, email, direccion, ruc) VALUES
('Industrias Lácteas S.A.', 'Ing. Carmen Vera', '04-2123456', 'cvera@lacteos.com', 'Parque Industrial Pascuales', '0912345678001'),
('Constructora Ecuatoriana Ltda.', 'Arq. Miguel Santos', '04-2234567', 'msantos@construec.com', 'Av. 9 de Octubre 456', '0923456789001'),
('Alimentos Del Pacífico', 'Dr. Roberto Chang', '04-2345678', 'rchang@alimpac.ec', 'Zona Industrial Trinitaria', '0934567890001');

-- PRODUCTOS
INSERT INTO productos (codigo, nombre, descripcion, precio_unitario, categoria) VALUES
('TOOL-001', 'Llave inglesa 12"', 'Llave inglesa cromada 12 pulgadas', 35.50, 'herramientas'),
('TOOL-002', 'Destornillador Phillips #2', 'Destornillador Phillips magnético', 8.75, 'herramientas'),
('MAT-001', 'Tubería PVC 4"', 'Tubería PVC 110mm x 6m', 28.90, 'materiales'),
('SAFE-001', 'Casco seguridad blanco', 'Casco protección industrial ABS', 15.80, 'seguridad'),
('ELEC-001', 'Cable 12 AWG', 'Cable eléctrico 12 AWG rollo 100m', 85.00, 'electricos');

-- INVENTARIO
INSERT INTO inventario (id_producto, stock_actual, stock_minimo, ubicacion) VALUES
(1, 50, 10, 'Almacén A-1'),
(2, 75, 20, 'Almacén A-1'),
(3, 25, 5, 'Almacén B-2'),
(4, 60, 15, 'Almacén D-4'),
(5, 8, 3, 'Almacén C-3');

-- PROYECTOS SUPERVISADOS
INSERT INTO proyectos_supervisados (nombre_proyecto, descripcion, id_supervisor, fecha_inicio, fecha_fin, estado, presupuesto) VALUES
('GUAYAQUIL', 'Emergencia: Fuga de agua', 1, '2024-12-01', '2025-02-28', 'activo', 85000.00),
('Torre Corporativa', 'Construcción torre oficinas', 1, '2024-11-15', '2025-06-30', 'activo', 1200000.00),
('Planta Procesadora', 'Expansión capacidad procesamiento', 1, '2024-12-10', '2025-03-15', 'activo', 450000.00);

-- ÓRDENES DE TRABAJO  
INSERT INTO ordenes_trabajo (numero_ot, titulo, descripcion, id_cliente, fecha_inicio, fecha_fin_estimada, estado, prioridad, costo_estimado, proyecto) VALUES
('OT-2024-001', 'Mantenimiento Eléctrico Lácteas', 'Mantenimiento sistema eléctrico', 1, '2024-12-17', '2024-12-20', 'en_progreso', 'alta', 2500.00, 'GUAYAQUIL'),
('OT-2024-002', 'Instalación Tuberías Torre', 'Sistema tuberías nueva edificación', 2, '2024-12-15', '2024-12-25', 'planificado', 'media', 8750.50, 'Torre Corporativa'),
('OT-2024-003', 'Equipos Alimentos Pacífico', 'Reparación equipos procesamiento', 3, '2024-12-10', '2024-12-18', 'en_progreso', 'alta', 15200.00, 'Planta Procesadora');

-- ASISTENCIAS BIOMÉTRICAS (ejemplo datos de hoy)
INSERT INTO asistencias_biometricas (id_usuario, fecha_hora, tipo_registro, id_ot) VALUES
-- Usuario 4 actual en sitio  
(4, '2024-12-17 15:59:00', 'ENTRADA', 1),

-- Usuario 4 ya salió
(4, '2024-12-17 10:42:00', 'ENTRADA', 1),
(4, '2024-12-17 11:48:00', 'SALIDA', 1),

-- Otros usuarios
(1, '2024-12-17 08:00:00', 'ENTRADA', 1),
(1, '2024-12-17 17:00:00', 'SALIDA', 1),

-- Días anteriores
(4, '2024-12-16 08:00:00', 'ENTRADA', 1),
(4, '2024-12-16 17:00:00', 'SALIDA', 1);