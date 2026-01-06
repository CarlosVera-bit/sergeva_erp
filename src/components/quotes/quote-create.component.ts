import { Component, signal, inject, OnInit, Input, Output, EventEmitter, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfService, CotizacionPDF } from '../../services/pdf.service';
import { DatabaseService } from '../../services/database.service';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../environments/environment';

// Pipe para sanitizar URLs
@Pipe({
  name: 'sanitizeUrl',
  standalone: true
})
export class SanitizeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { }

  transform(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

interface Cliente {
  id_cliente: number;
  ruc_cedula: string;
  nombre_razon_social: string;
  direccion: string;
  telefono: string;
  email: string;
  contacto_principal: string;
}

interface ItemCotizacion {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  iva: number;
  subtotal: number;
}

@Component({
  selector: 'app-quote-create',
  standalone: true,
  imports: [CommonModule, FormsModule, SanitizeUrlPipe],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between border-b pb-3">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 dark:text-white">{{ modoEdicion ? 'Editar' : 'Crear' }} Cotización</h2>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">{{ modoEdicion ? 'Modifique los datos de la cotización' : 'Complete la información para generar el presupuesto' }}</p>
        </div>
        <button (click)="cerrar()" 
          class="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        
        <!-- Información General -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Número de Cotización
            </label>
            <input type="text" [(ngModel)]="formulario.numero_cotizacion" readonly
              class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg bg-slate-100 dark:bg-slate-600 dark:border-slate-600 dark:text-white cursor-not-allowed"
              placeholder="Cargando...">
          </div>
          
          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fecha de Cotización
            </label>
            <input type="date" [(ngModel)]="formulario.fecha_cotizacion" 
              class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
          </div>
          
          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fecha de Validez
            </label>
            <input type="date" [(ngModel)]="formulario.fecha_validez" 
              class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
          </div>
        </div>

        <!-- Cliente -->
        <div class="border-t pt-3">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-slate-800 dark:text-white">Información del Cliente</h3>
            <button (click)="abrirModalNuevoCliente()" type="button"
              class="px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Nuevo Cliente
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Seleccionar Cliente
              </label>
              <select [(ngModel)]="formulario.id_cliente" (change)="onClienteChange()"
                class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <option value="">-- Seleccione un cliente --</option>
                @for (cliente of clientes(); track cliente.id_cliente) {
                  <option [value]="cliente.id_cliente">{{ cliente.nombre_razon_social }}</option>
                }
              </select>
            </div>
            
            @if (clienteSeleccionado()) {
              <div class="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg text-xs">
                <p class="text-slate-600 dark:text-slate-400">
                  <strong>RUC:</strong> {{ clienteSeleccionado()?.ruc_cedula }}
                </p>
                <p class="text-slate-600 dark:text-slate-400">
                  <strong>Teléfono:</strong> {{ clienteSeleccionado()?.telefono }}
                </p>
                <p class="text-slate-600 dark:text-slate-400">
                  <strong>Email:</strong> {{ clienteSeleccionado()?.email }}
                </p>
              </div>

              <div class="mt-2">
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Seleccionar Representante/Contacto
                </label>
                <select [(ngModel)]="formulario.id_contacto" (change)="onContactoChange()"
                  class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <option value="">-- Seleccione un contacto --</option>
                  @for (contacto of contactosCliente(); track contacto.id_contacto) {
                    <option [value]="contacto.id_contacto">{{ contacto.nombre_completo }} {{ contacto.es_principal == 1 ? '(Principal)' : '' }}</option>
                  }
                </select>
              </div>
            }
          </div>
        </div>

        <!-- Destinatario -->
        <div class="border-t pt-3">
          <h3 class="text-sm font-semibold text-slate-800 dark:text-white mb-2">Enviar a</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Destinatario
              </label>
              <input type="text" [(ngModel)]="formulario.destinatario_nombre" 
                class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="PLÁSTICOS ECUATORIANOS S.A.">
            </div>
            
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Dirección
              </label>
              <input type="text" [(ngModel)]="formulario.destinatario_direccion" 
                class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Km. 8.5 vía a Daule">
            </div>
            
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Teléfono
              </label>
              <input type="text" [(ngModel)]="formulario.destinatario_telefono" 
                class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="(593-4)3703-600">
            </div>
          </div>
        </div>

        <!-- Items de la Cotización -->
        <div class="border-t pt-3">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-slate-800 dark:text-white">Items de la Cotización</h3>
            <button (click)="agregarItem()" 
              class="px-2 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Agregar Item
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-slate-100 dark:bg-slate-700">
                <tr>
                  <th class="px-2 py-2 text-center text-slate-700 dark:text-slate-300">Cant.</th>
                  <th class="px-2 py-2 text-left text-slate-700 dark:text-slate-300">Descripción</th>
                  <th class="px-2 py-2 text-right text-slate-700 dark:text-slate-300">P. Unit.</th>
                  <th class="px-2 py-2 text-center text-slate-700 dark:text-slate-300">IVA %</th>
                  <th class="px-2 py-2 text-right text-slate-700 dark:text-slate-300">Total</th>
                  <th class="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                @for (item of items(); track $index) {
                  <tr class="border-b dark:border-slate-700">
                    <td class="px-2 py-2">
                      <input type="number" [(ngModel)]="item.cantidad" (input)="calcularSubtotal(item)"
                        min="1" 
                        class="w-16 px-1 py-1 text-xs border border-slate-300 rounded text-center dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    </td>
                    <td class="px-2 py-2">
                      <textarea [(ngModel)]="item.descripcion" 
                        class="w-full px-2 py-1 text-xs border border-slate-300 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white resize-none"
                        placeholder="Descripción del producto/servicio"
                        rows="3"></textarea>
                    </td>
                    <td class="px-2 py-2">
                      <input type="number" [(ngModel)]="item.precio_unitario" (input)="calcularSubtotal(item)"
                        min="0" step="0.01"
                        class="w-20 px-1 py-1 text-xs border border-slate-300 rounded text-right dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    </td>
                    <td class="px-2 py-2">
                      <select [(ngModel)]="item.iva" (change)="calcularSubtotal(item)"
                        class="w-16 px-1 py-1 text-xs border border-slate-300 rounded text-center dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <option [value]="0">0%</option>
                        <option [value]="15">15%</option>
                      </select>
                    </td>
                    <td class="px-2 py-2 text-right font-medium text-slate-800 dark:text-white">
                      \${{ item.subtotal.toFixed(2) }}
                    </td>
                    <td class="px-2 py-2">
                      <button (click)="eliminarItem($index)" 
                        class="text-red-600 hover:text-red-800 dark:text-red-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                      No hay items agregados. Haga clic en "Agregar Item" para comenzar.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Totales -->
          <div class="mt-3 flex justify-end">
            <div class="w-full md:w-1/3 space-y-1 text-sm">
              <div class="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Subtotal:</span>
                <span class="font-medium">\${{ calcularSubtotalTotal().toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-slate-700 dark:text-slate-300">
                <span>IVA (15%):</span>
                <span class="font-medium">\${{ calcularIVATotal().toFixed(2) }}</span>
              </div>

              <!-- Descuento -->
              <div class="border-t pt-2">
                <label class="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" [(ngModel)]="formulario.tienDescuento" 
                    class="w-4 h-4 text-primary-600 rounded border-slate-300 dark:bg-slate-700 dark:border-slate-600">
                  <span class="text-slate-700 dark:text-slate-300 font-medium">Aplicar Descuento</span>
                </label>

                @if (formulario.tienDescuento) {
                  <div class="space-y-2 mb-2 p-2 bg-slate-50 dark:bg-slate-700 rounded">
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Tipo de Descuento
                      </label>
                      <select [(ngModel)]="formulario.tipoDescuento" (change)="formulario.descuento = 0"
                        class="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-primary-500 dark:bg-slate-600 dark:border-slate-600 dark:text-white">
                        <option value="monto">Monto Fijo (\$)</option>
                        <option value="porcentaje">Porcentaje (%)</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {{ formulario.tipoDescuento === 'porcentaje' ? 'Descuento (%)' : 'Descuento (\$)' }}
                      </label>
                      <input [type]="formulario.tipoDescuento === 'porcentaje' ? 'number' : 'number'" 
                        [(ngModel)]="formulario.descuento" 
                        [max]="formulario.tipoDescuento === 'porcentaje' ? 100 : calcularSubtotalTotal() + calcularIVATotal()"
                        min="0" step="0.01"
                        class="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-primary-500 dark:bg-slate-600 dark:border-slate-600 dark:text-white">
                    </div>
                  </div>

                  <div class="flex justify-between text-slate-700 dark:text-slate-300 text-amber-600 dark:text-amber-400 font-medium">
                    <span>Descuento:</span>
                    <span>-\${{ calcularDescuento().toFixed(2) }}</span>
                  </div>
                }
              </div>

              <div class="flex justify-between text-base font-bold text-slate-900 dark:text-white border-t pt-1">
                <span>TOTAL:</span>
                <span>\${{ calcularTotal().toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Información del Lugar y Condiciones -->
        <div class="border-t pt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Lugar / Sección
            </label>
            <input type="text" [(ngModel)]="formulario.plazaParque" 
              class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Ej: PLAZA PARQUE">
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tiempo de Entrega
            </label>
            <input type="text" [(ngModel)]="formulario.tiempoEntrega" 
              class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Ej: 1 semana">
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Condiciones de Pago
            </label>
            <input type="text" [(ngModel)]="formulario.condicionesPago" 
              class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Ej: Pago a los 60 días">
          </div>
        </div>

        <!-- Observaciones -->
        <div class="border-t pt-3">
          <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Observaciones (Opcional)
          </label>
          <textarea [(ngModel)]="formulario.observaciones" rows="2"
            class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="Notas adicionales, condiciones de pago, garantías, etc."></textarea>
        </div>

        <!-- Botones de Acción -->
        <div class="flex justify-end gap-2 pt-3 border-t">
          <button (click)="cerrar()" 
            class="px-4 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            Cancelar
          </button>
          <button (click)="previsualizarPDF()" [disabled]="!formularioValido()"
            class="px-4 py-1.5 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            Previsualizar
          </button>
          <button (click)="guardarYGenerarPDF()" [disabled]="guardando() || !formularioValido()"
            class="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            {{ guardando() ? 'Guardando...' : 'Guardar y Generar PDF' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal de Previsualización -->
    @if (mostrarModalPreview()) {
      <div class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" (click)="cerrarPreview()">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
          <!-- Header del Modal -->
          <div class="flex items-center justify-between p-4 border-b dark:border-slate-700">
            <h3 class="text-lg font-semibold text-slate-800 dark:text-white">Previsualización del Presupuesto</h3>
            <button (click)="cerrarPreview()" 
              class="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- Contenedor del PDF -->
          <div class="flex-1 overflow-hidden">
            <iframe [src]="pdfPreviewUrl() | sanitizeUrl" 
              class="w-full h-full border-0"
              title="Vista previa del PDF"></iframe>
          </div>
        </div>
      </div>
    }
    
    <!-- Modal de Nuevo Cliente -->
    @if (mostrarModalNuevoCliente()) {
      <div class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" (click)="cerrarModalNuevoCliente()">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl" (click)="$event.stopPropagation()">
          <!-- Header del Modal -->
          <div class="flex items-center justify-between p-4 border-b dark:border-slate-700">
            <h3 class="text-lg font-semibold text-slate-800 dark:text-white">Crear Nuevo Cliente</h3>
            <button (click)="cerrarModalNuevoCliente()" 
              class="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- Formulario de Nuevo Cliente -->
          <div class="p-4 space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  RUC/Cédula <span class="text-red-500">*</span>
                </label>
                <input type="text" [(ngModel)]="nuevoCliente.ruc_cedula" 
                  class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="0992123456001">
              </div>
              
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre/Razón Social <span class="text-red-500">*</span>
                </label>
                <input type="text" [(ngModel)]="nuevoCliente.nombre_razon_social" 
                  class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="Empresa XYZ S.A.">
              </div>
            </div>
            
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Dirección <span class="text-red-500">*</span>
              </label>
              <input type="text" [(ngModel)]="nuevoCliente.direccion" 
                class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Av. Principal 123 y Secundaria">
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono <span class="text-red-500">*</span>
                </label>
                <input type="text" [(ngModel)]="nuevoCliente.telefono" 
                  class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="04-2345678">
              </div>
              
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email <span class="text-red-500">*</span>
                </label>
                <input type="email" [(ngModel)]="nuevoCliente.email" 
                  class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="contacto@empresa.com">
              </div>
            </div>
            
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contacto Principal <span class="text-red-500">*</span>
              </label>
              <input type="text" [(ngModel)]="nuevoCliente.contacto_principal" 
                class="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Juan Pérez">
            </div>
          </div>
          
          <!-- Footer con botones -->
          <div class="flex justify-end gap-2 p-4 border-t dark:border-slate-700">
            <button (click)="cerrarModalNuevoCliente()" 
              class="px-4 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              Cancelar
            </button>
            <button (click)="guardarNuevoCliente()" [disabled]="guardandoCliente() || !formularioClienteValido()"
              class="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              {{ guardandoCliente() ? 'Guardando...' : 'Guardar Cliente' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class QuoteCreateComponent implements OnInit {
  pdfService = inject(PdfService);
  dbService = inject(DatabaseService);
  toastService = inject(ToastService);

  @Input() idCotizacionEditar?: number;
  @Input() modoEdicion: boolean = false;

  @Output() cerrarModal = new EventEmitter<void>();

  clientes = signal<Cliente[]>([]);
  clienteSeleccionado = signal<Cliente | null>(null);
  contactosCliente = signal<any[]>([]);
  items = signal<ItemCotizacion[]>([]);
  guardando = signal(false);
  mostrarModalPreview = signal(false);
  pdfPreviewUrl = signal<string>('');
  mostrarModalNuevoCliente = signal(false);
  guardandoCliente = signal(false);

  nuevoCliente = {
    ruc_cedula: '',
    nombre_razon_social: '',
    direccion: '',
    telefono: '',
    email: '',
    contacto_principal: ''
  };

  formulario = {
    numero_cotizacion: 'Cargando...',
    fecha_cotizacion: new Date().toISOString().split('T')[0],
    fecha_validez: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 días
    id_cliente: '',
    id_contacto: '', // Nuevo campo para el contacto seleccionado
    destinatario_nombre: '',
    destinatario_direccion: '',
    destinatario_telefono: '',
    observaciones: '',
    tienDescuento: false,
    descuento: 0,
    tipoDescuento: 'monto' as 'monto' | 'porcentaje',
    plazaParque: '',
    tiempoEntrega: '1 semana',
    condicionesPago: 'Pago a los 60 días'
  };


  async ngOnInit() {
    await this.cargarClientes();

    if (this.modoEdicion && this.idCotizacionEditar) {
      await this.cargarDatosCotizacion();
    } else {
      await this.generarNumeroCotizacion();
    }
  }

  async cargarDatosCotizacion() {
    try {
      const response = await fetch(`${environment.apiUrl}/cotizaciones.php?action=detalle&id=${this.idCotizacionEditar}`);
      const result = await response.json();

      if (result.success) {
        const data = result.data;

        // Cargar datos básicos
        this.formulario.numero_cotizacion = data.numero_cotizacion;
        this.formulario.fecha_cotizacion = data.fecha_cotizacion;
        this.formulario.fecha_validez = data.fecha_validez;
        this.formulario.observaciones = data.observaciones || '';
        this.formulario.id_cliente = data.id_cliente.toString();
        this.formulario.plazaParque = data.plaza_parque || 'PLAZA PARQUE';
        this.formulario.tiempoEntrega = data.tiempo_entrega || '1 semana';
        this.formulario.condicionesPago = data.condiciones_pago || 'Pago a los 60 días';

        // Cargar descuentos si existen
        if (data.descuento && data.descuento > 0) {
          this.formulario.tienDescuento = true;
          this.formulario.descuento = data.descuento.toString();
          this.formulario.tipoDescuento = (data.tipo_descuento || 'monto') as 'monto' | 'porcentaje';
        }

        // Datos del destinatario (si existen)
        this.formulario.destinatario_nombre = data.nombre_razon_social;
        this.formulario.destinatario_direccion = data.direccion;
        this.formulario.destinatario_telefono = data.telefono;

        // Seleccionar cliente después de cargar
        setTimeout(() => {
          this.onClienteChange();
        }, 100);

        // Cargar items
        const itemsCargados = data.items.map((item: any) => ({
          descripcion: item.descripcion,
          cantidad: parseFloat(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario),
          iva: parseFloat(item.iva) || 15,
          subtotal: parseFloat(item.subtotal)
        }));

        this.items.set(itemsCargados);
      }
    } catch (error) {
      console.error('Error al cargar cotización:', error);
      this.toastService.showError('Error al cargar los datos de la cotización');
    }
  }

  async cargarClientes() {
    try {
      const response = await fetch(`${environment.apiUrl}/clientes.php`);
      const result = await response.json();
      if (result.success) {
        this.clientes.set(result.data);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  }

  async generarNumeroCotizacion() {
    try {
      const response = await fetch(`${environment.apiUrl}/cotizaciones.php?action=next_sequential`);
      const result = await response.json();
      if (result.success && result.data.numero_cotizacion) {
        this.formulario.numero_cotizacion = result.data.numero_cotizacion;
      } else {
        // Fallback en caso de error
        const fecha = new Date();
        const año = fecha.getFullYear();
        this.formulario.numero_cotizacion = `PR-${año}-0001`;
      }
    } catch (error) {
      console.error('Error generando número de cotización:', error);
      // Fallback en caso de error
      const fecha = new Date();
      const año = fecha.getFullYear();
      this.formulario.numero_cotizacion = `PR-${año}-0001`;
    }
  }

  async onClienteChange() {
    const cliente = this.clientes().find(c => c.id_cliente.toString() === this.formulario.id_cliente);
    this.clienteSeleccionado.set(cliente || null);

    if (cliente) {
      // Auto-completar destinatario con datos del cliente
      this.formulario.destinatario_nombre = cliente.nombre_razon_social;
      this.formulario.destinatario_direccion = cliente.direccion;
      this.formulario.destinatario_telefono = cliente.telefono;

      // Cargar contactos del cliente
      try {
        const response = await fetch(`${environment.apiUrl}/contactos.php?id_cliente=${cliente.id_cliente}`);
        const result = await response.json();
        if (result.success) {
          this.contactosCliente.set(result.data);
          // Seleccionar el principal por defecto
          const principal = result.data.find((c: any) => c.es_principal == 1);
          if (principal) {
            this.formulario.id_contacto = principal.id_contacto.toString();
            this.formulario.destinatario_nombre = principal.nombre_completo;
          }
        }
      } catch (error) {
        console.error('Error cargando contactos:', error);
      }
    } else {
      this.contactosCliente.set([]);
      this.formulario.id_contacto = '';
    }
  }

  onContactoChange() {
    const contacto = this.contactosCliente().find(c => c.id_contacto.toString() === this.formulario.id_contacto);
    if (contacto) {
      this.formulario.destinatario_nombre = contacto.nombre_completo;
    }
  }


  agregarItem() {
    this.items.update(items => [...items, {
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      iva: 15,
      subtotal: 0
    }]);
  }

  eliminarItem(index: number) {
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  calcularSubtotal(item: ItemCotizacion) {
    item.subtotal = item.cantidad * item.precio_unitario;
  }

  calcularSubtotalTotal(): number {
    return this.items().reduce((sum, item) => sum + item.subtotal, 0);
  }

  calcularIVATotal(): number {
    return this.items().reduce((sum, item) => {
      if (item.iva > 0) {
        return sum + (item.subtotal * item.iva / 100);
      }
      return sum;
    }, 0);
  }

  calcularTotal(): number {
    const subtotal = this.calcularSubtotalTotal();
    const iva = this.calcularIVATotal();
    const total = subtotal + iva;

    if (!this.formulario.tienDescuento || this.formulario.descuento <= 0) {
      return total;
    }

    const descuento = this.calcularDescuento();
    return total - descuento;
  }

  calcularDescuento(): number {
    if (!this.formulario.tienDescuento) {
      return 0;
    }

    const descuentoValue = typeof this.formulario.descuento === 'string'
      ? parseFloat(this.formulario.descuento)
      : this.formulario.descuento;

    if (isNaN(descuentoValue) || descuentoValue <= 0) {
      return 0;
    }

    if (this.formulario.tipoDescuento === 'porcentaje') {
      const total = this.calcularSubtotalTotal() + this.calcularIVATotal();
      return (total * descuentoValue) / 100;
    } else {
      // Monto fijo
      return descuentoValue;
    }
  }

  formularioValido(): boolean {
    return !!(
      this.formulario.numero_cotizacion &&
      this.formulario.fecha_cotizacion &&
      this.formulario.fecha_validez &&
      this.formulario.id_cliente &&
      this.formulario.destinatario_nombre &&
      this.items().length > 0 &&
      this.items().every(item => item.descripcion && item.cantidad > 0 && item.precio_unitario > 0)
    );
  }

  previsualizarPDF() {
    try {
      const cotizacionPDF = this.construirObjetoCotizacion();
      const blobUrl = this.pdfService.generarBlobPDF(cotizacionPDF);

      if (!blobUrl) {
        this.toastService.showError('❌ Error al generar vista previa del PDF');
        console.error('No se pudo generar la URL del PDF');
        return;
      }

      this.pdfPreviewUrl.set(blobUrl);
      this.mostrarModalPreview.set(true);
    } catch (error) {
      console.error('Error al previsualizar PDF:', error);
      this.toastService.showError('❌ Error al generar vista previa del PDF');
    }
  }

  cerrarPreview() {
    this.mostrarModalPreview.set(false);
    // Liberar la URL del blob después de un breve delay
    setTimeout(() => {
      if (this.pdfPreviewUrl()) {
        URL.revokeObjectURL(this.pdfPreviewUrl());
        this.pdfPreviewUrl.set('');
      }
    }, 100);
  }

  abrirModalNuevoCliente() {
    this.nuevoCliente = {
      ruc_cedula: '',
      nombre_razon_social: '',
      direccion: '',
      telefono: '',
      email: '',
      contacto_principal: ''
    };
    this.mostrarModalNuevoCliente.set(true);
  }

  cerrarModalNuevoCliente() {
    this.mostrarModalNuevoCliente.set(false);
  }

  formularioClienteValido(): boolean {
    return !!(
      this.nuevoCliente.ruc_cedula &&
      this.nuevoCliente.nombre_razon_social &&
      this.nuevoCliente.direccion &&
      this.nuevoCliente.telefono &&
      this.nuevoCliente.email &&
      this.nuevoCliente.contacto_principal
    );
  }

  async guardarNuevoCliente() {
    if (!this.formularioClienteValido()) return;

    this.guardandoCliente.set(true);

    try {
      const response = await fetch(`${environment.apiUrl}/clientes.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.nuevoCliente)
      });

      const result = await response.json();

      if (result.success) {
        this.toastService.showSuccess('✅ Cliente creado correctamente');
        // Recargar lista de clientes
        await this.cargarClientes();
        // Seleccionar automáticamente el nuevo cliente
        this.formulario.id_cliente = result.data.id_cliente.toString();
        this.onClienteChange();
        // Cerrar modal
        this.cerrarModalNuevoCliente();
      } else {
        this.toastService.showError('❌ Error al crear cliente: ' + result.message);
      }
    } catch (error) {
      console.error('Error guardando cliente:', error);
      this.toastService.showError('❌ Error al guardar el cliente');
    } finally {
      this.guardandoCliente.set(false);
    }
  }

  async guardarYGenerarPDF() {
    if (!this.formularioValido()) return;

    this.guardando.set(true);

    try {
      // 1. Guardar en BD
      const url = this.modoEdicion
        ? `${environment.apiUrl}/cotizaciones.php?id=${this.idCotizacionEditar}`
        : `${environment.apiUrl}/cotizaciones.php`;

      const payload = {
        ...(this.modoEdicion && { id_cotizacion: this.idCotizacionEditar }),
        numero_cotizacion: this.formulario.numero_cotizacion,
        id_cliente: parseInt(this.formulario.id_cliente),
        fecha_cotizacion: this.formulario.fecha_cotizacion,
        fecha_validez: this.formulario.fecha_validez,
        subtotal: this.calcularSubtotalTotal(),
        iva: this.calcularIVATotal(),
        descuento: this.formulario.tienDescuento ? this.calcularDescuento() : 0,
        tipoDescuento: this.formulario.tipoDescuento as 'monto' | 'porcentaje',
        total: this.calcularTotal(),
        observaciones: this.formulario.observaciones,
        plazaParque: this.formulario.plazaParque,
        tiempoEntrega: this.formulario.tiempoEntrega,
        condicionesPago: this.formulario.condicionesPago,
        nombreContacto: this.formulario.destinatario_nombre,
        items: this.items()
      };

      console.log('Payload a enviar:', payload);

      const response = await fetch(url, {
        method: this.modoEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('Respuesta del servidor:', result);

      if (result.success) {
        // 2. Generar PDF
        const cotizacionPDF = this.construirObjetoCotizacion();
        this.pdfService.generarCotizacionPDF(cotizacionPDF);

        this.toastService.showSuccess(this.modoEdicion ? '✅ Cotización actualizada y PDF generado' : '✅ Cotización guardada y PDF generado correctamente');
        this.cerrar();
      } else {
        this.toastService.showError('❌ Error al guardar: ' + (result.message || 'Error desconocido'));
        console.error('Error detallado:', result);
      }
    } catch (error) {
      console.error('Error guardando cotización:', error);
      this.toastService.showError('❌ Error al guardar la cotización: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      this.guardando.set(false);
    }
  }

  construirObjetoCotizacion(): CotizacionPDF {
    const cliente = this.clienteSeleccionado();
    return {
      numero_cotizacion: this.formulario.numero_cotizacion,
      fecha_cotizacion: this.formatearFecha(this.formulario.fecha_cotizacion),
      fecha_validez: this.formatearFecha(this.formulario.fecha_validez),
      cliente: {
        nombre: cliente?.nombre_razon_social || '',
        ruc: cliente?.ruc_cedula || '',
        direccion: cliente?.direccion || '',
        telefono: cliente?.telefono || '',
        email: cliente?.email || ''
      },
      destinatario: {
        nombre: this.formulario.destinatario_nombre,
        direccion: this.formulario.destinatario_direccion,
        telefono: this.formulario.destinatario_telefono
      },
      items: this.items(),
      subtotal: this.calcularSubtotalTotal(),
      iva: this.calcularIVATotal(),
      descuento: this.formulario.tienDescuento ? this.calcularDescuento() : 0,
      tipoDescuento: this.formulario.tipoDescuento as 'monto' | 'porcentaje',
      total: this.calcularTotal(),
      observaciones: this.formulario.observaciones,
      plazaParque: this.formulario.plazaParque,
      tiempoEntrega: this.formulario.tiempoEntrega,
      condicionesPago: this.formulario.condicionesPago,
      nombreContacto: this.formulario.destinatario_nombre
    };
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  cerrar() {
    this.cerrarModal.emit();
  }
}
