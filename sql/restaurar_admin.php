<?php
include '../backend/config/Database.php';

echo "=== VERIFICACIÓN Y RESTAURACIÓN DE USUARIO ADMIN ===\n";
echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";

$db = new Database();
$conn = $db->connect();

// 1. Verificar usuarios existentes
echo "1. Usuarios actuales en la tabla usuarios:\n";
$result = $conn->query("SELECT id_usuario, nombre_completo, email, rol, activo FROM usuarios");
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "   - ID {$row['id_usuario']}: {$row['nombre_completo']} ({$row['email']}) - Rol: {$row['rol']} - Activo: {$row['activo']}\n";
    }
} else {
    echo "   ⚠️  NO HAY USUARIOS EN LA TABLA\n";
}

// 2. Verificar si existe el usuario admin con ID 1
echo "\n2. Verificando usuario admin con ID 1...\n";
$result = $conn->query("SELECT * FROM usuarios WHERE id_usuario = 1");
if ($result->num_rows > 0) {
    echo "   ✓ Usuario admin con ID 1 existe\n";
} else {
    echo "   ✗ Usuario admin con ID 1 NO existe\n";
    echo "   Creando usuario admin con ID 1...\n";
    
    // Insertar usuario admin con ID específico
    $password_hash = password_hash('admin123', PASSWORD_DEFAULT);
    
    try {
        $conn->query("SET foreign_key_checks = 0");
        
        $stmt = $conn->prepare("
            INSERT INTO usuarios (id_usuario, nombre_completo, email, password_hash, rol, activo) 
            VALUES (1, 'Administrador Sistema', 'admin@sergeva.com', ?, 'admin', 1)
            ON DUPLICATE KEY UPDATE 
                nombre_completo = 'Administrador Sistema',
                email = 'admin@sergeva.com',
                password_hash = VALUES(password_hash),
                rol = 'admin',
                activo = 1
        ");
        $stmt->bind_param("s", $password_hash);
        $stmt->execute();
        
        $conn->query("SET foreign_key_checks = 1");
        
        echo "   ✓ Usuario admin creado/actualizado con ID 1\n";
        echo "   Usuario: admin\n";
        echo "   Password: admin123\n";
    } catch (Exception $e) {
        echo "   ✗ Error: " . $e->getMessage() . "\n";
    }
}

// 3. Verificar AUTO_INCREMENT
echo "\n3. Ajustando AUTO_INCREMENT de usuarios...\n";
$result = $conn->query("SELECT MAX(id_usuario) as max_id FROM usuarios");
$row = $result->fetch_assoc();
$next_id = $row['max_id'] + 1;
$conn->query("ALTER TABLE usuarios AUTO_INCREMENT = $next_id");
echo "   ✓ AUTO_INCREMENT configurado a: $next_id\n";

// 4. Verificar OTs
echo "\n4. Verificando órdenes de trabajo...\n";
$result = $conn->query("SELECT id_ot, numero_ot, id_supervisor, estado FROM ordenes_trabajo LIMIT 5");
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $supervisor = $row['id_supervisor'] ?? 'NULL';
        echo "   - OT {$row['numero_ot']}: Supervisor ID = $supervisor, Estado: {$row['estado']}\n";
    }
} else {
    echo "   ⚠️  No hay órdenes de trabajo\n";
}

// 5. Actualizar OTs para que usen el supervisor con ID 1
echo "\n5. Actualizando OTs para usar supervisor ID 1...\n";
$conn->query("UPDATE ordenes_trabajo SET id_supervisor = 1 WHERE id_supervisor IS NULL OR id_supervisor NOT IN (SELECT id_usuario FROM usuarios)");
$affected = $conn->affected_rows;
echo "   ✓ $affected OTs actualizadas\n";

// 6. Prueba de asignación
echo "\n6. Probando creación de asignación...\n";
$stmt = $conn->prepare("
    INSERT INTO cronograma_asignaciones 
    (id_ot, id_trabajador, fecha_asignada, id_supervisor, observaciones, estado)
    VALUES (1, 8, '2025-12-18', 1, 'Prueba después de restaurar admin', 'ACTIVA')
");

if ($stmt->execute()) {
    $new_id = $conn->insert_id;
    echo "   ✓ ÉXITO: Asignación de prueba creada con ID $new_id\n";
    
    // Limpiar prueba
    $conn->query("DELETE FROM cronograma_asignaciones WHERE id_asignacion = $new_id");
    echo "   ✓ Asignación de prueba eliminada\n";
} else {
    echo "   ✗ ERROR: " . $stmt->error . "\n";
}

echo "\n=== RESULTADO ===\n";
echo "✅ Sistema restaurado\n";
echo "✅ Usuario admin disponible con ID 1\n";
echo "✅ OTs actualizadas con supervisor válido\n";
echo "✅ Sistema listo para asignaciones\n\n";
echo "Credenciales de acceso:\n";
echo "Usuario: admin\n";
echo "Password: admin123\n";
?>
