import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface TermStatusResponse {
    success: boolean;
    data: {
        status: 'accepted' | 'pending' | 'not_required';
        termino_id?: number;
        version?: string;
        contenido_html?: string;
        fecha_aceptacion?: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class TermsService {
    // Ajustar la URL base según la configuración del entorno
    private apiUrl = environment.apiUrl + '/terminos.php';

    constructor(private http: HttpClient) { }

    checkStatus(usuarioId: number): Observable<TermStatusResponse> {
        return this.http.get<TermStatusResponse>(`${this.apiUrl}?action=check_status&usuario_id=${usuarioId}`);
    }

    acceptTerms(usuarioId: number, terminoId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}?action=accept`, {
            usuario_id: usuarioId,
            termino_id: terminoId
        });
    }

    getDownloadUrl(usuarioId: number, terminoId: number): string {
        return `${this.apiUrl}?action=download_pdf&usuario_id=${usuarioId}&termino_id=${terminoId}`;
    }
}
