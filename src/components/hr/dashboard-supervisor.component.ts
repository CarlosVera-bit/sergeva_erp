import { Component, signal, inject, effect, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProyectoService } from '../../services/proyecto.service';
import { AuthService } from '../../services/auth.service';
import { DataPreloadService } from '../../services/data-preload.service';
import { Proyecto } from '../../services/proyecto.models';
import { WorkOrderService, Cliente } from '../../services/work-order.service';
import { ToastService } from '../../services/toast.service';

interface MaterialProyecto {
  id_detalle: number;
  id_egreso: number;
  id_producto: number;
  codigo_producto: string;
  producto_nombre: string;
  unidad_medida: string;
  cantidad: number;
  fecha_egreso: string;
  numero_egreso: string;
  autorizado_por: string;
}

interface TrabajadorProyecto {
  id_usuario: number;
  nombre_completo: string;
  rol: string;
  email: string;
  hora_entrada: string;
  tipo_registro: string;
  hora_salida: string | null;
  estado_trabajador?: string;
}

@Component({
  selector: 'app-dashboard-supervisor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Dashboard de Supervisor</h1>
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1">
            <p class="text-sm md:text-base text-slate-600 dark:text-slate-400">Bienvenido, {{ usuario()?.nombre_completo }}</p>
            <!-- Indicador de sincronización -->
            <div class="flex items-center gap-2 text-sm">
              <div [class]="cargando() ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'"
                   class="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <div [class]="cargando() ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'"
                     class="w-2 h-2 rounded-full"></div>
                {{ cargando() ? 'Sincronizando...' : 'Actualizado' }}
              </div>
              @if (ultimaActualizacion()) {
                <span class="text-xs text-slate-500">{{ ultimaActualizacion() }}</span>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Grid de tarjetas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">
        
        <!-- Tarjeta 1: Proyectos Activos -->
        <div (click)="mostrarModalProyectos.set(true)" 
          class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-3 text-white cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1">
          <div class="flex items-center gap-3">
            <div class="p-1.5 bg-white/20 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold">{{ proyectos().length }}</span>
              <span class="text-blue-100 text-xs font-medium">Proyectos Activos</span>
            </div>
          </div>
        </div>

        <!-- Tarjeta 2: Personal Hoy -->
        <div (click)="mostrarModalPersonal.set(true)" 
          class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-3 text-white cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1">
          <div class="flex items-center gap-3">
            <div class="p-1.5 bg-white/20 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold">{{ totalPersonalHoy() }}</span>
              <span class="text-green-100 text-xs font-medium">Personal Hoy</span>
            </div>
          </div>
        </div>

        <!-- Tarjeta 3: Horas Trabajadas Hoy -->
        <div (click)="mostrarModalHoras.set(true)" 
          class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-3 text-white cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1">
          <div class="flex items-center gap-3">
            <div class="p-1.5 bg-white/20 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold font-mono text-orange-200">{{ formatearHorasGrupo(totalHorasOperativos()) }}</span>
                <span class="text-purple-200">/</span>
                <span class="text-lg font-bold font-mono text-blue-200">{{ formatearHorasGrupo(totalHorasOficina()) }}</span>
              </div>
              <span class="text-purple-100 text-[10px] font-medium">Operativos / Oficina</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección de proyectos detallados -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 class="text-xl font-bold text-slate-800 dark:text-white">Tus Proyectos</h2>
        </div>

        <!-- Filtro de búsqueda -->
        <div class="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div class="relative flex-1 w-full sm:max-w-md">
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input 
              type="text"
              [value]="busquedaProyecto()"
              (input)="busquedaProyecto.set($any($event.target).value)"
              placeholder="Buscar proyecto por nombre o OT..."
              class="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          <div class="text-sm text-slate-600 dark:text-slate-400">
            Mostrando <span class="font-semibold text-primary-600 dark:text-primary-400">{{ proyectosFiltrados().length }}</span> de {{ proyectos().length }}
          </div>
        </div>

        @if (proyectos().length === 0) {
          <div class="text-center py-12">
            <svg class="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <h3 class="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">No hay proyectos asignados</h3>
            <p class="text-sm text-slate-500 mb-4">Crea tu primer proyecto para comenzar</p>
            <button (click)="navegarAConfiguracion()" 
              class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Crear Proyecto
            </button>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (proyecto of proyectosFiltrados(); track proyecto.id_proyecto) {
              <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <h3 class="font-semibold text-slate-800 dark:text-white">{{ proyecto.nombre_proyecto }}</h3>
                    <p class="text-sm text-slate-500">{{ proyecto.numero_ot }}</p>
                  </div>
                  <div [class]="proyecto.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'"
                    class="px-2 py-1 rounded-full text-xs font-semibold">
                    {{ proyecto.estado }}
                  </div>
                </div>

                <!-- Badges de Ámbito -->
                <div class="flex flex-wrap gap-1 mb-3">
                  @if (proyecto.es_externo == 1) {
                    <span class="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-[10px] font-bold uppercase">Externo</span>
                  }
                  @if (proyecto.es_interno == 1) {
                    <span class="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded text-[10px] font-bold uppercase">Interno</span>
                  }
                </div>
                
                <div class="space-y-2 mb-4">
                  <div class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>{{ proyecto.hora_ingreso }} - {{ proyecto.hora_salida }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    <span>{{ proyecto.personal_asignado || 0 }} empleados hoy</span>
                  </div>
                </div>
                
                <div class="flex flex-wrap gap-2">
                  <button (click)="toggleEstadoProyecto(proyecto, $event)" 
                    [class]="proyecto.estado === 'ACTIVO' 
                      ? 'flex-1 min-w-[80px] px-2 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-xs font-medium' 
                      : 'flex-1 min-w-[80px] px-2 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs font-medium'"
                    [title]="proyecto.estado === 'ACTIVO' ? 'Desactivar proyecto' : 'Activar proyecto'">
                    {{ proyecto.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}
                  </button>
                  <button (click)="editarProyecto(proyecto)" 
                    class="flex-1 min-w-[80px] px-2 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-medium">
                    Editar
                  </button>
                  <button (click)="verDetalles(proyecto)"
                    class="flex-1 min-w-[80px] px-2 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs font-medium">
                    Ver Detalles
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Modal de Detalles del Proyecto -->
      @if (mostrarModalDetalles()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="cerrarModal()">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col" (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-primary-500 to-primary-600 flex-shrink-0">
              <div class="text-white">
                <h3 class="text-xl font-bold">{{ proyectoSeleccionado()?.nombre_proyecto }}</h3>
                <p class="text-primary-100 text-sm">{{ proyectoSeleccionado()?.numero_ot }} - {{ proyectoSeleccionado()?.cliente }}</p>
              </div>
              <button (click)="cerrarModal()" class="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="p-4 overflow-y-auto flex-1">
              <!-- Información del Proyecto -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <p class="text-xs text-slate-600 dark:text-slate-400 mb-1">Horario</p>
                  <p class="font-semibold text-slate-800 dark:text-white text-sm">
                    {{ proyectoSeleccionado()?.hora_ingreso }} - {{ proyectoSeleccionado()?.hora_salida }}
                  </p>
                </div>
                <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Personal Hoy</p>
                  <p class="font-semibold text-slate-800 dark:text-white text-2xl">
                    {{ proyectoSeleccionado()?.personal_asignado || 0 }}
                  </p>
                </div>
                <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Estado</p>
                  <span [class]="proyectoSeleccionado()?.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'"
                    class="px-2 py-1 rounded-full text-xs font-semibold">
                    {{ proyectoSeleccionado()?.estado }}
                  </span>
                </div>
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p class="text-sm text-blue-700 dark:text-blue-300 mb-1">Duración</p>
                  <p class="font-semibold text-blue-800 dark:text-blue-200 text-xs">
                    {{ proyectoSeleccionado()?.fecha_inicio_ot || 'N/A' }}
                  </p>
                  <p class="font-semibold text-blue-800 dark:text-blue-200 text-xs">
                    {{ proyectoSeleccionado()?.fecha_fin_ot || 'N/A' }}
                  </p>
                </div>
              </div>

              <!-- Trabajadores del Día -->
              <div class="mb-6">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    Registro de Asistencia Hoy
                  </h4>
                  @if (!cargandoTrabajadores()) {
                    <div class="flex gap-2">
                      @if (contarTrabajadoresActivos() > 0) {
                        <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          {{ contarTrabajadoresActivos() }} activos
                        </span>
                      }
                      <span class="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                        {{ trabajadoresProyecto().length }} registros
                      </span>
                    </div>
                  }
                </div>

                @if (cargandoTrabajadores()) {
                  <div class="flex justify-center items-center py-4">
                    <svg class="animate-spin h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="ml-3 text-slate-600 dark:text-slate-400">Cargando trabajadores...</span>
                  </div>
                } @else if (trabajadoresProyecto().length === 0) {
                  <div class="text-center py-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p class="text-slate-600 dark:text-slate-400 text-sm">No hay registros de asistencia hoy</p>
                  </div>
                } @else {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    @for (trabajador of trabajadoresProyecto(); track trabajador.id_usuario) {
                      <div [class]="trabajador.hora_salida 
                        ? 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border border-slate-200 dark:border-slate-700' 
                        : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800'"
                        class="rounded-lg p-2">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-3">
                            <div [class]="trabajador.hora_salida ? 'bg-slate-400' : 'bg-green-500'" 
                                 class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                              {{ trabajador.nombre_completo.charAt(0) }}
                            </div>
                            <div>
                              <p class="font-semibold text-slate-800 dark:text-white text-sm">{{ trabajador.nombre_completo }}</p>
                              <p class="text-xs text-slate-600 dark:text-slate-400">{{ trabajador.rol }}</p>
                            </div>
                          </div>
                          <div class="text-right">
                            <p class="text-xs text-green-700 dark:text-green-300 font-semibold">
                              ✓ {{ trabajador.hora_entrada | slice:11:16 }}
                            </p>
                            @if (trabajador.hora_salida) {
                              <p class="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                                ← {{ trabajador.hora_salida | slice:11:16 }}
                              </p>
                            } @else {
                              <span class="text-xs bg-green-500 text-white px-2 py-0.5 rounded animate-pulse">En sitio</span>
                            }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

              @if (proyectoSeleccionado()?.descripcion_ot) {
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <p class="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Descripción del Trabajo:</p>
                  <p class="text-sm text-blue-800 dark:text-blue-300">{{ proyectoSeleccionado()?.descripcion_ot }}</p>
                </div>
              }

              <!-- Materiales Utilizados -->
              <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    Materiales Utilizados
                  </h4>
                  @if (!cargandoMateriales()) {
                    <span class="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                      {{ materialesProyecto().length }} productos
                    </span>
                  }
                </div>

                @if (cargandoMateriales()) {
                  <div class="flex justify-center items-center py-4">
                    <svg class="animate-spin h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="ml-3 text-slate-600 dark:text-slate-400">Cargando materiales...</span>
                  </div>
                } @else if (materialesProyecto().length === 0) {
                  <div class="text-center py-8 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <svg class="w-16 h-16 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    <p class="text-slate-600 dark:text-slate-400">No se han registrado egresos de materiales para este proyecto</p>
                  </div>
                } @else {
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead class="bg-slate-100 dark:bg-slate-700 text-xs uppercase">
                        <tr>
                          <th class="px-4 py-3 text-left">Código</th>
                          <th class="px-4 py-3 text-left">Producto</th>
                          <th class="px-4 py-3 text-center">Cantidad</th>
                          <th class="px-4 py-3 text-left">Unidad</th>
                          <th class="px-4 py-3 text-left">Fecha Egreso</th>
                          <th class="px-4 py-3 text-left">N° Egreso</th>
                          <th class="px-4 py-3 text-left">Autorizado por</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                        @for (material of materialesProyecto(); track material.id_detalle) {
                          <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td class="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                              {{ material.codigo_producto }}
                            </td>
                            <td class="px-4 py-3 font-medium text-slate-800 dark:text-white">
                              {{ material.producto_nombre }}
                            </td>
                            <td class="px-4 py-3 text-center font-semibold text-primary-600">
                              {{ material.cantidad }}
                            </td>
                            <td class="px-4 py-3 text-slate-600 dark:text-slate-400">
                              {{ material.unidad_medida }}
                            </td>
                            <td class="px-4 py-3 text-slate-600 dark:text-slate-400">
                              {{ material.fecha_egreso }}
                            </td>
                            <td class="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                              {{ material.numero_egreso }}
                            </td>
                            <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                              {{ material.autorizado_por }}
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex justify-end gap-3 flex-shrink-0">
              <button (click)="editarProyecto(proyectoSeleccionado()!)" 
                class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                Editar Proyecto
              </button>
              <button (click)="cerrarModal()" 
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Proyectos Activos -->
      @if (mostrarModalProyectos()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="mostrarModalProyectos.set(false)">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-blue-600 text-white rounded-t-xl">
              <h3 class="text-lg font-bold">Proyectos Activos</h3>
              <button (click)="mostrarModalProyectos.set(false)" class="p-1 hover:bg-white/20 rounded">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="p-4 overflow-y-auto">
              <div class="space-y-3">
                @for (proyecto of proyectos(); track proyecto.id_proyecto) {
                  <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <p class="font-semibold text-slate-800 dark:text-white">{{ proyecto.nombre_proyecto }}</p>
                      <p class="text-xs text-slate-500">{{ proyecto.numero_ot }}</p>
                    </div>
                    <div class="text-right">
                      <span [class]="proyecto.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'"
                        class="px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                        {{ proyecto.estado }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Modal Personal Hoy -->
      @if (mostrarModalPersonal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="mostrarModalPersonal.set(false)">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-green-600 text-white rounded-t-xl">
              <h3 class="text-lg font-bold">Personal Activo Hoy</h3>
              <button (click)="mostrarModalPersonal.set(false)" class="p-1 hover:bg-white/20 rounded">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="p-4 overflow-y-auto">
              <div class="space-y-3">
                @for (proyecto of proyectos(); track proyecto.id_proyecto) {
                  <div class="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div class="flex justify-between items-center mb-2">
                      <p class="font-bold text-slate-800 dark:text-white">{{ proyecto.nombre_proyecto }}</p>
                      <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        {{ proyecto.personal_asignado || 0 }} activos
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 italic">Personal registrado en este proyecto el día de hoy.</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Modal Horas Hoy -->
      @if (mostrarModalHoras()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="mostrarModalHoras.set(false)">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-purple-600 text-white rounded-t-xl">
              <h3 class="text-lg font-bold">Detalle de Horas Hoy</h3>
              <button (click)="mostrarModalHoras.set(false)" class="p-1 hover:bg-white/20 rounded">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="p-4 overflow-y-auto">
              <div class="space-y-4">
                <!-- Resumen total -->
                <div class="text-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
                  <p class="text-xs text-purple-600 dark:text-purple-400 uppercase font-bold tracking-wider mb-1">Total Horas del Equipo</p>
                  <p class="text-3xl font-black text-purple-700 dark:text-purple-300 font-mono">{{ formatearTotalHoras() }}</p>
                  <p class="text-xs text-slate-500 mt-1">{{ detalleHorasTrabajadores().length }} trabajador(es) activo(s)</p>
                </div>

                <!-- TABS: Personal Operativo / Personal de Oficina -->
                <div class="flex border-b border-slate-200 dark:border-slate-700">
                  <button 
                    (click)="tabHorasActivo.set('OPERATIVO')"
                    [class]="tabHorasActivo() === 'OPERATIVO' 
                      ? 'flex-1 py-3 px-4 text-sm font-bold text-orange-600 dark:text-orange-400 border-b-2 border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                      : 'flex-1 py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'">
                    <div class="flex items-center justify-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                      <span>Operativo</span>
                      <span class="px-2 py-0.5 rounded-full text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">
                        {{ trabajadoresOperativos().length }}
                      </span>
                    </div>
                  </button>
                  <button 
                    (click)="tabHorasActivo.set('OFICINA')"
                    [class]="tabHorasActivo() === 'OFICINA' 
                      ? 'flex-1 py-3 px-4 text-sm font-bold text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'flex-1 py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'">
                    <div class="flex items-center justify-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      <span>Oficina</span>
                      <span class="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        {{ trabajadoresOficina().length }}
                      </span>
                    </div>
                  </button>
                </div>

                <!-- Resumen por tipo de personal -->
                @if (tabHorasActivo() === 'OPERATIVO') {
                  <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div class="flex justify-between items-center">
                      <span class="text-sm font-medium text-orange-700 dark:text-orange-300">Total Horas Operativos:</span>
                      <span class="text-lg font-bold font-mono text-orange-800 dark:text-orange-200">{{ formatearHorasGrupo(totalHorasOperativos()) }}</span>
                    </div>
                  </div>
                } @else {
                  <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex justify-between items-center">
                      <span class="text-sm font-medium text-blue-700 dark:text-blue-300">Total Horas Oficina:</span>
                      <span class="text-lg font-bold font-mono text-blue-800 dark:text-blue-200">{{ formatearHorasGrupo(totalHorasOficina()) }}</span>
                    </div>
                  </div>
                }
                
                <!-- Lista de trabajadores -->
                @if (detalleHorasTrabajadores().length > 0) {
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                        {{ tabHorasActivo() === 'OPERATIVO' ? 'Personal Operativo' : 'Personal de Oficina' }}
                      </p>
                    </div>
                    
                    <!-- Campo de búsqueda -->
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                      </div>
                      <input type="text" 
                        [value]="filtroTrabajador()" 
                        (input)="filtroTrabajador.set($any($event.target).value)"
                        placeholder="Buscar trabajador..."
                        class="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      @if (filtroTrabajador()) {
                        <button (click)="filtroTrabajador.set('')" 
                          class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      }
                    </div>
                    
                    <!-- Resultados filtrados por tab activo -->
                    @if ((tabHorasActivo() === 'OPERATIVO' ? trabajadoresOperativos() : trabajadoresOficina()).length > 0) {
                      <div class="max-h-[250px] overflow-y-auto space-y-3">
                        @for (t of (tabHorasActivo() === 'OPERATIVO' ? trabajadoresOperativos() : trabajadoresOficina()); track t.id) {
                          <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                            <!-- Nombre y estado -->
                            <div class="flex justify-between items-center mb-3">
                              <div class="flex items-center gap-2">
                                <div [class]="tabHorasActivo() === 'OPERATIVO' 
                                  ? 'w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center'
                                  : 'w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center'">
                                  <svg [class]="tabHorasActivo() === 'OPERATIVO' 
                                    ? 'w-4 h-4 text-orange-600 dark:text-orange-400'
                                    : 'w-4 h-4 text-blue-600 dark:text-blue-400'" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                                  </svg>
                                </div>
                                <p class="font-bold text-slate-800 dark:text-white">{{ t.nombre }}</p>
                              </div>
                              @if (t.enProgreso) {
                                <span class="text-[10px] px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-full font-bold animate-pulse">
                                  ⏱ EN CURSO
                                </span>
                              } @else {
                                <span class="text-[10px] px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 rounded-full font-bold">
                                  ✓ COMPLETADO
                                </span>
                              }
                            </div>
                            
                            <!-- Horarios -->
                            <div class="grid grid-cols-2 gap-2 mb-3">
                              <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
                                <p class="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase">Entrada</p>
                                <p class="text-sm font-bold text-green-700 dark:text-green-300 font-mono">{{ t.entrada || '--:--:--' }}</p>
                              </div>
                              <div class="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                <p class="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase">Salida</p>
                                <p class="text-sm font-bold text-orange-700 dark:text-orange-300 font-mono">{{ t.salida || '--:--:--' }}</p>
                              </div>
                            </div>
                            
                            <!-- Tiempo trabajado -->
                            <div class="p-3 rounded-lg text-center" [class]="t.enProgreso ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30' : 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30'">
                              <p class="text-[10px] font-bold uppercase" [class]="t.enProgreso ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'">Tiempo Trabajado</p>
                              <p class="text-2xl font-black font-mono" [class]="t.enProgreso ? 'text-blue-700 dark:text-blue-300' : 'text-purple-700 dark:text-purple-300'">
                                {{ t.tiempoFormateado }}
                              </p>
                              <p class="text-[10px] text-slate-500">horas : minutos : segundos</p>
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="text-center py-6 text-slate-500">
                        @if (filtroTrabajador()) {
                          <svg class="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                          </svg>
                          <p class="text-sm">No se encontró "{{ filtroTrabajador() }}" en {{ tabHorasActivo() === 'OPERATIVO' ? 'Personal Operativo' : 'Personal de Oficina' }}</p>
                        } @else {
                          <svg class="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                          </svg>
                          <p class="text-sm">No hay {{ tabHorasActivo() === 'OPERATIVO' ? 'personal operativo' : 'personal de oficina' }} registrado hoy</p>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-center py-8 text-slate-500">
                    <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p class="text-sm">No hay registros de horas hoy</p>
                  </div>
                }

                <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-900/30">
                  <p class="text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
                    <strong>Nota:</strong> Las horas "En Curso" se calculan desde la entrada hasta el momento actual.
                  </p>
                </div>
                
                <!-- Botón para ver historial completo -->
                <button (click)="abrirModalHistorialHoras()" 
                  class="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  Ver Historial Completo
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Modal Historial de Horas Completo -->
      @if (mostrarModalHistorialHoras()) {
        <div class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-3 md:p-4" (click)="cerrarModalHistorialHoras()">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full md:max-w-4xl animate-fade-in h-[95vh] md:h-[85vh] flex flex-col relative" (click)="$event.stopPropagation()">
            
            <!-- Header del modal -->
            <div class="px-4 py-3 md:p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-t-xl">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex-1">
                  <h3 class="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Historial de Horas Trabajadas</span>
                  </h3>
                </div>
                <button (click)="cerrarModalHistorialHoras()" class="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              <!-- Filtros de fecha -->
              <div class="flex flex-wrap gap-2">
                <button (click)="cambiarRangoHistorial('dia')"
                  [class.bg-white]="filtroHistorialRango() === 'dia'"
                  [class.text-violet-700]="filtroHistorialRango() === 'dia'"
                  [class.bg-white/20]="filtroHistorialRango() !== 'dia'"
                  [class.text-white]="filtroHistorialRango() !== 'dia'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  Hoy
                </button>
                <button (click)="cambiarRangoHistorial('semana')"
                  [class.bg-white]="filtroHistorialRango() === 'semana'"
                  [class.text-violet-700]="filtroHistorialRango() === 'semana'"
                  [class.bg-white/20]="filtroHistorialRango() !== 'semana'"
                  [class.text-white]="filtroHistorialRango() !== 'semana'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  Últimos 7 días
                </button>
                <button (click)="cambiarRangoHistorial('mes')"
                  [class.bg-white]="filtroHistorialRango() === 'mes'"
                  [class.text-violet-700]="filtroHistorialRango() === 'mes'"
                  [class.bg-white/20]="filtroHistorialRango() !== 'mes'"
                  [class.text-white]="filtroHistorialRango() !== 'mes'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  Últimos 30 días
                </button>
              </div>
            </div>
            
            <!-- Resumen rápido -->
            @if (resumenHistorialHoras()) {
              <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div class="bg-violet-100 dark:bg-violet-900/30 rounded-lg p-2.5 text-center">
                    <p class="text-lg md:text-xl font-bold text-violet-600 dark:text-violet-400">{{ resumenHistorialHoras().total_horas_formateado }}</p>
                    <p class="text-xs text-violet-700 dark:text-violet-300">Total Horas</p>
                  </div>
                  <div class="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-2.5 text-center">
                    <p class="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{{ resumenHistorialHoras().total_registros }}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Registros</p>
                  </div>
                  <div class="bg-green-100 dark:bg-green-900/30 rounded-lg p-2.5 text-center">
                    <p class="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">{{ resumenHistorialHoras().cantidad_trabajadores }}</p>
                    <p class="text-xs text-green-700 dark:text-green-300">Trabajadores</p>
                  </div>
                  <div class="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2.5 text-center">
                    <p class="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">{{ resumenHistorialHoras().cantidad_proyectos }}</p>
                    <p class="text-xs text-blue-700 dark:text-blue-300">Proyectos</p>
                  </div>
                </div>
              </div>
            }
            
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
            <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0 rounded-b-xl">
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

      <!-- Modal de Crear/Editar Proyecto -->
      @if (mostrarModalFormulario()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="cerrarModalFormulario()">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <h3 class="text-xl font-semibold text-slate-800 dark:text-white">
                {{ proyectoEditando() ? 'Editar Proyecto' : 'Nuevo Proyecto' }}
              </h3>
            </div>

            <form [formGroup]="projectForm" (submit)="guardarProyecto($event)" class="p-6 space-y-4 overflow-y-auto">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre del Proyecto *
                  </label>
                  <input type="text" formControlName="nombre_proyecto"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500">
                  @if (projectForm.get('nombre_proyecto')?.touched && projectForm.get('nombre_proyecto')?.errors?.['required']) {
                    <p class="text-xs text-red-500 mt-1">El nombre es requerido</p>
                  }
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Orden de Trabajo (OT) *
                  </label>
                  <select formControlName="id_ot" (change)="onOTChange()"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500">
                    <option value="">Seleccionar OT ({{ otsSinProyecto().length }} disponibles)</option>
                    @for (ot of otsSinProyecto(); track ot.id_ot) {
                      <option [value]="ot.id_ot">{{ ot.numero_ot }} - {{ ot.descripcion_trabajo || ot.cliente_nombre }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Hora de Ingreso *
                  </label>
                  <input type="time" formControlName="hora_ingreso"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Hora de Salida *
                  </label>
                  <input type="time" formControlName="hora_salida"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                </div>
              </div>

              <!-- Selector de Ámbito (Checkboxes) -->
              <div class="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                  Ámbito del Proyecto (puedes seleccionar ambos)
                </label>
                <div class="grid grid-cols-2 gap-4">
                  <label class="relative flex items-center p-3 cursor-pointer rounded-lg border-2 transition-all"
                    [class.border-primary-500]="projectForm.get('es_externo')?.value"
                    [class.bg-primary-50]="projectForm.get('es_externo')?.value"
                    [class.dark:bg-primary-900/20]="projectForm.get('es_externo')?.value"
                    [class.border-slate-200]="!projectForm.get('es_externo')?.value">
                    <input type="checkbox" formControlName="es_externo" class="sr-only">
                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 rounded border-2 flex items-center justify-center"
                        [class.border-primary-500]="projectForm.get('es_externo')?.value"
                        [class.bg-primary-500]="projectForm.get('es_externo')?.value">
                        @if (projectForm.get('es_externo')?.value) {
                          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                          </svg>
                        }
                      </div>
                      <div>
                        <p class="font-semibold text-sm" [class.text-primary-700]="projectForm.get('es_externo')?.value">Externo</p>
                        <p class="text-xs text-slate-500">Clientes</p>
                      </div>
                    </div>
                  </label>

                  <label class="relative flex items-center p-3 cursor-pointer rounded-lg border-2 transition-all"
                    [class.border-primary-500]="projectForm.get('es_interno')?.value"
                    [class.bg-primary-50]="projectForm.get('es_interno')?.value"
                    [class.dark:bg-primary-900/20]="projectForm.get('es_interno')?.value"
                    [class.border-slate-200]="!projectForm.get('es_interno')?.value">
                    <input type="checkbox" formControlName="es_interno" class="sr-only">
                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 rounded border-2 flex items-center justify-center"
                        [class.border-primary-500]="projectForm.get('es_interno')?.value"
                        [class.bg-primary-500]="projectForm.get('es_interno')?.value">
                        @if (projectForm.get('es_interno')?.value) {
                          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                          </svg>
                        }
                      </div>
                      <div>
                        <p class="font-semibold text-sm" [class.text-primary-700]="projectForm.get('es_interno')?.value">Interno</p>
                        <p class="text-xs text-slate-500">Departamentos</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Campos Condicionales: EXTERNO -->
              @if (projectForm.get('es_externo')?.value) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <div class="md:col-span-2 flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-wider">Datos Externos</span>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Cliente *
                    </label>
                    <select formControlName="id_cliente"
                      class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500">
                      <option [value]="null">-- Selecciona un cliente --</option>
                      @for (cliente of clientes(); track cliente.id_cliente) {
                        <option [value]="cliente.id_cliente">{{ cliente.nombre_razon_social }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Ubicación del Cliente
                    </label>
                    <input type="text" formControlName="ubicacion_cliente"
                      class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Presupuesto Cotizado *
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-2 text-slate-500">$</span>
                      <input type="number" formControlName="presupuesto_cotizado"
                        class="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                    </div>
                  </div>
                </div>
              }

              <!-- Campos Condicionales: INTERNO -->
              @if (projectForm.get('es_interno')?.value) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                  <div class="md:col-span-2 flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-full uppercase tracking-wider">Datos Internos</span>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Departamento *
                    </label>
                    <select formControlName="id_departamento"
                      class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500">
                      <option [value]="null">-- Selecciona departamento --</option>
                      @for (depto of departamentos; track depto.id) {
                        <option [value]="depto.id">{{ depto.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Centro de Costos *
                    </label>
                    <select formControlName="centro_costos"
                      class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500">
                      <option [value]="null">-- Selecciona CC --</option>
                      @for (cc of centrosCostos; track cc.id) {
                        <option [value]="cc.id">{{ cc.id }} - {{ cc.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Área Solicitante
                    </label>
                    <input type="text" formControlName="area_solicitante" placeholder="Ej: Gerencia de Ventas"
                      class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
                  </div>
                </div>
              }

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Descripción General
                </label>
                <textarea formControlName="descripcion" rows="2"
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"></textarea>
              </div>

              <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                <button type="button" (click)="cerrarModalFormulario()"
                  class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                  Cancelar
                </button>
                <button type="submit" [disabled]="guardandoProyecto() || projectForm.invalid"
                  class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2">
                  @if (guardandoProyecto()) {
                    <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  }
                  {{ proyectoEditando() ? 'Actualizar' : 'Crear Proyecto' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
      
      <!-- Modal de Confirmación de Cambio de Estado -->
      @if (mostrarModalConfirmacion()) {
        <div class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in" (click)="cancelarCambioEstado()">
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100" (click)="$event.stopPropagation()">
            <div class="text-center">
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                <svg class="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium leading-6 text-slate-900 dark:text-white mb-2">
                {{ proyectoParaConfirmar()?.estado === 'ACTIVO' ? '¿Desactivar Proyecto?' : '¿Activar Proyecto?' }}
              </h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
                ¿Estás seguro que deseas {{ proyectoParaConfirmar()?.estado === 'ACTIVO' ? 'desactivar' : 'activar' }} el proyecto 
                <span class="font-bold text-slate-700 dark:text-slate-300">"{{ proyectoParaConfirmar()?.nombre_proyecto }}"</span>?
                @if (proyectoParaConfirmar()?.estado === 'ACTIVO') {
                  <br><br>
                  <span class="text-amber-600 dark:text-amber-400 text-xs">Nota: Al desactivar, no se podrán registrar nuevas asistencias.</span>
                }
              </p>
              <div class="flex justify-center gap-3">
                <button (click)="cancelarCambioEstado()"
                  class="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-colors">
                  Cancelar
                </button>
                <button (click)="confirmarCambioEstado()"
                  [class]="proyectoParaConfirmar()?.estado === 'ACTIVO' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'"
                  class="px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
                  {{ proyectoParaConfirmar()?.estado === 'ACTIVO' ? 'Sí, Desactivar' : 'Sí, Activar' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DashboardSupervisorComponent implements OnInit, OnDestroy {
  proyectoService = inject(ProyectoService);
  authService = inject(AuthService);
  preloadService = inject(DataPreloadService);
  router = inject(Router);
  http = inject(HttpClient);
  fb = inject(FormBuilder);
  workOrderService = inject(WorkOrderService);
  toastService = inject(ToastService);

  usuario = this.authService.currentUser;
  proyectos = signal<Proyecto[]>([]);
  cargando = signal<boolean>(false);

  // Filtro de búsqueda de proyectos
  busquedaProyecto = signal<string>('');
  
  // Proyectos filtrados
  proyectosFiltrados = computed(() => {
    const busqueda = this.busquedaProyecto().toLowerCase().trim();
    const todosProyectos = this.proyectos();
    
    if (!busqueda) return todosProyectos;
    
    return todosProyectos.filter(p => {
      const nombre = (p.nombre_proyecto || '').toLowerCase();
      const numeroOt = (p.numero_ot || '').toLowerCase();
      return nombre.includes(busqueda) || numeroOt.includes(busqueda);
    });
  });

  // Listas para selectores
  clientes = signal<Cliente[]>([]);
  departamentos = [
    { id: 1, nombre: 'Operaciones' },
    { id: 2, nombre: 'Mantenimiento' },
    { id: 3, nombre: 'Administración' },
    { id: 4, nombre: 'Logística' },
    { id: 5, nombre: 'TI' }
  ];
  centrosCostos = [
    { id: 'CC-GEN-001', nombre: 'General' },
    { id: 'CC-OP-002', nombre: 'Operativo' },
    { id: 'CC-ADM-003', nombre: 'Administrativo' }
  ];

  // Modales de indicadores
  mostrarModalProyectos = signal<boolean>(false);
  mostrarModalPersonal = signal<boolean>(false);
  mostrarModalHoras = signal<boolean>(false);

  // Modal de historial de horas completo
  mostrarModalHistorialHoras = signal<boolean>(false);
  historialHoras = signal<any[]>([]);
  resumenHistorialHoras = signal<any>(null);
  cargandoHistorial = signal<boolean>(false);
  filtroHistorialRango = signal<'dia' | 'semana' | 'mes'>('semana');

  // Modal de detalles
  mostrarModalDetalles = signal<boolean>(false);

  // Modal de formulario (crear/editar)
  projectForm!: FormGroup;
  mostrarModalFormulario = signal<boolean>(false);
  proyectoEditando = signal<Proyecto | null>(null);
  guardandoProyecto = signal<boolean>(false);

  // Modal de confirmación
  mostrarModalConfirmacion = signal<boolean>(false);
  proyectoParaConfirmar = signal<Proyecto | null>(null);

  ordenesTrabajoDisponibles = this.preloadService.ordenesTrabajoCache;

  // Computed: OTs disponibles filtradas (excluye las que ya tienen proyecto, excepto la del proyecto que se está editando)
  otsSinProyecto = computed(() => {
    const todasOts = this.ordenesTrabajoDisponibles();
    const proyectos = this.proyectos();
    const proyectoEdit = this.proyectoEditando();

    // IDs de OTs que ya tienen proyecto
    const otsConProyecto = new Set(proyectos.map(p => p.id_ot));

    return todasOts.filter(ot => {
      // Si no tiene proyecto, está disponible
      if (!otsConProyecto.has(ot.id_ot)) {
        return true;
      }
      // Si estamos editando y es la OT del proyecto actual, también está disponible
      if (proyectoEdit && proyectoEdit.id_ot === ot.id_ot) {
        return true;
      }
      return false;
    });
  });

  formulario = {
    nombre_proyecto: '',
    id_ot: '',
    numero_ot: '',
    descripcion: '',
    hora_ingreso: '08:00',
    hora_salida: '17:00'
  };

  initForm() {
    this.projectForm = this.fb.group({
      nombre_proyecto: ['', [Validators.required, Validators.minLength(3)]],
      id_ot: ['', Validators.required],
      numero_ot: [''],
      descripcion: [''],
      hora_ingreso: ['08:00', Validators.required],
      hora_salida: ['17:00', Validators.required],
      es_externo: [true],
      es_interno: [false],

      // Campos Externos
      id_cliente: [null],
      ubicacion_cliente: [''],
      presupuesto_cotizado: [null],

      // Campos Internos
      id_departamento: [null],
      area_solicitante: [''],
      centro_costos: [null]
    });

    // Escuchar cambios en los flags para ajustar validaciones
    this.projectForm.get('es_externo')?.valueChanges.subscribe(() => {
      this.updateValidators();
    });
    this.projectForm.get('es_interno')?.valueChanges.subscribe(() => {
      this.updateValidators();
    });

    // Inicializar validadores
    this.updateValidators();
  }

  updateValidators() {
    const isExternal = this.projectForm.get('es_externo')?.value;
    const isInternal = this.projectForm.get('es_interno')?.value;

    const externalFields = ['id_cliente', 'presupuesto_cotizado'];
    const internalFields = ['id_departamento', 'centro_costos'];

    if (isExternal) {
      externalFields.forEach(f => this.projectForm.get(f)?.setValidators([Validators.required]));
    } else {
      externalFields.forEach(f => this.projectForm.get(f)?.clearValidators());
    }

    if (isInternal) {
      internalFields.forEach(f => this.projectForm.get(f)?.setValidators([Validators.required]));
    } else {
      internalFields.forEach(f => this.projectForm.get(f)?.clearValidators());
    }

    externalFields.concat(internalFields).forEach(f => this.projectForm.get(f)?.updateValueAndValidity());
  }
  proyectoSeleccionado = signal<Proyecto | null>(null);
  materialesProyecto = signal<MaterialProyecto[]>([]);
  trabajadoresProyecto = signal<TrabajadorProyecto[]>([]);
  cargandoMateriales = signal<boolean>(false);
  cargandoTrabajadores = signal<boolean>(false);

  // Computed values
  totalPersonalHoy = signal<number>(0);
  totalHorasHoy = signal<number>(0);
  horasExtras = signal<number>(0);
  ultimaActualizacion = signal<string>('');

  // Detalle de horas por trabajador
  detalleHorasTrabajadores = signal<{
    id: number;
    nombre: string;
    entrada: string | null;
    salida: string | null;
    horasTrabajadas: number;
    tiempoFormateado: string;
    enProgreso: boolean;
    tipoPersonal: 'OPERATIVO' | 'OFICINA';
  }[]>([]);

  // Tab activo para el modal de horas
  tabHorasActivo = signal<'OPERATIVO' | 'OFICINA'>('OPERATIVO');

  // Trabajadores filtrados por tipo de personal
  trabajadoresOperativos = computed(() => 
    this.trabajadoresFiltrados().filter(t => t.tipoPersonal === 'OPERATIVO')
  );

  trabajadoresOficina = computed(() => 
    this.trabajadoresFiltrados().filter(t => t.tipoPersonal === 'OFICINA')
  );

  // Totales por tipo de personal
  totalHorasOperativos = computed(() => {
    const operativos = this.detalleHorasTrabajadores().filter(t => t.tipoPersonal === 'OPERATIVO');
    return operativos.reduce((sum, t) => sum + t.horasTrabajadas, 0);
  });

  totalHorasOficina = computed(() => {
    const oficina = this.detalleHorasTrabajadores().filter(t => t.tipoPersonal === 'OFICINA');
    return oficina.reduce((sum, t) => sum + t.horasTrabajadas, 0);
  });

  // Filtro de búsqueda para trabajadores
  filtroTrabajador = signal<string>('');

  // Trabajadores filtrados por búsqueda
  trabajadoresFiltrados = computed(() => {
    const filtro = this.filtroTrabajador().toLowerCase().trim();
    const trabajadores = this.detalleHorasTrabajadores();
    if (!filtro) return trabajadores;
    return trabajadores.filter(t => t.nombre.toLowerCase().includes(filtro));
  });

  // Método para formatear horas de un grupo
  formatearHorasGrupo(horas: number): string {
    const totalSegundos = Math.floor(horas * 3600);
    const h = Math.floor(totalSegundos / 3600);
    const m = Math.floor((totalSegundos % 3600) / 60);
    const s = totalSegundos % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  constructor() {
    effect(() => {
      const user = this.usuario();
      if (user) {
        this.cargarDatos();
      }
    });
  }

  ngOnInit() {
    this.initForm();
    this.cargarClientes();
  }

  async cargarClientes() {
    try {
      const data = await this.workOrderService.getClientes();
      this.clientes.set(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  }

  ngOnDestroy() {
    // Componente limpio - el auto-refresh es manejado por el servicio global
  }

  async cargarDatos() {
    this.cargando.set(true);
    const user = this.usuario();

    if (!user) return;

    try {
      // Cargar TODOS los proyectos (activos e inactivos)
      const proyectos = await this.proyectoService.obtenerTodosLosProyectos();
      console.log('📋 Proyectos cargados (todos):', proyectos.length);

      // Mapear OT -> proyecto para cubrir registros que solo tengan id_ot
      const mapOtAProyecto = new Map<number, number>();
      proyectos.forEach(p => {
        if (p.id_ot) {
          mapOtAProyecto.set(Number(p.id_ot), Number(p.id_proyecto));
        }
      });

      // Cargar TODAS las asistencias de hoy (sin filtrar por proyecto)
      const todasAsistenciasHoy = await this.obtenerTodasAsistenciasHoy();
      console.log('📊 Total asistencias hoy:', todasAsistenciasHoy.length);

      // Contar por proyecto
      const asistenciaPorProyecto = this.contarAsistenciasPorProyecto(todasAsistenciasHoy, mapOtAProyecto);
      console.log('📊 Asistencias por proyecto:', Array.from(asistenciaPorProyecto.entries()));

      // Refrescar proyectos con conteo real de personal hoy
      const proyectosConAsistencia = proyectos.map(p => ({
        ...p,
        personal_asignado: asistenciaPorProyecto.get(p.id_proyecto) ?? p.personal_asignado ?? 0
      }));

      this.proyectos.set(proyectosConAsistencia);

      // Calcular estadísticas con datos reales
      this.calcularEstadisticas(proyectosConAsistencia, todasAsistenciasHoy, asistenciaPorProyecto);

      // Actualizar hora de última actualización
      this.ultimaActualizacion.set(new Date().toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  calcularEstadisticas(proyectos: Proyecto[], asistenciasHoy: any[], asistenciaPorProyecto: Map<number, number>) {
    // Total de personal hoy: sumar todos los usuarios activos por proyecto
    let totalActivos = 0;
    asistenciaPorProyecto.forEach(personalPorProyecto => {
      totalActivos += personalPorProyecto;
    });

    console.log('📊 Personal activo por proyecto:', Array.from(asistenciaPorProyecto.entries()));
    console.log('📊 Total de personal activo hoy:', totalActivos);
    this.totalPersonalHoy.set(totalActivos);

    // Calcular horas trabajadas por día (entrada/salida) por usuario
    // Guardar el rol del usuario para clasificar por tipo de personal
    const rolesOficina = ['admin', 'contador', 'gerente', 'bodeguero'];
    const horasPorUsuario = new Map<number, { entrada: Date | null; salida: Date | null; nombre: string; rol: string }>();
    const fechaHoy = this.obtenerFechaLocalISO();

    asistenciasHoy.forEach(a => {
      const userId = Number(a.id_usuario);
      if (!userId) return;

      const fecha = this.obtenerFechaLocalISO(a.fecha_hora);
      if (fecha !== fechaHoy) return;

      const registro = (a.tipo_registro || '').toLowerCase();
      const current = horasPorUsuario.get(userId) || {
        entrada: null as Date | null,
        salida: null as Date | null,
        nombre: a.nombre_completo || a.nombre_usuario || a.empleado || `Usuario ${userId}`,
        rol: a.rol || ''
      };

      // Actualizar el rol si no está definido
      if (!current.rol && a.rol) {
        current.rol = a.rol;
      }

      const fechaHora = a.fecha_hora ? new Date(a.fecha_hora) : null;
      if (!fechaHora) return;

      if (registro === 'entrada') {
        if (!current.entrada || fechaHora < current.entrada) current.entrada = fechaHora;
      } else if (registro === 'salida') {
        if (!current.salida || fechaHora > current.salida) current.salida = fechaHora;
      }

      horasPorUsuario.set(userId, current);
    });

    let totalHoras = 0;
    const detalleTrabajadores: {
      id: number;
      nombre: string;
      entrada: string | null;
      salida: string | null;
      horasTrabajadas: number;
      tiempoFormateado: string;
      enProgreso: boolean;
      tipoPersonal: 'OPERATIVO' | 'OFICINA';
    }[] = [];

    horasPorUsuario.forEach(({ entrada, salida, nombre, rol }, id) => {
      let horas = 0;
      let enProgreso = false;

      if (entrada && salida && salida > entrada) {
        horas = (salida.getTime() - entrada.getTime()) / (1000 * 60 * 60);
      } else if (entrada && !salida) {
        // Calcular horas hasta ahora (en progreso)
        const ahora = new Date();
        horas = (ahora.getTime() - entrada.getTime()) / (1000 * 60 * 60);
        enProgreso = true;
      }

      totalHoras += horas;

      // Formatear tiempo en HH:MM:SS
      const totalSegundos = Math.floor(horas * 3600);
      const h = Math.floor(totalSegundos / 3600);
      const m = Math.floor((totalSegundos % 3600) / 60);
      const s = totalSegundos % 60;
      const tiempoFormateado = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

      // Determinar tipo de personal basado en el rol del usuario
      const tipoPersonal: 'OPERATIVO' | 'OFICINA' = rolesOficina.includes((rol || '').toLowerCase()) ? 'OFICINA' : 'OPERATIVO';

      detalleTrabajadores.push({
        id,
        nombre,
        entrada: entrada ? entrada.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null,
        salida: salida ? salida.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null,
        horasTrabajadas: Number(horas.toFixed(2)),
        tiempoFormateado,
        enProgreso,
        tipoPersonal
      });
    });

    // Ordenar por nombre
    detalleTrabajadores.sort((a, b) => a.nombre.localeCompare(b.nombre));

    this.detalleHorasTrabajadores.set(detalleTrabajadores);
    this.totalHorasHoy.set(Number(totalHoras.toFixed(2)));
    this.horasExtras.set(0); // Si hay reglas de horas extra, calcular aquí
  }

  // Formatear total de horas en HH:MM:SS
  formatearTotalHoras(): string {
    const totalHoras = this.totalHorasHoy();
    const totalSegundos = Math.floor(totalHoras * 3600);
    const h = Math.floor(totalSegundos / 3600);
    const m = Math.floor((totalSegundos % 3600) / 60);
    const s = totalSegundos % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  private async obtenerTodasAsistenciasHoy(): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/asistencias.php`)
      );

      if (!response.success || !Array.isArray(response.data)) {
        console.warn('⚠️ No se pudieron obtener asistencias:', response);
        return [];
      }

      const hoy = this.obtenerFechaLocalISO();
      console.log('📅 Fecha de hoy:', hoy);
      console.log('📋 Total asistencias en BD:', response.data.length);

      const asistenciasHoy = response.data.filter((a: any) => {
        const fecha = this.obtenerFechaLocalISO(a.fecha_hora);
        return fecha === hoy;
      });

      console.log('✅ Asistencias filtradas de hoy:', asistenciasHoy.length);
      if (asistenciasHoy.length > 0) {
        console.log('📝 Primera asistencia:', asistenciasHoy[0]);
      }

      return asistenciasHoy;
    } catch (error) {
      console.error('Error obteniendo asistencias de hoy:', error);
      return [];
    }
  }

  private async obtenerAsistenciasHoy(idProyectos: (number | undefined)[], idOts: number[]): Promise<any[]> {

    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/asistencias.php`)
      );

      if (!response.success || !Array.isArray(response.data)) return [];

      const hoy = this.obtenerFechaLocalISO();
      const proyectoSet = new Set(idProyectos.filter(Boolean) as number[]);
      const otSet = new Set(idOts || []);

      return response.data.filter((a: any) => {
        const fecha = this.obtenerFechaLocalISO(a.fecha_hora);
        if (fecha !== hoy) return false;

        const pid = Number(a.id_proyecto);
        const oid = Number(a.id_ot);
        return (pid && proyectoSet.has(pid)) || (oid && otSet.has(oid));
      });
    } catch (error) {
      console.error('Error obteniendo asistencias de hoy:', error);
      return [];
    }
  }

  private contarAsistenciasPorProyecto(asistencias: any[], mapOtAProyecto: Map<number, number>): Map<number, number> {
    const mapa = new Map<number, number>();
    const setsPorProyecto = new Map<number, Set<string>>();

    // Primero identificar usuarios que tienen SALIDA hoy
    const usuariosConSalida = new Set<string>();
    asistencias.forEach(a => {
      const tipo = (a.tipo_registro || '').toUpperCase();
      if (tipo.startsWith('SALIDA')) {
        let pid = Number(a.id_proyecto);
        if (!pid && a.id_ot) {
          const mapped = mapOtAProyecto.get(Number(a.id_ot));
          if (mapped) pid = mapped;
        }
        if (pid) {
          usuariosConSalida.add(`${pid}-${a.id_usuario}`);
        }
      }
    });

    // Contar solo usuarios con ENTRADA que NO tienen SALIDA
    asistencias.forEach(a => {
      const tipo = (a.tipo_registro || '').toUpperCase();
      if (!tipo.startsWith('ENTRADA')) return;

      let pid = Number(a.id_proyecto);
      const uid = Number(a.id_usuario);

      // Si no viene id_proyecto pero sí id_ot, mapearlo
      if (!pid && a.id_ot) {
        const mapped = mapOtAProyecto.get(Number(a.id_ot));
        if (mapped) pid = mapped;
      }

      if (!pid || !uid) return;

      // Solo contar si NO tiene salida
      const clave = `${pid}-${uid}`;
      if (usuariosConSalida.has(clave)) return;

      if (!setsPorProyecto.has(pid)) {
        setsPorProyecto.set(pid, new Set<string>());
      }
      const set = setsPorProyecto.get(pid)!;
      if (!set.has(clave)) {
        set.add(clave);
        mapa.set(pid, (mapa.get(pid) || 0) + 1);
      }
    });
    return mapa;
  }

  private obtenerFechaLocalISO(dateString?: string): string {
    const d = dateString ? new Date(dateString) : new Date();
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  navegarAProyectos() {
    this.router.navigate(['/hr']);
  }

  navegarAConfiguracion() {
    this.abrirModalNuevoProyecto();
  }

  async abrirModalNuevoProyecto() {
    this.proyectoEditando.set(null);
    this.projectForm.reset({
      hora_ingreso: '08:00',
      hora_salida: '17:00',
      es_externo: true,
      es_interno: false
    });

    // Recargar OTs si el caché está vacío
    if (this.ordenesTrabajoDisponibles().length === 0) {
      await this.preloadService.reloadWorkOrders();
    }

    this.mostrarModalFormulario.set(true);
  }

  editarProyecto(proyecto: Proyecto) {
    this.proyectoEditando.set(proyecto);

    this.projectForm.patchValue({
      nombre_proyecto: proyecto.nombre_proyecto,
      id_ot: proyecto.id_ot?.toString() || '',
      numero_ot: proyecto.numero_ot || '',
      descripcion: proyecto.descripcion || '',
      hora_ingreso: proyecto.hora_ingreso || '08:00',
      hora_salida: proyecto.hora_salida || '17:00',
      es_externo: !!proyecto.es_externo,
      es_interno: !!proyecto.es_interno,
      id_cliente: proyecto.id_cliente,
      ubicacion_cliente: proyecto.ubicacion_cliente,
      presupuesto_cotizado: proyecto.presupuesto_cotizado,
      id_departamento: proyecto.id_departamento,
      area_solicitante: proyecto.area_solicitante,
      centro_costos: proyecto.centro_costos
    });

    this.mostrarModalFormulario.set(true);
  }

  onOTChange() {
    const idOt = this.projectForm.get('id_ot')?.value;
    const ot = this.otsSinProyecto().find(o => o.id_ot.toString() === idOt);
    if (ot) {
      this.projectForm.patchValue({ numero_ot: ot.numero_ot });
    }
  }

  cerrarModalFormulario() {
    this.mostrarModalFormulario.set(false);
    this.proyectoEditando.set(null);
  }

  async guardarProyecto(event: Event) {
    event.preventDefault();

    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      this.toastService.showError('Por favor completa todos los campos requeridos correctamente.');
      return;
    }

    this.guardandoProyecto.set(true);

    const user = this.usuario();
    if (!user) {
      this.toastService.showError('No hay usuario logueado');
      this.guardandoProyecto.set(false);
      return;
    }

    try {
      const formValues = this.projectForm.value;

      const proyecto: Partial<Proyecto> = {
        nombre_proyecto: formValues.nombre_proyecto,
        id_ot: parseInt(formValues.id_ot),
        numero_ot: formValues.numero_ot,
        descripcion: formValues.descripcion,
        hora_ingreso: formValues.hora_ingreso,
        hora_salida: formValues.hora_salida,
        id_supervisor: user.id_usuario,
        es_externo: formValues.es_externo,
        es_interno: formValues.es_interno
      };

      // Agregar campos específicos si están activos
      if (formValues.es_externo) {
        proyecto.id_cliente = parseInt(formValues.id_cliente);
        proyecto.ubicacion_cliente = formValues.ubicacion_cliente;
        proyecto.presupuesto_cotizado = parseFloat(formValues.presupuesto_cotizado);
      }

      if (formValues.es_interno) {
        proyecto.id_departamento = parseInt(formValues.id_departamento);
        proyecto.area_solicitante = formValues.area_solicitante;
        proyecto.centro_costos = formValues.centro_costos;
      }

      console.log('📤 Payload a enviar:', proyecto);

      if (this.proyectoEditando()) {
        await this.proyectoService.actualizarProyecto({
          ...proyecto,
          id_proyecto: this.proyectoEditando()!.id_proyecto
        } as Proyecto);
        this.toastService.showSuccess('Proyecto actualizado correctamente');
      } else {
        await this.proyectoService.crearProyecto(proyecto);
        this.toastService.showSuccess('Proyecto creado correctamente');
      }

      await this.cargarDatos();
      this.cerrarModalFormulario();
    } catch (error: any) {
      console.error('Error guardando proyecto:', error);
      this.toastService.showError(error.message || 'Error al guardar proyecto');
    } finally {
      this.guardandoProyecto.set(false);
    }
  }

  /**
   * Alternar el estado del proyecto entre ACTIVO e INACTIVO
   */
  toggleEstadoProyecto(proyecto: Proyecto, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    this.proyectoParaConfirmar.set(proyecto);
    this.mostrarModalConfirmacion.set(true);
  }

  cancelarCambioEstado() {
    this.mostrarModalConfirmacion.set(false);
    this.proyectoParaConfirmar.set(null);
  }

  async confirmarCambioEstado() {
    const proyecto = this.proyectoParaConfirmar();
    if (!proyecto) return;

    const nuevoEstado: 'ACTIVO' | 'INACTIVO' = proyecto.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    try {
      await this.proyectoService.cambiarEstado(proyecto.id_proyecto, nuevoEstado);
      console.log(`✅ Proyecto ${proyecto.nombre_proyecto} cambiado a ${nuevoEstado}`);

      // Actualizar el estado local del proyecto
      const proyectosActualizados = this.proyectos().map(p =>
        p.id_proyecto === proyecto.id_proyecto
          ? { ...p, estado: nuevoEstado }
          : p
      );
      this.proyectos.set(proyectosActualizados);

      this.toastService.showSuccess(`Proyecto ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'} correctamente`);
      this.cancelarCambioEstado();

    } catch (error) {
      console.error('Error cambiando estado del proyecto:', error);
      this.toastService.showError('Error al cambiar el estado del proyecto');
    }
  }

  verDetalles(proyecto: Proyecto) {
    this.proyectoSeleccionado.set(proyecto);
    this.mostrarModalDetalles.set(true);
    this.cargarMaterialesProyecto(proyecto.id_ot);
    this.cargarTrabajadoresProyecto(proyecto.id_proyecto);
  }

  async cargarMaterialesProyecto(idOt: number) {
    this.cargandoMateriales.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/egresos_bodega.php?id_ot=${idOt}`)
      );

      if (response.success) {
        this.materialesProyecto.set(response.data);
      } else {
        this.materialesProyecto.set([]);
      }
    } catch (error) {
      console.error('Error cargando materiales:', error);
      this.materialesProyecto.set([]);
    } finally {
      this.cargandoMateriales.set(false);
    }
  }

  async cargarTrabajadoresProyecto(idProyecto: number) {
    this.cargandoTrabajadores.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/proyectos.php?trabajadores=1&id_proyecto=${idProyecto}`)
      );

      if (response.success) {
        this.trabajadoresProyecto.set(response.data);
      } else {
        this.trabajadoresProyecto.set([]);
      }
    } catch (error) {
      console.error('Error cargando trabajadores:', error);
      this.trabajadoresProyecto.set([]);
    } finally {
      this.cargandoTrabajadores.set(false);
    }
  }

  // Contar trabajadores activos (sin hora de salida)
  contarTrabajadoresActivos(): number {
    return this.trabajadoresProyecto().filter(t => !t.hora_salida || t.estado_trabajador === 'ACTIVO').length;
  }

  // Método para refrescar los datos del dashboard
  async refrescarDatos() {
    console.log('🔄 Refrescando datos del dashboard...');
    await this.cargarDatos();
  }

  // Método para recarga manual (botón)
  async recargarDatos() {
    console.log('🔄 Recarga manual del dashboard...');
    await this.refrescarDatos();
  }

  // Método para notificar cambios en asistencias (puede ser llamado desde otros componentes)
  onAsistenciaRegistrada() {
    console.log('📢 Notificación: Nueva asistencia registrada');
    // Refrescar después de un breve delay para asegurar que la BD se actualice
    setTimeout(() => {
      this.refrescarDatos();
    }, 500);
  }

  cerrarModal() {
    this.mostrarModalDetalles.set(false);
    this.proyectoSeleccionado.set(null);
    this.materialesProyecto.set([]);
    this.trabajadoresProyecto.set([]);
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
      const { fechaInicio, fechaFin } = this.calcularRangoFechasHistorial();

      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/historial_horas.php?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`)
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

  calcularRangoFechasHistorial(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    let fechaInicio: Date;
    const fechaFin: Date = new Date();

    switch (this.filtroHistorialRango()) {
      case 'dia':
        fechaInicio = new Date(hoy);
        break;
      case 'semana':
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(fechaInicio.getDate() - 6);
        break;
      case 'mes':
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(fechaInicio.getDate() - 29);
        break;
      default:
        fechaInicio = new Date(hoy);
    }

    return {
      fechaInicio: this.formatearFechaISOHistorial(fechaInicio),
      fechaFin: this.formatearFechaISOHistorial(fechaFin)
    };
  }

  cambiarRangoHistorial(rango: 'dia' | 'semana' | 'mes') {
    this.filtroHistorialRango.set(rango);
    this.cargarHistorialHoras();
  }

  formatearFechaISOHistorial(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatearFechaHistorial(fechaStr: string): string {
    if (!fechaStr) return 'Sin fecha';
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
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
}
