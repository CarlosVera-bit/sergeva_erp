-- 1. Create the new contacts table
CREATE TABLE IF NOT EXISTS `clientes_contactos` (
  `id_contacto` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `nombre_completo` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cargo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departamento` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `es_principal` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_contacto`),
  KEY `idx_cliente_contacto` (`id_cliente`),
  CONSTRAINT `fk_cliente_contacto` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Migrate existing data
INSERT INTO `clientes_contactos` (`id_cliente`, `nombre_completo`, `es_principal`)
SELECT `id_cliente`, `contacto_principal`, 1
FROM `clientes`
WHERE `contacto_principal` IS NOT NULL AND `contacto_principal` != '';

-- 3. Remove the old column
ALTER TABLE `clientes` DROP COLUMN `contacto_principal`;
