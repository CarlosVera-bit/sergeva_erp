-- Script para verificar e implementar descuento en cotizaciones
-- Ejecutar en phpMyAdmin o MySQL client

-- 1. Verificar si las columnas ya existen
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'cotizaciones' 
AND (COLUMN_NAME = 'descuento' OR COLUMN_NAME = 'tipo_descuento');

-- Si la query anterior no retorna resultados, ejecutar lo siguiente:

-- 2. Agregar las columnas de descuento
ALTER TABLE cotizaciones 
ADD COLUMN descuento DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER iva,
ADD COLUMN tipo_descuento ENUM('monto', 'porcentaje') DEFAULT 'monto' AFTER descuento;

-- 3. Crear índice para mejor rendimiento (opcional)
ALTER TABLE cotizaciones ADD INDEX idx_descuento (descuento);

-- 4. Verificar que las columnas fueron agregadas correctamente
SHOW CREATE TABLE cotizaciones;

-- 5. Verificar los datos
SELECT id_cotizacion, numero_cotizacion, descuento, tipo_descuento FROM cotizaciones LIMIT 5;
