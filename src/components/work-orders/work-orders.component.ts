/**
 * @fileoverview Componente de Órdenes de Trabajo
 * Gestiona la visualización, filtrado y creación de órdenes de trabajo
 * @author Sergeva OS
 * @version 2.0.0
 */

import { Component, ChangeDetectionStrategy, signal, inject, effect, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { CsvExportService } from '../../services/csv-export.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { AuthorizationService } from '../../services/authorization.service';
import { EditAuthorizationHelper } from '../../helpers/edit-authorization.helper';
import { WorkOrderCreateComponent } from './work-order-create.component';
import { WorkOrderDetailComponent } from './work-order-detail.component';
import {
  WorkOrderService,
  Cliente,
  Supervisor,
  CreateWorkOrderDTO,
  WorkOrder,
  UpdateWorkOrderPartialDTO
} from '../../services/work-order.service';

@Component({
  selector: 'app-work-orders',
  templateUrl: './work-orders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, WorkOrderCreateComponent, WorkOrderDetailComponent],
})
export class WorkOrdersComponent {
  // ============================================
  // INYECCIÓN DE SERVICIOS
  // ============================================

  dbService = inject(DatabaseService);
  csvExportService = inject(CsvExportService);
  workOrderService = inject(WorkOrderService);
  toastService = inject(ToastService);
  private authService = inject(AuthService);
  cd = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authorizationService = inject(AuthorizationService);
  private editHelper = new EditAuthorizationHelper(this.authorizationService);

  // Verificar si el usuario es admin
  isAdmin = computed(() => this.authService.currentUser()?.rol === 'admin');

  // ============================================
  // SIGNALS DE ESTADO PRINCIPAL
  // ============================================

  /** Lista de órdenes de trabajo */
  workOrders = signal<WorkOrder[]>([]);

  /** Indicador de carga */
  isLoading = signal<boolean>(false);

  /** Mensaje de error */
  error = signal<string | null>(null);

  // ============================================
  // SIGNALS DE FILTROS
  // ============================================

  /** Filtro por estado */
  filtroEstado = signal<string>('todos');

  /** Filtro por prioridad */
  filtroPrioridad = signal<string>('todos');

  /** Texto de búsqueda */
  busqueda = signal<string>('');

  // ============================================
  // SIGNALS DE PAGINACIÓN
  // ============================================

  paginaActual = signal<number>(1);
  itemsPorPagina = signal<number>(10);
  Math = Math; // Para usar en el template

  // ============================================
  // SIGNALS PARA MODAL DE NUEVA ORDEN
  // ============================================

  /** Controla visibilidad del modal */
  showNewOrderModal = signal<boolean>(false);

  /** Orden a editar (null si es creación) */
  selectedWorkOrder = signal<WorkOrder | null>(null);

  // ============================================
  // SIGNALS PARA MODAL DE ELIMINACIÓN
  // ============================================

  /** Controla visibilidad del modal de eliminación */
  showDeleteModal = signal<boolean>(false);

  /** Orden a eliminar */
  orderToDelete = signal<WorkOrder | null>(null);

  /** Cotización pre-seleccionada cuando viene de quotes */
  preselectedQuoteId = signal<number | null>(null);

  /** Indica si el usuario llegó desde la pantalla de cotizaciones */
  cameFromQuotes = signal<boolean>(false);

  // Modal de vista rápida de Cotización
  showQuoteModal = signal<boolean>(false);
  quoteDetail = signal<any | null>(null);
  loadingQuote = signal<boolean>(false);

  // Modal de vista rápida de Proyecto
  showProjectModal = signal<boolean>(false);
  projectDetail = signal<any | null>(null);
  loadingProject = signal<boolean>(false);

  // ============================================
  // SIGNALS PARA MODAL DE DETALLE
  // ============================================

  /** Controla visibilidad del modal de detalle */
  showDetailModal = signal<boolean>(false);

  /** Orden a visualizar */
  selectedOrderForView = signal<WorkOrder | null>(null);

  // ============================================
  // COMPUTED: Órdenes filtradas
  // ============================================

  /**
   * Filtra las órdenes según los criterios seleccionados
   * Se recalcula automáticamente cuando cambian los signals
   */
  ordenesFiltradas = computed(() => {
    // Obtener valores actuales de los signals
    const ordenes = this.workOrders();
    const estado = this.filtroEstado();
    const prioridad = this.filtroPrioridad();
    const textoBusqueda = this.busqueda().toLowerCase().trim();

    // Aplicar filtros
    return ordenes.filter(orden => {
      // Filtro de Estado
      const cumpleEstado = estado === 'todos' || orden.estado === estado;

      // Filtro de Prioridad
      const cumplePrioridad = prioridad === 'todos' || orden.prioridad === prioridad;

      // Filtro de Búsqueda (protegido contra nulos)
      const cumpleBusqueda = !textoBusqueda ||
        (orden.numero_ot || '').toLowerCase().includes(textoBusqueda) ||
        (orden.cliente || '').toLowerCase().includes(textoBusqueda) ||
        (orden.descripcion_trabajo || '').toLowerCase().includes(textoBusqueda) ||
        (orden.supervisor || '').toLowerCase().includes(textoBusqueda) ||
        (orden.ubicacion_trabajo || '').toLowerCase().includes(textoBusqueda);

      return cumpleEstado && cumplePrioridad && cumpleBusqueda;
    });
  });

  /**
   * Obtiene las órdenes para la página actual
   */
  ordenesPaginadas = computed(() => {
    const ordenes = this.ordenesFiltradas();
    const pagina = this.paginaActual();
    const porPagina = this.itemsPorPagina();
    const inicio = (pagina - 1) * porPagina;
    const fin = inicio + porPagina;
    return ordenes.slice(inicio, fin);
  });

  /**
   * Calcula el número total de páginas
   */
  totalPaginas = computed(() => {
    return Math.ceil(this.ordenesFiltradas().length / this.itemsPorPagina());
  });

  /**
   * Genera un array con los números de página
   */
  paginasArray = computed(() => {
    const total = this.totalPaginas();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  // ============================================
  // CONSTRUCTOR
  // ============================================

  constructor() {
    // Cargar órdenes cuando la conexión esté lista
    effect(() => {
      if (this.dbService.connected()) {
        this.loadWorkOrders();
      }
    }, { allowSignalWrites: true });

    // Detectar queryParams para abrir modal de creación con cotización pre-seleccionada
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create' && params['id_cotizacion']) {
        const idCotizacion = Number(params['id_cotizacion']);
        const numeroCotizacion = params['numero_cotizacion'] || '';
        console.log('🔵 Abriendo modal de creación con cotización pre-seleccionada:', idCotizacion, numeroCotizacion);
        this.cameFromQuotes.set(true);
        this.openNewOrderModalWithQuote(idCotizacion, numeroCotizacion);
        // Limpiar queryParams después de abrir el modal
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          queryParamsHandling: 'merge'
        });
      }
    });
  }

  // ============================================
  // MÉTODOS DE CARGA DE DATOS
  // ============================================

  /**
   * Carga todas las órdenes de trabajo desde el servidor
   */
  async loadWorkOrders(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Usar el servicio dedicado de órdenes de trabajo
      const data = await this.workOrderService.getWorkOrders();

      // Mapear datos para compatibilidad
      const mappedData = data.map((order: any) => ({
        ...order,
        total_ot: order.total_ot !== undefined && order.total_ot !== null ? Number(order.total_ot) : 0,
        cliente: order.cliente_nombre || order.cliente || 'Sin Cliente',
        supervisor: order.supervisor_nombre || order.supervisor || 'Sin Asignar'
      }));

      this.workOrders.set(mappedData);
      console.log('✅ Órdenes de trabajo cargadas:', mappedData.length);
      console.log('🔍 [DEBUG] Primera orden:', mappedData[0]);

    } catch (error: any) {
      console.error("❌ Error loading work orders:", error);
      this.error.set(error.message || 'Error al cargar órdenes de trabajo');
      this.workOrders.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ============================================
  // MÉTODOS DE ACCIÓN
  // ============================================

  /**
   * Abre el modal para crear una nueva orden
   */
  openNewOrderModal() {
    this.selectedWorkOrder.set(null);
    this.preselectedQuoteId.set(null);
    this.showNewOrderModal.set(true);
  }

  /**
   * Abre el modal de nueva orden con una cotización pre-seleccionada
   * @param quoteId ID de la cotización a pre-seleccionar
   * @param quoteNumber Número de cotización (para logging)
   */
  openNewOrderModalWithQuote(quoteId: number, quoteNumber?: string) {
    console.log('🔵 [WORK-ORDERS] Abriendo modal con cotización pre-seleccionada:', quoteId, quoteNumber);
    this.selectedWorkOrder.set(null);
    this.preselectedQuoteId.set(quoteId);
    this.showNewOrderModal.set(true);
  }

  /**
   * Abre modal rápido con detalle de cotización (sin redirigir)
   */
  async openQuoteModal(id_cotizacion: number | null) {
    if (!id_cotizacion) return;
    this.loadingQuote.set(true);
    this.showQuoteModal.set(true);
    this.quoteDetail.set(null);
    try {
      const data = await this.workOrderService.getQuoteById(Number(id_cotizacion));
      this.quoteDetail.set(data);
    } catch (error) {
      console.error('Error al cargar cotización:', error);
      this.toastService.showError('No se pudo cargar la cotización');
      this.closeQuoteModal();
    } finally {
      this.loadingQuote.set(false);
    }
  }

  closeQuoteModal() {
    this.showQuoteModal.set(false);
    this.quoteDetail.set(null);
    this.loadingQuote.set(false);
  }

  /**
   * Abre modal rápido con detalle de proyecto (sin redirigir)
   */
  async openProjectModal(id_proyecto: number | null) {
    if (!id_proyecto) return;
    this.loadingProject.set(true);
    this.showProjectModal.set(true);
    this.projectDetail.set(null);
    try {
      const data = await this.workOrderService.getProjectById(Number(id_proyecto));
      this.projectDetail.set(data);
    } catch (error) {
      console.error('Error al cargar proyecto:', error);
      this.toastService.showError('No se pudo cargar el proyecto');
      this.closeProjectModal();
    } finally {
      this.loadingProject.set(false);
    }
  }

  closeProjectModal() {
    this.showProjectModal.set(false);
    this.projectDetail.set(null);
    this.loadingProject.set(false);
  }

  /**
   * Abre el modal para visualizar detalles de una orden
   */
  viewOrder(order: WorkOrder) {
    this.selectedOrderForView.set(order);
    this.showDetailModal.set(true);
  }

  /**
   * Cierra el modal de detalle
   */
  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedOrderForView.set(null);
  }

  /**
   * Maneja la acción de editar desde el modal de detalle
   */
  handleEditFromDetail(order: WorkOrder) {
    this.closeDetailModal();
    this.editOrder(order);
  }

  /**
   * Abre el modal para editar una orden existente
   */
  editOrder(order: WorkOrder) {
    this.editHelper.handleEditClick('ordenes_trabajo', order.id_ot, () => {
      this.selectedWorkOrder.set(order);
      this.showNewOrderModal.set(true);
    });
  }

  /**
   * Cierra el modal de creación/edición
   */
  closeNewOrderModal(reload: boolean = false) {
    this.showNewOrderModal.set(false);
    this.selectedWorkOrder.set(null);
    this.preselectedQuoteId.set(null); // Limpiar cotización pre-seleccionada

    if (this.cameFromQuotes()) {
      this.cameFromQuotes.set(false);
      this.router.navigate(['/quotes']);
      return;
    }

    if (reload) {
      this.loadWorkOrders();
    }
  }

  /**
   * Elimina una orden de trabajo (abre modal de confirmación)
   */
  deleteOrder(order: WorkOrder) {
    this.orderToDelete.set(order);
    this.showDeleteModal.set(true);
  }

  /**
   * Confirma la eliminación de la orden
   */
  async confirmDelete() {
    const order = this.orderToDelete();
    if (!order) return;

    try {
      await this.workOrderService.deleteWorkOrder(order.id_ot);
      this.toastService.showSuccess('Orden de trabajo eliminada correctamente');
      await this.loadWorkOrders();
      this.closeDeleteModal();
    } catch (error) {
      console.error('Error eliminando orden:', error);
      this.toastService.showError('Error al eliminar la orden de trabajo');
    }
  }

  /**
   * Cierra el modal de eliminación
   */
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.orderToDelete.set(null);
  }

  /**
   * Recarga la lista de órdenes
   */
  recargar() {
    this.loadWorkOrders();
  }

  // ============================================
  // MÉTODOS DE EXPORTACIÓN
  // ============================================

  /**
   * Exporta las órdenes filtradas a CSV
   */
  exportToCsv(): void {
    const dataToExport = this.ordenesFiltradas().map(order => ({
      'N° Orden': order.numero_ot,
      'Cliente': order.cliente,
      'Representante': order.representante || 'N/A',
      'Factura': order.factura || 'N/A',
      'Descripción': order.descripcion_trabajo,
      'Supervisor': order.supervisor,
      'Fecha Inicio': this.formatearFecha(order.fecha_inicio),
      'Fecha Fin': this.formatearFecha(order.fecha_fin_estimada),
      'Estado': this.formatStatus(order.estado),
      'Prioridad': order.prioridad ? this.formatPriority(order.prioridad) : 'N/A',
      'Factura Estado': order.estado_factura ? this.formatInvoiceStatus(order.estado_factura) : 'N/A',
      'Ubicación': order.ubicacion_trabajo || 'N/A'
    }));

    this.csvExportService.exportToCsv('ordenes_de_trabajo.csv', dataToExport);
  }

  // ============================================
  // HELPERS DE FORMATO
  // ============================================

  /**
   * Retorna las clases CSS según el estado
   */
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'completada': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'en_proceso': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'cancelada': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'pausada': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Retorna las clases CSS según la prioridad
   */
  getPriorityClass(priority?: string): string {
    if (!priority) return 'bg-gray-100 text-gray-800';
    const classes: Record<string, string> = {
      'baja': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'media': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'alta': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'urgente': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Retorna las clases CSS según el estado de la factura
   */
  getInvoiceStatusClass(status?: string): string {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    const classes: Record<string, string> = {
      'pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'pagada': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'anulada': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Formatea el estado para mostrar
   */
  formatStatus(status: string): string {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Formatea la prioridad para mostrar
   */
  formatPriority(priority: string): string {
    return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'N/A';
  }

  /**
   * Formatea el estado de la factura para mostrar
   */
  formatInvoiceStatus(status?: string): string {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString('es-EC', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch { return fecha; }
  }

  // ============================================
  // MÉTODOS DE FILTROS
  // ============================================

  /** Cambia el filtro de estado */
  cambiarFiltroEstado(estado: string): void {
    this.filtroEstado.set(estado);
    this.paginaActual.set(1);
  }

  /** Cambia el filtro de prioridad */
  cambiarFiltroPrioridad(prioridad: string): void {
    this.filtroPrioridad.set(prioridad);
    this.paginaActual.set(1);
  }

  /** Cambia el texto de búsqueda */
  cambiarBusqueda(texto: string): void {
    this.busqueda.set(texto);
    this.paginaActual.set(1);
  }

  /** Limpia todos los filtros */
  limpiarFiltros(): void {
    this.filtroEstado.set('todos');
    this.filtroPrioridad.set('todos');
    this.busqueda.set('');
    this.paginaActual.set(1);
  }

  // ============================================
  // MÉTODOS PARA ACTUALIZACIÓN INLINE
  // ============================================

  /**
   * Actualiza el estado de una orden de trabajo
   * @param orden Orden a actualizar
   */
  async updateEstado(orden: WorkOrder) {
    this.editHelper.handleEditClick('ordenes_trabajo', orden.id_ot, async () => {
      try {
        console.log('🔵 [WORK-ORDERS] Actualizando estado:', orden.id_ot, orden.estado);
        await this.workOrderService.updateWorkOrderPartial(orden.id_ot, { estado: orden.estado });
        console.log('✅ [WORK-ORDERS] Estado actualizado correctamente');
        this.toastService.showInfo(`Estado de ${orden.numero_ot} actualizado a ${this.formatStatus(orden.estado)}`);
      } catch (e) {
        console.error('❌ [WORK-ORDERS] Error actualizando estado:', e);
        this.toastService.showError('Error al actualizar el estado');
        this.loadWorkOrders(); // Recargar para revertir el cambio en UI
      }
    });
  }

  /**
   * Actualiza la prioridad de una orden de trabajo
   * @param orden Orden a actualizar
   */
  async updatePrioridad(orden: WorkOrder) {
    this.editHelper.handleEditClick('ordenes_trabajo', orden.id_ot, async () => {
      try {
        console.log('🔵 [WORK-ORDERS] Actualizando prioridad:', orden.id_ot, orden.prioridad);
        await this.workOrderService.updateWorkOrderPartial(orden.id_ot, { prioridad: orden.prioridad });
        console.log('✅ [WORK-ORDERS] Prioridad actualizada correctamente');
        this.toastService.showInfo(`Prioridad de ${orden.numero_ot} actualizada a ${this.formatPriority(orden.prioridad || '')}`);
      } catch (e) {
        console.error('❌ [WORK-ORDERS] Error actualizando prioridad:', e);
        this.toastService.showError('Error al actualizar la prioridad');
        this.loadWorkOrders(); // Recargar para revertir el cambio en UI
      }
    });
  }

  /**
   * Actualiza el estado de la factura de una orden de trabajo
   * @param orden Orden a actualizar
   */
  async updateEstadoFactura(orden: WorkOrder) {
    this.editHelper.handleEditClick('ordenes_trabajo', orden.id_ot, async () => {
      try {
        console.log('🔵 [WORK-ORDERS] Actualizando estado factura:', orden.id_ot, orden.estado_factura);
        await this.workOrderService.updateWorkOrderPartial(orden.id_ot, { estado_factura: orden.estado_factura });
        console.log('✅ [WORK-ORDERS] Estado factura actualizado correctamente');
        this.toastService.showInfo(`Estado factura de ${orden.numero_ot} actualizado a ${this.formatInvoiceStatus(orden.estado_factura)}`);
      } catch (e) {
        console.error('❌ [WORK-ORDERS] Error actualizando estado factura:', e);
        this.toastService.showError('Error al actualizar el estado de la factura');
        this.loadWorkOrders(); // Recargar para revertir el cambio en UI
      }
    });
  }

  // ============================================
  // MÉTODOS DE PAGINACIÓN
  // ============================================

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  paginaAnterior() {
    const actual = this.paginaActual();
    if (actual > 1) {
      this.paginaActual.set(actual - 1);
    }
  }

  paginaSiguiente() {
    const actual = this.paginaActual();
    const total = this.totalPaginas();
    if (actual < total) {
      this.paginaActual.set(actual + 1);
    }
  }

  cambiarItemsPorPagina(nuevoValor: number) {
    this.itemsPorPagina.set(nuevoValor);
    this.paginaActual.set(1);
  }


}
