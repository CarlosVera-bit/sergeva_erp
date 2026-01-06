<?php
// filepath: backend/api/terminos.php

// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Manejo de preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/Database.php';
require_once '../config/Response.php';

// Intentar cargar autoloader de Composer para Dompdf si existe
if (file_exists('../../vendor/autoload.php')) {
    require_once '../../vendor/autoload.php';
} elseif (file_exists('../vendor/autoload.php')) {
    require_once '../vendor/autoload.php';
}

use Dompdf\Dompdf;
use Dompdf\Options;

$database = new Database();
$db = $database->connect();

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'check_status':
        checkStatus($db);
        break;
    case 'accept':
        acceptTerms($db);
        break;
    case 'download_pdf':
        downloadPdf($db);
        break;
    default:
        Response::error("Acción no válida", 400);
        break;
}

function checkStatus($db) {
    if (!isset($_GET['usuario_id'])) {
        Response::error("Falta usuario_id", 400);
    }

    $usuario_id = intval($_GET['usuario_id']);

    // 1. Obtener la versión activa de los términos
    $queryTerm = "SELECT id, version, contenido_html FROM terminos_condiciones WHERE estado_activo = 1 ORDER BY id DESC LIMIT 1";
    $stmtTerm = $db->prepare($queryTerm);
    $stmtTerm->execute();
    $resultTerm = $stmtTerm->get_result();
    $activeTerm = $resultTerm->fetch_assoc();

    if (!$activeTerm) {
        // Si no hay términos activos, asumimos que no se requiere aceptación
        Response::success(['status' => 'not_required', 'message' => 'No hay términos activos configurados.']);
    }

    // 2. Verificar si el usuario ya aceptó esta versión específica
    $queryAccept = "SELECT id, fecha_aceptacion FROM usuario_aceptaciones WHERE usuario_id = ? AND termino_id = ? LIMIT 1";
    $stmtAccept = $db->prepare($queryAccept);
    $stmtAccept->bind_param("ii", $usuario_id, $activeTerm['id']);
    $stmtAccept->execute();
    $resultAccept = $stmtAccept->get_result();
    $acceptance = $resultAccept->fetch_assoc();

    if ($acceptance) {
        Response::success([
            'status' => 'accepted',
            'termino_id' => $activeTerm['id'],
            'version' => $activeTerm['version'],
            'contenido_html' => $activeTerm['contenido_html'],
            'fecha_aceptacion' => $acceptance['fecha_aceptacion']
        ]);
    } else {
        Response::success([
            'status' => 'pending',
            'termino_id' => $activeTerm['id'],
            'version' => $activeTerm['version'],
            'contenido_html' => $activeTerm['contenido_html']
        ]);
    }
}

