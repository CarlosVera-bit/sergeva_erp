import { Component, ChangeDetectionStrategy, inject, effect, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { signal } from '@angular/core';
import { filter } from 'rxjs/operators';

import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ToastComponent } from './components/toast/toast.component';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal.component';
import { TermsModalComponent } from './components/terms-modal/terms-modal.component';
import { DataPreloadService } from './services/data-preload.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    NavbarComponent,
    ToastComponent,
    ConfirmationModalComponent,
    TermsModalComponent
  ],
})
export class AppComponent {
  private router = inject(Router);
  private preloadService = inject(DataPreloadService);
  private authService = inject(AuthService);
  showSidebar = signal(true);

  // Obtener el ID del usuario autenticado actual
  currentUserId = computed(() => this.authService.currentUser()?.id_usuario || 0);

  @ViewChild(TermsModalComponent) termsModal?: TermsModalComponent;
  private previousUrl: string = '';

  constructor() {
    // Escuchar cambios de ruta para mostrar/ocultar el sidebar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Ocultar sidebar en cualquier ruta que empiece por /login
      const url = (event as NavigationEnd).urlAfterRedirects || (event as NavigationEnd).url;
      this.showSidebar.set(!url.startsWith('/login'));

      // Precargar datos solo cuando el usuario navega al dashboard (después del login)
      if (url.startsWith('/dashboard') && !this.preloadService.isLoaded()) {
        this.preloadDataOnStartup();
      }

      // Verificar términos en CADA navegación a rutas que no sean login
      // Esto asegura que el modal aparezca incluso al recargar la página
      if (!url.startsWith('/login') && this.authService.currentUser()) {
        // Esperar un momento para que el ViewChild esté disponible
        setTimeout(() => {
          if (this.termsModal) {
            this.termsModal.checkStatus();
          }
        }, 100);
      }

      // Guardar URL anterior para la próxima navegación
      this.previousUrl = url;
    });

    // Verificar la ruta inicial (maneja casos con query params/fragmentos)
    const initialUrl = this.router.url || '';
    this.showSidebar.set(!initialUrl.startsWith('/login'));
    this.previousUrl = initialUrl;
  }

  private async preloadDataOnStartup(): Promise<void> {
    console.log('🚀 Iniciando precarga de datos...');
    await this.preloadService.preloadAllData();
    console.log('✅ Datos cargados exitosamente');
  }
}
