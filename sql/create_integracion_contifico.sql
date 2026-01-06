-- Crear tabla para registrar la integración con Contifico
CREATE TABLE IF NOT EXISTS integracion_contifico (
    id_integracion INT AUTO_INCREMENT PRIMARY KEY,
    id_ot INT NULL,
    numero_documento_contifico VARCHAR(100) NULL,
    fecha_integracion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado_sincronizacion ENUM('pendiente', 'exitoso', 'error', 'reintento') DEFAULT 'pendiente',
    respuesta_contifico TEXT NULL,
    tipo_documento ENUM('FACTURA', 'NOTA_CREDITO', 'GUIA_REMISION') DEFAULT 'FACTURA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ot) REFERENCES ordenes_trabajo(id_ot) ON DELETE SET NULL,
    INDEX idx_estado (estado_sincronizacion),
    INDEX idx_fecha (fecha_integracion),
    INDEX idx_ot (id_ot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar algunos registros de ejemplo para pruebas
INSERT INTO integracion_contifico (id_ot, numero_documento_contifico, estado_sincronizacion, respuesta_contifico, tipo_documento) VALUES
(1, 'FAC-001-001-000000123', 'exitoso', '{"success": true, "numero_factura": "FAC-001-001-000000123"}', 'FACTURA'),
(2, 'FAC-001-001-000000124', 'exitoso', '{"success": true, "numero_factura": "FAC-001-001-000000124"}', 'FACTURA'),
(3, NULL, 'error', '{"error": "Cliente no encontrado en Contifico"}', 'FACTURA'),
(4, NULL, 'pendiente', NULL, 'FACTURA');
