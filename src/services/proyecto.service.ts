import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { Proyecto } from './proyecto.models';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Crear un nuevo proyecto supervisado con horarios
   */
  async crearProyecto(proyecto: Partial<Proyecto>): Promise<Proyecto> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/proyectos.php`, proyecto)
      );

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error al crear proyecto');
      }
    } catch (error: any) {
      console.error('Error creando proyecto:', error);
      throw new Error(error.error?.message || 'Error al crear proyecto');
    }
  }

  /**
   * Obtener todos los proyectos de un supervisor
   */
  async obtenerProyectosPorSupervisor(idSupervisor: number): Promise<Proyecto[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/proyectos.php?id_supervisor=${idSupervisor}`)
      );

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error al obtener proyectos');
      }
    } catch (error: any) {
      console.error('Error obteniendo proyectos:', error);
      return [];
    }
  }

  /**
   * Obtener proyecto por OT
   */
  async obtenerProyectoPorOT(idOT: number): Promise<Proyecto | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/proyectos.php?id_ot=${idOT}`)
      );

      if (response.success && response.data.length > 0) {
        return response.data[0];
      } else {
        return null;
      }
    } catch (error: any) {
      console.error('Error obteniendo proyecto por OT:', error);
      return null;
    }
  }

  /**
   * Obtener proyecto por ID
   */
  async obtenerProyectoPorId(idProyecto: number): Promise<Proyecto | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/proyectos.php?id_proyecto=${idProyecto}`)
      );

      if (response.success && response.data.length > 0) {
        return response.data[0];
      } else {
        return null;
      }
    } catch (error: any) {
      console.error('Error obteniendo proyecto por ID:', error);
      return null;
    }
  }

  /**
   * Actualizar horarios de un proyecto
   */
  async actualizarHorarios(
    idProyecto: number,
    horaIngreso: string,
    horaSalida: string
  ): Promise<Proyecto> {
    try {
      const response = await firstValueFrom(
        this.http.put<any>(`${this.apiUrl}/proyectos.php`, {
          id_proyecto: idProyecto,
          hora_ingreso: horaIngreso,
          hora_salida: horaSalida
        })
      );

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error al actualizar horarios');
      }
    } catch (error: any) {
      console.error('Error actualizando horarios:', error);
      throw new Error(error.error?.message || 'Error al actualizar horarios');
    }
  }

  /**
   * Actualizar proyecto completo
   */
  async actualizarProyecto(proyecto: Proyecto): Promise<Proyecto> {
    try {
      const response = await firstValueFrom(
        this.http.put<any>(`${this.apiUrl}/proyectos.php`, proyecto)
      );

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error al actualizar proyecto');
      }
    } catch (error: any) {
      console.error('Error actualizando proyecto:', error);
      throw new Error(error.error?.message || 'Error al actualizar proyecto');
    }
  }

  /**
   * Cambiar estado de un proyecto (ACTIVO/INACTIVO)
   */
  async cambiarEstado(idProyecto: number, estado: 'ACTIVO' | 'INACTIVO'): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.put<any>(`${this.apiUrl}/proyectos.php`, {
          id_proyecto: idProyecto,
          estado: estado
        })
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al cambiar estado');
      }
    } catch (error: any) {
      console.error('Error cambiando estado:', error);
      throw new Error(error.error?.message || 'Error al cambiar estado');
    }
  }

  /**
   * Obtener todos los proyectos activos
   */
  async obtenerProyectosActivos(): Promise<Proyecto[]> {
    try {
      const url = `${this.apiUrl}/proyectos.php?estado=ACTIVO`;
      console.log('🔵 [PROYECTO-SERVICE] Llamando a:', url);

      const response = await firstValueFrom(
        this.http.get<any>(url)
      );

      console.log('🔵 [PROYECTO-SERVICE] Respuesta del servidor:', response);
      console.log('🔵 [PROYECTO-SERVICE] response.success:', response.success);
      console.log('🔵 [PROYECTO-SERVICE] response.data:', response.data);
      console.log('🔵 [PROYECTO-SERVICE] Cantidad:', response.data?.length);

      if (response.success) {
        console.log('✅ [PROYECTO-SERVICE] Retornando proyectos:', response.data.length);
        return response.data;
      } else {
        console.warn('⚠️ [PROYECTO-SERVICE] Response.success es false');
        return [];
      }
    } catch (error: any) {
      console.error('❌ [PROYECTO-SERVICE] Error:', error);
      return [];
    }
  }

  /**
   * Obtener TODOS los proyectos (activos e inactivos)
   */
  async obtenerTodosLosProyectos(): Promise<Proyecto[]> {
    try {
      const url = `${this.apiUrl}/proyectos.php`;
      console.log('🔵 [PROYECTO-SERVICE] Obteniendo todos los proyectos:', url);

      const response = await firstValueFrom(
        this.http.get<any>(url)
      );

      if (response.success) {
        console.log('✅ [PROYECTO-SERVICE] Proyectos totales:', response.data.length);
        return response.data;
      } else {
        console.warn('⚠️ [PROYECTO-SERVICE] Response.success es false');
        return [];
      }
    } catch (error: any) {
      console.error('❌ [PROYECTO-SERVICE] Error obteniendo todos los proyectos:', error);
      return [];
    }
  }

  /**
   * Eliminar un proyecto
   */
  async eliminarProyecto(idProyecto: number): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.delete<any>(`${this.apiUrl}/proyectos.php?id_proyecto=${idProyecto}`)
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar proyecto');
      }
    } catch (error: any) {
      console.error('Error eliminando proyecto:', error);
      throw new Error(error.error?.message || 'Error al eliminar proyecto');
    }
  }
}
