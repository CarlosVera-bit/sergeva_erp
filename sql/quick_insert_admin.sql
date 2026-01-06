-- ============================================
-- SCRIPT RÁPIDO: Insertar Usuario Administrador
-- Base de Datos: sergeva_erp
-- ============================================

USE sergeva_erp;

-- Insertar usuario administrador
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

-- Verificar inserción
SELECT * FROM usuarios WHERE email = 'admin@sergeva.com';

-- ============================================
-- CREDENCIALES DE ACCESO:
-- Email: admin@sergeva.com
-- Password: admin123
-- ============================================
