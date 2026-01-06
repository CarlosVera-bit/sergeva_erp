-- Tabla para gestionar las versiones de los Términos y Condiciones
CREATE TABLE IF NOT EXISTS `terminos_condiciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `version` VARCHAR(50) NOT NULL COMMENT 'Identificador de la versión (ej. 1.0, 2023-A)',
  `contenido_html` LONGTEXT NOT NULL COMMENT 'El texto completo de los términos en formato HTML',
  `fecha_vigencia` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha a partir de la cual esta versión es válida',
  `estado_activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1: Activo, 0: Inactivo. Solo debería haber uno activo a la vez',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_estado` (`estado_activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para auditoría de aceptaciones
CREATE TABLE IF NOT EXISTS `usuario_aceptaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL COMMENT 'ID del usuario que acepta',
  `termino_id` INT NOT NULL COMMENT 'ID de la versión de términos aceptada',
  `fecha_aceptacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(45) NOT NULL COMMENT 'IP desde donde se aceptó (IPv4 o IPv6)',
  `user_agent` TEXT NOT NULL COMMENT 'Navegador y SO del usuario',
  FOREIGN KEY (`termino_id`) REFERENCES `terminos_condiciones`(`id`),
  -- Asumiendo que existe una tabla de usuarios, si no, se puede omitir o ajustar la FK
  -- FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`), 
  INDEX `idx_usuario_termino` (`usuario_id`, `termino_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar una versión inicial de prueba (Opcional)
INSERT INTO `terminos_condiciones` (`version`, `contenido_html`, `estado_activo`) 
SELECT '1.0', '<h1>Términos y Condiciones de Uso</h1><h2>1. Aceptación de los Términos</h2><p>Al utilizar esta aplicación de registro de asistencia, usted acepta expresamente estos términos y condiciones en su totalidad. Si no está de acuerdo con estos términos, no debe utilizar esta aplicación.</p><h2>2. Uso de Datos Biométricos</h2><p>Nuestra aplicación utiliza tecnología de reconocimiento facial para verificar su identidad durante el registro de asistencia. Al aceptar estos términos, usted autoriza expresamente:</p><ul><li>La captura de fotografías de su rostro durante cada registro de entrada y salida</li><li>El procesamiento de sus datos biométricos faciales para verificación de identidad</li><li>El almacenamiento seguro de estas imágenes en nuestros servidores</li><li>El uso de algoritmos de comparación facial para validar su identidad</li></ul><h2>3. Uso de Datos de Geolocalización</h2><p>La aplicación requiere acceso a su ubicación GPS para:</p><ul><li>Verificar que se encuentra en el lugar de trabajo autorizado</li><li>Registrar la ubicación exacta de cada entrada y salida</li><li>Generar reportes de asistencia con información geográfica</li><li>Validar el cumplimiento de políticas de trabajo remoto o presencial</li></ul><h2>4. Privacidad y Seguridad de Datos</h2><p>Nos comprometemos a:</p><ul><li>Proteger sus datos personales y biométricos con medidas de seguridad apropiadas</li><li>No compartir sus datos con terceros sin su consentimiento expreso</li><li>Utilizar sus datos únicamente para fines de control de asistencia laboral</li><li>Cumplir con todas las regulaciones de protección de datos aplicables</li></ul><h2>5. Derechos del Usuario</h2><p>Usted tiene derecho a:</p><ul><li>Acceder a sus datos personales almacenados</li><li>Solicitar la corrección de datos inexactos</li><li>Solicitar la eliminación de sus datos (sujeto a obligaciones legales de retención)</li><li>Revocar su consentimiento en cualquier momento</li></ul><h2>6. Uso Aceptable</h2><p>Usted se compromete a:</p><ul><li>Utilizar la aplicación únicamente para registrar su propia asistencia</li><li>No intentar suplantar la identidad de otros usuarios</li><li>No manipular o falsificar datos de ubicación</li><li>Reportar cualquier problema técnico o de seguridad detectado</li></ul><h2>7. Modificaciones</h2><p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en la aplicación.</p><h2>8. Contacto</h2><p>Para cualquier consulta sobre estos términos o sobre el tratamiento de sus datos, puede contactarnos a través de los canales oficiales de la empresa.</p><p><strong>Última actualización:</strong> Diciembre 2025</p>', 1
WHERE NOT EXISTS (SELECT 1 FROM `terminos_condiciones` LIMIT 1);


