import { Component, OnInit, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, ChartData, BarDataset, DashboardFilters } from '../../services/dashboard.service';
import { DatabaseService } from '../../services/database.service';
import { DashboardFiltersComponent } from './dashboard-filters.component';
import { PieChartComponent } from './pie-chart.component';
import { BarChartComponent } from './bar-chart.component';
import { KpiCardComponent } from './kpi-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardFiltersComponent,
    PieChartComponent,
    BarChartComponent,
    KpiCardComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private dbService = inject(DatabaseService);
  private dashboardService = inject(DashboardService);
  
  // Señales para datos de gráficos de pastel
  estadoOTChart = signal<ChartData | null>(null);
  personalEspecialidadChart = signal<ChartData | null>(null);
  consumoMaterialesChart = signal<ChartData | null>(null);
  asistenciaChart = signal<ChartData | null>(null);
  
  // Señales para datos de gráficos de barras
  progresoProyectosChart = signal<ChartData | null>(null);
  horasProyectoChart = signal<ChartData | null>(null);
  valorMaterialesChart = signal<ChartData | null>(null);
  asistenciaSemanalChart = signal<ChartData | null>(null);
  valoracionEconomicaChart = signal<ChartData | null>(null);
  otCompletadasChart = signal<ChartData | null>(null);
  stockCriticoChart = signal<ChartData | null>(null);
  costosProyectosChart = signal<ChartData | null>(null);
  
  // Señales para tablas
  tablaProyectos = signal<any[]>([]);
  tablaPersonal = signal<any[]>([]);
  
  // KPIs
  kpiData = this.dashboardService.kpiData;
  
  isLoading = signal(false);
  
  constructor() {
    // Constructor vacío, el servicio se inyecta automáticamente
  }
  
  ngOnInit() {
    // Cargar datos iniciales sin filtros
    this.loadAllData({});
  }
  
  /**
   * Manejador de cambios en filtros
   */
  onFiltersChange(filters: DashboardFilters) {
    this.loadAllData(filters);
  }
  
  /**
   * Carga todos los datos del dashboard con los filtros aplicados
   */
  async loadAllData(filters: DashboardFilters) {
    this.isLoading.set(true);
    
    try {
      // Cargar dashboard completo (incluye KPIs)
      await this.dashboardService.cargarDashboard(filters);
      
      // Cargar gráficos de pastel en paralelo
      const [estadoOT, personalEsp, materiales, asistencia] = await Promise.all([
        this.dashboardService.getEstadoOTChart(filters),
        this.dashboardService.getPersonalEspecialidadChart(filters),
        this.dashboardService.getConsumoMaterialesChart(filters),
        this.dashboardService.getAsistenciaChart(filters)
      ]);
      
      this.estadoOTChart.set(estadoOT);
      this.personalEspecialidadChart.set(personalEsp);
      this.consumoMaterialesChart.set(materiales);
      this.asistenciaChart.set(asistencia);
      
      // Cargar gráficos de barras en paralelo
      const [progreso, horas, valorMat, asistSem, valoracion, otComp, stock, costos] = await Promise.all([
        this.dashboardService.getProgresoProyectosChart(filters),
        this.dashboardService.getHorasProyectoChart(filters),
        this.dashboardService.getValorMaterialesChart(filters),
        this.dashboardService.getAsistenciaSemanalChart(filters),
        this.dashboardService.getValoracionEconomicaChart(filters),
        this.dashboardService.getOTCompletadasChart(filters),
        this.dashboardService.getStockCriticoChart(filters),
        this.dashboardService.getCostosProyectosChart(filters)
      ]);
      
      this.progresoProyectosChart.set(progreso);
      this.horasProyectoChart.set(horas);
      this.valorMaterialesChart.set(valorMat);
      this.asistenciaSemanalChart.set(asistSem);
      this.valoracionEconomicaChart.set(valoracion);
      this.otCompletadasChart.set(otComp);
      this.stockCriticoChart.set(stock);
      this.costosProyectosChart.set(costos);
      
      // Cargar tablas en paralelo
      const [proyectos, personal] = await Promise.all([
        this.dashboardService.getTablaProyectos(filters),
        this.dashboardService.getTablaPersonal(filters)
      ]);
      
      this.tablaProyectos.set(proyectos);
      this.tablaPersonal.set(personal);
      
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  /**
   * Convierte ChartData a formato BarDataset[] para gráficos de barras
   */
  getBarDatasets(chartData: ChartData | null): BarDataset[] {
    if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
      return [];
    }
    
    return chartData.datasets.map(ds => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.backgroundColor || []
    }));
  }
  
  /**
   * Convierte ChartData con múltiples datasets a BarDataset[]
   */
  getMultipleBarDatasets(chartData: ChartData | null): BarDataset[] {
    if (!chartData || !chartData.datasets) {
      return this.getBarDatasets(chartData);
    }
    
    return chartData.datasets;
  }
}
