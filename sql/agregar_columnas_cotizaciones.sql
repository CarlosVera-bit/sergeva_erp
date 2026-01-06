-- Agregar columnas faltantes a la tabla cotizaciones
ALTER TABLE cotizaciones
ADD COLUMN IF NOT EXISTS descuento DECIMAL(10,2) DEFAULT 0 AFTER observaciones,
ADD COLUMN IF NOT EXISTS tipo_descuento VARCHAR(50) DEFAULT 'monto' AFTER descuento,
ADD COLUMN IF NOT EXISTS plaza_parque VARCHAR(255) DEFAULT 'PLAZA PARQUE' AFTER tipo_descuento,
ADD COLUMN IF NOT EXISTS tiempo_entrega VARCHAR(255) DEFAULT '1 semana' AFTER plaza_parque,
ADD COLUMN IF NOT EXISTS condiciones_pago TEXT DEFAULT 'Pago a los 60 días' AFTER tiempo_entrega;

-- Verificar que se agregaron
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'cotizaciones' 
ORDER BY ORDINAL_POSITION;
