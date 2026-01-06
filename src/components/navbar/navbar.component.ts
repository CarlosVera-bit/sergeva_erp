import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/sidebar.service';
import { NotificationsMenuComponent } from '../notifications-menu/notifications-menu.component';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, NotificationsMenuComponent],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
    authService = inject(AuthService);
    themeService = inject(ThemeService);
    private router = inject(Router);
    private sidebarService = inject(SidebarService);

    toggleSidebar(): void {
        this.sidebarService.toggleMobileMenu();
    }

    onLogout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
