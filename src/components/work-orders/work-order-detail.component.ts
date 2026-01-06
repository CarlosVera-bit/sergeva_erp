import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrderService, WorkOrder, EvidencePhoto } from '../../services/work-order.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../environments/environment';
import { OtLinksSectionComponent } from './ot-links-section.component';
import { ConfirmDeleteModalComponent } from '../shared/confirm-delete-modal.component';

@Component({
  selector: 'app-work-order-detail',
  standalone: true,
  imports: [CommonModule, OtLinksSectionComponent, ConfirmDeleteModalComponent],
  template: `
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div class="relative mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
        
        <!-- Header -->
        <div class="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
          <div>
            <h3 class="text-2xl font-bold text-slate-900 dark:text-white">
              Orden de Trabajo: {{ workOrder()?.numero_ot }}
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Detalles completos del registro
            </p>
          </div>
          <button (click)="cerrar()" class="text-slate-400 hover:text-slate-500 focus:outline-none">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        @if (isLoading()) {
          <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        } @else if (workOrder()) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2">
            
            <!-- Información General -->
            <div class="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
              <h4 class="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3 border-b border-indigo-100 dark:border-slate-600 pb-2">
                Información General
              </h4>
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Estado:</span>
                  <span class="text-sm font-semibold px-2 py-1 rounded-full text-xs w-fit"
                    [ngClass]="{
                      'bg-yellow-100 text-yellow-800': workOrder()?.estado === 'pendiente',
                      'bg-blue-100 text-blue-800': workOrder()?.estado === 'en_proceso',
                      'bg-green-100 text-green-800': workOrder()?.estado === 'completada',
                      'bg-red-100 text-red-800': workOrder()?.estado === 'cancelada',
                      'bg-gray-100 text-gray-800': workOrder()?.estado === 'pausada'
                    }">
                    {{ workOrder()?.estado | titlecase }}
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Prioridad:</span>
                  <span class="text-sm font-semibold px-2 py-1 rounded-full text-xs w-fit"
                    [ngClass]="{
                      'bg-red-100 text-red-800': workOrder()?.prioridad === 'urgente',
                      'bg-orange-100 text-orange-800': workOrder()?.prioridad === 'alta',
                      'bg-blue-100 text-blue-800': workOrder()?.prioridad === 'media',
                      'bg-green-100 text-green-800': workOrder()?.prioridad === 'baja'
                    }">
                    {{ workOrder()?.prioridad | titlecase }}
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Fecha Inicio:</span>
                  <span class="text-sm text-slate-900 dark:text-white">{{ workOrder()?.fecha_inicio | date:'mediumDate' }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Fecha Fin Est.:</span>
                  <span class="text-sm text-slate-900 dark:text-white">{{ workOrder()?.fecha_fin_estimada | date:'mediumDate' }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Ubicación:</span>
                  <span class="text-sm text-slate-900 dark:text-white">{{ workOrder()?.ubicacion_trabajo || 'N/A' }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Total OT:</span>
                  <span class="text-sm font-bold text-indigo-600 dark:text-indigo-400">{{ (workOrder()?.total_ot || 0) | currency }}</span>
                </div>
              </div>
            </div>

            <!-- Cliente y Contacto -->
            <div class="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
              <h4 class="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3 border-b border-indigo-100 dark:border-slate-600 pb-2">
                Cliente y Asignación
              </h4>
              <div class="space-y-3">
                <div class="grid grid-cols-3 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Cliente:</span>
                  <span class="col-span-2 text-sm font-medium text-slate-900 dark:text-white">{{ workOrder()?.cliente_nombre }}</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">RUC:</span>
                  <span class="col-span-2 text-sm text-slate-900 dark:text-white">{{ workOrder()?.cliente_ruc || 'N/A' }}</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Email:</span>
                  <span class="col-span-2 text-sm text-slate-900 dark:text-white">{{ workOrder()?.cliente_email || 'N/A' }}</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Dirección:</span>
                  <span class="col-span-2 text-sm text-slate-900 dark:text-white">{{ workOrder()?.cliente_direccion || 'N/A' }}</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Representante:</span>
                  <span class="col-span-2 text-sm text-slate-900 dark:text-white">{{ workOrder()?.representante || 'N/A' }}</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Factura:</span>
                  <span class="col-span-2 text-sm text-slate-900 dark:text-white">{{ workOrder()?.factura || 'N/A' }}</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Supervisor:</span>
                  <span class="col-span-2 text-sm text-slate-900 dark:text-white">{{ workOrder()?.supervisor_nombre || 'Sin Asignar' }}</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Cotización:</span>
                  <span class="col-span-2 text-sm text-slate-900 dark:text-white">
                    @if (workOrder()?.id_cotizacion) {
                      <button (click)="openQuoteModal(workOrder()?.id_cotizacion)" 
                        class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline inline-flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {{ workOrder()?.numero_cotizacion }}
                      </button>
                    } @else {
                      No vinculada
                    }
                  </span>
                </div>
              </div>
            </div>

            <!-- Descripción -->
            <div class="col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
              <h4 class="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3 border-b border-indigo-100 dark:border-slate-600 pb-2">
                Descripción del Trabajo
              </h4>
              <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {{ workOrder()?.descripcion_trabajo }}
              </p>
            </div>

            <!-- Proyectos Vinculados -->
            @if (workOrder()?.proyectos && workOrder()!.proyectos!.length > 0) {
              <div class="col-span-1 md:col-span-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 class="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  Proyectos Vinculados ({{ workOrder()?.proyectos?.length }})
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  @for (proj of workOrder()?.proyectos; track proj.id_proyecto) {
                    <div class="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-blue-700 shadow-sm">
                      <div class="flex justify-between items-start mb-2">
                        <div>
                          <span class="block text-xs text-blue-500 dark:text-blue-300 uppercase font-bold">Nombre Proyecto</span>
                          <button (click)="openProjectModal(proj.id_proyecto)" 
                            class="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline text-left inline-flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {{ proj.nombre_proyecto }}
                          </button>
                        </div>
                        <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase"
                          [ngClass]="{
                            'bg-green-100 text-green-700': proj.estado === 'ACTIVO',
                            'bg-slate-100 text-slate-600': proj.estado !== 'ACTIVO'
                          }">
                          {{ proj.estado }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            } @else if (workOrder()?.proyecto) {
              <!-- Fallback para compatibilidad si solo hay uno en el campo 'proyecto' -->
              <div class="col-span-1 md:col-span-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 class="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  Proyecto Vinculado
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span class="block text-xs text-blue-500 dark:text-blue-300 uppercase font-bold">Nombre Proyecto</span>
                    <button (click)="openProjectModal(workOrder()?.proyecto?.id_proyecto)" 
                      class="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline text-left inline-flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {{ workOrder()?.proyecto?.nombre_proyecto }}
                    </button>
                  </div>
                  <div>
                    <span class="block text-xs text-blue-500 dark:text-blue-300 uppercase font-bold">Estado</span>
                    <span class="text-sm text-slate-900 dark:text-white">{{ workOrder()?.proyecto?.estado }}</span>
                  </div>
                </div>
              </div>
            }

            <!-- Materiales de Egreso -->
            <div class="col-span-1 md:col-span-2">
              <h4 class="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3 border-b border-indigo-100 dark:border-slate-600 pb-2 flex justify-between items-center">
                <span>Materiales de Egreso</span>
                <span class="text-sm font-normal text-slate-500">Total Items: {{ workOrder()?.materiales_egreso?.length || 0 }}</span>
              </h4>
              
              @if (workOrder()?.materiales_egreso && workOrder()!.materiales_egreso!.length > 0) {
                <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead class="bg-slate-50 dark:bg-slate-700">
                      <tr>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Código</th>
                        <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Producto</th>
                        <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Cantidad</th>
                       <!-- <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Precio Unit.</th>
                        <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Subtotal</th> -->
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      @for (item of workOrder()?.materiales_egreso; track $index) {
                        <tr>
                          <td class="px-4 py-2 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{{ item.codigo_producto }}</td>
                          <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{{ item.nombre_producto }}</td>
                          <td class="px-4 py-2 whitespace-nowrap text-sm text-center text-slate-900 dark:text-white">{{ item.cantidad }}</td>
                         <!-- <td class="px-4 py-2 whitespace-nowrap text-sm text-right text-slate-500 dark:text-slate-400">{{ item.precio_unitario | currency }}</td> 
                          <td class="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-slate-900 dark:text-white">
                            {{ (item.cantidad * item.precio_unitario) | currency }}
                          </td> --> 
                        </tr>
                      }
                    </tbody>
                    <!-- <tfoot class="bg-slate-50 dark:bg-slate-700">
                      <tr>
                        <td colspan="4" class="px-4 py-3 text-right text-sm font-bold text-slate-900 dark:text-white">Total Materiales:</td>
                        <td class="px-4 py-3 text-right text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {{ calcularTotalMateriales() | currency }}
                        </td>
                      </tr>
                    </tfoot> -->
                  </table>
                </div>
              } @else {
                <div class="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-lg text-center">
                  <p class="text-slate-500 dark:text-slate-400">No hay materiales registrados para esta orden.</p>
                </div>
              }
            </div>

            <!-- Evidencia Fotográfica -->
            <div class="col-span-1 md:col-span-2">
              <h4 class="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3 border-b border-indigo-100 dark:border-slate-600 pb-2 flex justify-between items-center">
                <span class="flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Evidencia Fotográfica
                </span>
                <span class="text-sm font-normal text-slate-500">{{ evidences().length }} foto(s)</span>
              </h4>

              <!-- Upload Section -->
              <div class="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg mb-4">
                <div class="flex flex-col md:flex-row gap-3 mb-3">
                  <!-- Botón Seleccionar de Galería -->
                  <label class="flex-1 cursor-pointer">
                    <div class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm md:text-base">
                      <svg class="w-4 h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span class="hidden sm:inline">Seleccionar de Galería</span>
                      <span class="sm:hidden">Galería</span>
                    </div>
                    <input type="file" accept="image/*" class="hidden" (change)="onFileSelected($event, false)" #galleryInput>
                  </label>

                  <!-- Botón Tomar Foto (Cámara) -->
                  <label class="flex-1 cursor-pointer">
                    <div class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm md:text-base">
                      <svg class="w-4 h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span class="hidden sm:inline">Tomar Foto</span>
                      <span class="sm:hidden">Cámara</span>
                    </div>
                    <input type="file" accept="image/*" capture="environment" class="hidden" (change)="onFileSelected($event, true)" #cameraInput>
                  </label>
                </div>

                <!-- Preview e Inputs -->
                @if (selectedImagePreview()) {
                  <div class="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div class="flex flex-col md:flex-row gap-4">
                      <!-- Preview de Imagen -->
                      <div class="flex-shrink-0">
                        <img [src]="selectedImagePreview()" alt="Preview" class="w-full md:w-48 h-48 object-cover rounded-lg">
                      </div>
                      
                      <!-- Formulario -->
                      <div class="flex-1 flex flex-col justify-between">
                        <div>
                          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Descripción (opcional)
                          </label>
                          <textarea 
                            [value]="evidenceDescription()"
                            (input)="evidenceDescription.set($any($event.target).value)"
                            rows="3"
                            placeholder="Agregar descripción de la evidencia..."
                            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                          ></textarea>
                        </div>
                        
                        <div class="flex gap-2 mt-3">
                          <button 
                            (click)="uploadEvidence()"
                            [disabled]="isUploadingEvidence()"
                            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                            @if (isUploadingEvidence()) {
                              <svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Subiendo...
                            } @else {
                              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              Subir Evidencia
                            }
                          </button>
                          <button 
                            (click)="cancelUpload()"
                            [disabled]="isUploadingEvidence()"
                            class="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 disabled:opacity-50 transition-colors">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Galería de Evidencias -->
              @if (evidences().length > 0) {
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  @for (evidence of evidences(); track evidence.id_evidencia) {
                    <div class="relative group bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-slate-200 dark:border-slate-700">
                      <!-- Imagen -->
                      <div class="aspect-square cursor-pointer" (click)="viewEvidenceFullSize(evidence)">
                        <img 
                          [src]="getImageUrl(evidence.ruta_imagen)" 
                          [alt]="evidence.descripcion || 'Evidencia'"
                          class="w-full h-full object-cover"
                          loading="lazy">
                      </div>
                      
                      <!-- Info y Acciones -->
                      <div class="p-2">
                        <p class="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {{ evidence.fecha_subida | date:'short' }}
                        </p>
                        @if (evidence.descripcion) {
                          <p class="text-xs text-slate-700 dark:text-slate-300 truncate mt-1" [title]="evidence.descripcion">
                            {{ evidence.descripcion }}
                          </p>
                        }
                        <p class="text-xs text-slate-400 dark:text-slate-500 truncate mt-1">
                          Por: {{ evidence.usuario_nombre || 'Usuario' }}
                        </p>
                      </div>
                      
                      <!-- Botón Eliminar -->
                      <button 
                        (click)="openDeleteEvidenceModal(evidence)"
                        class="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-lg">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              } @else {
                <div class="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-lg text-center">
                  <svg class="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p class="text-slate-500 dark:text-slate-400">No hay evidencias fotográficas para esta orden.</p>
                  <p class="text-sm text-slate-400 dark:text-slate-500 mt-1">Use los botones de arriba para agregar fotos.</p>
                </div>
              }
            </div>

            <!-- Links Compartibles -->
            <div class="col-span-1 md:col-span-2">
              <app-ot-links-section [workOrderId]="workOrderId"></app-ot-links-section>
            </div>

          </div>
        }

        <!-- Footer -->
        <div class="mt-6 flex justify-end space-x-3 border-t pt-4 dark:border-slate-700">
          <button (click)="cerrar()" 
            class="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 transition-colors">
            Cerrar
          </button>
          <button (click)="editar()" 
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            Editar Orden
          </button>
        </div>

      </div>
    </div>
    
    <!-- Modal Cotización -->
    @if (showQuoteModal()) {
      <div class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 md:p-4" (click)="closeQuoteModal()">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <!-- Header del Modal -->
          <div class="flex items-center justify-between p-4 md:p-6 border-b dark:border-slate-700 bg-primary-600 sticky top-0 z-10">
            <h3 class="text-lg md:text-xl font-bold text-white">Detalle de Cotización</h3>
            <button (click)="closeQuoteModal()" 
              class="p-1.5 md:p-2 text-white hover:bg-primary-700 rounded-lg transition-colors">
              <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          @if (isLoadingQuote()) {
            <div class="flex justify-center items-center p-12">
              <svg class="animate-spin h-12 w-12 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="ml-4 text-lg text-slate-600 dark:text-slate-300">Cargando detalles...</span>
            </div>
          } @else if (quoteDetail()) {
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
                      <span class="font-semibold text-slate-800 dark:text-white">{{ quoteDetail().numero_cotizacion }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-600 dark:text-slate-400">Fecha:</span>
                      <span class="font-semibold text-slate-800 dark:text-white">{{ quoteDetail().fecha_cotizacion }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-600 dark:text-slate-400">Estado:</span>
                      <span class="px-2 py-1 text-xs font-semibold rounded-full"
                        [ngClass]="{
                          'bg-green-100 text-green-800': quoteDetail().estado === 'aprobada',
                          'bg-blue-100 text-blue-800': quoteDetail().estado === 'enviada',
                          'bg-red-100 text-red-800': quoteDetail().estado === 'rechazada'
                        }">
                        {{ formatStatus(quoteDetail().estado) }}
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
                      <span class="font-semibold text-slate-800 dark:text-white">{{ quoteDetail().nombre_razon_social || quoteDetail().cliente }}</span>
                    </div>
                    @if (quoteDetail().ruc_cedula) {
                      <div>
                        <span class="text-slate-600 dark:text-slate-400 block">RUC/Cédula:</span>
                        <span class="font-semibold text-slate-800 dark:text-white">{{ quoteDetail().ruc_cedula }}</span>
                      </div>
                    }
                    @if (quoteDetail().direccion) {
                      <div>
                        <span class="text-slate-600 dark:text-slate-400 block">Dirección:</span>
                        <span class="font-semibold text-slate-800 dark:text-white">{{ quoteDetail().direccion }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
              
              <!-- Items/Productos -->
              @if (quoteDetail().items && quoteDetail().items.length > 0) {
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
                        @for (item of quoteDetail().items; track item.id_detalle) {
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
                        <span class="text-primary-600 dark:text-primary-400">{{ quoteDetail().total | currency }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              }
              
              <!-- Footer -->
              <div class="flex justify-end gap-2 p-4 border-t dark:border-slate-700">
                <button (click)="closeQuoteModal()" 
                  class="px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- Modal Proyecto -->
    @if (showProjectModal()) {
      <div class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 md:p-4" (click)="closeProjectModal()">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-4 border-b dark:border-slate-700 bg-primary-600 sticky top-0 z-10">
            <h3 class="text-lg font-bold text-white">Detalle de Proyecto Supervisado</h3>
            <button (click)="closeProjectModal()" class="p-1.5 text-white hover:bg-primary-700 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          @if (isLoadingProject()) {
            <div class="p-6 text-center">Cargando proyecto...</div>
          } @else if (projectDetail()) {
            <div class="p-6 space-y-6">
              <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="text-xl font-bold text-slate-800 dark:text-white">{{ projectDetail().nombre_proyecto }}</h3>
                    <p class="text-sm text-slate-500">OT: {{ projectDetail().numero_ot }}</p>
                    @if (projectDetail().descripcion) {
                      <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">{{ projectDetail().descripcion }}</p>
                    }
                  </div>
                  <span [class]="projectDetail().estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'"
                    class="px-3 py-1 rounded-full text-xs font-semibold">
                    {{ projectDetail().estado }}
                  </span>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Hora Ingreso</p>
                    <p class="text-lg font-semibold text-slate-800 dark:text-white">{{ projectDetail().hora_ingreso }}</p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Hora Salida</p>
                    <p class="text-lg font-semibold text-slate-800 dark:text-white">{{ projectDetail().hora_salida }}</p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Personal Hoy</p>
                    <p class="text-lg font-semibold text-slate-800 dark:text-white">{{ projectDetail().personal_asignado || 0 }}</p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Supervisor</p>
                    <p class="text-sm font-medium text-slate-800 dark:text-white">{{ projectDetail().nombre_supervisor || 'N/A' }}</p>
                  </div>
                </div>
                
                @if (projectDetail().cliente) {
                  <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p class="text-sm text-slate-500 dark:text-slate-400">Cliente</p>
                    <p class="font-medium text-slate-800 dark:text-white">{{ projectDetail().cliente }}</p>
                  </div>
                }
                
                @if (projectDetail().direccion_trabajo) {
                  <div class="mt-2">
                    <p class="text-sm text-slate-500 dark:text-slate-400">Ubicación</p>
                    <p class="font-medium text-slate-800 dark:text-white">{{ projectDetail().direccion_trabajo }}</p>
                  </div>
                }
              </div>
              
              <div class="flex justify-end gap-2 p-4 border-t dark:border-slate-700">
                <button (click)="closeProjectModal()" 
                  class="px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- Modal Evidencia Fotográfica (Tamaño Completo) -->
    @if (showEvidenceModal() && selectedEvidence()) {
      <div class="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4" (click)="closeEvidenceModal()">
        <div class="relative max-w-6xl max-h-[90vh] w-full" (click)="$event.stopPropagation()">
          <!-- Botón Cerrar -->
          <button 
            (click)="closeEvidenceModal()"
            class="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <svg class="w-6 h-6 text-slate-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Imagen -->
          <img 
            [src]="getImageUrl(selectedEvidence()!.ruta_imagen)" 
            [alt]="selectedEvidence()!.descripcion || 'Evidencia'"
            class="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl">

          <!-- Info -->
          <div class="mt-4 bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                @if (selectedEvidence()!.descripcion) {
                  <p class="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    {{ selectedEvidence()!.descripcion }}
                  </p>
                }
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  Subido por: {{ selectedEvidence()!.usuario_nombre || 'Usuario' }}
                </p>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  Fecha: {{ selectedEvidence()!.fecha_subida | date:'medium' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Delete Evidence Confirmation Modal -->
    @if (showDeleteEvidenceModal() && evidenceToDelete()) {
      <app-confirm-delete-modal
        [title]="'Eliminar Evidencia Fotográfica'"
        [message]="'¿Está seguro de que desea eliminar esta evidencia fotográfica? Esta acción no se puede deshacer.'"
        (onConfirm)="confirmDeleteEvidence()"
        (onCancel)="closeDeleteEvidenceModal()">
      </app-confirm-delete-modal>
    }
  `
})
export class WorkOrderDetailComponent implements OnInit {
  @Input() workOrderId!: number;
  @Output() onClose = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<WorkOrder>();

