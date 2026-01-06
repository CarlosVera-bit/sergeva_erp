import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

export interface OtLink {
    id_link?: number;
    id_ot: number;
    id_usuario?: number;
    url: string;
    titulo?: string;
    descripcion?: string;
    fecha_creacion?: string;
    usuario_nombre?: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class OtLinksService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/ot_links.php`;

    // Signals para estado
    isLoading = signal(false);
    error = signal<string | null>(null);
    links = signal<OtLink[]>([]);

    /**
     * Obtener todos los links de una orden de trabajo
     */
    async getLinks(idOt: number): Promise<OtLink[]> {
        this.isLoading.set(true);
        this.error.set(null);

        try {
            const response = await firstValueFrom(
                this.http.get<ApiResponse<OtLink[]>>(`${this.apiUrl}?id_ot=${idOt}`)
            );

            if (response.success) {
                this.links.set(response.data);
                return response.data;
            } else {
                throw new Error(response.message);
            }
        } catch (e: any) {
            const errorMsg = e.message || 'Error al cargar links';
            this.error.set(errorMsg);
            throw e;
        } finally {
            this.isLoading.set(false);
        }
    }

    /**
     * Agregar un nuevo link a una orden de trabajo
     */
    async addLink(link: OtLink): Promise<OtLink> {
        this.isLoading.set(true);
        this.error.set(null);

        try {
            const response = await firstValueFrom(
                this.http.post<ApiResponse<OtLink>>(this.apiUrl, link)
            );

            if (response.success) {
                // Actualizar lista local
                const currentLinks = this.links();
                this.links.set([response.data, ...currentLinks]);
                return response.data;
            } else {
                throw new Error(response.message);
            }
        } catch (e: any) {
            const errorMsg = e.message || 'Error al agregar link';
            this.error.set(errorMsg);
            throw e;
        } finally {
            this.isLoading.set(false);
        }
    }

    /**
     * Eliminar un link
     */
    async deleteLink(idLink: number): Promise<void> {
        this.isLoading.set(true);
        this.error.set(null);

        try {
            const response = await firstValueFrom(
                this.http.delete<ApiResponse<any>>(`${this.apiUrl}?id=${idLink}`)
            );

            if (response.success) {
                // Actualizar lista local
                const currentLinks = this.links();
                this.links.set(currentLinks.filter(l => l.id_link !== idLink));
            } else {
                throw new Error(response.message);
            }
        } catch (e: any) {
            const errorMsg = e.message || 'Error al eliminar link';
            this.error.set(errorMsg);
            throw e;
        } finally {
            this.isLoading.set(false);
        }
    }

    /**
     * Compartir link por Email
     */
    shareViaEmail(url: string, title?: string): void {
        const subject = encodeURIComponent(title || 'Link compartido desde Sergeva ERP');
        const body = encodeURIComponent(`Te comparto este link:\n\n${url}\n\n${title ? `Título: ${title}` : ''}`);
        const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
        window.open(mailtoLink, '_blank');
    }

    /**
     * Compartir link por WhatsApp
     */
    shareViaWhatsApp(url: string, title?: string): void {
        const text = encodeURIComponent(`${title ? title + '\n' : ''}${url}`);
        const whatsappUrl = `https://wa.me/?text=${text}`;
        window.open(whatsappUrl, '_blank');
    }

    /**
     * Copiar link al portapapeles
     */
    async copyToClipboard(url: string): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(url);
            return true;
        } catch (err) {
            console.error('Error al copiar al portapapeles:', err);
            // Fallback para navegadores antiguos
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (e) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    /**
     * Validar si una URL es válida
     */
    isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Limpiar estado
     */
    clearState(): void {
        this.links.set([]);
        this.error.set(null);
        this.isLoading.set(false);
    }
}
