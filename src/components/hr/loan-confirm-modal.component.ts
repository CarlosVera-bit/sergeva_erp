import { Component, ChangeDetectionStrategy, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrestamoPersonalService } from '../../services/prestamo-personal.service';
import { PrestamoDual } from '../../services/proyecto.models';

@Component({
  selector: 'app-loan-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-t-lg">
            <h3 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Confirmar Préstamo
            </h3>
            <p class="text-green-100 text-sm mt-1">El empleado fue prestado desde otro proyecto</p>
          </div>

          <div class="p-6">
            @if (prestamo()) {
              <!-- Información del Préstamo -->
              <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div class="flex items-center gap-3 mb-3">
                  <div class="bg-blue-500 rounded-full p-2">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm text-slate-600 dark:text-slate-400">Empleado Prestado</p>
                    <p class="font-semibold text-slate-800 dark:text-white">{{ prestamo()?.nombre_empleado }}</p>
                  </div>
                </div>

                <div class="border-t border-blue-200 dark:border-blue-700 pt-3 space-y-2">
                  <div>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Proyecto Origen</p>
                    <p class="font-medium text-slate-800 dark:text-white">{{ prestamo()?.nombre_proyecto_origen }}</p>
                    <p class="text-xs text-slate-500">{{ prestamo()?.numero_ot_origen }}</p>
                  </div>
                  
                  <div>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Supervisor Origen</p>
                    <p class="text-sm text-slate-700 dark:text-slate-300">{{ prestamo()?.nombre_supervisor_prestamista }}</p>
                  </div>

                  @if (prestamo()?.hora_fin_proyecto_origen) {
                    <div>
                      <p class="text-xs text-slate-500 dark:text-slate-400">Hora de Salida (Proyecto Origen)</p>
                      <p class="text-sm font-semibold text-orange-600">{{ prestamo()?.hora_fin_proyecto_origen }}</p>
                    </div>
                  }
                </div>
              </div>

              <!-- Proyecto Destino -->
              <div class="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 mb-4">
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Proyecto Destino (Tu Proyecto)</p>
                <p class="font-semibold text-slate-800 dark:text-white">{{ prestamo()?.nombre_proyecto_destino }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ prestamo()?.numero_ot_destino }}</p>
              </div>

              <!-- Hora de Inicio -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span class="text-red-500">*</span> Hora de Ingreso a Tu Proyecto
                </label>
                <input type="time" 
                  [(ngModel)]="horaInicio" 
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
                  required />
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Se calculará automáticamente el tiempo de traslado
                </p>
              </div>

              @if (prestamo()?.observaciones) {
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                  <p class="text-xs text-yellow-700 dark:text-yellow-400 font-medium mb-1">Observaciones del Supervisor Origen:</p>
                  <p class="text-sm text-slate-700 dark:text-slate-300">{{ prestamo()?.observaciones }}</p>
                </div>
              }

              <!-- Botones -->
              <div class="flex gap-3">
                <button (click)="rechazar()" 
                  [disabled]="procesando()"
                  class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  @if (procesando() && accion() === 'rechazar') {
                    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  }
                  Rechazar
                </button>
                <button (click)="confirmar()" 
                  [disabled]="!horaInicio || procesando()"
                  class="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  @if (procesando() && accion() === 'confirmar') {
                    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  }
                  Confirmar Ingreso
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanConfirmModalComponent {
  prestamoService = inject(PrestamoPersonalService);

  visible = signal<boolean>(false);
  procesando = signal<boolean>(false);
  accion = signal<'confirmar' | 'rechazar' | null>(null);
  
  prestamo = signal<PrestamoDual | null>(null);
  horaInicio: string = new Date().toTimeString().slice(0, 5);

  // Outputs
  confirmado = output<void>();
  rechazado = output<void>();
  cerrado = output<void>();

  abrir(prestamo: PrestamoDual) {
    this.prestamo.set(prestamo);
    this.horaInicio = new Date().toTimeString().slice(0, 5);
    this.visible.set(true);
  }

  async confirmar() {
    if (!this.horaInicio) {
      alert('Por favor ingresa la hora de inicio');
      return;
    }

    const confirmarAccion = confirm(
      '¿Confirmas que el empleado ingresó a tu proyecto a las ' + this.horaInicio + '?\n\n' +
      'Se calculará automáticamente el tiempo de traslado.'
    );

    if (!confirmarAccion) return;

    this.procesando.set(true);
    this.accion.set('confirmar');
    
    try {
      const prestamoActual = this.prestamo();
      if (!prestamoActual) return;

      await this.prestamoService.confirmarInicio({
        id_prestamo: prestamoActual.id_prestamo,
        hora: this.horaInicio,
        tipo: 'PRESTATARIO'
      });

      this.confirmado.emit();
      this.cerrar();
    } catch (error: any) {
      console.error('Error al confirmar préstamo:', error);
      alert('Error al confirmar: ' + (error.message || 'Error desconocido'));
    } finally {
      this.procesando.set(false);
      this.accion.set(null);
    }
  }

  async rechazar() {
    const motivo = prompt('¿Por qué rechazas este préstamo?');
    
    if (!motivo) return;

    this.procesando.set(true);
    this.accion.set('rechazar');
    
    try {
      const prestamoActual = this.prestamo();
      if (!prestamoActual) return;

      await this.prestamoService.rechazarPrestamo(
        prestamoActual.id_prestamo,
        motivo
      );

      this.rechazado.emit();
      this.cerrar();
    } catch (error: any) {
      console.error('Error al rechazar préstamo:', error);
      alert('Error al rechazar: ' + (error.message || 'Error desconocido'));
    } finally {
      this.procesando.set(false);
      this.accion.set(null);
    }
  }

  cerrar() {
    this.visible.set(false);
    this.prestamo.set(null);
    this.cerrado.emit();
  }
}
