<?php
include '../backend/config/Database.php';
$db = new Database();
$conn = $db->connect();

$sql = "CREATE TABLE IF NOT EXISTS cronograma_asignaciones (
    id_asignacion INT AUTO_INCREMENT PRIMARY KEY,
    id_ot INT NOT NULL,
    id_trabajador INT NOT NULL,
    fecha_asignada DATE NOT NULL,
    id_supervisor INT NOT NULL,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado ENUM('ACTIVA','CANCELADA','COMPLETADA') DEFAULT 'ACTIVA',
    UNIQUE KEY unique_assignment (id_trabajador, fecha_asignada, id_ot),
    INDEX idx_fecha_asignada (fecha_asignada),
    INDEX idx_supervisor (id_supervisor),
    INDEX idx_trabajador (id_trabajador),
    INDEX idx_ot (id_ot),
    CONSTRAINT fk_crono_ot FOREIGN KEY (id_ot) REFERENCES ordenes_trabajo(id_ot) ON DELETE CASCADE,
    CONSTRAINT fk_crono_trabajador FOREIGN KEY (id_trabajador) REFERENCES trabajadores(id_trabajador) ON DELETE CASCADE,
    CONSTRAINT fk_crono_supervisor FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($conn->query($sql)) {
    echo "Tabla cronograma_asignaciones creada o existente.\n";
} else {
    echo "Error creando tabla: " . $conn->error . "\n";
}
?>
