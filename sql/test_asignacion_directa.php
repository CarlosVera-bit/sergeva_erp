<?php
// Test directo de asignación

$url = 'http://localhost/sergeva-os/backend/api/cronograma_asignaciones.php';

$datos = [
    'id_ot' => 1,
    'id_trabajador' => 10,
    'fecha_asignada' => '2025-12-17',
    'id_supervisor' => 1,
    'observaciones' => 'Test de asignación'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($datos));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "=== TEST DE ASIGNACIÓN DIRECTA ===\n";
echo "URL: $url\n";
echo "Datos enviados:\n";
echo json_encode($datos, JSON_PRETTY_PRINT) . "\n\n";
echo "HTTP Code: $http_code\n";
echo "Respuesta:\n";
echo json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n\n";

// Intentar asignar el segundo trabajador
$datos2 = [
    'id_ot' => 1,
    'id_trabajador' => 11,
    'fecha_asignada' => '2025-12-17',
    'id_supervisor' => 1,
    'observaciones' => 'Test de asignación 2'
];

$ch2 = curl_init($url);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($datos2));
curl_setopt($ch2, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response2 = curl_exec($ch2);
$http_code2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);

echo "=== TEST DE SEGUNDA ASIGNACIÓN ===\n";
echo "Datos enviados:\n";
echo json_encode($datos2, JSON_PRETTY_PRINT) . "\n\n";
echo "HTTP Code: $http_code2\n";
echo "Respuesta:\n";
echo json_encode(json_decode($response2), JSON_PRETTY_PRINT) . "\n\n";

// Verificar asignaciones creadas
$conn = new mysqli('localhost', 'root', '', 'sergeva_erp');
$result = $conn->query("SELECT ca.*, t.nombres, t.apellidos FROM cronograma_asignaciones ca 
                        LEFT JOIN trabajadores t ON ca.id_trabajador = t.id_trabajador
                        WHERE ca.fecha_asignada = '2025-12-17'");

echo "=== ASIGNACIONES CREADAS PARA 2025-12-17 ===\n";
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "- {$row['nombres']} {$row['apellidos']} (ID: {$row['id_trabajador']}) → OT ID: {$row['id_ot']} - Estado: {$row['estado']}\n";
    }
} else {
    echo "No se crearon asignaciones\n";
}
?>