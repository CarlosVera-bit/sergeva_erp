import { Injectable, signal } from '@angular/core';
import { DatabaseService } from './database.service';
import { environment } from '../environments/environment';

export interface DashboardFilters {
  fechaInicio?: string;
  fechaFin?: string;
  periodo?: 'dia' | 'semana' | 'mes' | 'trimestre' | 'anio';
  proyectoId?: number;
  personalId?: number;
  supervisorId?: number;
  clienteId?: number;
}

export interface BarDataset {
  label: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
  borderWidth?: number;
}

export interface KPIData {
  totalOT: number;
  ingresosTotal: number;
  horasTotales: number;
  tasaAsistencia: number;
  proyectosATiempo: number;
  desviacionCostos: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

export interface ProyectoTabla {
  proyecto: string;
  estado: string;
  avance: number;
  personalAsignado: number;
  horas: number;
  costoReal: number;
  presupuesto: number;
  variacion: number;
}

export interface PersonalTabla {
  empleado: string;
  especialidad: string;
  horasMes: number;
  proyectos: number;
  asistencia: number;
  promedioHoras: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = environment.apiUrl;

  // Signals para almacenar datos del dashboard
  kpiData = signal<KPIData>({
    totalOT: 0,
    ingresosTotal: 0,
    horasTotales: 0,
    tasaAsistencia: 0,
    proyectosATiempo: 0,
    desviacionCostos: 0
  });

  isLoading = signal<boolean>(false);

  constructor(private dbService: DatabaseService) { }

