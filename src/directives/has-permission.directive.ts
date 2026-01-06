import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export type ActionType = 'view' | 'edit' | 'delete' | 'create';

@Directive({
    selector: '[appHasPermission]',
    standalone: true
})
export class HasPermissionDirective implements OnInit {
    private authService = inject(AuthService);
    private templateRef = inject(TemplateRef<any>);
    private viewContainer = inject(ViewContainerRef);
    private router = inject(Router);

    @Input('appHasPermission') action: ActionType = 'view';
    @Input('appHasPermissionModuleName') moduleName?: string;

    ngOnInit(): void {
        this.updateView();
    }

    private updateView(): void {
        const userRole = this.authService.getUserRol();

        if (!userRole) {
            this.viewContainer.clear();
            return;
        }

        const hasPermission = this.checkPermission(userRole, this.action, this.moduleName);

        if (hasPermission) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        } else {
            this.viewContainer.clear();
        }
    }

    private checkPermission(role: string, action: ActionType, module?: string): boolean {
        // 1. Admin siempre tiene permiso total
        if (role === 'admin') return true;

        // 2. Lógica para Supervisor
        if (role === 'supervisor') {
            // El supervisor siempre puede ver ('view')
            if (action === 'view') return true;

            // Solo puede editar/borrar/crear en módulos específicos
            const allowedModules = ['hr', 'schedule', 'control-horas', 'cronograma', 'schedule-export', 'schedule-workers'];
            if (module && allowedModules.includes(module)) {
                return true;
            }

            return false;
        }

        // 3. Lógica para Operativo / Trabajador y acceso universal a registro-horas
        if (module === 'registro-horas') return true;

        if (role === 'operativo' || role === 'trabajador' || role === 'operador') {
            // Solo tienen permiso en su módulo específico (registro-horas), que ya se cubrió arriba
            return false;
        }

        // 4. Otros roles (gerente, bodeguero, contador)
        // Aquí podrías añadir lógica específica si fuera necesario
        if (action === 'view') return true;

        return false;
    }
}
