-- Script para corregir la estructura de la tabla detalle_cotizacion
-- Ejecutar en phpMyAdmin o MySQL

-- 1. Verificar estructura actual
DESCRIBE detalle_cotizacion;

-- 2. Agregar columna iva_porcentaje si no existe
ALTER TABLE detalle_cotizacion 
ADD COLUMN iva_porcentaje INT NOT NULL DEFAULT 15 
AFTER precio_unitario;

-- 3. Verificar que se agregó correctamente
DESCRIBE detalle_cotizacion;

-- 4. (OPCIONAL) Si existe una columna 'iva' antigua, puedes eliminarla:
-- ALTER TABLE detalle_cotizacion DROP COLUMN iva;
