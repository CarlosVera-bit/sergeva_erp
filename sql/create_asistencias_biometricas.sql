-- Crear tabla para registros de asistencia biométrica
CREATE TABLE IF NOT EXISTS asistencias_biometricas (
  id_asistencia INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  tipo_registro ENUM('ENTRADA', 'SALIDA') NOT NULL,
  fecha_hora DATETIME NOT NULL,
  foto_base64 LONGTEXT,
  score_facial DECIMAL(5,2),
  latitud DECIMAL(10,8),
  longitud DECIMAL(11,8),
  precision_gps DECIMAL(10,2),
  direccion TEXT,
  dentro_radio BOOLEAN DEFAULT TRUE,
  user_agent TEXT,
  ip_address VARCHAR(45),
  id_ot INT,
  observaciones TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_ot) REFERENCES ordenes_trabajo(id_ot),
  INDEX idx_usuario_fecha (id_usuario, fecha_hora),
  INDEX idx_tipo (tipo_registro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
