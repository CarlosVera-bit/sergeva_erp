<?php
include '../backend/config/Database.php';

echo "=== VERIFICACIÓN DE USUARIOS Y SUPERVISORES ===\n";
echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";

$db = new Database();
$conn = $db->connect();

// Ver usuarios existentes
echo "1. Usuarios existentes en la tabla usuarios:\n";
$result = $conn->query("SELECT id_usuario, nombre_usuario, rol FROM usuarios");
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "   - ID: {$row['id_usuario']} - {$row['nombre_usuario']} - Rol: {$row['rol']}\n";
    }
} else {
    echo "   ⚠️  No hay usuarios en la tabla\n";
}

// Ver trabajadores con rol de supervisor
echo "\n2. Trabajadores que podrían ser supervisores:\n";
$result = $conn->query("
    SELECT id_trabajador, nombres, apellidos, cargo 
    FROM trabajadores 
    WHERE cargo LIKE '%supervisor%' OR cargo LIKE '%jefe%'
    ORDER BY id_trabajador
");
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "   - ID: {$row['id_trabajador']} - {$row['nombres']} {$row['apellidos']} - Cargo: {$row['cargo']}\n";
    }
} else {
    echo "   ⚠️  No hay trabajadores con cargo de supervisor\n";
}

// Ver la estructura de la constraint
echo "\n3. Constraint de la tabla cronograma_asignaciones:\n";
$result = $conn->query("
    SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'sergeva_erp'
    AND TABLE_NAME = 'cronograma_asignaciones'
    AND REFERENCED_TABLE_NAME IS NOT NULL
");
while ($row = $result->fetch_assoc()) {
    echo "   - {$row['CONSTRAINT_NAME']}: {$row['COLUMN_NAME']} -> {$row['REFERENCED_TABLE_NAME']}.{$row['REFERENCED_COLUMN_NAME']}\n";
}

// Verificar si el usuario admin está en la base de datos
echo "\n4. Verificando usuario admin:\n";
$result = $conn->query("SELECT id_usuario, nombre_usuario, rol FROM usuarios WHERE nombre_usuario = 'admin'");
if ($result->num_rows > 0) {
    $admin = $result->fetch_assoc();
    echo "   ✓ Usuario admin existe - ID: {$admin['id_usuario']}\n";
} else {
    echo "   ⚠️  Usuario admin NO existe\n";
    echo "   Creando usuario admin...\n";
    
    $password_hash = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO usuarios (nombre_usuario, password_hash, rol) VALUES ('admin', ?, 'ADMIN')");
    $stmt->bind_param("s", $password_hash);
    
    if ($stmt->execute()) {
        $new_id = $conn->insert_id;
        echo "   ✓ Usuario admin creado con ID: $new_id\n";
    } else {
        echo "   ✗ Error al crear usuario admin: " . $conn->error . "\n";
    }
}

echo "\n=== RESULTADO ===\n";
echo "Verificación completada.\n";
?>
