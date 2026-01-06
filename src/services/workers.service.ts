import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

export interface Worker {
    id_trabajador: number;
    cedula: string;
    nombres: string;
    apellidos: string;
    email?: string;
    password?: string;
    telefono?: string;
    direccion?: string;
    tipo_contrato: 'afiliado' | 'por_horas' | 'temporal';
    especialidad?: string;
    fecha_ingreso: string;
    estado: 'activo' | 'inactivo' | 'vacaciones' | 'suspendido';
    tarifa_hora?: number;
    fecha_registro?: string;
}

export interface CreateWorkerDTO {
    cedula: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    direccion?: string;
    tipo_contrato: 'afiliado' | 'por_horas' | 'temporal';
    especialidad?: string;
    fecha_ingreso: string;
    estado: 'activo' | 'inactivo' | 'vacaciones' | 'suspendido';
    tarifa_hora?: number;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class WorkersService {
    private http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl + '/trabajadores.php';

    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    /**
     * Generate email preview from worker's name
     * Format: first letter of first name + first last name + [ID] + @sergeva.com
     * Note: The actual ID will be added by the backend after creation
     * Example: Carlos Pablo Vera Romero -> cvera[ID]@sergeva.com
     */
    generateEmail(nombres: string, apellidos: string): string {
        if (!nombres || !apellidos) return '';

        // Get first letter of first name
        const firstNameInitial = nombres.trim().split(' ')[0][0].toLowerCase();

        // Get first last name
        const firstLastName = apellidos.trim().split(' ')[0].toLowerCase();

        // Remove accents and special characters
        const cleanLastName = this.removeAccents(firstLastName);

        return `${firstNameInitial}${cleanLastName}[ID]@sergeva.com`;
    }

    /**
     * Generate password preview from email
     * Format: email prefix (without [ID]) + 123**
     * Example: cvera[ID]@sergeva.com -> cvera123**
     */
    generatePassword(email: string): string {
        if (!email) return '';
        const emailPrefix = email.split('@')[0].replace('[ID]', '');
        return `${emailPrefix}123**`;
    }

    /**
     * Remove accents from string
     */
    private removeAccents(str: string): string {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    async getWorkers(): Promise<Worker[]> {
        this.isLoading.set(true);
        this.error.set(null);
        try {
            const response = await firstValueFrom(this.http.get<ApiResponse<Worker[]>>(this.apiUrl));
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message);
            }
        } catch (e: any) {
            this.error.set(e.message || 'Error al cargar trabajadores');
            throw e;
        } finally {
            this.isLoading.set(false);
        }
    }

    async createWorker(worker: CreateWorkerDTO): Promise<Worker> {
        this.isLoading.set(true);
        try {
            const response = await firstValueFrom(this.http.post<ApiResponse<Worker>>(this.apiUrl, worker));
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message);
            }
        } catch (e: any) {
            this.error.set(e.message || 'Error al crear trabajador');
            throw e;
        } finally {
            this.isLoading.set(false);
        }
    }

    async updateWorker(id: number, worker: CreateWorkerDTO): Promise<Worker> {
        this.isLoading.set(true);
        try {
            const payload = { ...worker, id_trabajador: id };
            const response = await firstValueFrom(this.http.put<ApiResponse<Worker>>(this.apiUrl, payload));
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message);
            }
        } catch (e: any) {
            this.error.set(e.message || 'Error al actualizar trabajador');
            throw e;
        } finally {
            this.isLoading.set(false);
        }
    }

    async deleteWorker(id: number): Promise<void> {
        this.isLoading.set(true);
        try {
            const response = await firstValueFrom(this.http.delete<ApiResponse<any>>(`${this.apiUrl}?id=${id}`));
            if (!response.success) {
                throw new Error(response.message);
            }
        } catch (e: any) {
            this.error.set(e.message || 'Error al eliminar trabajador');
            throw e;
        } finally {
            this.isLoading.set(false);
        }
    }
}
