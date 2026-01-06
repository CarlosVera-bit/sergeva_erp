import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface PurchaseOrderDetail {
  id_detalle?: number;
  id_pedido?: number;
  id_producto: number;
  producto_nombre?: string;
  codigo_producto?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id_pedido: number;
  numero_pedido: string;
  id_proveedor: number;
  proveedor_nombre?: string;
  fecha_pedido: string;
  estado: 'borrador' | 'enviado' | 'confirmado' | 'recibido' | 'cancelado';
  total: number;
  observaciones?: string;
  detalles?: PurchaseOrderDetail[];
  items_count?: number;
}

export interface CreatePurchaseOrderDTO {
  numero_pedido?: string;
  id_proveedor: number;
  id_solicitante?: number;
  id_ot?: number | null;
  fecha_pedido: string;
  estado: string;
  total: number;
  observaciones?: string;
  detalles: PurchaseOrderDetail[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PurchasingService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost/sergeva-os/backend/api/pedidos_compra.php';
  private readonly providersUrl = 'http://localhost/sergeva-os/backend/api/proveedores.php';

  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  async getProviders(): Promise<any[]> {
    try {
      const response = await firstValueFrom(this.http.get<ApiResponse<any[]>>(this.providersUrl));
      return response.success ? response.data : [];
    } catch (e) {
      console.error('Error loading providers', e);
      return [];
    }
  }

  async getOrders(): Promise<PurchaseOrder[]> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(this.http.get<ApiResponse<PurchaseOrder[]>>(this.apiUrl));
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error al cargar pedidos');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getOrderById(id: number): Promise<PurchaseOrder> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.http.get<ApiResponse<PurchaseOrder>>(`${this.apiUrl}?id=${id}`));
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error al cargar pedido');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async createOrder(order: CreatePurchaseOrderDTO): Promise<any> {
    console.log('🔵 [SERVICE] createOrder - Datos a enviar:', JSON.stringify(order, null, 2));
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.http.post<ApiResponse<any>>(this.apiUrl, order));
      console.log('🔵 [SERVICE] createOrder - Respuesta recibida:', response);
      if (response.success) {
        return response.data;
      } else {
        console.error('❌ [SERVICE] createOrder - Error en respuesta:', response.message);
        throw new Error(response.message);
      }
    } catch (e: any) {
      console.error('❌ [SERVICE] createOrder - Error HTTP:', e);
      console.error('❌ [SERVICE] createOrder - Error status:', e?.status);
      console.error('❌ [SERVICE] createOrder - Error body:', e?.error);
      this.error.set(e.message || 'Error al crear pedido');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateOrder(id: number, order: CreatePurchaseOrderDTO): Promise<any> {
    this.isLoading.set(true);
    try {
      const payload = { ...order, id_pedido: id };
      const response = await firstValueFrom(this.http.put<ApiResponse<any>>(this.apiUrl, payload));
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error al actualizar pedido');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteOrder(id: number): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.http.delete<ApiResponse<any>>(`${this.apiUrl}?id=${id}`));
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error al eliminar pedido');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateOrderStatus(id: number, status: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.http.put<ApiResponse<any>>(this.apiUrl, { id_pedido: id, estado: status }));
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error al actualizar estado');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }
}