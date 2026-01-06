-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 02-01-2026 a las 03:17:00
-- Versión del servidor: 8.4.7
-- Versión de PHP: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sergeva_erp`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `trabajadores`
--

DROP TABLE IF EXISTS `trabajadores`;
CREATE TABLE IF NOT EXISTS `trabajadores` (
  `id_trabajador` int NOT NULL AUTO_INCREMENT,
  `cedula` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `tipo_contrato` enum('afiliado','por_horas','temporal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `especialidad` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_ingreso` date NOT NULL,
  `estado` enum('activo','inactivo','vacaciones','suspendido') COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `tarifa_hora` decimal(8,2) DEFAULT '0.00',
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_trabajador`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `trabajadores`
--

INSERT INTO `trabajadores` (`id_trabajador`, `cedula`, `nombres`, `apellidos`, `email`, `password`, `telefono`, `direccion`, `tipo_contrato`, `especialidad`, `fecha_ingreso`, `estado`, `tarifa_hora`, `fecha_registro`) VALUES
(7, '0900000001', 'MELQUI NICANDRO', 'ALAVA NAVARRO', 'malava7@sergeva.com', 'malava123**', NULL, NULL, 'por_horas', 'Eléctrico - Mecanico - Corte Laser', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(8, '0900000002', 'JOSE REYNALDO', 'ALVAREZ CARO', 'jalvarez8@sergeva.com', 'jalvarez123**', NULL, NULL, 'afiliado', 'Supervisor', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(9, '0900000003', 'NAEL JONATHAN', 'AUCAPIÑA PIZARRO', 'naucapiña9@sergeva.com', 'naucapiña123**', NULL, NULL, 'afiliado', 'Bodega', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(10, '0900000004', 'LUCAS', 'AUCAPIÑA PIZARRO', 'laucapiña10@sergeva.com', 'laucapiña123**', NULL, NULL, 'por_horas', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(11, '0900000005', 'HENRRY', 'AVILES PINCAY', 'haviles11@sergeva.com', 'haviles123**', NULL, NULL, 'afiliado', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(12, '0900000006', 'NOEL FERNANDO', 'BRAVO CORTEZ', 'nbravo12@sergeva.com', 'nbravo123**', NULL, NULL, 'por_horas', 'Chofer - Ayudante Mecanico', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(13, '0900000007', 'JONATHAN MAURICIO', 'CARDENAS ORELLANA', 'jcardenas13@sergeva.com', 'jcardenas123**', NULL, NULL, 'afiliado', 'Soldador', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(14, '0900000008', 'ESTIVEN ANDRES', 'CARRION LINO', 'ecarrion14@sergeva.com', 'ecarrion123**', NULL, NULL, 'por_horas', 'Albañil - Ayudante Mecanico', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(15, '0900000009', 'HOMERO', 'CEDEÑO BRAVO', 'hcedeño15@sergeva.com', 'hcedeño123**', NULL, NULL, 'afiliado', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(16, '0900000010', 'JOSELINE', 'CHACHA PINCAY', 'jchacha16@sergeva.com', 'jchacha123**', NULL, NULL, 'afiliado', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(17, '0900000011', 'CAROLINA', 'CHACHA PINCAY', 'cchacha17@sergeva.com', 'cchacha123**', NULL, NULL, 'afiliado', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(18, '0900000012', 'JORGE', 'CHACHA PINCAY', 'jchacha18@sergeva.com', 'jchacha123**', NULL, NULL, 'por_horas', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(19, '0900000013', 'GUIDO ALBERTO', 'CHONILLO MOLINERO', 'gchonillo19@sergeva.com', 'gchonillo123**', NULL, NULL, 'por_horas', 'Mecanico', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(20, '0900000014', 'LUIS ADRIAN', 'CORTEZ PEREZ', 'lcortez20@sergeva.com', 'lcortez123**', NULL, NULL, 'por_horas', 'Ayudante Mecanico', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(21, '0900000015', 'PEDRO', 'FERNANDEZ', 'pfernandez21@sergeva.com', 'pfernandez123**', NULL, NULL, 'por_horas', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(22, '0900000016', 'GEOVANNY MARTIN', 'GORDILLO HIDALGO', 'ggordillo22@sergeva.com', 'ggordillo123**', NULL, NULL, 'por_horas', 'Soldador', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(23, '0900000017', 'RONALD FERNANDO', 'GUAMAN CABEZAS', 'rguaman23@sergeva.com', 'rguaman123**', NULL, NULL, 'por_horas', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(24, '0900000018', 'JUAN CARLOS', 'GUANOLUISA CASTRO', 'jguanoluisa24@sergeva.com', 'jguanoluisa123**', NULL, NULL, 'por_horas', 'Montacarguista - Mecanico', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(25, '0900000019', 'TOMAS EMILIO', 'GUTIERREZ LUZURIAGA', 'tgutierrez25@sergeva.com', 'tgutierrez123**', NULL, NULL, 'por_horas', 'Soldador', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(26, '0900000020', 'ELKIN EMILIO', 'GUTIERREZ MONTESE', 'egutierrez26@sergeva.com', 'egutierrez123**', NULL, NULL, 'por_horas', 'Ayudante Tornero', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(27, '0900000021', 'OMAR ALEXANDER', 'LIMONES LINO', 'olimones27@sergeva.com', 'olimones123**', NULL, NULL, 'por_horas', 'Mecanico', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(28, '0900000022', 'ALDO AGUSTIN', 'LIMONES RAMIREZ', 'alimones28@sergeva.com', 'alimones123**', NULL, NULL, 'afiliado', 'Armador - Soldador', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(29, '0900000023', 'AIDHAN ROBERTO', 'LOPEZ PINCAY', 'alopez29@sergeva.com', 'alopez123**', NULL, NULL, 'por_horas', 'Ayudante Mecanico - Corte Laser', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(30, '0900000024', 'ENRIQUE', 'MARTILLO', 'emartillo30@sergeva.com', 'emartillo123**', NULL, NULL, 'por_horas', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(31, '0900000025', 'IVAN EDUARDO', 'MARTILLO ALCIVAR', 'imartillo31@sergeva.com', 'imartillo123**', NULL, NULL, 'por_horas', 'Mecanico', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(32, '0900000026', 'MIGUEL ORLANDO', 'MARTILLO MARTINEZ', 'mmartillo32@sergeva.com', 'mmartillo123**', NULL, NULL, 'afiliado', 'Soldador', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(33, '0900000027', 'MIGUEL ANGEL', 'MELENDEZ FIGUEROA', 'mmelendez33@sergeva.com', 'mmelendez123**', NULL, NULL, 'por_horas', 'Mecanico', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(34, '0900000028', 'SERGIO MAURICIO', 'MENDOZA SERRANO', 'smendoza34@sergeva.com', 'smendoza123**', NULL, NULL, 'por_horas', 'Supervisor', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(35, '0900000029', 'IVANA', 'MITE CHAVEZ', 'imite35@sergeva.com', 'imite123**', NULL, NULL, 'afiliado', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(36, '0900000030', 'LUIS JAVIER', 'MONTES VAZQUEZ', 'lmontes36@sergeva.com', 'lmontes123**', NULL, NULL, 'por_horas', 'Supervisor Campo - Mecanico', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(37, '0900000031', 'FREDDY DARWIN', 'MORAN RUIZ', 'fmoran37@sergeva.com', 'fmoran123**', NULL, NULL, 'por_horas', 'Supervisor', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(38, '0900000032', 'DARWIN LEANDRO', 'MORAN ZAMBRANO', 'dmoran38@sergeva.com', 'dmoran123**', NULL, NULL, 'por_horas', 'Mecanico - Ayudante Soldador', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(39, '0900000033', 'VICTOR ALBERTO', 'MORAN ZAMBRANO', 'vmoran39@sergeva.com', 'vmoran123**', NULL, NULL, 'afiliado', 'Soldador', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(40, '0900000034', 'IRMO', 'MORANTE', 'imorante40@sergeva.com', 'imorante123**', NULL, NULL, 'por_horas', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(41, '0900000035', 'WILLY LUCIANO', 'MOREIRA PEÑA', 'wmoreira41@sergeva.com', 'wmoreira123**', NULL, NULL, 'por_horas', 'Ayudante Mecanico', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(42, '0900000036', 'WESLEY', 'ORDOÑEZ VALENCIA', 'wordoñez42@sergeva.com', 'wordoñez123**', NULL, NULL, 'afiliado', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(43, '0900000037', 'JOHAN', 'PINCAY', 'jpincay43@sergeva.com', 'jpincay123**', NULL, NULL, 'por_horas', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(44, '0900000038', 'JOHN', 'PINCAY BONE', 'jpincay44@sergeva.com', 'jpincay123**', NULL, NULL, 'afiliado', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(45, '0900000039', 'JAIME JACINTO', 'PINCAY PINCAY', 'jpincay45@sergeva.com', 'jpincay123**', NULL, NULL, 'por_horas', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(46, '0900000040', 'YANORI', 'QUIMIZ CHAVEZ', 'yquimiz46@sergeva.com', 'yquimiz123**', NULL, NULL, 'afiliado', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(47, '0900000041', 'JUAN MANUEL', 'RAMIREZ MERO', 'jramirez47@sergeva.com', 'jramirez123**', NULL, NULL, 'por_horas', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(48, '0900000042', 'LUIS ALBERTO', 'RAMIREZ RIVERA', 'lramirez48@sergeva.com', 'lramirez123**', NULL, NULL, 'por_horas', 'Tornero', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(49, '0900000043', 'MARIA FERNANDA', 'REYES CUIN', 'mreyes49@sergeva.com', 'mreyes123**', NULL, NULL, 'por_horas', 'Supervisor Campo', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(50, '0900000044', 'WILMER ANTONIO', 'RIVAS GOMEZ', 'wrivas50@sergeva.com', 'wrivas123**', NULL, NULL, 'por_horas', 'Supervisor Campo - Mecanico', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(51, '0900000045', 'ALDO ALEJANDRO', 'RODRIGUEZ CHOEZ', 'arodriguez51@sergeva.com', 'arodriguez123**', NULL, NULL, 'por_horas', 'Mecanico - Soldador - Pintor', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(52, '0900000046', 'CAROLINA', 'ROMERO BRAVO', 'cromero52@sergeva.com', 'cromero123**', NULL, NULL, 'por_horas', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(53, '0900000047', 'SAMUEL', 'SOLANO', 'ssolano53@sergeva.com', 'ssolano123**', NULL, NULL, 'afiliado', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(54, '0900000048', 'MILTON FERNANDO', 'SOLANO CRUZ', 'msolano54@sergeva.com', 'msolano123**', NULL, NULL, 'afiliado', 'Eléctrico - Mecanico', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(55, '0900000049', 'LUIS ELIAS', 'TAGUA YAGLOA', 'ltagua55@sergeva.com', 'ltagua123**', NULL, NULL, 'por_horas', 'Ayudante', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(56, '0900000050', 'SERGIO WILTON', 'TIGUA PILLIGUA', 'stigua56@sergeva.com', 'stigua123**', NULL, NULL, 'por_horas', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(57, '0900000051', 'CESAR', 'VALDIVIEZO', 'cvaldiviezo57@sergeva.com', 'cvaldiviezo123**', NULL, NULL, 'por_horas', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(58, '0900000052', 'PEDRO LEONARDO', 'YAGUAL VERA', 'pyagual58@sergeva.com', 'pyagual123**', NULL, NULL, 'por_horas', 'Mecanico - Soldador', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(59, '0900000053', 'JONATHAN DANNY', 'ZAMORA SANTANA', 'jzamora59@sergeva.com', 'jzamora123**', NULL, NULL, 'afiliado', 'Soldador - Armador', '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(60, '0900000054', 'ROSA', 'SERRANO', 'rserrano60@sergeva.com', 'rserrano123**', NULL, NULL, 'por_horas', NULL, '2025-01-01', 'activo', 0.00, '2025-12-18 13:32:44'),
(65, '0987451458', 'CARLOS', 'VERA ', NULL, NULL, '0987436059', 'BASTION CITY', 'afiliado', 'OBRERO PASANTE', '2026-01-01', 'activo', 0.00, '2026-01-02 03:16:00');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
