import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProyectoService } from '../../services/proyecto.service';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/database.service';
import { DataPreloadService } from '../../services/data-preload.service';
import { Proyecto } from '../../services/proyecto.models';

@Component({
  selector: 'app-project-hours-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Configuración de Horarios por Proyecto</h2>
        <button (click)="abrirModalNuevo()" 
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <span class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Nuevo Proyecto
          </span>
        </button>
      </div>

      <!-- Lista de proyectos -->
      @if (proyectos().length === 0) {
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <h3 class="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">No hay proyectos configurados</h3>
          <p class="text-sm text-slate-500">Crea tu primer proyecto para comenzar</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (proyecto of proyectos(); track proyecto.id_proyecto) {
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-slate-800 dark:text-white">{{ proyecto.nombre_proyecto }}</h3>
                  <p class="text-sm text-slate-500">OT: {{ proyecto.numero_ot }}</p>
                  @if (proyecto.descripcion) {
                    <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">{{ proyecto.descripcion }}</p>
                  }
                </div>
                <span [class]="proyecto.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'"
                  class="px-3 py-1 rounded-full text-xs font-semibold">
                  {{ proyecto.estado }}
                </span>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                  <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Hora Ingreso</p>
                  <p class="text-lg font-semibold text-slate-800 dark:text-white">{{ proyecto.hora_ingreso }}</p>
                </div>
                <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                  <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Hora Salida</p>
                  <p class="text-lg font-semibold text-slate-800 dark:text-white">{{ proyecto.hora_salida }}</p>
                </div>
                <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                  <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Personal Hoy</p>
                  <p class="text-lg font-semibold text-slate-800 dark:text-white">{{ proyecto.personal_asignado || 0 }}</p>
                </div>
                <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                  <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Supervisor</p>
                  <p class="text-sm font-medium text-slate-800 dark:text-white">{{ proyecto.nombre_supervisor || 'Tú' }}</p>
                </div>
              </div>

              <div class="flex gap-2 mt-4">
                <button (click)="editarProyecto(proyecto)" 
                  class="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm">
                  Editar Horarios
                </button>
                <button (click)="cambiarEstado(proyecto)"
                  class="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm">
                  {{ proyecto.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal de crear/editar proyecto -->
      @if (mostrarModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="cerrarModal()">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 class="text-xl font-semibold text-slate-800 dark:text-white">
                {{ proyectoEditando() ? 'Editar Proyecto' : 'Nuevo Proyecto' }}
              </h3>
            </div>

            <form (submit)="guardarProyecto($event)" class="p-6 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre del Proyecto *
                  </label>
                  <input type="text" [(ngModel)]="formulario.nombre_proyecto" name="nombre_proyecto" required
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Orden de Trabajo (OT) *
                  </label>
                  <input type="text" [value]="formulario.numero_ot" name="numero_ot" readonly disabled
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-600 text-slate-800 dark:text-white cursor-not-allowed">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Descripción
                </label>
                <textarea [(ngModel)]="formulario.descripcion" name="descripcion" rows="2"
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Hora de Ingreso *
                  </label>
                  <input type="time" [(ngModel)]="formulario.hora_ingreso" name="hora_ingreso" required
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Hora de Salida *
                  </label>
                  <input type="time" [(ngModel)]="formulario.hora_salida" name="hora_salida" required
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-4">
                <button type="button" (click)="cerrarModal()"
                  class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                  Cancelar
                </button>
                <button type="submit" [disabled]="guardando()"
                  class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {{ guardando() ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class ProjectHoursConfigComponent implements OnInit {
  proyectoService = inject(ProyectoService);
  authService = inject(AuthService);
  dbService = inject(DatabaseService);
  preloadService = inject(DataPreloadService);

  proyectos = signal<Proyecto[]>([]);
  ordenesTrabajoDisponibles = this.preloadService.ordenesTrabajoCache; // Usar caché directamente
  mostrarModal = signal(false);
  guardando = signal(false);
  proyectoEditando = signal<Proyecto | null>(null);

  formulario = {
    nombre_proyecto: '',
    id_ot: '',
    numero_ot: '',
    descripcion: '',
    hora_ingreso: '08:00',
    hora_salida: '17:00'
  };

  constructor() {
    // Datos ya precargados por DataPreloadService en app.component.ts
    console.log('ProjectHoursConfig: Usando datos precargados');
    this.cargarProyectos();
  }

  async ngOnInit() {
    // Los datos ya están disponibles, solo verificar proyectos del usuario
    if (this.proyectos().length === 0) {
      await this.cargarProyectos();
    }
  }

  async cargarProyectos() {
    // Cargar TODOS los proyectos activos (no solo los del supervisor)
    const proyectos = await this.proyectoService.obtenerProyectosActivos();
    this.proyectos.set(proyectos);
  }

  async abrirModalNuevo() {
    console.log('Abriendo modal nuevo proyecto - OTs disponibles:', this.ordenesTrabajoDisponibles().length);
    this.proyectoEditando.set(null);
    this.formulario = {
      nombre_proyecto: '',
      id_ot: '',
      numero_ot: '',
      descripcion: '',
      hora_ingreso: '08:00',
      hora_salida: '17:00'
    };
    
    // Si por alguna razón el caché está vacío, recargar
    if (this.ordenesTrabajoDisponibles().length === 0) {
      console.log('Caché vacío, recargando OTs...');
      await this.preloadService.reloadWorkOrders();
    }
    
    this.mostrarModal.set(true);
  }

  editarProyecto(proyecto: Proyecto) {
    this.proyectoEditando.set(proyecto);
    this.formulario = {
      nombre_proyecto: proyecto.nombre_proyecto,
      id_ot: proyecto.id_ot.toString(),
      numero_ot: proyecto.numero_ot,
      descripcion: proyecto.descripcion || '',
      hora_ingreso: proyecto.hora_ingreso,
      hora_salida: proyecto.hora_salida
    };
    this.mostrarModal.set(true);
  }

  onOTChange() {
    const ot = this.ordenesTrabajoDisponibles().find(o => o.id_ot.toString() === this.formulario.id_ot);
    if (ot) {
      this.formulario.numero_ot = ot.numero_ot;
    }
  }

  async guardarProyecto(event: Event) {
    event.preventDefault();
    this.guardando.set(true);
    
    const user = this.authService.currentUser();
    if (!user) {
      alert('No hay usuario logueado');
      this.guardando.set(false);
      return;
    }

    try {
      const proyecto: Partial<Proyecto> = {
        nombre_proyecto: this.formulario.nombre_proyecto,
        id_ot: parseInt(this.formulario.id_ot),
        numero_ot: this.formulario.numero_ot,
        descripcion: this.formulario.descripcion,
        hora_ingreso: this.formulario.hora_ingreso,
        hora_salida: this.formulario.hora_salida,
        id_supervisor: user.id_usuario
      };

      if (this.proyectoEditando()) {
        // Editar
        await this.proyectoService.actualizarProyecto({
          ...proyecto,
          id_proyecto: this.proyectoEditando()!.id_proyecto
        } as Proyecto);
        alert('Proyecto actualizado correctamente');
      } else {
        // Crear
        await this.proyectoService.crearProyecto(proyecto);
        alert('Proyecto creado correctamente');
      }

      await this.cargarProyectos();
      this.cerrarModal();
    } catch (error: any) {
      console.error('Error guardando proyecto:', error);
      alert(error.message || 'Error al guardar proyecto');
    } finally {
      this.guardando.set(false);
    }
  }

  async cambiarEstado(proyecto: Proyecto) {
    const nuevoEstado = proyecto.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const confirmacion = confirm(`¿Estás seguro de ${nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar'} este proyecto?`);
    
    if (confirmacion) {
      try {
        await this.proyectoService.cambiarEstado(proyecto.id_proyecto, nuevoEstado);
        await this.cargarProyectos();
        alert('Estado actualizado correctamente');
      } catch (error) {
        console.error('Error cambiando estado:', error);
        alert('Error al cambiar estado del proyecto');
      }
    }
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.proyectoEditando.set(null);
  }
}
