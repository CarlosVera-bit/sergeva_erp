import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
// Import estático ESM compatible con Vite/Angular
// Paquete recomendado: @vladmandic/face-api
import * as faceapi from '@vladmandic/face-api';

// Tipos básicos para biometría
export interface BiometricResult {
  blob: Blob;
  base64: string;
  score: number; // 0-100
}

@Injectable({ providedIn: 'root' })
export class BiometricService {
  private videoStream?: MediaStream;
  private canvas$ = new Subject<HTMLCanvasElement>();

  // Abre la cámara y emite el canvas de previsualización
  openCamera(): Observable<HTMLCanvasElement> {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        this.videoStream = stream;
        const video = document.createElement('video');
        video.autoplay = true;
        video.srcObject = stream;
        const canvas = document.createElement('canvas');
        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          const draw = () => {
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(draw);
          };
          draw();
          this.canvas$.next(canvas);
        };
      })
      .catch(err => {
        this.canvas$.error(err);
      });
    return this.canvas$.asObservable();
  }

  // Captura foto como Blob del último frame del canvas
  async capturePhoto(canvas?: HTMLCanvasElement): Promise<Blob> {
    const target = canvas ?? (await this.canvas$.toPromise());
    if (!target) throw new Error('No hay previsualización de cámara');
    return await new Promise<Blob>((resolve) => target.toBlob(b => resolve(b!), 'image/jpeg', 0.9));
  }

  // Compara rostros (capturado vs perfil) usando face-api.js si está disponible
  async compareFaces(capturedPhoto: Blob, profilePhoto: Blob | string): Promise<number> {
    try {
      // Cargar modelos desde /assets/models si existen
      const MODEL_URL = '/assets/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);

      const loadImageFromBlob = async (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;
        await new Promise(res => img.onload = () => res(true));
        return img as HTMLImageElement;
      };

      const capturedImg = await loadImageFromBlob(capturedPhoto);
      const profileImg = typeof profilePhoto === 'string'
        ? await new Promise<HTMLImageElement>(res => { const i = new Image(); i.crossOrigin = 'anonymous'; i.src = profilePhoto; i.onload = () => res(i); })
        : await loadImageFromBlob(profilePhoto);

      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
      const [capturedDesc, profileDesc] = await Promise.all([
        faceapi.detectSingleFace(capturedImg, options)?.withFaceLandmarks()?.withFaceDescriptor(),
        faceapi.detectSingleFace(profileImg, options)?.withFaceLandmarks()?.withFaceDescriptor()
      ]);

      if (!capturedDesc || !profileDesc) return 0;
      const distance = faceapi.euclideanDistance(capturedDesc.descriptor, profileDesc.descriptor);
      // Convertir distancia (0=igual) a score (100=igual) usando mapeo empírico
      const score = Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));
      return score;
    } catch (e) {
      // Si falla (modelos no disponibles), retornar 0 para forzar reintento o bypass
      console.error('compareFaces error', e);
      return 0;
    }
  }

  stopCamera() {
    this.videoStream?.getTracks().forEach(t => t.stop());
    this.videoStream = undefined;
  }
}
