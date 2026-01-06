import { Component, signal, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CsvExportService } from '../../services/csv-export.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationModalService } from '../../services/confirmation-modal.service';
import { AutoRefreshService } from '../../services/auto-refresh.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { environment } from '../../environments/environment';

interface OrdenTrabajo {
  id_ot: number;
  numero_ot: string;
  nombre_cliente: string;
  plazo_estimado_dias: number;
  estado: string;
  id_supervisor?: number | null;
  estado_proyecto?: string | null; // Estado del proyecto asociado (ACTIVO/INACTIVO)
  id_proyecto?: number;
  hora_ingreso?: string; // HH:mm format
  hora_salida?: string;  // HH:mm format
  ubicacion_cliente?: string;
}

interface Trabajador {
  id_trabajador: number;
  cedula?: string;
  nombres: string;
  apellidos: string;
  direccion?: string;
  tipo_contrato?: string;
  fecha_ingreso?: string;
  especialidad?: string;
  telefono?: string;
  tarifa_hora?: number | string;
  estado?: string;
  cargo?: string;
}

interface Asignacion {
  id_asignacion: number;
  id_ot: number;
  id_trabajador: number;
  fecha_asignada: string;
  numero_ot: string;
  nombre_cliente: string;
  nombre_trabajador: string;
  cargo: string;
  observaciones?: string;
  id_supervisor?: number | null;
  estado?: string;
}

interface DiaCalendario {
  fecha: Date;
  fechaStr: string;
  nombreDia: string;
  numeroDia: number;
  esPasado: boolean;
  esHoy: boolean;
  asignaciones: Asignacion[];
}

