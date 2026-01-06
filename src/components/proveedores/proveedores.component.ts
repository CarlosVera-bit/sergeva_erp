import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedoresService, Proveedor, CreateProveedorDTO } from '../../services/proveedores.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProveedoresComponent implements OnInit {
  proveedoresService = inject(ProveedoresService);
  toastService = inject(ToastService);

  proveedores = signal<Proveedor[]>([]);
  isLoading = signal<boolean>(false);
  searchTerm = signal<string>('');

  // Modal State
  showModal = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isViewing = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Form Data
  currentProveedor: any = {
    ruc: '',
    nombre_razon_social: '',
    direccion: '',
    telefono: '',
    email: '',
    contacto: '',
    activo: true
  };

  proveedorToDelete = signal<Proveedor | null>(null);

  // Pagination
  paginaActual = signal<number>(1);
  itemsPorPagina = signal<number>(10);
  protected Math = Math;

  // Computed: Filtered Providers
  filteredProveedores = computed(() => {
    const search = this.searchTerm().toLowerCase();
    return this.proveedores().filter(p =>
      p.ruc.toLowerCase().includes(search) ||
      p.nombre_razon_social.toLowerCase().includes(search)
    );
  });

  // Computed: Paginados
  proveedoresPaginados = computed(() => {
    const items = this.filteredProveedores();
    const pagina = this.paginaActual();
    const itemsPagina = this.itemsPorPagina();
    const inicio = (pagina - 1) * itemsPagina;
    return items.slice(inicio, inicio + itemsPagina);
  });

  // Computed: Total de páginas
  totalPaginas = computed(() => {
    return Math.ceil(this.filteredProveedores().length / this.itemsPorPagina());
  });

  // Computed: Array de páginas para el paginador
  paginasArray = computed(() => {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  });

  ngOnInit() {
    this.loadProveedores();
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

  async loadProveedores() {
    this.isLoading.set(true);
    try {
      const data = await this.proveedoresService.getProveedores();
      this.proveedores.set(data);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  openNewModal() {
    this.isEditing.set(false);
    this.isViewing.set(false);
    this.currentProveedor = {
      ruc: '',
      nombre_razon_social: '',
      direccion: '',
      telefono: '',
      email: '',
      contacto: '',
      activo: true
    };
    this.showModal.set(true);
  }

  editProveedor(prov: Proveedor) {
    this.isEditing.set(true);
    this.isViewing.set(false);
    this.currentProveedor = {
      ...prov,
      activo: prov.activo === 1 // Convert number to boolean for checkbox
    };
    this.showModal.set(true);
  }

  viewProveedor(prov: Proveedor) {
    this.isEditing.set(false);
    this.isViewing.set(true);
    this.currentProveedor = {
      ...prov,
      activo: prov.activo === 1
    };
    this.showModal.set(true);
  }

  openDeleteModal(prov: Proveedor) {
    this.proveedorToDelete.set(prov);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.proveedorToDelete.set(null);
  }

  async confirmDelete() {
    const prov = this.proveedorToDelete();
    if (!prov) return;

    this.isSaving.set(true);
    try {
      await this.proveedoresService.deleteProveedor(prov.id_proveedor);
      this.toastService.showSuccess(`Proveedor ${prov.nombre_razon_social} eliminado correctamente`);
      this.proveedores.update(list => list.filter(p => p.id_proveedor !== prov.id_proveedor));
      this.closeDeleteModal();
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      this.toastService.showError('No se pudo eliminar el proveedor. Es posible que tenga registros asociados.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async saveProveedor() {
    if (this.isViewing()) return;

    this.isSaving.set(true);
    try {
      const dto: CreateProveedorDTO = {
        ruc: this.currentProveedor.ruc,
        nombre_razon_social: this.currentProveedor.nombre_razon_social,
        direccion: this.currentProveedor.direccion,
        telefono: this.currentProveedor.telefono,
        email: this.currentProveedor.email,
        contacto: this.currentProveedor.contacto,
        activo: this.currentProveedor.activo ? 1 : 0
      };

      if (this.isEditing()) {
        const updated = await this.proveedoresService.updateProveedor(this.currentProveedor.id_proveedor, dto);

        // Update local list without reload
        this.proveedores.update(list => {
          const index = list.findIndex(p => p.id_proveedor === updated.id_proveedor);
          if (index !== -1) {
            const newList = [...list];
            newList[index] = updated;
            return newList;
          }
          return list;
        });
      } else {
        const created = await this.proveedoresService.createProveedor(dto);

        // Add to top of list
        this.proveedores.update(list => [created, ...list]);
      }

      this.toastService.showSuccess(this.isEditing() ? 'Proveedor actualizado correctamente' : 'Proveedor registrado correctamente');
      this.showModal.set(false);
    } catch (error) {
      console.error('Error guardando proveedor:', error);
      this.toastService.showError('Error al guardar proveedor. Verifique que el RUC no esté duplicado.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
