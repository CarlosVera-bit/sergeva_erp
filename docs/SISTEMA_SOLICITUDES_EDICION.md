# Sistema de Solicitudes de Edición - Guía de Implementación

## 📋 Resumen

Sistema completo de autorización de ediciones para supervisores con aprobación de administradores. Incluye backend PHP, frontend Angular, y UX optimizada con notificaciones en tiempo real.

---

## 🗄️ 1. Instalación de Base de Datos

### Ejecutar Script SQL

Abre **phpMyAdmin** y ejecuta el archivo:
```
sql/create_solicitudes_edicion.sql
```

O ejecuta directamente:
```sql
CREATE TABLE IF NOT EXISTS solicitudes_edicion (
    id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
    id_supervisor INT NOT NULL,
    tabla_objetivo VARCHAR(100) NOT NULL,
    id_registro INT NOT NULL,
    motivo TEXT NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    id_admin_respuesta INT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP NULL,
    observaciones_admin TEXT NULL,
    FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_admin_respuesta) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🔧 2. Integración en Angular

### 2.1 Agregar Componente al Navbar

En tu componente de navbar (ej: `navbar.component.html`), agrega:

```html
<!-- Dentro del navbar, junto a otros elementos del menú -->
<app-notifications-menu></app-notifications-menu>
```

### 2.2 Registrar en Module

En `app.module.ts`:

```typescript
import { NotificationsMenuComponent } from './components/notifications-menu/notifications-menu.component';
import { AuthorizationService } from './services/authorization.service';

@NgModule({
  declarations: [
    // ... otros componentes
    NotificationsMenuComponent
  ],
  providers: [
    // ... otros servicios
    AuthorizationService
  ]
})
```

### 2.3 Usar en Componentes con Edición

**Ejemplo: Componente de Órdenes de Trabajo**

```typescript
import { Component } from '@angular/core';
import { AuthorizationService } from '../../services/authorization.service';
import { EditAuthorizationHelper } from '../../helpers/edit-authorization.helper';

export class WorkOrderListComponent {
  private editHelper: EditAuthorizationHelper;

  constructor(
    private authService: AuthorizationService,
    private router: Router
  ) {
    this.editHelper = new EditAuthorizationHelper(authService);
  }

  // Botón editar
  onClickEdit(idOt: number): void {
    this.editHelper.handleEditClick(
      'ordenes_trabajo',  // Nombre de la tabla
      idOt,               // ID del registro
      () => this.abrirFormularioEdicion(idOt)  // Callback si tiene acceso
    );
  }

  private abrirFormularioEdicion(idOt: number): void {
    this.router.navigate(['/ordenes-trabajo/editar', idOt]);
  }
}
```

**En el template:**

```html
<button (click)="onClickEdit(orden.id_ot)" class="btn btn-primary">
  <i class="fas fa-edit"></i> Editar
</button>
```

---

## 🎯 3. Flujo de Uso

### Para Supervisores:

1. **Intentar editar** → Click en botón "Editar"
2. **Sistema verifica acceso** → Si no tiene permiso, muestra modal
3. **Solicitar permiso** → Escribe motivo y envía
4. **Esperar aprobación** → Notificación cuando admin responda

### Para Administradores:

1. **Ver badge** → Número de solicitudes pendientes en campana 🔔
2. **Abrir dropdown** → Click en campana para ver lista
3. **Revisar solicitud** → Ver supervisor, tabla, motivo
4. **Aprobar/Rechazar** → Click en botón directo desde dropdown
5. **Agregar observaciones** → Opcional al aprobar/rechazar

---

## 🔐 4. Tablas Permitidas

El sistema tiene una whitelist de tablas editables. Para agregar más tablas, edita:

**Backend:** `backend/api/solicitar_edicion.php`

```php
$tablas_permitidas = [
    'ordenes_trabajo',
    'clientes',
    'cotizaciones',
    'proyectos',
    'trabajadores',
    'pedidos_compra',
    'tu_nueva_tabla'  // Agregar aquí
];
```

**Frontend:** `src/helpers/edit-authorization.helper.ts`

```typescript
private getNombreTabla(tabla: string): string {
  const nombres: { [key: string]: string } = {
    'ordenes_trabajo': 'Orden de Trabajo',
    'tu_nueva_tabla': 'Tu Nueva Tabla'  // Agregar aquí
  };
  return nombres[tabla] || tabla;
}
```

---

## 📊 5. Endpoints API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/solicitar_edicion.php` | POST | Supervisor solicita permiso |
| `/verificar_acceso.php` | GET | Verifica si tiene acceso aprobado |
| `/listar_pendientes.php` | GET | Lista solicitudes (admin) |
| `/aprobar_rechazar.php` | POST | Aprueba/rechaza solicitud (admin) |

