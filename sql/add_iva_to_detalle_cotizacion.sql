-- Agregar campo iva_porcentaje a la tabla detalle_cotizacion
-- Esto es OPCIONAL - permite guardar el % de IVA de cada item

ALTER TABLE detalle_cotizacion 
ADD COLUMN iva_porcentaje INT NOT NULL DEFAULT 15 
AFTER precio_unitario;

-- Esto te permitirá:
-- 1. Saber qué items tenían IVA 0% vs 15%
-- 2. Recalcular totales correctamente si editas la cotización
-- 3. Mostrar el % en el PDF regenerado

-- Si NO quieres agregar este campo, el código funcionará igual
-- El PDF mostrará siempre 15% por defecto
