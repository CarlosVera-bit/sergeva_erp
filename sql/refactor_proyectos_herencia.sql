-- ===================================================================
-- SCRIPT DE REFACTORIZACIÓN: HERENCIA DE PROYECTOS
-- OBJETIVO: Extender proyectos_supervisados para ámbitos Interno/Externo
-- ===================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Agregar flags a la tabla padre para identificación rápida
ALTER TABLE proyectos_supervisados 
ADD COLUMN es_externo BOOLEAN DEFAULT FALSE COMMENT 'Indica si el proyecto tiene ámbito externo',
ADD COLUMN es_interno BOOLEAN DEFAULT FALSE COMMENT 'Indica si el proyecto tiene ámbito interno';

-- 2. Crear tabla para detalles de Proyectos Externos
CREATE TABLE IF NOT EXISTS proyectos_externos (
    id_proyecto INT PRIMARY KEY,
    id_cliente INT NOT NULL,
    ubicacion_cliente VARCHAR(255),
    presupuesto_cotizado DECIMAL(12, 2),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proyecto) REFERENCES proyectos_supervisados(id_proyecto) ON DELETE CASCADE,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Crear tabla para detalles de Proyectos Internos
CREATE TABLE IF NOT EXISTS proyectos_internos (
    id_proyecto INT PRIMARY KEY,
    id_departamento INT,
    area_solicitante VARCHAR(100),
    centro_costos VARCHAR(50),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proyecto) REFERENCES proyectos_supervisados(id_proyecto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Índices para optimización de búsquedas
CREATE INDEX idx_externo_cliente ON proyectos_externos(id_cliente);
CREATE INDEX idx_interno_depto ON proyectos_internos(id_departamento);

SET FOREIGN_KEY_CHECKS = 1;
