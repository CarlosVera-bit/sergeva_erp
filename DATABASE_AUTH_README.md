# Configuración de Base de Datos y Autenticación

## 📁 Archivos Creados

### 1. **`src/config/database.config.ts`**
Archivo de configuración global para la conexión a MySQL.

**Credenciales configuradas:**
```typescript
{
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'sergeva_erp'
}
```

### 2. **`src/services/password.service.ts`**
Servicio para manejar comparación de contraseñas hasheadas con bcrypt.

**Funciones principales:**
- `comparePassword(plainPassword, hashedPassword)` - Compara contraseña con hash bcrypt
- `hashPassword(plainPassword)` - Genera hash bcrypt (simulado)
- `validatePasswordStrength(password)` - Valida fortaleza de contraseña

### 3. **`src/services/auth.service.ts`** (Actualizado)
Servicio de autenticación mejorado con:
- ✅ Comparación de passwords hasheados con bcrypt
- ✅ Almacenamiento en **localStorage** (antes era sessionStorage)
- ✅ Guarda `email` y `rol` por separado en localStorage
- ✅ Redirección automática después de login/logout
- ✅ Métodos de verificación de roles

## 🔐 Sistema de Autenticación

### Flujo de Login

1. **Usuario ingresa email y contraseña**
2. **Sistema busca usuario en BD** por email
3. **Verifica que el usuario esté activo**
4. **Compara contraseña** con hash bcrypt almacenado
5. **Si coincide:**
   - Guarda usuario completo en localStorage (`currentUser`)
   - Guarda email en localStorage (`userEmail`)
   - Guarda rol en localStorage (`userRol`)
   - Actualiza signal `currentUser`
   - Redirige a `/dashboard`

### Tabla de Usuarios

La autenticación consulta la tabla `usuarios` con estos campos:

```sql
SELECT * FROM usuarios WHERE email = ?
```

**Campos utilizados:**
- `id_usuario` - ID único del usuario
- `nombre_completo` - Nombre completo
- `email` - Email (usado para login)
- `password_hash` - Contraseña hasheada con bcrypt
- `rol` - Rol del usuario (admin, gerente, supervisor, etc.)
- `activo` - Estado del usuario (true/false)

### Usuarios de Prueba (Mock Data)

Actualmente el sistema usa datos mock. Los usuarios disponibles son:

| Email | Password | Rol | Nombre |
|-------|----------|-----|--------|
| admin@sergeva.com | admin123 | admin | Administrador Sistema |
| joshue.chila@sergeva.com | joshue123 | gerente | Joshue Chila |
| juan.perez@sergeva.com | juan123 | supervisor | Juan Perez |
| maria.rodriguez@sergeva.com | maria123 | bodeguero | Maria Rodriguez |
| carlos.sempere@sergeva.com | carlos123 | contador | Carlos Sempere |

## 💾 LocalStorage

El sistema guarda la siguiente información en localStorage:

```javascript
localStorage.setItem('currentUser', JSON.stringify({
  id_usuario: 1,
  nombre_completo: 'Administrador Sistema',
  email: 'admin@sergeva.com',
  rol: 'admin',
  activo: true
}));

localStorage.setItem('userEmail', 'admin@sergeva.com');
localStorage.setItem('userRol', 'admin');
```

### Acceso a los Datos

```typescript
// En cualquier componente o servicio
const authService = inject(AuthService);

// Obtener usuario completo
const user = authService.currentUser();

// Obtener solo email
const email = authService.getUserEmail();

// Obtener solo rol
const rol = authService.getUserRol();

// Verificar si está autenticado
const isAuth = authService.isAuthenticated();

// Verificar rol específico
const isAdmin = authService.hasRole('admin');

// Verificar múltiples roles
const canEdit = authService.hasAnyRole(['admin', 'gerente']);
```

## 🔒 Seguridad de Passwords

### Hashing con Bcrypt

Las contraseñas deben estar hasheadas en la base de datos usando bcrypt:

```bash
# Ejemplo de hash bcrypt
$2a$10$rXKZ9vJZxKxKxKxKxKxKxOeH8YqJ9vJZxKxKxKxKxKxKxKxKxKxKx
```

**Formato del hash:**
- `$2a$` o `$2b$` o `$2y$` - Algoritmo bcrypt
- `10` - Cost factor (número de rondas)
- Resto - Salt + Hash

### Comparación de Passwords

El sistema usa `PasswordService.comparePassword()` que:

1. Detecta si es un hash bcrypt (comienza con `$2a$`, `$2b$`, o `$2y$`)
2. Si es bcrypt, compara usando el algoritmo bcrypt
3. Si no es bcrypt (solo para desarrollo), compara directamente

