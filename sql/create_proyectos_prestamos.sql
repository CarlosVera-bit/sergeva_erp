-- Tablas para gestión de proyectos supervisados y préstamos de personal

-- Tabla de proyectos supervisados con horarios configurados
CREATE TABLE IF NOT EXISTS proyectos_supervisados (
  id_proyecto INT AUTO_INCREMENT PRIMARY KEY,
  id_ot INT NOT NULL,
  id_supervisor INT NOT NULL,
  numero_ot VARCHAR(20),
  nombre_proyecto VARCHAR(200) NOT NULL,
  descripcion TEXT,
  hora_ingreso TIME NOT NULL,
  hora_salida TIME NOT NULL,
  estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ot) REFERENCES ordenes_trabajo(id_ot) ON DELETE CASCADE,
  FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_supervisor (id_supervisor),
  INDEX idx_ot (id_ot),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Modificar tabla prestamos_personal para incluir campos de préstamo dual
ALTER TABLE prestamos_personal 
ADD COLUMN IF NOT EXISTS id_proyecto_origen INT AFTER id_ot,
ADD COLUMN IF NOT EXISTS id_proyecto_destino INT AFTER id_proyecto_origen,
ADD COLUMN IF NOT EXISTS id_ot_origen INT AFTER id_proyecto_destino,
ADD COLUMN IF NOT EXISTS id_ot_destino INT AFTER id_ot_origen,
ADD COLUMN IF NOT EXISTS fecha_prestamo DATE AFTER id_ot_destino,
ADD COLUMN IF NOT EXISTS hora_fin_proyecto_origen TIME AFTER fecha_prestamo,
ADD COLUMN IF NOT EXISTS hora_inicio_proyecto_destino TIME AFTER hora_fin_proyecto_origen,
ADD COLUMN IF NOT EXISTS estado_prestamista ENUM('REPORTADO', 'CONFIRMADO') DEFAULT 'REPORTADO' AFTER hora_inicio_proyecto_destino,
ADD COLUMN IF NOT EXISTS estado_prestatario ENUM('PENDIENTE', 'CONFIRMADO') DEFAULT 'PENDIENTE' AFTER estado_prestamista,
ADD COLUMN IF NOT EXISTS tiempo_traslado_minutos INT DEFAULT 0 AFTER estado_prestatario,
ADD FOREIGN KEY (id_proyecto_origen) REFERENCES proyectos_supervisados(id_proyecto) ON DELETE SET NULL,
ADD FOREIGN KEY (id_proyecto_destino) REFERENCES proyectos_supervisados(id_proyecto) ON DELETE SET NULL,
ADD FOREIGN KEY (id_ot_origen) REFERENCES ordenes_trabajo(id_ot) ON DELETE SET NULL,
ADD FOREIGN KEY (id_ot_destino) REFERENCES ordenes_trabajo(id_ot) ON DELETE SET NULL;

-- Índices para prestamos_personal
ALTER TABLE prestamos_personal
ADD INDEX IF NOT EXISTS idx_fecha_prestamo (fecha_prestamo),
ADD INDEX IF NOT EXISTS idx_estados (estado_prestamista, estado_prestatario);

-- Modificar tabla asistencias_biometricas para incluir proyecto y tipo de registro
ALTER TABLE asistencias_biometricas
ADD COLUMN IF NOT EXISTS id_proyecto INT AFTER id_ot,
ADD COLUMN IF NOT EXISTS tipo_registro_detectado VARCHAR(50) AFTER tipo_registro,
ADD COLUMN IF NOT EXISTS minutos_diferencia INT AFTER tipo_registro_detectado,
ADD COLUMN IF NOT EXISTS id_prestamo INT AFTER minutos_diferencia,
ADD FOREIGN KEY (id_proyecto) REFERENCES proyectos_supervisados(id_proyecto) ON DELETE SET NULL,
ADD FOREIGN KEY (id_prestamo) REFERENCES prestamos_personal(id_prestamo) ON DELETE SET NULL;

