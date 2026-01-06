-- ============================================
-- Script SQL para agregar columnas a ordenes_trabajo
-- Ejecutar este script si las columnas no existen
-- ============================================

-- Agregar columna representante (nombre del representante de la empresa cliente)
ALTER TABLE ordenes_trabajo 
ADD COLUMN IF NOT EXISTS representante VARCHAR(255) NULL AFTER id_cliente;

-- Agregar columna factura (número de factura de Contifico)
ALTER TABLE ordenes_trabajo 
ADD COLUMN IF NOT EXISTS factura VARCHAR(50) NULL AFTER representante;

-- ============================================
-- Verificar estructura de la tabla
-- ============================================
-- DESCRIBE ordenes_trabajo;

-- ============================================
-- Nota: Si MySQL no soporta IF NOT EXISTS en ALTER TABLE,
-- usar estas consultas alternativas:
-- ============================================
-- ALTER TABLE ordenes_trabajo ADD COLUMN representante VARCHAR(255) NULL AFTER id_cliente;
-- ALTER TABLE ordenes_trabajo ADD COLUMN factura VARCHAR(50) NULL AFTER representante;

