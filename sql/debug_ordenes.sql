-- Verificar OTs activas
SELECT 
  ot.id_ot,
  ot.numero_ot,
  ot.estado,
  c.nombre_razon_social,
  ps.id_proyecto,
  ps.nombre_proyecto,
  ps.estado AS estado_proyecto
FROM ordenes_trabajo ot
LEFT JOIN clientes c ON ot.id_cliente = c.id_cliente
LEFT JOIN proyectos_supervisados ps ON ot.id_ot = ps.id_ot
ORDER BY ot.id_ot DESC;

-- Verificar proyectos
SELECT 
  id_proyecto,
  id_ot,
  nombre_proyecto,
  estado,
  es_externo,
  es_interno
FROM proyectos_supervisados
ORDER BY id_proyecto DESC;
