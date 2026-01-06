// Modelos TypeScript para gestión de proyectos y préstamos

export interface Proyecto {
  id_proyecto: number;
  id_ot: number;
  id_supervisor: number;
  numero_ot: string;
  nombre_proyecto: string;
  descripcion: string;
  hora_ingreso: string; // HH:mm format
  hora_salida: string;  // HH:mm format
  estado: 'ACTIVO' | 'INACTIVO';
  fecha_creacion: string;

  // Campos de Herencia
  es_externo: boolean;
  es_interno: boolean;

  // Detalles Proyecto Externo
  id_cliente?: number;
  ubicacion_cliente?: string;
  presupuesto_cotizado?: number;

  // Detalles Proyecto Interno
  id_departamento?: number;
  area_solicitante?: string;
  centro_costos?: string;

  // Campos adicionales del JOIN
  nombre_supervisor?: string;
  personal_asignado?: number;
  cliente?: string; // Nombre del cliente desde el JOIN
}

export interface TipoRegistroDetectado {
  tipo: 'ENTRADA_TEMPRANA' | 'ENTRADA_PUNTUAL' | 'ENTRADA_TARDE' |
  'SALIDA_TEMPRANA' | 'SALIDA_PUNTUAL' | 'SALIDA_TARDE';
  minutos_diferencia: number;
  hora_configurada: string;
  hora_registrada: string;
  sugerencia: 'ENTRADA' | 'SALIDA';
  mensaje: string;
}

export interface PrestamoDual {
  id_prestamo: number;
  id_empleado: number;
  nombre_empleado?: string;
  id_supervisor_prestamista: number;
  nombre_supervisor_prestamista?: string;
  id_supervisor_prestatario: number;
  nombre_supervisor_prestatario?: string;
  id_proyecto_origen: number;
  nombre_proyecto_origen?: string;
  id_proyecto_destino: number;
  nombre_proyecto_destino?: string;
  id_ot_origen: number;
  numero_ot_origen?: string;
  id_ot_destino: number;
  numero_ot_destino?: string;
  fecha_prestamo: string;
  hora_fin_proyecto_origen: string | null;
  hora_inicio_proyecto_destino: string | null;
  estado_prestamista: 'REPORTADO' | 'CONFIRMADO';
  estado_prestatario: 'PENDIENTE' | 'CONFIRMADO';
  tiempo_traslado_minutos: number;
  observaciones: string;
  fecha_creacion: string;
}

export interface RegistroPorProyecto {
  proyecto: Proyecto;
  horas_trabajadas: number;
  hora_entrada: string | null;
  hora_salida: string | null;
  tipo_registro: TipoRegistroDetectado;
  es_prestamo: boolean;
}

export interface ConsolidacionConPrestamos {
  id_empleado: number;
  nombre_empleado: string;
  fecha: string;
  registros_por_proyecto: RegistroPorProyecto[];
  total_horas: number;
  horas_extras: number;
  tiempo_traslado_descontado: number;
  prestamo_activo: PrestamoDual | null;
}

export interface DashboardSupervisor {
  proyectos_a_cargo: Proyecto[];
  personal_hoy: {
    id_empleado: number;
    nombre: string;
    estado: 'EN_PROYECTO' | 'PRESTADO' | 'AUSENTE';
    hora_entrada: string | null;
    hora_salida: string | null;
    proyecto_actual: string;
  }[];
  prestamos_pendientes: {
    como_prestamista: PrestamoDual[];
    como_prestatario: PrestamoDual[];
  };
  horas_consolidadas: {
    total_horas_hoy: number;
    horas_extras: number;
    empleados_con_prestamo: number;
  };
}

export interface SolicitudPrestamo {
  id_empleado: number;
  id_supervisor_prestatario: number;
  id_proyecto_destino: number;
  id_ot_destino: number;
  fecha_prestamo: string;
  observaciones: string;
}

export interface ConfirmacionPrestamo {
  id_prestamo: number;
  tipo: 'PRESTAMISTA' | 'PRESTATARIO';
  hora: string;
  observaciones?: string;
}
