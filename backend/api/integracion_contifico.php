<?php
// filepath: backend/api/integracion_contifico.php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/Database.php';
require_once '../config/Response.php';

$db = new Database();
$conn = $db->connect();

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Función auxiliar para hacer peticiones a la API de Contifico
 */
function callContificoAPI($endpoint, $method = 'GET', $data = null, $username = null, $password = null) {
    // URL base de Contifico (ajustar según el ambiente)
    $baseUrl = 'https://api.contifico.com/sistema/api/v1';
    
    $url = $baseUrl . $endpoint;
    
    $ch = curl_init($url);
    
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json'
    ];
    
    // Autenticación Basic si se proporcionan credenciales
    if ($username && $password) {
        $auth = base64_encode("$username:$password");
        $headers[] = "Authorization: Basic $auth";
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // En producción, verificar SSL
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    } elseif ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($error) {
        throw new Exception("Error en petición a Contifico: $error");
    }
    
    return [
        'code' => $httpCode,
        'data' => json_decode($response, true)
    ];
}

try {
    switch ($method) {
        case 'GET':
            // Obtener historial de sincronizaciones
            if (isset($_GET['action']) && $_GET['action'] === 'test_connection') {
                // Probar conexión con Contifico
                $username = $_GET['username'] ?? null;
                $password = $_GET['password'] ?? null;
                
                try {
                    $result = callContificoAPI('/cliente?limit=1', 'GET', null, $username, $password);
                    if ($result['code'] === 200) {
                        Response::success(['connected' => true], 'Conexión exitosa con Contifico', 200);
                    } else {
                        Response::error('Error al conectar con Contifico', 400);
                    }
                } catch (Exception $e) {
                    Response::error('Error de conexión: ' . $e->getMessage(), 500);
                }
            } elseif (isset($_GET['id_ot'])) {
                // Obtener sincronizaciones por orden de trabajo
                $id_ot = $conn->real_escape_string($_GET['id_ot']);
                $sql = "SELECT * FROM integracion_contifico WHERE id_ot = '$id_ot' ORDER BY fecha_integracion DESC";
            } else {
                // Obtener todas las sincronizaciones
                $sql = "SELECT id_integracion, id_ot, numero_documento_contifico, fecha_integracion, 
                        estado_sincronizacion, respuesta_contifico, tipo_documento 
                        FROM integracion_contifico 
                        ORDER BY fecha_integracion DESC";
            }
            
            if (isset($sql)) {
                $result = $conn->query($sql);
                
                if (!$result) {
                    Response::error('Error en la consulta: ' . $conn->error, 400);
                }
                
                $data = [];
                while ($row = $result->fetch_assoc()) {
                    $data[] = $row;
                }
                
                Response::success($data, 'Datos obtenidos correctamente', 200);
            }
            break;
            
        case 'POST':
            // Registrar nueva sincronización
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                Response::error('Datos inválidos', 400);
            }
            
            $id_ot = isset($input['id_ot']) ? $conn->real_escape_string($input['id_ot']) : null;
            $numero_documento = isset($input['numero_documento_contifico']) ? $conn->real_escape_string($input['numero_documento_contifico']) : null;
            $estado = $conn->real_escape_string($input['estado_sincronizacion']);
            $respuesta = isset($input['respuesta_contifico']) ? $conn->real_escape_string($input['respuesta_contifico']) : null;
            $tipo_documento = isset($input['tipo_documento']) ? $conn->real_escape_string($input['tipo_documento']) : 'FACTURA';
            
            $sql = "INSERT INTO integracion_contifico 
                    (id_ot, numero_documento_contifico, fecha_integracion, estado_sincronizacion, respuesta_contifico, tipo_documento) 
                    VALUES ('$id_ot', '$numero_documento', NOW(), '$estado', '$respuesta', '$tipo_documento')";
            
            if ($conn->query($sql)) {
                Response::success([
                    'id_integracion' => $conn->insert_id,
                    'message' => 'Sincronización registrada correctamente'
                ], 'Operación exitosa', 201);
            } else {
                Response::error('Error al registrar: ' . $conn->error, 400);
            }
            break;
            
        case 'PUT':
            // Actualizar estado de sincronización
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($_GET['id']) ? $conn->real_escape_string($_GET['id']) : null;
            
            if (!$id || !$input) {
                Response::error('ID o datos inválidos', 400);
            }
            
            $updates = [];
            
            if (isset($input['estado_sincronizacion'])) {
                $estado = $conn->real_escape_string($input['estado_sincronizacion']);
                $updates[] = "estado_sincronizacion = '$estado'";
            }
            
            if (isset($input['respuesta_contifico'])) {
                $respuesta = $conn->real_escape_string($input['respuesta_contifico']);
                $updates[] = "respuesta_contifico = '$respuesta'";
            }
            
            if (isset($input['numero_documento_contifico'])) {
                $numero = $conn->real_escape_string($input['numero_documento_contifico']);
                $updates[] = "numero_documento_contifico = '$numero'";
            }
            
            if (empty($updates)) {
                Response::error('No hay campos para actualizar', 400);
            }
            
            $sql = "UPDATE integracion_contifico SET " . implode(', ', $updates) . " WHERE id_integracion = '$id'";
            
            if ($conn->query($sql)) {
                Response::success(['message' => 'Sincronización actualizada'], 'Operación exitosa', 200);
            } else {
                Response::error('Error al actualizar: ' . $conn->error, 400);
            }
            break;
            
        case 'DELETE':
            // Eliminar registro de sincronización
            $id = isset($_GET['id']) ? $conn->real_escape_string($_GET['id']) : null;
            
            if (!$id) {
                Response::error('ID inválido', 400);
            }
            
            $sql = "DELETE FROM integracion_contifico WHERE id_integracion = '$id'";
            
            if ($conn->query($sql)) {
                Response::success(['message' => 'Sincronización eliminada'], 'Operación exitosa', 200);
            } else {
                Response::error('Error al eliminar: ' . $conn->error, 400);
            }
            break;
            
        default:
            Response::error('Método no permitido', 405);
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}