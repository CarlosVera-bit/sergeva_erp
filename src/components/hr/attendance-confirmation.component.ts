import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AttendanceRecord } from '../../services/attendance.models';

@Component({
  selector: 'app-attendance-confirmation',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  template: `
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-slate-800 dark:text-white">Paso 3: Confirmación</h3>
    <div *ngIf="record" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-3">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p class="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">INFORMACIÓN</p>
            <div class="space-y-1">
              <p class="text-sm text-slate-800 dark:text-white"><span class="font-semibold">Empleado:</span> {{ record.employeeId }}</p>
              <p class="text-sm text-slate-800 dark:text-white">
                <span class="font-semibold">Tipo:</span> 
                <span class="ml-2 px-2 py-0.5 rounded text-xs font-bold" [class]="record.type === 'ENTRADA' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'">{{ record.type }}</span>
              </p>
              <p class="text-sm text-slate-800 dark:text-white"><span class="font-semibold">Hora:</span> {{ record.timestamp | date:'medium' }}</p>
            </div>
          </div>
          
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p class="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">BIOMETRÍA</p>
            <p class="text-sm text-slate-800 dark:text-white"><span class="font-semibold">Coincidencia:</span> {{ record.faceMatchScore }}%</p>
            <div class="mt-2 bg-purple-200 dark:bg-purple-800 rounded-full h-2">
              <div class="bg-purple-600 h-2 rounded-full" [style.width.%]="record.faceMatchScore"></div>
            </div>
          </div>
          
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p class="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">UBICACIÓN</p>
            <p class="text-sm text-slate-800 dark:text-white mb-1">{{ record.geolocation.address }}</p>
            <p class="text-xs font-mono text-slate-600 dark:text-slate-400">{{ record.geolocation.latitude | number:'1.6-6' }}, {{ record.geolocation.longitude | number:'1.6-6' }}</p>
            <p class="text-xs mt-1" [class]="record.geolocation.withinRadius ? 'text-green-700' : 'text-orange-700'">
              {{ record.geolocation.withinRadius ? '✓ Dentro del radio' : '⚠ Fuera del radio' }}
            </p>
          </div>
        </div>
        
        <div class="space-y-3">
          <div class="border-2 border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div class="p-2 bg-slate-100 dark:bg-slate-700">
              <p class="text-xs font-semibold text-slate-600 dark:text-slate-300">FOTO</p>
            </div>
            <img *ngIf="record.photo" [src]="record.photo" alt="Foto" class="w-full h-auto" />
          </div>
          
          <div class="h-40 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-600">
            <div class="text-center text-slate-400">
              <svg class="w-10 h-10 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              <p class="text-xs">Mapa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
})
export class AttendanceConfirmationComponent {
  @Input() record!: AttendanceRecord | null;
}
