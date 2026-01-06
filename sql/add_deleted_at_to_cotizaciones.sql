-- Agregar campo deleted_at para borrado lógico en cotizaciones
ALTER TABLE cotizaciones 
ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL,
ADD INDEX idx_deleted_at (deleted_at);

-- Agregar campo deleted_at para borrado lógico en detalle_cotizacion
ALTER TABLE detalle_cotizacion 
ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL,
ADD INDEX idx_deleted_at (deleted_at);

-- Comentarios:
-- deleted_at = NULL significa que el registro está activo
-- deleted_at = FECHA significa que el registro fue eliminado en esa fecha
