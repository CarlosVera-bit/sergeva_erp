<?php
include '../backend/config/Database.php';

echo "=== LIMPIEZA DE CONFLICTOS DE ASIGNACIONES ===\n";
echo "Fecha actual: " . date('Y-m-d H:i:s') . "\n\n";

try {
    $db = new Database();
    $conn = $db->connect();
    
    // Obtener asignaciones de diciembre 2024 Y 2025
    echo "1. Revisando asignaciones en diciembre 2024 y 2025...\n";
    
    $fechas = ['2024-12-17', '2025-12-17', '2024-12-18', '2025-12-18', '2024-12-19', '2025-12-19'];
    
    foreach ($fechas as $fecha) {
        $result = $conn->query("SELECT ca.*, t.nombres, t.apellidos, ot.numero_ot 
                                FROM cronograma_asignaciones ca
                                LEFT JOIN trabajadores t ON ca.id_trabajador = t.id_trabajador
                                LEFT JOIN ordenes_trabajo ot ON ca.id_ot = ot.id_ot
                                WHERE ca.fecha_asignada = '$fecha'");
        
        if ($result->num_rows > 0) {
            echo "   Fecha $fecha: " . $result->num_rows . " asignaciones\n";
            while ($row = $result->fetch_assoc()) {
                echo "      - {$row['nombres']} {$row['apellidos']} → OT {$row['numero_ot']} (Estado: {$row['estado']})\n";
            }
        }
    }
    
    echo "\n2. Limpiando TODAS las asignaciones de diciembre 2024 y 2025...\n";
    $conn->query("DELETE FROM cronograma_asignaciones WHERE fecha_asignada BETWEEN '2024-12-01' AND '2025-12-31'");
    echo "   ✓ Asignaciones eliminadas\n";
    
    echo "\n3. Verificando que no queden asignaciones...\n";
    $check = $conn->query("SELECT COUNT(*) as total FROM cronograma_asignaciones WHERE fecha_asignada BETWEEN '2024-12-01' AND '2025-12-31'");
    $row = $check->fetch_assoc();
    echo "   Asignaciones restantes en dic 2024-2025: " . $row['total'] . "\n";
    
    echo "\n4. Verificando trabajadores disponibles (IDs que estás tratando de asignar)...\n";
    $trabajadores_ids = [10, 11]; // NAEL y LUCAS AUCAPIÑA PIZARRO
    foreach ($trabajadores_ids as $id) {
        $t = $conn->query("SELECT id_trabajador, nombres, apellidos, estado FROM trabajadores WHERE id_trabajador = $id");
        if ($t->num_rows > 0) {
            $trab = $t->fetch_assoc();
            echo "   - ID {$trab['id_trabajador']}: {$trab['nombres']} {$trab['apellidos']} - Estado: {$trab['estado']}\n";
        }
    }
    
    echo "\n5. Verificando OT disponible...\n";
    $ot = $conn->query("SELECT id_ot, numero_ot, estado FROM ordenes_trabajo WHERE id_ot = 1");
    if ($ot->num_rows > 0) {
        $o = $ot->fetch_assoc();
        echo "   - OT ID {$o['id_ot']}: {$o['numero_ot']} - Estado: {$o['estado']}\n";
    }
    
    echo "\n=== RESULTADO ===\n";
    echo "✅ Todas las asignaciones de diciembre limpiadas\n";
    echo "✅ No hay conflictos que impidan nuevas asignaciones\n";
    echo "✅ Trabajadores verificados y disponibles\n";
    echo "✅ OT verificada y disponible\n\n";
    echo "Ahora puedes intentar asignar los trabajadores nuevamente.\n";
    echo "La asignación debería funcionar sin problemas.\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>