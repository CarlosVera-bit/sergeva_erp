import { Injectable, signal } from '@angular/core';
import { DatabaseService } from './database.service';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataPreloadService {
  // Señales para datos cacheados
  ordenesTrabajoCache = signal<any[]>([]);
  proyectosActivosCache = signal<any[]>([]);
  empleadosCache = signal<any[]>([]);

  // Estado de carga
  isLoading = signal(false);
  isLoaded = signal(false);

  constructor(private dbService: DatabaseService) { }

  /**
   * Precarga todos los datos comunes al iniciar la aplicación
   * Ejecutar una sola vez al arranque para optimizar rendimiento
   */
  async preloadAllData(): Promise<void> {
    if (this.isLoaded()) {
      console.log('✅ Datos ya precargados, usando caché');
      return;
    }

    this.isLoading.set(true);
    console.log('🔄 Iniciando precarga de datos...');

    try {
      // Asegurar conexión primero
      await this.dbService.connect();

      // Cargar todos los datos en paralelo para máxima velocidad
      const [ordenesData, proyectosData, empleadosData] = await Promise.all([
        this.dbService.getWorkOrders(),
        this.loadProyectosActivos(),
        this.loadEmpleados()
      ]);

      // Actualizar cachés
      this.ordenesTrabajoCache.set(ordenesData);
      this.proyectosActivosCache.set(proyectosData);
      this.empleadosCache.set(empleadosData);

      this.isLoaded.set(true);
      console.log(`✅ Precarga completa:`, {
        ordenesTrabajoCache: ordenesData.length,
        proyectosActivos: proyectosData.length,
        empleados: empleadosData.length
      });
    } catch (error) {
      console.error('❌ Error en precarga de datos:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Fuerza recarga de todos los datos
   */
  async reloadAllData(): Promise<void> {
    this.isLoaded.set(false);
    await this.preloadAllData();
  }

  /**
   * Recarga solo órdenes de trabajo
   */
  async reloadWorkOrders(): Promise<void> {
    const data = await this.dbService.getWorkOrders();
    this.ordenesTrabajoCache.set(data);
    console.log('🔄 Órdenes de trabajo actualizadas:', data.length);
  }

  /**
   * Recarga solo proyectos activos
   */
  async reloadProyectos(): Promise<void> {
    const data = await this.loadProyectosActivos();
    this.proyectosActivosCache.set(data);
    console.log('🔄 Proyectos activos actualizados:', data.length);
  }

  /**
   * Recarga solo empleados
   */
  async reloadEmpleados(): Promise<void> {
    const data = await this.loadEmpleados();
    this.empleadosCache.set(data);
    console.log('🔄 Empleados actualizados:', data.length);
  }

  // === MÉTODOS PRIVADOS DE CARGA ===

  private async loadProyectosActivos(): Promise<any[]> {
    try {
      const response = await fetch(environment.apiUrl + '/proyectos.php');
      const result = await response.json();

      if (result.success && result.data) {
        return result.data.filter((p: any) => p.estado === 'ACTIVO' || p.estado === 'EN_EJECUCION');
      }
      return [];
    } catch (error) {
      console.error('Error cargando proyectos:', error);
      return [];
    }
  }

  private async loadEmpleados(): Promise<any[]> {
    try {
      const response = await fetch(environment.apiUrl + '/trabajadores.php');
      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Error cargando empleados:', error);
      return [];
    }
  }
}
