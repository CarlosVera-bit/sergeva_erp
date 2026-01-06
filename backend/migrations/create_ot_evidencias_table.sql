-- Tabla para almacenar evidencia fotográfica de órdenes de trabajo
-- Permite vincular múltiples fotos a cada OT con metadata completa

CREATE TABLE IF NOT EXISTS ot_evidencias (
    id_evidencia INT AUTO_INCREMENT PRIMARY KEY,
    id_ot INT NOT NULL,
    id_usuario INT NOT NULL,
    ruta_imagen VARCHAR(500) NOT NULL,
    descripcion TEXT NULL,
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Claves foráneas con integridad referencial
    FOREIGN KEY (id_ot) REFERENCES ordenes_trabajo(id_ot) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    
    -- Índices para optimizar consultas
    INDEX idx_ot (id_ot),
    INDEX idx_fecha (fecha_subida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios de tabla
ALTER TABLE ot_evidencias COMMENT = 'Evidencia fotográfica de órdenes de trabajo';
