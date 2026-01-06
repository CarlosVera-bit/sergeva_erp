import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

export interface BarDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor?: string;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 md:p-6 h-full">
      <h3 class="text-base md:text-lg font-semibold text-slate-800 dark:text-white mb-4">{{ title }}</h3>
      <div class="relative" [style.height.px]="height">
        <canvas #chartCanvas></canvas>
      </div>
      @if (isLoading) {
        <div class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 rounded-lg">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class BarChartComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() title: string = 'Gráfico';
  @Input() labels: string[] = [];
  @Input() datasets: BarDataset[] = [];
  @Input() height: number = 350;
  @Input() isLoading: boolean = false;
  @Input() horizontal: boolean = false;
  @Input() stacked: boolean = false;
  
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private chart: Chart | null = null;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['datasets'] || changes['labels']) && this.chart) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart(): void {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const chartType: ChartType = this.horizontal ? 'bar' : 'bar';
    const indexAxis = this.horizontal ? 'y' : 'x';

    const config: ChartConfiguration = {
      type: chartType,
      data: {
        labels: this.labels,
        datasets: this.datasets.map(ds => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.backgroundColor,
          borderColor: ds.borderColor || ds.backgroundColor,
          borderWidth: 1,
          borderRadius: 4
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: indexAxis as any,
        scales: {
          x: {
            stacked: this.stacked,
            grid: {
              display: false
            },
            ticks: {
              color: '#64748B',
              font: {
                size: 11
              }
            }
          },
          y: {
            stacked: this.stacked,
            beginAtZero: true,
            grid: {
              color: '#E2E8F0'
            },
            ticks: {
              color: '#64748B',
              font: {
                size: 11
              }
            }
          }
        },
        plugins: {
          legend: {
            display: this.datasets.length > 1,
            position: 'top',
            labels: {
              padding: 15,
              font: {
                size: 12
              },
              color: '#334155',
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff',
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y || context.parsed.x || 0;
                return `${label}: ${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) return;

    this.chart.data.labels = this.labels;
    this.chart.data.datasets = this.datasets.map(ds => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.backgroundColor,
      borderColor: ds.borderColor || ds.backgroundColor,
      borderWidth: 1,
      borderRadius: 4
    }));
    this.chart.update();
  }
}
