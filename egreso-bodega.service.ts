import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface EgresoBodegaDetail {
  id_detalle?: number;
  id_egreso?: number;
  id_producto: number;
  producto_nombre?: string;
  codigo_producto?: string;
  cantidad: number;
  notas?: string;
}

export interface EgresoBodega {
  id_egreso: number;
  numero_egreso: string;
  fecha_egreso: string;
  id_ot: number;
  ot_numero?: string;
  id_cliente: number;
  cliente_nombre?: string;
  id_autorizado_por: number;
  autorizado_por_nombre?: string;
  destino?: string; // Deprecated but kept for compatibility if needed
  solicitante?: string; // Deprecated but kept for compatibility if needed
  estado?: 'borrador' | 'completado' | 'cancelado';
  observaciones?: string;
  detalles?: EgresoBodegaDetail[];
  items_count?: number;
  valor_total?: number;
}

export interface CreateEgresoBodegaDTO {
  numero_egreso?: string;
  fecha_egreso: string;
  id_ot: number;
  id_cliente?: number;
  id_autorizado_por?: number;
  destino?: string; // Optional now
  solicitante?: string; // Optional now
  observaciones?: string;
  detalles: EgresoBodegaDetail[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class EgresoBodegaService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost/sergeva-os/backend/api/egresos_bodega.php';

  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  async getEgresos(): Promise<EgresoBodega[]> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(this.http.get<ApiResponse<EgresoBodega[]>>(this.apiUrl));
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error al cargar egresos');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getEgresoById(id: number): Promise<EgresoBodega> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.http.get<ApiResponse<EgresoBodega>>(`${this.apiUrl}?id=${id}`));
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error al cargar egreso');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async createEgreso(egreso: CreateEgresoBodegaDTO): Promise<any> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.http.post<ApiResponse<any>>(this.apiUrl, egreso));
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (e: any) {
      // El backend devolverá el mensaje de stock insuficiente aquí
      this.error.set(e.message || 'Error al crear egreso');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateEgreso(id: number, egreso: CreateEgresoBodegaDTO): Promise<any> {
    this.isLoading.set(true);
    try {
      const payload = { ...egreso, id_egreso: id };
      const response = await firstValueFrom(this.http.put<ApiResponse<any>>(this.apiUrl, payload));
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error al actualizar egreso');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteEgreso(id: number): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.http.delete<ApiResponse<any>>(`${this.apiUrl}?id=${id}`));
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error al eliminar egreso');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }
}
