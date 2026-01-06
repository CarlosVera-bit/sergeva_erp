import { Component, signal, inject, OnInit, Output, EventEmitter, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkOrderService, Cliente, Supervisor, CreateWorkOrderDTO, WorkOrder, QuoteSimple, DetalleEgresoItem, NuevoProyecto, CreateFullWorkOrderDTO, ProyectoSupervisado, ProductoSeleccion } from '../../services/work-order.service';
import { InventoryService, InventoryItem } from '../../services/inventory.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../environments/environment';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-work-order-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold text-slate-800 dark:text-white">
            {{ isEditing() ? 'Editar Orden de Trabajo' : 'Crear Orden de Trabajo' }}
          </h2>
          <p class="text-slate-600 dark:text-slate-400 mt-1">
            {{ isEditing() ? 'Modifique la información de la orden' : 'Complete la información para generar la orden' }}
          </p>
        </div>
        <button (click)="cerrar()" 
          class="px-4 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-6">
        
        <!-- Información General -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Número de OT
            </label>
            <input type="text" [value]="formulario.numero_ot" disabled
              class="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-white cursor-not-allowed">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Fecha de Inicio
            </label>
            <input type="date" [(ngModel)]="formulario.fecha_inicio" 
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Fecha Fin Estimada
            </label>
            <input type="date" [(ngModel)]="formulario.fecha_fin_estimada" 
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
          </div>
        </div>

        <!-- Cotización Vinculada -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-4">Cotización Vinculada</h3>
          <div class="flex flex-col md:flex-row gap-4 items-end">
            <div class="flex-grow">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Seleccionar Cotización
              </label>
              <select [(ngModel)]="formulario.id_cotizacion" (change)="onQuoteChange()"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <option [ngValue]="null">-- Ninguna --</option>
                @for (quote of quotes(); track quote.id_cotizacion) {
                  <option [value]="quote.id_cotizacion">
                    {{ quote.numero_cotizacion }} {{ quote.titulo ? '- ' + quote.titulo : '' }}
                  </option>
                }
              </select>
            </div>
            @if (formulario.id_cotizacion) {
              <button (click)="abrirModalQuote()" 
                class="p-2.5 border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-50 hover:text-primary-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:text-white transition-colors h-[42px]"
                title="Ver detalle de cotización">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            }
          </div>
        </div>

        <!-- Cliente y Supervisor -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-4">Asignación</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Cliente <span class="text-red-500">*</span>
              </label>
              <select [(ngModel)]="formulario.id_cliente" (change)="onClienteChange()"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <option [ngValue]="null">-- Seleccione un cliente --</option>
                @for (cliente of clientes(); track cliente.id_cliente) {
                  <option [value]="cliente.id_cliente">{{ cliente.nombre_razon_social }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Supervisor Asignado
              </label>
              <select [(ngModel)]="formulario.id_supervisor"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <option [ngValue]="null">-- Seleccione un supervisor --</option>
                @for (supervisor of supervisores(); track supervisor.id_usuario) {
                  <option [value]="supervisor.id_usuario">{{ supervisor.nombre_completo }}</option>
                }
              </select>
            </div>
            
            @if (clienteSeleccionado()) {
              <div class="col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-700 p-4 rounded-lg mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-slate-600 dark:text-slate-400">
                    <strong>RUC:</strong> {{ clienteSeleccionado()?.ruc_cedula }}
                  </p>
                  <p class="text-sm text-slate-600 dark:text-slate-400">
                    <strong>Email:</strong> {{ clienteSeleccionado()?.email }}
                  </p>
                  <p class="text-sm text-slate-600 dark:text-slate-400">
                    <strong>Dirección:</strong> {{ clienteSeleccionado()?.direccion }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Contacto / Representante
                  </label>
                  <select 
                    class="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                    (change)="onContactoChange($event)">
                    <option value="">-- Seleccione contacto --</option>
                    @for (contacto of contactosCliente(); track contacto.id_contacto) {
                      <option [value]="contacto.id_contacto" [selected]="contacto.nombre_completo === formulario.representante">
                        {{ contacto.nombre_completo }} {{ contacto.es_principal == 1 ? '(Principal)' : '' }}
                      </option>
                    }
                  </select>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Detalles del Trabajo -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-4">Detalles del Trabajo</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Representante (Manual)
              </label>
              <input type="text" [(ngModel)]="formulario.representante" 
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Nombre del representante">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Ubicación del Trabajo
              </label>
              <input type="text" [(ngModel)]="formulario.ubicacion_trabajo" 
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Dirección o lugar">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Prioridad
              </label>
              <select [(ngModel)]="formulario.prioridad"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Estado
              </label>
              <select [(ngModel)]="formulario.estado"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En Proceso</option>
                <option value="pausada">Pausada</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Descripción del Trabajo <span class="text-red-500">*</span>
            </label>
            <textarea [(ngModel)]="formulario.descripcion_trabajo" rows="4"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Describa detalladamente el trabajo a realizar..."></textarea>
          </div>
        </div>

        <!-- Materiales de Egreso -->
        <div class="border-t pt-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-slate-800 dark:text-white">Materiales de Egreso</h3>
            <button (click)="toggleSeccionEgreso()" 
              class="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center">
              <span class="mr-2">{{ mostrarSeccionEgreso() ? 'Ocultar Sección' : 'Agregar Materiales' }}</span>
              <svg class="w-5 h-5 transform transition-transform" [class.rotate-180]="mostrarSeccionEgreso()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          </div>
          
          @if (mostrarSeccionEgreso()) {
            <div class="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              
              <div class="flex justify-between items-center mb-2">
                <h4 class="text-md font-medium text-slate-800 dark:text-slate-200">Productos a Egresar</h4>
                <button (click)="agregarMaterialVacio()" class="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  Agregar Producto
                </button>
              </div>

              <div class="space-y-3 max-h-60 overflow-y-auto">
                @for (item of materiales(); track $index) {
                  <div class="flex flex-col md:flex-row gap-3 items-end border-b border-slate-200 dark:border-slate-600 pb-3 last:border-0 last:pb-0">
                    <div class="flex-grow">
                      <label class="block text-xs text-slate-500 dark:text-slate-400 mb-1">Producto</label>
                      <select 
                        [ngModel]="item.id_producto" 
                        (ngModelChange)="actualizarMaterial($index, $event)"
                        class="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-600 text-slate-900 dark:text-white">
                        <option [value]="0" disabled>Seleccionar...</option>
                        @for (prod of inventarioCompleto(); track prod.id_producto) {
                          <option [value]="prod.id_producto">
                            {{ prod.codigo_producto }} - {{ prod.nombre }}@if (!isSupervisor()) { (Stock: {{ prod.stock_actual }})}
                          </option>
                        }
                      </select>
                    </div>
                    <div class="w-24">
                      <label class="block text-xs text-slate-500 dark:text-slate-400 mb-1">Cantidad</label>
                      <input type="number" [ngModel]="item.cantidad" (ngModelChange)="actualizarCantidad($index, $event)" min="1" class="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-600 text-slate-900 dark:text-white">
                    </div>
                    <button (click)="eliminarMaterial($index)" class="text-red-500 hover:text-red-700 p-1 mb-1">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                }
                @if (materiales().length === 0) {
                  <p class="text-center text-slate-500 text-sm py-2">No hay productos agregados.</p>
                }
              </div>
            </div>
          }
        </div>

        <!-- Vinculación de Proyecto -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-4">Vinculación de Proyecto</h3>
          
          <!-- Modo Selección (Por defecto) -->
          @if (vinculacionTipo() !== 'nuevo') {
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Seleccionar Proyectos Existentes
                </label>
                <button (click)="setVinculacionTipo('nuevo')" 
                  class="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  Nuevo Proyecto
                </button>
              </div>

              <div class="project-selection-grid">
                @for (proj of proyectosDisponibles(); track proj.id_proyecto) {
                  <div 
                    class="project-card" 
                    [class.selected]="isProyectoSeleccionado(proj.id_proyecto)"
                    (click)="toggleProyecto(proj.id_proyecto)"
                  >
                    <div class="project-card-header">
                      <span class="project-name">{{ proj.nombre_proyecto }}</span>
                      <div class="selection-indicator">
                        @if (isProyectoSeleccionado(proj.id_proyecto)) {
                          <i class="fas fa-check-circle text-blue-600"></i>
                        } @else {
                          <i class="far fa-circle text-slate-300"></i>
                        }
                      </div>
                    </div>
                    <div class="project-card-body flex justify-between items-center mt-2">
                      <span class="badge px-2 py-1 rounded-full text-xs font-medium" 
                        [class]="proj.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'">
                        {{ proj.estado }}
                      </span>
                      <button (click)="abrirModalProjectConId($event, proj.id_proyecto)" 
                        class="text-slate-400 hover:text-primary-600 transition-colors"
                        title="Ver detalle">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                }
              </div>
              @if (proyectosSeleccionadosIds().length > 0) {
                <p class="text-xs text-slate-500 mt-2">
                  1 proyecto seleccionado
                </p>
              }
            </div>
          }

          <!-- Modo Creación (Nuevo Proyecto) -->
          @if (vinculacionTipo() === 'nuevo') {
            <div class="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 relative space-y-4">
              <button (click)="setVinculacionTipo('ninguno')" 
                class="absolute top-4 right-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
                <span class="sr-only">Cerrar</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>

              <h4 class="text-md font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Configuración de Nuevo Proyecto
              </h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre del Proyecto <span class="text-red-500">*</span>
                  </label>
                  <input type="text" [(ngModel)]="nuevoProyectoForm.nombre_proyecto"
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Ej: Instalación de Cámaras Sede Norte">
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Hora de Ingreso *
                  </label>
                  <input type="time" [(ngModel)]="nuevoProyectoForm.hora_ingreso"
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Hora de Salida *
                  </label>
                  <input type="time" [(ngModel)]="nuevoProyectoForm.hora_salida"
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
              </div>

              <!-- Selector de Ámbito -->
              <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                  Ámbito del Proyecto
                </label>
                <div class="grid grid-cols-2 gap-4">
                  <label class="relative flex items-center p-3 cursor-pointer rounded-lg border-2 transition-all"
                    [class.border-primary-500]="nuevoProyectoForm.es_externo"
                    [class.bg-primary-50]="nuevoProyectoForm.es_externo"
                    [class.dark:bg-primary-900/20]="nuevoProyectoForm.es_externo"
                    [class.border-slate-200]="!nuevoProyectoForm.es_externo">
                    <input type="checkbox" [(ngModel)]="nuevoProyectoForm.es_externo" class="sr-only">
                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 rounded border-2 flex items-center justify-center"
                        [class.border-primary-500]="nuevoProyectoForm.es_externo"
                        [class.bg-primary-500]="nuevoProyectoForm.es_externo">
                        @if (nuevoProyectoForm.es_externo) {
                          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                          </svg>
                        }
                      </div>
                      <div>
                        <p class="font-semibold text-sm" [class.text-primary-700]="nuevoProyectoForm.es_externo">Externo</p>
                        <p class="text-xs text-slate-500">Clientes</p>
                      </div>
                    </div>
                  </label>

                  <label class="relative flex items-center p-3 cursor-pointer rounded-lg border-2 transition-all"
                    [class.border-primary-500]="nuevoProyectoForm.es_interno"
                    [class.bg-primary-50]="nuevoProyectoForm.es_interno"
                    [class.dark:bg-primary-900/20]="nuevoProyectoForm.es_interno"
                    [class.border-slate-200]="!nuevoProyectoForm.es_interno">
                    <input type="checkbox" [(ngModel)]="nuevoProyectoForm.es_interno" class="sr-only">
                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 rounded border-2 flex items-center justify-center"
                        [class.border-primary-500]="nuevoProyectoForm.es_interno"
                        [class.bg-primary-500]="nuevoProyectoForm.es_interno">
                        @if (nuevoProyectoForm.es_interno) {
                          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                          </svg>
                        }
                      </div>
                      <div>
                        <p class="font-semibold text-sm" [class.text-primary-700]="nuevoProyectoForm.es_interno">Interno</p>
                        <p class="text-xs text-slate-500">Departamentos</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Campos Condicionales: EXTERNO -->
              @if (nuevoProyectoForm.es_externo) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <div class="md:col-span-2 flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-wider">Datos Externos</span>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Cliente (Pre-seleccionado)
                    </label>
                    <select [(ngModel)]="nuevoProyectoForm.id_cliente"
                      class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
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
                    <input type="text" [(ngModel)]="nuevoProyectoForm.ubicacion_cliente"
                      class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Presupuesto Cotizado
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-2 text-slate-500">$</span>
                      <input type="number" [(ngModel)]="nuevoProyectoForm.presupuesto_cotizado"
                        class="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    </div>
                  </div>
                </div>
              }

              <!-- Campos Condicionales: INTERNO -->
              @if (nuevoProyectoForm.es_interno) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                  <div class="md:col-span-2 flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-wider">Datos Internos</span>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Departamento *
                    </label>
                    <select [(ngModel)]="nuevoProyectoForm.id_departamento"
                      class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
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
                    <select [(ngModel)]="nuevoProyectoForm.centro_costos"
                      class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
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
                    <input type="text" [(ngModel)]="nuevoProyectoForm.area_solicitante" placeholder="Ej: Gerencia de Ventas"
                      class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  </div>
                </div>
              }

              <div class="mt-4 flex justify-end">
                <button (click)="setVinculacionTipo('ninguno')" 
                  class="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white underline">
                  Cancelar y volver a selección
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Resumen Económico -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-4">Resumen Económico</h3>
          <div class="flex justify-end">
            <div class="w-full md:w-1/3">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Total Orden de Trabajo
              </label>
              <div class="relative rounded-md shadow-sm">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span class="text-gray-500 sm:text-sm">$</span>
                </div>
                <input type="number" [(ngModel)]="formulario.total_ot" (blur)="formatTotal()" step="0.01"
                  class="w-full pl-7 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-right font-bold text-lg"
                  placeholder="0.00">
              </div>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400 text-right">
                {{ formulario.id_cotizacion ? 'Valor tomado de la cotización (editable)' : 'Ingrese el valor total' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="border-t pt-6 flex justify-end space-x-3">
          <button (click)="cerrar()" 
            class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            Cancelar
          </button>
          <button (click)="guardar()" [disabled]="isSaving() || !isValid()"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
            @if (isSaving()) {
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            }
            {{ isEditing() ? 'Actualizar Orden' : 'Crear Orden' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal rápido: Cotización -->
    @if (mostrarModalQuote()) {
      <div class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 md:p-4" (click)="cerrarModalQuote()">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <!-- Header del Modal -->
          <div class="flex items-center justify-between p-4 md:p-6 border-b dark:border-slate-700 bg-primary-600 sticky top-0 z-10">
            <h3 class="text-lg md:text-xl font-bold text-white">Detalle de Cotización</h3>
            <button (click)="cerrarModalQuote()" 
              class="p-1.5 md:p-2 text-white hover:bg-primary-700 rounded-lg transition-colors">
              <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          @if (cargandoCotizacion()) {
            <div class="flex justify-center items-center p-12">
              <svg class="animate-spin h-12 w-12 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="ml-4 text-lg text-slate-600 dark:text-slate-300">Cargando detalles...</span>
            </div>
          } @else if (cotizacionDetalle()) {
            <div class="p-6 space-y-6">
              <!-- Información General -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Datos de la Cotización -->
                <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-3">
                  <h4 class="font-semibold text-lg text-slate-800 dark:text-white border-b border-slate-300 dark:border-slate-600 pb-2">
                    Información de Cotización
                  </h4>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-slate-600 dark:text-slate-400">Número:</span>
                      <span class="font-semibold text-slate-800 dark:text-white">{{ cotizacionDetalle().numero_cotizacion }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-600 dark:text-slate-400">Fecha:</span>
                      <span class="font-semibold text-slate-800 dark:text-white">{{ cotizacionDetalle().fecha_cotizacion }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-600 dark:text-slate-400">Estado:</span>
                      <span class="px-2 py-1 text-xs font-semibold rounded-full"
                        [ngClass]="{
                          'bg-green-100 text-green-800': cotizacionDetalle().estado === 'aprobada',
                          'bg-blue-100 text-blue-800': cotizacionDetalle().estado === 'enviada',
                          'bg-red-100 text-red-800': cotizacionDetalle().estado === 'rechazada'
                        }">
                        {{ formatStatus(cotizacionDetalle().estado) }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- Datos del Cliente -->
                <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-3">
                  <h4 class="font-semibold text-lg text-slate-800 dark:text-white border-b border-slate-300 dark:border-slate-600 pb-2">
                    Información del Cliente
                  </h4>
                  <div class="space-y-2 text-sm">
                    <div>
                      <span class="text-slate-600 dark:text-slate-400 block">Nombre/Razón Social:</span>
                      <span class="font-semibold text-slate-800 dark:text-white">{{ cotizacionDetalle().nombre_razon_social || cotizacionDetalle().cliente }}</span>
                    </div>
                    @if (cotizacionDetalle().ruc_cedula) {
                      <div>
                        <span class="text-slate-600 dark:text-slate-400 block">RUC/Cédula:</span>
                        <span class="font-semibold text-slate-800 dark:text-white">{{ cotizacionDetalle().ruc_cedula }}</span>
                      </div>
                    }
                    @if (cotizacionDetalle().direccion) {
                      <div>
                        <span class="text-slate-600 dark:text-slate-400 block">Dirección:</span>
                        <span class="font-semibold text-slate-800 dark:text-white">{{ cotizacionDetalle().direccion }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
              
              <!-- Items/Productos -->
              @if (cotizacionDetalle().items && cotizacionDetalle().items.length > 0) {
                <div>
                  <h4 class="font-semibold text-lg text-slate-800 dark:text-white mb-3 border-b border-slate-300 dark:border-slate-600 pb-2">
                    Detalle de Items
                  </h4>
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead class="bg-slate-200 dark:bg-slate-700">
                        <tr>
                          <th class="px-4 py-2 text-left text-slate-700 dark:text-slate-300">Descripción</th>
                          <th class="px-4 py-2 text-center text-slate-700 dark:text-slate-300">Cantidad</th>
                          <th class="px-4 py-2 text-right text-slate-700 dark:text-slate-300">Precio Unit.</th>
                          <th class="px-4 py-2 text-right text-slate-700 dark:text-slate-300">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of cotizacionDetalle().items; track item.id_detalle) {
                          <tr class="border-b dark:border-slate-700">
                            <td class="px-4 py-2 text-slate-800 dark:text-white">{{ item.descripcion }}</td>
                            <td class="px-4 py-2 text-center text-slate-800 dark:text-white">{{ item.cantidad }}</td>
                            <td class="px-4 py-2 text-right text-slate-800 dark:text-white">{{ item.precio_unitario | currency }}</td>
                            <td class="px-4 py-2 text-right text-slate-800 dark:text-white">{{ item.subtotal | currency }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  
                  <div class="flex justify-end mt-4">
                    <div class="space-y-2 max-w-md w-full md:w-1/3">
                      <div class="flex justify-between text-lg font-bold border-t border-slate-300 dark:border-slate-600 pt-2">
                        <span class="text-slate-800 dark:text-white">Total:</span>
                        <span class="text-primary-600 dark:text-primary-400">{{ cotizacionDetalle().total | currency }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              }
              
              <!-- Footer -->
              <div class="flex justify-end gap-2 p-4 border-t dark:border-slate-700">
                <button (click)="cerrarModalQuote()" 
                  class="px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- Modal rápido: Proyecto -->
    @if (mostrarModalProject()) {
      <div class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 md:p-4" (click)="cerrarModalProject()">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-4 border-b dark:border-slate-700 bg-primary-600 sticky top-0 z-10">
            <h3 class="text-lg font-bold text-white">Detalle de Proyecto Supervisado</h3>
            <button (click)="cerrarModalProject()" class="p-1.5 text-white hover:bg-primary-700 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          @if (cargandoProyecto()) {
            <div class="p-6 text-center">Cargando proyecto...</div>
          } @else if (proyectoDetalle()) {
            <div class="p-6 space-y-6">
              <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="text-xl font-bold text-slate-800 dark:text-white">{{ proyectoDetalle().nombre_proyecto }}</h3>
                    <p class="text-sm text-slate-500">OT: {{ proyectoDetalle().numero_ot }}</p>
                    @if (proyectoDetalle().descripcion) {
                      <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">{{ proyectoDetalle().descripcion }}</p>
                    }
                  </div>
                  <span [class]="proyectoDetalle().estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'"
                    class="px-3 py-1 rounded-full text-xs font-semibold">
                    {{ proyectoDetalle().estado }}
                  </span>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Hora Ingreso</p>
                    <p class="text-lg font-semibold text-slate-800 dark:text-white">{{ proyectoDetalle().hora_ingreso }}</p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Hora Salida</p>
                    <p class="text-lg font-semibold text-slate-800 dark:text-white">{{ proyectoDetalle().hora_salida }}</p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Personal Hoy</p>
                    <p class="text-lg font-semibold text-slate-800 dark:text-white">{{ proyectoDetalle().personal_asignado || 0 }}</p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Supervisor</p>
                    <p class="text-sm font-medium text-slate-800 dark:text-white">{{ proyectoDetalle().nombre_supervisor || 'N/A' }}</p>
                  </div>
                </div>
                
                @if (proyectoDetalle().cliente) {
                  <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p class="text-sm text-slate-500 dark:text-slate-400">Cliente</p>
                    <p class="font-medium text-slate-800 dark:text-white">{{ proyectoDetalle().cliente }}</p>
                  </div>
                }
                
                @if (proyectoDetalle().direccion_trabajo) {
                  <div class="mt-2">
                    <p class="text-sm text-slate-500 dark:text-slate-400">Ubicación</p>
                    <p class="font-medium text-slate-800 dark:text-white">{{ proyectoDetalle().direccion_trabajo }}</p>
                  </div>
                }
              </div>
              
              <div class="flex justify-end gap-2 p-4 border-t dark:border-slate-700">
                <button (click)="cerrarModalProject()" 
                  class="px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .project-selection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
      max-height: 400px;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .project-card {
      background: #fff;
      border: 2px solid #eee;
      border-radius: 12px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .project-card:hover {
      border-color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    .project-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .project-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .project-name {
      font-weight: 600;
      font-size: 0.95rem;
      color: #1e293b;
    }

    .selection-indicator {
      font-size: 1.1rem;
    }
  `]
})
export class WorkOrderCreateComponent implements OnInit {
  @Input() workOrderToEdit: WorkOrder | null = null;
  @Input() preselectedQuoteId: number | null = null;
  @Output() cerrarModal = new EventEmitter<boolean>();

  workOrderService = inject(WorkOrderService);
  inventoryService = inject(InventoryService);
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  clientes = signal<Cliente[]>([]);
  supervisores = signal<Supervisor[]>([]);
  quotes = signal<QuoteSimple[]>([]);
  clienteSeleccionado = signal<Cliente | null>(null);
  contactosCliente = signal<any[]>([]);
  isSaving = signal(false);
  isEditing = signal(false);

  // Computed: Verificar si el usuario es supervisor
  isSupervisor = computed(() => {
    const user = this.authService.currentUser();
    return user?.rol === 'supervisor';
  });

  // Materiales de Egreso
  materiales = signal<DetalleEgresoItem[]>([]);
  inventarioCompleto = signal<ProductoSeleccion[]>([]);
  mostrarSeccionEgreso = signal(false);

  // Proyectos
  proyectosDisponibles = signal<ProyectoSupervisado[]>([]);
  vinculacionTipo = signal<'ninguno' | 'existente' | 'nuevo'>('ninguno');
  proyectosSeleccionadosIds = signal<number[]>([]);

  // Nuevo Proyecto Form
  nuevoProyectoForm = {
    nombre_proyecto: '',
    descripcion: '',
    ubicacion: '',
    fecha_inicio: '',
    fecha_fin_estimada: '',
    estado: 'ACTIVO' as const,
    hora_ingreso: '08:00',
    hora_salida: '17:00',
    es_externo: true,
    es_interno: false,
    id_cliente: null as number | null,
    ubicacion_cliente: '',
    presupuesto_cotizado: 0,
    id_departamento: null as number | null,
    area_solicitante: '',
    centro_costos: null as string | null
  };

  departamentos = [
    { id: 1, nombre: 'Operaciones' },
    { id: 2, nombre: 'Taller' },
    { id: 3, nombre: 'Administración' },
    { id: 4, nombre: 'Logística' },
    { id: 5, nombre: 'TI' }
  ];

  centrosCostos = [
    { id: 'CC-GEN-001', nombre: 'General' },
    { id: 'CC-OP-002', nombre: 'Operativo' },
    { id: 'CC-ADM-003', nombre: 'Administrativo' }
  ];

  formulario: any = {
    numero_ot: '',
    id_cliente: null,
    representante: '',
    factura: '',
    id_cotizacion: null,
    id_supervisor: null,
    fecha_inicio: '',
    fecha_fin_estimada: '',
    descripcion_trabajo: '',
    prioridad: 'media',
    estado: 'pendiente',
    ubicacion_trabajo: '',
    total_ot: '0.00'
  };

  // Modal rápido para ver cotización desde el formulario
  mostrarModalQuote = signal<boolean>(false);
  cotizacionDetalle = signal<any | null>(null);
  cargandoCotizacion = signal<boolean>(false);

  // Modal rápido para ver proyecto desde el formulario
  mostrarModalProject = signal<boolean>(false);
  proyectoDetalle = signal<any | null>(null);
  cargandoProyecto = signal<boolean>(false);

  async ngOnInit() {
    await this.cargarDatos();

    if (this.workOrderToEdit) {
      this.isEditing.set(true);
      await this.cargarDatosEdicion();
    } else {
      await this.cargarSecuencial();
      this.formulario.fecha_inicio = this.workOrderService.getCurrentDate();
      this.formulario.factura = this.workOrderService.generateSampleInvoiceNumber();

      // Pre-seleccionar cotización si viene desde quotes
      if (this.preselectedQuoteId) {
        console.log('🔵 [WORK-ORDER-CREATE] Pre-seleccionando cotización:', this.preselectedQuoteId);
        this.formulario.id_cotizacion = this.preselectedQuoteId;
        this.onQuoteChange();
      }
    }
  }

  async cargarDatos() {
    try {
      const [clientesData, supervisoresData, quotesData, proyectosData, inventarioData] = await Promise.all([
        this.workOrderService.getClientes(),
        this.workOrderService.getSupervisores(),
        this.workOrderService.getAvailableQuotes(),
        this.workOrderService.getProyectosDisponibles(),
        this.inventoryService.getInventory(true)
      ]);

      console.log('📦 Inventario cargado:', inventarioData.length, 'items');

      // Mapear datos de inventario a formato de selección
      const inventarioMapeado: ProductoSeleccion[] = inventarioData.map((item: any) => ({
        id_producto: item.id_producto,
        nombre: item.nombre,
        codigo_producto: item.codigo_producto,
        stock_actual: Number(item.stock_actual),
        precio_unitario: Number(item.precio_unitario || item.precio_venta || 0)
      }));

      this.clientes.set(clientesData);
      this.supervisores.set(supervisoresData);
      this.quotes.set(quotesData);
      this.proyectosDisponibles.set(proyectosData);
      this.inventarioCompleto.set(inventarioMapeado);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  }

  async cargarSecuencial() {
    try {
      const seq = await this.workOrderService.getNextSequential();
      this.formulario.numero_ot = seq.numero_ot;
    } catch (error) {
      console.error('Error cargando secuencial:', error);
    }
  }

  async cargarDatosEdicion() {
    if (!this.workOrderToEdit) return;

    try {
      // Cargar detalle completo desde el backend
      const fullWO = await this.workOrderService.getWorkOrderById(this.workOrderToEdit.id_ot);
      console.log('🔍 [DEBUG] Full WO loaded:', fullWO);

      this.formulario = {
        numero_ot: fullWO.numero_ot,
        id_cliente: fullWO.id_cliente,
        representante: fullWO.representante || '',
        factura: fullWO.factura || '',
        id_cotizacion: fullWO.id_cotizacion || null,
        id_supervisor: fullWO.id_supervisor || null,
        fecha_inicio: fullWO.fecha_inicio,
        fecha_fin_estimada: fullWO.fecha_fin_estimada || '',
        descripcion_trabajo: fullWO.descripcion_trabajo,
        prioridad: fullWO.prioridad || 'media',
        estado: fullWO.estado,
        ubicacion_trabajo: fullWO.ubicacion_trabajo || '',
        total_ot: fullWO.total_ot !== undefined && fullWO.total_ot !== null ? Number(fullWO.total_ot).toFixed(2) : '0.00'
      };

      // Cargar materiales si existen
      if (fullWO.materiales_egreso && fullWO.materiales_egreso.length > 0) {
        this.materiales.set(fullWO.materiales_egreso);
        this.mostrarSeccionEgreso.set(true);
      }

      // Cargar proyectos vinculados
      if (fullWO.proyectos && fullWO.proyectos.length > 0) {
        console.log('🏗️ Proyectos vinculados encontrados (array):', fullWO.proyectos.length);
        this.vinculacionTipo.set('existente');
        this.proyectosSeleccionadosIds.set(fullWO.proyectos.map(p => p.id_proyecto));
      } else if (fullWO.proyecto) {
        console.log('🏗️ Proyecto vinculado encontrado (single):', fullWO.proyecto.id_proyecto);
        this.vinculacionTipo.set('existente');
        this.proyectosSeleccionadosIds.set([fullWO.proyecto.id_proyecto]);
      } else {
        console.log('🏗️ No se encontraron proyectos vinculados');
        this.vinculacionTipo.set('ninguno');
        this.proyectosSeleccionadosIds.set([]);
      }

      if (this.formulario.id_cotizacion) {
        this.formulario.id_cotizacion = Number(this.formulario.id_cotizacion);
      }

      this.onClienteChange();
    } catch (error) {
      console.error('Error cargando detalle de OT:', error);
    }
  }

  async onClienteChange() {
    const id_cliente = this.formulario.id_cliente;
    const cliente = this.clientes().find(c => c.id_cliente == id_cliente);
    this.clienteSeleccionado.set(cliente || null);

    if (cliente && cliente.direccion) {
      this.formulario.ubicacion_trabajo = cliente.direccion;
    }

    if (id_cliente) {
      try {
        const response = await fetch(`${environment.apiUrl}/contactos.php?id_cliente=${id_cliente}`);
        const result = await response.json();
        if (result.success && result.data) {
          this.contactosCliente.set(result.data);

          // Si no hay representante o estamos en modo creación, poner el principal
          if (!this.formulario.representante) {
            const principal = result.data.find((c: any) => c.es_principal == 1);
            if (principal) {
              this.formulario.representante = principal.nombre_completo;
            }
          }
        } else {
          this.contactosCliente.set([]);
        }
      } catch (e) {
        console.error('Error cargando contactos:', e);
        this.contactosCliente.set([]);
      }
    } else {
      this.contactosCliente.set([]);
    }
  }

  onContactoChange(event: any) {
    const id_contacto = event.target.value;
    const contacto = this.contactosCliente().find(c => c.id_contacto == id_contacto);
    if (contacto) {
      this.formulario.representante = contacto.nombre_completo;
    }
  }

  onQuoteChange() {
    if (this.formulario.id_cotizacion) {
      const selectedId = Number(this.formulario.id_cotizacion);
      const quote = this.quotes().find(q => Number(q.id_cotizacion) === selectedId);

      if (quote) {
        if (quote.total !== undefined && quote.total !== null) {
          this.formulario.total_ot = Number(quote.total).toFixed(2);
        }
        this.formulario.id_cliente = quote.id_cliente;
        this.onClienteChange();
      }
    }
  }

  isValid(): boolean {
    return !!(this.formulario.id_cliente && this.formulario.descripcion_trabajo);
  }

  async guardar() {
    if (!this.isValid()) return;

    this.isSaving.set(true);
    try {
      const dto: CreateFullWorkOrderDTO = {
        id_cliente: Number(this.formulario.id_cliente),
        representante: this.formulario.representante,
        factura: this.formulario.factura,
        id_cotizacion: this.formulario.id_cotizacion ? Number(this.formulario.id_cotizacion) : undefined,
        id_supervisor: this.formulario.id_supervisor ? Number(this.formulario.id_supervisor) : undefined,
        fecha_inicio: this.formulario.fecha_inicio,
        fecha_fin_estimada: this.formulario.fecha_fin_estimada || undefined,
        descripcion_trabajo: this.formulario.descripcion_trabajo,
        prioridad: this.formulario.prioridad,
        estado: this.formulario.estado,
        ubicacion_trabajo: this.formulario.ubicacion_trabajo,
        total_ot: this.formulario.total_ot ? Number(this.formulario.total_ot) : 0
      };

      const materialesValidos = this.materiales().filter(m => m.id_producto > 0);
      if (materialesValidos.length > 0) {
        dto.materiales_egreso = materialesValidos;
      }

      // Lógica de proyectos
      if (this.vinculacionTipo() === 'nuevo' && this.nuevoProyectoForm.nombre_proyecto) {
        dto.nuevo_proyecto = {
          nombre_proyecto: this.nuevoProyectoForm.nombre_proyecto,
          descripcion: this.nuevoProyectoForm.descripcion || this.formulario.descripcion_trabajo,
          ubicacion: this.nuevoProyectoForm.ubicacion || this.formulario.ubicacion_trabajo,
          fecha_inicio: this.nuevoProyectoForm.fecha_inicio || this.formulario.fecha_inicio,
          fecha_fin_estimada: this.nuevoProyectoForm.fecha_fin_estimada || this.formulario.fecha_fin_estimada,
          estado: this.nuevoProyectoForm.estado,
          hora_ingreso: this.nuevoProyectoForm.hora_ingreso,
          hora_salida: this.nuevoProyectoForm.hora_salida,
          es_externo: this.nuevoProyectoForm.es_externo,
          es_interno: this.nuevoProyectoForm.es_interno,
          id_cliente: this.nuevoProyectoForm.id_cliente,
          ubicacion_cliente: this.nuevoProyectoForm.ubicacion_cliente,
          presupuesto_cotizado: this.nuevoProyectoForm.presupuesto_cotizado,
          id_departamento: this.nuevoProyectoForm.id_departamento,
          area_solicitante: this.nuevoProyectoForm.area_solicitante,
          centro_costos: this.nuevoProyectoForm.centro_costos
        };
      } else {
        // Siempre enviamos los proyectos seleccionados si no es un nuevo proyecto
        // Esto permite guardar incluso si vinculacionTipo es 'ninguno' pero hay IDs (limpieza)
        dto.proyectos_ids_seleccionados = this.proyectosSeleccionadosIds();
        if (dto.proyectos_ids_seleccionados.length > 0) {
          dto.proyecto_id_seleccionado = dto.proyectos_ids_seleccionados[0];
        } else {
          dto.proyecto_id_seleccionado = null;
        }
      }

      console.log('📤 Enviando DTO para guardar:', dto);

      if (this.isEditing() && this.workOrderToEdit) {
        await this.workOrderService.updateWorkOrder(this.workOrderToEdit.id_ot, dto);
      } else {
        await this.workOrderService.saveFullWorkOrder(dto);
      }

      this.toastService.showSuccess(this.isEditing() ? 'Orden de trabajo actualizada correctamente' : 'Orden de trabajo creada correctamente');
      this.cerrarModal.emit(true);
    } catch (error) {
      console.error('Error guardando orden:', error);
      this.toastService.showError('Error al guardar la orden de trabajo');
    } finally {
      this.isSaving.set(false);
    }
  }

  toggleSeccionEgreso() {
    this.mostrarSeccionEgreso.update(v => !v);
  }

  agregarMaterialVacio() {
    this.materiales.update(m => [...m, {
      id_producto: 0,
      cantidad: 1,
      precio_unitario: 0,
      nombre_producto: '',
      codigo_producto: '',
      stock_actual: 0
    }]);
  }

  actualizarMaterial(index: number, idProducto: any) {
    const id = Number(idProducto);
    const producto = this.inventarioCompleto().find(p => p.id_producto === id);

    if (producto) {
      const existe = this.materiales().some((m, i) => i !== index && m.id_producto === id);
      if (existe) {
        alert('El producto ya está en la lista.');
      }

      this.materiales.update(m => {
        const newM = [...m];
        newM[index] = {
          ...newM[index],
          id_producto: producto.id_producto,
          nombre_producto: producto.nombre,
          codigo_producto: producto.codigo_producto,
          precio_unitario: producto.precio_unitario,
          stock_actual: producto.stock_actual
        };
        return newM;
      });
    }
  }

  eliminarMaterial(index: number) {
    this.materiales.update(lista => lista.filter((_, i) => i !== index));
  }

  actualizarCantidad(index: number, cantidad: number) {
    this.materiales.update(lista => {
      const nuevaLista = [...lista];
      const item = nuevaLista[index];
      if (item.stock_actual !== undefined && cantidad > item.stock_actual) {
        alert(`Stock insuficiente. Disponible: ${item.stock_actual}`);
        item.cantidad = item.stock_actual;
      } else {
        item.cantidad = cantidad > 0 ? cantidad : 1;
      }
      return nuevaLista;
    });
  }

  setVinculacionTipo(tipo: 'ninguno' | 'existente' | 'nuevo') {
    this.vinculacionTipo.set(tipo);
    if (tipo === 'nuevo') {
      this.proyectosSeleccionadosIds.set([]);

      // Pre-llenar datos desde la OT
      this.nuevoProyectoForm.nombre_proyecto = `PROYECTO: ${this.formulario.descripcion_trabajo.substring(0, 50)}`;
      this.nuevoProyectoForm.ubicacion = this.formulario.ubicacion_trabajo;
      this.nuevoProyectoForm.fecha_inicio = this.formulario.fecha_inicio;
      this.nuevoProyectoForm.fecha_fin_estimada = this.formulario.fecha_fin_estimada;
      this.nuevoProyectoForm.id_cliente = this.formulario.id_cliente;
      this.nuevoProyectoForm.ubicacion_cliente = this.formulario.ubicacion_trabajo;
      this.nuevoProyectoForm.presupuesto_cotizado = Number(this.formulario.total_ot);
    }
  }

  toggleProyecto(id: number) {
    const seleccionados = this.proyectosSeleccionadosIds();
    if (seleccionados.includes(id)) {
      this.proyectosSeleccionadosIds.set([]);
    } else {
      // Solo permitimos uno, así que reemplazamos el array
      this.proyectosSeleccionadosIds.set([id]);
    }

    // Si hay proyectos seleccionados, aseguramos que el tipo sea 'existente'
    if (this.proyectosSeleccionadosIds().length > 0) {
      this.vinculacionTipo.set('existente');
    } else {
      this.vinculacionTipo.set('ninguno');
    }
  }

  isProyectoSeleccionado(id: number): boolean {
    return this.proyectosSeleccionadosIds().includes(id);
  }

  cerrar() {
    this.cerrarModal.emit(false);
  }

  async abrirModalQuote() {
    const id = this.formulario.id_cotizacion;
    if (!id) return;
    this.cargandoCotizacion.set(true);
    this.mostrarModalQuote.set(true);
    try {
      const data = await this.workOrderService.getQuoteById(Number(id));
      this.cotizacionDetalle.set(data);
    } catch (e) {
      this.cerrarModalQuote();
    } finally {
      this.cargandoCotizacion.set(false);
    }
  }

  cerrarModalQuote() {
    this.mostrarModalQuote.set(false);
    this.cotizacionDetalle.set(null);
  }

  formatTotal() {
    if (this.formulario.total_ot) {
      this.formulario.total_ot = parseFloat(this.formulario.total_ot.toString()).toFixed(2);
    }
  }

  async abrirModalProjectConId(event: Event, id: number) {
    event.stopPropagation();
    this.cargandoProyecto.set(true);
    this.mostrarModalProject.set(true);
    try {
      const data = await this.workOrderService.getProjectById(id);
      this.proyectoDetalle.set(data);
    } catch (e) {
      this.cerrarModalProject();
    } finally {
      this.cargandoProyecto.set(false);
    }
  }

  cerrarModalProject() {
    this.mostrarModalProject.set(false);
    this.proyectoDetalle.set(null);
  }

  formatStatus(status: string): string {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
