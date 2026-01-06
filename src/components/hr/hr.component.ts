import { Component, ChangeDetectionStrategy, signal, computed, inject, effect, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../services/database.service';
import { DataPreloadService } from '../../services/data-preload.service';
import { CsvExportService } from '../../services/csv-export.service';
import { AttendanceService } from '../../services/attendance.service';
import { AttendanceRecord } from '../../services/attendance.models';
import { AuthService } from '../../services/auth.service';
import { AutoRefreshService } from '../../services/auto-refresh.service';
import { BiometricCaptureComponent } from './biometric-capture.component';
import { GeolocationCaptureComponent } from './geolocation-capture.component';
import { AttendanceConfirmationComponent } from './attendance-confirmation.component';
import { DashboardSupervisorComponent } from './dashboard-supervisor.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { LoanRequestModalComponent } from './loan-request-modal.component';
import { LoanConfirmModalComponent } from './loan-confirm-modal.component';
import { ProyectoService } from '../../services/proyecto.service';
import { PrestamoPersonalService } from '../../services/prestamo-personal.service';
import { TermsService } from '../../services/terms.service';
import { ToastService } from '../../services/toast.service';
import { Proyecto, PrestamoDual, TipoRegistroDetectado } from '../../services/proyecto.models';
import { environment } from '../../environments/environment';

export interface TimeEntry {
  id_registro: number;
  empleado: string;
  proyecto: string;
  fecha: string;
  horas_trabajadas: number;
  status: 'Aprobado' | 'Pendiente';
}

@Component({
  selector: 'app-hr',
  templateUrl: './hr.component.html',
  styleUrls: ['./hr.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BiometricCaptureComponent,
    GeolocationCaptureComponent,
    AttendanceConfirmationComponent,
    DashboardSupervisorComponent,

    LoanRequestModalComponent,
    LoanConfirmModalComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HrComponent implements OnInit, OnDestroy {
  dbService = inject(DatabaseService);
  preloadService = inject(DataPreloadService);
  csvExportService = inject(CsvExportService);
  attendanceService = inject(AttendanceService);
  authService = inject(AuthService);
  private autoRefreshService = inject(AutoRefreshService);
  private refreshSub: Subscription | null = null;
  proyectoService = inject(ProyectoService);
  prestamoService = inject(PrestamoPersonalService);
  termsService = inject(TermsService);
  toastService = inject(ToastService);

  // Verificar si el usuario es admin
  isAdmin = computed(() => this.authService.currentUser()?.rol === 'admin');
  
  // Roles de oficina: admin, contador, gerente, bodeguero (no necesitan seleccionar OT)
  // Roles operativos: supervisor, operativo (deben seleccionar OT)
  esUsuarioOficina = computed(() => {
    const rol = this.authService.currentUser()?.rol?.toLowerCase();
    const rolesOficina = ['admin', 'contador', 'gerente', 'bodeguero'];
    return rolesOficina.includes(rol || '');
  });

  @ViewChild(BiometricCaptureComponent) biometricCapture?: BiometricCaptureComponent;
  @ViewChild(LoanRequestModalComponent) loanRequestModal?: LoanRequestModalComponent;
  @ViewChild(LoanConfirmModalComponent) loanConfirmModal?: LoanConfirmModalComponent;

  timeEntries = signal<TimeEntry[]>([]);

  // Navegación por tabs
  vistaActual = signal<'dashboard' | 'proyectos' | 'asistencias' | 'prestamos'>('dashboard');
  isLoading = signal<boolean>(false); // Ya no hay loading inicial, datos precargados

  // Registros de asistencia con biometría y geolocalización
  attendanceRecords = signal<AttendanceRecord[]>([]);
  selectedRecord = signal<AttendanceRecord | null>(null);
  showDetailModal = signal<boolean>(false);

  // Agrupación por días
  diasExpandidos = signal<Set<string>>(new Set());
  registrosPorDia = computed(() => {
    const registros = this.attendanceRecords();
    const grupos = new Map<string, AttendanceRecord[]>();

    registros.forEach(record => {
      const fecha = new Date(record.timestamp);
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const fechaStr = `${year}-${month}-${day}`;

      if (!grupos.has(fechaStr)) {
        grupos.set(fechaStr, []);
      }
      grupos.get(fechaStr)!.push(record);
    });

    return Array.from(grupos.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([fecha, registros]) => ({
        fecha,
        registros,
        esHoy: this.esFechaHoy(fecha),
        titulo: this.formatearTituloFecha(fecha)
      }));
  });

  // Estado del modal y paso actual del flujo
  showModal = signal<boolean>(false);
  step = signal<1 | 2 | 3>(1);
  currentRecord = signal<AttendanceRecord | null>(null);

  // Datos temporales capturados en cada paso
  tempPhoto = signal<string | null>(null);
  tempFaceScore = signal<number>(0);
  tempLocation = signal<any>(null);
  isSaving = signal<boolean>(false);

  // Proyectos y detección inteligente
  proyectosActivos = signal<Proyecto[]>([]);
  proyectoSeleccionado: number | null = null;
  tipoRegistroSeleccionado: 'ENTRADA' | 'SALIDA' | null = null;
  tipoDetectado = signal<TipoRegistroDetectado | null>(null);

  // Entrada activa (para salida automática)
  entradaActiva = signal<{ id_proyecto: number; nombre_proyecto: string; numero_ot: string; fecha_hora: string } | null>(null);

  // Préstamos
  prestamoParaConfirmar = signal<PrestamoDual | null>(null);

  // Exportación
  mostrarModalExportar = signal<boolean>(false);
  tipoExportacion = signal<'excel' | 'pdf'>('excel');
  exportFechaInicio = signal<string>('');
  exportFechaFin = signal<string>('');
  exportando = signal<boolean>(false);

  // Filtros de búsqueda para control de horas
  filtroEmpleado = signal<string>('');
  filtroProyecto = signal<string>('todos');
  mostrarModalProyectos = signal<boolean>(false);

  // Modal de confirmación de descarga de términos
  showTermsConfirmModal = signal<boolean>(false);

  // Pestañas Operativo/Oficina para registros de asistencia
  tabAsistenciasActivo = signal<'OPERATIVO' | 'OFICINA'>('OPERATIVO');
  
  // Roles de oficina para clasificación
  private rolesOficina = ['admin', 'contador', 'gerente', 'bodeguero'];
  
  // Proyectos únicos de los registros
  proyectosEnRegistros = computed(() => {
    const proyectos = [...new Set(this.attendanceRecords()
      .map(r => r.projectName || r.ot)
      .filter(p => p))];
    return proyectos.sort();
  });

  // Truncar nombre de proyecto para mostrar en select
  truncarProyecto(nombre: string, maxLen: number = 35): string {
    if (!nombre) return '';
    if (nombre.length <= maxLen) return nombre;
    return nombre.substring(0, maxLen) + '...';
  }

  // Seleccionar proyecto desde modal
  seleccionarProyecto(proyecto: string) {
    this.filtroProyecto.set(proyecto);
    this.mostrarModalProyectos.set(false);
  }
  
  // Registros filtrados primero por búsqueda, luego por tipo de personal
  registrosFiltrados = computed(() => {
    let registros = this.attendanceRecords();
    
    // Filtrar por empleado
    const busqueda = this.filtroEmpleado().toLowerCase().trim();
    if (busqueda) {
      registros = registros.filter(r => {
        const nombre = (r.employeeName || r.employeeId || '').toLowerCase();
        return nombre.includes(busqueda);
      });
    }
    
    // Filtrar por proyecto
    const proyecto = this.filtroProyecto();
    if (proyecto !== 'todos') {
      registros = registros.filter(r => 
        (r.projectName === proyecto) || (r.ot === proyecto)
      );
    }
    
    return registros;
  });
  
  // Registros filtrados por tipo de personal (basado en rol)
  // Roles oficina: admin, contador, gerente, bodeguero
  // Roles operativos: supervisor, operativo
  registrosOperativos = computed(() => {
    return this.registrosFiltrados().filter(r => 
      !this.rolesOficina.includes((r.employeeRole || '').toLowerCase())
    );
  });
  
  registrosOficina = computed(() => {
    return this.registrosFiltrados().filter(r => 
      this.rolesOficina.includes((r.employeeRole || '').toLowerCase())
    );
  });
  
  // Agrupación por días para cada tipo de personal
  registrosPorDiaOperativos = computed(() => {
    return this.agruparRegistrosPorDia(this.registrosOperativos());
  });
  
  registrosPorDiaOficina = computed(() => {
    return this.agruparRegistrosPorDia(this.registrosOficina());
  });
  
  // Computed para obtener los registros del tab activo
  registrosPorDiaActivos = computed(() => {
    return this.tabAsistenciasActivo() === 'OPERATIVO' 
      ? this.registrosPorDiaOperativos() 
      : this.registrosPorDiaOficina();
  });
  
  // Cantidad de registros por tipo
  cantidadOperativos = computed(() => this.registrosOperativos().length);
  cantidadOficina = computed(() => this.registrosOficina().length);

  // Referencias a componentes hijos
  @ViewChild(DashboardSupervisorComponent) dashboardComponent?: DashboardSupervisorComponent;

  private sanitizer = inject(DomSanitizer);

  constructor() {
    // Los datos ya están precargados por AppComponent
    // Solo cargar datos específicos del módulo
    effect(() => {
      if (this.dbService.connected()) {
        this.loadTimeEntries();
        this.loadAttendanceRecords();
      }
    }, { allowSignalWrites: true });

    // Effect para confirmar préstamos
    effect(() => {
      const prestamoParaConfirmar = this.prestamoParaConfirmar();
      if (prestamoParaConfirmar && this.loanConfirmModal) {
        this.loanConfirmModal.abrir(prestamoParaConfirmar);
      }
    }, { allowSignalWrites: true });

    // Effect para expandir automáticamente el día de hoy o el más reciente
    effect(() => {
      const grupos = this.registrosPorDia();
      if (grupos.length === 0) return;

      // Buscar el día de hoy, si no existe usar el primer grupo (más reciente)
      const hoy = grupos.find(g => g.esHoy);
      const diaAExpandir = hoy ? hoy.fecha : grupos[0].fecha;

      if (!this.diasExpandidos().has(diaAExpandir)) {
        const expandidos = new Set(this.diasExpandidos());
        expandidos.add(diaAExpandir);
        this.diasExpandidos.set(expandidos);
      }
    }, { allowSignalWrites: true });
  }

  async ngOnInit() {
    // Asegurar que la conexión esté lista
    if (!this.dbService.connected()) {
      await this.dbService.connect();
    }
    // Cargar proyectos activos
    await this.loadProyectosActivos();
    // Cargar datos del módulo si es necesario
    if (this.attendanceRecords().length === 0) {
      this.loadAttendanceRecords();
    }
    
    // Suscribirse al auto-refresh global
    this.refreshSub = this.autoRefreshService.refresh$.subscribe(() => {
      this.loadProyectosActivos();
      this.loadAttendanceRecords();
    });
  }
  
  ngOnDestroy() {
    this.refreshSub?.unsubscribe();
  }

  async loadProyectosActivos(): Promise<void> {
    try {
      console.log('🔵 [HR] Iniciando carga de todos los proyectos activos...');
      // Obtener TODOS los proyectos activos (para que cualquier usuario pueda registrar asistencia)
      const proyectos = await this.proyectoService.obtenerProyectosActivos();
      console.log('🔵 [HR] Proyectos recibidos del servicio:', proyectos);
      console.log('🔵 [HR] Cantidad de proyectos:', proyectos.length);
      this.proyectosActivos.set(proyectos);
      console.log('✅ [HR] Signal actualizado. proyectosActivos():', this.proyectosActivos());
      console.log('✅ [HR] Longitud del signal:', this.proyectosActivos().length);
    } catch (error) {
      console.error('❌ [HR] Error cargando proyectos:', error);
      this.proyectosActivos.set([]);
    }
  }

  async loadAttendanceRecords(): Promise<void> {
    try {
      console.log('🔄 [ASISTENCIAS] Iniciando carga de registros...');
      const url = `${environment.apiUrl}/asistencias.php`;
      const response = await fetch(url);
      const result = await response.json();
      console.log('📥 [ASISTENCIAS] Respuesta del servidor:', result);

      if (result.success) {
        console.log('✅ [ASISTENCIAS] Registros recibidos:', result.data.length);
        // Mapear los datos de BD al formato AttendanceRecord
        const records = result.data.map((item: any) => ({
          id: item.id_asistencia.toString(),
          employeeId: item.id_usuario.toString(),
          employeeName: item.nombre_completo,
          employeeRole: item.rol,
          projectName: item.nombre_proyecto,
          ot: item.numero_ot,
          descripcion: item.descripcion_proyecto,
          timestamp: item.fecha_hora,
          type: item.tipo_registro,
          photo: item.foto_base64,
          faceMatchScore: parseFloat(item.score_facial || '0'),
          geolocation: {
            latitude: parseFloat(item.latitud || '0'),
            longitude: parseFloat(item.longitud || '0'),
            accuracy: parseFloat(item.precision_gps || '0'),
            address: item.direccion || '',
            withinRadius: item.dentro_radio === 1
          },
          deviceInfo: {
            userAgent: item.user_agent || '',
            ipAddress: item.ip_address || ''
          },
          createdAt: item.fecha_creacion
        }));

        this.attendanceRecords.set(records);
        console.log('✅ [ASISTENCIAS] Registros cargados en signal:', this.attendanceRecords().length);
      } else {
        console.log('⚠️ [ASISTENCIAS] Respuesta sin success:', result);
      }
    } catch (error) {
      console.error('❌ [ASISTENCIAS] Error cargando registros:', error);
      this.attendanceRecords.set([]);
    }
  }

  async loadTimeEntries(): Promise<void> {
    this.isLoading.set(true);

    // Query combinado: registros tradicionales + registros biométricos
    const query = `
      SELECT 
        rh.id_registro,
        CONCAT(t.nombres, ' ', t.apellidos) as empleado,
        ot.numero_ot as proyecto,
        rh.fecha,
        rh.horas_trabajadas,
        'tradicional' as tipo_registro
      FROM registro_horas rh
      JOIN trabajadores t ON rh.id_trabajador = t.id_trabajador
      JOIN ordenes_trabajo ot ON rh.id_ot = ot.id_ot
      
      UNION ALL
      
      SELECT 
        a.id_asistencia as id_registro,
        u.nombre_completo as empleado,
        COALESCE(ot.numero_ot, 'Sin OT') as proyecto,
        DATE(a.fecha_hora) as fecha,
        CASE 
          WHEN a.tipo_registro = 'SALIDA' THEN
            COALESCE(
              (SELECT TIMESTAMPDIFF(HOUR, a2.fecha_hora, a.fecha_hora)
               FROM asistencias_biometricas a2
               WHERE a2.id_usuario = a.id_usuario 
               AND DATE(a2.fecha_hora) = DATE(a.fecha_hora)
               AND a2.tipo_registro = 'ENTRADA'
               AND a2.fecha_hora < a.fecha_hora
               ORDER BY a2.fecha_hora DESC
               LIMIT 1), 
              0
            )
          ELSE 0
        END as horas_trabajadas,
        'biométrico' as tipo_registro
      FROM asistencias_biometricas a
      JOIN usuarios u ON a.id_usuario = u.id_usuario
      LEFT JOIN ordenes_trabajo ot ON a.id_ot = ot.id_ot
      WHERE a.tipo_registro = 'SALIDA'
      
      ORDER BY fecha DESC
    `;

    try {
      const data = await this.dbService.query(query);
      // Simulate status
      this.timeEntries.set(data.map((t: any) => ({ ...t, status: Math.random() > 0.3 ? 'Aprobado' : 'Pendiente' })));
    } catch (e) {
      console.error("Error loading time entries", e);
      this.timeEntries.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  exportToCsv(): void {
    const dataToExport = this.timeEntries().map(entry => ({
      ID_Registro: `HR-00${entry.id_registro}`,
      Empleado: entry.empleado,
      Proyecto: entry.proyecto,
      Fecha: entry.fecha,
      Horas: entry.horas_trabajadas,
      Estado: entry.status
    }));
    this.csvExportService.exportToCsv('control_de_horas.csv', dataToExport);
  }

  getStatusClass(status: 'Aprobado' | 'Pendiente'): string {
    switch (status) {
      case 'Aprobado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  }

  // Verificar si el usuario tiene una entrada activa (sin salida)
  async verificarEntradaActiva(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const response = await fetch(
        `${environment.apiUrl}/asistencias.php?verificar_entrada_activa=1&id_usuario=${user.id_usuario}`
      );
      const result = await response.json();

      if (result.success && result.data.tiene_entrada_activa) {
        this.entradaActiva.set(result.data.entrada);
      } else {
        this.entradaActiva.set(null);
      }
    } catch (error) {
      console.error('Error verificando entrada activa:', error);
      this.entradaActiva.set(null);
    }
  }

  // UI: abrir/cerrar y navegación de pasos
  async abrirModalRegistro(): Promise<void> {
    // Asegurar que los proyectos estén cargados antes de abrir el modal (para personal operativo)
    if (!this.esUsuarioOficina() && this.proyectosActivos().length === 0) {
      console.log('🔵 [HR] Proyectos no cargados, recargando...');
      await this.loadProyectosActivos();
    }

    // Verificar entrada activa para TODOS los usuarios (operativo y oficina)
    await this.verificarEntradaActiva();

    this.step.set(1);
    this.showModal.set(true);
    // Limpiar datos temporales
    this.tempPhoto.set(null);
    this.tempFaceScore.set(0);
    this.tempLocation.set(null);
    this.currentRecord.set(null);
    this.proyectoSeleccionado = null;
    this.tipoRegistroSeleccionado = null;

    // Si tiene entrada activa, preseleccionar SALIDA
    const entradaActiva = this.entradaActiva();
    if (entradaActiva) {
      this.tipoRegistroSeleccionado = 'SALIDA';
      // Solo asignar proyecto si existe (personal operativo)
      if (entradaActiva.id_proyecto) {
        this.proyectoSeleccionado = entradaActiva.id_proyecto;
      }
    }
  }

  cerrarModal(): void {
    this.showModal.set(false);
    this.currentRecord.set(null);
    this.step.set(1);
    this.tempPhoto.set(null);
    this.tempFaceScore.set(0);
    this.tempLocation.set(null);
    this.proyectoSeleccionado = null;
    this.tipoRegistroSeleccionado = null;
    this.entradaActiva.set(null);
  }

  // Métodos para recibir datos de los componentes hijos
  onBiometricCaptured(data: { photo: string; score: number }): void {
    this.tempPhoto.set(data.photo);
    this.tempFaceScore.set(data.score);
  }

  onLocationCaptured(location: any): void {
    this.tempLocation.set(location);
  }

  async siguientePaso(): Promise<void> {
    const s = this.step();

    // Validar que haya proyecto y tipo seleccionados antes de avanzar del paso 1
    if (s === 1) {
      // Los usuarios de oficina (admin) no necesitan seleccionar proyecto
      if (!this.esUsuarioOficina() && !this.proyectoSeleccionado) {
        this.toastService.showWarning('⚠️ Por favor selecciona un proyecto');
        return;
      }
      if (!this.tipoRegistroSeleccionado) {
        this.toastService.showWarning('⚠️ Por favor selecciona si es ENTRADA o SALIDA');
        return;
      }

      // Detener la cámara al avanzar del paso 1
      if (this.biometricCapture) {
        this.biometricCapture.stopCamera();
      }
    }

    // Validar que se haya tomado la foto antes de avanzar del paso 2
    if (s === 2) {
      const photo = this.tempPhoto();
      if (!photo) {
        this.toastService.showWarning('⚠️ Por favor toma la foto biométrica antes de continuar');
        return;
      }
    }

    // Validar que se haya capturado la ubicación antes de avanzar del paso 3
    if (s === 3) {
      const location = this.tempLocation();
      if (!location) {
        this.toastService.showWarning('⚠️ Por favor captura tu ubicación antes de continuar');
        return;
      }
    }

    if (s < 3) {
      this.step.set((s + 1) as 1 | 2 | 3);

      // Si pasamos al paso 3, construir el registro de previsualización
      if (this.step() === 3) {
        await this.buildPreviewRecord();
      }
    }
  }

  // Construir registro de previsualización con datos capturados
  private async buildPreviewRecord(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    const photo = this.tempPhoto();
    const location = this.tempLocation();

    if (!photo || !location) {
      this.toastService.showError('Faltan datos. Por favor completa todos los pasos.');
      this.step.set(1);
      return;
    }

    // Usar el tipo seleccionado manualmente por el usuario
    const tipoRegistro = this.tipoRegistroSeleccionado || 'ENTRADA';

    const record: AttendanceRecord = {
      id: crypto.randomUUID(),
      employeeId: user.id_usuario.toString(),
      employeeName: user.nombre_completo,
      employeeRole: user.rol,
      timestamp: new Date().toISOString(),
      type: tipoRegistro as 'ENTRADA' | 'SALIDA',
      photo: photo,
      faceMatchScore: this.tempFaceScore(),
      geolocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address,
        withinRadius: location.withinAllowedRadius
      },
      deviceInfo: {
        userAgent: navigator.userAgent,
        ipAddress: '-'
      },
      createdAt: new Date().toISOString()
    } as any;

    this.currentRecord.set(record);
  }

  anteriorPaso(): void {
    const s = this.step();
    if (s > 1) this.step.set((s - 1) as 1 | 2 | 3);
  }

  async confirmarRegistro(): Promise<void> {
    const user = this.authService.currentUser();
    const record = this.currentRecord();

    if (!user) {
      this.toastService.showError('No hay usuario logueado');
      return;
    }

    if (!record) {
      this.toastService.showError('No hay datos de registro. Por favor completa todos los pasos.');
      return;
    }

    // Solo validar proyecto para personal operativo (no para usuarios de oficina/admin)
    if (!this.esUsuarioOficina() && !this.proyectoSeleccionado) {
      this.toastService.showWarning('⚠️ Por favor selecciona un proyecto antes de registrar la asistencia.');
      return;
    }

    if (this.isSaving()) {
      return; // Evitar múltiples clics
    }

    this.isSaving.set(true);

    try {
      console.log('Iniciando registro de asistencia...');
      const deteccion = this.tipoDetectado();
      console.log('Tipo detectado:', deteccion);

      // Si es ENTRADA, verificar si hay préstamo pendiente
      let prestamoParaConfirmacion: PrestamoDual | null = null;
      if (record.type === 'ENTRADA' || record.type.startsWith('ENTRADA_')) {
        try {
          console.log('Verificando préstamo pendiente...');
          prestamoParaConfirmacion = await this.prestamoService.obtenerPrestamoPendiente(
            user.id_usuario,
            this.formatLocalDate()
          );
          console.log('Préstamo pendiente:', prestamoParaConfirmacion);
        } catch (error) {
          console.log('No hay préstamo pendiente o error al verificar:', error);
        }
      }

      // Persistir en BD
      const dbRecord = {
        id_usuario: user.id_usuario,
        tipo_registro: record.type,
        fecha_hora: this.formatLocalDateTime(),
        foto_base64: record.photo,
        score_facial: record.faceMatchScore || 0,
        latitud: record.geolocation.latitude,
        longitud: record.geolocation.longitude,
        precision_gps: record.geolocation.accuracy,
        direccion: record.geolocation.address,
        dentro_radio: record.geolocation.withinRadius ? 1 : 0,
        user_agent: record.deviceInfo.userAgent,
        ip_address: record.deviceInfo.ipAddress,
        id_ot: null,
        observaciones: null,
        id_proyecto: this.proyectoSeleccionado,
        tipo_registro_detectado: deteccion?.tipo || null,
        minutos_diferencia: deteccion?.minutos_diferencia || null,
        id_prestamo: null
      };

      console.log('📝 Guardando asistencia en BD:', {
        usuario: user.nombre_completo,
        tipo: record.type,
        proyecto: this.proyectoSeleccionado,
        proyectoNombre: this.proyectosActivos().find(p => p.id_proyecto === this.proyectoSeleccionado)?.nombre_proyecto
      });
      console.log('📦 Datos completos:', dbRecord);

      const response = await this.dbService.post('asistencias', dbRecord);
      console.log('✅ [GUARDAR] Respuesta de BD:', response);

      if (!response || !response.id_asistencia) {
        throw new Error('La respuesta no contiene id_asistencia. Respuesta: ' + JSON.stringify(response));
      }

      const idAsistencia = response.id_asistencia;
      console.log('✅ Asistencia guardada con ID:', idAsistencia);

      // Finalizar el registro directamente sin preguntar por préstamos
      await this.finalizarRegistro();
    } catch (error) {
      console.error('Error completo al registrar asistencia:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      this.toastService.showError('Error al registrar asistencia: ' + errorMsg);
      this.isSaving.set(false);
    }
  }

  private async finalizarRegistro(): Promise<void> {
    console.log('🔄 [FINALIZAR] Iniciando finalización de registro...');
    // Recargar ambas tablas desde la base de datos
    await this.loadAttendanceRecords();
    await this.loadTimeEntries();
    console.log('✅ [FINALIZAR] Datos recargados. Total registros:', this.attendanceRecords().length);

    // Notificar al dashboard que se registró una nueva asistencia
    this.notificarRegistroAsistencia();

    this.toastService.showSuccess('Asistencia registrada correctamente');
    this.cerrarModal();
    this.isSaving.set(false);
  }

  // Método para notificar al dashboard sobre el registro de asistencia
  private notificarRegistroAsistencia(): void {
    console.log('📢 Notificando registro de asistencia al dashboard...');
    if (this.dashboardComponent) {
      this.dashboardComponent.onAsistenciaRegistrada();
    } else {
      console.log('⚠️ Dashboard component no está disponible para notificación');
    }
  }

  // Abrir modal de detalle de registro
  verDetalle(record: AttendanceRecord): void {
    this.selectedRecord.set(record);
    this.showDetailModal.set(true);
  }

  cerrarDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedRecord.set(null);
  }

  getTypeClass(type: 'ENTRADA' | 'SALIDA'): string {
    return type === 'ENTRADA'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
  }

  // Métodos para el mapa en el modal de detalle
  getMapUrlForRecord(): SafeResourceUrl {
    const record = this.selectedRecord();
    if (!record?.geolocation?.latitude || !record?.geolocation?.longitude) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('');
    }
    const lat = record.geolocation.latitude;
    const lng = record.geolocation.longitude;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.002}%2C${lat - 0.002}%2C${lng + 0.002}%2C${lat + 0.002}&layer=mapnik&marker=${lat}%2C${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getGoogleMapsLinkForRecord(): string {
    const record = this.selectedRecord();
    if (!record?.geolocation?.latitude || !record?.geolocation?.longitude) return '';
    return `https://www.google.com/maps?q=${record.geolocation.latitude},${record.geolocation.longitude}&z=19`;
  }

  // Helper para formatear fecha local en formato MySQL (YYYY-MM-DD HH:mm:ss)
  private formatLocalDateTime(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // Helper para formatear solo fecha local (YYYY-MM-DD)
  private formatLocalDate(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Métodos para agrupación por días
  esFechaHoy(fechaStr: string): boolean {
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    return fechaStr === hoyStr;
  }

  formatearTituloFecha(fechaStr: string): string {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);

    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const fechaLocalStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const ayerStr = `${ayer.getFullYear()}-${String(ayer.getMonth() + 1).padStart(2, '0')}-${String(ayer.getDate()).padStart(2, '0')}`;

    if (fechaLocalStr === hoyStr) {
      return 'Hoy - ' + fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (fechaLocalStr === ayerStr) {
      return 'Ayer - ' + fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else {
      return fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  }

  // Método auxiliar para agrupar registros por día
  private agruparRegistrosPorDia(registros: AttendanceRecord[]): Array<{fecha: string, registros: AttendanceRecord[], esHoy: boolean, titulo: string}> {
    const grupos = new Map<string, AttendanceRecord[]>();

    registros.forEach(record => {
      const fecha = new Date(record.timestamp);
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const fechaStr = `${year}-${month}-${day}`;

      if (!grupos.has(fechaStr)) {
        grupos.set(fechaStr, []);
      }
      grupos.get(fechaStr)!.push(record);
    });

    return Array.from(grupos.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([fecha, registros]) => ({
        fecha,
        registros,
        esHoy: this.esFechaHoy(fecha),
        titulo: this.formatearTituloFecha(fecha)
      }));
  }

  toggleDia(fecha: string): void {
    const expandidos = new Set(this.diasExpandidos());
    if (expandidos.has(fecha)) {
      expandidos.delete(fecha);
    } else {
      expandidos.add(fecha);
    }
    this.diasExpandidos.set(expandidos);
  }

  isDiaExpandido(fecha: string): boolean {
    return this.diasExpandidos().has(fecha);
  }

  contarRegistrosPorTipo(registros: AttendanceRecord[]): { entradas: number; salidas: number } {
    return {
      entradas: registros.filter(r => r.type === 'ENTRADA').length,
      salidas: registros.filter(r => r.type === 'SALIDA').length
    };
  }

  // Métodos para manejar eventos de modales de préstamos
  onPrestamoCreado(idPrestamo: number): void {
    console.log('Préstamo creado:', idPrestamo);
    this.finalizarRegistro();
  }

  onLoanModalCerrado(): void {
    console.log('Modal de préstamo cerrado');
    this.finalizarRegistro();
  }

  onPrestamoConfirmado(): void {
    this.prestamoParaConfirmar.set(null);
    this.finalizarRegistro();
  }

  onPrestamoRechazado(): void {
    this.prestamoParaConfirmar.set(null);
    this.finalizarRegistro();
  }

  onLoanConfirmModalCerrado(): void {
    this.prestamoParaConfirmar.set(null);
  }

  // ==================== EXPORTACIÓN ====================

  abrirModalExportar(tipo: 'excel' | 'pdf'): void {
    console.log('🔵 [EXPORTAR] abrirModalExportar llamado con tipo:', tipo);
    console.log('🔵 [EXPORTAR] attendanceRecords.length:', this.attendanceRecords().length);
    this.tipoExportacion.set(tipo);
    // Establecer fechas por defecto (este mes)
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.exportFechaInicio.set(this.formatearFechaInput(primerDiaMes));
    this.exportFechaFin.set(this.formatearFechaInput(hoy));
    this.mostrarModalExportar.set(true);
    console.log('🔵 [EXPORTAR] mostrarModalExportar:', this.mostrarModalExportar());
  }

  cerrarModalExportar(): void {
    this.mostrarModalExportar.set(false);
    this.exportando.set(false);
  }

  formatearFechaInput(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  setRangoRapido(rango: 'hoy' | 'semana' | 'mes' | 'todo'): void {
    const hoy = new Date();

    switch (rango) {
      case 'hoy':
        this.exportFechaInicio.set(this.formatearFechaInput(hoy));
        this.exportFechaFin.set(this.formatearFechaInput(hoy));
        break;
      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        this.exportFechaInicio.set(this.formatearFechaInput(inicioSemana));
        this.exportFechaFin.set(this.formatearFechaInput(hoy));
        break;
      case 'mes':
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.exportFechaInicio.set(this.formatearFechaInput(inicioMes));
        this.exportFechaFin.set(this.formatearFechaInput(hoy));
        break;
      case 'todo':
        // Buscar la fecha más antigua en los registros
        const registros = this.attendanceRecords();
        if (registros.length > 0) {
          const fechas = registros.map(r => new Date(r.timestamp).getTime());
          const fechaMasAntigua = new Date(Math.min(...fechas));
          this.exportFechaInicio.set(this.formatearFechaInput(fechaMasAntigua));
        } else {
          this.exportFechaInicio.set(this.formatearFechaInput(new Date(hoy.getFullYear(), 0, 1)));
        }
        this.exportFechaFin.set(this.formatearFechaInput(hoy));
        break;
    }
  }

  contarRegistrosEnRango(): number {
    return this.obtenerRegistrosEnRango().length;
  }

  obtenerRegistrosEnRango(): AttendanceRecord[] {
    const inicio = this.exportFechaInicio();
    const fin = this.exportFechaFin();

    if (!inicio || !fin) return [];

    const fechaInicio = new Date(inicio + 'T00:00:00');
    const fechaFin = new Date(fin + 'T23:59:59');

    return this.attendanceRecords().filter(record => {
      const fechaRegistro = new Date(record.timestamp);
      return fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async ejecutarExportacion(): Promise<void> {
    this.exportando.set(true);

    try {
      const registros = this.obtenerRegistrosEnRango();

      if (this.tipoExportacion() === 'excel') {
        await this.exportarExcel(registros);
      } else {
        await this.exportarPDF(registros);
      }

      this.cerrarModalExportar();
    } catch (error) {
      console.error('Error en exportación:', error);
      this.toastService.showError('Error al exportar los datos');
    } finally {
      this.exportando.set(false);
    }
  }

  // Helper para determinar si un rol es de oficina
  private esRolOficina(rol: string | undefined): boolean {
    const rolesOficina = ['admin', 'contador', 'gerente', 'bodeguero'];
    return rolesOficina.includes((rol || '').toLowerCase());
  }

  async exportarExcel(registros: AttendanceRecord[]): Promise<void> {
    const inicio = this.exportFechaInicio();
    const fin = this.exportFechaFin();

    // Separar registros por tipo de personal (basado en rol o si tiene OT)
    // Roles oficina: admin, contador, gerente, bodeguero
    // Roles operativos: supervisor, operativo
    const registrosOperativos = registros.filter(r => !this.esRolOficina(r.employeeRole));
    const registrosOficina = registros.filter(r => this.esRolOficina(r.employeeRole));

    // Preparar datos con formato mejorado - OPERATIVOS
    const datosOperativos = registrosOperativos.map(record => {
      const fecha = new Date(record.timestamp);
      return {
        'Tipo Personal': 'OPERATIVO',
        'Fecha': fecha.toLocaleDateString('es-EC', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        'Hora': fecha.toLocaleTimeString('es-EC', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        'Empleado': record.employeeName || 'Sin nombre',
        'Rol': record.employeeRole || 'N/A',
        'Tipo Registro': record.type === 'ENTRADA' ? 'ENTRADA' : 'SALIDA',
        'Proyecto': record.projectName || 'N/A',
        'OT': record.ot || 'N/A',
        'Ubicación': record.geolocation?.address || 'Sin ubicación',
        'Coordenadas': record.geolocation?.latitude && record.geolocation?.longitude
          ? `${record.geolocation.latitude.toFixed(4)}, ${record.geolocation.longitude.toFixed(4)}`
          : 'N/A',
        'Score Facial': record.faceMatchScore ? `${Math.round(record.faceMatchScore)}%` : 'N/A'
      };
    });

    // Preparar datos con formato mejorado - OFICINA
    const datosOficina = registrosOficina.map(record => {
      const fecha = new Date(record.timestamp);
      return {
        'Tipo Personal': 'OFICINA',
        'Fecha': fecha.toLocaleDateString('es-EC', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        'Hora': fecha.toLocaleTimeString('es-EC', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        'Empleado': record.employeeName || 'Sin nombre',
        'Rol': record.employeeRole || 'N/A',
        'Tipo Registro': record.type === 'ENTRADA' ? 'ENTRADA' : 'SALIDA',
        'Proyecto': 'OFICINA',
        'OT': '-',
        'Ubicación': record.geolocation?.address || 'Sin ubicación',
        'Coordenadas': record.geolocation?.latitude && record.geolocation?.longitude
          ? `${record.geolocation.latitude.toFixed(4)}, ${record.geolocation.longitude.toFixed(4)}`
          : 'N/A',
        'Score Facial': record.faceMatchScore ? `${Math.round(record.faceMatchScore)}%` : 'N/A'
      };
    });

    // Combinar todos los datos
    const datosExcel = [...datosOperativos, ...datosOficina];

    // Crear nombre de archivo con período
    const nombreArchivo = `asistencias_${inicio}_a_${fin}`;

    // Usar el nuevo método que genera Excel real con formato
    this.csvExportService.exportToExcel(nombreArchivo + '.xls', datosExcel, 'Asistencias');
  }

  async exportarPDF(registros: AttendanceRecord[]): Promise<void> {
    const inicio = this.exportFechaInicio();
    const fin = this.exportFechaFin();

    // Separar registros por tipo de personal (basado en rol)
    // Roles oficina: admin, contador, gerente, bodeguero
    // Roles operativos: supervisor, operativo
    const registrosOperativos = registros.filter(r => !this.esRolOficina(r.employeeRole));
    const registrosOficina = registros.filter(r => this.esRolOficina(r.employeeRole));

    // Crear PDF en horizontal para más espacio
    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Colores corporativos
    const colorPrimario: [number, number, number] = [25, 55, 95];
    const colorOperativo: [number, number, number] = [234, 88, 12]; // Naranja
    const colorOficina: [number, number, number] = [37, 99, 235]; // Azul

    // Título principal
    doc.setFontSize(22);
    doc.setTextColor(...colorPrimario);
    doc.text('Reporte de Asistencias', 14, 20);

    // Subtítulo con período
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    const fechaInicioFormateada = new Date(inicio + 'T00:00:00').toLocaleDateString('es-EC', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const fechaFinFormateada = new Date(fin + 'T00:00:00').toLocaleDateString('es-EC', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    doc.text(`Período: ${fechaInicioFormateada} - ${fechaFinFormateada}`, 14, 28);

    // Estadísticas generales
    const entradasOp = registrosOperativos.filter(r => r.type === 'ENTRADA').length;
    const salidasOp = registrosOperativos.filter(r => r.type === 'SALIDA').length;
    const entradasOf = registrosOficina.filter(r => r.type === 'ENTRADA').length;
    const salidasOf = registrosOficina.filter(r => r.type === 'SALIDA').length;

    doc.setFontSize(10);
    doc.setTextColor(...colorOperativo);
    doc.text(`Personal Operativo: ${registrosOperativos.length} registros (${entradasOp} entradas, ${salidasOp} salidas)`, 14, 35);
    doc.setTextColor(...colorOficina);
    doc.text(`Personal de Oficina: ${registrosOficina.length} registros (${entradasOf} entradas, ${salidasOf} salidas)`, 14, 41);

    // Fecha de generación
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleString('es-EC')}`, 240, 20);

    let currentY = 50;

    // ========== SECCIÓN PERSONAL OPERATIVO ==========
    if (registrosOperativos.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(...colorOperativo);
      doc.text('▼ PERSONAL OPERATIVO', 14, currentY);
      currentY += 2;

      const datosOperativos = registrosOperativos.map(record => {
        const fecha = new Date(record.timestamp);
        return [
          fecha.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: true }),
          record.employeeName || 'Sin nombre',
          record.employeeRole || 'N/A',
          record.type,
          record.projectName || 'N/A',
          record.ot || 'N/A',
          record.faceMatchScore ? `${Math.round(record.faceMatchScore)}%` : 'N/A'
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Fecha', 'Hora', 'Empleado', 'Rol', 'Tipo', 'Proyecto', 'OT', 'Score']],
        body: datosOperativos,
        theme: 'striped',
        headStyles: {
          fillColor: colorOperativo,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [255, 247, 237] // Naranja muy claro
        },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 20 },
          2: { cellWidth: 40 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 50 },
          6: { cellWidth: 30 },
          7: { cellWidth: 18, halign: 'center' }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const valor = data.cell.raw as string;
            if (valor === 'ENTRADA') {
              data.cell.styles.textColor = [22, 163, 74];
              data.cell.styles.fontStyle = 'bold';
            } else if (valor === 'SALIDA') {
              data.cell.styles.textColor = [234, 88, 12];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // ========== SECCIÓN PERSONAL DE OFICINA ==========
    if (registrosOficina.length > 0) {
      // Verificar si necesitamos nueva página
      if (currentY > 170) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(...colorOficina);
      doc.text('▼ PERSONAL DE OFICINA', 14, currentY);
      currentY += 2;

      const datosOficina = registrosOficina.map(record => {
        const fecha = new Date(record.timestamp);
        return [
          fecha.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: true }),
          record.employeeName || 'Sin nombre',
          record.employeeRole || 'N/A',
          record.type,
          record.geolocation?.address?.substring(0, 45) || 'Sin ubicación',
          record.faceMatchScore ? `${Math.round(record.faceMatchScore)}%` : 'N/A'
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Fecha', 'Hora', 'Empleado', 'Rol', 'Tipo', 'Ubicación', 'Score']],
        body: datosOficina,
        theme: 'striped',
        headStyles: {
          fillColor: colorOficina,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [239, 246, 255] // Azul muy claro
        },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 20 },
          2: { cellWidth: 45 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 70 },
          6: { cellWidth: 18, halign: 'center' }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const valor = data.cell.raw as string;
            if (valor === 'ENTRADA') {
              data.cell.styles.textColor = [22, 163, 74];
              data.cell.styles.fontStyle = 'bold';
            } else if (valor === 'SALIDA') {
              data.cell.styles.textColor = [37, 99, 235];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });
    }

    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount} - SERGEVA ERP`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Descargar
    doc.save(`asistencias_${inicio}_a_${fin}.pdf`);
  }

  // Descargar términos y condiciones aceptados
  downloadTerms(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.toastService.showError('No hay usuario logueado');
      return;
    }

    // Mostrar modal de confirmación
    this.showTermsConfirmModal.set(true);
  }

  confirmDownloadTerms(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    // Cerrar modal
    this.showTermsConfirmModal.set(false);

    // Verificar si el usuario ha aceptado términos
    this.termsService.checkStatus(user.id_usuario).subscribe({
      next: (response) => {
        if (response.data.status === 'accepted') {
          // Generar PDF en el frontend
          this.generateTermsPdf(
            response.data.version || '1.0',
            response.data.contenido_html || '',
            response.data.fecha_aceptacion || new Date().toISOString()
          );
        } else {
          this.toastService.showWarning('No has aceptado los términos y condiciones aún.');
        }
      },
      error: (err) => {
        console.error('Error verificando términos', err);
        this.toastService.showError('Error al verificar los términos aceptados.');
      }
    });
  }

  closeTermsConfirmModal(): void {
    this.showTermsConfirmModal.set(false);
  }

  private generateTermsPdf(version: string, contenidoHtml: string, fechaAceptacion: string): void {
    const doc = new jsPDF();
    const user = this.authService.currentUser();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    // Título principal
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Términos y Condiciones', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Versión
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Versión: ${version}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Parsear HTML y generar contenido formateado
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contenidoHtml;

    // Procesar cada elemento hijo
    const processElement = (element: Element) => {
      const tagName = element.tagName.toLowerCase();

      // Verificar si necesitamos nueva página
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      switch (tagName) {
        case 'h1':
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          const h1Lines = doc.splitTextToSize(element.textContent || '', maxWidth);
          doc.text(h1Lines, margin, yPosition);
          yPosition += h1Lines.length * 8 + 5;
          break;

        case 'h2':
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          const h2Lines = doc.splitTextToSize(element.textContent || '', maxWidth);
          doc.text(h2Lines, margin, yPosition);
          yPosition += h2Lines.length * 7 + 4;
          break;

        case 'p':
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const pLines = doc.splitTextToSize(element.textContent || '', maxWidth);
          doc.text(pLines, margin, yPosition);
          yPosition += pLines.length * 5 + 3;
          break;

        case 'ul':
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const listItems = element.querySelectorAll('li');
          listItems.forEach((li) => {
            if (yPosition > pageHeight - 40) {
              doc.addPage();
              yPosition = 20;
            }
            const liText = '• ' + (li.textContent || '');
            const liLines = doc.splitTextToSize(liText, maxWidth - 5);
            doc.text(liLines, margin + 5, yPosition);
            yPosition += liLines.length * 5 + 2;
          });
          yPosition += 3;
          break;
      }
    };

    // Procesar todos los elementos
    Array.from(tempDiv.children).forEach(processElement);

    // Pie de página con información de aceptación
    const footerY = pageHeight - 30;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFont('helvetica', 'bold');
    doc.text('ACEPTACIÓN DIGITAL', pageWidth / 2, footerY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.text(`Usuario: ${user?.nombre_completo || 'N/A'}`, margin, footerY + 6);
    doc.text(`Fecha de aceptación: ${new Date(fechaAceptacion).toLocaleString('es-ES')}`, margin, footerY + 12);
    doc.text(`Documento generado: ${new Date().toLocaleString('es-ES')}`, margin, footerY + 18);

    // Descargar
    doc.save(`terminos_condiciones_v${version}_${user?.nombre_completo?.replace(/\s+/g, '_')}.pdf`);
  }
}
