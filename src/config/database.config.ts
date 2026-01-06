/**
 * Configuración global de la base de datos
 * Este archivo contiene las credenciales y configuración para conectarse a MySQL
 */

export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}

/**
 * Configuración de la base de datos MySQL
 * IMPORTANTE: En producción, estas credenciales deben estar en variables de entorno
 */
export const DB_CONFIG: DatabaseConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'sergeva_erp'
};

/**
 * Función para obtener la configuración de la base de datos
 * Útil para servicios que necesitan acceder a la configuración
 */
export function getDatabaseConfig(): DatabaseConfig {
    return { ...DB_CONFIG };
}

/**
 * URL de conexión completa (útil para algunos drivers)
 */
export function getDatabaseUrl(): string {
    return `mysql://${DB_CONFIG.user}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;
}
