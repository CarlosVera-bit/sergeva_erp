<?php
// filepath: backend/api/upload_evidence.php
// API para subir evidencia fotográfica de órdenes de trabajo
// Soporta: POST (subir imagen), GET (listar evidencias), DELETE (eliminar evidencia)

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Manejar preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/Database.php';
require_once '../config/Response.php';

$db = new Database();
$conn = $db->connect();

$method = $_SERVER['REQUEST_METHOD'];

try {
    // ============================================
    // POST: Subir nueva evidencia fotográfica
    // ============================================
    if ($method === 'POST') {
        // Validar que se recibió un archivo
        if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
            $errorMsg = 'No se recibió ninguna imagen o hubo un error en la carga';
            if (isset($_FILES['imagen']['error'])) {
                switch ($_FILES['imagen']['error']) {
                    case UPLOAD_ERR_INI_SIZE:
                    case UPLOAD_ERR_FORM_SIZE:
                        $errorMsg = 'El archivo es demasiado grande (máximo 10MB)';
                        break;
                    case UPLOAD_ERR_PARTIAL:
                        $errorMsg = 'El archivo se cargó parcialmente';
                        break;
                    case UPLOAD_ERR_NO_FILE:
                        $errorMsg = 'No se seleccionó ningún archivo';
                        break;
                }
            }
            Response::error($errorMsg, 400);
        }

        // Validar parámetros requeridos
        if (!isset($_POST['id_ot']) || !isset($_POST['id_usuario'])) {
            Response::error('Faltan parámetros requeridos: id_ot, id_usuario', 400);
        }

        $idOT = intval($_POST['id_ot']);
        $idUsuario = intval($_POST['id_usuario']);
        $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : null;

        // Validar que la OT existe
        $sqlCheckOT = "SELECT id_ot FROM ordenes_trabajo WHERE id_ot = $idOT";
        $resultCheck = $conn->query($sqlCheckOT);
        if (!$resultCheck || $resultCheck->num_rows === 0) {
            Response::error('La orden de trabajo no existe', 404);
        }

        $file = $_FILES['imagen'];
        $fileName = $file['name'];
        $fileTmpName = $file['tmp_name'];
        $fileSize = $file['size'];
        $fileError = $file['error'];

        // Validar tamaño (10MB máximo)
        $maxSize = 10 * 1024 * 1024; // 10MB en bytes
        if ($fileSize > $maxSize) {
            Response::error('El archivo es demasiado grande. Máximo permitido: 10MB', 400);
        }

        // Obtener extensión del archivo
        $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        // Validar tipo de archivo (solo imágenes)
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($fileExt, $allowedExtensions)) {
            Response::error('Solo se permiten archivos de imagen (jpg, jpeg, png, gif, webp)', 400);
        }

        // Validar MIME type adicional
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $fileTmpName);
        finfo_close($finfo);
        
        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($mimeType, $allowedMimes)) {
            Response::error('El archivo no es una imagen válida', 400);
        }

        // Crear estructura de carpetas dinámica: uploads/evidencias/YYYY/MM/
        $year = date('Y');
        $month = date('m');
        $uploadDir = "../../uploads/evidencias/$year/$month/";
        
        // Crear directorios si no existen
        if (!file_exists($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                Response::error('Error al crear directorio de almacenamiento', 500);
            }
        }

        // Generar nombre único para el archivo
        // Formato: uniqid_nombreoriginal.ext
        $sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($fileName, PATHINFO_FILENAME));
        $uniqueFileName = uniqid() . '_' . $sanitizedName . '.' . $fileExt;
        $targetPath = $uploadDir . $uniqueFileName;

        // Mover archivo a destino final
        if (!move_uploaded_file($fileTmpName, $targetPath)) {
            Response::error('Error al guardar el archivo', 500);
        }

        // Ruta relativa para guardar en BD (desde la raíz del proyecto)
        $rutaRelativa = "uploads/evidencias/$year/$month/" . $uniqueFileName;

        // Insertar registro en base de datos
        $descripcionEscaped = $descripcion ? "'" . $conn->real_escape_string($descripcion) . "'" : "NULL";
        
        $sqlInsert = "INSERT INTO ot_evidencias (id_ot, id_usuario, ruta_imagen, descripcion) 
                      VALUES ($idOT, $idUsuario, '$rutaRelativa', $descripcionEscaped)";
        
        if (!$conn->query($sqlInsert)) {
            // Si falla la inserción, eliminar el archivo subido
            unlink($targetPath);
            Response::error('Error al registrar evidencia en base de datos: ' . $conn->error, 500);
        }

        $idEvidencia = $conn->insert_id;

        // Obtener datos completos de la evidencia recién creada
        $sqlGet = "SELECT e.*, u.nombre_completo as usuario_nombre 
                   FROM ot_evidencias e 
                   LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario 
                   WHERE e.id_evidencia = $idEvidencia";
        $resultGet = $conn->query($sqlGet);
        $evidencia = $resultGet->fetch_assoc();

        Response::success($evidencia, 'Evidencia subida correctamente', 201);
    }
    
    // ============================================
    // GET: Obtener evidencias de una OT
    // ============================================
    else if ($method === 'GET') {
        if (!isset($_GET['id_ot'])) {
            Response::error('Parámetro id_ot requerido', 400);
        }

        $idOT = intval($_GET['id_ot']);

        $sql = "SELECT e.*, u.nombre_completo as usuario_nombre 
                FROM ot_evidencias e 
                LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario 
                WHERE e.id_ot = $idOT 
                ORDER BY e.fecha_subida DESC";
        
        $result = $conn->query($sql);
        
        if (!$result) {
            Response::error('Error al obtener evidencias: ' . $conn->error, 500);
        }

        $evidencias = [];
        while ($row = $result->fetch_assoc()) {
            $evidencias[] = $row;
        }

        Response::success($evidencias, 'Evidencias obtenidas correctamente', 200);
    }
    
    // ============================================
    // DELETE: Eliminar evidencia
    // ============================================
    else if ($method === 'DELETE') {
        // Obtener ID de evidencia desde query string o body
        $idEvidencia = null;
        
        if (isset($_GET['id_evidencia'])) {
            $idEvidencia = intval($_GET['id_evidencia']);
        } else {
            $inputData = json_decode(file_get_contents('php://input'), true);
            if (isset($inputData['id_evidencia'])) {
                $idEvidencia = intval($inputData['id_evidencia']);
            }
        }

        if (!$idEvidencia) {
            Response::error('Parámetro id_evidencia requerido', 400);
        }

        // Obtener ruta del archivo antes de eliminar el registro
        $sqlGet = "SELECT ruta_imagen FROM ot_evidencias WHERE id_evidencia = $idEvidencia";
        $resultGet = $conn->query($sqlGet);
        
        if (!$resultGet || $resultGet->num_rows === 0) {
            Response::error('Evidencia no encontrada', 404);
        }

        $evidencia = $resultGet->fetch_assoc();
        $rutaArchivo = '../../' . $evidencia['ruta_imagen'];

        // Eliminar registro de base de datos
        $sqlDelete = "DELETE FROM ot_evidencias WHERE id_evidencia = $idEvidencia";
        
        if (!$conn->query($sqlDelete)) {
            Response::error('Error al eliminar evidencia: ' . $conn->error, 500);
        }

        // Intentar eliminar archivo físico (no es crítico si falla)
        if (file_exists($rutaArchivo)) {
            @unlink($rutaArchivo);
        }

        Response::success(['id_evidencia' => $idEvidencia], 'Evidencia eliminada correctamente', 200);
    }
    
    else {
        Response::error('Método no permitido', 405);
    }

} catch (Exception $e) {
    error_log('Error en upload_evidence.php: ' . $e->getMessage());
    Response::error('Error del servidor: ' . $e->getMessage(), 500);
}
