// filepath: src/models/authorization.models.ts
// Modelos TypeScript para el sistema de solicitudes de edición

export interface Solicitud {
    id_solicitud: number;
    id_supervisor: number;
    nombre_supervisor: string;
    email_supervisor: string;
    tabla_objetivo: string;
    id_registro: number;
    motivo: string;
    estado: 'pendiente' | 'aprobada' | 'rechazada';
    fecha_solicitud: string;
    fecha_respuesta?: string;
    id_admin_respuesta?: number;
    nombre_admin_respuesta?: string;
    observaciones_admin?: string;
}

export interface SolicitudRequest {
    id_supervisor: number;
    tabla: string;
    id_registro: number;
    motivo: string;
}

export interface VerificarAccesoResponse {
    tiene_acceso: boolean;
    estado: 'pendiente' | 'aprobada' | 'rechazada' | 'ninguna';
    id_solicitud: number | null;
    fecha_solicitud?: string;
    fecha_respuesta?: string;
}

export interface AprobarRechazarRequest {
    id_solicitud: number;
    id_admin: number;
    accion: 'aprobar' | 'rechazar';
    observaciones?: string;
}

export interface ListarPendientesResponse {
    solicitudes: Solicitud[];
    total: number;
}
