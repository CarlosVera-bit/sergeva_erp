-- ============================================
-- SCRIPT SQL CON HASHES BCRYPT REALES
-- Base de datos: sergeva_erp
-- Generado: 2025-12-08
-- ============================================

USE sergeva_erp;

-- ============================================
-- INSERTAR USUARIOS CON CONTRASEÑAS HASHEADAS
-- ============================================

-- Usuario Administrador
-- Email: admin@sergeva.com | Password: admin123
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo)
VALUES ('Administrador', 'admin@sergeva.com', '$2b$10$6Em4fPoOXe4WAHlJLLtde.mklo2sjA.6ev1ATc9QOeQJ11ODZVbx2', 'admin', TRUE);

-- Usuario Gerente
-- Email: joshue.chila@sergeva.com | Password: joshue123
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo)
VALUES ('Joshue Chila', 'joshue.chila@sergeva.com', '$2b$10$pQFEdIPqRDQYUSNw.DAS9OYQeBUgMMc946duCRZJPiQG6tMQYKG3y', 'gerente', TRUE);

-- Usuario Supervisor
-- Email: juan.perez@sergeva.com | Password: juan123
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo)
VALUES ('Juan Pérez', 'juan.perez@sergeva.com', '$2b$10$g/sTuBWzw/hPl1nfqrI7Yum0ZSsqJF/k2XODflD8NOCOvY3wVTfAS', 'supervisor', TRUE);

-- Usuario Bodeguero
-- Email: maria.rodriguez@sergeva.com | Password: maria123
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo)
VALUES ('María Rodríguez', 'maria.rodriguez@sergeva.com', '$2b$10$oPCbC7UFnAykO3IA.raj6ONNYRCnIF5vBi1t5Ki2R9Y2oa9KsSVvS', 'bodeguero', TRUE);

-- Usuario Contador
-- Email: carlos.sempere@sergeva.com | Password: carlos123
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo)
VALUES ('Carlos Sempere', 'carlos.sempere@sergeva.com', '$2b$10$ziuS6aqFXYyM4voj.t8wNeN8pVtOobCiUypkp9Z4q5ehAKMDezXXK', 'contador', TRUE);

-- ============================================
-- VERIFICAR USUARIOS INSERTADOS
-- ============================================

SELECT 
    id_usuario,
    nombre_completo,
    email,
    rol,
    activo,
    fecha_creacion
FROM usuarios
ORDER BY id_usuario;

-- ============================================
-- CREDENCIALES DE ACCESO
-- ============================================
-- admin@sergeva.com → admin123 (Administrador)
-- joshue.chila@sergeva.com → joshue123 (Gerente)
-- juan.perez@sergeva.com → juan123 (Supervisor)
-- maria.rodriguez@sergeva.com → maria123 (Bodeguero)
-- carlos.sempere@sergeva.com → carlos123 (Contador)
-- ============================================
