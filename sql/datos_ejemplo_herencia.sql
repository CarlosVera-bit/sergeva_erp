-- ===================================================================
-- DATOS DE EJEMPLO: HERENCIA DE PROYECTOS
-- ===================================================================

-- 1. Insertar un Proyecto Externo
-- Primero en la tabla padre
INSERT INTO proyectos_supervisados (nombre_proyecto, descripcion, es_externo, es_interno)
VALUES ('Proyecto de Expansión Norte', 'Instalación de fibra en zona norte', TRUE, FALSE);

-- Obtenemos el ID generado (asumiendo que es el 1 para este ejemplo)
-- Luego en la tabla hija correspondiente
INSERT INTO proyectos_externos (id_proyecto, id_cliente, ubicacion_cliente, presupuesto_cotizado)
VALUES (LAST_INSERT_ID(), 1, 'Calle Principal 123, Ciudad', 15000.00);


-- 2. Insertar un Proyecto Interno
-- Primero en la tabla padre
INSERT INTO proyectos_supervisados (nombre_proyecto, descripcion, es_externo, es_interno)
VALUES ('Mantenimiento Servidores', 'Actualización de infraestructura interna', FALSE, TRUE);

-- Luego en la tabla hija correspondiente
INSERT INTO proyectos_internos (id_proyecto, id_departamento, area_solicitante, centro_costos)
VALUES (LAST_INSERT_ID(), 5, 'TI - Infraestructura', 'CC-2025-001');

-- 3. Consulta de ejemplo para ver la "Herencia" (JOIN)
/*
SELECT 
    p.id_proyecto, 
    p.nombre_proyecto,
    CASE 
        WHEN p.es_externo THEN 'Externo'
        WHEN p.es_interno THEN 'Interno'
    END as tipo,
    pe.ubicacion_cliente,
    pi.area_solicitante
FROM proyectos_supervisados p
LEFT JOIN proyectos_externos pe ON p.id_proyecto = pe.id_proyecto
LEFT JOIN proyectos_internos pi ON p.id_proyecto = pi.id_proyecto;
*/
