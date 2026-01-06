import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  isMobileMenuOpen = signal(false);
  isCollapsed = signal<boolean>(localStorage.getItem('sidebar-collapsed') === '1');

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(open => !open);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  toggleCollapse() {
    this.isCollapsed.update(collapsed => {
      const next = !collapsed;
      try { 
        localStorage.setItem('sidebar-collapsed', next ? '1' : '0'); 
      } catch {}
      return next;
    });
  }
}
