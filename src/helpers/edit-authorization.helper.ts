// filepath: src/helpers/edit-authorization.helper.ts
// Helper para manejar la lógica de autorización de edición en componentes

import { AuthorizationService } from '../services/authorization.service';
import Swal from 'sweetalert2';

export class EditAuthorizationHelper {

    constructor(private authService: AuthorizationService) { }

    /**
     * Maneja el click en el botón editar
     * Verifica acceso y solicita permiso si es necesario
     */
    async handleEditClick(
        tabla: string,
        idRegistro: number,
        onEditAllowed: () => void
    ): Promise<void> {
        // Si es admin, permitir edición directamente
        if (this.authService.isAdmin()) {
            onEditAllowed();
            return;
        }

        // Si es supervisor, verificar acceso
        if (this.authService.isSupervisor()) {
            try {
                const acceso = await this.authService.verificarAcceso(tabla, idRegistro).toPromise();

                if (acceso && acceso.tiene_acceso) {
                    // Tiene acceso aprobado, permitir edición
                    onEditAllowed();
                } else if (acceso && acceso.estado === 'pendiente') {
                    // Ya hay una solicitud pendiente
                    Swal.fire({
                        icon: 'info',
                        title: 'Solicitud Pendiente',
                        text: 'Ya tienes una solicitud de edición pendiente para este registro. Por favor, espera a que el administrador la apruebe.',
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#667eea'
                    });
                } else {
                    // No tiene acceso (ninguna o rechazada), solicitar permiso
                    await this.solicitarPermiso(tabla, idRegistro);
                }
            } catch (error) {
                console.error('Error al verificar acceso:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo verificar el acceso. Intenta nuevamente.'
                });
            }
        } else {
            // Rol no autorizado
            Swal.fire({
                icon: 'warning',
                title: 'Acceso Denegado',
                text: 'No tienes permisos para editar este registro'
            });
        }
    }

    /**
     * Muestra modal para solicitar permiso de edición
     */
    private async solicitarPermiso(tabla: string, idRegistro: number): Promise<void> {
        const { value: motivo } = await Swal.fire({
            title: 'Solicitar Permiso de Edición',
            html: `
        <p>Necesitas autorización del administrador para editar este registro.</p>
        <p><strong>Tabla:</strong> ${this.getNombreTabla(tabla)}</p>
        <p><strong>Registro ID:</strong> #${idRegistro}</p>
      `,
            input: 'textarea',
            inputLabel: 'Motivo de la edición',
            inputPlaceholder: 'Explica por qué necesitas editar este registro...',
            inputAttributes: {
                'aria-label': 'Motivo de la edición',
                'rows': '4'
            },
            showCancelButton: true,
            confirmButtonText: 'Enviar Solicitud',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#667eea',
            inputValidator: (value: string) => {
                if (!value || value.trim().length < 10) {
                    return 'El motivo debe tener al menos 10 caracteres';
                }
                return null;
            }
        });

        if (motivo) {
            try {
                await this.authService.solicitarEdicion(tabla, idRegistro, motivo).toPromise();

                Swal.fire({
                    icon: 'success',
                    title: 'Solicitud Enviada',
                    html: `
            <p>Tu solicitud ha sido enviada al administrador.</p>
            <p>Recibirás una notificación cuando sea aprobada.</p>
          `,
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#28a745'
                });
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al Enviar',
                    text: error.error?.message || 'No se pudo enviar la solicitud. Intenta nuevamente.'
                });
            }
        }
    }

    /**
     * Obtiene el nombre legible de una tabla
     */
    private getNombreTabla(tabla: string): string {
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
}

/**
 * Ejemplo de uso en un componente:
 * 
 * export class WorkOrderListComponent {
 *   private editHelper: EditAuthorizationHelper;
 * 
 *   constructor(private authService: AuthorizationService) {
 *     this.editHelper = new EditAuthorizationHelper(authService);
 *   }
 * 
 *   onClickEdit(idOt: number): void {
 *     this.editHelper.handleEditClick(
 *       'ordenes_trabajo',
 *       idOt,
 *       () => this.abrirFormularioEdicion(idOt)
 *     );
 *   }
 * 
 *   private abrirFormularioEdicion(idOt: number): void {
 *     // Lógica para abrir el formulario de edición
 *     this.router.navigate(['/ordenes-trabajo/editar', idOt]);
 *   }
 * }
 */
