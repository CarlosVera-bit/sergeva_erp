<?php
include '../backend/config/Database.php';

$db = new Database();
$conn = $db->connect();

echo "=== VERIFICAR TRABAJADORES ESPECÍFICOS ===\n\n";

$nombres = [
    'MELQUI NICANDRO ALAVA NAVARRO',
    'JOSE REYNALDO ALVAREZ CARO',
    'LUCAS AUCAPIÑA PIZARRO',
    'NAEL JONATHAN AUCAPIÑA PIZARRO'
];

foreach ($nombres as $nombre) {
    $parts = explode(' ', $nombre);
    $apellido = array_pop($parts);
    $apellido2 = array_pop($parts);
    $nombres_parte = implode(' ', $parts);
    
    echo "Buscando: $nombre\n";
    
    $stmt = $conn->prepare("
        SELECT id_trabajador, nombres, apellidos, estado 
        FROM trabajadores 
        WHERE CONCAT(nombres, ' ', apellidos) LIKE ?
        LIMIT 1
    ");
    $busqueda = "%$nombre%";
    $stmt->bind_param("s", $busqueda);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        echo "   ✓ ID: {$row['id_trabajador']} - {$row['nombres']} {$row['apellidos']} - Estado: {$row['estado']}\n";
    } else {
        echo "   ✗ NO ENCONTRADO\n";
    }
    echo "\n";
}

// Ver todos los trabajadores que empiezan con esos nombres
echo "=== TODOS LOS TRABAJADORES DISPONIBLES ===\n";
$result = $conn->query("
    SELECT id_trabajador, nombres, apellidos, estado, cargo
    FROM trabajadores 
    WHERE estado = 'activo'
    ORDER BY apellidos, nombres
    LIMIT 20
");

while ($row = $result->fetch_assoc()) {
    echo "ID {$row['id_trabajador']}: {$row['nombres']} {$row['apellidos']} - {$row['cargo']}\n";
}

?>
