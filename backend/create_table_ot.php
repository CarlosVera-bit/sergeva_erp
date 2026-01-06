<?php
// Script para crear la tabla ordenes_trabajo
require_once 'config/Database.php';

$db = new Database();
$conn = $db->connect();

$sql = "
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

  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
  FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id_cotizacion) ON DELETE SET NULL,

  INDEX idx_numero_ot (numero_ot),
  INDEX idx_id_cliente (id_cliente),
  INDEX idx_id_supervisor (id_supervisor),
  INDEX idx_estado (estado),
  INDEX idx_prioridad (prioridad),
  INDEX idx_fecha_inicio (fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

if ($conn->query($sql)) {
    echo "✅ Tabla ordenes_trabajo creada exitosamente\n";
    echo "Verificando estructura...\n";

    $result = $conn->query("DESCRIBE ordenes_trabajo");
    if ($result) {
        echo "Columnas:\n";
        while ($row = $result->fetch_assoc()) {
            echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
        }
    }
} else {
    echo "❌ Error al crear la tabla: " . $conn->error . "\n";
}

$db->closeConnection();
?>