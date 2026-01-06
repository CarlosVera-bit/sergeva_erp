import { Component, ChangeDetectionStrategy, signal, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { CsvExportService } from '../../services/csv-export.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../environments/environment';
import { ConfirmDeleteModalComponent } from '../shared/confirm-delete-modal.component';

export interface Client {
  id_cliente: number;
  ruc_cedula: string;
  nombre_razon_social: string;
  contacto_principal: string;
  email: string;
  direccion?: string;
  telefono?: string;
  documentCount: number; // This will be simulated
  contactos_adicionales?: any[];
}

@Component({
  selector: 'app-client-files',
  templateUrl: './client-files.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDeleteModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFilesComponent {
  dbService = inject(DatabaseService);
  csvExportService = inject(CsvExportService);
  toastService = inject(ToastService);
  private authService = inject(AuthService);

  // Verificar si el usuario es admin
  isAdmin = computed(() => this.authService.currentUser()?.rol === 'admin');

  // Hacer Math disponible en el template
  Math = Math;

  clients = signal<Client[]>([]);
  isLoading = signal<boolean>(true);
  mostrarModalNuevoCliente = signal(false);
  guardandoCliente = signal(false);
  mostrarModalDetalle = signal(false);
  clienteDetalle = signal<Client | null>(null);
  documentosCliente = signal<any[]>([]);
  cargandoDocumentos = signal(false);
  mostrarDocumentos = signal(false);
  mostrarModalEditar = signal(false);
  clienteEditar = signal<Client | null>(null);
  showDeleteModal = signal(false);
  clientToDelete = signal<Client | null>(null);

  // Contactos
  contactosCliente = signal<any[]>([]);
  cargandoContactos = signal(false);
  nuevoContacto = {
    nombre_completo: '',
    email: '',
    telefono: ''
  };
  agregandoContacto = signal(false);

  // Modal de confirmación para eliminar contacto
  showDeleteContactModal = signal(false);
  contactToDelete = signal<any>(null);

  // Modo edición de contactos
  editingContactId = signal<number | null>(null);
  editingContactData = signal<any>(null);
  savingContact = signal(false);

  // Marcar como principal
  settingPrincipal = signal(false);
  showSetPrincipalModal = signal(false);
  contactToSetPrincipal = signal<any>(null);

  // Filtros
  busqueda = signal<string>('');

  // Paginación
  paginaActual = signal<number>(1);
  itemsPorPagina = signal<number>(10);

  // Computed para clientes filtrados
  clientesFiltrados = computed(() => {
    const clientes = this.clients();
    const textoBusqueda = this.busqueda().toLowerCase().trim();

    return clientes.filter(cliente => {
      // Filtro de búsqueda
      const cumpleBusqueda = !textoBusqueda ||
        (cliente.ruc_cedula || '').toLowerCase().includes(textoBusqueda) ||
        (cliente.nombre_razon_social || '').toLowerCase().includes(textoBusqueda) ||
        (cliente.contacto_principal || '').toLowerCase().includes(textoBusqueda) ||
        (cliente.email || '').toLowerCase().includes(textoBusqueda);

      return cumpleBusqueda;
    });
  });

  // Computed para datos paginados
  clientesPaginados = computed(() => {
    const clientes = this.clientesFiltrados();
    const pagina = this.paginaActual();
    const porPagina = this.itemsPorPagina();
    const inicio = (pagina - 1) * porPagina;
    const fin = inicio + porPagina;
    return clientes.slice(inicio, fin);
  });

  totalPaginas = computed(() => {
    return Math.ceil(this.clientesFiltrados().length / this.itemsPorPagina());
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
    contacto_principal_email: '',
    contacto_principal_telefono: '',
    contactos_adicionales: [] as any[]
  };

  // Campos para agregar contacto temporal
  nuevoContactoTemporal = {
    nombre_completo: '',
    email: '',
    telefono: ''
  };

  nombreNuevoContacto = '';

  constructor() {
    effect(() => {
      if (this.dbService.connected()) {
        this.loadClients();
      } else {
        this.clients.set([]);
      }
    });
  }

  async loadClients(): Promise<void> {
    this.isLoading.set(true);
    const query = `
      SELECT c.id_cliente, c.ruc_cedula, c.nombre_razon_social, cc.nombre_completo AS contacto_principal, c.email, c.direccion, c.telefono 
      FROM clientes c 
      LEFT JOIN clientes_contactos cc ON c.id_cliente = cc.id_cliente AND cc.es_principal = 1 
      WHERE c.deleted_at IS NULL
    `;

    try {
      const data = await this.dbService.query(query);
      // Inicializar con documentCount en 0
      this.clients.set(data.map((c: any) => ({ ...c, documentCount: 0 })));
      // Cargar conteo real de documentos
      await this.cargarConteoDocumentos();
    } catch (e) {
      console.error("Error loading clients:", e);
      this.clients.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  exportToCsv(): void {
    const dataToExport = this.clients().map(client => ({
      RUC_Cedula: client.ruc_cedula,
      Razon_Social: client.nombre_razon_social,
      Contacto_Principal: client.contacto_principal,
      Email: client.email,
      Documentos: client.documentCount
    }));
    this.csvExportService.exportToCsv('clientes.csv', dataToExport);
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
      contacto_principal_email: '',
      contacto_principal_telefono: '',
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
      this.toastService.showWarning('Por favor complete todos los campos requeridos');
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
        await this.loadClients(); // Recargar la lista
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

  // Métodos de paginación
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

  // Métodos de filtros
  cambiarBusqueda(texto: string) {
    this.busqueda.set(texto);
    this.paginaActual.set(1);
  }

  // Método para editar cliente
  async abrirModalEditar(cliente: Client) {
    this.clienteEditar.set({ ...cliente, contactos_adicionales: [] });
    this.mostrarModalEditar.set(true);

    // Cargar contactos existentes para editar
    try {
      const response = await fetch(`${environment.apiUrl}/contactos.php?id_cliente=${cliente.id_cliente}`);
      const result = await response.json();
      if (result.success && result.data) {
        // Filtrar solo los no principales
        const adicionales = result.data.filter((c: any) => c.es_principal == 0);
        this.clienteEditar.update(c => c ? { ...c, contactos_adicionales: adicionales } : null);
      }
    } catch (e) {
      console.error('Error cargando contactos para editar', e);
    }
  }

  cerrarModalEditar() {
    this.mostrarModalEditar.set(false);
    this.clienteEditar.set(null);
    this.nuevoContactoTemporal = { nombre_completo: '', email: '', telefono: '' };
  }

  async guardarEdicionCliente() {
    const cliente = this.clienteEditar();
    if (!cliente) return;

    if (!cliente.ruc_cedula.trim() || !cliente.nombre_razon_social.trim() ||
      !cliente.direccion.trim() || !cliente.telefono.trim() ||
      !cliente.email.trim() || !cliente.contacto_principal.trim()) {
      this.toastService.showWarning('Por favor complete todos los campos requeridos');
      return;
    }

    this.guardandoCliente.set(true);

    try {
      const response = await fetch(`${environment.apiUrl}/clientes.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cliente)
      });

      const result = await response.json();

      if (result.success) {
        this.toastService.showSuccess('Cliente actualizado exitosamente');
        this.cerrarModalEditar();
        await this.loadClients();
      } else {
        this.toastService.showError('Error: ' + (result.message || 'No se pudo actualizar el cliente'));
      }
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      this.toastService.showError('Error al conectar con el servidor');
    } finally {
      this.guardandoCliente.set(false);
    }
  }

  // Método para eliminar cliente (abre modal de confirmación)
  async eliminarCliente(cliente: Client) {
    this.clientToDelete.set(cliente);
    this.showDeleteModal.set(true);
  }

  // Confirma la eliminación de la orden
  async confirmDelete() {
    const cliente = this.clientToDelete();
    if (!cliente) return;

    try {
      const response = await fetch(`${environment.apiUrl}/clientes.php?id=${cliente.id_cliente}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        this.toastService.showSuccess('Cliente eliminado correctamente');
        await this.loadClients();
        this.closeDeleteModal();
      } else {
        this.toastService.showError('Error: ' + (result.message || 'No se pudo eliminar el cliente'));
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      this.toastService.showError('Error al conectar con el servidor');
    }
  }

  // Cierra el modal de eliminación
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.clientToDelete.set(null);
  }

  // Método para ver detalle del cliente
  async verDetalleCliente(cliente: Client) {
    this.clienteDetalle.set(cliente);
    this.mostrarModalDetalle.set(true);
    this.mostrarModalDetalle.set(true);
    await Promise.all([
      this.cargarDocumentosCliente(cliente.id_cliente),
      this.cargarContactos(cliente.id_cliente)
    ]);
  }

  async cargarContactos(id_cliente: number) {
    this.cargandoContactos.set(true);
    try {
      const response = await fetch(`${environment.apiUrl}/contactos.php?id_cliente=${id_cliente}`);
      const result = await response.json();

      if (result.success && result.data) {
        this.contactosCliente.set(result.data);
      } else {
        this.contactosCliente.set([]);
      }
    } catch (error) {
      console.error('Error al cargar contactos:', error);
      this.contactosCliente.set([]);
    } finally {
      this.cargandoContactos.set(false);
    }
  }

  // Métodos para gestionar contactos en formularios (Create/Edit)
  agregarContactoTemporal(tipo: 'nuevo' | 'editar') {
    const nombre = this.nuevoContactoTemporal.nombre_completo.trim();
    const email = this.nuevoContactoTemporal.email.trim();
    const telefono = this.nuevoContactoTemporal.telefono.trim();

    if (!nombre) {
      this.toastService.showWarning('El nombre es obligatorio');
      return;
    }
    if (!email) {
      this.toastService.showWarning('El email es obligatorio');
      return;
    }

    if (tipo === 'nuevo') {
      this.nuevoCliente.contactos_adicionales.push({
        nombre_completo: nombre,
        email: email,
        telefono: telefono,
        es_principal: 0
      });
    } else {
      this.clienteEditar.update(c => {
        if (!c) return null;
        const contactos = c['contactos_adicionales'] || [];
        return {
          ...c,
          contactos_adicionales: [...contactos, {
            nombre_completo: nombre,
            email: email,
            telefono: telefono,
            es_principal: 0
          }]
        };
      });
    }
    this.nuevoContactoTemporal = { nombre_completo: '', email: '', telefono: '' };
  }

  removerContactoTemporal(tipo: 'nuevo' | 'editar', index: number) {
    if (tipo === 'nuevo') {
      this.nuevoCliente.contactos_adicionales.splice(index, 1);
    } else {
      this.clienteEditar.update(c => {
        if (!c) return null;
        const contactos = [...(c['contactos_adicionales'] || [])];
        contactos.splice(index, 1);
        return { ...c, contactos_adicionales: contactos };
      });
    }
  }

  async guardarContacto() {
    const cliente = this.clienteDetalle();
    if (!cliente || !this.nuevoContacto.nombre_completo.trim()) {
      this.toastService.showWarning('El nombre completo es obligatorio');
      return;
    }
    if (!this.nuevoContacto.email.trim()) {
      this.toastService.showWarning('El email es obligatorio');
      return;
    }

    this.agregandoContacto.set(true);
    try {
      const response = await fetch(`${environment.apiUrl}/contactos.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: cliente.id_cliente,
          ...this.nuevoContacto
        })
      });

      const result = await response.json();

      if (result.success) {
        // Limpiar formulario
        this.nuevoContacto = {
          nombre_completo: '',
          email: '',
          telefono: ''
        };
        this.toastService.showSuccess('Contacto agregado correctamente');
        // Recargar contactos
        await this.cargarContactos(cliente.id_cliente);
      } else {
        this.toastService.showError('Error: ' + (result.message || 'No se pudo agregar el contacto'));
      }
    } catch (error) {
      console.error('Error al guardar contacto:', error);
      this.toastService.showError('Error al conectar con el servidor');
    } finally {
      this.agregandoContacto.set(false);
    }
  }

  // Abre modal de confirmación para eliminar contacto
  eliminarContacto(contacto: any) {
    // Permitir eliminar cualquier contacto, el modal mostrará la confirmación
    this.contactToDelete.set(contacto);
    this.showDeleteContactModal.set(true);
  }

  // Confirma la eliminación del contacto
  async confirmDeleteContact() {
    const contacto = this.contactToDelete();
    if (!contacto) return;

    try {
      const response = await fetch(`${environment.apiUrl}/contactos.php?id=${contacto.id_contacto}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        const cliente = this.clienteDetalle();
        if (cliente) {
          this.toastService.showSuccess('Contacto eliminado correctamente');
          await this.cargarContactos(cliente.id_cliente);
        }
        this.closeDeleteContactModal();
      } else {
        this.toastService.showError('Error: ' + (result.message || 'No se pudo eliminar el contacto'));
      }
    } catch (error) {
      console.error('Error al eliminar contacto:', error);
      this.toastService.showError('Error al conectar con el servidor');
    }
  }

  // Cierra el modal de confirmación de eliminación de contacto
  closeDeleteContactModal() {
    this.showDeleteContactModal.set(false);
    this.contactToDelete.set(null);
  }

  // Inicia el modo edición para un contacto
  editarContacto(contacto: any) {
    this.editingContactId.set(contacto.id_contacto);
    this.editingContactData.set({
      nombre_completo: contacto.nombre_completo,
      email: contacto.email || '',
      telefono: contacto.telefono || '',
      cargo: contacto.cargo || ''
    });
  }

  // Cancela el modo edición
  cancelarEdicionContacto() {
    this.editingContactId.set(null);
    this.editingContactData.set(null);
  }

  // Guarda los cambios del contacto editado
  async guardarEdicionContacto(id_contacto: number) {
    const data = this.editingContactData();
    if (!data || !data.nombre_completo.trim()) {
      this.toastService.showWarning('El nombre completo es obligatorio');
      return;
    }
    if (!data.email.trim()) {
      this.toastService.showWarning('El email es obligatorio');
      return;
    }

    this.savingContact.set(true);
    try {
      const response = await fetch(`${environment.apiUrl}/contactos.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_contacto: id_contacto,
          ...data
        })
      });

      const result = await response.json();

      if (result.success) {
        this.toastService.showSuccess('Contacto actualizado correctamente');
        const cliente = this.clienteDetalle();
        if (cliente) {
          await this.cargarContactos(cliente.id_cliente);
        }
        this.cancelarEdicionContacto();
      } else {
        this.toastService.showError('Error: ' + (result.message || 'No se pudo actualizar el contacto'));
      }
    } catch (error) {
      console.error('Error al actualizar contacto:', error);
      this.toastService.showError('Error al conectar con el servidor');
    } finally {
      this.savingContact.set(false);
    }
  }

  // Abre modal de confirmación para marcar como principal
  marcarComoPrincipal(contacto: any) {
    this.contactToSetPrincipal.set(contacto);
    this.showSetPrincipalModal.set(true);
  }

  // Confirma y ejecuta el marcado como principal
  async confirmSetPrincipal() {
    const contacto = this.contactToSetPrincipal();
    const cliente = this.clienteDetalle();
    if (!cliente || !contacto) return;

    this.showSetPrincipalModal.set(false);
    this.settingPrincipal.set(true);
    try {
      const response = await fetch(`${environment.apiUrl}/contactos.php?action=set_principal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_contacto: contacto.id_contacto,
          id_cliente: cliente.id_cliente
        })
      });

      const result = await response.json();

      if (result.success) {
        this.toastService.showSuccess('Contacto marcado como principal');
        await this.cargarContactos(cliente.id_cliente);
      } else {
        this.toastService.showError('Error: ' + (result.message || 'No se pudo marcar como principal'));
      }
    } catch (error) {
      console.error('Error al marcar como principal:', error);
      this.toastService.showError('Error al conectar con el servidor');
    } finally {
      this.settingPrincipal.set(false);
      this.contactToSetPrincipal.set(null);
    }
  }

  // Cierra el modal de confirmación para marcar como principal
  closeSetPrincipalModal() {
    this.showSetPrincipalModal.set(false);
    this.contactToSetPrincipal.set(null);
  }

  async cargarDocumentosCliente(id_cliente: number) {
    this.cargandoDocumentos.set(true);
    try {
      const response = await fetch(`${environment.apiUrl}/archivo_cliente.php?id_cliente=${id_cliente}`);
      const result = await response.json();

      if (result.success && result.data) {
        this.documentosCliente.set(result.data);
      } else {
        this.documentosCliente.set([]);
      }
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      this.documentosCliente.set([]);
    } finally {
      this.cargandoDocumentos.set(false);
    }
  }

  async cargarConteoDocumentos() {
    try {
      const response = await fetch(`${environment.apiUrl}/archivo_cliente.php`);
      const data = await response.json();

      if (data.success && data.data) {
        // Contar documentos por cliente
        const conteoMap = new Map<number, number>();
        data.data.forEach((doc: any) => {
          const count = conteoMap.get(doc.id_cliente) || 0;
          conteoMap.set(doc.id_cliente, count + 1);
        });

        // Actualizar clients con el conteo real
        const clientesActualizados = this.clients().map(cliente => ({
          ...cliente,
          documentCount: conteoMap.get(cliente.id_cliente) || 0
        }));

        this.clients.set(clientesActualizados);
      }
    } catch (error) {
      console.error('Error al cargar conteo de documentos:', error);
    }
  }

  toggleDocumentos() {
    this.mostrarDocumentos.set(!this.mostrarDocumentos());
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle.set(false);
    this.clienteDetalle.set(null);
    this.documentosCliente.set([]);
    this.mostrarDocumentos.set(false);
  }
}
