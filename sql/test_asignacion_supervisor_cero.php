<?php
$payload = [
    'id_ot' => 1,
    'id_trabajador' => 8,
    'fecha_asignada' => date('Y-m-d', strtotime('+1 day')),
    'id_supervisor' => 0,
    'observaciones' => 'Prueba supervisor inexistente'
];

$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($payload)
    ]
];

$context  = stream_context_create($options);
$result = file_get_contents('http://localhost/sergeva-os/backend/api/cronograma_asignaciones.php', false, $context);

if ($result === FALSE) {
    echo "Error en la solicitud";
    exit;
}

echo "Respuesta:\n";
print_r($result);
?>
