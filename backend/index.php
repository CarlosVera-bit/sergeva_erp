<?php
// filepath: backend/index.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'message' => 'API de SERGEVA-OS',
    'version' => '1.0.0',
    'endpoints' => [
        'usuarios' => '/api/usuarios.php',
        'clientes' => '/api/clientes.php',
        'ordenes_trabajo' => '/api/ordenes_trabajo.php',
        'cotizaciones' => '/api/cotizaciones.php',
        'productos' => '/api/productos.php',
        'inventario' => '/api/inventario.php',
        'proveedores' => '/api/proveedores.php',
        'pedidos_compra' => '/api/pedidos_compra.php',
        'trabajadores' => '/api/trabajadores.php',
        'cronograma' => '/api/cronograma.php',
        'registro_horas' => '/api/registro_horas.php',
        'integracion_contifico' => '/api/integracion_contifico.php'
    ]
]);