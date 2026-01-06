import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService, InventoryItem } from '../../services/inventory.service';
import { CsvExportService } from '../../services/csv-export.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { InventoryCreateComponent } from './inventory-create.component';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, InventoryCreateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent {
  inventoryService = inject(InventoryService);
  csvExportService = inject(CsvExportService);
  toastService = inject(ToastService);
  authService = inject(AuthService);

  // Verificar si el usuario es admin
  isAdmin = computed(() => this.authService.currentUser()?.rol === 'admin');

  inventory = signal<InventoryItem[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Modal State
  showNewItemModal = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  selectedItem = signal<InventoryItem | null>(null);
  itemToDelete = signal<InventoryItem | null>(null);

  // Filtros
  busqueda = signal<string>('');
  filtroEstado = signal<string>('todos');

  // Paginación
  paginaActual = signal<number>(1);
  itemsPorPagina = signal<number>(10);
  protected Math = Math;

  // Computed: Verificar si el usuario es supervisor
  isSupervisor = computed(() => {
    const user = this.authService.currentUser();
    return user?.rol === 'supervisor';
  });

  constructor() {
    this.loadInventory();
  }

  async loadInventory(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.inventoryService.getInventory();
      this.inventory.set(data);
    } catch (e) {
      console.error("Error loading inventory:", e);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Computed: Inventario filtrado
  inventoryFiltered = computed(() => {
    const items = this.inventory();
    const search = this.busqueda().toLowerCase().trim();
    const statusFilter = this.filtroEstado();

    return items.filter(item => {
      const nombre = item.nombre ? item.nombre.toLowerCase() : '';
      const codigo = item.codigo_producto ? item.codigo_producto.toLowerCase() : '';
      const ubicacion = item.ubicacion_bodega ? item.ubicacion_bodega.toLowerCase() : '';

      const matchesSearch =
        nombre.includes(search) ||
        codigo.includes(search) ||
        ubicacion.includes(search);

      if (!matchesSearch) return false;

      if (statusFilter === 'todos') return true;

      const status = this.getStockStatus(item);
      if (statusFilter === 'en_stock') return status === 'En Stock';
      if (statusFilter === 'bajo_stock') return status === 'Bajo Stock';
      if (statusFilter === 'agotado') return status === 'Agotado';

      return true;
    });
  });

  // Computed: Inventario paginado
  inventoryPaginated = computed(() => {
    const items = this.inventoryFiltered();
    const pagina = this.paginaActual();
    const itemsPagina = this.itemsPorPagina();

    const inicio = (pagina - 1) * itemsPagina;
    return items.slice(inicio, inicio + itemsPagina);
  });

  // Computed: Total de páginas
  totalPaginas = computed(() => {
    return Math.ceil(this.inventoryFiltered().length / this.itemsPorPagina());
  });

  // Computed: Array de páginas para el paginador
  paginasArray = computed(() => {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  });

  cambiarBusqueda(valor: string) {
    this.busqueda.set(valor);
    this.paginaActual.set(1);
  }

  cambiarFiltroEstado(valor: string) {
    this.filtroEstado.set(valor);
    this.paginaActual.set(1);
  }

  // Métodos de paginación
  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  paginaAnterior() {
    if (this.paginaActual() > 1) {
      this.paginaActual.update(p => p - 1);
    }
  }

  paginaSiguiente() {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update(p => p + 1);
    }
  }

  cambiarItemsPorPagina(cantidad: number) {
    this.itemsPorPagina.set(cantidad);
    this.paginaActual.set(1);
  }

  exportToCsv(): void {
    const dataToExport = this.inventoryFiltered().map(item => ({
      SKU: item.codigo_producto,
      Nombre: item.nombre,
      Stock_Actual: item.stock_actual,
      Stock_Minimo: item.stock_minimo,
      Ubicacion: item.ubicacion_bodega,
      Estado: this.getStockStatus(item)
    }));
    this.csvExportService.exportToCsv('inventario.csv', dataToExport);
  }

  getStockStatus(item: InventoryItem): 'En Stock' | 'Bajo Stock' | 'Agotado' {
    if (item.stock_actual <= 0) return 'Agotado';
    if (item.stock_actual <= item.stock_minimo) return 'Bajo Stock';
    return 'En Stock';
  }

  getStatusClass(status: 'En Stock' | 'Bajo Stock' | 'Agotado'): string {
    switch (status) {
      case 'En Stock': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Bajo Stock': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Agotado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
  }

  // Modal Actions
  openNewItemModal() {
    this.selectedItem.set(null);
    this.showNewItemModal.set(true);
  }

  editItem(item: InventoryItem) {
    this.selectedItem.set(item);
    this.showNewItemModal.set(true);
  }

  closeNewItemModal(saved: boolean) {
    this.showNewItemModal.set(false);
    this.selectedItem.set(null);
    if (saved) {
      this.loadInventory();
    }
  }

  deleteItem(item: InventoryItem) {
    this.itemToDelete.set(item);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.itemToDelete.set(null);
  }

  async confirmDelete() {
    const item = this.itemToDelete();
    if (!item) return;

    try {
      await this.inventoryService.deleteItem(item.id_producto);
      this.toastService.showSuccess(`Producto ${item.nombre} eliminado correctamente`);
      this.loadInventory();
      this.closeDeleteModal();
    } catch (error) {
      console.error('Error deleting item:', error);
      this.toastService.showError('Error al eliminar el producto');
    }
  }

  recargar() {
    this.loadInventory();
  }
}
