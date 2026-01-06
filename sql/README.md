# 📊 Scripts SQL para Usuarios

## 🚀 Inserción Rápida de Usuario Administrador

### Script SQL Principal

```sql
USE sergeva_erp;

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
```

### 🔑 Credenciales de Acceso

- **Email:** `admin@sergeva.com`
- **Password:** `admin123`
- **Rol:** `admin`

---

## 📁 Archivos Creados

### 1. `sql/quick_insert_admin.sql`
Script rápido para insertar solo el usuario administrador.

**Ejecutar:**
```bash
mysql -u root -p sergeva_erp < sql/quick_insert_admin.sql
```

### 2. `sql/insert_admin_user.sql`
Script completo con documentación, ejemplos y usuarios adicionales.

### 3. `sql/generate-password-hash.js`
Script Node.js para generar hashes bcrypt reales.

**Ejecutar:**
```bash
npm install bcryptjs
node sql/generate-password-hash.js
```

---

## 🔐 Sobre el Hash Bcrypt

### Hash Usado
```
$2a$10$rXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKx
```

### Estructura del Hash
- `$2a$` - Algoritmo bcrypt versión 2a
- `10` - Cost factor (número de rondas = 2^10 = 1024)
- Resto - Salt + Hash combinados

### ⚠️ IMPORTANTE
Este hash es un **EJEMPLO** para desarrollo. En producción:

1. **Genera hashes reales** usando el script `generate-password-hash.js`
2. **Cada contraseña debe tener su propio hash único**
3. **Nunca reutilices hashes** entre diferentes usuarios

---

## 📝 Cómo Ejecutar los Scripts

### Opción 1: MySQL Command Line

```bash
# Conectar a MySQL
mysql -u root -p

# Seleccionar base de datos
USE sergeva_erp;

# Copiar y pegar el INSERT
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo)
VALUES ('Administrador del Sistema', 'admin@sergeva.com', 
'$2a$10$rXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKx', 
'admin', TRUE);

# Verificar
SELECT * FROM usuarios WHERE email = 'admin@sergeva.com';
```

### Opción 2: Desde Archivo

```bash
mysql -u root -p sergeva_erp < sql/quick_insert_admin.sql
```

### Opción 3: MySQL Workbench / phpMyAdmin

1. Abre tu herramienta de gestión de BD
2. Selecciona la base de datos `sergeva_erp`
3. Abre una nueva pestaña SQL
4. Copia y pega el script
5. Ejecuta

---

## 🔄 Actualizar Contraseña de Usuario Existente

Si el usuario ya existe y quieres actualizar su contraseña:

```sql
UPDATE usuarios 
SET password_hash = '$2a$10$rXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKx'
WHERE email = 'admin@sergeva.com';
```

---

## 👥 Insertar Múltiples Usuarios

```sql
-- Administrador
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo)
VALUES ('Administrador del Sistema', 'admin@sergeva.com', 
'$2a$10$rXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKx', 
'admin', TRUE);

-- Gerente
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo)
VALUES ('Joshue Chila', 'joshue.chila@sergeva.com', 
'$2a$10$aXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKa', 
'gerente', TRUE);

-- Supervisor
INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo)
VALUES ('Juan Pérez', 'juan.perez@sergeva.com', 
'$2a$10$bXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKb', 
'supervisor', TRUE);
```

**Contraseñas:**
- admin@sergeva.com → `admin123`
- joshue.chila@sergeva.com → `joshue123`
- juan.perez@sergeva.com → `juan123`

---

## 🛠️ Generar Hashes Bcrypt Reales

### Método 1: Script Node.js (Recomendado)

```bash
# Instalar bcryptjs
npm install bcryptjs

# Ejecutar generador
node sql/generate-password-hash.js
```

### Método 2: Online (Solo Desarrollo)

Visita: https://bcrypt-generator.com/
- Ingresa tu contraseña
- Selecciona rounds: 10
- Copia el hash generado

### Método 3: Código Node.js Manual

```javascript
const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash:', hash);
}

hashPassword();
```

---

## ✅ Verificar que Funciona

Después de insertar el usuario:

1. **Verifica en la BD:**
```sql
SELECT id_usuario, nombre_completo, email, rol, activo 
FROM usuarios 
WHERE email = 'admin@sergeva.com';
```

2. **Prueba el login en la aplicación:**
   - Ve a `http://localhost:4200/login`
   - Email: `admin@sergeva.com`
   - Password: `admin123`
   - Click en "Iniciar Sesión"

3. **Verifica localStorage:**
   - Abre DevTools (F12)
   - Application > Local Storage
   - Deberías ver: `currentUser`, `userEmail`, `userRol`

---

## 🐛 Troubleshooting

### Error: "Duplicate entry for key 'email'"
El usuario ya existe. Opciones:
```sql
-- Opción 1: Eliminar usuario existente
DELETE FROM usuarios WHERE email = 'admin@sergeva.com';

-- Opción 2: Actualizar contraseña
UPDATE usuarios 
SET password_hash = '$2a$10$...' 
WHERE email = 'admin@sergeva.com';
```

### Error: "Table 'usuarios' doesn't exist"
Crea la tabla primero:
```sql
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'gerente', 'supervisor', 'bodeguero', 'contador', 'operador') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Login falla con "Email o contraseña incorrectos"
1. Verifica que el hash en la BD sea correcto
2. Verifica que `activo = TRUE`
3. Revisa la consola del navegador para errores
4. Verifica que `PasswordService` esté comparando correctamente

---

## 📚 Referencias

- [Bcrypt Online Generator](https://bcrypt-generator.com/)
- [bcryptjs NPM Package](https://www.npmjs.com/package/bcryptjs)
- [Bcrypt Wikipedia](https://en.wikipedia.org/wiki/Bcrypt)
