# Sistema Avanzado de Control de Horas - Documentación de Implementación

## ✅ Archivos Creados y Listos

### 1. **Modelos TypeScript**
- ✅ `src/services/proyecto.models.ts` - Interfaces completas para Proyecto, PrestamoDual, TipoRegistroDetectado, etc.

### 2. **SQL Database**
- ✅ `sql/create_proyectos_prestamos.sql` - Tablas completas con:
  - `proyectos_supervisados` (horarios configurables por proyecto)
  - ALTER TABLE `prestamos_personal` (campos dual prestamista/prestatario)
  - ALTER TABLE `asistencias_biometricas` (id_proyecto, tipo_registro_detectado)
  - Vistas SQL para reportes consolidados

### 3. **Servicios Angular**
- ✅ `src/services/proyecto.service.ts` - CRUD completo de proyectos
- ✅ `src/services/prestamo-personal.service.ts` - Gestión dual de préstamos
- ✅ `src/services/attendance.service.ts` - Detección inteligente de tipo de registro (ACTUALIZADO)

### 4. **Backend APIs**
- ✅ `backend/api/proyectos.php` - CRUD de proyectos con filtros
- ✅ `backend/api/prestamos_personal.php` - API dual para préstamos (crear, confirmar fin/inicio, rechazar)

### 5. **Componentes Angular**
- ✅ `src/components/hr/dashboard-supervisor.component.ts` - Dashboard completo con 4 tarjetas
- ✅ `src/components/hr/project-hours-config.component.ts` - Configuración de horarios por proyecto

---

## 📋 Pasos de Instalación

### Paso 1: Ejecutar SQL
```bash
mysql -u root -p sergeva_erp < sql/create_proyectos_prestamos.sql
```

o desde phpMyAdmin, ejecutar el contenido del archivo.

### Paso 2: Verificar Tablas Creadas
```sql
SHOW TABLES LIKE 'proyectos_supervisados';
DESCRIBE prestamos_personal;
DESCRIBE asistencias_biometricas;
```

### Paso 3: Integrar Componentes en el Módulo HR

**Actualizar `src/components/hr/hr.component.ts`:**
```typescript
import { DashboardSupervisorComponent } from './dashboard-supervisor.component';
import { ProjectHoursConfigComponent } from './project-hours-config.component';

@Component({
  selector: 'app-hr',
  templateUrl: './hr.component.html',
  standalone: true,
  imports: [
    CommonModule, 
    BiometricCaptureComponent, 
    GeolocationCaptureComponent, 
    AttendanceConfirmationComponent,
    DashboardSupervisorComponent,  // ← AGREGAR
    ProjectHoursConfigComponent     // ← AGREGAR
  ],
  // ...
})
```

**Agregar tabs en `src/components/hr/hr.component.html`:**
```html
<!-- Al inicio del componente, agregar tabs -->
<div class="bg-white dark:bg-slate-800 rounded-lg shadow mb-6">
  <nav class="flex gap-4 p-4 border-b border-slate-200 dark:border-slate-700">
    <button (click)="vistaActual.set('dashboard')" 
      [class.border-primary-600]="vistaActual() === 'dashboard'"
      class="px-4 py-2 border-b-2 border-transparent hover:border-primary-400">
      Dashboard
    </button>
    <button (click)="vistaActual.set('proyectos')" 
      [class.border-primary-600]="vistaActual() === 'proyectos'"
      class="px-4 py-2 border-b-2 border-transparent hover:border-primary-400">
      Proyectos
    </button>
    <button (click)="vistaActual.set('asistencias')" 
      [class.border-primary-600]="vistaActual() === 'asistencias'"
      class="px-4 py-2 border-b-2 border-transparent hover:border-primary-400">
      Control de Horas
    </button>
  </nav>

  @if (vistaActual() === 'dashboard') {
    <app-dashboard-supervisor></app-dashboard-supervisor>
  }
  @if (vistaActual() === 'proyectos') {
    <app-project-hours-config></app-project-hours-config>
  }
  @if (vistaActual() === 'asistencias') {
    <!-- Contenido actual del módulo HR -->
  }
</div>
```

