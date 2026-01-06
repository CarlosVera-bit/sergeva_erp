import { Component, EventEmitter, Output, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardFilters } from '../../services/dashboard.service';
import { DatabaseService } from '../../services/database.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-dashboard-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 md:p-4 mb-4 md:mb-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h3 class="text-base md:text-lg font-semibold text-slate-800 dark:text-white">Filtros del Dashboard</h3>
        <button (click)="resetFilters()"
                class="text-xs md:text-sm px-3 py-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Restablecer
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <!-- Período -->
        <div>
          <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Período
          </label>
          <select [(ngModel)]="periodo" (change)="onPeriodoChange()"
                  class="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white">
            <option value="dia">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="trimestre">Trimestre</option>
            <option value="anio">Año</option>
          </select>
        </div>

        <!-- Fecha Inicio -->
        <div>
          <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Fecha Inicio
          </label>
          <input type="date" [(ngModel)]="fechaInicio"
                 class="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white">
        </div>

        <!-- Fecha Fin -->
        <div>
          <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Fecha Fin
          </label>
          <input type="date" [(ngModel)]="fechaFin"
                 class="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white">
        </div>

        <!-- Proyecto -->
        <div>
          <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Proyecto
          </label>
          <select [(ngModel)]="proyectoId"
                  class="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white">
            <option [value]="undefined">Todos</option>
            @for (proyecto of proyectos(); track proyecto.id) {
              <option [value]="proyecto.id">{{ proyecto.nombre }}</option>
            }
          </select>
        </div>

        <!-- Personal -->
        <div>
          <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Personal
          </label>
          <select [(ngModel)]="personalId"
                  class="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white">
            <option [value]="undefined">Todos</option>
            @for (persona of personal(); track persona.id) {
              <option [value]="persona.id">{{ persona.nombre }}</option>
            }
          </select>
        </div>

        <!-- Botón Aplicar -->
        <div class="flex items-end">
          <button (click)="applyFilters()"
                  class="w-full px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            Aplicar
          </button>
        </div>
      </div>

      <!-- Filtros Adicionales (colapsables en mobile) -->
      <div class="mt-3">
        <button (click)="mostrarFiltrosAvanzados.set(!mostrarFiltrosAvanzados())"
                class="text-xs md:text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
          <svg class="w-4 h-4 transition-transform" [class.rotate-180]="mostrarFiltrosAvanzados()" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
          Filtros Avanzados
        </button>

        @if (mostrarFiltrosAvanzados()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            <!-- Supervisor -->
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Supervisor
              </label>
              <select [(ngModel)]="supervisorId"
                      class="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white">
                <option [value]="undefined">Todos</option>
                @for (supervisor of supervisores(); track supervisor.id) {
                  <option [value]="supervisor.id">{{ supervisor.nombre }}</option>
                }
              </select>
            </div>

            <!-- Cliente -->
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Cliente
              </label>
              <select [(ngModel)]="clienteId"
                      class="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white">
                <option [value]="undefined">Todos</option>
                @for (cliente of clientes(); track cliente.id) {
                  <option [value]="cliente.id">{{ cliente.nombre }}</option>
                }
              </select>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class DashboardFiltersComponent implements OnInit {
  @Output() filtersChange = new EventEmitter<DashboardFilters>();

  private dbService = inject(DatabaseService);

  // Filtros
  periodo: 'dia' | 'semana' | 'mes' | 'trimestre' | 'anio' = 'mes';
  fechaInicio: string = '';
  fechaFin: string = '';
  proyectoId?: number;
  personalId?: number;
  supervisorId?: number;
  clienteId?: number;

  // Opciones para los selects
  proyectos = signal<any[]>([]);
  personal = signal<any[]>([]);
  supervisores = signal<any[]>([]);
  clientes = signal<any[]>([]);

  mostrarFiltrosAvanzados = signal(false);

  ngOnInit(): void {
    this.initializeDates();
    this.loadFilterOptions();
    this.applyFilters(); // Emitir filtros iniciales
  }

  initializeDates(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.fechaInicio = firstDayOfMonth.toISOString().split('T')[0];
    this.fechaFin = today.toISOString().split('T')[0];
  }

  onPeriodoChange(): void {
    const today = new Date();

    switch (this.periodo) {
      case 'dia':
        this.fechaInicio = today.toISOString().split('T')[0];
        this.fechaFin = today.toISOString().split('T')[0];
        break;
      case 'semana':
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1);
        this.fechaInicio = firstDayOfWeek.toISOString().split('T')[0];
        this.fechaFin = today.toISOString().split('T')[0];
        break;
      case 'mes':
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        this.fechaInicio = firstDayOfMonth.toISOString().split('T')[0];
        this.fechaFin = today.toISOString().split('T')[0];
        break;
      case 'trimestre':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const firstDayOfQuarter = new Date(today.getFullYear(), currentQuarter * 3, 1);
        this.fechaInicio = firstDayOfQuarter.toISOString().split('T')[0];
        this.fechaFin = today.toISOString().split('T')[0];
        break;
      case 'anio':
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        this.fechaInicio = firstDayOfYear.toISOString().split('T')[0];
        this.fechaFin = today.toISOString().split('T')[0];
        break;
    }
  }

  async loadFilterOptions(): Promise<void> {
    try {
      // Cargar proyectos (OT)
      const responseOT = await fetch(`${environment.apiUrl}/ordenes_trabajo.php`);
      const resultOT = await responseOT.json();
      if (resultOT.success) {
        this.proyectos.set(resultOT.data.map((ot: any) => ({
          id: ot.id_ot,
          nombre: ot.numero_ot
        })));
      }

      // Cargar personal
      const responsePersonal = await fetch(`${environment.apiUrl}/trabajadores.php`);
      const resultPersonal = await responsePersonal.json();
      if (resultPersonal.success) {
        this.personal.set(resultPersonal.data.map((t: any) => ({
          id: t.id_trabajador,
          nombre: `${t.nombre} ${t.apellido}`
        })));
      }

      // Cargar supervisores (usar trabajadores con rol de supervisor)
      this.supervisores.set(this.personal().slice(0, 10)); // Simplificado

      // Cargar clientes
      const responseClientes = await fetch(`${environment.apiUrl}/clientes.php`);
      const resultClientes = await responseClientes.json();
      if (resultClientes.success) {
        this.clientes.set(resultClientes.data.map((c: any) => ({
          id: c.id_cliente,
          nombre: c.nombre_razon_social
        })));
      }
    } catch (error) {
      console.error('Error cargando opciones de filtros:', error);
    }
  }

  applyFilters(): void {
    const filters: DashboardFilters = {
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      periodo: this.periodo,
      proyectoId: this.proyectoId,
      personalId: this.personalId,
      supervisorId: this.supervisorId,
      clienteId: this.clienteId
    };

    this.filtersChange.emit(filters);
  }

  resetFilters(): void {
    this.periodo = 'mes';
    this.proyectoId = undefined;
    this.personalId = undefined;
    this.supervisorId = undefined;
    this.clienteId = undefined;
    this.initializeDates();
    this.applyFilters();
  }
}
