import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 md:p-6 border-l-4 transition-all hover:shadow-lg"
         [ngClass]="getBorderColor()">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            {{ title }}
          </p>
          <div class="mt-2 flex items-baseline gap-2">
            <h3 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              {{ formatValue(value) }}
            </h3>
            @if (suffix) {
              <span class="text-sm md:text-base text-slate-600 dark:text-slate-400">{{ suffix }}</span>
            }
          </div>
          @if (change !== undefined) {
            <div class="mt-2 flex items-center gap-1">
              <span class="text-xs md:text-sm font-medium"
                    [ngClass]="change >= 0 ? 'text-green-600' : 'text-red-600'">
                @if (change >= 0) {
                  <svg class="w-3 h-3 md:w-4 md:h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                  </svg>
                } @else {
                  <svg class="w-3 h-3 md:w-4 md:h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                  </svg>
                }
                {{ Math.abs(change) }}%
              </span>
              <span class="text-xs text-slate-500 dark:text-slate-400">vs período anterior</span>
            </div>
          }
        </div>
        <div class="ml-4">
          <div class="p-3 rounded-full"
               [ngClass]="getIconBgColor()">
            <svg class="w-6 h-6 md:w-8 md:h-8" 
                 [ngClass]="getIconColor()"
                 fill="none" 
                 stroke="currentColor" 
                 viewBox="0 0 24 24"
                 [innerHTML]="getIcon()">
            </svg>
          </div>
        </div>
      </div>
      @if (description) {
        <p class="mt-3 text-xs md:text-sm text-slate-500 dark:text-slate-400">
          {{ description }}
        </p>
      }
    </div>
  `,
  styles: []
})
export class KpiCardComponent {
  @Input() title: string = '';
  @Input() value: number | string = 0;
  @Input() suffix?: string;
  @Input() prefix?: string;
  @Input() change?: number;
  @Input() icon: 'orders' | 'money' | 'time' | 'people' | 'check' | 'chart' = 'chart';
  @Input() color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo' = 'blue';
  @Input() description?: string;
  @Input() format: 'number' | 'currency' | 'percent' | 'none' = 'number';

  Math = Math;

  getBorderColor(): string {
    const colors = {
      blue: 'border-blue-500',
      green: 'border-green-500',
      orange: 'border-orange-500',
      purple: 'border-purple-500',
      red: 'border-red-500',
      indigo: 'border-indigo-500'
    };
    return colors[this.color];
  }

  getIconBgColor(): string {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-900/30',
      green: 'bg-green-100 dark:bg-green-900/30',
      orange: 'bg-orange-100 dark:bg-orange-900/30',
      purple: 'bg-purple-100 dark:bg-purple-900/30',
      red: 'bg-red-100 dark:bg-red-900/30',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/30'
    };
    return colors[this.color];
  }

  getIconColor(): string {
    const colors = {
      blue: 'text-blue-600 dark:text-blue-400',
      green: 'text-green-600 dark:text-green-400',
      orange: 'text-orange-600 dark:text-orange-400',
      purple: 'text-purple-600 dark:text-purple-400',
      red: 'text-red-600 dark:text-red-400',
      indigo: 'text-indigo-600 dark:text-indigo-400'
    };
    return colors[this.color];
  }

  getIcon(): string {
    const icons = {
      orders: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
      money: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
      time: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>',
      people: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>',
      check: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
      chart: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>'
    };
    return icons[this.icon];
  }

  formatValue(value: number | string): string {
    if (typeof value === 'string') return value;

    switch (this.format) {
      case 'currency':
        return `${this.prefix || '$'}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString('en-US');
      default:
        return value.toString();
    }
  }
}
