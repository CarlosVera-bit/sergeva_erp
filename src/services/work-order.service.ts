/**
 * @fileoverview Servicio para gestión de Órdenes de Trabajo
 * Maneja operaciones CRUD, generación de secuenciales y datos relacionados
 * @author Sergeva OS
 * @version 1.0.0
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

// ============================================
// INTERFACES - Definición de tipos de datos
// ============================================

/**
 * Interface para representar un Cliente
 */
export interface Cliente {
  id_cliente: number;
  nombre_razon_social: string;
  contacto_principal: string;
  ruc_cedula: string;
  email?: string;
  direccion?: string;
}

/**
 * Interface para representar un Supervisor
 */
export interface Supervisor {
  id_usuario: number;
  nombre_completo: string;
  email: string;
}

/**
 * Interface para el siguiente número secuencial de OT
 */
export interface NextSequential {
  numero_ot: string;
  secuencial: number;
}

/**
 * Interface para crear una nueva Orden de Trabajo
 */
export interface CreateWorkOrderDTO {
  id_cliente: number;
  representante?: string;
  factura?: string;
  id_cotizacion?: number;
  id_supervisor?: number;
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  descripcion_trabajo: string;
  estado?: 'pendiente' | 'en_proceso' | 'pausada' | 'completada' | 'cancelada';
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  ubicacion_trabajo?: string;
  total_ot?: number;
  estado_factura?: 'pendiente' | 'pagada' | 'anulada';
}

/**
 * Interface para Detalle de Egreso (Materiales)
 */
export interface DetalleEgresoItem {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  observaciones?: string;
  // Campos auxiliares para UI
  nombre_producto?: string;
  codigo_producto?: string;
  stock_actual?: number;
}

/**
 * Interface para Nuevo Proyecto Supervisado
 */
export interface NuevoProyecto {
  nombre_proyecto: string;
  descripcion?: string;
  ubicacion?: string;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  estado?: 'planificacion' | 'ejecucion' | 'paralizado' | 'finalizado' | 'ACTIVO' | 'INACTIVO';
  hora_ingreso?: string;
  hora_salida?: string;
  es_externo?: boolean;
  es_interno?: boolean;
  id_cliente?: number | null;
  ubicacion_cliente?: string;
  presupuesto_cotizado?: number;
  id_departamento?: number | null;
  area_solicitante?: string;
  centro_costos?: string | null;
}

/**
 * Interface extendida para crear OT con Materiales y Proyecto
 */
export interface CreateFullWorkOrderDTO extends CreateWorkOrderDTO {
  materiales_egreso?: DetalleEgresoItem[];
  nuevo_proyecto?: NuevoProyecto;
  proyecto_id_seleccionado?: number | null;
  proyectos_ids_seleccionados?: number[];
}

/**
 * Interface para Proyecto Supervisado
 */
export interface ProyectoSupervisado {
  id_proyecto: number;
  nombre_proyecto: string;
  estado: string;
  id_ot?: number;
}

/**
 * Interface para Producto de Inventario (Selección)
 */
export interface ProductoSeleccion {
  id_producto: number;
  nombre: string;
  codigo_producto: string;
  stock_actual: number;
  precio_unitario: number;
}

/**
 * Interface para actualizaciones parciales de Orden de Trabajo
 */
export interface UpdateWorkOrderPartialDTO {
  estado?: 'pendiente' | 'en_proceso' | 'pausada' | 'completada' | 'cancelada';
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente' | null;
  id_supervisor?: number;
  fecha_fin_real?: string;
  estado_factura?: 'pendiente' | 'pagada' | 'anulada';
}

/**
 * Interface para una Orden de Trabajo completa
 */
export interface WorkOrder {
  id_ot: number;
  numero_ot: string;
  id_cliente: number;
  representante?: string;
  factura?: string;
  id_cotizacion?: number;
  id_supervisor?: number;
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  fecha_fin_real?: string;
  descripcion_trabajo: string;
  estado: 'pendiente' | 'en_proceso' | 'pausada' | 'completada' | 'cancelada';
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  ubicacion_trabajo?: string;
  total_ot?: number;
  estado_factura?: 'pendiente' | 'pagada' | 'anulada';
  // Datos del JOIN
  cliente_nombre?: string;
  cliente_ruc?: string;
  cliente_email?: string;
  cliente_direccion?: string;
  cliente_contacto?: string;
  supervisor_nombre?: string;
  numero_cotizacion?: string;
  id_proyecto?: number;
  nombre_proyecto?: string;
  // Campos de compatibilidad
  cliente?: string;
  supervisor?: string;

