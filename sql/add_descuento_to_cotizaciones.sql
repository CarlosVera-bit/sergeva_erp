-- Agregar campo de descuento a la tabla cotizaciones
ALTER TABLE cotizaciones 
ADD COLUMN descuento DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER iva,
ADD COLUMN tipo_descuento ENUM('monto', 'porcentaje') DEFAULT 'monto' AFTER descuento;

-- Índices para mejor rendimiento (opcional)
ALTER TABLE cotizaciones ADD INDEX idx_descuento (descuento);