-- Índices para asistencias_biometricas
ALTER TABLE asistencias_biometricas
ADD INDEX IF NOT EXISTS idx_proyecto (id_proyecto),
ADD INDEX IF NOT EXISTS idx_prestamo (id_prestamo);

-- Vista para reporte consolidado con préstamos
CREATE OR REPLACE VIEW vista_reporte_consolidado AS
SELECT 
  a.id_asistencia,
  a.id_usuario,
  u.nombre_completo as empleado,
  p.nombre_proyecto as proyecto,
  p.numero_ot as ot,
  p.hora_ingreso as hora_ingreso_configurada,
  p.hora_salida as hora_salida_configurada,
  a.fecha_hora,
  TIME(a.fecha_hora) as hora_registro,
  a.tipo_registro,
  a.tipo_registro_detectado,
  a.minutos_diferencia,
  CASE 
    WHEN a.id_prestamo IS NOT NULL THEN 'SI'
    ELSE 'NO'
  END as es_prestamo,
  pr.id_prestamo,
  p_destino.nombre_proyecto as proyecto_destino,
  ot_destino.numero_ot as ot_destino,
  u_prestatario.nombre_completo as supervisor_destino,
  pr.hora_fin_proyecto_origen,
  pr.hora_inicio_proyecto_destino,
  pr.estado_prestamista,
  pr.estado_prestatario,
  a.latitud,
  a.longitud,
  a.direccion,
  a.foto_base64,
  a.score_facial
FROM asistencias_biometricas a
INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
LEFT JOIN proyectos_supervisados p ON a.id_proyecto = p.id_proyecto
LEFT JOIN prestamos_personal pr ON a.id_prestamo = pr.id_prestamo
LEFT JOIN proyectos_supervisados p_destino ON pr.id_proyecto_destino = p_destino.id_proyecto
LEFT JOIN ordenes_trabajo ot_destino ON pr.id_ot_destino = ot_destino.id_ot
LEFT JOIN usuarios u_prestatario ON pr.id_supervisor_prestatario = u_prestatario.id_usuario
ORDER BY a.fecha_hora DESC;

-- Vista para dashboard de supervisor
CREATE OR REPLACE VIEW vista_dashboard_supervisor AS
SELECT 
  p.id_supervisor,
  u.nombre_completo as supervisor,
  p.id_proyecto,
  p.nombre_proyecto,
  p.numero_ot,
  p.hora_ingreso,
  p.hora_salida,
  p.estado,
  COUNT(DISTINCT CASE 
    WHEN DATE(a.fecha_hora) = CURDATE() AND a.tipo_registro = 'ENTRADA' 
    THEN a.id_usuario 
  END) as empleados_presentes_hoy,
  COUNT(DISTINCT CASE 
    WHEN pr.fecha_prestamo = CURDATE() AND pr.estado_prestatario = 'PENDIENTE'
    THEN pr.id_prestamo
  END) as prestamos_pendientes,
  SUM(CASE 
    WHEN DATE(a.fecha_hora) = CURDATE()
    THEN TIMESTAMPDIFF(HOUR, 
      MIN(CASE WHEN a.tipo_registro = 'ENTRADA' THEN a.fecha_hora END),
      MAX(CASE WHEN a.tipo_registro = 'SALIDA' THEN a.fecha_hora END)
    )
  END) as total_horas_hoy
FROM proyectos_supervisados p
INNER JOIN usuarios u ON p.id_supervisor = u.id_usuario
LEFT JOIN asistencias_biometricas a ON p.id_proyecto = a.id_proyecto
LEFT JOIN prestamos_personal pr ON p.id_proyecto = pr.id_proyecto_origen OR p.id_proyecto = pr.id_proyecto_destino
WHERE p.estado = 'ACTIVO'
GROUP BY p.id_proyecto, p.id_supervisor, u.nombre_completo, p.nombre_proyecto, 
         p.numero_ot, p.hora_ingreso, p.hora_salida, p.estado;
