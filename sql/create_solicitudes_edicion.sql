-- Script para crear tabla de solicitudes de edición
-- Sistema de aprobación de ediciones para supervisores

CREATE TABLE IF NOT EXISTS solicitudes_edicion (
    id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
    id_supervisor INT NOT NULL,
    tabla_objetivo VARCHAR(100) NOT NULL,
    id_registro INT NOT NULL,
    motivo TEXT NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    id_admin_respuesta INT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP NULL,
    observaciones_admin TEXT NULL,
    
    -- Foreign Keys
    FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_admin_respuesta) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    
    -- Índices para optimizar consultas
    INDEX idx_supervisor (id_supervisor),
    INDEX idx_estado (estado),
    INDEX idx_tabla_registro (tabla_objetivo, id_registro),
    INDEX idx_fecha_solicitud (fecha_solicitud)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios de la tabla
ALTER TABLE solicitudes_edicion COMMENT = 'Tabla para gestionar solicitudes de edición de supervisores que requieren aprobación de administradores';
