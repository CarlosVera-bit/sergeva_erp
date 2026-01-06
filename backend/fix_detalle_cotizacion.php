<?php
require_once 'config/Database.php';

$db = new Database();
$conn = $db->connect();

echo "=== VERIFICANDO ESTRUCTURA DE detalle_cotizacion ===\n\n";

// Ver estructura actual
$result = $conn->query("DESCRIBE detalle_cotizacion");
echo "Columnas actuales:\n";
while ($row = $result->fetch_assoc()) {
    echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
}

// Verificar si existe la columna iva_porcentaje
$check = $conn->query("SHOW COLUMNS FROM detalle_cotizacion LIKE 'iva_porcentaje'");
if ($check->num_rows == 0) {
    echo "\n❌ La columna 'iva_porcentaje' NO existe\n";
    echo "Agregando columna...\n";
    
    $sql = "ALTER TABLE detalle_cotizacion 
            ADD COLUMN iva_porcentaje INT NOT NULL DEFAULT 15 
            AFTER precio_unitario";
    
    if ($conn->query($sql)) {
        echo "✅ Columna 'iva_porcentaje' agregada exitosamente\n";
    } else {
        echo "❌ Error al agregar columna: " . $conn->error . "\n";
    }
} else {
    echo "\n✅ La columna 'iva_porcentaje' ya existe\n";
}

// Verificar si existe columna 'iva' (antigua)
$check_old = $conn->query("SHOW COLUMNS FROM detalle_cotizacion LIKE 'iva'");
if ($check_old->num_rows > 0) {
    echo "\n⚠️ La columna antigua 'iva' todavía existe\n";
    echo "Puedes eliminarla si ya no la necesitas con:\n";
    echo "ALTER TABLE detalle_cotizacion DROP COLUMN iva;\n";
}

echo "\n=== ESTRUCTURA FINAL ===\n";
$result = $conn->query("DESCRIBE detalle_cotizacion");
while ($row = $result->fetch_assoc()) {
    echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
}

$db->closeConnection();
