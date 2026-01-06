import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_KEY = 'sergeva-theme';

    // Signal para el tema actual
    currentTheme = signal<Theme>(this.getInitialTheme());

    constructor() {
        // Efecto para aplicar el tema cuando cambie
        effect(() => {
            const theme = this.currentTheme();
            this.applyTheme(theme);
            localStorage.setItem(this.THEME_KEY, theme);
        });
    }

    /**
     * Obtiene el tema inicial desde localStorage o preferencias del sistema
     */
    private getInitialTheme(): Theme {
        const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
        if (savedTheme) {
            return savedTheme;
        }

        // Si no hay tema guardado, usar preferencias del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    /**
     * Aplica el tema al documento
     */
    private applyTheme(theme: Theme): void {
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }

    /**
     * Alterna entre tema claro y oscuro
     */
    toggleTheme(): void {
        this.currentTheme.update(current => current === 'light' ? 'dark' : 'light');
    }

    /**
     * Establece un tema específico
     */
    setTheme(theme: Theme): void {
        this.currentTheme.set(theme);
    }
}
