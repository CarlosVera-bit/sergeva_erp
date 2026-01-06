import { Component, ChangeDetectionStrategy, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProyectoService } from '../../services/proyecto.service';
import { PrestamoPersonalService } from '../../services/prestamo-personal.service';
import { AuthService } from '../../services/auth.service';
import { Proyecto } from '../../services/proyecto.models';

@Component({
  selector: 'app-loan-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-t-lg">
            <h3 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
              Préstamo de Personal
            </h3>
            <p class="text-orange-100 text-sm mt-1">¿Este empleado fue prestado a otro proyecto?</p>
          </div>

          <div class="p-6">
            <!-- Información del empleado -->
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div class="flex items-center gap-3">
                <div class="bg-blue-500 rounded-full p-2">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-slate-600 dark:text-slate-400">Empleado</p>
                  <p class="font-semibold text-slate-800 dark:text-white">{{ empleadoNombre() }}</p>
                </div>
              </div>
            </div>

            <!-- Proyecto Origen -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Proyecto Origen
              </label>
              <div class="bg-slate-100 dark:bg-slate-700 p-3 rounded-md">
                <p class="font-semibold text-slate-800 dark:text-white">{{ proyectoOrigenNombre() }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ numeroOTOrigen() }}</p>
              </div>
            </div>

            <!-- Hora Fin -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hora de Salida del Proyecto Origen
              </label>
              <input type="time" 
                [(ngModel)]="horaFin" 
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:text-white"
                required />
            </div>

            <!-- Proyecto Destino -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span class="text-red-500">*</span> Proyecto Destino
              </label>
              <select [(ngModel)]="proyectoDestinoId" 
                (change)="onProyectoDestinoChange()"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:text-white">
                <option value="">Selecciona un proyecto</option>
                @for (proyecto of proyectosDisponibles(); track proyecto.id_proyecto) {
                  <option [value]="proyecto.id_proyecto">
                    {{ proyecto.nombre_proyecto }} - {{ proyecto.numero_ot }}
                  </option>
                }
              </select>
            </div>

            <!-- Observaciones -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Observaciones
              </label>
              <textarea [(ngModel)]="observaciones" 
                rows="2"
                placeholder="Razón del préstamo..."
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:text-white"></textarea>
            </div>

            <!-- Botones -->
            <div class="flex gap-3">
              <button (click)="cancelar()" 
                [disabled]="guardando()"
                class="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50">
                No fue prestado
              </button>
              <button (click)="confirmarPrestamo()" 
                [disabled]="!proyectoDestinoId || !horaFin || guardando()"
                class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                @if (guardando()) {
                  <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                }
                Sí, fue prestado
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanRequestModalComponent {
  proyectoService = inject(ProyectoService);
  prestamoService = inject(PrestamoPersonalService);
  authService = inject(AuthService);

  visible = signal<boolean>(false);
  guardando = signal<boolean>(false);
  
  proyectosDisponibles = signal<Proyecto[]>([]);
  
  // Datos del formulario
  idEmpleado = signal<number>(0);
  empleadoNombre = signal<string>('');
  proyectoOrigenId = signal<number>(0);
  proyectoOrigenNombre = signal<string>('');
  numeroOTOrigen = signal<string>('');
  proyectoDestinoId: number | string = '';
  horaFin: string = new Date().toTimeString().slice(0, 5);
  observaciones: string = '';

  // Output
  prestamoCreado = output<number>(); // Emite el id_prestamo creado
  cerrado = output<void>();

  async abrir(
    idEmpleado: number, 
    empleadoNombre: string, 
    proyectoOrigenId: number,
    proyectoOrigenNombre: string,
    numeroOT: string
  ) {
    this.idEmpleado.set(idEmpleado);
    this.empleadoNombre.set(empleadoNombre);
    this.proyectoOrigenId.set(proyectoOrigenId);
    this.proyectoOrigenNombre.set(proyectoOrigenNombre);
    this.numeroOTOrigen.set(numeroOT);
    this.horaFin = new Date().toTimeString().slice(0, 5);
    this.observaciones = '';
    this.proyectoDestinoId = '';
    
    // Cargar proyectos disponibles (todos excepto el origen)
    await this.cargarProyectosDisponibles();
    
    this.visible.set(true);
  }

  async cargarProyectosDisponibles() {
    try {
      const user = this.authService.currentUser();
      if (!user) return;
      
      // Cargar todos los proyectos activos
      const proyectos = await this.proyectoService.obtenerProyectosPorSupervisor(user.id_usuario);
      
      // Filtrar el proyecto origen
      const disponibles = proyectos.filter(p => 
        p.id_proyecto !== this.proyectoOrigenId() && 
        p.estado === 'ACTIVO'
      );
      
      this.proyectosDisponibles.set(disponibles);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  }

  onProyectoDestinoChange() {
    // Lógica adicional si es necesaria
  }

  async confirmarPrestamo() {
    if (!this.proyectoDestinoId || !this.horaFin) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.guardando.set(true);
    
    try {
      const user = this.authService.currentUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Encontrar proyecto destino para obtener el supervisor
      const proyectoDestino = this.proyectosDisponibles().find(
        p => p.id_proyecto === Number(this.proyectoDestinoId)
      );

      if (!proyectoDestino) throw new Error('Proyecto destino no encontrado');

      const solicitud = {
        id_empleado: this.idEmpleado(),
        id_supervisor_prestamista: user.id_usuario,
        id_supervisor_prestatario: proyectoDestino.id_supervisor,
        id_proyecto_origen: this.proyectoOrigenId(),
        id_proyecto_destino: Number(this.proyectoDestinoId),
        id_ot_origen: null, // Se puede agregar si está disponible
        id_ot_destino: proyectoDestino.id_ot,
        fecha_prestamo: new Date().toISOString().split('T')[0],
        hora_fin_proyecto_origen: this.horaFin,
        observaciones: this.observaciones || null
      };

      const prestamo = await this.prestamoService.solicitarPrestamo(solicitud);
      
      this.prestamoCreado.emit(prestamo.id_prestamo);
      this.cerrar();
    } catch (error: any) {
      console.error('Error al crear préstamo:', error);
      alert('Error al registrar el préstamo: ' + (error.message || 'Error desconocido'));
    } finally {
      this.guardando.set(false);
    }
  }

  cancelar() {
    this.cerrar();
  }

  cerrar() {
    this.visible.set(false);
    this.cerrado.emit();
  }
}
