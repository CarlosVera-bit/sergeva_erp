-- Agregar columnas a la tabla cotizaciones para plaza_parque, tiempo_entrega y condiciones_pago
-- Si la columna ya existe, no hará nada (ignora errores)

ALTER TABLE cotizaciones
ADD COLUMN IF NOT EXISTS plaza_parque VARCHAR(255) DEFAULT 'PLAZA PARQUE' AFTER observaciones,
ADD COLUMN IF NOT EXISTS tiempo_entrega VARCHAR(255) DEFAULT '1 semana' AFTER plaza_parque,
ADD COLUMN IF NOT EXISTS condiciones_pago TEXT DEFAULT 'Pago a los 60 días' AFTER tiempo_entrega;

-- Verificar que se agregaron
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'cotizaciones' 
  AND COLUMN_NAME IN ('plaza_parque', 'tiempo_entrega', 'condiciones_pago')
ORDER BY ORDINAL_POSITION;
