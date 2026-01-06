import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

export interface Proveedor {
  id_proveedor: number;
  ruc: string;
  nombre_razon_social: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  activo: number;
  fecha_registro?: string;
}

export interface CreateProveedorDTO {
  ruc: string;
  nombre_razon_social: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  activo: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + '/proveedores.php';

  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  async getProveedores(): Promise<Proveedor[]> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(this.http.get<ApiResponse<Proveedor[]>>(this.apiUrl));
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error al cargar proveedores');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async createProveedor(proveedor: CreateProveedorDTO): Promise<Proveedor> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.http.post<ApiResponse<Proveedor>>(this.apiUrl, proveedor));
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error al crear proveedor');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateProveedor(id: number, proveedor: CreateProveedorDTO): Promise<Proveedor> {
    this.isLoading.set(true);
    try {
      const payload = { ...proveedor, id_proveedor: id };
      const response = await firstValueFrom(this.http.put<ApiResponse<Proveedor>>(this.apiUrl, payload));
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error al actualizar proveedor');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteProveedor(id: number): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.http.delete<ApiResponse<any>>(`${this.apiUrl}?id=${id}`));
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error al eliminar proveedor');
      throw e;
    } finally {
      this.isLoading.set(false);
    }
  }
}
