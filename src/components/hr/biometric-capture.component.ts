import { Component, effect, signal, output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BiometricService } from '../../services/biometric.service';

@Component({
  selector: 'app-biometric-capture',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-white">Paso 1: Captura Biométrica</h3>
      <span *ngIf="score() >= 0" class="px-3 py-1 rounded-full text-sm font-semibold" 
        [class]="score() >= 85 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'">
        Coincidencia: {{ score() }}%
      </span>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Preview de cámara -->
      <div class="space-y-3">
        <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Vista previa de cámara</p>
        <div class="bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden" [style.height.px]="320">
          <video #videoEl autoplay playsinline class="w-full h-full object-cover" [class.hidden]="!cameraActive()"></video>
          <div *ngIf="!cameraActive()" class="w-full h-full flex items-center justify-center">
            <div class="text-center text-slate-400">
              <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              <p class="text-sm">Presiona "Abrir Cámara" para iniciar</p>
            </div>
          </div>
        </div>
        <!-- Botones de cámara debajo del recuadro -->
        <div class="flex gap-2">
          <button (click)="start()" [disabled]="cameraActive()" 
            style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: #059669; color: white; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600; font-size: 0.875rem; flex: 1; transition: all 0.2s;" class="hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            {{ cameraActive() ? 'Cámara activa' : 'Abrir Cámara' }}
          </button>
          <button (click)="stopCamera()" [disabled]="!cameraActive()" 
            style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: #dc2626; color: white; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600; font-size: 0.875rem; transition: all 0.2s;" class="hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed" [style.opacity]="!cameraActive() ? 0.6 : 1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Detener
          </button>
        </div>
      </div>
      
      <!-- Foto capturada -->
      <div class="space-y-3">
        <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Foto capturada</p>
        <div class="bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden" [style.height.px]="320">
          <img *ngIf="photo()" [src]="photo()" alt="Foto capturada" class="w-full h-full object-cover" />
          <div *ngIf="!photo()" class="w-full h-full flex items-center justify-center">
            <div class="text-center text-slate-400">
              <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p class="text-sm">Tu foto aparecerá aquí</p>
            </div>
          </div>
        </div>
        <!-- Botón de capturar foto debajo del recuadro -->
        <button (click)="capture()" [disabled]="!cameraActive()" 
          style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: #2563eb; color: white; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600; font-size: 0.875rem; width: 100%; transition: all 0.2s;" class="hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed" [style.opacity]="!cameraActive() ? 0.6 : 1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Capturar Foto
        </button>
      </div>
    </div>
    
    <div *ngIf="photo() && score() >= 0" class="p-3 rounded-lg" 
      [class]="score() >= 85 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'">
      <p class="text-sm" [class]="score() >= 85 ? 'text-green-800 dark:text-green-300' : 'text-orange-800 dark:text-orange-300'">
        {{ score() >= 85 ? '✓ Verificación exitosa. Puedes continuar.' : '⚠ Coincidencia baja. Puedes reintentar o continuar.' }}
      </p>
    </div>
  </div>
  `,
})
export class BiometricCaptureComponent implements OnDestroy {
  videoEl?: HTMLVideoElement;
  cameraActive = signal<boolean>(false);
  photo = signal<string | null>(null);
  score = signal<number>(-1);

  // Output para emitir datos al componente padre
  dataCaptured = output<{ photo: string; score: number }>();

  constructor(private bio: BiometricService) {
    // Emitir datos cuando cambien
    effect(() => {
      const p = this.photo();
      const s = this.score();
      if (p && s >= 0) {
        this.dataCaptured.emit({ photo: p, score: s });
      }
    });
  }

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      // Obtener referencia al video del DOM
      setTimeout(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video) {
          video.srcObject = stream;
          this.videoEl = video;
          this.cameraActive.set(true);
        }
      }, 100);
    } catch (err) {
      console.error('Error abriendo cámara', err);
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }

  async capture() {
    if (!this.videoEl) return;

    // Crear canvas para capturar frame actual
    const canvas = document.createElement('canvas');
    canvas.width = this.videoEl.videoWidth;
    canvas.height = this.videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(this.videoEl, 0, 0);

    // Convertir a blob y base64
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.9));

    if (!blob) {
      console.error('Error al generar la captura de imagen (Blob es nulo)');
      return;
    }

    const base64 = await blobToBase64(blob);
    this.photo.set(base64);

    // Simular comparación facial (score aleatorio entre 70-95)
    setTimeout(() => {
      this.score.set(Math.floor(Math.random() * 25) + 70);
    }, 500);
  }

  stopCamera() {
    if (this.videoEl && this.videoEl.srcObject) {
      const stream = this.videoEl.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.videoEl.srcObject = null;
      this.cameraActive.set(false);
    }
  }

  ngOnDestroy() {
    this.stopCamera();
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
