import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchasingService, PurchaseOrder, CreatePurchaseOrderDTO, PurchaseOrderDetail } from '../../services/purchasing.service';
import { InventoryService, InventoryItem } from '../../services/inventory.service';
import { CsvExportService } from '../../services/csv-export.service';
import { DatabaseService } from '../../services/database.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-purchasing',
  templateUrl: './purchasing.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchasingComponent implements OnInit {
  purchasingService = inject(PurchasingService);
  inventoryService = inject(InventoryService);
  csvExportService = inject(CsvExportService);
  dbService = inject(DatabaseService); // Mantener por compatibilidad si se usa en template
  authService = inject(AuthService);
  toastService = inject(ToastService);

  // Verificar si el usuario es admin
  isAdmin = computed(() => this.authService.currentUser()?.rol === 'admin');

  purchaseOrders = signal<PurchaseOrder[]>([]);
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
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);

  // Filters
  searchTerm = signal<string>('');
  statusFilter = signal<string>('');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  // Data for Selects
  providers = signal<any[]>([]);
  products = signal<InventoryItem[]>([]);

  // Selected Order for Detail
  selectedOrder = signal<PurchaseOrder | null>(null);
  orderToDelete = signal<PurchaseOrder | null>(null);

  // Form State
  newOrder = signal<CreatePurchaseOrderDTO>({
    id_proveedor: 0,
    fecha_pedido: new Date().toISOString().split('T')[0],
    estado: 'recibido',
    total: 0,
    observaciones: '',
    detalles: []
  });

  // Computed: Pedidos filtrados y paginados
  ordersPaginated = computed(() => {
    let items = this.purchaseOrders();

    // Apply Filters
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const from = this.dateFrom();
    const to = this.dateTo();

    if (search) {
      items = items.filter(o =>
        o.numero_pedido.toLowerCase().includes(search) ||
        (o.proveedor_nombre && o.proveedor_nombre.toLowerCase().includes(search))
      );
    }

    if (status) {
      items = items.filter(o => o.estado === status);
    }

    if (from) {
      items = items.filter(o => o.fecha_pedido >= from);
    }

    if (to) {
      items = items.filter(o => o.fecha_pedido <= to + ' 23:59:59');
    }

    const pagina = this.paginaActual();
    const itemsPagina = this.itemsPorPagina();

    const inicio = (pagina - 1) * itemsPagina;
    return items.slice(inicio, inicio + itemsPagina);
  });

  // Computed: Total de páginas (basado en filtrados)
  totalPaginas = computed(() => {
    let items = this.purchaseOrders();

    // Apply Filters (Duplicate logic for count)
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const from = this.dateFrom();
    const to = this.dateTo();

    if (search) {
      items = items.filter(o =>
        o.numero_pedido.toLowerCase().includes(search) ||
        (o.proveedor_nombre && o.proveedor_nombre.toLowerCase().includes(search))
      );
    }

    if (status) {
      items = items.filter(o => o.estado === status);
    }

    if (from) {
      items = items.filter(o => o.fecha_pedido >= from);
    }

    if (to) {
      items = items.filter(o => o.fecha_pedido <= to + ' 23:59:59');
    }

    return Math.ceil(items.length / this.itemsPorPagina());
  });

  // Computed: Array de páginas para el paginador
  paginasArray = computed(() => {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
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
      const [orders, provs, prods] = await Promise.all([
        this.purchasingService.getOrders(),
        this.purchasingService.getProviders(),
        this.inventoryService.getInventory(true)
      ]);
      this.purchaseOrders.set(orders);
      this.providers.set(provs);
      this.products.set(prods);
    } catch (e) {
      console.error('Error loading data', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  openNewOrderModal() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.newOrder.set({
      numero_pedido: '',
      id_proveedor: 0,
      fecha_pedido: new Date().toISOString().split('T')[0],
      estado: 'borrador',
      total: 0,
      observaciones: '',
      detalles: []
    });
    this.addItem(); // Add one empty item by default
    this.showModal.set(true);
  }

  async editOrder(order: PurchaseOrder) {
    this.isLoading.set(true);
    try {
      // Fetch full details including items
      const fullOrder = await this.purchasingService.getOrderById(order.id_pedido);

      this.isEditing.set(true);
      this.editingId.set(order.id_pedido);

      this.newOrder.set({
        numero_pedido: fullOrder.numero_pedido,
        id_proveedor: fullOrder.id_proveedor,
        fecha_pedido: fullOrder.fecha_pedido.split(' ')[0], // Ensure YYYY-MM-DD
        estado: fullOrder.estado,
        total: fullOrder.total,
        observaciones: fullOrder.observaciones || '',
        detalles: fullOrder.detalles.map(d => ({
          id_producto: d.id_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal: d.subtotal
        }))
      });

      this.showModal.set(true);
    } catch (e) {
      console.error('Error loading order for edit', e);
      this.toastService.showError('Error al cargar el pedido para editar');
    } finally {
      this.isLoading.set(false);
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.isEditing.set(false);
    this.editingId.set(null);
  }

  // Form Logic
  addItem() {
    const current = this.newOrder();
    const newItem: PurchaseOrderDetail = {
      id_producto: 0,
      cantidad: 1,
      precio_unitario: 0,
      subtotal: 0
    };
    this.newOrder.set({ ...current, detalles: [...current.detalles, newItem] });
  }

  removeItem(index: number) {
    const current = this.newOrder();
    const newDetails = [...current.detalles];
    newDetails.splice(index, 1);
    this.newOrder.set({ ...current, detalles: newDetails });
    this.calculateTotal();
  }

  updateItemProduct(index: number, productId: number) {
    const current = this.newOrder();
    const details = [...current.detalles];
    const product = this.products().find(p => p.id_producto == productId);

    if (product) {
      details[index].id_producto = productId;
      // Opcional: Pre-llenar precio si existiera en producto
      // details[index].precio_unitario = product.precio_compra || 0; 
      this.newOrder.set({ ...current, detalles: details });
    }
  }

  calculateItemSubtotal(index: number) {
    const current = this.newOrder();
    const details = [...current.detalles];
    const item = details[index];
    item.subtotal = item.cantidad * item.precio_unitario;
    this.newOrder.set({ ...current, detalles: details });
    this.calculateTotal();
  }

  calculateTotal() {
    const current = this.newOrder();
    const total = current.detalles.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    this.newOrder.set({ ...current, total });
  }

  async saveOrder() {
    if (this.isSaving()) return;

    // Validations
    const order = this.newOrder();
    if (!order.id_proveedor) {
      this.toastService.showWarning('Seleccione un proveedor');
      return;
    }
    if (!order.fecha_pedido) {
      this.toastService.showWarning('Ingrese la fecha del pedido');
      return;
    }
    if (order.detalles.length === 0) {
      this.toastService.showWarning('Agregue al menos un producto');
      return;
    }

    // Validar cada línea de detalle con mensaje específico
    for (let i = 0; i < order.detalles.length; i++) {
      const d = order.detalles[i];
      if (!d.id_producto || d.id_producto === 0) {
        this.toastService.showWarning(`Seleccione un producto en la línea ${i + 1}`);
        return;
      }
      if (!d.cantidad || d.cantidad <= 0) {
        this.toastService.showWarning(`La cantidad debe ser mayor a 0 en la línea ${i + 1}`);
        return;
      }
      if (!d.precio_unitario || d.precio_unitario <= 0) {
        this.toastService.showWarning(`El precio debe ser mayor a 0 en la línea ${i + 1}`);
        return;
      }
    }

    console.log('🔵 [PURCHASING] Iniciando saveOrder...');
    console.log('🔵 [PURCHASING] Datos del pedido antes de procesar:', JSON.stringify(order, null, 2));

    this.isSaving.set(true);
    try {
      // Obtener usuario actual
      const currentUser = this.authService.currentUser();
      console.log('🔵 [PURCHASING] Usuario actual:', currentUser);

      if (!currentUser || !currentUser.id_usuario) {
        console.error('❌ [PURCHASING] No se pudo identificar el usuario actual');
        this.toastService.showError('Error: No se pudo identificar el usuario actual. Por favor, inicie sesión nuevamente.');
        this.isSaving.set(false);
        return;
      }

      // Agregar id_solicitante al pedido
      const orderToSave = {
        ...order,
        id_solicitante: currentUser.id_usuario,
        id_ot: order.id_ot || null // Permitir NULL si no hay orden de trabajo
      };
      console.log('🔵 [PURCHASING] Pedido con id_solicitante e id_ot:', JSON.stringify(orderToSave, null, 2));

      if (this.isEditing()) {
        const id = this.editingId();
        if (id) {
          console.log('🔵 [PURCHASING] Actualizando pedido ID:', id);
          await this.purchasingService.updateOrder(id, orderToSave);
          console.log('✅ [PURCHASING] Pedido actualizado exitosamente');
          this.toastService.showSuccess('Pedido actualizado correctamente');
        }
      } else {
        console.log('🔵 [PURCHASING] Creando nuevo pedido...');
        const result = await this.purchasingService.createOrder(orderToSave);
        console.log('✅ [PURCHASING] Pedido creado exitosamente. Resultado:', result);
        this.toastService.showSuccess('Pedido creado correctamente');
      }
      await this.loadData(); // Reload orders and inventory (stock updated)
      this.closeModal();
    } catch (e: any) {
      console.error('❌ [PURCHASING] Error saving order:', e);
      console.error('❌ [PURCHASING] Error completo:', JSON.stringify(e, null, 2));
      console.error('❌ [PURCHASING] Error.error:', e?.error);
      console.error('❌ [PURCHASING] Error.message:', e?.message);
      const mensaje = e?.error?.message || e?.message || JSON.stringify(e) || 'Error desconocido';
      this.toastService.showError('Error al guardar el pedido: ' + mensaje);
    } finally {
      this.isSaving.set(false);
    }
  }

  async viewDetail(order: PurchaseOrder) {
    this.selectedOrder.set(null); // Limpiar estado anterior
    try {
      const fullOrder = await this.purchasingService.getOrderById(order.id_pedido);
      this.selectedOrder.set(fullOrder);
      this.showDetailModal.set(true);
    } catch (e) {
      console.error('Error loading detail', e);
    }
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedOrder.set(null);
  }

  async deleteOrder(order: PurchaseOrder) {
    this.orderToDelete.set(order);
    this.showDeleteModal.set(true);
  }

  async confirmDelete() {
    const order = this.orderToDelete();
    if (!order) return;

    try {
      await this.purchasingService.deleteOrder(order.id_pedido);
      this.toastService.showSuccess('Pedido eliminado correctamente');
      this.loadData();
      this.closeDeleteModal();
    } catch (e) {
      console.error('Error deleting order', e);
      this.toastService.showError('Error al eliminar el pedido');
    }
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.orderToDelete.set(null);
  }

  async updateStatus(order: PurchaseOrder) {
    try {
      await this.purchasingService.updateOrderStatus(order.id_pedido, order.estado);
      this.toastService.showInfo(`Estado de ${order.numero_pedido} actualizado a ${this.formatStatus(order.estado)}`);
      // No reload needed as the model is already updated, but maybe good to sync
      // await this.loadData(); 
    } catch (e) {
      console.error('Error updating status', e);
      this.toastService.showError('Error al actualizar el estado');
      this.loadData(); // Revert on error
    }
  }

  exportToCsv(): void {
    const dataToExport = this.purchaseOrders().map(order => ({
      ID_Pedido: order.numero_pedido,
      Proveedor: order.proveedor_nombre || '',
      Fecha: order.fecha_pedido.slice(0, 10),
      Total: order.total,
      Estado: this.formatStatus(order.estado)
    }));
    this.csvExportService.exportToCsv('ordenes_de_compra.csv', dataToExport);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'recibido':
      case 'confirmado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'enviado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
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
