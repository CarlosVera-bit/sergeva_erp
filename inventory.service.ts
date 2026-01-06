/**
 * @fileoverview Servicio para gestión de Inventario
 * Maneja operaciones CRUD para productos e inventario
 * @author Sergeva OS
 * @version 1.0.0
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// ============================================
// INTERFACES - Definición de tipos de datos
// ============================================

/**
 * Interface para crear/actualizar un Item de Inventario
 */
export interface CreateInventoryItemDTO {
  codigo_producto: string;
  nombre: string;
  descripcion?: string;
  valor_medida?: number;
  unidad_medida?: string;
  stock_actual: number;
  stock_minimo: number;
  ubicacion_bodega: string;
  precio_compra?: number;
  precio_venta?: number;
  categoria?: string;
}

/**
 * Interface para un Item de Inventario completo
 */
export interface InventoryItem {
  id_producto: number;
  codigo_producto: string;
  nombre: string;
  descripcion?: string;
  valor_medida?: number;
  unidad_medida?: string;
  stock_actual: number;
  stock_minimo: number;
  ubicacion_bodega: string;
  precio_compra?: number;
  precio_venta?: number;
  categoria?: string;
  ultima_actualizacion?: string;
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
export class InventoryService {
  // Inyección de dependencias
  private http = inject(HttpClient);
  
  // URL base del API
  private readonly apiUrl = 'http://localhost/sergeva-os/backend/api';
  
  // Signals para estado de carga
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor() {
    console.log('📦 InventoryService inicializado');
  }

  // ============================================
  // MÉTODOS PÚBLICOS
  // ============================================

  /**
   * Obtiene el inventario completo
   * @returns Promise con array de items de inventario
   */
  async getInventory(): Promise<InventoryItem[]> {
    console.log('📋 Obteniendo inventario...');
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const url = `${this.apiUrl}/inventario.php`;
      const response = await firstValueFrom(
        this.http.get<ApiResponse<InventoryItem[]>>(url)
      );
      
      if (response.success) {
        console.log('✅ Inventario obtenido:', response.data.length);
        return response.data;
      } else {
        throw new Error(response.message || 'Error al obtener inventario');
      }
    } catch (error: any) {
      console.error('❌ Error obteniendo inventario:', error);
      this.error.set(error.message || 'Error de conexión');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Crea un nuevo item en el inventario
   * @param itemData - Datos del nuevo item
   * @returns Promise con el item creado
   */
  async createItem(itemData: CreateInventoryItemDTO): Promise<InventoryItem> {
    console.log('📝 Creando nuevo item de inventario...');
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const url = `${this.apiUrl}/inventario.php`;
      
      console.log('📤 Enviando datos:', itemData);
      
      const response = await firstValueFrom(
        this.http.post<ApiResponse<InventoryItem>>(url, itemData)
      );
      
      if (response.success) {
        console.log('✅ Item creado exitosamente:', response.data.codigo_producto);
        return response.data;
      } else {
        throw new Error(response.message || 'Error al crear el item');
      }
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Error desconocido';
      console.error('❌ Error creando item:', errorMessage);
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Actualiza un item existente
   * @param id - ID del producto a actualizar
   * @param itemData - Datos actualizados
   * @returns Promise con el item actualizado
   */
  async updateItem(id: number, itemData: CreateInventoryItemDTO): Promise<InventoryItem> {
    console.log('📝 Actualizando item...', id);
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const url = `${this.apiUrl}/inventario.php`;
      const dataToSend = { ...itemData, id_producto: id };
      
      console.log('📤 Enviando datos actualización:', dataToSend);
      
      const response = await firstValueFrom(
        this.http.put<ApiResponse<InventoryItem>>(url, dataToSend)
      );
      
      if (response.success) {
        console.log('✅ Item actualizado exitosamente');
        return response.data;
      } else {
        throw new Error(response.message || 'Error al actualizar el item');
      }
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Error desconocido';
      console.error('❌ Error actualizando item:', errorMessage);
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Elimina un item del inventario (baja lógica o física)
   * @param id - ID del producto a eliminar
   * @returns Promise con confirmación
   */
  async deleteItem(id: number): Promise<void> {
    console.log('🗑️ Eliminando item...', id);
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const url = `${this.apiUrl}/inventario.php?id=${id}`;
      
      const response = await firstValueFrom(
        this.http.delete<ApiResponse<any>>(url)
      );
      
      if (response.success) {
        console.log('✅ Item eliminado exitosamente');
      } else {
        throw new Error(response.message || 'Error al eliminar el item');
      }
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || 'Error desconocido';
      console.error('❌ Error eliminando item:', errorMessage);
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }
}
