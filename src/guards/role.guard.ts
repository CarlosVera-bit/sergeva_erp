import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional para proteger rutas basado en roles.
 */
export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Obtener los roles permitidos desde la configuración de la ruta
    const expectedRoles = route.data['roles'] as string[];
    const userRole = authService.getUserRol();

    if (!authService.isAuthenticated() || !userRole) {
        router.navigate(['/login']);
        return false;
    }

    // Normalización de roles: trabajador, operador y operativo son equivalentes
    const normalizedUserRole = (userRole === 'trabajador' || userRole === 'operativo' || userRole === 'operador')
        ? 'operativo'
        : userRole;

    const normalizedExpectedRoles = expectedRoles.map(role =>
        (role === 'trabajador' || role === 'operativo' || role === 'operador') ? 'operativo' : role
    );

    // El admin siempre tiene acceso
    if (userRole === 'admin') {
        return true;
    }

    // Verificar si el rol del usuario está en la lista de roles permitidos
    if (normalizedExpectedRoles.includes(normalizedUserRole)) {
        return true;
    }

    // Si no tiene permiso, redirigir al dashboard o una página de acceso denegado
    console.warn(`Acceso denegado para el rol: ${userRole} en la ruta: ${state.url}`);

    if (normalizedUserRole === 'operativo') {
        router.navigate(['/hr']);
    } else {
        router.navigate(['/dashboard']);
    }
    return false;
};