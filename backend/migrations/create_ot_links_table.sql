-- Tabla para almacenar links compartibles de órdenes de trabajo
-- Permite vincular múltiples links a cada OT con metadata completa
-- Similar a ot_evidencias pero para links externos

CREATE TABLE IF NOT EXISTS ot_links (
    id_link INT AUTO_INCREMENT PRIMARY KEY,
    id_ot INT NOT NULL,
    id_usuario INT NOT NULL,
    url VARCHAR(1000) NOT NULL,
    titulo VARCHAR(255) NULL,
    descripcion TEXT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Claves foráneas con integridad referencial
    FOREIGN KEY (id_ot) REFERENCES ordenes_trabajo(id_ot) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    
    -- Índices para optimizar consultas
    INDEX idx_ot (id_ot),
    INDEX idx_fecha (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios de tabla
ALTER TABLE ot_links COMMENT = 'Links compartibles asociados a órdenes de trabajo';
