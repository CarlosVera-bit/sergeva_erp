import { Injectable } from '@angular/core';

/**
 * Servicio para manejar el hash y comparación de contraseñas
 * Nota: En una aplicación real, el hash de contraseñas debe hacerse en el backend
 * Este servicio simula la comparación de contraseñas hasheadas con bcrypt
 */
@Injectable({
    providedIn: 'root'
})
export class PasswordService {

    /**
     * Compara una contraseña en texto plano con un hash bcrypt
     * NOTA: Esta es una simulación. En producción, esto debe hacerse en el backend
     * 
     * @param plainPassword - Contraseña en texto plano ingresada por el usuario
     * @param hashedPassword - Hash almacenado en la base de datos
     * @returns Promise<boolean> - true si coinciden, false si no
     */
    async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        // SIMULACIÓN: En un entorno real, esto se haría en el backend con bcrypt
        // Por ahora, vamos a simular algunos hashes comunes

        // Si el hash comienza con $2a$, $2b$, o $2y$, es un hash bcrypt real
        if (hashedPassword.startsWith('$2a$') ||
            hashedPassword.startsWith('$2b$') ||
            hashedPassword.startsWith('$2y$')) {

            // Aquí deberías usar una librería como bcryptjs
            // Por ahora, simulamos algunos casos conocidos para desarrollo
            const knownHashes: { [key: string]: string } = {
                // Estos son ejemplos - en producción vendrían de la BD
                'admin123': '$2a$10$rXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKx',
                'joshue123': '$2a$10$aXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKa',
            };

            // Buscar si tenemos un hash conocido para esta contraseña
            for (const [password, hash] of Object.entries(knownHashes)) {
                if (hash === hashedPassword && password === plainPassword) {
                    return true;
                }
            }

            // Si no encontramos coincidencia en los hashes conocidos, retornamos false
            return false;
        }

        // Si no es un hash bcrypt, comparamos directamente (solo para desarrollo/testing)
        // ADVERTENCIA: Esto NO es seguro en producción
        return plainPassword === hashedPassword;
    }

    /**
     * Genera un hash bcrypt de una contraseña
     * NOTA: Esta es una simulación. En producción, esto debe hacerse en el backend
     * 
     * @param plainPassword - Contraseña en texto plano
     * @returns Promise<string> - Hash bcrypt
     */
    async hashPassword(plainPassword: string): Promise<string> {
        // SIMULACIÓN: En producción, usar bcryptjs o similar en el backend
        // Por ahora retornamos un hash simulado
        return `$2a$10$simulated_hash_${plainPassword.length}_${Date.now()}`;
    }

    /**
     * Valida la fortaleza de una contraseña
     * 
     * @param password - Contraseña a validar
     * @returns objeto con resultado de validación
     */
    validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
        strength: 'weak' | 'medium' | 'strong';
    } {
        const errors: string[] = [];
        let strength: 'weak' | 'medium' | 'strong' = 'weak';

        if (password.length < 8) {
            errors.push('La contraseña debe tener al menos 8 caracteres');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Debe contener al menos una letra mayúscula');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Debe contener al menos una letra minúscula');
        }

        if (!/[0-9]/.test(password)) {
            errors.push('Debe contener al menos un número');
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Debe contener al menos un carácter especial');
        }

        // Determinar fortaleza
        if (errors.length === 0) {
            strength = 'strong';
        } else if (errors.length <= 2) {
            strength = 'medium';
        }

        return {
            isValid: errors.length === 0,
            errors,
            strength
        };
    }
}
