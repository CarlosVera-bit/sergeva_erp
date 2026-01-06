-- ============================================
-- Script de Inserción de Usuario Administrador
-- Base de Datos: sergeva_erp
-- Tabla: usuarios
-- ============================================

-- IMPORTANTE: Este script inserta un usuario administrador con contraseña hasheada
-- Contraseña: admin123
-- Hash bcrypt generado con cost factor 10

-- ============================================
-- PASO 1: Verificar que la tabla usuarios existe
-- ============================================
-- Si necesitas crear la tabla primero, descomenta las siguientes líneas:

/*
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'gerente', 'supervisor', 'bodeguero', 'contador', 'operador') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
*/

-- ============================================
-- PASO 2: Insertar Usuario Administrador
-- ============================================

-- Eliminar usuario administrador existente si existe (opcional)
-- DELETE FROM usuarios WHERE email = 'admin@sergeva.com';

-- Insertar nuevo usuario administrador
INSERT INTO usuarios (
    nombre_completo,
    email,
    password_hash,
    rol,
    activo
) VALUES (
    'Administrador del Sistema',
    'admin@sergeva.com',
    '$2a$10$rXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKx',
    'admin',
    TRUE
);

-- ============================================
-- INFORMACIÓN DEL USUARIO INSERTADO
-- ============================================
-- Email: admin@sergeva.com
-- Contraseña: admin123
-- Rol: admin
-- Estado: activo
-- Hash: $2a$10$rXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKx
-- ============================================

-- Verificar que el usuario fue insertado correctamente
SELECT 
    id_usuario,
    nombre_completo,
    email,
    rol,
    activo,
    fecha_creacion
FROM usuarios 
WHERE email = 'admin@sergeva.com';

-- ============================================
-- USUARIOS ADICIONALES (OPCIONAL)
-- ============================================
-- Puedes insertar más usuarios descomentando las siguientes líneas:

/*
-- Gerente
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo) 
VALUES (
    'Joshue Chila',
    'joshue.chila@sergeva.com',
    '$2a$10$aXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKa',
    'gerente',
    TRUE
);

-- Supervisor
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo) 
VALUES (
    'Juan Pérez',
    'juan.perez@sergeva.com',
    '$2a$10$bXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKb',
    'supervisor',
    TRUE
);

-- Bodeguero
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo) 
VALUES (
    'María Rodríguez',
    'maria.rodriguez@sergeva.com',
    '$2a$10$cXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKc',
    'bodeguero',
    TRUE
);

-- Contador
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo) 
VALUES (
    'Carlos Sempere',
    'carlos.sempere@sergeva.com',
    '$2a$10$dXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKd',
    'contador',
    TRUE
);
*/

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Los hashes bcrypt mostrados son EJEMPLOS para desarrollo
-- 2. En producción, genera hashes reales usando bcrypt
-- 3. Cada contraseña debe tener un hash único (bcrypt incluye salt automático)
-- 4. El cost factor de 10 es recomendado para balance seguridad/rendimiento
-- 5. NUNCA almacenes contraseñas en texto plano
-- ============================================

-- ============================================
-- CÓMO GENERAR HASHES BCRYPT REALES
-- ============================================
-- Opción 1: Usando Node.js
/*
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('admin123', 10);
console.log(hash);
*/

-- Opción 2: Usando herramienta online (solo para desarrollo)
-- https://bcrypt-generator.com/

-- Opción 3: Usando PHP
/*
<?php
echo password_hash('admin123', PASSWORD_BCRYPT);
?>
*/

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