  /**
   * Carga todos los datos del dashboard con los filtros aplicados
   */
  async cargarDashboard(filtros: DashboardFilters): Promise<void> {
    this.isLoading.set(true);
    try {
      await Promise.all([
        this.cargarKPIs(filtros)
      ]);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Obtiene los KPIs principales
   */
  async cargarKPIs(filtros: DashboardFilters): Promise<KPIData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=kpis&${params}`);
      const result = await response.json();

      if (result.success) {
        this.kpiData.set(result.data);
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo KPIs');
    } catch (error) {
      console.error('Error en cargarKPIs:', error);
      throw error;
    }
  }

  /**
   * Obtiene datos para gráfico de estado de OT
   */
  async getEstadoOTChart(filtros: DashboardFilters): Promise<ChartData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=estado_ot&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo estado OT');
    } catch (error) {
      console.error('Error en getEstadoOTChart:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Obtiene datos para gráfico de personal por especialidad
   */
  async getPersonalEspecialidadChart(filtros: DashboardFilters): Promise<ChartData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=personal_especialidad&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo personal por especialidad');
    } catch (error) {
      console.error('Error en getPersonalEspecialidadChart:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Obtiene datos para gráfico de consumo de materiales
   */
  async getConsumoMaterialesChart(filtros: DashboardFilters): Promise<ChartData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=consumo_materiales&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo consumo de materiales');
    } catch (error) {
      console.error('Error en getConsumoMaterialesChart:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Obtiene datos para gráfico de asistencia general
   */
  async getAsistenciaGeneralChart(filtros: DashboardFilters): Promise<ChartData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=asistencia_general&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo asistencia general');
    } catch (error) {
      console.error('Error en getAsistenciaGeneralChart:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Obtiene datos para gráfico de progreso de proyectos
   */
  async getProgresoProyectosChart(filtros: DashboardFilters): Promise<ChartData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=progreso_proyectos&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo progreso de proyectos');
    } catch (error) {
      console.error('Error en getProgresoProyectosChart:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Obtiene datos para gráfico de horas por proyecto
   */
  async getHorasProyectoChart(filtros: DashboardFilters): Promise<ChartData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=horas_proyecto&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo horas por proyecto');
    } catch (error) {
      console.error('Error en getHorasProyectoChart:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Obtiene datos para gráfico de horas por personal
   */
  async getHorasPersonalChart(filtros: DashboardFilters): Promise<ChartData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=horas_personal&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo horas por personal');
    } catch (error) {
      console.error('Error en getHorasPersonalChart:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Obtiene datos para gráfico de asistencia semanal
   */
  async getAsistenciaSemanalChart(filtros: DashboardFilters): Promise<ChartData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=asistencia_semanal&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo asistencia semanal');
    } catch (error) {
      console.error('Error en getAsistenciaSemanalChart:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Obtiene datos para gráfico de valoración económica por OT
   */
  async getValoracionOTChart(filtros: DashboardFilters): Promise<ChartData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=valoracion_ot&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo valoración OT');
    } catch (error) {
      console.error('Error en getValoracionOTChart:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Obtiene datos para gráfico de OT completadas por mes
   */
  async getOTCompletadasMesChart(filtros: DashboardFilters): Promise<ChartData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=ot_completadas_mes&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo OT completadas');
    } catch (error) {
      console.error('Error en getOTCompletadasMesChart:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Obtiene datos para gráfico de stock de materiales críticos
   */
  async getStockMaterialesChart(filtros: DashboardFilters): Promise<ChartData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=stock_materiales&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo stock de materiales');
    } catch (error) {
      console.error('Error en getStockMaterialesChart:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Obtiene datos para gráfico de stock crítico (horizontal)
   */
  async getStockCriticoChart(filtros: DashboardFilters): Promise<ChartData> {
    return this.getStockMaterialesChart(filtros);
  }

  /**
   * Obtiene datos para gráfico de costos por proyecto
   */
  async getCostosProyectosChart(filtros: DashboardFilters): Promise<ChartData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=costos_proyectos&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo costos de proyectos');
    } catch (error) {
      console.error('Error en getCostosProyectosChart:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Alias para getStockMaterialesChart
   */
  async getValorMaterialesChart(filtros: DashboardFilters): Promise<ChartData> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=valor_materiales&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo valor de materiales');
    } catch (error) {
      console.error('Error en getValorMaterialesChart:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Alias para getValoracionOTChart
   */
  async getValoracionEconomicaChart(filtros: DashboardFilters): Promise<ChartData> {
    return this.getValoracionOTChart(filtros);
  }

  /**
   * Alias para getOTCompletadasMesChart
   */
  async getOTCompletadasChart(filtros: DashboardFilters): Promise<ChartData> {
    return this.getOTCompletadasMesChart(filtros);
  }

  /**
   * Alias para getAsistenciaGeneralChart
   */
  async getAsistenciaChart(filtros: DashboardFilters): Promise<ChartData> {
    return this.getAsistenciaGeneralChart(filtros);
  }

  /**
   * Obtiene datos para tabla de proyectos
   */
  async getTablaProyectos(filtros: DashboardFilters): Promise<ProyectoTabla[]> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=tabla_proyectos&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo tabla de proyectos');
    } catch (error) {
      console.error('Error en getTablaProyectos:', error);
      return [];
    }
  }

  /**
   * Obtiene datos para tabla de personal
   */
  async getTablaPersonal(filtros: DashboardFilters): Promise<PersonalTabla[]> {
    try {
      const params = this.buildQueryParams(filtros);
      const response = await fetch(`${this.baseUrl}/dashboard.php?action=tabla_personal&${params}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      throw new Error(result.message || 'Error obteniendo tabla de personal');
    } catch (error) {
      console.error('Error en getTablaPersonal:', error);
      return [];
    }
  }

  /**
   * Construye los parámetros de query para las peticiones
   */
  private buildQueryParams(filtros: DashboardFilters): string {
    const params = new URLSearchParams();

    if (filtros.fechaInicio) params.append('fecha_inicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fecha_fin', filtros.fechaFin);
    if (filtros.periodo) params.append('periodo', filtros.periodo);

    if (filtros.proyectoId) params.append('proyecto_id', filtros.proyectoId.toString());
    if (filtros.personalId) params.append('personal_id', filtros.personalId.toString());
    if (filtros.supervisorId) params.append('supervisor_id', filtros.supervisorId.toString());
    if (filtros.clienteId) params.append('cliente_id', filtros.clienteId.toString());

    return params.toString();
  }
}
