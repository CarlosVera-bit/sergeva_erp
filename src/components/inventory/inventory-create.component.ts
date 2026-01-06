import { Component, signal, inject, OnInit, OnChanges, Output, EventEmitter, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryItem, CreateInventoryItemDTO } from '../../services/inventory.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-inventory-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 dark:text-white">
            {{ isEditing() ? 'Editar Producto' : 'Nuevo Producto' }}
          </h2>
          <p class="text-slate-600 dark:text-slate-400 mt-1">
            {{ isEditing() ? 'Modifique la información del producto' : 'Complete la información para registrar un nuevo producto' }}
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Código / SKU <span class="text-red-500">*</span>
            </label>
            <input type="text" [(ngModel)]="formulario.codigo_producto" 
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Ej: PROD-001">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nombre del Producto <span class="text-red-500">*</span>
            </label>
            <input type="text" [(ngModel)]="formulario.nombre" 
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Nombre descriptivo">
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Descripción
            </label>
            <textarea [(ngModel)]="formulario.descripcion" rows="2"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Descripción detallada del producto"></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Categoría
            </label>
            <input type="text" [(ngModel)]="formulario.categoria" 
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Ej: Electrónica, Herramientas">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Medida
            </label>
            <div class="flex gap-2">
              <input type="number" [(ngModel)]="formulario.valor_medida" 
                class="w-1/2 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Valor">
              <select [(ngModel)]="formulario.unidad_medida" 
                class="w-1/2 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <option value="" disabled selected>Unidad</option>
                @for (unit of units; track unit) {
                  <option [value]="unit">{{ unit }}</option>
                }
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Ubicación en Bodega
            </label>
            <input type="text" [(ngModel)]="formulario.ubicacion_bodega" 
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Ej: Estante A, Nivel 2">
          </div>
        </div>

        <!-- Inventario y Precios -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-4">Inventario y Precios</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Stock Actual
              </label>
              <input type="number" [(ngModel)]="formulario.stock_actual" min="0"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Stock Mínimo
              </label>
              <input type="number" [(ngModel)]="formulario.stock_minimo" min="0"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Precio Venta ($)
              </label>
              <input type="number" [(ngModel)]="formulario.precio_venta" min="0" step="0.01"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
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
            {{ isEditing() ? 'Actualizar' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class InventoryCreateComponent implements OnInit, OnChanges {
  @Input() itemToEdit: InventoryItem | null = null;
  @Output() cerrarModal = new EventEmitter<boolean>();

  inventoryService = inject(InventoryService);
  toastService = inject(ToastService);

  isSaving = signal(false);
  isEditing = signal(false);

  units = ['Unidad', 'Kg', 'g', 'L', 'ml', 'm', 'cm', 'mm', 'Galón', 'Libra', 'Onza', 'Caja', 'Paquete'];

  formulario: any = {
    codigo_producto: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    valor_medida: null,
    unidad_medida: '',
    ubicacion_bodega: '',
    stock_actual: 0,
    stock_minimo: 5,
    precio_venta: 0
  };

  ngOnInit() {
    this.checkEditMode();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['itemToEdit']) {
      this.checkEditMode();
    }
  }

  checkEditMode() {
    if (this.itemToEdit) {
      this.isEditing.set(true);
      this.cargarDatosEdicion();
    } else {
      this.isEditing.set(false);
      this.resetForm();
    }
  }

  resetForm() {
    this.formulario = {
      codigo_producto: '',
      nombre: '',
      descripcion: '',
      categoria: '',
      valor_medida: null,
      unidad_medida: '',
      ubicacion_bodega: '',
      stock_actual: 0,
      stock_minimo: 5,
      precio_venta: 0
    };
  }

  cargarDatosEdicion() {
    if (!this.itemToEdit) return;

    const item = this.itemToEdit;
    this.formulario = {
      codigo_producto: item.codigo_producto,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      categoria: item.categoria || '',
      valor_medida: item.valor_medida || null,
      unidad_medida: item.unidad_medida || '',
      ubicacion_bodega: item.ubicacion_bodega || '',
      stock_actual: item.stock_actual,
      stock_minimo: item.stock_minimo,
      precio_venta: item.precio_venta || 0
    };
  }

  isValid(): boolean {
    return !!(this.formulario.codigo_producto && this.formulario.nombre);
  }

  async guardar() {
    if (!this.isValid()) return;

    this.isSaving.set(true);
    try {
      const dto: CreateInventoryItemDTO = {
        codigo_producto: this.formulario.codigo_producto,
        nombre: this.formulario.nombre,
        descripcion: this.formulario.descripcion,
        categoria: this.formulario.categoria,
        valor_medida: this.formulario.valor_medida,
        unidad_medida: this.formulario.unidad_medida,
        ubicacion_bodega: this.formulario.ubicacion_bodega,
        stock_actual: Number(this.formulario.stock_actual),
        stock_minimo: Number(this.formulario.stock_minimo),
        precio_venta: Number(this.formulario.precio_venta)
      };

      console.log('Guardando producto:', dto);
      console.log('Modo edición:', this.isEditing());
      console.log('Item a editar:', this.itemToEdit);

      if (this.isEditing() && this.itemToEdit) {
        await this.inventoryService.updateItem(this.itemToEdit.id_producto, dto);
      } else {
        await this.inventoryService.createItem(dto);
      }

      this.toastService.showSuccess(this.isEditing() ? 'Producto actualizado correctamente' : 'Producto guardado correctamente');
      this.cerrarModal.emit(true);
    } catch (error) {
      console.error('Error guardando producto:', error);
      this.toastService.showError('Error al guardar el producto');
    } finally {
      this.isSaving.set(false);
    }
  }

  cerrar() {
    this.cerrarModal.emit(false);
  }
}
