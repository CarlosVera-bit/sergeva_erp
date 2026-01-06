-- ============================================
-- Script SQL para crear la tabla ordenes_trabajo
-- Esta tabla es necesaria para el funcionamiento del módulo de órdenes de trabajo
-- ============================================

CREATE TABLE IF NOT EXISTS ordenes_trabajo (
  id_ot INT AUTO_INCREMENT PRIMARY KEY,
  numero_ot VARCHAR(20) NOT NULL UNIQUE,
  id_cliente INT NOT NULL,
  representante VARCHAR(255) NULL,
  factura VARCHAR(50) NULL,
  id_cotizacion INT NULL,
  id_supervisor INT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin_estimada DATE NULL,
  fecha_fin_real DATE NULL,
  descripcion_trabajo TEXT NOT NULL,
  estado ENUM('pendiente', 'en_proceso', 'pausada', 'completada', 'cancelada') DEFAULT 'pendiente',
  prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
  ubicacion_trabajo VARCHAR(255) NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign Keys
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
  FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id_cotizacion) ON DELETE SET NULL,

  -- Indexes
  INDEX idx_numero_ot (numero_ot),
  INDEX idx_id_cliente (id_cliente),
  INDEX idx_id_supervisor (id_supervisor),
  INDEX idx_estado (estado),
  INDEX idx_prioridad (prioridad),
  INDEX idx_fecha_inicio (fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Verificar que la tabla se creó correctamente
-- ============================================
-- DESCRIBE ordenes_trabajo;