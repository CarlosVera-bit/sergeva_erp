<?php
include '../backend/config/Database.php';
$db = new Database();
$conn = $db->connect();

$result = $conn->query("SHOW CREATE TABLE usuarios");
if ($row = $result->fetch_assoc()) {
    echo $row['Create Table'];
}
?>