**⚠️ IMPORTANTE:** En producción, TODAS las contraseñas deben estar hasheadas con bcrypt.

## 🔧 Configuración para Producción

### Paso 1: Instalar bcryptjs

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### Paso 2: Actualizar PasswordService

Reemplazar la simulación en `password.service.ts` con:

```typescript
import * as bcrypt from 'bcryptjs';

async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

async hashPassword(plainPassword: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(plainPassword, saltRounds);
}
```

### Paso 3: Hashear Passwords Existentes

Script para hashear contraseñas:

```typescript
import * as bcrypt from 'bcryptjs';

async function hashPasswords() {
  const passwords = ['admin123', 'joshue123', 'juan123'];
  
  for (const password of passwords) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${password} -> ${hash}`);
  }
}
```

### Paso 4: Actualizar Base de Datos

```sql
UPDATE usuarios 
SET password_hash = '$2a$10$...' 
WHERE email = 'admin@sergeva.com';
```

## 🚀 Uso en Componentes

### Proteger Rutas por Rol

```typescript
// En un componente
export class AdminComponent {
  authService = inject(AuthService);

  ngOnInit() {
    if (!this.authService.hasRole('admin')) {
      this.router.navigate(['/dashboard']);
    }
  }
}
```

### Mostrar/Ocultar Elementos por Rol

```html
<!-- En el template -->
@if (authService.hasRole('admin')) {
  <button>Configuración Avanzada</button>
}

@if (authService.hasAnyRole(['admin', 'gerente'])) {
  <button>Ver Reportes</button>
}
```

### Obtener Datos del Usuario

```typescript
export class ProfileComponent {
  authService = inject(AuthService);

  ngOnInit() {
    const user = this.authService.currentUser();
    console.log('Usuario:', user?.nombre_completo);
    console.log('Email:', this.authService.getUserEmail());
    console.log('Rol:', this.authService.getUserRol());
  }
}
```

## 📊 Roles Disponibles

| Rol | Descripción | Permisos Típicos |
|-----|-------------|------------------|
| `admin` | Administrador | Acceso total al sistema |
| `gerente` | Gerente | Gestión de proyectos y reportes |
| `supervisor` | Supervisor | Supervisión de órdenes de trabajo |
| `bodeguero` | Bodeguero | Gestión de inventario |
| `contador` | Contador | Acceso a contabilidad y finanzas |
| `operador` | Operador | Operaciones básicas |

## 🔄 Migración de SessionStorage a LocalStorage

**Cambios realizados:**
- ❌ Antes: `sessionStorage` (se borra al cerrar pestaña)
- ✅ Ahora: `localStorage` (persiste entre sesiones)

**Ventajas:**
- El usuario permanece logueado aunque cierre el navegador
- Mejor experiencia de usuario
- Datos accesibles desde cualquier pestaña

**Desventajas:**
- Menos seguro (datos persisten más tiempo)
- Requiere logout manual

## 🛡️ Mejores Prácticas de Seguridad

1. **NUNCA envíes contraseñas en texto plano**
   - Usa HTTPS en producción
   - Las contraseñas deben hashearse en el backend

2. **Validación de contraseñas**
   - Mínimo 8 caracteres
   - Incluir mayúsculas, minúsculas, números y símbolos

3. **Tokens de autenticación**
   - Considera usar JWT tokens en lugar de localStorage
   - Implementa refresh tokens

4. **Timeout de sesión**
   - Implementa auto-logout después de inactividad
   - Limpia localStorage al cerrar sesión

5. **Variables de entorno**
   - NO incluyas credenciales de BD en el código
   - Usa archivos `.env` para configuración

## 📝 Notas Adicionales

- El sistema actual usa **datos mock** para desarrollo
- Para conectar a MySQL real, actualiza `DatabaseService`
- Los hashes bcrypt son **one-way** (no se pueden desencriptar)
- Cada hash bcrypt incluye su propio **salt** aleatorio
- El cost factor de 10 es un buen balance entre seguridad y rendimiento

## 🐛 Troubleshooting

**Problema:** "Email o contraseña incorrectos"
- Verifica que el email exista en la BD
- Verifica que la contraseña esté correctamente hasheada
- Revisa la consola para ver el error específico

**Problema:** "La cuenta está inactiva"
- El campo `activo` debe ser `true` en la BD

**Problema:** No redirige después del login
- Verifica que Angular Router esté configurado
- Revisa que la ruta `/dashboard` exista

**Problema:** Se pierde la sesión al recargar
- Verifica que se esté usando `localStorage` no `sessionStorage`
- Revisa la consola del navegador (Application > Local Storage)