type AsignacionDetalle = Asignacion & {
  diaNombre: string;
  fechaCorta: string;
};

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Calendario - Planificación Semanal por Proyecto</h1>
          <p class="text-slate-600 dark:text-slate-400">Planifica los {{ ordenesActivas().length }} grupos de trabajo (OTs activas)</p>
        </div>
        
        <!-- Botones de exportación -->
        @if (isAdmin()) {
          <div class="flex flex-wrap gap-2 w-full md:w-auto">
            <button 
              (click)="exportarPDF()" 
              [disabled]="ordenesActivas().length === 0"
              class="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span>PDF</span>
            </button>
            <button 
              (click)="exportarExcel()" 
              [disabled]="ordenesActivas().length === 0"
              class="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
              <span>Excel</span>
            </button>
          </div>
        }
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 md:p-6">
        <div class="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div class="flex items-center justify-between w-full md:w-auto gap-2">
            <button (click)="semanaAnterior()" 
              class="flex-1 md:flex-none px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium">
              ← Anterior
            </button>
            
            <h2 class="md:hidden text-base font-bold text-slate-800 dark:text-white text-center flex-1">
              {{ formatearTituloSemana() }}
            </h2>
            
            <button (click)="semanaSiguiente()" 
              class="flex-1 md:flex-none px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium">
              Siguiente →
            </button>
          </div>
          
          <h2 class="hidden md:block text-xl font-semibold text-slate-800 dark:text-white">
            {{ formatearTituloSemana() }}
          </h2>

          <div class="flex flex-wrap gap-2 w-full md:w-auto">
            <button (click)="abrirModalTrabajadores()"
              class="flex-1 md:flex-none px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium">
              Ver trabajadores
            </button>
            
            <!-- Botón Historial de Horas con indicador -->
            <button (click)="abrirModalHistorialHoras()"
              class="flex-1 md:flex-none px-3 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              title="Historial de horas trabajadas">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Historial Horas</span>
            </button>
          </div>
        </div>



        <!-- Debug Info - Comentado
        <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
          <p class="font-semibold">🔍 Debug Info:</p>
          <p>OTs Cargadas: {{ ordenesActivas().length }}</p>
          <p>Trabajadores: {{ trabajadoresDisponibles().length }}</p>
          <p>Asignaciones: {{ asignaciones().length }}</p>
        </div>
        -->

        <!-- Filtros de búsqueda de proyectos -->
        <div class="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 overflow-hidden">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input 
              type="text"
              [value]="busquedaProyecto()"
              (input)="busquedaProyecto.set($any($event.target).value)"
              placeholder="Buscar proyecto..."
              class="w-full pl-10 pr-4 py-3 sm:py-2 text-base sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          
          <!-- Botón para abrir modal de clientes -->
          <button 
            (click)="mostrarModalClientes.set(true)"
            class="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 transition-all flex items-center justify-between gap-2">
            <span class="truncate">{{ filtroCliente() === 'todos' ? 'Todos los clientes' : truncarTexto(filtroCliente()) }}</span>
            <svg class="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          
          <div class="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-600 dark:text-slate-400 py-2 sm:py-0">
            <span class="font-medium">Mostrando:</span>
            <span class="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
              {{ ordenesActivasFiltradas().length }} de {{ ordenesActivas().length }}
            </span>
          </div>
        </div>

        <!-- Modal de selección de cliente -->
        @if (mostrarModalClientes()) {
          <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" (click)="mostrarModalClientes.set(false)">
            <div class="absolute inset-0 bg-black/50"></div>
            <div class="relative w-full sm:max-w-md bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[70vh] flex flex-col" (click)="$event.stopPropagation()">
              <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Seleccionar Cliente</h3>
                <button (click)="mostrarModalClientes.set(false)" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div class="p-4 overflow-y-auto flex-1">
                <div class="space-y-2">
                  <button 
                    (click)="seleccionarCliente('todos')"
                    [class]="filtroCliente() === 'todos' ? 'w-full p-3 text-left rounded-lg bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500 text-primary-700 dark:text-primary-300 font-medium' : 'w-full p-3 text-left rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border-2 border-transparent'">
                    <div class="flex items-center gap-3">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                      </svg>
                      <span>Todos los clientes</span>
                    </div>
                  </button>
                  @for (cliente of clientesUnicos(); track cliente) {
                    <button 
                      (click)="seleccionarCliente(cliente)"
                      [class]="filtroCliente() === cliente ? 'w-full p-3 text-left rounded-lg bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500 text-primary-700 dark:text-primary-300 font-medium' : 'w-full p-3 text-left rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border-2 border-transparent'">
                      <span class="line-clamp-2">{{ cliente }}</span>
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        @if (ordenesActivas().length === 0) {
          <div class="text-center py-12 text-slate-500 dark:text-slate-400">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-lg font-medium">No hay órdenes de trabajo activas</p>
          </div>
        } @else {
          <!-- Vista Desktop (Tabla) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr>
                  <th class="sticky left-0 z-20 bg-slate-100 dark:bg-slate-700 p-3 text-left border border-slate-300 dark:border-slate-600 min-w-[200px] max-w-[280px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <span class="font-bold text-slate-700 dark:text-slate-200">PROYECTO / EQUIPO</span>
                  </th>
                  @for (dia of diasSemana(); track dia.fechaStr) {
                    <th class="p-3 text-center border border-slate-300 dark:border-slate-600 min-w-[160px]"
                      [class.bg-primary-100]="dia.esHoy"
                      [class.dark:bg-primary-900/30]="dia.esHoy"
                      [class.bg-slate-50]="!dia.esHoy && !dia.esPasado"
                      [class.dark:bg-slate-800]="!dia.esHoy && !dia.esPasado"
                      [class.bg-slate-100]="dia.esPasado"
                      [class.dark:bg-slate-900]="dia.esPasado">
                      <div class="flex flex-col">
                        <span class="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{{ dia.nombreDia }}</span>
                        <span class="text-lg font-bold"
                          [class.text-primary-600]="dia.esHoy"
                          [class.dark:text-primary-400]="dia.esHoy"
                          [class.text-slate-700]="!dia.esHoy && !dia.esPasado"
                          [class.dark:text-slate-200]="!dia.esHoy && !dia.esPasado"
                          [class.text-slate-500]="dia.esPasado"
                          [class.dark:text-slate-500]="dia.esPasado">{{ dia.numeroDia }}</span>
                        @if (dia.esHoy) {
                          <span class="text-xs text-primary-600 dark:text-primary-400 font-semibold">HOY</span>
                        }
                      </div>
                    </th>
                  }
                </tr>
              </thead>

              <tbody>
                @for (ot of ordenesActivasFiltradas(); track ot.id_ot) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td class="sticky left-0 z-10 bg-white dark:bg-slate-800 p-3 border border-slate-300 dark:border-slate-600 max-w-[280px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <div class="flex items-start gap-3">
                        <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {{ ot.numero_ot.split('-')[1] || ot.numero_ot.substring(0, 2) }}
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="font-semibold text-sm text-slate-800 dark:text-white">{{ ot.numero_ot }}</p>
                          <p class="text-xs text-slate-600 dark:text-slate-400 break-words leading-relaxed">{{ ot.nombre_cliente }}</p>
                          <p class="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            <span class="inline-flex items-center gap-1">
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              {{ ot.plazo_estimado_dias }} días
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>

                    @for (dia of diasSemana(); track dia.fechaStr) {
                      <td class="p-2 border border-slate-300 dark:border-slate-600 align-top"
                        [class.bg-slate-50]="dia.esPasado"
                        [class.dark:bg-slate-900/50]="dia.esPasado"
                        [class.bg-primary-50/30]="dia.esHoy"
                        [class.dark:bg-primary-900/10]="dia.esHoy">
                        
                        @let asignacionesCelda = obtenerAsignaciones(ot.id_ot, dia.fechaStr);
                        
                        <div class="space-y-1 min-h-[80px]">
                          @if (asignacionesCelda.length > 0) {
                            <!-- Mostrar resumen de asignados -->
                            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded px-2 py-2">
                              <div class="flex items-center gap-1 mb-1.5">
                                <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                <span class="text-xs font-bold text-green-700 dark:text-green-300">
                                  {{ asignacionesCelda.length }} asignado{{ asignacionesCelda.length > 1 ? 's' : '' }}
                                </span>
                              </div>
                              
                              <!-- Info de horario y ubicación del proyecto -->
                              @if (ot.hora_ingreso || ot.ubicacion_cliente) {
                                <div class="mb-1.5 pb-1.5 border-b border-green-200 dark:border-green-700 space-y-0.5">
                                  @if (ot.hora_ingreso && ot.hora_salida) {
                                    <div class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                      <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                      </svg>
                                      <span class="font-medium">{{ ot.hora_ingreso }} - {{ ot.hora_salida }}</span>
                                    </div>
                                  }
                                  @if (ot.ubicacion_cliente) {
                                    <div class="flex items-start gap-1 text-xs text-green-600 dark:text-green-400">
                                      <svg class="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                      </svg>
                                      <span class="truncate" title="{{ ot.ubicacion_cliente }}">{{ ot.ubicacion_cliente }}</span>
                                    </div>
                                  }
                                </div>
                              }
                              
                              <!-- Lista compacta de nombres (nombre + apellido) -->
                              <div class="text-xs text-green-600 dark:text-green-400 space-y-0.5">
                                @for (asignacion of asignacionesCelda.slice(0, 3); track asignacion.id_asignacion) {
                                  <div class="truncate" title="{{ asignacion.nombre_trabajador }}">• {{ formatearNombreTrabajador(asignacion.nombre_trabajador) }}</div>
                                }
                                @if (asignacionesCelda.length > 3) {
                                  <div class="text-green-500">+{{ asignacionesCelda.length - 3 }} más</div>
                                }
                              </div>
                            </div>
                            
                            <!-- Botón Ver Detalles / Editar -->
                            <button (click)="abrirModalAsignacion(ot, dia)"
                              class="w-full py-1.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded text-xs font-medium text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-all flex items-center justify-center gap-1">
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                              </svg>
                              Ver detalles
                            </button>
                          } @else if (!dia.esPasado) {
                            <button (click)="abrirModalAsignacion(ot, dia)"
                              class="w-full h-full min-h-[80px] py-1.5 border border-dashed border-slate-300 dark:border-slate-600 rounded text-xs text-slate-500 dark:text-slate-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all flex items-center justify-center">
                              + Personal
                            </button>
                          } @else {
                            <!-- Día pasado sin asignaciones -->
                            <div class="h-full min-h-[80px] flex items-center justify-center">
                              <span class="text-xs text-slate-400 dark:text-slate-500">Sin asignar</span>
                            </div>
                          }
                        </div>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Vista Mobile (Cards por Proyecto) -->
          <div class="md:hidden space-y-4">
            @for (ot of ordenesActivasFiltradas(); track ot.id_ot) {
              <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <!-- Header del Proyecto -->
                <div class="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 p-4 border-b border-slate-200 dark:border-slate-700">
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {{ ot.numero_ot.split('-')[1] || ot.numero_ot.substring(0, 2) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-bold text-sm text-slate-800 dark:text-white">{{ ot.numero_ot }}</p>
                      <p class="text-xs text-slate-600 dark:text-slate-400 break-words">{{ ot.nombre_cliente }}</p>
                      @if (ot.plazo_estimado_dias) {
                        <p class="text-xs text-slate-500 dark:text-slate-500 mt-1 flex items-center gap-1">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          {{ ot.plazo_estimado_dias }} días
                        </p>
                      }
                    </div>
                  </div>
                </div>

                <!-- Horario y Ubicación (si existe) -->
                @if (ot.hora_ingreso || ot.ubicacion_cliente) {
                  <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    @if (ot.hora_ingreso && ot.hora_salida) {
                      <div class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <svg class="w-4 h-4 flex-shrink-0 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span class="font-medium">{{ ot.hora_ingreso }} - {{ ot.hora_salida }}</span>
                      </div>
                    }
                    @if (ot.ubicacion_cliente) {
                      <div class="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <svg class="w-4 h-4 flex-shrink-0 text-primary-600 dark:text-primary-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span class="line-clamp-2">{{ ot.ubicacion_cliente }}</span>
                      </div>
                    }
                  </div>
                }

                <!-- Días de la Semana (Horizontal Scroll) -->
                <div class="overflow-x-auto scrollbar-thin">
                  <div class="flex gap-2 p-4">
                    @for (dia of diasSemana(); track dia.fechaStr) {
                      @let asignacionesCelda = obtenerAsignaciones(ot.id_ot, dia.fechaStr);
                      
                      <div class="flex-shrink-0 w-28 rounded-lg border-2 transition-all"
                        [class.border-primary-400]="dia.esHoy"
                        [class.bg-primary-50]="dia.esHoy"
                        [class.dark:bg-primary-900/20]="dia.esHoy"
                        [class.dark:border-primary-600]="dia.esHoy"
                        [class.border-slate-200]="!dia.esHoy && !dia.esPasado"
                        [class.bg-white]="!dia.esHoy && !dia.esPasado"
                        [class.dark:border-slate-700]="!dia.esHoy && !dia.esPasado"
                        [class.dark:bg-slate-800]="!dia.esHoy && !dia.esPasado"
                        [class.border-slate-100]="dia.esPasado"
                        [class.bg-slate-100]="dia.esPasado"
                        [class.dark:border-slate-700]="dia.esPasado"
                        [class.dark:bg-slate-900/50]="dia.esPasado">
                        
                        <!-- Header del Día -->
                        <div class="p-3 border-b"
                          [class.border-primary-200]="dia.esHoy"
                          [class.dark:border-primary-700]="dia.esHoy"
                          [class.border-slate-200]="!dia.esHoy"
                          [class.dark:border-slate-700]="!dia.esHoy">
                          <p class="text-xs font-bold uppercase text-center"
                            [class.text-primary-700]="dia.esHoy"
                            [class.dark:text-primary-400]="dia.esHoy"
                            [class.text-slate-600]="!dia.esHoy && !dia.esPasado"
                            [class.dark:text-slate-300]="!dia.esHoy && !dia.esPasado"
                            [class.text-slate-500]="dia.esPasado"
                            [class.dark:text-slate-500]="dia.esPasado">
                            {{ dia.nombreDia }}
                          </p>
                          <p class="text-lg font-bold text-center mt-1"
                            [class.text-primary-600]="dia.esHoy"
                            [class.dark:text-primary-400]="dia.esHoy"
                            [class.text-slate-800]="!dia.esHoy && !dia.esPasado"
                            [class.dark:text-slate-200]="!dia.esHoy && !dia.esPasado"
                            [class.text-slate-500]="dia.esPasado"
                            [class.dark:text-slate-500]="dia.esPasado">
                            {{ dia.numeroDia }}
                          </p>
                          @if (dia.esHoy) {
                            <p class="text-[10px] text-center font-bold text-primary-600 dark:text-primary-400 mt-0.5">HOY</p>
                          }
                        </div>

                        <!-- Contenido del Día -->
                        <div class="p-2 min-h-[100px] flex flex-col justify-between">
                          @if (asignacionesCelda.length > 0) {
                            <!-- Asignaciones -->
                            <div class="space-y-1.5">
                              <div class="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/40 rounded-full w-fit mx-auto">
                                <svg class="w-3 h-3 text-green-700 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                </svg>
                                <span class="text-xs font-bold text-green-700 dark:text-green-300">{{ asignacionesCelda.length }}</span>
                              </div>
                              
                              <div class="text-xs text-green-700 dark:text-green-400 space-y-0.5">
                                @for (asignacion of asignacionesCelda.slice(0, 2); track asignacion.id_asignacion) {
                                  <div class="truncate font-medium text-[11px]" title="{{ asignacion.nombre_trabajador }}">
                                    • {{ formatearNombreTrabajador(asignacion.nombre_trabajador) }}
                                  </div>
                                }
                                @if (asignacionesCelda.length > 2) {
                                  <div class="text-green-600 dark:text-green-500 font-semibold text-[10px]">+{{ asignacionesCelda.length - 2 }} más</div>
                                }
                              </div>
                            </div>

                            <!-- Botón Ver/Editar -->
                            <button (click)="abrirModalAsignacion(ot, dia)"
                              class="w-full mt-2 py-1 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded text-[10px] font-semibold text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-all">
                              Editar
                            </button>
                          } @else if (!dia.esPasado) {
                            <!-- Sin asignaciones - Botón Agregar -->
                            <button (click)="abrirModalAsignacion(ot, dia)"
                              class="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded text-slate-400 dark:text-slate-500 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                              </svg>
                            </button>
                          } @else {
                            <!-- Día pasado sin asignaciones -->
                            <div class="h-full flex items-center justify-center">
                              <span class="text-[10px] text-slate-400 dark:text-slate-500 text-center">Sin asignar</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      @if (mostrarModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="cerrarModal()">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full animate-fade-in" (click)="$event.stopPropagation()">
            <div class="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 class="text-xl font-bold text-slate-800 dark:text-white">
                Asignar Personal al Equipo
              </h3>
              <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                <span class="font-semibold">{{ otSeleccionada()?.numero_ot }}</span> - 
                {{ otSeleccionada()?.nombre_cliente }}
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {{ diaSeleccionado()?.nombreDia }} {{ diaSeleccionado()?.numeroDia }}
              </p>
            </div>

            <div class="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <!-- Trabajadores ya asignados a ESTA OT -->
              @if (trabajadoresYaAsignadosEnEstaOT().size > 0) {
                <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p class="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide mb-2">
                    ✓ Asignados a esta OT ({{ trabajadoresYaAsignadosEnEstaOT().size }})
                  </p>
                  <div class="space-y-1">
                    @for (asignacion of obtenerAsignaciones(otSeleccionada()?.id_ot || 0, diaSeleccionado()?.fechaStr || ''); track asignacion.id_asignacion) {
                      <div class="flex items-center justify-between px-2 py-1.5 bg-green-100 dark:bg-green-900/40 rounded group">
                        <div class="flex items-center gap-2">
                          <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                          </svg>
                          <span class="text-sm font-medium text-green-700 dark:text-green-300">
                            {{ asignacion.nombre_trabajador }}
                          </span>
                        </div>
                        @if (!diaSeleccionado()?.esPasado) {
                          <button (click)="eliminarAsignacion(asignacion.id_asignacion)"
                            class="opacity-60 hover:opacity-100 text-red-500 hover:text-red-700 transition-all p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Eliminar asignación">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Campo de búsqueda de trabajadores -->
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                <input type="text"
                  [ngModel]="busquedaTrabajador()"
                  (ngModelChange)="busquedaTrabajador.set($event)"
                  placeholder="Buscar trabajador por nombre o cargo..."
                  class="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm">
                @if (busquedaTrabajador()) {
                  <button (click)="busquedaTrabajador.set('')"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                }
              </div>

              <!-- Trabajadores ocupados en OTRAS OTs hoy -->
              @if (trabajadoresOcupadosFiltrados().length > 0) {
                <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p class="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-2">
                    ⚠ Ocupados en otras OTs hoy ({{ trabajadoresOcupadosFiltrados().length }})
                  </p>
                  <div class="space-y-1">
                    @for (info of trabajadoresOcupadosFiltrados(); track info.trabajador.id_trabajador) {
                      <div class="flex items-center justify-between px-2 py-1 bg-amber-100/50 dark:bg-amber-900/30 rounded text-xs">
                        <span class="font-medium text-amber-800 dark:text-amber-200">
                          {{ info.trabajador.nombres }} {{ info.trabajador.apellidos }}
                        </span>
                        <span class="text-amber-600 dark:text-amber-400">
                          → {{ info.asignacion.numero_ot }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Lista de trabajadores disponibles para seleccionar -->
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Seleccionar trabajadores para asignar
                  @if (trabajadoresSeleccionados().length > 0) {
                    <span class="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                      {{ trabajadoresSeleccionados().length }} seleccionado(s)
                    </span>
                  }
                </label>
                
                @if (trabajadoresParaAsignarFiltrados().length === 0) {
                  <div class="text-center py-6 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <svg class="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    @if (busquedaTrabajador()) {
                      <p class="text-sm">No se encontraron trabajadores con "{{ busquedaTrabajador() }}"</p>
                    } @else {
                      <p class="text-sm">Todos los trabajadores ya están asignados</p>
                    }
                  </div>
                } @else {
                  <div class="border border-slate-300 dark:border-slate-600 rounded-lg divide-y divide-slate-200 dark:divide-slate-700 max-h-[300px] overflow-y-auto">
                    @for (trabajador of trabajadoresParaAsignarFiltrados(); track trabajador.id_trabajador) {
                      <label class="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        [class.bg-primary-50]="estaSeleccionado(trabajador.id_trabajador)"
                        [class.dark:bg-primary-900/20]="estaSeleccionado(trabajador.id_trabajador)">
                        <input type="checkbox" 
                          [checked]="estaSeleccionado(trabajador.id_trabajador)"
                          (change)="toggleTrabajador(trabajador.id_trabajador)"
                          class="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500">
                        <div class="flex-1 min-w-0">
                          <p class="font-medium text-sm text-slate-800 dark:text-white">
                            {{ trabajador.nombres }} {{ trabajador.apellidos }}
                          </p>
                          <p class="text-xs text-slate-500 dark:text-slate-400">
                            {{ trabajador.cargo || trabajador.especialidad || trabajador.tipo_contrato || 'Sin especificar' }}
                          </p>
                        </div>
                      </label>
                    }
                  </div>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Observaciones (opcional)
                </label>
                <textarea [ngModel]="observacionesAsignacion()"
                  (ngModelChange)="observacionesAsignacion.set($event)"
                  rows="2"
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Notas adicionales..."></textarea>
              </div>
            </div>

            <div class="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button (click)="cerrarModal()"
                class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                Cancelar
              </button>
              <button (click)="guardarAsignaciones()"
                [disabled]="!puedeGuardar() || guardando()"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                @if (guardando()) {
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Guardando...</span>
                } @else {
                  <span>Guardar {{ trabajadoresSeleccionados().length > 1 ? trabajadoresSeleccionados().length + ' Asignaciones' : 'Asignación' }}</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      @if (mostrarModalTrabajadores()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 md:p-4" (click)="cerrarModalTrabajadores()">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full md:max-w-6xl animate-fade-in h-[95vh] md:h-[90vh] flex flex-col relative" (click)="$event.stopPropagation()">
            
            <!-- Header del modal -->
            <div class="px-4 py-3 md:p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <!-- Header Top (Título + Botón cerrar) -->
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex-1">
                  <h3 class="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div class="w-8 md:w-10 h-8 md:h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg class="w-4 md:w-5 h-4 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    <span class="truncate">Resumen de Trabajadores</span>
                  </h3>
                  <p class="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 ml-10">
                    Semana del {{ formatearTituloSemana() }}
                  </p>
                </div>
                <button (click)="cerrarModalTrabajadores()" class="p-1.5 md:p-2 flex-shrink-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              <!-- Estadísticas rápidas -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4">
                <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5 md:p-3 text-center">
                  <p class="text-lg md:text-2xl font-bold text-slate-800 dark:text-white">{{ trabajadoresDisponibles().length }}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total Personal</p>
                </div>
                
                <!-- Botón Asignados (Interactivo en móvil) -->
                <div (click)="seleccionarVistaMovil('asignados')"
                  [class.ring-2]="vistaMovilSeleccionada() === 'asignados'"
                  class="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 md:p-3 text-center cursor-pointer md:cursor-default transition-all hover:bg-green-100 dark:hover:bg-green-900/50 ring-green-500 ring-offset-2 dark:ring-offset-slate-800 border-2 border-green-200 dark:border-green-700">
                  <p class="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{{ trabajadoresAsignadosFiltrados().length }}</p>
                  <p class="text-xs md:text-sm text-green-700 dark:text-green-300 font-semibold mt-1">Asignados</p>
                  <p class="md:hidden text-xs text-green-600 dark:text-green-400 mt-1.5 font-medium">👆 Tocar</p>
                </div>
                
                <!-- Botón Sin Asignar (Interactivo en móvil) -->
                <div (click)="seleccionarVistaMovil('disponibles')"
                  [class.ring-2]="vistaMovilSeleccionada() === 'disponibles'"
                  class="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3 md:p-3 text-center cursor-pointer md:cursor-default transition-all hover:bg-amber-100 dark:hover:bg-amber-900/50 ring-amber-500 ring-offset-2 dark:ring-offset-slate-800 border-2 border-amber-200 dark:border-amber-700">
                  <p class="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400">{{ trabajadoresNoAsignadosFiltrados().length }}</p>
                  <p class="text-xs md:text-sm text-amber-700 dark:text-amber-300 font-semibold mt-1">Sin Asignar</p>
                  <p class="md:hidden text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">👆 Tocar</p>
                </div>
                
                <div class="bg-primary-50 dark:bg-primary-900/30 rounded-lg p-2.5 md:p-3 text-center">
                  <p class="text-lg md:text-2xl font-bold text-primary-600 dark:text-primary-400">{{ calcularPorcentajeAsignacion() }}%</p>
                  <p class="text-xs text-primary-600 dark:text-primary-400 mt-0.5">Ocupación</p>
                </div>
              </div>
              
              <!-- Filtros -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                <!-- Búsqueda por nombre -->
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-2.5 md:pl-3 flex items-center pointer-events-none">
                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  <input type="text"
                    [ngModel]="filtroResumenNombre()"
                    (ngModelChange)="filtroResumenNombre.set($event)"
                    placeholder="Buscar por nombre..."
                    class="w-full pl-9 md:pl-10 pr-2.5 md:pr-4 py-1.5 md:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs md:text-sm">
                  @if (filtroResumenNombre()) {
                    <button (click)="filtroResumenNombre.set('')"
                      class="absolute inset-y-0 right-0 pr-2.5 md:pr-3 flex items-center text-slate-400 hover:text-slate-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  }
                </div>
                
                <!-- Filtro por especialidad -->
                <select [ngModel]="filtroResumenEspecialidad()"
                  (ngModelChange)="filtroResumenEspecialidad.set($event)"
                  class="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="todos">Todas especialidades</option>
                  @for (esp of obtenerEspecialidadesUnicas(); track esp) {
                    <option [value]="esp">{{ esp }}</option>
                  }
                </select>
                
                <!-- Filtro por tipo de contrato -->
                <select [ngModel]="filtroResumenContrato()"
                  (ngModelChange)="filtroResumenContrato.set($event)"
                  class="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="todos">Todos los contratos</option>
                  @for (contrato of obtenerContratosUnicos(); track contrato) {
                    <option [value]="contrato">{{ contrato }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- Contenido con scroll -->
            <div class="hidden md:block flex-1 overflow-y-auto relative min-h-0">
              <div class="flex flex-col md:grid md:grid-cols-2 gap-0 min-h-full">
                
                <!-- Columna Asignados -->
                <section class="border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-col md:h-full">
                  <div class="sticky top-0 z-10 flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 flex-shrink-0 backdrop-blur-sm">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h4 class="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Asignados</h4>
                    </div>
                    <span class="px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200">
                      {{ trabajadoresAsignadosFiltrados().length }}
                    </span>
                  </div>

                  <div class="p-4 space-y-3 md:overflow-y-auto md:flex-1">
                    @if (trabajadoresAsignadosFiltrados().length === 0) {
                      <div class="text-center py-8">
                        <svg class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <p class="text-sm text-slate-500 dark:text-slate-400">No hay trabajadores que coincidan</p>
                      </div>
                    } @else {
                      @for (trabajador of trabajadoresAsignadosFiltrados(); track trabajador.id_trabajador) {
                        @let asignacionesTrabajador = obtenerAsignacionesTrabajador(trabajador.id_trabajador);
                        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div class="flex items-start justify-between gap-3">
                            <div class="flex items-start gap-3">
                              <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {{ trabajador.nombres?.charAt(0) }}{{ trabajador.apellidos?.charAt(0) }}
                              </div>
                              <div class="min-w-0">
                                <p class="font-semibold text-slate-800 dark:text-white truncate">{{ trabajador.nombres }} {{ trabajador.apellidos }}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400">{{ trabajador.cedula || 'Sin cédula' }}</p>
                                <div class="flex flex-wrap gap-1 mt-1.5">
                                  @if (trabajador.especialidad) {
                                    <span class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">{{ trabajador.especialidad }}</span>
                                  }
                                  @if (trabajador.tipo_contrato) {
                                    <span class="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-full">{{ trabajador.tipo_contrato }}</span>
                                  }
                                </div>
                              </div>
                            </div>
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 flex-shrink-0">
                              {{ asignacionesTrabajador.length }} días
                            </span>
                          </div>

                          @if (asignacionesTrabajador.length > 0) {
                            <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                              <div class="flex flex-wrap gap-1.5">
                                @for (asignacion of asignacionesTrabajador; track asignacion.id_asignacion) {
                                  <div class="px-2 py-1 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded text-xs" title="{{ asignacion.nombre_cliente }}">
                                    <span class="font-medium text-green-700 dark:text-green-300">{{ asignacion.diaNombre.substring(0,3) }}</span>
                                    <span class="text-slate-500 dark:text-slate-400 ml-1">→ {{ asignacion.numero_ot }}</span>
                                  </div>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      }
                    }
                  </div>
                </section>

                <!-- Columna No Asignados -->
                <section class="flex flex-col md:h-full">
                  <div class="sticky top-0 z-10 flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex-shrink-0 backdrop-blur-sm">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <h4 class="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Disponibles</h4>
                    </div>
                    <span class="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
                      {{ trabajadoresNoAsignadosFiltrados().length }}
                    </span>
                  </div>

                  <div class="p-4 space-y-3 md:overflow-y-auto md:flex-1">
                    @if (trabajadoresNoAsignadosFiltrados().length === 0) {
                      <div class="text-center py-8">
                        <svg class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p class="text-sm text-slate-500 dark:text-slate-400">
                          @if (filtroResumenNombre() || filtroResumenEspecialidad() !== 'todos' || filtroResumenContrato() !== 'todos') {
                            No hay trabajadores que coincidan
                          } @else {
                            ¡Todos están asignados!
                          }
                        </p>
                      </div>
                    } @else {
                      @for (trabajador of trabajadoresNoAsignadosFiltrados(); track trabajador.id_trabajador) {
                        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div class="flex items-start justify-between gap-3">
                            <div class="flex items-start gap-3">
                              <div class="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {{ trabajador.nombres?.charAt(0) }}{{ trabajador.apellidos?.charAt(0) }}
                              </div>
                              <div class="min-w-0">
                                <p class="font-semibold text-slate-800 dark:text-white truncate">{{ trabajador.nombres }} {{ trabajador.apellidos }}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400">{{ trabajador.cedula || 'Sin cédula' }}</p>
                                <div class="flex flex-wrap gap-1 mt-1.5">
                                  @if (trabajador.especialidad) {
                                    <span class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">{{ trabajador.especialidad }}</span>
                                  }
                                  @if (trabajador.tipo_contrato) {
                                    <span class="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-full">{{ trabajador.tipo_contrato }}</span>
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                          <p class="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Disponible para asignar
                          </p>
                        </div>
                      }
                    }
                  </div>
                </section>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="px-3 md:px-4 py-2.5 md:py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0 mt-auto">
              <div class="flex items-center justify-between gap-2">
                <p class="hidden md:block text-xs text-slate-500 dark:text-slate-400">
                  Mostrando {{ trabajadoresAsignadosFiltrados().length + trabajadoresNoAsignadosFiltrados().length }} de {{ trabajadoresDisponibles().length }} trabajadores
                </p>
                <p class="md:hidden text-xs text-slate-500 dark:text-slate-400 text-center flex-1">
                  {{ trabajadoresAsignadosFiltrados().length + trabajadoresNoAsignadosFiltrados().length }}/{{ trabajadoresDisponibles().length }}
                </p>
                <button (click)="limpiarFiltrosResumen()" 
                  [disabled]="!tieneFilttrosActivos()"
                  class="px-2.5 md:px-3 py-1 md:py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Modal Detalle Móvil (Full Screen) -->
      @if (vistaMovilSeleccionada()) {
        <div class="fixed inset-0 z-[9999] bg-white dark:bg-slate-900 flex flex-col animate-fade-in md:hidden" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="px-3 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-white dark:bg-slate-900 sticky top-0 z-20 flex-shrink-0">
            <button (click)="seleccionarVistaMovil(null)" class="p-1.5 -ml-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h3 class="text-sm font-bold text-slate-800 dark:text-white truncate">
              {{ vistaMovilSeleccionada() === 'asignados' ? 'Asignados' : 'Disponibles' }}
            </h3>
            <div class="ml-auto flex items-center gap-2">
              <span class="px-2 py-0.5 text-xs font-semibold rounded-full"
                [class.bg-green-100]="vistaMovilSeleccionada() === 'asignados'"
                [class.text-green-700]="vistaMovilSeleccionada() === 'asignados'"
                [class.dark:bg-green-900/30]="vistaMovilSeleccionada() === 'asignados'"
                [class.dark:text-green-300]="vistaMovilSeleccionada() === 'asignados'"
                [class.bg-amber-100]="vistaMovilSeleccionada() === 'disponibles'"
                [class.text-amber-700]="vistaMovilSeleccionada() === 'disponibles'"
                [class.dark:bg-amber-900/30]="vistaMovilSeleccionada() === 'disponibles'"
                [class.dark:text-amber-300]="vistaMovilSeleccionada() === 'disponibles'">
                {{ vistaMovilSeleccionada() === 'asignados' ? trabajadoresAsignadosFiltrados().length : trabajadoresNoAsignadosFiltrados().length }}
              </span>
            </div>
          </div>
          
          <!-- Buscador Móvil -->
          <div class="px-3 py-2 bg-white dark:bg-slate-900 sticky top-[54px] z-20 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div class="relative">
              <input type="text"
                [ngModel]="filtroResumenNombre()"
                (ngModelChange)="filtroResumenNombre.set($event)"
                placeholder="Buscar..."
                class="w-full pl-8 pr-8 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-800 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500 text-xs">
              <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              @if (filtroResumenNombre()) {
                <button (click)="filtroResumenNombre.set('')"
                  class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              }
            </div>
          </div>

          <!-- Contenido -->
          <div class="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            @if (vistaMovilSeleccionada() === 'asignados') {
              @if (trabajadoresAsignadosFiltrados().length === 0) {
                <div class="text-center py-12">
                  <svg class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <p class="text-xs text-slate-500 dark:text-slate-400">No hay trabajadores asignados</p>
                </div>
              } @else {
                @for (trabajador of trabajadoresAsignadosFiltrados(); track trabajador.id_trabajador) {
                  @let asignacionesTrabajador = obtenerAsignacionesTrabajador(trabajador.id_trabajador);
                  <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm">
                    <div class="flex items-start gap-2 min-w-0 flex-1">
                      <div class="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {{ trabajador.nombres?.charAt(0) }}{{ trabajador.apellidos?.charAt(0) }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="font-semibold text-xs text-slate-800 dark:text-white truncate">{{ trabajador.nombres }} {{ trabajador.apellidos }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">{{ trabajador.cedula || 'S/cédula' }}</p>
                        @if (trabajador.especialidad) {
                          <span class="inline-block mt-1 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded">{{ trabajador.especialidad }}</span>
                        }
                      </div>
                    </div>
                    @if (asignacionesTrabajador.length > 0) {
                      <div class="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <div class="flex flex-wrap gap-1">
                          @for (asignacion of asignacionesTrabajador.slice(0, 3); track asignacion.id_asignacion) {
                            <div class="px-1.5 py-0.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded text-[10px]">
                              <span class="font-medium text-green-700 dark:text-green-300">{{ asignacion.diaNombre.substring(0,3) }}</span>
                            </div>
                          }
                          @if (asignacionesTrabajador.length > 3) {
                            <div class="text-[10px] text-green-600 dark:text-green-400 font-semibold">+{{ asignacionesTrabajador.length - 3 }}</div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              }
            } @else {
              @if (trabajadoresNoAsignadosFiltrados().length === 0) {
                <div class="text-center py-12">
                  <svg class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Todos están asignados</p>
                </div>
              } @else {
                @for (trabajador of trabajadoresNoAsignadosFiltrados(); track trabajador.id_trabajador) {
                  <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm">
                    <div class="flex items-start gap-2 min-w-0 flex-1">
                      <div class="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {{ trabajador.nombres?.charAt(0) }}{{ trabajador.apellidos?.charAt(0) }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="font-semibold text-xs text-slate-800 dark:text-white truncate">{{ trabajador.nombres }} {{ trabajador.apellidos }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">{{ trabajador.cedula || 'S/cédula' }}</p>
                        @if (trabajador.especialidad) {
                          <span class="inline-block mt-1 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded">{{ trabajador.especialidad }}</span>
                        }
                        <div class="text-[10px] text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                          <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clip-rule="evenodd" />
                          </svg>
                          <span>Disponible</span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              }
            }
          </div>
        </div>
      }

      <!-- Modal Historial de Horas Trabajadas -->
      @if (mostrarModalHistorialHoras()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 md:p-4" (click)="cerrarModalHistorialHoras()">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full md:max-w-4xl animate-fade-in h-[95vh] md:h-[85vh] flex flex-col relative" (click)="$event.stopPropagation()">
            
            <!-- Header del modal -->
            <div class="px-4 py-3 md:p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex-1">
                  <h3 class="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div class="w-8 md:w-10 h-8 md:h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg class="w-4 md:w-5 h-4 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <span class="truncate">Historial de Horas Trabajadas</span>
                  </h3>
                </div>
                <button (click)="cerrarModalHistorialHoras()" class="p-1.5 md:p-2 flex-shrink-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              <!-- Filtros de fecha -->
              <div class="flex flex-wrap gap-2 mb-3">
                <button (click)="cambiarRangoHistorial('dia')"
                  [class.bg-violet-600]="filtroHistorialRango() === 'dia'"
                  [class.text-white]="filtroHistorialRango() === 'dia'"
                  [class.bg-slate-100]="filtroHistorialRango() !== 'dia'"
                  [class.dark:bg-slate-700]="filtroHistorialRango() !== 'dia'"
                  [class.text-slate-700]="filtroHistorialRango() !== 'dia'"
                  [class.dark:text-slate-300]="filtroHistorialRango() !== 'dia'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  Hoy
                </button>
                <button (click)="cambiarRangoHistorial('semana')"
                  [class.bg-violet-600]="filtroHistorialRango() === 'semana'"
                  [class.text-white]="filtroHistorialRango() === 'semana'"
                  [class.bg-slate-100]="filtroHistorialRango() !== 'semana'"
                  [class.dark:bg-slate-700]="filtroHistorialRango() !== 'semana'"
                  [class.text-slate-700]="filtroHistorialRango() !== 'semana'"
                  [class.dark:text-slate-300]="filtroHistorialRango() !== 'semana'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  Esta semana
                </button>
                <button (click)="cambiarRangoHistorial('mes')"
                  [class.bg-violet-600]="filtroHistorialRango() === 'mes'"
                  [class.text-white]="filtroHistorialRango() === 'mes'"
                  [class.bg-slate-100]="filtroHistorialRango() !== 'mes'"
                  [class.dark:bg-slate-700]="filtroHistorialRango() !== 'mes'"
                  [class.text-slate-700]="filtroHistorialRango() !== 'mes'"
                  [class.dark:text-slate-300]="filtroHistorialRango() !== 'mes'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  Este mes
                </button>
                
                <!-- Selector de fecha personalizada -->
                <input type="date"
                  [ngModel]="filtroHistorialFecha()"
                  (ngModelChange)="cambiarFechaHistorial($event)"
                  class="ml-auto px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs">
              </div>
              
              <!-- Resumen rápido -->
              @if (resumenHistorialHoras()) {
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div class="bg-violet-50 dark:bg-violet-900/30 rounded-lg p-2.5 text-center">
                    <p class="text-lg md:text-xl font-bold text-violet-600 dark:text-violet-400">{{ resumenHistorialHoras().total_horas_formateado }}</p>
                    <p class="text-xs text-violet-700 dark:text-violet-300">Total Horas</p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5 text-center">
                    <p class="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{{ resumenHistorialHoras().total_registros }}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Registros</p>
                  </div>
                  <div class="bg-green-50 dark:bg-green-900/30 rounded-lg p-2.5 text-center">
                    <p class="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">{{ resumenHistorialHoras().cantidad_trabajadores }}</p>
                    <p class="text-xs text-green-700 dark:text-green-300">Trabajadores</p>
                  </div>
                  <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2.5 text-center">
                    <p class="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">{{ resumenHistorialHoras().cantidad_proyectos }}</p>
                    <p class="text-xs text-blue-700 dark:text-blue-300">Proyectos</p>
                  </div>
                </div>
              }
            </div>
            
            <!-- Contenido con scroll -->
            <div class="flex-1 overflow-y-auto p-4">
              @if (cargandoHistorial()) {
                <div class="flex items-center justify-center py-12">
                  <svg class="animate-spin h-8 w-8 text-violet-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span class="ml-3 text-slate-600 dark:text-slate-400">Cargando historial...</span>
                </div>
              } @else if (historialHoras().length === 0) {
                <div class="text-center py-12 text-slate-500 dark:text-slate-400">
                  <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-lg font-medium">No hay registros de horas</p>
                  <p class="text-sm mt-2">No se encontraron registros de asistencia para el período seleccionado</p>
                </div>
              } @else {
                <div class="space-y-3">
                  @for (registro of historialHoras(); track registro.id_entrada) {
                    <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div class="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <!-- Info del trabajador -->
                        <div class="flex items-start gap-3 flex-1">
                          <div class="w-10 h-10 bg-gradient-to-br from-violet-400 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {{ obtenerInicialesHistorial(registro.nombre_trabajador) }}
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="font-semibold text-slate-800 dark:text-white">{{ registro.nombre_trabajador }}</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400">
                              {{ registro.cedula || 'Sin cédula' }}
                              @if (registro.cargo) {
                                <span class="mx-1">•</span>
                                <span class="text-violet-600 dark:text-violet-400">{{ registro.cargo }}</span>
                              }
                            </p>
                          </div>
                        </div>
                        
                        <!-- Horas trabajadas destacadas -->
                        <div class="flex items-center gap-2 md:gap-4 flex-wrap md:flex-nowrap">
                          <div class="px-3 py-1.5 rounded-lg text-center min-w-[80px]"
                            [class.bg-green-100]="registro.tiene_salida"
                            [class.dark:bg-green-900/30]="registro.tiene_salida"
                            [class.bg-amber-100]="!registro.tiene_salida"
                            [class.dark:bg-amber-900/30]="!registro.tiene_salida">
                            <p class="text-lg font-bold"
                              [class.text-green-700]="registro.tiene_salida"
                              [class.dark:text-green-300]="registro.tiene_salida"
                              [class.text-amber-700]="!registro.tiene_salida"
                              [class.dark:text-amber-300]="!registro.tiene_salida">
                              {{ registro.horas_formateadas }}
                            </p>
                            <p class="text-xs"
                              [class.text-green-600]="registro.tiene_salida"
                              [class.dark:text-green-400]="registro.tiene_salida"
                              [class.text-amber-600]="!registro.tiene_salida"
                              [class.dark:text-amber-400]="!registro.tiene_salida">
                              {{ registro.tiene_salida ? 'horas' : 'en curso' }}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Detalles -->
                      <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <!-- Fecha -->
                        <div class="flex items-center gap-2">
                          <svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          <div>
                            <p class="text-slate-500 dark:text-slate-400">Fecha</p>
                            <p class="font-medium text-slate-700 dark:text-slate-200">{{ formatearFechaHistorial(registro.fecha) }}</p>
                          </div>
                        </div>
                        
                        <!-- Entrada/Salida -->
                        <div class="flex items-center gap-2">
                          <svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <div>
                            <p class="text-slate-500 dark:text-slate-400">Horario</p>
                            <p class="font-medium text-slate-700 dark:text-slate-200">
                              {{ registro.hora_entrada?.substring(0,5) || '--:--' }} - {{ registro.hora_salida?.substring(0,5) || '--:--' }}
                            </p>
                          </div>
                        </div>
                        
                        <!-- Proyecto/OT -->
                        <div class="flex items-center gap-2">
                          <svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                          </svg>
                          <div>
                            <p class="text-slate-500 dark:text-slate-400">OT</p>
                            <p class="font-medium text-violet-600 dark:text-violet-400">{{ registro.numero_ot || 'Sin OT' }}</p>
                          </div>
                        </div>
                        
                        <!-- Proyecto nombre -->
                        <div class="flex items-center gap-2">
                          <svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                          <div class="min-w-0">
                            <p class="text-slate-500 dark:text-slate-400">Proyecto</p>
                            <p class="font-medium text-slate-700 dark:text-slate-200 truncate" title="{{ registro.nombre_proyecto }}">
                              {{ registro.nombre_proyecto || 'Sin proyecto' }}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      @if (registro.observaciones) {
                        <div class="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                          <p class="text-xs text-slate-500 dark:text-slate-400">
                            <span class="font-medium">Observaciones:</span> {{ registro.observaciones }}
                          </p>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
            
            <!-- Footer -->
            <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Mostrando {{ historialHoras().length }} registros
                </p>
                <button (click)="cargarHistorialHoras()"
                  class="px-3 py-1.5 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s ease-in;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Scrollbar personalizada para mobile */
    .scrollbar-thin::-webkit-scrollbar {
      height: 4px;
    }

    .scrollbar-thin::-webkit-scrollbar-track {
      background: transparent;
    }

    .scrollbar-thin::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.3);
      border-radius: 2px;
    }

    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.5);
    }

    /* Estilos para navegadores Firefox */
    .scrollbar-thin {
      scrollbar-width: thin;
      scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
    }

    /* Mejorar visibilidad del contenido en cards de móvil */
    @media (max-width: 768px) {
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  `]
})
export class ScheduleComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private csvExportService = inject(CsvExportService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationModalService);
  private autoRefreshService = inject(AutoRefreshService);
  private refreshSub: Subscription | null = null;
  private baseUrl = environment.apiUrl;

  // Verificar si el usuario es admin
  isAdmin = computed(() => this.authService.currentUser()?.rol === 'admin');

  fechaReferencia = signal(new Date());
  asignaciones = signal<Asignacion[]>([]);
  ordenesActivas = signal<OrdenTrabajo[]>([]);
  trabajadoresDisponibles = signal<Trabajador[]>([]);
  mostrarModal = signal(false);
  mostrarModalTrabajadores = signal(false);
  diaSeleccionado = signal<DiaCalendario | null>(null);
  otSeleccionada = signal<OrdenTrabajo | null>(null);
  guardando = signal(false);
  advertenciaConflicto = signal<string | null>(null);

  // Filtros de búsqueda de proyectos
  busquedaProyecto = signal<string>('');
  filtroCliente = signal<string>('todos');
  mostrarModalClientes = signal<boolean>(false);

  // Clientes únicos para el filtro
  clientesUnicos = computed(() => {
    const ordenes = this.ordenesActivas();
    const clientes = [...new Set(ordenes.map(o => o.nombre_cliente))].filter(c => c);
    return clientes.sort();
  });

  // Truncar texto para mostrar en select móvil
  truncarTexto(texto: string, maxLen: number = 30): string {
    if (!texto) return '';
    if (texto.length <= maxLen) return texto;
    return texto.substring(0, maxLen) + '...';
  }

  // Seleccionar cliente desde modal
  seleccionarCliente(cliente: string) {
    this.filtroCliente.set(cliente);
    this.mostrarModalClientes.set(false);
  }

  // Órdenes de trabajo filtradas
  ordenesActivasFiltradas = computed(() => {
    let ordenes = this.ordenesActivas();
    
    // Filtrar por cliente
    const cliente = this.filtroCliente();
    if (cliente !== 'todos') {
      ordenes = ordenes.filter(o => o.nombre_cliente === cliente);
    }
    
    // Filtrar por búsqueda (número OT, cliente)
    const busqueda = this.busquedaProyecto().toLowerCase().trim();
    if (busqueda) {
      ordenes = ordenes.filter(o => {
        const numeroOt = (o.numero_ot || '').toLowerCase();
        const clienteNombre = (o.nombre_cliente || '').toLowerCase();
        return numeroOt.includes(busqueda) || 
               clienteNombre.includes(busqueda);
      });
    }
    
    return ordenes;
  });

  // Para selección múltiple de trabajadores
  trabajadoresSeleccionados = signal<number[]>([]);
  observacionesAsignacion = signal<string>('');
  busquedaTrabajador = signal<string>('');

  // Filtros para modal de resumen de trabajadores
  filtroResumenNombre = signal<string>('');
  filtroResumenEspecialidad = signal<string>('todos');
  filtroResumenContrato = signal<string>('todos');

  // Estado para vista móvil (null = resumen, 'asignados', 'disponibles')
  vistaMovilSeleccionada = signal<'asignados' | 'disponibles' | null>(null);

  // Modal de historial de horas trabajadas
  mostrarModalHistorialHoras = signal(false);
  historialHoras = signal<any[]>([]);
  resumenHistorialHoras = signal<any>(null);
  cargandoHistorial = signal(false);
  filtroHistorialFecha = signal<string>(this.formatearFechaISO(new Date()));
  filtroHistorialRango = signal<'dia' | 'semana' | 'mes'>('semana');

  seleccionarVistaMovil(vista: 'asignados' | 'disponibles' | null) {
    // Solo permitir cambio en pantallas pequeñas si se desea restringir, 
    // pero dejarlo libre permite probar en desktop reduciendo ventana
    this.vistaMovilSeleccionada.set(vista);
  }

  semanaActual = computed(() => {
    const fecha = this.fechaReferencia();
    const inicio = this.obtenerInicioSemana(fecha);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    return { inicio, fin };
  });

  diasSemana = computed(() => {
    const { inicio } = this.semanaActual();
    const dias: DiaCalendario[] = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(fecha.getDate() + i);

      const fechaStr = this.formatearFechaISO(fecha);
      const asignacionesDia = this.asignaciones().filter(a => a.fecha_asignada === fechaStr);

      dias.push({
        fecha,
        fechaStr,
        nombreDia: fecha.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '').toUpperCase(),
        numeroDia: fecha.getDate(),
        esPasado: fecha < hoy,
        esHoy: fecha.getTime() === hoy.getTime(),
        asignaciones: asignacionesDia
      });
    }

    return dias;
  });

  puedeGuardar = computed(() => {
    return this.trabajadoresSeleccionados().length > 0;
  });

  // Trabajadores ya asignados a esta OT en este día específico
  trabajadoresYaAsignadosEnEstaOT = computed(() => {
    const dia = this.diaSeleccionado();
    const ot = this.otSeleccionada();
    if (!dia || !ot) return new Set<number>();

    return new Set(
      this.asignaciones()
        .filter(a => a.id_ot === ot.id_ot && a.fecha_asignada === dia.fechaStr)
        .map(a => a.id_trabajador)
    );
  });

  // Trabajadores ya asignados a CUALQUIER OT en este día (para bloquear selección)
  trabajadoresYaAsignadosHoy = computed(() => {
    const dia = this.diaSeleccionado();
    if (!dia) return new Set<number>();

    return new Set(
      this.asignaciones()
        .filter(a => a.fecha_asignada === dia.fechaStr)
        .map(a => a.id_trabajador)
    );
  });

  // Información de dónde está asignado cada trabajador hoy
  asignacionesPorTrabajadorHoy = computed(() => {
    const dia = this.diaSeleccionado();
    if (!dia) return new Map<number, Asignacion>();

    const mapa = new Map<number, Asignacion>();
    this.asignaciones()
      .filter(a => a.fecha_asignada === dia.fechaStr)
      .forEach(a => mapa.set(a.id_trabajador, a));
    return mapa;
  });

  // Trabajadores disponibles para asignar (no asignados a NINGUNA OT en este día)
  trabajadoresParaAsignar = computed(() => {
    const yaAsignados = this.trabajadoresYaAsignadosHoy();
    return this.trabajadoresDisponibles()
      .filter(t => !yaAsignados.has(t.id_trabajador))
      .sort((a, b) => `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`));
  });

  // Trabajadores filtrados por búsqueda
  trabajadoresParaAsignarFiltrados = computed(() => {
    const busqueda = this.busquedaTrabajador().toLowerCase().trim();
    const trabajadores = this.trabajadoresParaAsignar();

    if (!busqueda) return trabajadores;

    return trabajadores.filter(t => {
      const nombreCompleto = `${t.nombres} ${t.apellidos}`.toLowerCase();
      const cargo = (t.cargo || t.especialidad || t.tipo_contrato || '').toLowerCase();
      return nombreCompleto.includes(busqueda) || cargo.includes(busqueda);
    });
  });

  // Trabajadores ocupados en otras OTs filtrados por búsqueda
  trabajadoresOcupadosFiltrados = computed(() => {
    const busqueda = this.busquedaTrabajador().toLowerCase().trim();
    const trabajadores = this.trabajadoresOcupadosOtrasOTs();

    if (!busqueda) return trabajadores;

    return trabajadores.filter(info => {
      const nombreCompleto = `${info.trabajador.nombres} ${info.trabajador.apellidos}`.toLowerCase();
      return nombreCompleto.includes(busqueda);
    });
  });
  trabajadoresOcupadosOtrasOTs = computed(() => {
    const dia = this.diaSeleccionado();
    const ot = this.otSeleccionada();
    if (!dia || !ot) return [];

    const asignacionesOtrasOTs = this.asignaciones()
      .filter(a => a.fecha_asignada === dia.fechaStr && a.id_ot !== ot.id_ot);

    const resultado: { trabajador: Trabajador; asignacion: Asignacion }[] = [];

    for (const asignacion of asignacionesOtrasOTs) {
      const trabajador = this.trabajadoresDisponibles()
        .find(t => t.id_trabajador === asignacion.id_trabajador);
      if (trabajador) {
        resultado.push({ trabajador, asignacion });
      }
    }

    return resultado.sort((a, b) =>
      `${a.trabajador.apellidos} ${a.trabajador.nombres}`.localeCompare(`${b.trabajador.apellidos} ${b.trabajador.nombres}`)
    );
  });

  // Asignaciones vigentes: solo las de hoy en adelante (no días pasados)
  asignacionesVigentes = computed(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyStr = this.formatearFechaISO(hoy);
    return this.asignaciones().filter(a => a.fecha_asignada >= hoyStr);
  });

  trabajadoresAsignados = computed(() => {
    // Solo considera asignados a trabajadores con asignaciones desde hoy en adelante
    const idsAsignados = new Set(this.asignacionesVigentes().map(a => a.id_trabajador));
    return this.trabajadoresDisponibles()
      .filter((trabajador) => idsAsignados.has(trabajador.id_trabajador))
      .sort((a, b) => {
        const nombreA = `${a.apellidos} ${a.nombres}`.trim().toLowerCase();
        const nombreB = `${b.apellidos} ${b.nombres}`.trim().toLowerCase();
        return nombreA.localeCompare(nombreB);
      });
  });

  trabajadoresNoAsignados = computed(() => {
    // Disponibles: trabajadores sin asignaciones desde hoy en adelante
    const idsAsignados = new Set(this.asignacionesVigentes().map(a => a.id_trabajador));
    return this.trabajadoresDisponibles()
      .filter((trabajador) => !idsAsignados.has(trabajador.id_trabajador))
      .sort((a, b) => {
        const nombreA = `${a.apellidos} ${a.nombres}`.trim().toLowerCase();
        const nombreB = `${b.apellidos} ${b.nombres}`.trim().toLowerCase();
        return nombreA.localeCompare(nombreB);
      });
  });

  // Trabajadores asignados filtrados para el modal de resumen
  trabajadoresAsignadosFiltrados = computed(() => {
    return this.aplicarFiltrosResumen(this.trabajadoresAsignados());
  });

  // Trabajadores no asignados filtrados para el modal de resumen
  trabajadoresNoAsignadosFiltrados = computed(() => {
    return this.aplicarFiltrosResumen(this.trabajadoresNoAsignados());
  });

  // Función auxiliar para aplicar filtros del modal de resumen
  private aplicarFiltrosResumen(trabajadores: Trabajador[]): Trabajador[] {
    const nombre = this.filtroResumenNombre().toLowerCase().trim();
    const especialidad = this.filtroResumenEspecialidad();
    const contrato = this.filtroResumenContrato();

    return trabajadores.filter(t => {
      // Filtro por nombre
      if (nombre) {
        const nombreCompleto = `${t.nombres} ${t.apellidos}`.toLowerCase();
        const cedula = (t.cedula || '').toLowerCase();
        if (!nombreCompleto.includes(nombre) && !cedula.includes(nombre)) return false;
      }

      // Filtro por especialidad
      if (especialidad !== 'todos') {
        if ((t.especialidad || 'Sin especialidad') !== especialidad) return false;
      }

      // Filtro por tipo de contrato
      if (contrato !== 'todos') {
        if ((t.tipo_contrato || 'Sin contrato') !== contrato) return false;
      }

      return true;
    });
  }

  // Obtener especialidades únicas
  obtenerEspecialidadesUnicas(): string[] {
    const especialidades = new Set<string>();
    this.trabajadoresDisponibles().forEach(t => {
      especialidades.add(t.especialidad || 'Sin especialidad');
    });
    return Array.from(especialidades).sort();
  }

  // Obtener tipos de contrato únicos
  obtenerContratosUnicos(): string[] {
    const contratos = new Set<string>();
    this.trabajadoresDisponibles().forEach(t => {
      contratos.add(t.tipo_contrato || 'Sin contrato');
    });
    return Array.from(contratos).sort();
  }

  // Calcular porcentaje de asignación
  calcularPorcentajeAsignacion(): number {
    const total = this.trabajadoresDisponibles().length;
    if (total === 0) return 0;
    return Math.round((this.trabajadoresAsignados().length / total) * 100);
  }

  // Verificar si hay filtros activos
  tieneFilttrosActivos(): boolean {
    return this.filtroResumenNombre() !== '' ||
      this.filtroResumenEspecialidad() !== 'todos' ||
      this.filtroResumenContrato() !== 'todos';
  }

  // Limpiar filtros del resumen
  limpiarFiltrosResumen(): void {
    this.filtroResumenNombre.set('');
    this.filtroResumenEspecialidad.set('todos');
    this.filtroResumenContrato.set('todos');
  }

  obtenerAsignaciones(id_ot: number, fechaStr: string): Asignacion[] {
    return this.asignaciones().filter(a =>
      a.id_ot === id_ot && a.fecha_asignada === fechaStr
    );
  }

  /**
   * Formatea el nombre del trabajador para mostrar nombre y apellido
   * Ejemplo: "JORGE LUIS PEREZ GARCIA" -> "Jorge Pérez"
   */
  formatearNombreTrabajador(nombreCompleto: string | undefined): string {
    if (!nombreCompleto) return 'Sin nombre';

    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length === 0) return 'Sin nombre';

    // Capitalizar primera letra de cada palabra
    const capitalizar = (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    if (partes.length === 1) {
      return capitalizar(partes[0]);
    }

    // Para nombres como "JUAN CARLOS PEREZ GARCIA" -> "Juan Pérez"
    // Tomamos el primer nombre y el primer apellido (asumiendo que hay 2 nombres y 2 apellidos)
    if (partes.length >= 4) {
      return `${capitalizar(partes[0])} ${capitalizar(partes[2])}`;
    }

    // Para nombres como "JUAN PEREZ GARCIA" -> "Juan Pérez"
    if (partes.length === 3) {
      return `${capitalizar(partes[0])} ${capitalizar(partes[1])}`;
    }

    // Para nombres como "JUAN PEREZ" -> "Juan Pérez"
    return `${capitalizar(partes[0])} ${capitalizar(partes[1])}`;
  }

  async ngOnInit() {
    await this.cargarDatos();
    
    // Suscribirse al auto-refresh global
    this.refreshSub = this.autoRefreshService.refresh$.subscribe(() => {
      this.cargarDatos();
    });
  }

  ngOnDestroy() {
    this.refreshSub?.unsubscribe();
  }

  async cargarDatos() {
    console.log('🔄 Iniciando carga de datos del cronograma...');
    await Promise.all([
      this.cargarAsignaciones(),
      this.cargarProyectosActivos(), // Cargar proyectos directamente
      this.cargarTrabajadores()
    ]);
  }

  async cargarAsignaciones() {
    const { inicio, fin } = this.semanaActual();
    const fechaInicio = this.formatearFechaISO(inicio);
    const fechaFin = this.formatearFechaISO(fin);

    try {
      console.log(`📅 Cargando asignaciones: ${fechaInicio} a ${fechaFin}`);

      // Cargar TODAS las asignaciones de la semana (sin filtrar por supervisor)
      const response: any = await firstValueFrom(
        this.http.get(`${this.baseUrl}/cronograma_asignaciones.php?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`)
      );

      console.log('✅ Respuesta asignaciones:', response);

      if (response.success) {
        const normalizadas = (response.data || []).map((a: any) => ({
          id_asignacion: Number(a.id_asignacion),
          id_ot: Number(a.id_ot),
          id_trabajador: Number(a.id_trabajador),
          fecha_asignada: a.fecha_asignada,
          numero_ot: a.numero_ot,
          nombre_cliente: a.nombre_cliente,
          nombre_trabajador: a.nombre_trabajador,
          cargo: a.cargo || a.especialidad || 'Sin cargo',
          observaciones: a.observaciones,
          id_supervisor: a.id_supervisor != null ? Number(a.id_supervisor) : null,
          estado: a.estado || 'ACTIVA'
        }));

        console.log(`📊 Asignaciones normalizadas (${normalizadas.length}):`, normalizadas);
        this.asignaciones.set(normalizadas);
      } else {
        console.warn('⚠️ No se encontraron asignaciones');
        this.asignaciones.set([]);
      }
    } catch (error) {
      console.error('❌ Error cargando asignaciones:', error);
      this.asignaciones.set([]);
    }
  }

  async cargarProyectosActivos() {
    try {
      console.log('📋 Cargando proyectos activos...');
      const response: any = await firstValueFrom(
        this.http.get(`${this.baseUrl}/proyectos.php?estado=ACTIVO`)
      );

      console.log('✅ Respuesta proyectos:', response);

      if (response.success && Array.isArray(response.data)) {
        // Transformar proyectos a formato de OTs para compatibilidad
        const ordenesDesdeProyectos = response.data.map((proyecto: any) => ({
          id_ot: Number(proyecto.id_ot) || Number(proyecto.id_proyecto),
          numero_ot: proyecto.numero_ot || `PROYECTO-${proyecto.id_proyecto}`,
          nombre_cliente: proyecto.nombre_proyecto || 'Proyecto sin nombre',
          plazo_estimado_dias: 0,
          estado: 'en_proceso',
          id_supervisor: Number(proyecto.id_supervisor) || null,
          estado_proyecto: 'ACTIVO',
          id_proyecto: Number(proyecto.id_proyecto),
          es_proyecto_sin_ot: Number(proyecto.id_ot) === 0 || !proyecto.id_ot,
          hora_ingreso: proyecto.hora_ingreso || null,
          hora_salida: proyecto.hora_salida || null,
          ubicacion_cliente: proyecto.ubicacion_cliente || proyecto.ubicacion || null
        }));

        console.log(`📋 Proyectos activos (${ordenesDesdeProyectos.length}):`, ordenesDesdeProyectos);
        this.ordenesActivas.set(ordenesDesdeProyectos);
      } else {
        console.warn('⚠️ No se encontraron proyectos activos');
        this.ordenesActivas.set([]);
      }
    } catch (error) {
      console.error('❌ Error cargando proyectos:', error);
      this.ordenesActivas.set([]);
    }
  }

  async cargarTrabajadores() {
    try {
      console.log('👷 Cargando trabajadores...');
      const response: any = await firstValueFrom(
        this.http.get(`${this.baseUrl}/trabajadores.php`)
      );

      console.log('✅ Respuesta trabajadores:', response);

      if (response.success) {
        const normalizados = (response.data || []).map((t: any) => ({
          id_trabajador: Number(t.id_trabajador),
          cedula: t.cedula,
          nombres: t.nombres,
          apellidos: t.apellidos,
          direccion: t.direccion,
          tipo_contrato: t.tipo_contrato,
          fecha_ingreso: t.fecha_ingreso,
          especialidad: t.especialidad,
          telefono: t.telefono,
          tarifa_hora: t.tarifa_hora,
          estado: t.estado,
          cargo: t.especialidad || t.tipo_contrato || 'Sin información'
        }));

        console.log(`👷 Trabajadores normalizados (${normalizados.length}):`, normalizados);
        this.trabajadoresDisponibles.set(normalizados);
      } else {
        console.warn('⚠️ No se encontraron trabajadores');
        this.trabajadoresDisponibles.set([]);
      }
    } catch (error) {
      console.error('❌ Error cargando trabajadores:', error);
      this.trabajadoresDisponibles.set([]);
    }
  }

  obtenerInicioSemana(fecha: Date): Date {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  formatearTituloSemana(): string {
    const { inicio, fin } = this.semanaActual();
    const mesInicio = inicio.toLocaleDateString('es-ES', { month: 'long' });
    const mesFin = fin.toLocaleDateString('es-ES', { month: 'long' });

    if (inicio.getMonth() === fin.getMonth()) {
      return `Semana del ${inicio.getDate()} al ${fin.getDate()} de ${mesInicio}`;
    } else {
      return `Semana del ${inicio.getDate()} de ${mesInicio} al ${fin.getDate()} de ${mesFin}`;
    }
  }

  formatearFechaISO(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  crearFechaLocal(fechaStr: string): Date {
    const [year, month, day] = fechaStr.split('-').map(Number);
    return new Date(year, (month ?? 1) - 1, day ?? 1);
  }

  formatearDiaSemana(fechaStr: string): string {
    const fecha = this.crearFechaLocal(fechaStr);
    return fecha.toLocaleDateString('es-ES', { weekday: 'long' });
  }

  formatearFechaCorta(fechaStr: string): string {
    const fecha = this.crearFechaLocal(fechaStr);
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  /**
   * Obtiene asignaciones vigentes de un trabajador (solo desde hoy en adelante)
   * Se usa en el modal de resumen de trabajadores para mostrar días asignados
   */
  obtenerAsignacionesTrabajador(id_trabajador: number): AsignacionDetalle[] {
    return this.asignacionesVigentes()
      .filter((asignacion) => asignacion.id_trabajador === id_trabajador)
      .map((asignacion) => ({
        ...asignacion,
        diaNombre: this.formatearDiaSemana(asignacion.fecha_asignada),
        fechaCorta: this.formatearFechaCorta(asignacion.fecha_asignada)
      }))
      .sort((a, b) => a.fecha_asignada.localeCompare(b.fecha_asignada));
  }

  /**
   * Obtiene TODAS las asignaciones de un trabajador en la semana (incluyendo días pasados)
   * Se usa para mantener el historial en el cronograma visual
   */
  obtenerAsignacionesTrabajadorHistorial(id_trabajador: number): AsignacionDetalle[] {
    return this.asignaciones()
      .filter((asignacion) => asignacion.id_trabajador === id_trabajador)
      .map((asignacion) => ({
        ...asignacion,
        diaNombre: this.formatearDiaSemana(asignacion.fecha_asignada),
        fechaCorta: this.formatearFechaCorta(asignacion.fecha_asignada)
      }))
      .sort((a, b) => a.fecha_asignada.localeCompare(b.fecha_asignada));
  }

  semanaAnterior() {
    const fecha = new Date(this.fechaReferencia());
    fecha.setDate(fecha.getDate() - 7);
    this.fechaReferencia.set(fecha);
    this.cargarAsignaciones();
  }

  semanaSiguiente() {
    const fecha = new Date(this.fechaReferencia());
    fecha.setDate(fecha.getDate() + 7);
    this.fechaReferencia.set(fecha);
    this.cargarAsignaciones();
  }

  abrirModalTrabajadores() {
    this.mostrarModalTrabajadores.set(true);
  }

  cerrarModalTrabajadores() {
    this.mostrarModalTrabajadores.set(false);
    this.vistaMovilSeleccionada.set(null);
    this.limpiarFiltrosResumen();
  }

  // ========================================
  // MÉTODOS PARA HISTORIAL DE HORAS
  // ========================================

  abrirModalHistorialHoras() {
    this.mostrarModalHistorialHoras.set(true);
    this.cargarHistorialHoras();
  }

  cerrarModalHistorialHoras() {
    this.mostrarModalHistorialHoras.set(false);
    this.historialHoras.set([]);
    this.resumenHistorialHoras.set(null);
  }

  async cargarHistorialHoras() {
    this.cargandoHistorial.set(true);

    try {
      const { fechaInicio, fechaFin } = this.calcularRangoFechas();

      const response: any = await firstValueFrom(
        this.http.get(`${this.baseUrl}/historial_horas.php?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`)
      );

      console.log('📊 Historial de horas:', response);

      if (response.success) {
        this.historialHoras.set(response.data.registros || []);
        this.resumenHistorialHoras.set(response.data.resumen || null);
      } else {
        console.warn('⚠️ No se encontraron registros de horas');
        this.historialHoras.set([]);
        this.resumenHistorialHoras.set(null);
      }
    } catch (error) {
      console.error('❌ Error cargando historial de horas:', error);
      this.historialHoras.set([]);
      this.resumenHistorialHoras.set(null);
    } finally {
      this.cargandoHistorial.set(false);
    }
  }

  calcularRangoFechas(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    let fechaInicio: Date;
    let fechaFin: Date = new Date();

    switch (this.filtroHistorialRango()) {
      case 'dia':
        // Solo hoy
        fechaInicio = new Date(hoy);
        break;
      case 'semana':
        // Últimos 7 días incluyendo hoy
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(fechaInicio.getDate() - 6);
        break;
      case 'mes':
        // Últimos 30 días
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(fechaInicio.getDate() - 29);
        break;
      default:
        fechaInicio = new Date(hoy);
    }

    return {
      fechaInicio: this.formatearFechaISO(fechaInicio),
      fechaFin: this.formatearFechaISO(fechaFin)
    };
  }

  cambiarRangoHistorial(rango: 'dia' | 'semana' | 'mes') {
    this.filtroHistorialRango.set(rango);
    this.cargarHistorialHoras();
  }

  cambiarFechaHistorial(fecha: string) {
    this.filtroHistorialFecha.set(fecha);
    // Al seleccionar una fecha específica, mostrar solo ese día
    this.filtroHistorialRango.set('dia');
    this.cargarHistorialHorasConFecha(fecha, fecha);
  }

  async cargarHistorialHorasConFecha(fechaInicio: string, fechaFin: string) {
    this.cargandoHistorial.set(true);

    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.baseUrl}/historial_horas.php?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`)
      );

      if (response.success) {
        this.historialHoras.set(response.data.registros || []);
        this.resumenHistorialHoras.set(response.data.resumen || null);
      } else {
        this.historialHoras.set([]);
        this.resumenHistorialHoras.set(null);
      }
    } catch (error) {
      console.error('❌ Error cargando historial de horas:', error);
      this.historialHoras.set([]);
      this.resumenHistorialHoras.set(null);
    } finally {
      this.cargandoHistorial.set(false);
    }
  }

  formatearFechaHistorial(fechaStr: string): string {
    if (!fechaStr) return 'Sin fecha';
    const fecha = this.crearFechaLocal(fechaStr);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (fecha.getTime() === hoy.getTime()) {
      return 'Hoy';
    } else if (fecha.getTime() === ayer.getTime()) {
      return 'Ayer';
    }

    return fecha.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  obtenerInicialesHistorial(nombre: string): string {
    if (!nombre) return '?';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
    }
    return nombre.charAt(0).toUpperCase();
  }

  abrirModalAsignacion(ot: OrdenTrabajo, dia: DiaCalendario) {
    this.otSeleccionada.set(ot);
    this.diaSeleccionado.set(dia);
    this.trabajadoresSeleccionados.set([]);
    this.observacionesAsignacion.set('');
    this.advertenciaConflicto.set(null);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.diaSeleccionado.set(null);
    this.otSeleccionada.set(null);
    this.trabajadoresSeleccionados.set([]);
    this.observacionesAsignacion.set('');
    this.busquedaTrabajador.set('');
    this.advertenciaConflicto.set(null);
  }

  estaSeleccionado(idTrabajador: number): boolean {
    return this.trabajadoresSeleccionados().includes(idTrabajador);
  }

  toggleTrabajador(idTrabajador: number) {
    const actuales = this.trabajadoresSeleccionados();
    if (actuales.includes(idTrabajador)) {
      this.trabajadoresSeleccionados.set(actuales.filter(id => id !== idTrabajador));
    } else {
      this.trabajadoresSeleccionados.set([...actuales, idTrabajador]);
    }
  }

  async verificarConflicto() {
    // Ya no es necesario con la nueva lógica de filtrado
  }

  async guardarAsignaciones() {
    const user = this.authService.currentUser();
    const dia = this.diaSeleccionado();
    const ot = this.otSeleccionada();
    const trabajadores = this.trabajadoresSeleccionados();

    if (!user || !dia || !ot || trabajadores.length === 0) return;

    this.guardando.set(true);

    try {
      const idSupervisor = this.obtenerSupervisorParaAsignacion(user.id_usuario);

      if (!idSupervisor) {
        this.toastService.showError('No se pudo determinar el supervisor responsable. Intenta volver a iniciar sesión.');
        this.guardando.set(false);
        return;
      }

      // Obtener nombres de trabajadores para mensajes
      const nombresTrabajadores = new Map<number, string>();
      this.trabajadoresDisponibles().forEach(t => {
        nombresTrabajadores.set(t.id_trabajador, `${t.nombres} ${t.apellidos}`);
      });

      // Guardar todas las asignaciones en paralelo usando allSettled
      const promesas = trabajadores.map(idTrabajador => {
        const payload = {
          id_ot: ot.id_ot,
          id_trabajador: idTrabajador,
          fecha_asignada: dia.fechaStr,
          id_supervisor: idSupervisor,
          observaciones: this.observacionesAsignacion() || null
        };

        return firstValueFrom(
          this.http.post(`${this.baseUrl}/cronograma_asignaciones.php`, payload)
        ).then(response => ({ idTrabajador, response, success: true }))
          .catch(error => ({ idTrabajador, error, success: false }));
      });

      const resultados = await Promise.all(promesas);

      const exitosos = resultados.filter(r => r.success && (r as any).response?.success);
      const fallidos = resultados.filter(r => !r.success || !(r as any).response?.success);

      if (fallidos.length === 0) {
        this.toastService.showSuccess(`✅ ${exitosos.length} trabajador(es) asignado(s) correctamente`);
      } else if (exitosos.length > 0) {
        const nombresExitosos = exitosos.map(r => nombresTrabajadores.get(r.idTrabajador) || 'Desconocido').join(', ');
        const nombresFallidos = fallidos.map(r => nombresTrabajadores.get(r.idTrabajador) || 'Desconocido').join(', ');
        this.toastService.showWarning(`✅ Asignados: ${nombresExitosos}\n\n⚠️ Ya asignados a otra OT: ${nombresFallidos}`);
      } else {
        this.toastService.showError('❌ No se pudieron crear las asignaciones. Los trabajadores ya están asignados a otra OT en esta fecha.');
      }

      this.cerrarModal();
      await this.cargarAsignaciones();
    } catch (error: any) {
      console.error('Error guardando asignaciones:', error);
      this.toastService.showError('Error al crear las asignaciones');
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminarAsignacion(id_asignacion: number) {
    const confirmado = await this.confirmationService.confirm(
      '¿Eliminar esta asignación?',
      {
        title: 'Confirmar eliminación',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    );

    if (!confirmado) return;

    try {
      const response: any = await firstValueFrom(
        this.http.delete(`${this.baseUrl}/cronograma_asignaciones.php?id_asignacion=${id_asignacion}`)
      );

      if (response.success) {
        this.toastService.showSuccess('✅ Asignación eliminada correctamente');
        await this.cargarAsignaciones();
      } else {
        this.toastService.showError('Error: ' + response.message);
      }
    } catch (error) {
      this.toastService.showError('Error al eliminar la asignación');
      console.error('Error eliminando asignación:', error);
    }
  }

  private obtenerSupervisorParaAsignacion(idUsuarioActual: number | null | undefined): number | null {
    if (idUsuarioActual && idUsuarioActual > 0) {
      return idUsuarioActual;
    }

    const ot = this.otSeleccionada();
    if (ot?.id_supervisor && ot.id_supervisor > 0) {
      return ot.id_supervisor;
    }

    return null;
  }

  // ========================================
  // MÉTODOS DE EXPORTACIÓN
  // ========================================

  // Logo en base64 para el PDF
  private readonly LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDI0LTAxLTE1VDEwOjAwOjAwLTA1OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0wMS0xNVQxMDowMDowMC0wNTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyNC0wMS0xNVQxMDowMDowMC0wNTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MTIzNDU2NzgtMTIzNC0xMjM0LTEyMzQtMTIzNDU2Nzg5YWJjIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjEyMzQ1Njc4LTEyMzQtMTIzNC0xMjM0LTEyMzQ1Njc4OWFiYyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjEyMzQ1Njc4LTEyMzQtMTIzNC0xMjM0LTEyMzQ1Njc4OWFiYyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MTIzNDU2NzgtMTIzNC0xMjM0LTEyMzQtMTIzNDU2Nzg5YWJjIiBzdEV2dDp3aGVuPSIyMDI0LTAxLTE1VDEwOjAwOjAwLTA1OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+SERGEVA=';

  exportarPDF(): void {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Colores corporativos basados en el logo SERGEVA (tonos azul oscuro)
    const colorPrimario = [25, 55, 95];      // Azul oscuro principal
    const colorSecundario = [35, 75, 125];   // Azul medio
    const colorAcento = [55, 115, 175];      // Azul claro
    const colorExito = [34, 139, 34];        // Verde para asignaciones

    // === ENCABEZADO ===
    // Fondo del header con gradiente visual (dos rectángulos)
    doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.rect(0, 0, pageWidth, 38, 'F');
    doc.setFillColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.rect(0, 32, pageWidth, 6, 'F');

    // Agregar logo
    try {
      doc.addImage(this.LOGO_BASE64, 'PNG', 10, 5, 28, 28);
    } catch (e) {
      // Si falla el logo, solo mostrar texto
      console.warn('No se pudo cargar el logo:', e);
    }

    // Título al lado del logo
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('SERGEVA', 42, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Cronograma de Planificación Semanal', 42, 25);

    // Información derecha
    doc.setFontSize(9);
    doc.text(this.formatearTituloSemana(), pageWidth - 14, 12, { align: 'right' });
    doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, pageWidth - 14, 20, { align: 'right' });
    doc.text(`${this.ordenesActivas().length} proyectos activos`, pageWidth - 14, 28, { align: 'right' });

    // === TABLA PRINCIPAL ===
    const dias = this.diasSemana();
    const ordenes = this.ordenesActivas();

    // Calcular totales por día
    const totalesPorDia = dias.map(dia => {
      let total = 0;
      ordenes.forEach(ot => {
        total += this.obtenerAsignaciones(ot.id_ot, dia.fechaStr).length;
      });
      return total;
    });

    // Headers con fecha completa
    const headers = [
      'Proyecto',
      ...dias.map((d, i) => `${d.nombreDia} ${d.numeroDia}\n(${totalesPorDia[i]} asig.)`)
    ];

    // Filas con datos mejorados
    const rows = ordenes.map(ot => {
      const celdas = [
        `${ot.numero_ot}\n${ot.nombre_cliente}\n⏱ ${ot.plazo_estimado_dias} días`
      ];

      dias.forEach(dia => {
        const asignaciones = this.obtenerAsignaciones(ot.id_ot, dia.fechaStr);
        if (asignaciones.length > 0) {
          // Formato compacto: solo primer nombre y primer apellido, separados por comas
          const nombres = asignaciones
            .map(a => {
              const nombreCompleto = a.nombre_trabajador || 'N/A';
              const partes = nombreCompleto.split(' ');
              // Tomar primer nombre y primer apellido si hay más de 2 partes
              if (partes.length >= 3) {
                return `${partes[0]} ${partes[Math.floor(partes.length / 2)]}`;
              } else if (partes.length === 2) {
                return `${partes[0]} ${partes[1]}`;
              }
              return partes[0];
            })
            .join(', ');
          celdas.push(`(${asignaciones.length}) ${nombres}`);
        } else {
          celdas.push('—');
        }
      });

      return celdas;
    });

    // Generar tabla
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 45,
      theme: 'grid',
      styles: {
        fontSize: 6,
        cellPadding: 1.5,
        overflow: 'linebreak',
        valign: 'middle',
        lineColor: [180, 190, 200],
        lineWidth: 0.1,
        cellWidth: 'wrap'
      },
      headStyles: {
        fillColor: colorPrimario as [number, number, number],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 7,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 38, fontStyle: 'bold', fillColor: [235, 240, 250], fontSize: 6 },
        1: { cellWidth: 36 },
        2: { cellWidth: 36 },
        3: { cellWidth: 36 },
        4: { cellWidth: 36 },
        5: { cellWidth: 36 },
        6: { cellWidth: 36 },
        7: { cellWidth: 36 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 255]
      },
      didParseCell: (data: any) => {
        // Resaltar día actual
        const diaIndex = dias.findIndex(d => d.esHoy);
        if (diaIndex >= 0 && data.column.index === diaIndex + 1) {
          if (data.section === 'head') {
            data.cell.styles.fillColor = colorAcento as [number, number, number];
          } else {
            data.cell.styles.fillColor = [230, 240, 255];
          }
        }
        // Colorear celdas con asignaciones
        if (data.section === 'body' && data.column.index > 0) {
          const cellText = data.cell.raw?.toString() || '';
          if (cellText !== '—' && cellText.length > 1) {
            data.cell.styles.textColor = colorSecundario as [number, number, number];
          } else {
            data.cell.styles.textColor = [180, 180, 180];
            data.cell.styles.halign = 'center';
          }
        }
      }
    });

    // === RESUMEN ===
    const finalY = (doc as any).lastAutoTable?.finalY || 150;

    // Caja de resumen con colores corporativos
    doc.setFillColor(235, 240, 250);
    doc.roundedRect(14, finalY + 8, pageWidth - 28, 25, 3, 3, 'F');
    doc.setDrawColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, finalY + 8, pageWidth - 28, 25, 3, 3, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('Resumen de la Semana:', 20, finalY + 18);

    doc.setFont('helvetica', 'normal');
    const totalAsignaciones = totalesPorDia.reduce((a, b) => a + b, 0);
    const proyectosConAsig = ordenes.filter(ot =>
      dias.some(d => this.obtenerAsignaciones(ot.id_ot, d.fechaStr).length > 0)
    ).length;

    doc.text(`Total asignaciones: ${totalAsignaciones}`, 20, finalY + 26);
    doc.text(`Proyectos con personal: ${proyectosConAsig} de ${ordenes.length}`, 100, finalY + 26);
    doc.text(`Trabajadores únicos: ${this.contarTrabajadoresUnicos()}`, 200, finalY + 26);

    // Pie de página con línea decorativa
    doc.setDrawColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
    
    doc.setFontSize(8);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('SERGEVA S.A. - Sistema de Gestión de Proyectos', 14, pageHeight - 8);
    doc.text(`Página 1 de 1`, pageWidth - 30, pageHeight - 8);

    // Guardar
    const fechaArchivo = this.formatearFechaParaArchivo();
    doc.save(`Cronograma_Semana_${fechaArchivo}.pdf`);
  }

  exportarExcel(): void {
    const dias = this.diasSemana();
    const ordenes = this.ordenesActivas();

    // Formato mejorado: Una fila por proyecto con columnas para cada día
    const data: any[] = [];

    // Agregar fila de encabezado con información
    data.push({
      'Proyecto': `CRONOGRAMA SEMANAL - ${this.formatearTituloSemana()}`,
      'Cliente': '',
      'Estado': '',
      'LUN': '',
      'MAR': '',
      'MIE': '',
      'JUE': '',
      'VIE': '',
      'SAB': '',
      'Total Asignaciones': ''
    });

    // Fila vacía separadora
    data.push({
      'Proyecto': '',
      'Cliente': '',
      'Estado': '',
      'LUN': '',
      'MAR': '',
      'MIE': '',
      'JUE': '',
      'VIE': '',
      'SAB': '',
      'Total Asignaciones': ''
    });

    ordenes.forEach(ot => {
      let totalAsigOT = 0;
      const fila: any = {
        'Proyecto': ot.numero_ot,
        'Cliente': ot.nombre_cliente,
        'Estado': ot.estado
      };

      // Mapear días de la semana
      const diasNombres = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

      dias.forEach((dia, index) => {
        const asignaciones = this.obtenerAsignaciones(ot.id_ot, dia.fechaStr);
        const nombreDia = diasNombres[index] || `DIA${index + 1}`;

        if (asignaciones.length > 0) {
          const nombres = asignaciones.map(a => a.nombre_trabajador?.split(' ')[0] || 'N/A').join(', ');
          fila[nombreDia] = `${asignaciones.length}: ${nombres}`;
          totalAsigOT += asignaciones.length;
        } else {
          fila[nombreDia] = '-';
        }
      });

      fila['Total Asignaciones'] = totalAsigOT;
      data.push(fila);
    });

    // Fila de totales
    data.push({
      'Proyecto': '',
      'Cliente': '',
      'Estado': '',
      'LUN': '',
      'MAR': '',
      'MIE': '',
      'JUE': '',
      'VIE': '',
      'SAB': '',
      'Total Asignaciones': ''
    });

    const totales: any = {
      'Proyecto': 'TOTALES',
      'Cliente': '',
      'Estado': ''
    };

    const diasNombres = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    let granTotal = 0;

    dias.forEach((dia, index) => {
      let totalDia = 0;
      ordenes.forEach(ot => {
        totalDia += this.obtenerAsignaciones(ot.id_ot, dia.fechaStr).length;
      });
      const nombreDia = diasNombres[index] || `DIA${index + 1}`;
      totales[nombreDia] = totalDia;
      granTotal += totalDia;
    });

    totales['Total Asignaciones'] = granTotal;
    data.push(totales);

    const fechaArchivo = this.formatearFechaParaArchivo();
    this.csvExportService.exportToCsv(`cronograma_semana_${fechaArchivo}.csv`, data);
  }

  private contarTrabajadoresUnicos(): number {
    const dias = this.diasSemana();
    const ordenes = this.ordenesActivas();
    const trabajadoresUnicos = new Set<number>();

    ordenes.forEach(ot => {
      dias.forEach(dia => {
        const asignaciones = this.obtenerAsignaciones(ot.id_ot, dia.fechaStr);
        asignaciones.forEach(a => trabajadoresUnicos.add(a.id_trabajador));
      });
    });

    return trabajadoresUnicos.size;
  }

  private formatearFechaParaArchivo(): string {
    const dias = this.diasSemana();
    if (dias.length === 0) return new Date().toISOString().split('T')[0];
    return dias[0].fechaStr;
  }
}