**Agregar señal en hr.component.ts:**
```typescript
vistaActual = signal<'dashboard' | 'proyectos' | 'asistencias'>('dashboard');
```

---

## 🔄 Flujo Completo Implementado

### 1. **Dashboard Supervisor** ✅
- **Ubicación**: Vista principal al entrar al módulo HR
- **Funcionalidad**:
  - 4 tarjetas estadísticas (Proyectos, Personal, Préstamos, Horas)
  - Lista de proyectos activos
  - Navegación rápida a configuración
  - Auto-refresh cada vez que cambia el usuario

### 2. **Configuración de Proyectos** ✅
- **Ubicación**: Tab "Proyectos"
- **Funcionalidad**:
  - Crear nuevo proyecto con horarios
  - Vincular a OT existente
  - Configurar hora ingreso/salida
  - Editar horarios existentes
  - Activar/Desactivar proyectos

### 3. **Detección Inteligente de Registro** ✅
- **Ubicación**: AttendanceService
- **Algoritmo**:
  ```
  Si hora actual < punto medio del turno:
    → ENTRADA
    - Antes de 5 min del horario: ENTRADA_TEMPRANA
    - Dentro de ±5 min: ENTRADA_PUNTUAL
    - Después de 5 min: ENTRADA_TARDE
  
  Si hora actual >= punto medio del turno:
    → SALIDA
    - Antes de 15 min del horario: SALIDA_TEMPRANA
    - Dentro de ±15 min: SALIDA_PUNTUAL
    - Después de 15 min: SALIDA_TARDE (hora extra)
  ```

### 4. **Gestión de Préstamos Dual** ✅
- **Backend**: `backend/api/prestamos_personal.php`
- **Funcionalidad**:
  - Prestamista solicita préstamo
  - Prestamista confirma hora fin en proyecto origen
  - Prestatario confirma hora inicio en proyecto destino
  - Cálculo automático de tiempo de traslado
  - Estados duales (REPORTADO/CONFIRMADO para cada parte)

---

## 🔨 Próximos Pasos Recomendados

### 1. Integrar Detección Inteligente en Registro de Asistencia
**Modificar `hr.component.ts` método `confirmarRegistro()`:**
```typescript
async confirmarRegistro(): Promise<void> {
  const user = this.authService.currentUser();
  const record = this.currentRecord();
  
  // AGREGAR: Detectar tipo de registro
  const idProyecto = this.proyectoSeleccionado(); // Seleccionar proyecto activo
  const deteccion = await this.attendanceService.detectarTipoRegistro(idProyecto);
  
  // Mostrar al usuario la sugerencia
  const confirmar = confirm(
    `${deteccion.mensaje}\n\n` +
    `Tipo detectado: ${deteccion.sugerencia}\n` +
    `¿Deseas continuar?`
  );
  
  if (!confirmar) return;
  
  // Guardar con tipo detectado
  const dbRecord = {
    // ... campos existentes
    tipo_registro: deteccion.sugerencia,
    tipo_registro_detectado: deteccion.tipo,
    minutos_diferencia: deteccion.minutos_diferencia,
    id_proyecto: idProyecto
  };
  
  // ... resto del código
}
```

### 2. Crear Modal de Solicitud Rápida de Préstamo
**Al registrar SALIDA, preguntar:**
```typescript
async confirmarRegistro(): Promise<void> {
  // ... código existente
  
  if (deteccion.sugerencia === 'SALIDA') {
    const prestado = confirm('¿Este empleado fue prestado a otro proyecto?');
    
    if (prestado) {
      // Abrir modal de préstamo rápido
      this.mostrarModalPrestamo.set(true);
    }
  }
}
```

### 3. Implementar Confirmación de Préstamo en Registro ENTRADA
**Al registrar ENTRADA:**
```typescript
async confirmarRegistro(): Promise<void> {
  if (deteccion.sugerencia === 'ENTRADA') {
    // Buscar préstamo pendiente
    const prestamo = await this.prestamoService.obtenerPrestamoPendiente(
      user.id_usuario,
      new Date().toISOString().split('T')[0]
    );
    
    if (prestamo) {
      // Mostrar modal de confirmación de préstamo
      this.prestamoParaConfirmar.set(prestamo);
      this.mostrarModalConfirmarPrestamo.set(true);
    }
  }
}
```

