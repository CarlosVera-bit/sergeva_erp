// Modelos compartidos para módulo de asistencia
export type AttendanceType = 'ENTRADA' | 'SALIDA';

export interface DeviceInfo {
  ipAddress: string;
  userAgent: string;
}

export interface GeoDetails {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  withinRadius: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string; // Nombre completo del empleado
  employeeRole?: string; // Rol del empleado
  projectName?: string; // Nombre del proyecto
  ot?: string; // Orden de Trabajo
  descripcion?: string; // Descripción del proyecto
  timestamp: Date;
  type: AttendanceType;
  photo: string; // base64 o URL
  faceMatchScore: number; // 0-100
  geolocation: GeoDetails;
  deviceInfo: DeviceInfo;
  createdAt: Date;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  withinAllowedRadius: boolean;
}
