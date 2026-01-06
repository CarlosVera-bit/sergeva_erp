-- Crear tabla detalle_cotizaciones si no existe
CREATE TABLE IF NOT EXISTS detalle_cotizaciones (
    id_detalle INT PRIMARY KEY AUTO_INCREMENT,
    id_cotizacion INT NOT NULL,
    descripcion TEXT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    iva_porcentaje INT NOT NULL DEFAULT 15,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id_cotizacion) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para mejorar rendimiento
CREATE INDEX idx_cotizacion ON detalle_cotizaciones(id_cotizacion);
