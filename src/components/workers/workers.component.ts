import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkersService, Worker, CreateWorkerDTO } from '../../services/workers.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-workers',
    templateUrl: './workers.component.html',
    standalone: true,
    imports: [CommonModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkersComponent implements OnInit {
    workersService = inject(WorkersService);
    toastService = inject(ToastService);

    workers = signal<Worker[]>([]);
    isLoading = signal<boolean>(false);
    searchTerm = signal<string>('');

    // Modal State
    showModal = signal<boolean>(false);
    showDeleteModal = signal<boolean>(false);
    isEditing = signal<boolean>(false);
    isViewing = signal<boolean>(false);
    isSaving = signal<boolean>(false);
    showPassword = signal<boolean>(false);

    // Form Data
    currentWorker: any = {
        cedula: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        direccion: '',
        tipo_contrato: 'afiliado',
        especialidad: '',
        fecha_ingreso: '',
        estado: 'activo',
        tarifa_hora: 0
    };

    workerToDelete = signal<Worker | null>(null);

    // Pagination
    paginaActual = signal<number>(1);
    itemsPorPagina = signal<number>(10);
    protected Math = Math;

    // Computed: Generated credentials preview
    generatedEmail = computed(() => {
        if (this.isEditing()) return ''; // Don't show for editing
        const nombres = this.currentWorker.nombres;
        const apellidos = this.currentWorker.apellidos;
        return this.workersService.generateEmail(nombres, apellidos);
    });

    generatedPassword = computed(() => {
        if (this.isEditing()) return ''; // Don't show for editing
        const email = this.generatedEmail();
        return this.workersService.generatePassword(email);
    });

    // Computed: Filtered Workers
    filteredWorkers = computed(() => {
        const search = this.searchTerm().toLowerCase();
        return this.workers().filter(w =>
            w.cedula.toLowerCase().includes(search) ||
            w.nombres.toLowerCase().includes(search) ||
            w.apellidos.toLowerCase().includes(search) ||
            (w.email && w.email.toLowerCase().includes(search))
        );
    });

    // Computed: Paginados
    workersPaginados = computed(() => {
        const items = this.filteredWorkers();
        const pagina = this.paginaActual();
        const itemsPagina = this.itemsPorPagina();
        const inicio = (pagina - 1) * itemsPagina;
        return items.slice(inicio, inicio + itemsPagina);
    });

    // Computed: Total de páginas
    totalPaginas = computed(() => {
        return Math.ceil(this.filteredWorkers().length / this.itemsPorPagina());
    });

    // Computed: Array de páginas para el paginador
    paginasArray = computed(() => {
        return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
    });

    ngOnInit() {
        this.loadWorkers();
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

    async loadWorkers() {
        this.isLoading.set(true);
        try {
            const data = await this.workersService.getWorkers();
            this.workers.set(data);
        } catch (error) {
            console.error('Error cargando trabajadores:', error);
            this.toastService.showError('Error al cargar trabajadores');
        } finally {
            this.isLoading.set(false);
        }
    }

    openNewModal() {
        this.isEditing.set(false);
        this.isViewing.set(false);
        this.showPassword.set(false);
        this.currentWorker = {
            cedula: '',
            nombres: '',
            apellidos: '',
            telefono: '',
            direccion: '',
            tipo_contrato: 'afiliado',
            especialidad: '',
            fecha_ingreso: this.getTodayDate(),
            estado: 'activo',
            tarifa_hora: 0
        };
        this.showModal.set(true);
    }

    editWorker(worker: Worker) {
        this.isEditing.set(true);
        this.isViewing.set(false);
        this.showPassword.set(false);
        this.currentWorker = {
            ...worker,
            tarifa_hora: worker.tarifa_hora || 0
        };
        this.showModal.set(true);
    }

    viewWorker(worker: Worker) {
        this.isEditing.set(false);
        this.isViewing.set(true);
        this.showPassword.set(false);
        this.currentWorker = {
            ...worker,
            tarifa_hora: worker.tarifa_hora || 0
        };
        this.showModal.set(true);
    }

    openDeleteModal(worker: Worker) {
        this.workerToDelete.set(worker);
        this.showDeleteModal.set(true);
    }

    closeDeleteModal() {
        this.showDeleteModal.set(false);
        this.workerToDelete.set(null);
    }

    async confirmDelete() {
        const worker = this.workerToDelete();
        if (!worker) return;

        this.isSaving.set(true);
        try {
            await this.workersService.deleteWorker(worker.id_trabajador);
            this.toastService.showSuccess(`Trabajador ${worker.nombres} ${worker.apellidos} eliminado correctamente`);
            this.workers.update(list => list.filter(w => w.id_trabajador !== worker.id_trabajador));
            this.closeDeleteModal();
        } catch (error) {
            console.error('Error eliminando trabajador:', error);
            this.toastService.showError('No se pudo eliminar el trabajador. Es posible que tenga registros asociados.');
        } finally {
            this.isSaving.set(false);
        }
    }

    async saveWorker() {
        if (this.isViewing()) return;

        this.isSaving.set(true);
        try {
            const dto: CreateWorkerDTO = {
                cedula: this.currentWorker.cedula,
                nombres: this.currentWorker.nombres,
                apellidos: this.currentWorker.apellidos,
                telefono: this.currentWorker.telefono,
                direccion: this.currentWorker.direccion,
                tipo_contrato: this.currentWorker.tipo_contrato,
                especialidad: this.currentWorker.especialidad,
                fecha_ingreso: this.currentWorker.fecha_ingreso,
                estado: this.currentWorker.estado,
                tarifa_hora: parseFloat(this.currentWorker.tarifa_hora) || 0
            };

            if (this.isEditing()) {
                const updated = await this.workersService.updateWorker(this.currentWorker.id_trabajador, dto);

                // Update local list without reload
                this.workers.update(list => {
                    const index = list.findIndex(w => w.id_trabajador === updated.id_trabajador);
                    if (index !== -1) {
                        const newList = [...list];
                        newList[index] = updated;
                        return newList;
                    }
                    return list;
                });
            } else {
                const created = await this.workersService.createWorker(dto);

                // Add to top of list
                this.workers.update(list => [created, ...list]);
            }

            this.toastService.showSuccess(this.isEditing() ? 'Trabajador actualizado correctamente' : 'Trabajador registrado correctamente');
            this.showModal.set(false);
        } catch (error) {
            console.error('Error guardando trabajador:', error);
            this.toastService.showError('Error al guardar trabajador. Verifique que la cédula no esté duplicada.');
        } finally {
            this.isSaving.set(false);
        }
    }

    togglePasswordVisibility() {
        this.showPassword.update(v => !v);
    }

    getTodayDate(): string {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getFullName(worker: Worker): string {
        return `${worker.nombres} ${worker.apellidos}`;
    }

    getEstadoBadgeClass(estado: string): string {
        switch (estado) {
            case 'activo':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'inactivo':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'vacaciones':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'suspendido':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    }

    getTipoContratoBadgeClass(tipo: string): string {
        switch (tipo) {
            case 'afiliado':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case 'por_horas':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
            case 'temporal':
                return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    }

    getTipoContratoLabel(tipo: string): string {
        switch (tipo) {
            case 'afiliado':
                return 'Afiliado';
            case 'por_horas':
                return 'Por Horas';
            case 'temporal':
                return 'Temporal';
            default:
                return tipo;
        }
    }
}
