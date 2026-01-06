import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PrestamoDual, SolicitudPrestamo, ConfirmacionPrestamo } from './proyecto.models';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrestamoPersonalService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Solicitar préstamo de personal (PRESTAMISTA crea la solicitud)
   */
  async solicitarPrestamo(solicitud: SolicitudPrestamo): Promise<PrestamoDual> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/prestamos_personal.php`, solicitud)
      );

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error al solicitar préstamo');
      }
    } catch (error: any) {
      console.error('Error solicitando préstamo:', error);
      throw new Error(error.error?.message || 'Error al solicitar préstamo');
    }
  }

  /**
   * Obtener préstamos donde el usuario actual es PRESTAMISTA
   */
  async obtenerPrestamosComoPrestamista(idSupervisor: number): Promise<PrestamoDual[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/prestamos_personal.php?id_supervisor_prestamista=${idSupervisor}`)
      );

      if (response.success) {
        return response.data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('Error obteniendo préstamos como prestamista:', error);
      return [];
    }
  }

  /**
   * Obtener préstamos donde el usuario actual es PRESTATARIO
   */
  async obtenerPrestamosComoPrestatario(idSupervisor: number): Promise<PrestamoDual[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/prestamos_personal.php?id_supervisor_prestatario=${idSupervisor}`)
      );

      if (response.success) {
        return response.data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('Error obteniendo préstamos como prestatario:', error);
      return [];
    }
  }

  /**
   * Confirmar fin de jornada en proyecto origen (PRESTAMISTA)
   */
  async confirmarFin(confirmacion: ConfirmacionPrestamo): Promise<PrestamoDual> {
    try {
      const response = await firstValueFrom(
        this.http.put<any>(`${this.apiUrl}/prestamos_personal.php`, {
          ...confirmacion,
          accion: 'CONFIRMAR_FIN'
        })
      );

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error al confirmar fin');
      }
    } catch (error: any) {
      console.error('Error confirmando fin:', error);
      throw new Error(error.error?.message || 'Error al confirmar fin');
    }
  }

  /**
   * Confirmar inicio de jornada en proyecto destino (PRESTATARIO)
   */
  async confirmarInicio(confirmacion: ConfirmacionPrestamo): Promise<PrestamoDual> {
    try {
      const response = await firstValueFrom(
        this.http.put<any>(`${this.apiUrl}/prestamos_personal.php`, {
          ...confirmacion,
          accion: 'CONFIRMAR_INICIO'
        })
      );

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error al confirmar inicio');
      }
    } catch (error: any) {
      console.error('Error confirmando inicio:', error);
      throw new Error(error.error?.message || 'Error al confirmar inicio');
    }
  }

  /**
   * Obtener préstamo pendiente para un empleado en fecha específica
   */
  async obtenerPrestamoPendiente(idEmpleado: number, fecha: string): Promise<PrestamoDual | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/prestamos_personal.php?id_empleado=${idEmpleado}&fecha=${fecha}&pendiente=true`)
      );

      if (response.success && response.data.length > 0) {
        return response.data[0];
      } else {
        return null;
      }
    } catch (error: any) {
      console.error('Error obteniendo préstamo pendiente:', error);
      return null;
    }
  }

  /**
   * Obtener todos los préstamos pendientes de confirmación (como prestatario)
   */
  async obtenerPrestamosPendientesConfirmacion(idSupervisor: number): Promise<PrestamoDual[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/prestamos_personal.php?id_supervisor_prestatario=${idSupervisor}&estado_prestatario=PENDIENTE`)
      );

      if (response.success) {
        return response.data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('Error obteniendo préstamos pendientes:', error);
      return [];
    }
  }

  /**
   * Rechazar un préstamo (PRESTATARIO)
   */
  async rechazarPrestamo(idPrestamo: number, motivo: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.put<any>(`${this.apiUrl}/prestamos_personal.php`, {
          id_prestamo: idPrestamo,
          accion: 'RECHAZAR',
          observaciones: motivo
        })
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al rechazar préstamo');
      }
    } catch (error: any) {
      console.error('Error rechazando préstamo:', error);
      throw new Error(error.error?.message || 'Error al rechazar préstamo');
    }
  }

  /**
   * Calcular tiempo de traslado entre dos proyectos
   */
  calcularTiempoTraslado(horaFin: string, horaInicio: string): number {
    const [hFin, mFin] = horaFin.split(':').map(Number);
    const [hInicio, mInicio] = horaInicio.split(':').map(Number);

    const minutosFinales = hInicio * 60 + mInicio;
    const minutosIniciales = hFin * 60 + mFin;

    return minutosFinales - minutosIniciales;
  }

  /**
   * Validar si un préstamo es válido
   */
  validarPrestamo(prestamo: Partial<PrestamoDual>): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!prestamo.id_empleado) {
      errores.push('Debe seleccionar un empleado');
    }

    if (!prestamo.id_supervisor_prestatario) {
      errores.push('Debe seleccionar un supervisor destino');
    }

    if (!prestamo.id_proyecto_destino) {
      errores.push('Debe seleccionar un proyecto destino');
    }

    if (!prestamo.fecha_prestamo) {
      errores.push('Debe especificar la fecha del préstamo');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }
}
