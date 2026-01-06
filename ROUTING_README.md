# Sistema de Rutas y Navegación - Sergeva OS

## 📋 Archivos Creados

### 1. **`src/app.routes.ts`**
Archivo de configuración de rutas de Angular Router con todas las rutas del sistema:
- `/dashboard` - Panel principal
- `/work-orders` - Órdenes de trabajo
- `/quotes` - Cotizaciones
- `/inventory` - Inventario
- `/purchasing` - Compras
- `/client-files` - Archivos de clientes
- `/schedule` - Agenda
- `/hr` - Recursos Humanos
- `/accounting` - Contabilidad
- `/reports` - Reportes
- `/database-settings` - Configuración
- `/login` - Inicio de sesión

### 2. **`src/components/navbar/`**
Componente de navegación reutilizable que incluye:
- `navbar.component.ts` - Lógica del componente
- `navbar.component.html` - Template HTML
- `navbar.component.css` - Estilos modernos y responsive

### 3. **Archivos Actualizados**
- `index.tsx` - Configuración del proveedor de rutas
- `src/app.component.ts` - Migrado a usar RouterOutlet
- `src/app.component.html` - Template actualizado con router-outlet
- `src/app.component.css` - Estilos del contenedor principal

## 🚀 Instalación

Antes de ejecutar la aplicación, necesitas instalar el paquete de Angular Router:

```bash
npm install @angular/router@^21.0.0
```

Si tienes problemas con la ejecución de scripts en PowerShell, ejecuta primero:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🎨 Características del Navbar

### Diseño Moderno
- ✨ Gradiente vibrante (púrpura a violeta)
- 🎭 Efectos hover con animaciones suaves
- 📱 Completamente responsive
- 🌙 Sombras y efectos glassmorphism
- ⚡ Micro-animaciones en cada elemento

### Funcionalidad
- 🔗 Navegación por rutas de Angular Router
- 📍 Indicador visual de ruta activa
- 🍔 Menú hamburguesa para móviles
- 🎯 Tooltips descriptivos en cada ítem
- 🔄 Cierre automático del menú en móvil al navegar

### Responsive
- **Desktop (>1200px)**: Menú horizontal completo con iconos y texto
- **Tablet (992px-1200px)**: Menú horizontal con iconos y texto reducido
- **Móvil (<768px)**: Menú lateral deslizable con botón hamburguesa

## 📖 Cómo Usar el Navbar en Otros Componentes

El navbar ya está integrado en `app.component.html` y se mostrará automáticamente en todas las páginas cuando el usuario esté autenticado.

Si quieres usar el navbar en otro componente standalone:

```typescript
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'mi-componente',
  standalone: true,
  imports: [NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="contenido">
      <!-- Tu contenido aquí -->
    </div>
  `
})
export class MiComponente {}
```

## 🔧 Personalización del Navbar

### Cambiar Colores
Edita `src/components/navbar/navbar.component.css`:

```css
.navbar {
  /* Cambia el gradiente aquí */
  background: linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%);
}
```

### Agregar/Modificar Rutas
Edita `src/components/navbar/navbar.component.ts`:

```typescript
menuItems: MenuItem[] = [
  {
    label: 'Nueva Sección',
    icon: '🎯',
    route: '/nueva-ruta',
    description: 'Descripción de la nueva sección'
  },
  // ... otros items
];
```

No olvides agregar la ruta correspondiente en `src/app.routes.ts`:

```typescript
{
  path: 'nueva-ruta',
  component: NuevoComponente
}
```

## 🎯 Navegación Programática

Si necesitas navegar desde código TypeScript:

```typescript
import { Router } from '@angular/router';
import { inject } from '@angular/core';

export class MiComponente {
  private router = inject(Router);

  irADashboard() {
    this.router.navigate(['/dashboard']);
  }

  irConParametros() {
    this.router.navigate(['/work-orders'], { 
      queryParams: { id: 123 } 
    });
  }
}
```

## 📱 Estructura de la Aplicación

```
sergeva-os/
├── src/
│   ├── app.component.ts          # Componente principal
│   ├── app.component.html        # Template principal con router-outlet
│   ├── app.component.css         # Estilos del contenedor
│   ├── app.routes.ts             # ⭐ Configuración de rutas
│   └── components/
│       ├── navbar/               # ⭐ Componente de navegación
│       │   ├── navbar.component.ts
│       │   ├── navbar.component.html
│       │   └── navbar.component.css
│       ├── dashboard/
│       ├── work-orders/
│       └── ... (otros componentes)
└── index.tsx                     # Bootstrap con provideRouter
```

## ⚠️ Notas Importantes

1. **Errores de TypeScript**: Los errores de "No se encuentra el módulo @angular/..." son normales hasta que ejecutes `npm install`. Una vez instaladas las dependencias, desaparecerán.

2. **Guards de Ruta**: Si necesitas proteger rutas (por ejemplo, solo usuarios autenticados), puedes agregar guards:

```typescript
// En app.routes.ts
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [authGuard]
}
```

3. **Lazy Loading**: Para optimizar la carga, puedes implementar lazy loading:

```typescript
{
  path: 'reports',
  loadComponent: () => import('./components/reports/reports.component')
    .then(m => m.ReportsComponent)
}
```

## 🎨 Mejoras Futuras Sugeridas

- [ ] Agregar breadcrumbs para navegación jerárquica
- [ ] Implementar búsqueda global en el navbar
- [ ] Agregar notificaciones en el navbar
- [ ] Menú de usuario con dropdown
- [ ] Modo oscuro/claro toggle
- [ ] Animaciones de transición entre rutas

## 📞 Soporte

Si tienes preguntas o problemas, revisa:
- [Documentación de Angular Router](https://angular.dev/guide/routing)
- [Angular 21 Release Notes](https://blog.angular.dev/)