  workOrderService = inject(WorkOrderService);
  toastService = inject(ToastService);
  authService = inject(AuthService);

  workOrder = signal<WorkOrder | null>(null);
  isLoading = signal<boolean>(true);

  // Quote / Project quick view
  showQuoteModal = signal<boolean>(false);
  quoteDetail = signal<any | null>(null);
  isLoadingQuote = signal<boolean>(false);

  showProjectModal = signal<boolean>(false);
  projectDetail = signal<any | null>(null);
  isLoadingProject = signal<boolean>(false);

  // Evidence Photo Management
  evidences = signal<EvidencePhoto[]>([]);
  isUploadingEvidence = signal(false);
  selectedFile = signal<File | null>(null);
  selectedImagePreview = signal<string | null>(null);
  showEvidenceModal = signal(false);
  selectedEvidence = signal<EvidencePhoto | null>(null);
  showDeleteEvidenceModal = signal(false);
  evidenceToDelete = signal<EvidencePhoto | null>(null);
  evidenceDescription = signal<string>('');

  // Base URL para imágenes (raíz del proyecto, no backend)
  readonly baseUrl = environment.apiUrl.replace('/backend/api', '');

  ngOnInit() {
    if (this.workOrderId) {
      this.loadWorkOrderDetails();
      this.loadEvidences();
    }
  }

