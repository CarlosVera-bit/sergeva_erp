// filepath: src/services/authorization.service.ts
// Servicio para gestionar solicitudes de edición

import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import {
    Solicitud,
    SolicitudRequest,
    VerificarAccesoResponse,
    AprobarRechazarRequest,
    ListarPendientesResponse
} from '../models/authorization.models';

@Injectable({
    providedIn: 'root'
})
export class AuthorizationService {
    private apiUrl = 'http://localhost/Sergeva/backend/api';
    private authService = inject(AuthService);

    constructor(private http: HttpClient) { }

    /**
     * Solicita permiso para editar un registro
     */
    solicitarEdicion(tabla: string, idRegistro: number, motivo: string): Observable<any> {
        const userId = this.getUserId();

        const request: SolicitudRequest = {
            id_supervisor: userId,
            tabla: tabla,
            id_registro: idRegistro,
            motivo: motivo
        };

        return this.http.post(`${this.apiUrl}/solicitar_edicion.php`, request);
    }

    /**
     * Verifica si el supervisor tiene acceso aprobado para editar un registro
     */
    verificarAcceso(tabla: string, idRegistro: number): Observable<VerificarAccesoResponse> {
        const userId = this.getUserId();

        const params = new HttpParams()
            .set('id_supervisor', userId.toString())
            .set('tabla', tabla)
            .set('id_registro', idRegistro.toString());

        return this.http.get<any>(`${this.apiUrl}/verificar_acceso.php`, { params })
            .pipe(map(response => response.data));
    }

    /**
     * Lista solicitudes (para admins o supervisores)
     */
    listarPendientes(estado: string = 'pendiente'): Observable<Solicitud[]> {
        const userId = this.getUserId();
        let params = new HttpParams().set('estado', estado);

        if (this.isAdmin()) {
            params = params.set('id_admin', userId.toString());
        } else if (this.isSupervisor()) {
            params = params.set('id_supervisor', userId.toString());
            // Para supervisores, queremos ver todas sus solicitudes para detectar cambios de estado
            if (estado === 'pendiente' || !estado) {
                params = params.set('estado', 'todos');
            }
        }

        return this.http.get<any>(`${this.apiUrl}/listar_pendientes.php`, { params })
            .pipe(map(response => response.data.solicitudes));
    }

    /**
     * Cuenta solicitudes pendientes (para el badge)
     */
    contarPendientes(): Observable<number> {
        return this.listarPendientes('pendiente')
            .pipe(map(solicitudes => solicitudes.length));
    }

    /**
     * Aprueba una solicitud
     */
    aprobarSolicitud(idSolicitud: number, observaciones?: string): Observable<any> {
        const userId = this.getUserId();

        const request: AprobarRechazarRequest = {
            id_solicitud: idSolicitud,
            id_admin: userId,
            accion: 'aprobar',
            observaciones: observaciones
        };

        return this.http.post(`${this.apiUrl}/aprobar_rechazar.php`, request);
    }

    /**
     * Rechaza una solicitud
     */
    rechazarSolicitud(idSolicitud: number, observaciones?: string): Observable<any> {
        const userId = this.getUserId();

        const request: AprobarRechazarRequest = {
            id_solicitud: idSolicitud,
            id_admin: userId,
            accion: 'rechazar',
            observaciones: observaciones
        };

        return this.http.post(`${this.apiUrl}/aprobar_rechazar.php`, request);
    }

    /**
     * Obtiene el ID del usuario desde AuthService o localStorage
     */
    private getUserId(): number {
        const user = this.authService.currentUser();
        if (user) return user.id_usuario;

        const userJson = localStorage.getItem('currentUser');
        if (userJson) {
            try {
                return JSON.parse(userJson).id_usuario || 0;
            } catch (e) {
                return 0;
            }
        }
        return 0;
    }

    /**
     * Verifica si el usuario actual es admin
     */
    isAdmin(): boolean {
        const user = this.authService.currentUser();
        if (user) return user.rol === 'admin';

        return localStorage.getItem('userRol') === 'admin';
    }

    /**
     * Verifica si el usuario actual es supervisor
     */
    isSupervisor(): boolean {
        const user = this.authService.currentUser();
        if (user) return user.rol === 'supervisor';

        return localStorage.getItem('userRol') === 'supervisor';
    }
}
