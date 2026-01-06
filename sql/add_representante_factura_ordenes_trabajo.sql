-- Agregar campos representante y factura a la tabla ordenes_trabajo
-- Estos campos se ubicarán antes de id_cotizacion

ALTER TABLE ordenes_trabajo
ADD COLUMN representante VARCHAR(255) NULL COMMENT 'Nombre del representante del cliente' AFTER id_cliente,
ADD COLUMN factura VARCHAR(100) NULL COMMENT 'Número de factura asociado' AFTER representante;

-- Verificar la estructura de la tabla
DESCRIBE ordenes_trabajo;