  async loadWorkOrderDetails() {
    this.isLoading.set(true);
    try {
      const data = await this.workOrderService.getWorkOrderById(this.workOrderId);
      this.workOrder.set(data);
    } catch (error) {
      console.error('Error cargando detalles de OT:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ============================================
  // MÉTODOS DE EVIDENCIA FOTOGRÁFICA
  // ============================================

  async loadEvidences() {
    try {
      const evidences = await this.workOrderService.getEvidences(this.workOrderId);
      this.evidences.set(evidences);
    } catch (error) {
      console.error('Error cargando evidencias:', error);
    }
  }

  onFileSelected(event: Event, useCamera: boolean = false) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        this.toastService.showError('Solo se permiten archivos de imagen');
        return;
      }

      // Validar tamaño (10MB máximo)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.toastService.showError('El archivo es demasiado grande (máximo 10MB)');
        return;
      }

      this.selectedFile.set(file);
      this.previewImage(file);
    }
  }

  previewImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedImagePreview.set(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  async uploadEvidence() {
    const file = this.selectedFile();
    if (!file) {
      this.toastService.showError('Por favor seleccione una imagen');
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      this.toastService.showError('Usuario no autenticado');
      return;
    }

    this.isUploadingEvidence.set(true);
    try {
      await this.workOrderService.uploadEvidence(
        this.workOrderId,
        user.id_usuario,
        file,
        this.evidenceDescription() || undefined
      );

      this.toastService.showSuccess('Evidencia subida correctamente');

      // Limpiar formulario
      this.selectedFile.set(null);
      this.selectedImagePreview.set(null);
      this.evidenceDescription.set('');

      // Recargar evidencias
      await this.loadEvidences();
    } catch (error: any) {
      this.toastService.showError(error.message || 'Error al subir evidencia');
    } finally {
      this.isUploadingEvidence.set(false);
    }
  }

  cancelUpload() {
    this.selectedFile.set(null);
    this.selectedImagePreview.set(null);
    this.evidenceDescription.set('');
  }

  viewEvidenceFullSize(evidence: EvidencePhoto) {
    this.selectedEvidence.set(evidence);
    this.showEvidenceModal.set(true);
  }

  closeEvidenceModal() {
    this.showEvidenceModal.set(false);
    this.selectedEvidence.set(null);
  }

  openDeleteEvidenceModal(evidence: EvidencePhoto): void {
    this.evidenceToDelete.set(evidence);
    this.showDeleteEvidenceModal.set(true);
  }

  async confirmDeleteEvidence(): Promise<void> {
    const evidence = this.evidenceToDelete();
    if (!evidence) return;

    try {
      await this.workOrderService.deleteEvidence(evidence.id_evidencia);
      this.toastService.showSuccess('Evidencia eliminada correctamente');
      await this.loadEvidences();
    } catch (error: any) {
      this.toastService.showError(error.message || 'Error al eliminar evidencia');
    } finally {
      this.closeDeleteEvidenceModal();
    }
  }

  closeDeleteEvidenceModal(): void {
    this.showDeleteEvidenceModal.set(false);
    this.evidenceToDelete.set(null);
  }

  getImageUrl(rutaImagen: string): string {
    return `${this.baseUrl}/${rutaImagen}`;
  }

  async openQuoteModal(id_cotizacion?: number | null) {
    if (!id_cotizacion) return;
    this.isLoadingQuote.set(true);
    this.showQuoteModal.set(true);
    try {
      const data = await this.workOrderService.getQuoteById(Number(id_cotizacion));
      this.quoteDetail.set(data);
    } catch (e) {
      console.error('Error cargando cotización:', e);
      this.toastService.showError('Error al cargar la cotización');
      this.closeQuoteModal();
    } finally {
      this.isLoadingQuote.set(false);
    }
  }

  closeQuoteModal() {
    this.showQuoteModal.set(false);
    this.quoteDetail.set(null);
    this.isLoadingQuote.set(false);
  }

  async openProjectModal(id_proyecto?: number | null) {
    if (!id_proyecto) return;
    this.isLoadingProject.set(true);
    this.showProjectModal.set(true);
    try {
      const data = await this.workOrderService.getProjectById(Number(id_proyecto));
      this.projectDetail.set(data);
    } catch (e) {
      console.error('Error cargando proyecto:', e);
      this.toastService.showError('Error al cargar el proyecto');
      this.closeProjectModal();
    } finally {
      this.isLoadingProject.set(false);
    }
  }

  closeProjectModal() {
    this.showProjectModal.set(false);
    this.projectDetail.set(null);
    this.isLoadingProject.set(false);
  }

  calcularTotalMateriales(): number {
    const materiales = this.workOrder()?.materiales_egreso || [];
    return materiales.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);
  }

  cerrar() {
    this.onClose.emit();
  }

  editar() {
    if (this.workOrder()) {
      this.onEdit.emit(this.workOrder()!);
    }
  }

  formatStatus(status: string): string {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
