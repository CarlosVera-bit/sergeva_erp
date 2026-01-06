/**
 * Script para generar hashes bcrypt de contraseñas
 * Ejecutar: node sql/generate-password-hash.js
 * 
 * IMPORTANTE: Primero instala bcryptjs:
 * npm install bcryptjs
 */

import bcrypt from 'bcryptjs';

// Contraseñas a hashear
const passwords = [
    { user: 'Administrador', email: 'admin@sergeva.com', password: 'admin123' },
    { user: 'Joshue Chila', email: 'joshue.chila@sergeva.com', password: 'joshue123' },
    { user: 'Juan Pérez', email: 'juan.perez@sergeva.com', password: 'juan123' },
    { user: 'María Rodríguez', email: 'maria.rodriguez@sergeva.com', password: 'maria123' },
    { user: 'Carlos Sempere', email: 'carlos.sempere@sergeva.com', password: 'carlos123' },
];

// Cost factor (10 es el recomendado)
const saltRounds = 10;

console.log('='.repeat(80));
console.log('GENERADOR DE HASHES BCRYPT PARA USUARIOS');
console.log('='.repeat(80));
console.log('');

async function generateHashes() {
    console.log('Generando hashes bcrypt...\n');

    for (const item of passwords) {
        const hash = await bcrypt.hash(item.password, saltRounds);

        console.log(`Usuario: ${item.user}`);
        console.log(`Email: ${item.email}`);
        console.log(`Password: ${item.password}`);
        console.log(`Hash: ${hash}`);
        console.log('');
        console.log(`-- SQL INSERT:`);
        console.log(`INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo)`);
        console.log(`VALUES ('${item.user}', '${item.email}', '${hash}', 'admin', TRUE);`);
        console.log('-'.repeat(80));
        console.log('');
    }

    console.log('='.repeat(80));
    console.log('SCRIPT SQL COMPLETO');
    console.log('='.repeat(80));
    console.log('');

    // Generar script SQL completo
    console.log('-- Script de inserción de usuarios con contraseñas hasheadas');
    console.log('-- Base de datos: sergeva_erp');
    console.log('-- Generado automáticamente');
    console.log('');

    for (const item of passwords) {
        const hash = await bcrypt.hash(item.password, saltRounds);
        const rol = item.email.includes('admin') ? 'admin' :
            item.email.includes('joshue') ? 'gerente' :
                item.email.includes('juan') ? 'supervisor' :
                    item.email.includes('maria') ? 'bodeguero' : 'contador';

        console.log(`INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo)`);
        console.log(`VALUES ('${item.user}', '${item.email}', '${hash}', '${rol}', TRUE);`);
        console.log('');
    }

    console.log('='.repeat(80));
    console.log('Hashes generados exitosamente!');
    console.log('='.repeat(80));
}

// Ejecutar
generateHashes().catch(console.error);
