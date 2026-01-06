-- Agregar columna plazo_estimado_dias a ordenes_trabajo si no existe
ALTER TABLE ordenes_trabajo 
ADD COLUMN IF NOT EXISTS plazo_estimado_dias INT DEFAULT NULL AFTER total_ot;

-- Actualizar valores de plazo estimado basado en fechas
UPDATE ordenes_trabajo 
SET plazo_estimado_dias = DATEDIFF(fecha_fin_estimada, fecha_inicio)
WHERE plazo_estimado_dias IS NULL AND fecha_inicio IS NOT NULL AND fecha_fin_estimada IS NOT NULL;
