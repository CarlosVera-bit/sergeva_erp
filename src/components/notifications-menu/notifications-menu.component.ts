// filepath: src/components/notifications-menu/notifications-menu.component.ts
// Componente de notificaciones para el navbar del admin

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AuthorizationService } from '../../services/authorization.service';
import { Solicitud } from '../../models/authorization.models';
import Swal from 'sweetalert2';
import { interval, Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-notifications-menu',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notifications-menu.component.html',
    styleUrls: ['./notifications-menu.component.css']
})
export class NotificationsMenuComponent implements OnInit, OnDestroy {
    solicitudesPendientes: Solicitud[] = [];
    contadorPendientes: number = 0;
    isDropdownOpen: boolean = false;
    private notifiedSolicitudes: Set<number> = new Set();
    private dismissedSolicitudes: Set<number> = new Set();
    private pollingSubscription?: Subscription;

    constructor(
        public authService: AuthorizationService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // Usar un pequeño delay o verificar periódicamente si el usuario está listo
        // si no lo está en el primer ciclo
        this.inicializarComponente();
    }

    private inicializarComponente(): void {
        if (!this.authService.isAdmin() && !this.authService.isSupervisor()) {
            // Reintentar en 1 segundo si aún no hay rol (posible delay en carga de auth)
            setTimeout(() => {
                if (this.authService.isAdmin() || this.authService.isSupervisor()) {
                    this.startComponent();
                }
            }, 1000);
            return;
        }
        this.startComponent();
    }

    private startComponent(): void {
        // Cargar IDs descartados y notificados
        this.dismissedSolicitudes = this.getDismissedIds();
        this.notifiedSolicitudes = this.getNotifiedIds();

        // Polling cada 30 segundos, empezando de inmediato (0)
        this.pollingSubscription = timer(0, 30000)
            .pipe(switchMap(() => {
                const estado = this.authService.isAdmin() ? 'pendiente' : 'todos';
                return this.authService.listarPendientes(estado);
            }))
            .subscribe(
                solicitudes => {
                    this.procesarSolicitudes(solicitudes);
                },
                error => console.error('Error en polling de notificaciones:', error)
            );
    }