  // Datos relacionados (cargados en detalle)
  materiales_egreso?: DetalleEgresoItem[];
  proyecto?: ProyectoSupervisado;
  proyectos?: ProyectoSupervisado[];
}

export interface QuoteSimple {
  id_cotizacion: number;
  numero_cotizacion: string;
  titulo?: string;
  total?: number;
  id_cliente?: number;
}

/**
 * Interface para Evidencia Fotográfica de OT
 */
export interface EvidencePhoto {
  id_evidencia: number;
  id_ot: number;
  id_usuario: number;
  ruta_imagen: string;
  descripcion?: string;
  fecha_subida: string;
  usuario_nombre?: string;
}

/**
 * Interface genérica para respuestas del API
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

@Injectable({
  providedIn: 'root'
})
export class WorkOrderService {
  // Inyección de dependencias
  private http = inject(HttpClient);

  // URL base del API
  // NOTE: Use the workspace backend path. The /Sergeva deployment is missing `total_ot`
  // in the list endpoint response, which prevents showing totals in the main table.
  private readonly apiUrl = environment.apiUrl;

  // Signals para estado de carga
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Cache de datos para evitar llamadas repetidas
  private clientesCache = signal<Cliente[]>([]);
  private supervisoresCache = signal<Supervisor[]>([]);

  constructor() {
    console.log('🔧 WorkOrderService inicializado');
  }

  // ============================================
  // MÉTODOS PÚBLICOS
  // ============================================

  /**
   * Obtiene el siguiente número secuencial para una nueva OT
   * @returns Promise con el siguiente número de OT (ej: OT-0015)
   */
  async getNextSequential(): Promise<NextSequential> {
    console.log('📊 Obteniendo siguiente secuencial de OT...');

    // Mostrar carga y permitir reintentos en caso de fallo
    this.isLoading.set(true);
    const url = `${this.apiUrl}/ordenes_trabajo.php?action=next_sequential`;
    const maxRetries = 2;
    let lastError: any = null;

    try {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await firstValueFrom(
            this.http.get<ApiResponse<NextSequential>>(url)
          );

          if (response && response.success) {
            console.log('✅ Siguiente secuencial:', response.data.numero_ot);
            this.error.set(null);
            return response.data;
          }

          // Si la respuesta indica failure, lanzar para ir al catch
          throw new Error(response?.message || 'Error al obtener secuencial');
        } catch (err: any) {
          lastError = err;
          console.warn(`⚠️ Intento ${attempt + 1} fallido al obtener secuencial:`, err?.message || err);
          // Esperar un pequeño backoff antes de reintentar (excepto en el último intento)
          if (attempt < maxRetries) {
            await new Promise(res => setTimeout(res, 300 * (attempt + 1)));
          }
        }
      }

      // Si llegamos aquí, todos los intentos fallaron: usar fallback seguro
      console.error('❌ Todos los intentos fallaron obteniendo secuencial:', lastError);
      const year = new Date().getFullYear();
      const fallback: NextSequential = {
        numero_ot: `OT-${year}-0001`,
        secuencial: 1
      };
      this.error.set(typeof lastError === 'string' ? lastError : (lastError?.message || 'Error obteniendo secuencial'));
      return fallback;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Obtiene la lista de clientes disponibles
   * @param forceRefresh - Si es true, ignora el cache
   * @returns Promise con array de clientes
   */
  async getClientes(forceRefresh: boolean = false): Promise<Cliente[]> {
    // Retornar del cache si existe y no se fuerza refresh
    if (!forceRefresh && this.clientesCache().length > 0) {
      console.log('📦 Retornando clientes desde cache');
      return this.clientesCache();
    }

    console.log('📋 Obteniendo lista de clientes...');

    try {
      const url = `${this.apiUrl}/ordenes_trabajo.php?action=get_clients`;
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Cliente[]>>(url)
      );

      if (response.success) {
        console.log('✅ Clientes obtenidos:', response.data.length);
        this.clientesCache.set(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Error al obtener clientes');
      }
    } catch (error: any) {
      console.error('❌ Error obteniendo clientes:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de supervisores disponibles
   * @param forceRefresh - Si es true, ignora el cache
   * @returns Promise con array de supervisores
   */
  async getSupervisores(forceRefresh: boolean = false): Promise<Supervisor[]> {
    // Retornar del cache si existe y no se fuerza refresh
    if (!forceRefresh && this.supervisoresCache().length > 0) {
      console.log('📦 Retornando supervisores desde cache');
      return this.supervisoresCache();
    }

    console.log('👷 Obteniendo lista de supervisores...');

    try {
      const url = `${this.apiUrl}/ordenes_trabajo.php?action=get_supervisors`;
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Supervisor[]>>(url)
      );

      if (response.success) {
        console.log('✅ Supervisores obtenidos:', response.data.length);
        this.supervisoresCache.set(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Error al obtener supervisores');
      }
    } catch (error: any) {
      console.error('❌ Error obteniendo supervisores:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de cotizaciones disponibles
   */
  async getAvailableQuotes(): Promise<QuoteSimple[]> {
    console.log('📄 Obteniendo cotizaciones...');
    try {
      const url = `${this.apiUrl}/cotizaciones.php`;
      const response = await firstValueFrom(
        this.http.get<ApiResponse<QuoteSimple[]>>(url)
      );

      if (response.success) {
        return response.data;
      } else {
        console.warn('⚠️ No se pudieron cargar cotizaciones:', response.message);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Error obteniendo cotizaciones:', error);
      return [];
    }
  }

  /**
   * Crea una nueva Orden de Trabajo
   * @param orderData - Datos de la nueva orden
   * @returns Promise con la orden creada
   */
  async createWorkOrder(orderData: CreateWorkOrderDTO): Promise<WorkOrder> {
    console.log('📝 Creando nueva orden de trabajo...');
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const url = `${this.apiUrl}/ordenes_trabajo.php`;

      // Log de datos enviados (sin información sensible)
      console.log('📤 Enviando datos:', {
        ...orderData,
        descripcion_trabajo: orderData.descripcion_trabajo?.substring(0, 50) + '...'
      });

      const response = await firstValueFrom(
        this.http.post<ApiResponse<WorkOrder>>(url, orderData)
      );

      if (response.success) {
        console.log('✅ Orden creada exitosamente:', response.data.numero_ot);
        return response.data;
      } else {
        throw new Error(response.message || 'Error al crear la orden');
      }
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Error desconocido';
      console.error('❌ Error creando orden:', errorMessage);
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Obtiene la lista de proyectos disponibles
   */
  async getProyectosDisponibles(): Promise<ProyectoSupervisado[]> {
    try {
      const url = `${this.apiUrl}/proyectos.php`;
      const response = await firstValueFrom(
        this.http.get<ApiResponse<ProyectoSupervisado[]>>(url)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error obteniendo proyectos:', error);
      return [];
    }
  }

  /**
   * Obtiene el detalle completo de una cotización por ID
   */
  async getQuoteById(id_cotizacion: number): Promise<any | null> {
    try {
      const url = `${this.apiUrl}/cotizaciones.php?action=detalle&id=${id_cotizacion}`;
      const response = await firstValueFrom(this.http.get<any>(url));
      if (response && response.success) return response.data;
      console.warn('No se obtuvo detalle de cotización:', response?.message);
      return null;
    } catch (error) {
      console.error('Error obteniendo detalle de cotización:', error);
      return null;
    }
  }

  /**
   * Obtiene el detalle completo de un proyecto por ID
   */
  async getProjectById(id_proyecto: number): Promise<ProyectoSupervisado | null> {
    try {
      const url = `${this.apiUrl}/proyectos.php?id_proyecto=${id_proyecto}`;
      const response = await firstValueFrom(this.http.get<ApiResponse<ProyectoSupervisado[]>>(url));

      if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }

      console.warn('No se obtuvo detalle de proyecto:', response?.message);
      return null;
    } catch (error) {
      console.error('Error obteniendo detalle de proyecto:', error);
      return null;
    }
  }

  /**
   * Obtiene el inventario para selección
   */
  async getInventarioParaSeleccion(onlyActive: boolean = false): Promise<ProductoSeleccion[]> {
    try {
      const url = `${this.apiUrl}/productos.php\${onlyActive ? '?solo_activos=1' : ''}`;
      const response = await firstValueFrom(
        this.http.get<ApiResponse<ProductoSeleccion[]>>(url)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error obteniendo inventario:', error);
      return [];
    }
  }

  /**
   * Crea una Orden de Trabajo completa con materiales y proyecto opcional
   */
  async saveFullWorkOrder(data: CreateFullWorkOrderDTO): Promise<WorkOrder> {
    console.log('📝 Creando orden de trabajo completa...');
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const url = `${this.apiUrl}/ordenes_trabajo.php`;

      // Log de datos enviados
      console.log('📤 Enviando datos completos:', {
        ...data,
        action: 'create_full'
      });

      const response = await firstValueFrom(
        this.http.post<ApiResponse<WorkOrder>>(url, {
          ...data,
          action: 'create_full'
        })
      );

      if (response.success) {
        console.log('✅ Orden completa creada exitosamente:', response.data.numero_ot);
        return response.data;
      } else {
        throw new Error(response.message || 'Error al crear la orden completa');
      }
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Error desconocido';
      console.error('❌ Error creando orden completa:', errorMessage);
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Actualiza una Orden de Trabajo existente
   * @param id - ID de la orden a actualizar
   * @param orderData - Datos actualizados de la orden
   * @returns Promise con la orden actualizada
   */
  async updateWorkOrder(id: number, orderData: CreateWorkOrderDTO): Promise<WorkOrder> {
    console.log('📝 Actualizando orden de trabajo...', id);
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const url = `${this.apiUrl}/ordenes_trabajo.php`;
      const dataToSend = { ...orderData, id_ot: id };

      // Log de datos enviados
      console.log('📤 Enviando datos actualización:', {
        id_ot: id,
        ...orderData,
        descripcion_trabajo: orderData.descripcion_trabajo?.substring(0, 50) + '...'
      });

      const response = await firstValueFrom(
        this.http.put<ApiResponse<WorkOrder>>(url, dataToSend)
      );

      if (response.success) {
        console.log('✅ Orden actualizada exitosamente:', response.data.numero_ot);
        return response.data;
      } else {
        throw new Error(response.message || 'Error al actualizar la orden');
      }
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Error desconocido';
      console.error('❌ Error actualizando orden:', errorMessage);
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Actualiza campos específicos de una orden de trabajo (actualización parcial)
   * @param id ID de la orden a actualizar
   * @param partialData Datos parciales a actualizar
   * @returns Promise con la orden actualizada
   */
  async updateWorkOrderPartial(id: number, partialData: UpdateWorkOrderPartialDTO): Promise<void> {
    console.log('📝 Actualizando campo de orden...', id, partialData);
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const url = `${this.apiUrl}/ordenes_trabajo.php`;
      const payload = {
        id_ot: id,
        action: 'update_partial',
        ...partialData
      };

      const response = await firstValueFrom(
        this.http.put<ApiResponse<any>>(url, payload)
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar');
      }

      console.log('✅ Campo actualizado exitosamente');
    } catch (error: any) {
      const errorMsg = error?.error?.message || error?.message || 'Error al actualizar orden';
      console.error('❌ Error:', errorMsg);
      this.error.set(errorMsg);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Elimina una Orden de Trabajo
   * @param id - ID de la orden a eliminar
   * @returns Promise con confirmación
   */
  async deleteWorkOrder(id: number): Promise<void> {
    console.log('🗑️ Eliminando orden de trabajo...', id);
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const url = `${this.apiUrl}/ordenes_trabajo.php?id=${id}`;

      const response = await firstValueFrom(
        this.http.delete<ApiResponse<any>>(url)
      );

      if (response.success) {
        console.log('✅ Orden eliminada exitosamente');
      } else {
        throw new Error(response.message || 'Error al eliminar la orden');
      }
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Error desconocido';
      console.error('❌ Error eliminando orden:', errorMessage);
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Obtiene todas las órdenes de trabajo
   * @returns Promise con array de órdenes de trabajo
   */
  async getWorkOrders(): Promise<WorkOrder[]> {
    console.log('📋 Obteniendo órdenes de trabajo...');

    try {
      // Add timestamp to prevent caching
      const url = `${this.apiUrl}/ordenes_trabajo.php?t=${new Date().getTime()}`;
      const response = await firstValueFrom(
        this.http.get<ApiResponse<WorkOrder[]>>(url)
      );

      if (response.success) {
        console.log('✅ Órdenes obtenidas:', response.data.length);
        return response.data;
      } else {
        throw new Error(response.message || 'Error al obtener órdenes');
      }
    } catch (error: any) {
      console.error('❌ Error obteniendo órdenes:', error);
      throw error;
    }
  }

  /**
   * Obtiene una Orden de Trabajo por ID con detalles completos
   */
  async getWorkOrderById(id: number): Promise<WorkOrder & { materiales_egreso?: DetalleEgresoItem[] }> {
    console.log('📋 Obteniendo detalle de OT...', id);
    try {
      const url = `${this.apiUrl}/ordenes_trabajo.php?id=${id}`;
      const response = await firstValueFrom(
        this.http.get<ApiResponse<WorkOrder & { materiales_egreso?: DetalleEgresoItem[] }>>(url)
      );

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error al obtener detalle de OT');
      }
    } catch (error) {
      console.error('❌ Error obteniendo detalle de OT:', error);
      throw error;
    }
  }

  /**
   * Genera un número de factura de ejemplo (simula Contifico)
   * @returns String con número de factura simulado
   */
  generateSampleInvoiceNumber(): string {
    // Simula el formato de factura de Contifico
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `FAC-${year}-${random}`;
  }

  /**
   * Obtiene la fecha actual formateada para inputs de tipo date
   * @returns String con fecha en formato YYYY-MM-DD
   */
  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Limpia el cache de clientes y supervisores
   */
  clearCache(): void {
    this.clientesCache.set([]);
    this.supervisoresCache.set([]);
    console.log('🗑️ Cache limpiado');
  }

  // ============================================
  // MÉTODOS DE EVIDENCIA FOTOGRÁFICA
  // ============================================

  /**
   * Sube una evidencia fotográfica para una OT
   * @param idOt - ID de la orden de trabajo
   * @param idUsuario - ID del usuario que sube la evidencia
   * @param file - Archivo de imagen
   * @param descripcion - Descripción opcional de la evidencia
   * @returns Promise con la evidencia creada
   */
  async uploadEvidence(
    idOt: number,
    idUsuario: number,
    file: File,
    descripcion?: string
  ): Promise<EvidencePhoto> {
    console.log('📸 Subiendo evidencia fotográfica...');
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const url = `${this.apiUrl}/upload_evidence.php`;

      // Crear FormData para enviar archivo
      const formData = new FormData();
      formData.append('imagen', file);
      formData.append('id_ot', idOt.toString());
      formData.append('id_usuario', idUsuario.toString());
      if (descripcion) {
        formData.append('descripcion', descripcion);
      }

      const response = await firstValueFrom(
        this.http.post<ApiResponse<EvidencePhoto>>(url, formData)
      );

      if (response.success) {
        console.log('✅ Evidencia subida exitosamente:', response.data.id_evidencia);
        return response.data;
      } else {
        throw new Error(response.message || 'Error al subir evidencia');
      }
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Error al subir evidencia';
      console.error('❌ Error subiendo evidencia:', errorMessage);
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Obtiene todas las evidencias fotográficas de una OT
   * @param idOt - ID de la orden de trabajo
   * @returns Promise con array de evidencias
   */
  async getEvidences(idOt: number): Promise<EvidencePhoto[]> {
    console.log('📋 Obteniendo evidencias de OT...', idOt);

    try {
      const url = `${this.apiUrl}/upload_evidence.php?id_ot=${idOt}`;
      const response = await firstValueFrom(
        this.http.get<ApiResponse<EvidencePhoto[]>>(url)
      );

      if (response.success) {
        console.log('✅ Evidencias obtenidas:', response.data.length);
        return response.data;
      } else {
        throw new Error(response.message || 'Error al obtener evidencias');
      }
    } catch (error: any) {
      console.error('❌ Error obteniendo evidencias:', error);
      return []; // Retornar array vacío en caso de error
    }
  }

  /**
   * Elimina una evidencia fotográfica
   * @param idEvidencia - ID de la evidencia a eliminar
   * @returns Promise con confirmación
   */
  async deleteEvidence(idEvidencia: number): Promise<void> {
    console.log('🗑️ Eliminando evidencia...', idEvidencia);
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const url = `${this.apiUrl}/upload_evidence.php?id_evidencia=${idEvidencia}`;
      const response = await firstValueFrom(
        this.http.delete<ApiResponse<any>>(url)
      );

      if (response.success) {
        console.log('✅ Evidencia eliminada exitosamente');
      } else {
        throw new Error(response.message || 'Error al eliminar evidencia');
      }
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Error al eliminar evidencia';
      console.error('❌ Error eliminando evidencia:', errorMessage);
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }
}