function acceptTerms($db) {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->usuario_id) || !isset($data->termino_id)) {
        error_log("TERMINOS: Datos incompletos - usuario_id: " . (isset($data->usuario_id) ? $data->usuario_id : 'NO') . ", termino_id: " . (isset($data->termino_id) ? $data->termino_id : 'NO'));
        Response::error("Datos incompletos", 400);
    }

    $usuario_id = intval($data->usuario_id);
    $termino_id = intval($data->termino_id);
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $user_agent = $_SERVER['HTTP_USER_AGENT'];

    error_log("TERMINOS: Intentando guardar aceptación - usuario_id: $usuario_id, termino_id: $termino_id, IP: $ip_address");

    // Verificar que el término existe y está activo (opcional, pero recomendado)
    $checkQuery = "SELECT id FROM terminos_condiciones WHERE id = ?";
    $stmtCheck = $db->prepare($checkQuery);
    if (!$stmtCheck) {
        error_log("TERMINOS ERROR: No se pudo preparar query de verificación - " . $db->error);
        Response::error("Error en la base de datos", 500);
    }
    $stmtCheck->bind_param("i", $termino_id);
    $stmtCheck->execute();
    if ($stmtCheck->get_result()->num_rows === 0) {
        error_log("TERMINOS ERROR: El término $termino_id no existe");
        Response::error("El término especificado no existe", 404);
    }

    // Verificar si ya aceptó para evitar duplicados
    $dupQuery = "SELECT id FROM usuario_aceptaciones WHERE usuario_id = ? AND termino_id = ?";
    $stmtDup = $db->prepare($dupQuery);
    if (!$stmtDup) {
        error_log("TERMINOS ERROR: No se pudo preparar query de duplicados - " . $db->error);
        Response::error("Error en la base de datos", 500);
    }
    $stmtDup->bind_param("ii", $usuario_id, $termino_id);
    $stmtDup->execute();
    if ($stmtDup->get_result()->num_rows > 0) {
        error_log("TERMINOS: Usuario $usuario_id ya había aceptado término $termino_id previamente");
        Response::success(['message' => 'Ya aceptado previamente']);
    }

    $query = "INSERT INTO usuario_aceptaciones (usuario_id, termino_id, ip_address, user_agent) VALUES (?, ?, ?, ?)";
    $stmt = $db->prepare($query);
    if (!$stmt) {
        error_log("TERMINOS ERROR: No se pudo preparar query de inserción - " . $db->error);
        Response::error("Error en la base de datos", 500);
    }
    $stmt->bind_param("iiss", $usuario_id, $termino_id, $ip_address, $user_agent);

    if ($stmt->execute()) {
        error_log("TERMINOS SUCCESS: Aceptación guardada correctamente - usuario_id: $usuario_id, termino_id: $termino_id, insert_id: " . $stmt->insert_id);
        Response::success(['message' => 'Términos aceptados correctamente', 'id' => $stmt->insert_id]);
    } else {
        error_log("TERMINOS ERROR: Error al ejecutar inserción - " . $stmt->error);
        Response::error("Error al registrar aceptación: " . $stmt->error, 500);
    }
}

function downloadPdf($db) {
    if (!isset($_GET['usuario_id']) || !isset($_GET['termino_id'])) {
        // Si es GET directo desde navegador, tal vez no sea JSON response lo ideal, pero mantenemos consistencia por error
        die("Faltan parámetros");
    }

    $usuario_id = intval($_GET['usuario_id']);
    $termino_id = intval($_GET['termino_id']);

    // Obtener datos de la aceptación y del término
    $query = "SELECT ua.fecha_aceptacion, ua.ip_address, ua.user_agent, tc.contenido_html, tc.version 
              FROM usuario_aceptaciones ua
              JOIN terminos_condiciones tc ON ua.termino_id = tc.id
              WHERE ua.usuario_id = ? AND ua.termino_id = ?";
    
    $stmt = $db->prepare($query);
    $stmt->bind_param("ii", $usuario_id, $termino_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();

    if (!$data) {
        die("Registro de aceptación no encontrado.");
    }

    // Verificar si Dompdf está cargado
    if (!class_exists('Dompdf\Dompdf')) {
        die("Error: Librería Dompdf no encontrada. Por favor instale 'dompdf/dompdf' vía Composer.");
    }

    // Construir HTML para el PDF
    $html = '
    <html>
    <head>
        <style>
            body { font-family: sans-serif; }
            .footer { position: fixed; bottom: 0; left: 0; right: 0; height: 50px; font-size: 10px; color: #555; border-top: 1px solid #ccc; padding-top: 10px; }
            .content { margin-bottom: 60px; }
        </style>
    </head>
    <body>
        <div class="content">
            <h1>Términos y Condiciones (v' . htmlspecialchars($data['version']) . ')</h1>
            ' . $data['contenido_html'] . '
        </div>
        <div class="footer">
            Aceptado digitalmente por el usuario ID: ' . $usuario_id . ' <br>
            Fecha: ' . $data['fecha_aceptacion'] . ' <br>
            IP: ' . $data['ip_address'] . ' | User Agent: ' . substr($data['user_agent'], 0, 50) . '...
        </div>
    </body>
    </html>';

    $options = new Options();
    $options->set('isHtml5ParserEnabled', true);
    $options->set('isRemoteEnabled', true);

    $dompdf = new Dompdf($options);
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();

    $dompdf->stream("terminos_aceptados_v{$data['version']}.pdf", ["Attachment" => true]);
}
