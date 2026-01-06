-- Tabla para cronograma de asignaciones de personal
CREATE TABLE IF NOT EXISTS cronograma_asignaciones (
    id_asignacion INT AUTO_INCREMENT PRIMARY KEY,
    id_ot INT NOT NULL,
    id_trabajador INT NOT NULL,
    fecha_asignada DATE NOT NULL,
    id_supervisor INT NOT NULL,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado ENUM('ACTIVA', 'CANCELADA', 'COMPLETADA') DEFAULT 'ACTIVA',
    
    FOREIGN KEY (id_ot) REFERENCES ordenes_trabajo(id_ot) ON DELETE CASCADE,
    FOREIGN KEY (id_trabajador) REFERENCES trabajadores(id_trabajador) ON DELETE CASCADE,
    FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    
    -- Evitar duplicados: mismo trabajador, mismo día, misma OT
    UNIQUE KEY unique_assignment (id_trabajador, fecha_asignada, id_ot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para mejorar rendimiento
CREATE INDEX idx_fecha_asignada ON cronograma_asignaciones(fecha_asignada);
CREATE INDEX idx_supervisor ON cronograma_asignaciones(id_supervisor);
CREATE INDEX idx_trabajador ON cronograma_asignaciones(id_trabajador);
CREATE INDEX idx_ot ON cronograma_asignaciones(id_ot);