### Ejemplos de Uso

**Solicitar Edición:**
```json
POST /solicitar_edicion.php
{
  "id_supervisor": 3,
  "tabla": "ordenes_trabajo",
  "id_registro": 123,
  "motivo": "Necesito actualizar el estado de la orden"
}
```

**Verificar Acceso:**
```
GET /verificar_acceso.php?id_supervisor=3&tabla=ordenes_trabajo&id_registro=123
```

**Aprobar Solicitud:**
```json
POST /aprobar_rechazar.php
{
  "id_solicitud": 5,
  "id_admin": 1,
  "accion": "aprobar",
  "observaciones": "Aprobado para actualización urgente"
}
```

---

## 🎨 6. Personalización de Estilos

Los estilos del menú de notificaciones están en:
```
src/components/notifications-menu/notifications-menu.component.css
```

Puedes personalizar:
- Colores del badge
- Animaciones
- Tamaño del dropdown
- Estilos de botones

---

## ⚙️ 7. Configuración Avanzada

### Cambiar Frecuencia de Polling

En `notifications-menu.component.ts`:

```typescript
// Cambiar de 30 segundos a otro intervalo
this.pollingSubscription = interval(60000)  // 60 segundos
  .pipe(switchMap(() => this.authService.listarPendientes()))
  ...
```

### Agregar Expiración de Aprobaciones

Modifica la tabla para agregar `fecha_expiracion`:

```sql
ALTER TABLE solicitudes_edicion 
ADD COLUMN fecha_expiracion TIMESTAMP NULL AFTER fecha_respuesta;
```

Luego actualiza `verificar_acceso.php` para verificar expiración.

---

## 🧪 8. Testing

### Test Manual Completo

1. **Crear usuario supervisor** (si no existe)
2. **Login como supervisor**
3. **Ir a módulo con edición** (ej: Órdenes de Trabajo)
4. **Click en Editar** → Debe pedir motivo
5. **Enviar solicitud** con motivo válido
6. **Logout**
7. **Login como admin**
8. **Verificar badge** muestra "1"
9. **Click en campana** → Ver solicitud
10. **Click en Aprobar** → Confirmar
11. **Logout**
12. **Login como supervisor**
13. **Click en Editar** → Ahora SÍ abre formulario

### Verificar en Base de Datos

```sql
-- Ver todas las solicitudes
SELECT * FROM solicitudes_edicion ORDER BY fecha_solicitud DESC;

-- Ver pendientes
SELECT * FROM solicitudes_edicion WHERE estado = 'pendiente';

-- Ver aprobadas
SELECT * FROM solicitudes_edicion WHERE estado = 'aprobada';
```

---

## 🐛 9. Troubleshooting

### Badge no muestra número

- Verificar que el usuario es admin
- Revisar consola del navegador para errores
- Verificar que el endpoint `/listar_pendientes.php` responde

### Supervisor no puede solicitar

- Verificar rol en localStorage: `localStorage.getItem('user')`
- Verificar que la tabla está en la whitelist
- Revisar consola del navegador

### Admin no puede aprobar

- Verificar que `id_admin` se está enviando correctamente
- Verificar que la solicitud está en estado 'pendiente'
- Revisar logs del servidor PHP

---

## 📝 10. Notas Importantes

- ✅ **Seguridad:** Todos los endpoints validan rol y autenticación
- ✅ **Duplicados:** El sistema previene solicitudes duplicadas
- ✅ **UX:** Admin aprueba/rechaza sin salir del navbar
- ✅ **Polling:** Actualización automática cada 30s
- ⚠️ **Futuro:** Considerar WebSockets para notificaciones en tiempo real
- ⚠️ **Futuro:** Agregar notificaciones push al supervisor cuando se apruebe/rechace

---

## 📞 Soporte

Para dudas o problemas, revisar:
1. Logs del servidor PHP
2. Consola del navegador (F12)
3. Network tab para ver requests/responses
4. Base de datos para verificar estados
