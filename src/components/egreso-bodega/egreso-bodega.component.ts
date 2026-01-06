import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EgresoBodegaService, EgresoBodega, CreateEgresoBodegaDTO, EgresoBodegaDetail } from '../../services/egreso-bodega.service';
import { InventoryService, InventoryItem } from '../../services/inventory.service';
import { WorkOrderService, WorkOrder } from '../../services/work-order.service';
import { CsvExportService } from '../../services/csv-export.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-egreso-bodega',
  templateUrl: './egreso-bodega.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EgresoBodegaComponent implements OnInit {
  egresoService = inject(EgresoBodegaService);
  inventoryService = inject(InventoryService);
  workOrderService = inject(WorkOrderService);
  csvExportService = inject(CsvExportService);
  authService = inject(AuthService);
  toastService = inject(ToastService);

  // Verificar si el usuario es admin
  isAdmin = computed(() => this.authService.currentUser()?.rol === 'admin');

  egresos = signal<EgresoBodega[]>([]);
  isLoading = signal<boolean>(false);

  // Paginación
  paginaActual = signal<number>(1);
  itemsPorPagina = signal<number>(10);
  protected Math = Math;

  // Modal State
  showModal = signal<boolean>(false);
  showDetailModal = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Data for Selects
  products = signal<InventoryItem[]>([]);
  workOrders = signal<WorkOrder[]>([]);

  // Selected Egreso for Detail/Delete
  selectedEgreso = signal<EgresoBodega | null>(null);
  egresoToDelete = signal<EgresoBodega | null>(null);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);

  // Filters
  searchTerm = signal<string>('');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  // Form State
  newEgreso = signal<CreateEgresoBodegaDTO>({
    fecha_egreso: new Date().toISOString().split('T')[0],
    id_ot: 0,
    id_cliente: 0,
    id_autorizado_por: 1,
    observaciones: '',
    detalles: []
  });

  // Computed: Egresos filtrados y paginados
  egresosPaginated = computed(() => {
    let items = this.egresos();

    // Apply Filters
    const search = this.searchTerm().toLowerCase();
    const from = this.dateFrom();
    const to = this.dateTo();

    if (search) {
      items = items.filter(e =>
        e.numero_egreso.toLowerCase().includes(search) ||
        (e.ot_numero && e.ot_numero.toLowerCase().includes(search)) ||
        (e.cliente_nombre && e.cliente_nombre.toLowerCase().includes(search)) ||
        (e.autorizado_por_nombre && e.autorizado_por_nombre.toLowerCase().includes(search))
      );
    }

    if (from) {
      items = items.filter(e => e.fecha_egreso >= from);
    }

    if (to) {
      items = items.filter(e => e.fecha_egreso <= to + ' 23:59:59');
    }

    const pagina = this.paginaActual();
    const itemsPagina = this.itemsPorPagina();

    const inicio = (pagina - 1) * itemsPagina;
    return items.slice(inicio, inicio + itemsPagina);
  });

  // Computed: Total de páginas (basado en filtrados)
  totalPaginas = computed(() => {
    let items = this.egresos();

    // Apply Filters (Duplicate logic for count)
    const search = this.searchTerm().toLowerCase();
    const from = this.dateFrom();
    const to = this.dateTo();

    if (search) {
      items = items.filter(e =>
        e.numero_egreso.toLowerCase().includes(search) ||
        (e.ot_numero && e.ot_numero.toLowerCase().includes(search)) ||
        (e.cliente_nombre && e.cliente_nombre.toLowerCase().includes(search)) ||
        (e.autorizado_por_nombre && e.autorizado_por_nombre.toLowerCase().includes(search))
      );
    }

    if (from) {
      items = items.filter(e => e.fecha_egreso >= from);
    }

    if (to) {
      items = items.filter(e => e.fecha_egreso <= to + ' 23:59:59');
    }

    return Math.ceil(items.length / this.itemsPorPagina());
  });

  // Computed: Array de páginas para el paginador
  paginasArray = computed(() => {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  });

  // Computed: Verificar si el usuario es supervisor
  isSupervisor = computed(() => {
    const user = this.authService.currentUser();
    return user?.rol === 'supervisor';
  });

  constructor() { }

  ngOnInit() {
    this.loadData();
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

  async loadData() {
    this.isLoading.set(true);
    try {
      const [egresos, prods, ots] = await Promise.all([
        this.egresoService.getEgresos(),
        this.inventoryService.getInventory(true),
        this.workOrderService.getWorkOrders()
      ]);
      this.egresos.set(egresos);
      this.products.set(prods);
      this.workOrders.set(ots);
    } catch (e) {
      console.error('Error loading data', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  openNewEgresoModal() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.newEgreso.set({
      fecha_egreso: new Date().toISOString().split('T')[0],
      id_ot: 0,
      id_cliente: 0,
      id_autorizado_por: 1,
      observaciones: '',
      detalles: []
    });
    this.addItem(); // Add one empty item by default
    this.showModal.set(true);
  }

  async editEgreso(egreso: EgresoBodega) {
    this.isEditing.set(true);
    this.editingId.set(egreso.id_egreso);

    try {
      // Cargar detalles completos
      const fullEgreso = await this.egresoService.getEgresoById(egreso.id_egreso);

      this.newEgreso.set({
        fecha_egreso: fullEgreso.fecha_egreso.split(' ')[0], // Solo fecha YYYY-MM-DD
        id_ot: fullEgreso.id_ot,
        id_cliente: fullEgreso.id_cliente,
        id_autorizado_por: fullEgreso.id_autorizado_por,
        observaciones: fullEgreso.observaciones,
        detalles: fullEgreso.detalles || []
      });

      this.showModal.set(true);
    } catch (e) {
      console.error('Error loading egreso for edit', e);
      this.toastService.showError('Error al cargar datos para editar');
    }
  }

  onOtChange(id_ot: number) {
    const ot = this.workOrders().find(o => o.id_ot == id_ot);
    if (ot) {
      this.newEgreso.update(curr => ({
        ...curr,
        id_ot: id_ot,
        id_cliente: ot.id_cliente || 0
      }));
    }
  }

  closeModal() {
    this.showModal.set(false);
  }

  // Form Logic
  addItem() {
    const current = this.newEgreso();
    const newItem: EgresoBodegaDetail = {
      id_producto: 0,
      cantidad: 1,
      notas: ''
    };
    this.newEgreso.set({ ...current, detalles: [...current.detalles, newItem] });
  }

  removeItem(index: number) {
    const current = this.newEgreso();
    const newDetails = [...current.detalles];
    newDetails.splice(index, 1);
    this.newEgreso.set({ ...current, detalles: newDetails });
  }

  updateItemProduct(index: number, productId: number) {
    const current = this.newEgreso();
    const details = [...current.detalles];
    details[index].id_producto = productId;
    this.newEgreso.set({ ...current, detalles: details });
  }

  async saveEgreso() {
    if (this.isSaving()) return;

    // Validations
    const egreso = this.newEgreso();

    if (!egreso.id_ot || egreso.id_ot === 0) {
      this.toastService.showWarning('Seleccione una Orden de Trabajo');
      return;
    }

    if (egreso.detalles.length === 0) {
      this.toastService.showWarning('Agregue al menos un producto');
      return;
    }
    if (egreso.detalles.some(d => !d.id_producto || d.cantidad <= 0)) {
      this.toastService.showWarning('Complete los detalles del egreso correctamente');
      return;
    }

    // Asignar usuario actual como autorizado_por
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.newEgreso.update(curr => ({
        ...curr,
        id_autorizado_por: currentUser.id_usuario
      }));
    } else {
      // Fallback si no hay usuario (no debería pasar si hay auth guard)
      console.warn('No hay usuario logueado, usando ID 1 por defecto');
      this.newEgreso.update(curr => ({
        ...curr,
        id_autorizado_por: 1
      }));
    }

    // Validar stock localmente antes de enviar (opcional, pero buena UX)
    // Solo validar en creación, ya que en edición el stock se restaura primero en el backend
    if (!this.isEditing()) {
      for (const item of egreso.detalles) {
        const prod = this.products().find(p => p.id_producto == item.id_producto);
        if (prod && (prod.stock_actual || 0) < item.cantidad) {
          this.toastService.showWarning(`Stock insuficiente para ${prod.nombre}. Disponible: ${prod.stock_actual}`);
          return;
        }
      }
    }

    this.isSaving.set(true);
    try {
      if (this.isEditing() && this.editingId()) {
        await this.egresoService.updateEgreso(this.editingId()!, this.newEgreso());
        this.toastService.showSuccess('Egreso actualizado correctamente');
      } else {
        await this.egresoService.createEgreso(this.newEgreso());
        this.toastService.showSuccess('Egreso registrado correctamente');
      }

      await this.loadData(); // Reload to update stock
      this.closeModal();
    } catch (e: any) {
      console.error('Error saving egreso', e);
      this.toastService.showError('Error al guardar: ' + (e.message || 'Error desconocido'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async viewDetail(egreso: EgresoBodega) {
    this.selectedEgreso.set(null);
    try {
      const fullEgreso = await this.egresoService.getEgresoById(egreso.id_egreso);
      this.selectedEgreso.set(fullEgreso);
      this.showDetailModal.set(true);
    } catch (e) {
      console.error('Error loading detail', e);
    }
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedEgreso.set(null);
  }

  async deleteEgreso(egreso: EgresoBodega) {
    this.egresoToDelete.set(egreso);
    this.showDeleteModal.set(true);
  }

  async confirmDelete() {
    const egreso = this.egresoToDelete();
    if (!egreso) return;

    try {
      await this.egresoService.deleteEgreso(egreso.id_egreso);
      this.toastService.showSuccess('Egreso eliminado correctamente');
      this.loadData();
      this.closeDeleteModal();
    } catch (e) {
      console.error('Error deleting egreso', e);
      this.toastService.showError('Error al eliminar el egreso');
    }
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.egresoToDelete.set(null);
  }

  exportToCsv(): void {
    const dataToExport = this.egresos().map(e => ({
      ID_Egreso: e.numero_egreso,
      Destino: e.destino,
      Solicitante: e.solicitante,
      Fecha: e.fecha_egreso.slice(0, 10),
      Estado: this.formatStatus(e.estado)
    }));
    this.csvExportService.exportToCsv('egresos_bodega.csv', dataToExport);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'borrador':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  formatStatus(status: string): string {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
  }
}
