import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, interval, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface RefreshConfig {
  intervalSeconds: number;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AutoRefreshService implements OnDestroy {
  private readonly DEFAULT_INTERVAL = 5; // 5 segundos por defecto
  private readonly STORAGE_KEY = 'autoRefreshConfig';
  
  private refreshSubject = new Subject<void>();
  private configSubject = new BehaviorSubject<RefreshConfig>({
    intervalSeconds: this.DEFAULT_INTERVAL,
    enabled: true
  });
  
  private intervalSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();
  
  // Observable público para que los componentes se suscriban
  public refresh$ = this.refreshSubject.asObservable();
  public config$ = this.configSubject.asObservable();
  
  constructor() {
    this.loadConfig();
    this.startAutoRefresh();
  }
  
  /**
   * Cargar configuración desde localStorage
   */
  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored) as RefreshConfig;
        this.configSubject.next(config);
      }
    } catch (e) {
      console.warn('Error loading auto-refresh config:', e);
    }
  }
  
  /**
   * Guardar configuración en localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.configSubject.value));
    } catch (e) {
      console.warn('Error saving auto-refresh config:', e);
    }
  }
  
  /**
   * Iniciar el auto-refresh
   */
  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    
    const config = this.configSubject.value;
    if (!config.enabled) return;
    
    const intervalMs = config.intervalSeconds * 1000;
    
    this.intervalSubscription = interval(intervalMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.triggerRefresh();
      });
    
    console.log(`Auto-refresh iniciado: cada ${config.intervalSeconds} segundos`);
  }
  
  /**
   * Detener el auto-refresh
   */
  private stopAutoRefresh(): void {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
      this.intervalSubscription = null;
    }
  }
  
  /**
   * Disparar un refresh manualmente o por intervalo
   */
  public triggerRefresh(): void {
    this.refreshSubject.next();
  }
  
  /**
   * Habilitar/deshabilitar auto-refresh
   */
  public setEnabled(enabled: boolean): void {
    const config = { ...this.configSubject.value, enabled };
    this.configSubject.next(config);
    this.saveConfig();
    
    if (enabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }
  
  /**
   * Cambiar el intervalo de refresh
   */
  public setInterval(seconds: number): void {
    if (seconds < 1) seconds = 1;
    if (seconds > 300) seconds = 300; // Máximo 5 minutos
    
    const config = { ...this.configSubject.value, intervalSeconds: seconds };
    this.configSubject.next(config);
    this.saveConfig();
    
    // Reiniciar con el nuevo intervalo
    if (config.enabled) {
      this.startAutoRefresh();
    }
  }
  
  /**
   * Obtener configuración actual
   */
  public getConfig(): RefreshConfig {
    return this.configSubject.value;
  }
  
  /**
   * Verificar si está habilitado
   */
  public isEnabled(): boolean {
    return this.configSubject.value.enabled;
  }
  
  /**
   * Obtener intervalo actual en segundos
   */
  public getIntervalSeconds(): number {
    return this.configSubject.value.intervalSeconds;
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAutoRefresh();
  }
}
