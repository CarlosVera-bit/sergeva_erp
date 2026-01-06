<?php
require_once 'config/Database.php';

$db = new Database();
$conn = $db->connect();

$result = $conn->query('SELECT COUNT(*) as count FROM clientes');
if ($result) {
    $row = $result->fetch_assoc();
    echo 'Clientes en BD: ' . $row['count'] . PHP_EOL;
} else {
    echo 'Error: ' . $conn->error . PHP_EOL;
}

$db->closeConnection();
?>