import { Injectable } from '@angular/core';
import { BiometricService } from './biometric.service';
import { GeolocationService } from './geolocation.service';
import { AttendanceRecord, AttendanceType } from './attendance.models';
import { TipoRegistroDetectado, Proyecto } from './proyecto.models';
import { ProyectoService } from './proyecto.service';
import { PrestamoPersonalService } from './prestamo-personal.service';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  constructor(
    private biometrics: BiometricService,
    private geo: GeolocationService,
    private proyectoService: ProyectoService,
    private prestamoService: PrestamoPersonalService
  ) {}

  /**
   * Detectar automáticamente el tipo de registro basado en horario configurado del proyecto
   */
  async detectarTipoRegistro(idProyecto: number, horaActual?: string): Promise<TipoRegistroDetectado> {
    try {
      // Obtener proyecto con horarios configurados
      const proyecto = await this.proyectoService.obtenerProyectoPorId(idProyecto);
      
      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      const ahora = horaActual || this.obtenerHoraActual();
      const horaIngreso = proyecto.hora_ingreso;
      const horaSalida = proyecto.hora_salida;

      // Calcular diferencia en minutos
      const minutosActual = this.convertirAMinutos(ahora);
      const minutosIngreso = this.convertirAMinutos(horaIngreso);
      const minutosSalida = this.convertirAMinutos(horaSalida);

      // Calcular punto medio del turno
      const puntoMedio = (minutosIngreso + minutosSalida) / 2;

      let tipo: TipoRegistroDetectado['tipo'];
      let sugerencia: 'ENTRADA' | 'SALIDA';
      let mensaje: string;
      let minutosDiferencia: number;

      if (minutosActual < puntoMedio) {
        // Primera mitad del turno → ENTRADA
        sugerencia = 'ENTRADA';
        minutosDiferencia = minutosActual - minutosIngreso;

        if (minutosDiferencia < -5) {
          tipo = 'ENTRADA_TEMPRANA';
          mensaje = `Llegaste ${Math.abs(minutosDiferencia)} minutos antes del horario (${horaIngreso})`;
        } else if (minutosDiferencia <= 5) {
          tipo = 'ENTRADA_PUNTUAL';
          mensaje = `Llegaste puntual. Horario configurado: ${horaIngreso}`;
        } else {
          tipo = 'ENTRADA_TARDE';
          mensaje = `Llegaste ${minutosDiferencia} minutos tarde (${horaIngreso})`;
        }
      } else {
        // Segunda mitad del turno → SALIDA
        sugerencia = 'SALIDA';
        minutosDiferencia = minutosActual - minutosSalida;

        if (minutosDiferencia < -15) {
          tipo = 'SALIDA_TEMPRANA';
          mensaje = `Saliste ${Math.abs(minutosDiferencia)} minutos antes del horario (${horaSalida})`;
        } else if (minutosDiferencia >= -15 && minutosDiferencia <= 15) {
          tipo = 'SALIDA_PUNTUAL';
          mensaje = `Saliste puntual. Horario configurado: ${horaSalida}`;
        } else {
          tipo = 'SALIDA_TARDE';
          mensaje = `Saliste ${minutosDiferencia} minutos después del horario (hora extra posible)`;
        }
      }

      return {
        tipo,
        minutos_diferencia: minutosDiferencia,
        hora_configurada: sugerencia === 'ENTRADA' ? horaIngreso : horaSalida,
        hora_registrada: ahora,
        sugerencia,
        mensaje
      };
    } catch (error) {
      console.error('Error detectando tipo de registro:', error);
      // Fallback: detectar por hora del día
      return this.detectarPorHoraDia(horaActual);
    }
  }

  /**
   * Detectar tipo de registro por hora del día (fallback)
   */
  detectarPorHoraDia(horaActual?: string): TipoRegistroDetectado {
    const ahora = horaActual || this.obtenerHoraActual();
    const minutos = this.convertirAMinutos(ahora);

    // Antes de las 14:00 → ENTRADA, después → SALIDA
    if (minutos < 14 * 60) {
      return {
        tipo: 'ENTRADA_PUNTUAL',
        minutos_diferencia: 0,
        hora_configurada: '08:00',
        hora_registrada: ahora,
        sugerencia: 'ENTRADA',
        mensaje: 'Registro de entrada (sin horario configurado)'
      };
    } else {
      return {
        tipo: 'SALIDA_PUNTUAL',
        minutos_diferencia: 0,
        hora_configurada: '17:00',
        hora_registrada: ahora,
        sugerencia: 'SALIDA',
        mensaje: 'Registro de salida (sin horario configurado)'
      };
    }
  }

  /**
   * Convertir hora HH:mm a minutos desde medianoche
   */
  private convertirAMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Obtener hora actual en formato HH:mm
   */
  private obtenerHoraActual(): string {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  // Orquesta el flujo de registro: foto + cara + GPS + persistencia
  async recordAttendance(params: {
    employeeId: string;
    profilePhotoUrl?: string; // foto del empleado en el sistema
    allowedLat?: number;
    allowedLng?: number;
    allowedRadiusMeters?: number;
    lastRecord?: AttendanceRecord;
  }): Promise<AttendanceRecord> {
    const type = 'ENTRADA'; // Tipo por defecto

    // 1. Cámara
    const preview$ = this.biometrics.openCamera();
    const previewCanvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
      const sub = preview$.subscribe({ next: c => { resolve(c); sub.unsubscribe(); } , error: reject });
    });
    const photoBlob = await this.biometrics.capturePhoto(previewCanvas);

    // 2. Comparación facial (tolerante a fallo)
    let score = 0;
    if (params.profilePhotoUrl) {
      score = await this.biometrics.compareFaces(photoBlob, params.profilePhotoUrl);
    }
    this.biometrics.stopCamera();

    // 3. Geolocalización
    const loc = await this.geo.getCurrentLocation(params.allowedLat, params.allowedLng, params.allowedRadiusMeters ?? 200);

    // 4. Construir registro (persistencia real debe ir al backend)
    const photoBase64 = await blobToBase64(photoBlob);
    const record: AttendanceRecord = {
      id: crypto.randomUUID(),
      employeeId: params.employeeId,
      timestamp: new Date(),
      type,
      photo: photoBase64,
      faceMatchScore: score,
      geolocation: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        address: loc.address,
        withinRadius: loc.withinAllowedRadius
      },
      deviceInfo: {
        ipAddress: '-',
        userAgent: navigator.userAgent
      },
      createdAt: new Date()
    };

    // TODO: Persistir vía DatabaseService (POST) y devolver respuesta real
    // await this.db.postAttendance(record)
    return record;
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
