<?php
// Test script para debugging de asistencias

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../config/Database.php';

$db = new Database();
$conn = $db->connect();

// Datos de prueba
$testData = [
    'id_usuario' => 3,
    'tipo_registro' => 'ENTRADA',
    'fecha_hora' => '2025-12-11 16:00:00',
    'foto_base64' => 'data:image/jpeg;base64,test',
    'score_facial' => 95.5,
    'latitud' => -0.12345678,
    'longitud' => -78.12345678,
    'precision_gps' => 50.0,
    'direccion' => 'Test Address',
    'dentro_radio' => 1,
    'user_agent' => 'Mozilla Test',
    'ip_address' => '127.0.0.1',
    'id_ot' => null,
    'observaciones' => null,
    'id_proyecto' => 1,
    'tipo_registro_detectado' => 'ENTRADA_PUNTUAL',
    'minutos_diferencia' => 0,
    'id_prestamo' => null
];

try {
    $stmt = $conn->prepare("INSERT INTO asistencias_biometricas 
        (id_usuario, tipo_registro, fecha_hora, foto_base64, score_facial, 
         latitud, longitud, precision_gps, direccion, dentro_radio, 
         user_agent, ip_address, id_ot, observaciones, id_proyecto, 
         tipo_registro_detectado, minutos_diferencia, id_prestamo) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    if (!$stmt) {
        throw new Exception("Error preparando statement: " . $conn->error);
    }
    
    $id_proyecto = isset($testData['id_proyecto']) ? intval($testData['id_proyecto']) : null;
    $tipo_registro_detectado = $testData['tipo_registro_detectado'] ?? null;
    $minutos_diferencia = isset($testData['minutos_diferencia']) ? intval($testData['minutos_diferencia']) : null;
    $id_prestamo = isset($testData['id_prestamo']) ? intval($testData['id_prestamo']) : null;
    $id_ot = isset($testData['id_ot']) ? intval($testData['id_ot']) : null;
    $observaciones = $testData['observaciones'] ?? null;
    
    echo "Valores a insertar:\n";
    echo "id_proyecto: " . var_export($id_proyecto, true) . "\n";
    echo "tipo_registro_detectado: " . var_export($tipo_registro_detectado, true) . "\n";
    echo "minutos_diferencia: " . var_export($minutos_diferencia, true) . "\n";
    echo "id_prestamo: " . var_export($id_prestamo, true) . "\n";
    
    $bind = $stmt->bind_param(
        "isssddddsissisisii",
        $testData['id_usuario'],
        $testData['tipo_registro'],
        $testData['fecha_hora'],
        $testData['foto_base64'],
        $testData['score_facial'],
        $testData['latitud'],
        $testData['longitud'],
        $testData['precision_gps'],
        $testData['direccion'],
        $testData['dentro_radio'],
        $testData['user_agent'],
        $testData['ip_address'],
        $id_ot,
        $observaciones,
        $id_proyecto,
        $tipo_registro_detectado,
        $minutos_diferencia,
        $id_prestamo
    );
    
    if (!$bind) {
        throw new Exception("Error en bind_param: " . $stmt->error);
    }
    
    if ($stmt->execute()) {
        $id = $stmt->insert_id;
        echo json_encode([
            'success' => true,
            'message' => 'Test exitoso',
            'id_asistencia' => $id
        ]);
    } else {
        throw new Exception("Error ejecutando: " . $stmt->error);
    }
    
    $stmt->close();
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}

$db->closeConnection();
?>
