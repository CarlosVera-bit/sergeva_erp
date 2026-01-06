<?php
include '../backend/config/Database.php';

echo "=== VERIFICACIÓN COMPLETA PARA DEBUG ===\n\n";

$db = new Database();
$conn = $db->connect();

// 1. Verificar usuarios existentes
echo "1. Usuarios en tabla usuarios:\n";
$result = $conn->query("SELECT id_usuario, nombre_completo, email, rol FROM usuarios WHERE activo = 1");
while($row = $result->fetch_assoc()) {
    echo "   - ID {$row['id_usuario']}: {$row['nombre_completo']} ({$row['email']}) - Rol: {$row['rol']}\n";
}

// 2. Verificar OTs
echo "\n2. Órdenes de Trabajo:\n";
$result = $conn->query("SELECT id_ot, numero_ot, id_supervisor, estado FROM ordenes_trabajo WHERE estado != 'completado'");
while($row = $result->fetch_assoc()) {
    $supervisor = $row['id_supervisor'] ?? 'NULL';
    echo "   - OT ID {$row['id_ot']} ({$row['numero_ot']}): Supervisor ID = $supervisor, Estado: {$row['estado']}\n";
}

// 3. Verificar constraint
echo "\n3. Constraint en cronograma_asignaciones:\n";
$result = $conn->query("
    SHOW CREATE TABLE cronograma_asignaciones
");
$row = $result->fetch_assoc();
echo "   " . $row['Create Table'] . "\n";

// 4. Probar asignación
echo "\n4. Intentando crear asignación de prueba...\n";
$test_data = [
    'id_ot' => 1,
    'id_trabajador' => 10,
    'fecha_asignada' => '2025-12-18',
    'id_supervisor' => 1,
    'observaciones' => 'Test desde script'
];

echo "   Datos: " . json_encode($test_data, JSON_PRETTY_PRINT) . "\n";

$stmt = $conn->prepare("
    INSERT INTO cronograma_asignaciones 
    (id_ot, id_trabajador, fecha_asignada, id_supervisor, observaciones, estado)
    VALUES (?, ?, ?, ?, ?, 'ACTIVA')
");
$stmt->bind_param("iisis", 
    $test_data['id_ot'],
    $test_data['id_trabajador'],
    $test_data['fecha_asignada'],
    $test_data['id_supervisor'],
    $test_data['observaciones']
);

if ($stmt->execute()) {
    echo "   ✓ ÉXITO: Asignación creada con ID " . $conn->insert_id . "\n";
    
    // Limpiarla
    $conn->query("DELETE FROM cronograma_asignaciones WHERE id_asignacion = " . $conn->insert_id);
    echo "   ✓ Asignación de prueba eliminada\n";
} else {
    echo "   ✗ ERROR: " . $stmt->error . "\n";
}

echo "\n=== FIN ===\n";
?>
