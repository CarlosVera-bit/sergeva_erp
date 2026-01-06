import { Component, signal, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeolocationService } from '../../services/geolocation.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-geolocation-capture',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-white">Paso 2: Geolocalización</h3>
      <span *ngIf="location()" class="px-3 py-1 rounded-full text-sm font-semibold" 
        [class]="getPrecisionClass()">
        Precisión: {{ location()!.accuracy | number:'1.0-0' }}m
      </span>
    </div>
    
    <button (click)="getLocation()" [disabled]="loading()" 
      style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 0.875rem 1rem; background: linear-gradient(to right, #059669, #047857); color: white; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600; font-size: 0.9375rem; transition: all 0.2s;" [style.opacity]="loading() ? 0.7 : 1">
      <svg *ngIf="!loading()" style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <svg *ngIf="loading()" class="animate-spin" style="width: 1.25rem; height: 1.25rem;" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {{ loading() ? 'Obteniendo ubicación precisa...' : (location() ? 'Actualizar ubicación' : 'Obtener ubicación') }}
    </button>

    <!-- Mensaje mientras carga -->
    <div *ngIf="loading()" class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <p class="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
        <svg class="animate-pulse w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
        </svg>
        Buscando señal GPS precisa... Mantente quieto para mejor resultado.
      </p>
    </div>
    
    <div *ngIf="location()" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">COORDENADAS</p>
          <p class="text-sm font-mono text-slate-800 dark:text-white">{{ location()!.latitude | number:'1.6-6' }}, {{ location()!.longitude | number:'1.6-6' }}</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">ESTADO</p>
          <span class="inline-flex items-center gap-1 text-sm font-semibold" 
            [class]="location()!.withinAllowedRadius ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path *ngIf="location()!.withinAllowedRadius" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              <path *ngIf="!location()!.withinAllowedRadius" fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            {{ location()!.withinAllowedRadius ? 'Dentro del radio' : 'Fuera del radio' }}
          </span>
        </div>
      </div>
      
      <div class="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
        <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">DIRECCIÓN</p>
        <p class="text-sm text-slate-800 dark:text-white">{{ location()!.address }}</p>
      </div>
      
      <!-- Mapa interactivo con OpenStreetMap -->
      <div class="rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-600 shadow-lg">
        <iframe 
          [src]="getMapUrl()"
          style="width: 100%; height: 250px; border: none;"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Ubicación en mapa">
        </iframe>
      </div>

      <!-- Link para abrir en Google Maps -->
      <a [href]="getGoogleMapsLink()" target="_blank" rel="noopener noreferrer"
        class="flex items-center justify-center gap-2 w-full p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        Ver ubicación exacta en Google Maps
      </a>
      
      <div *ngIf="!location()!.withinAllowedRadius" class="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <p class="text-sm text-orange-800 dark:text-orange-300">
          ⚠ Estás fuera del radio permitido. El registro se guardará con esta observación.
        </p>
      </div>
      
      <div *ngIf="location()!.accuracy > 50" class="p-3 rounded-lg" [class]="location()!.accuracy > 100 ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'">
        <p class="text-sm" [class]="location()!.accuracy > 100 ? 'text-yellow-800 dark:text-yellow-300' : 'text-blue-800 dark:text-blue-300'">
          {{ location()!.accuracy > 100 ? '⚠️ Precisión GPS baja' : 'ℹ️ Precisión GPS moderada' }} ({{location()!.accuracy | number:'1.0-0'}}m). 
          {{ location()!.accuracy > 100 ? 'Sal al aire libre o acércate a una ventana.' : 'Puedes intentar actualizar para mejor precisión.' }}
        </p>
      </div>

      <!-- Precisión excelente -->
      <div *ngIf="location()!.accuracy <= 20" class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p class="text-sm text-green-800 dark:text-green-300">
          ✅ ¡Excelente precisión GPS! ({{location()!.accuracy | number:'1.0-0'}}m)
        </p>
      </div>
    </div>
  </div>
  `,
})
export class GeolocationCaptureComponent {
  location = signal<{ latitude: number; longitude: number; accuracy: number; address: string; withinAllowedRadius: boolean } | null>(null);
  loading = signal<boolean>(false);
  
  // Output para emitir datos al componente padre
  locationCaptured = output<any>();

  constructor(private geo: GeolocationService, private sanitizer: DomSanitizer) {
    // Emitir ubicación cuando se capture
    effect(() => {
      const loc = this.location();
      if (loc) {
        this.locationCaptured.emit(loc);
      }
    });
  }

  getPrecisionClass(): string {
    const accuracy = this.location()?.accuracy || 999;
    if (accuracy <= 20) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (accuracy <= 50) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (accuracy <= 100) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
  }

  getMapUrl(): SafeResourceUrl {
    const loc = this.location();
    if (!loc) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    
    // Usar OpenStreetMap embed - zoom nivel 18 para máximo detalle
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${loc.longitude - 0.002}%2C${loc.latitude - 0.002}%2C${loc.longitude + 0.002}%2C${loc.latitude + 0.002}&layer=mapnik&marker=${loc.latitude}%2C${loc.longitude}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getGoogleMapsLink(): string {
    const loc = this.location();
    if (!loc) return '';
    return `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}&z=19`;
  }

  async getLocation() {
    this.loading.set(true);
    try {
      const loc = await this.geo.getCurrentLocation();
      this.location.set(loc);
    } catch (e) {
      console.error('Error obteniendo ubicación', e);
      alert('No se pudo obtener la ubicación. Verifica los permisos.');
    } finally {
      this.loading.set(false);
    }
  }
}
