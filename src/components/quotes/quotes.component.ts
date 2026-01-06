import { Component, ChangeDetectionStrategy, signal, inject, effect, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../services/database.service';
import { CsvExportService } from '../../services/csv-export.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { QuoteCreateComponent } from './quote-create.component';
import { environment } from '../../environments/environment';

export interface Quote {
  id_cotizacion: number;
  numero_cotizacion: string;
  cliente: string;
  fecha_cotizacion: string;
  total: number;
  estado: 'aprobada' | 'enviada' | 'rechazada';
}

@Component({
  selector: 'app-quotes',
  templateUrl: './quotes.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, QuoteCreateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotesComponent implements OnInit {
  dbService = inject(DatabaseService);
  csvExportService = inject(CsvExportService);
  toastService = inject(ToastService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private routerSub: Subscription | null = null;

  // Verificar si el usuario es admin
  isAdmin = computed(() => this.authService.currentUser()?.rol === 'admin');

  // Hacer Math disponible en el template
  Math = Math;

  quotes = signal<Quote[]>([]);
  isLoading = signal<boolean>(true);
  mostrarModalCrear = signal(false);
  mostrarModalNuevoCliente = signal(false);
  guardandoCliente = signal(false);
  mostrarModalDetalle = signal(false);
  cotizacionDetalle = signal<any>(null);
  cargandoDetalle = signal(false);
  idCotizacionEditar = signal<number | null>(null);
  mostrarModalEditar = signal(false);
  showDeleteModal = signal(false);
  quoteToDelete = signal<Quote | null>(null);

  // Filtros
  busqueda = signal<string>('');
  filtroEstado = signal<string>('todos');

  // Paginación
  paginaActual = signal<number>(1);
  itemsPorPagina = signal<number>(10);

  // Computed para quotes filtrados
  quotesFiltrados = computed(() => {
    const quotes = this.quotes();
    const textoBusqueda = this.busqueda().toLowerCase().trim();
    const estado = this.filtroEstado();

    return quotes.filter(quote => {
      // Filtro de búsqueda
      const cumpleBusqueda = !textoBusqueda ||
        (quote.numero_cotizacion || '').toLowerCase().includes(textoBusqueda) ||
        (quote.cliente || '').toLowerCase().includes(textoBusqueda);

      // Filtro de estado
      const cumpleEstado = estado === 'todos' || quote.estado === estado;

      return cumpleBusqueda && cumpleEstado;
    });
  });

  // Computed para datos paginados
  quotesPaginados = computed(() => {
    const quotes = this.quotesFiltrados();
    const pagina = this.paginaActual();
    const porPagina = this.itemsPorPagina();
    const inicio = (pagina - 1) * porPagina;
    const fin = inicio + porPagina;
    return quotes.slice(inicio, fin);
  });

  totalPaginas = computed(() => {
    return Math.ceil(this.quotesFiltrados().length / this.itemsPorPagina());
  });

  paginasArray = computed(() => {
    const total = this.totalPaginas();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  nuevoCliente = {
    ruc_cedula: '',
    nombre_razon_social: '',
    direccion: '',
    telefono: '',
    email: '',
    contacto_principal: '',
    contactos_adicionales: []
  };


  constructor() {
    effect(() => {
      if (this.dbService.connected()) {
        this.loadQuotes();
      } else {
        this.quotes.set([]);
      }
    });
  }

  ngOnInit() {
    // Manejar queryParams para abrir modales automáticamente
    this.route.queryParams.subscribe(params => {
      console.log('🔵 [QUOTES] QueryParams recibidos:', params);

      if (params['action'] === 'create') {
        console.log('🔵 [QUOTES] Abriendo modal de creación');
        this.abrirModalCrear();
        // Limpiar queryParams
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      } else if (params['action'] === 'view' && params['id']) {
        console.log('🔵 [QUOTES] Abriendo modal de detalle para ID:', params['id']);
        const id = parseInt(params['id'], 10);
        this.verDetalleCotizacion(id);
        // Limpiar queryParams
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      } else if (params['action'] === 'edit' && params['id']) {
        console.log('🔵 [QUOTES] Abriendo modal de edición para ID:', params['id']);
        const id = parseInt(params['id'], 10);
        this.editarCotizacion(id);
        // Limpiar queryParams
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });

    // Recargar cotizaciones al volver a la ruta /quotes (por ejemplo si se revirtió el estado desde otra pantalla)
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        try {
          const url = event.urlAfterRedirects || (event as any).url || '';
          if (url.startsWith('/quotes') || url === '/quotes') {
            this.loadQuotes();
          }
        } catch (e) { /* ignore */ }
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
      this.routerSub = null;
    }
  }

  async loadQuotes(): Promise<void> {
    this.isLoading.set(true);
    const query = `
      SELECT q.id_cotizacion, q.numero_cotizacion, c.nombre_razon_social as cliente, q.fecha_cotizacion, q.total, q.estado
      FROM cotizaciones q
      JOIN clientes c ON q.id_cliente = c.id_cliente
    `;
    try {
      const data = await this.dbService.query(query);
      this.quotes.set(data);
    } catch (e) {
      console.error("Error loading quotes:", e);
      this.quotes.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  exportToCsv(): void {
    const dataToExport = this.quotes().map(q => ({
      ID_Cotizacion: q.numero_cotizacion,
      Cliente: q.cliente,
      Fecha: q.fecha_cotizacion,
      Total: q.total,
      Estado: this.formatStatus(q.estado)
    }));
    this.csvExportService.exportToCsv('cotizaciones.csv', dataToExport);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'aprobada': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'enviada': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'rechazada': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  abrirModalCrear() {
    this.mostrarModalCrear.set(true);
  }

  cerrarModalCrear() {
    this.mostrarModalCrear.set(false);
    this.loadQuotes(); // Recargar lista después de crear
  }

  abrirModalNuevoCliente() {
    this.mostrarModalNuevoCliente.set(true);
  }

  cerrarModalNuevoCliente() {
    this.mostrarModalNuevoCliente.set(false);
    this.nuevoCliente = {
      ruc_cedula: '',
      nombre_razon_social: '',
      direccion: '',
      telefono: '',
      email: '',
      contacto_principal: '',
      contactos_adicionales: []
    };

  }

  formularioClienteValido(): boolean {
    return !!(
      this.nuevoCliente.ruc_cedula.trim() &&
      this.nuevoCliente.nombre_razon_social.trim() &&
      this.nuevoCliente.direccion.trim() &&
      this.nuevoCliente.telefono.trim() &&
      this.nuevoCliente.email.trim() &&
      this.nuevoCliente.contacto_principal.trim()
    );
  }

  async guardarNuevoCliente() {
    if (!this.formularioClienteValido()) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    this.guardandoCliente.set(true);

    try {
      const response = await fetch(`${environment.apiUrl}/clientes.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.nuevoCliente)
      });

      const result = await response.json();

      if (result.success) {
        this.toastService.showSuccess('Cliente creado exitosamente');
        this.cerrarModalNuevoCliente();
      } else {
        this.toastService.showError('Error: ' + (result.message || 'No se pudo crear el cliente'));
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      this.toastService.showError('Error al conectar con el servidor');
    } finally {
      this.guardandoCliente.set(false);
    }
  }

  async cambiarEstado(quote: Quote, nuevoEstado: string) {
    const estadoAnterior = quote.estado;

    // Si el usuario intenta aprobar, no cambiamos inmediatamente la cotización.
    // En su lugar abrimos el flujo de creación de OT y solo se marcará como
    // 'aprobada' si la OT se crea con éxito.
    if (nuevoEstado === 'aprobada') {
      console.log('🔵 [QUOTES] Intento de aprobar cotización. Abriendo creación de OT...');
      // Navegar a work-orders con la cotización preseleccionada
      this.router.navigate(['/work-orders'], {
        queryParams: {
          action: 'create',
          id_cotizacion: quote.id_cotizacion,
          numero_cotizacion: quote.numero_cotizacion
        }
      });
      // No actualizar UI ni backend aquí; la UI seguirá mostrando el estado previo.
      return;
    }

    // Para otros estados, aplicamos el cambio normalmente.
    try {
      const response = await fetch(`${environment.apiUrl}/cotizaciones.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cotizacion: quote.id_cotizacion,
          estado: nuevoEstado
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Estado actualizado:', quote.numero_cotizacion, '→', nuevoEstado);
        this.toastService.showSuccess(`Estado de ${quote.numero_cotizacion} actualizado a ${this.formatStatus(nuevoEstado)}`);
        // Actualizar el objeto en memoria para que la UI refleje el cambio
        quote.estado = nuevoEstado as any;
      } else {
        this.toastService.showError('Error al actualizar estado: ' + (result.message || 'Error desconocido'));
        await this.loadQuotes();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      this.toastService.showError('Error al conectar con el servidor');
      await this.loadQuotes();
    }
  }

  async verDetalleCotizacion(id_cotizacion: number) {
    this.cargandoDetalle.set(true);
    this.mostrarModalDetalle.set(true);

    try {
      const response = await fetch(`${environment.apiUrl}/cotizaciones.php?action=detalle&id=${id_cotizacion}`);
      const result = await response.json();

      if (result.success) {
        this.cotizacionDetalle.set(result.data);
      } else {
        this.toastService.showError('Error al cargar detalle: ' + result.message);
        this.cerrarModalDetalle();
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      this.toastService.showError('Error al conectar con el servidor');
      this.cerrarModalDetalle();
    } finally {
      this.cargandoDetalle.set(false);
    }
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle.set(false);
    this.cotizacionDetalle.set(null);
  }

  editarCotizacion(id_cotizacion: number) {
    this.idCotizacionEditar.set(id_cotizacion);
    this.mostrarModalEditar.set(true);
  }

  cerrarModalEditar() {
    this.mostrarModalEditar.set(false);
    this.idCotizacionEditar.set(null);
    this.loadQuotes();
  }

  // Método para eliminar cotización (abre modal de confirmación)
  async eliminarCotizacion(quote: Quote) {
    this.quoteToDelete.set(quote);
    this.showDeleteModal.set(true);
  }

  // Confirma la eliminación de la cotización
  async confirmDelete() {
    const quote = this.quoteToDelete();
    if (!quote) return;

    try {
      const response = await fetch(`${environment.apiUrl}/cotizaciones.php?id=${quote.id_cotizacion}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        this.toastService.showSuccess(`Cotización ${quote.numero_cotizacion} eliminada correctamente`);
        await this.loadQuotes();
        this.closeDeleteModal();
      } else {
        this.toastService.showError('Error al eliminar: ' + (result.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error al eliminar cotización:', error);
      this.toastService.showError('Error al conectar con el servidor');
    }
  }

  // Cierra el modal de eliminación
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.quoteToDelete.set(null);
  }

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
    this.paginaActual.set(1); // Volver a la primera página al cambiar items por página
  }

  // Métodos de filtros
  cambiarBusqueda(texto: string) {
    this.busqueda.set(texto);
    this.paginaActual.set(1); // Volver a la primera página al buscar
  }

  cambiarFiltroEstado(estado: string) {
    this.filtroEstado.set(estado);
    this.paginaActual.set(1); // Volver a la primera página al cambiar filtro
  }
}

