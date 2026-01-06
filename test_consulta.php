<?php
require_once 'backend/config/Database.php';
$db = new Database();
$conn = $db->connect();

echo "=== VERIFICANDO CONSULTA PARA PROYECTO GUAYAQUIL (ID: 4) ===\n";

$id_proyecto = 4;
$sql = "SELECT COUNT(DISTINCT entrada.id_usuario) as personal_asignado
        FROM asistencias_biometricas entrada
        WHERE entrada.id_proyecto = $id_proyecto
          AND DATE(entrada.fecha_hora) = CURDATE()
          AND entrada.tipo_registro LIKE 'ENTRADA%'
          AND NOT EXISTS (
            SELECT 1 FROM asistencias_biometricas salida
            WHERE salida.id_usuario = entrada.id_usuario
              AND salida.id_proyecto = entrada.id_proyecto
              AND DATE(salida.fecha_hora) = CURDATE()
              AND salida.tipo_registro LIKE 'SALIDA%'
              AND salida.fecha_hora > entrada.fecha_hora
          )";

$result = $conn->query($sql);
$row = $result->fetch_assoc();
echo "Personal asignado: {$row['personal_asignado']}\n";

echo "\n=== DETALLES DE ENTRADAS SIN SALIDA PARA GUAYAQUIL ===\n";
$sql2 = "SELECT u.nombre_completo, entrada.fecha_hora, entrada.tipo_registro
         FROM asistencias_biometricas entrada
         JOIN usuarios u ON entrada.id_usuario = u.id_usuario
         WHERE entrada.id_proyecto = $id_proyecto
           AND DATE(entrada.fecha_hora) = CURDATE()
           AND entrada.tipo_registro LIKE 'ENTRADA%'
           AND NOT EXISTS (
             SELECT 1 FROM asistencias_biometricas salida
             WHERE salida.id_usuario = entrada.id_usuario
               AND salida.id_proyecto = entrada.id_proyecto
               AND DATE(salida.fecha_hora) = CURDATE()
               AND salida.tipo_registro LIKE 'SALIDA%'
               AND salida.fecha_hora > entrada.fecha_hora
           )
         ORDER BY entrada.fecha_hora DESC";

$result2 = $conn->query($sql2);
while($row2 = $result2->fetch_assoc()) {
    echo "Usuario: {$row2['nombre_completo']} | Entrada: {$row2['fecha_hora']} | Tipo: {$row2['tipo_registro']}\n";
}
?>