    ngOnDestroy(): void {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
        }
    }

    cargarSolicitudes(): void {
        const estado = this.authService.isAdmin() ? 'pendiente' : '';
        this.authService.listarPendientes(estado).subscribe(
            solicitudes => {
                this.procesarSolicitudes(solicitudes);
            },
            error => {
                console.error('Error al cargar solicitudes:', error);
            }
        );
    }

    procesarSolicitudes(solicitudes: Solicitud[]): void {
        if (this.authService.isAdmin()) {
            this.solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente');
            this.contadorPendientes = this.solicitudesPendientes.length;
        } else if (this.authService.isSupervisor()) {
            // Para supervisores, mostrar aprobadas/rechazadas recientes que no hayan sido descartadas
            this.solicitudesPendientes = solicitudes.filter(s =>
                s.estado !== 'pendiente' && !this.dismissedSolicitudes.has(s.id_solicitud)
            );

            // Contar solo las que no han sido vistas y no están descartadas
            const seenIds = this.getSeenIds();
            this.contadorPendientes = this.solicitudesPendientes.filter(s => !seenIds.has(s.id_solicitud)).length;

            // Notificar por SweetAlert2 si hay nuevas aprobaciones/rechazos
            solicitudes.forEach(s => {
                if (s.estado !== 'pendiente' && !this.notifiedSolicitudes.has(s.id_solicitud)) {
                    this.notificarSupervisor(s);
                    this.notifiedSolicitudes.add(s.id_solicitud);
                    this.saveNotifiedIds(this.notifiedSolicitudes);
                }
            });
        }

        // Forzar detección de cambios ya que el Navbar usa OnPush
        this.cdr.detectChanges();
    }

    private getSeenIds(): Set<number> {
        const stored = localStorage.getItem('seen_notifications');
        if (!stored) return new Set();
        try {
            return new Set(JSON.parse(stored));
        } catch {
            return new Set();
        }
    }

    private saveSeenIds(ids: Set<number>): void {
        localStorage.setItem('seen_notifications', JSON.stringify(Array.from(ids)));
    }

    marcarTodasComoLeidas(): void {
        const seenIds = this.getSeenIds();
        this.solicitudesPendientes.forEach(s => seenIds.add(s.id_solicitud));
        this.saveSeenIds(seenIds);
        this.contadorPendientes = 0;
        this.cdr.detectChanges();
    }

    limpiarHistorial(): void {
        this.solicitudesPendientes.forEach(s => this.dismissedSolicitudes.add(s.id_solicitud));
        this.saveDismissedIds(this.dismissedSolicitudes);
        this.solicitudesPendientes = [];
        this.contadorPendientes = 0;
        this.cdr.detectChanges();
    }

    private getDismissedIds(): Set<number> {
        const stored = localStorage.getItem('dismissed_notifications');
        if (!stored) return new Set();
        try {
            return new Set(JSON.parse(stored));
        } catch {
            return new Set();
        }
    }

    private saveDismissedIds(ids: Set<number>): void {
        localStorage.setItem('dismissed_notifications', JSON.stringify(Array.from(ids)));
    }

    private getNotifiedIds(): Set<number> {
        const stored = localStorage.getItem('notified_popups');
        if (!stored) return new Set();
        try {
            return new Set(JSON.parse(stored));
        } catch {
            return new Set();
        }
    }

    private saveNotifiedIds(ids: Set<number>): void {
        localStorage.setItem('notified_popups', JSON.stringify(Array.from(ids)));
    }

    notificarSupervisor(solicitud: Solicitud): void {
        const esAprobada = solicitud.estado === 'aprobada';
        Swal.fire({
            icon: esAprobada ? 'success' : 'error',
            title: esAprobada ? '¡Solicitud Aprobada!' : 'Solicitud Rechazada',
            html: `
                <p>Tu solicitud para editar <strong>${this.getNombreTabla(solicitud.tabla_objetivo)}</strong> (#${solicitud.id_registro}) ha sido ${solicitud.estado}.</p>
                ${solicitud.observaciones_admin ? `<p><strong>Obs:</strong> ${solicitud.observaciones_admin}</p>` : ''}
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: esAprobada ? '#28a745' : '#dc3545'
        });
    }

    toggleDropdown(): void {
        this.isDropdownOpen = !this.isDropdownOpen;

        // Si se abre el dropdown, marcar todas como leídas (para supervisores)
        if (this.isDropdownOpen && this.authService.isSupervisor()) {
            this.marcarTodasComoLeidas();
        }
    }

    aprobarSolicitud(solicitud: Solicitud): void {
        Swal.fire({
            title: '¿Aprobar solicitud?',
            html: `
        <p><strong>Supervisor:</strong> ${solicitud.nombre_supervisor}</p>
        <p><strong>Tabla:</strong> ${solicitud.tabla_objetivo}</p>
        <p><strong>Registro ID:</strong> ${solicitud.id_registro}</p>
        <p><strong>Motivo:</strong> ${solicitud.motivo}</p>
      `,
            input: 'textarea',
            inputLabel: 'Observaciones (opcional)',
            inputPlaceholder: 'Agrega comentarios si lo deseas...',
            showCancelButton: true,
            confirmButtonText: '✓ Aprobar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            showLoaderOnConfirm: true,
            preConfirm: (observaciones: string) => {
                return this.authService.aprobarSolicitud(solicitud.id_solicitud, observaciones)
                    .toPromise()
                    .catch(error => {
                        Swal.showValidationMessage(`Error: ${error.message}`);
                    });
            }
        }).then((result: any) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Solicitud Aprobada',
                    text: 'El supervisor ahora puede editar el registro',
                    timer: 2000,
                    showConfirmButton: false
                });
                this.cargarSolicitudes();
            }
        });
    }

    rechazarSolicitud(solicitud: Solicitud): void {
        Swal.fire({
            title: '¿Rechazar solicitud?',
            html: `
        <p><strong>Supervisor:</strong> ${solicitud.nombre_supervisor}</p>
        <p><strong>Tabla:</strong> ${solicitud.tabla_objetivo}</p>
        <p><strong>Motivo:</strong> ${solicitud.motivo}</p>
      `,
            input: 'textarea',
            inputLabel: 'Motivo del rechazo',
            inputPlaceholder: 'Explica por qué rechazas esta solicitud...',
            showCancelButton: true,
            confirmButtonText: '✗ Rechazar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545',
            showLoaderOnConfirm: true,
            preConfirm: (observaciones: string) => {
                if (!observaciones) {
                    Swal.showValidationMessage('Debes proporcionar un motivo para el rechazo');
                    return false;
                }
                return this.authService.rechazarSolicitud(solicitud.id_solicitud, observaciones)
                    .toPromise()
                    .catch(error => {
                        Swal.showValidationMessage(`Error: ${error.message}`);
                    });
            }
        }).then((result: any) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'info',
                    title: 'Solicitud Rechazada',
                    text: 'Se ha notificado al supervisor',
                    timer: 2000,
                    showConfirmButton: false
                });
                this.cargarSolicitudes();
            }
        });
    }

    getNombreTabla(tabla: string): string {
        const nombres: { [key: string]: string } = {
            'ordenes_trabajo': 'Orden de Trabajo',
            'clientes': 'Cliente',
            'cotizaciones': 'Cotización',
            'proyectos': 'Proyecto',
            'trabajadores': 'Trabajador',
            'pedidos_compra': 'Pedido de Compra'
        };
        return nombres[tabla] || tabla;
    }

    getTiempoTranscurrido(fecha: string): string {
        const ahora = new Date();
        const fechaSolicitud = new Date(fecha);
        const diffMs = ahora.getTime() - fechaSolicitud.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) {
            return `Hace ${diffMins} min`;
        } else if (diffMins < 1440) {
            const horas = Math.floor(diffMins / 60);
            return `Hace ${horas}h`;
        } else {
            const dias = Math.floor(diffMins / 1440);
            return `Hace ${dias}d`;
        }
    }
}
