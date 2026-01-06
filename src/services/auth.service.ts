import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from './database.service';

export interface User {
  id_usuario: number;
  nombre_completo: string;
  email: string;
  rol: 'admin' | 'gerente' | 'supervisor' | 'bodeguero' | 'contador' | 'operador';
  activo: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private dbService = inject(DatabaseService);
  private router = inject(Router);

  currentUser = signal<User | null>(null);

  constructor() {
    // Verificar si hay un usuario en localStorage al iniciar
    this.loadUserFromStorage();

    // Si hay un usuario cargado, conectar automáticamente a la BD
    if (this.currentUser()) {
      this.dbService.connect().then(() => {
        console.log('✅ Base de datos conectada automáticamente');
      });
    }
  }

  /**
   * Carga el usuario desde localStorage
   */
  private loadUserFromStorage(): void {
    try {
      const userJson = localStorage.getItem('currentUser');
      const email = localStorage.getItem('userEmail');
      const rol = localStorage.getItem('userRol');

      if (userJson) {
        const user = JSON.parse(userJson);
        this.currentUser.set(user);
      } else if (email && rol) {
        // Si solo tenemos email y rol, crear un usuario básico
        this.currentUser.set({
          id_usuario: 0,
          nombre_completo: '',
          email,
          rol: rol as any,
          activo: true
        });
      }
    } catch (error) {
      console.error('Error al cargar usuario desde localStorage:', error);
      this.clearStorage();
    }
  }

  /**
   * Guarda el usuario en localStorage
   */
  private saveUserToStorage(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userRol', user.rol);
  }

  /**
   * Limpia el localStorage
   */
  private clearStorage(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRol');
  }

  /**
   * Inicia sesión con email y contraseña
   * La verificación de contraseña se hace en el backend con PHP
   */
  async login(email: string, password: string): Promise<void> {
    try {
      // Conectar temporalmente a la BD si no está conectada
      const wasConnected = this.dbService.connected();
      if (!wasConnected) {
        await this.dbService.connect();
      }

      // Llamar al endpoint de login que verifica la contraseña en PHP
      const userData = await this.dbService.post('login', {
        email,
        password
      });

      if (!wasConnected) {
        this.dbService.disconnect();
      }

      // Verificar que el usuario esté activo
      if (!userData.activo) {
        throw new Error('La cuenta de usuario está inactiva.');
      }

      // Crear objeto de usuario con el formato correcto
      const user: User = {
        id_usuario: parseInt(userData.id_usuario),
        nombre_completo: userData.nombre_completo,
        email: userData.email,
        rol: userData.rol,
        activo: userData.activo === 1 || userData.activo === '1' || userData.activo === true,
      };

      // Guardar en signal y localStorage
      this.currentUser.set(user);
      this.saveUserToStorage(user);

      console.log('✅ Login exitoso:', user);

      // Conectar a la base de datos para que los componentes puedan cargar datos
      await this.dbService.connect();

      // Redirigir según el rol
      if (['operativo', 'trabajador', 'operador'].includes(user.rol)) {
        this.router.navigate(['/hr']);
      } else {
        this.router.navigate(['/dashboard']);
      }

    } catch (error: any) {
      console.error('❌ Error en login:', error);
      this.currentUser.set(null);
      this.clearStorage();
      throw error;
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    this.currentUser.set(null);
    this.clearStorage();

    // Desconectar de la BD si está conectada
    if (this.dbService.connected()) {
      this.dbService.disconnect();
    }

    // Redirigir al login
    this.router.navigate(['/login']);
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  /**
   * Obtiene el email del usuario actual desde localStorage
   */
  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  /**
   * Obtiene el rol del usuario actual desde localStorage
   */
  getUserRol(): string | null {
    return localStorage.getItem('userRol');
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const userRol = this.getUserRol();
    return userRol === role;
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: string[]): boolean {
    const userRol = this.getUserRol();
    return userRol ? roles.includes(userRol) : false;
  }
}
