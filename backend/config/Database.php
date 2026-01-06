<?php
// filepath: backend/config/Database.php

class Database {
    private $host = 'localhost';
    private $db_name = 'sergeva_erp';
    private $user = 'root';
    private $password = '';
    private $conn;

    /**
     * Conectar a la base de datos
     */
    public function connect() {
        $this->conn = new mysqli($this->host, $this->user, $this->password, $this->db_name);
        
        if ($this->conn->connect_error) {
            http_response_code(500);
            die(json_encode(['error' => 'Conexión fallida: ' . $this->conn->connect_error]));
        }
        
        $this->conn->set_charset("utf8mb4");
        return $this->conn;
    }

    /**
     * Obtener la conexión activa
     */
    public function getConnection() {
        return $this->conn;
    }

    /**
     * Cerrar la conexión
     */
    public function closeConnection() {
        if ($this->conn) {
            $this->conn->close();
        }
    }
}