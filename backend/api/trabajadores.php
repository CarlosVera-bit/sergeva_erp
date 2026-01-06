<?php
// filepath: backend/api/trabajadores.php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
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

// Función para generar email automáticamente
function generarEmail($nombres, $apellidos, $id) {
    // Primera letra del nombre en minúscula
    $primeraLetra = strtolower(substr($nombres, 0, 1));
    // Apellido completo en minúscula (primer apellido si hay varios)
    $apellido = strtolower(explode(' ', trim($apellidos))[0]);
    // Formato: {letra}{apellido}{id}@sergeva.com
    return $primeraLetra . $apellido . $id . '@sergeva.com';
}

// Función para generar password automáticamente
function generarPassword($nombres, $apellidos) {
    // Primera letra del nombre en minúscula
    $primeraLetra = strtolower(substr($nombres, 0, 1));
    // Apellido completo en minúscula (primer apellido si hay varios)
    $apellido = strtolower(explode(' ', trim($apellidos))[0]);
    // Formato: {letra}{apellido}123**
    return $primeraLetra . $apellido . '123**';
}

try {
    if ($method === 'GET') {
        // Listar todos los trabajadores
        $sql = "SELECT id_trabajador, cedula, nombres, apellidos, email, telefono, direccion, 
                       tipo_contrato, especialidad, fecha_ingreso, estado, tarifa_hora, fecha_registro 
                FROM trabajadores 
                ORDER BY id_trabajador DESC";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            Response::error('Error en la consulta: ' . $conn->error, 400);
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        Response::success($data, 'Trabajadores obtenidos correctamente', 200);
        
    } elseif ($method === 'POST') {
        // Crear nuevo trabajador
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos requeridos
        if (!isset($input['cedula']) || !isset($input['nombres']) || !isset($input['apellidos']) || !isset($input['tipo_contrato']) || !isset($input['fecha_ingreso'])) {
            Response::error('Faltan campos requeridos: cedula, nombres, apellidos, tipo_contrato, fecha_ingreso', 400);
        }
        
        // Verificar si la cédula ya existe
        $cedula = $conn->real_escape_string($input['cedula']);
        $check = $conn->query("SELECT id_trabajador FROM trabajadores WHERE cedula = '$cedula'");
        if ($check->num_rows > 0) {
            Response::error('Ya existe un trabajador con esta cédula', 400);
        }
        
        // Preparar datos
        $nombres = $conn->real_escape_string(trim($input['nombres']));
        $apellidos = $conn->real_escape_string(trim($input['apellidos']));
        $telefono = isset($input['telefono']) ? $conn->real_escape_string($input['telefono']) : null;
        $direccion = isset($input['direccion']) ? $conn->real_escape_string($input['direccion']) : null;
        $tipo_contrato = $conn->real_escape_string($input['tipo_contrato']);
        $especialidad = isset($input['especialidad']) ? $conn->real_escape_string($input['especialidad']) : null;
        $fecha_ingreso = $conn->real_escape_string($input['fecha_ingreso']);
        $estado = isset($input['estado']) ? $conn->real_escape_string($input['estado']) : 'activo';
        $tarifa_hora = isset($input['tarifa_hora']) ? floatval($input['tarifa_hora']) : 0.00;
        
        // Insertar trabajador SIN email y password primero para obtener el ID
        $stmt = $conn->prepare("INSERT INTO trabajadores (cedula, nombres, apellidos, telefono, direccion, tipo_contrato, especialidad, fecha_ingreso, estado, tarifa_hora) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssssssd", $cedula, $nombres, $apellidos, $telefono, $direccion, $tipo_contrato, $especialidad, $fecha_ingreso, $estado, $tarifa_hora);
        
        if (!$stmt->execute()) {
            Response::error('Error al crear trabajador: ' . $conn->error, 500);
        }
        
        $id_trabajador = $stmt->insert_id;
        $stmt->close();
        
        // Generar email y password automáticamente con el ID
        $email = generarEmail($nombres, $apellidos, $id_trabajador);
        $password = generarPassword($nombres, $apellidos);
        
        // Verificar si el email ya existe (por si acaso)
        $check_email = $conn->query("SELECT id_trabajador FROM trabajadores WHERE email = '$email' AND id_trabajador != $id_trabajador");
        if ($check_email->num_rows > 0) {
            // Si el email ya existe, agregar un sufijo único
            $email = generarEmail($nombres, $apellidos, $id_trabajador) . '_' . time();
        }
        
        // Actualizar el trabajador con email y password
        $stmt_update = $conn->prepare("UPDATE trabajadores SET email = ?, password = ? WHERE id_trabajador = ?");
        $stmt_update->bind_param("ssi", $email, $password, $id_trabajador);
        
        if (!$stmt_update->execute()) {
            Response::error('Error al actualizar email y password: ' . $conn->error, 500);
        }
        
        $stmt_update->close();
        
        // Obtener el trabajador completo
        $result = $conn->query("SELECT * FROM trabajadores WHERE id_trabajador = $id_trabajador");
        $trabajador = $result->fetch_assoc();
        
        Response::success($trabajador, 'Trabajador creado correctamente', 201);
        
    } elseif ($method === 'PUT') {
        // Actualizar trabajador existente
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar ID
        if (!isset($input['id_trabajador'])) {
            Response::error('Se requiere el ID del trabajador', 400);
        }
        
        $id = intval($input['id_trabajador']);
        
        // Verificar si el trabajador existe
        $check = $conn->query("SELECT id_trabajador, nombres, apellidos FROM trabajadores WHERE id_trabajador = $id");
        if ($check->num_rows === 0) {
            Response::error('Trabajador no encontrado', 404);
        }
        
        $trabajador_actual = $check->fetch_assoc();
        
        // Si se está actualizando la cédula, verificar que no esté duplicada
        if (isset($input['cedula'])) {
            $cedula = $conn->real_escape_string($input['cedula']);
            $check_cedula = $conn->query("SELECT id_trabajador FROM trabajadores WHERE cedula = '$cedula' AND id_trabajador != $id");
            if ($check_cedula->num_rows > 0) {
                Response::error('Ya existe otro trabajador con esta cédula', 400);
            }
        }
        
        // Construir UPDATE dinámicamente
        $updates = [];
        $types = '';
        $values = [];
        
        $fields = [
            'cedula' => 's',
            'nombres' => 's',
            'apellidos' => 's',
            'telefono' => 's',
            'direccion' => 's',
            'tipo_contrato' => 's',
            'especialidad' => 's',
            'fecha_ingreso' => 's',
            'estado' => 's',
            'tarifa_hora' => 'd'
        ];
        
        $nombres_actualizado = $trabajador_actual['nombres'];
        $apellidos_actualizado = $trabajador_actual['apellidos'];
        
        foreach ($fields as $field => $type) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $types .= $type;
                $value = ($type === 'd') ? floatval($input[$field]) : $conn->real_escape_string($input[$field]);
                $values[] = $value;
                
                // Guardar nombres y apellidos actualizados para regenerar email/password
                if ($field === 'nombres') $nombres_actualizado = $value;
                if ($field === 'apellidos') $apellidos_actualizado = $value;
            }
        }
        
        // Si se actualizaron nombres o apellidos, regenerar email y password
        if (isset($input['nombres']) || isset($input['apellidos'])) {
            $email = generarEmail($nombres_actualizado, $apellidos_actualizado, $id);
            $password = generarPassword($nombres_actualizado, $apellidos_actualizado);
            
            // Verificar si el nuevo email ya existe
            $check_email = $conn->query("SELECT id_trabajador FROM trabajadores WHERE email = '$email' AND id_trabajador != $id");
            if ($check_email->num_rows > 0) {
                $email = generarEmail($nombres_actualizado, $apellidos_actualizado, $id) . '_' . time();
            }
            
            $updates[] = "email = ?";
            $updates[] = "password = ?";
            $types .= 'ss';
            $values[] = $email;
            $values[] = $password;
        }
        
        if (empty($updates)) {
            Response::error('No hay campos para actualizar', 400);
        }
        
        // Agregar ID al final
        $types .= 'i';
        $values[] = $id;
        
        $sql = "UPDATE trabajadores SET " . implode(', ', $updates) . " WHERE id_trabajador = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$values);
        
        if ($stmt->execute()) {
            // Obtener el trabajador actualizado
            $result = $conn->query("SELECT * FROM trabajadores WHERE id_trabajador = $id");
            $trabajador = $result->fetch_assoc();
            
            Response::success($trabajador, 'Trabajador actualizado correctamente', 200);
        } else {
            Response::error('Error al actualizar trabajador: ' . $conn->error, 500);
        }
        
        $stmt->close();
        
    } elseif ($method === 'DELETE') {
        // Eliminar trabajador
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        
        if (!$id) {
            Response::error('Se requiere el ID del trabajador', 400);
        }
        
        // Verificar si el trabajador existe
        $check = $conn->query("SELECT id_trabajador FROM trabajadores WHERE id_trabajador = $id");
        if ($check->num_rows === 0) {
            Response::error('Trabajador no encontrado', 404);
        }
        
        // Intentar eliminar el trabajador
        $stmt = $conn->prepare("DELETE FROM trabajadores WHERE id_trabajador = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            Response::success(null, 'Trabajador eliminado correctamente', 200);
        } else {
            // Verificar si es un error de integridad referencial
            if ($conn->errno === 1451 || $conn->errno === 1452) {
                Response::error('No se puede eliminar el trabajador porque tiene registros asociados (asistencias, usuarios, etc.). Primero debe eliminar o reasignar estos registros.', 400);
            } else {
                Response::error('Error al eliminar trabajador: ' . $conn->error, 500);
            }
        }
        
        $stmt->close();
    }
} catch (Exception $e) {
    Response::error('Error: ' . $e->getMessage(), 500);
} finally {
    $db->closeConnection();
}