### 4. Reporte Consolidado con Préstamos
**Usar la vista SQL creada:**
```typescript
async cargarReporteConsolidado() {
  const query = `SELECT * FROM vista_reporte_consolidado 
                 WHERE fecha_hora >= ? AND fecha_hora <= ?
                 ORDER BY fecha_hora DESC`;
  
  const data = await this.dbService.query(query, [fechaInicio, fechaFin]);
  // Mostrar en tabla con columnas adicionales de préstamo
}
```

---

## 📊 Estructura de Datos

### Proyecto Supervisado
```typescript
{
  id_proyecto: 1,
  nombre_proyecto: "Nestle Sur - Colocar casetas",
  numero_ot: "OT 244",
  hora_ingreso: "10:30",
  hora_salida: "17:00",
  id_supervisor: 2,
  estado: "ACTIVO"
}
```

### Préstamo Dual
```typescript
{
  id_prestamo: 1,
  id_empleado: 15,
  nombre_empleado: "Juan Pérez",
  id_proyecto_origen: 1,
  nombre_proyecto_origen: "Nestle Sur",
  id_proyecto_destino: 2,
  nombre_proyecto_destino: "Agripac",
  fecha_prestamo: "2025-12-11",
  hora_fin_proyecto_origen: "17:30",
  hora_inicio_proyecto_destino: "18:05",
  estado_prestamista: "CONFIRMADO",
  estado_prestatario: "CONFIRMADO",
  tiempo_traslado_minutos: 35
}
```

### Tipo Registro Detectado
```typescript
{
  tipo: "ENTRADA_TEMPRANA",
  minutos_diferencia: -8,
  hora_configurada: "10:30",
  hora_registrada: "10:22",
  sugerencia: "ENTRADA",
  mensaje: "Llegaste 8 minutos antes del horario (10:30)"
}
```

---

## ✨ Características Implementadas

✅ Dashboard supervisor con 4 tarjetas estadísticas
✅ Configuración de horarios por proyecto/OT
✅ Detección inteligente de tipo de registro (ENTRADA/SALIDA)
✅ Sistema de préstamos dual (prestamista/prestatario)
✅ Backend API completo para proyectos y préstamos
✅ Vistas SQL para reportes consolidados
✅ Cálculo automático de tiempo de traslado
✅ Estados duales para confirmación de préstamos

---

## 🎯 Características Pendientes (Opcional)

⏳ Modal de solicitud rápida de préstamo
⏳ Modal de confirmación de préstamo (prestatario)
⏳ Integración de detección inteligente en UI de registro
⏳ Reporte consolidado con columnas de préstamo
⏳ Notificaciones de préstamos pendientes
⏳ Exportación PDF de reportes con préstamos

---

## 📝 Notas Importantes

1. **Base de Datos**: Asegúrate de ejecutar el script SQL antes de usar las nuevas funcionalidades
2. **Permisos**: Solo supervisores pueden crear/editar proyectos
3. **Validaciones**: El backend valida que los horarios sean coherentes (salida > entrada)
4. **Tiempo de Traslado**: Se calcula automáticamente al confirmar inicio en proyecto destino
5. **Estados Duales**: Ambas partes deben confirmar para que el préstamo esté completo

---

## 🆘 Troubleshooting

### Error: "Tabla 'proyectos_supervisados' no existe"
**Solución**: Ejecutar el script SQL de creación de tablas

### Error: "Cannot read property 'id_usuario' of null"
**Solución**: Asegurarse de que el usuario esté logueado antes de acceder al dashboard

### Proyectos no se cargan
**Solución**: Verificar que el supervisor tenga OTs asignadas en la tabla `ordenes_trabajo`

### Detección de tipo no funciona
**Solución**: Verificar que el proyecto tenga horarios configurados correctamente
