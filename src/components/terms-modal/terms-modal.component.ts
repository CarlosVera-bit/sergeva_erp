import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TermsService } from '../../services/terms.service';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-terms-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" (click)="showSuccess ? closeModal() : null">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh] transition-all duration-300" (click)="$event.stopPropagation()">
        
        <!-- Estado Normal: Mostrar Términos -->
        <ng-container *ngIf="!showSuccess">
          <!-- Header -->
          <div class="p-4 border-b border-gray-200 flex justify-between items-center">
            <div class="flex-1">
              <h2 class="text-xl font-bold text-gray-800">Términos y Condiciones</h2>
              <span class="text-sm text-gray-500">Versión {{ version }}</span>
            </div>
            <!-- Botón cerrar (X) -->
            <button 
              (click)="onClose()" 
              class="ml-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              title="Cerrar y volver al login"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 overflow-y-auto flex-grow" [innerHTML]="sanitizedContent">
            <!-- El contenido HTML de los términos se renderiza aquí -->
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-gray-200 bg-gray-50">
            <div class="flex items-center mb-4">
              <input 
                type="checkbox" 
                id="accept-terms" 
                [(ngModel)]="accepted"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              >
              <label for="accept-terms" class="ml-2 text-sm text-gray-700">
                He leído y acepto los términos y condiciones de uso, incluyendo el tratamiento de mis datos biométricos y de geolocalización.
              </label>
            </div>

            <div class="flex justify-end space-x-3">
              <button 
                (click)="onAccept()" 
                [disabled]="!accepted || isLoading"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center"
              >
                <span *ngIf="isLoading" class="mr-2">
                  <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                {{ isLoading ? 'Procesando...' : 'Aceptar y Continuar' }}
              </button>
            </div>
          </div>
        </ng-container>

        <!-- Estado Éxito: Mostrar Gracias -->
        <div *ngIf="showSuccess" class="p-10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300 relative">
          <!-- Botón cerrar -->
          <button 
            (click)="closeModal()" 
            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">¡Gracias!</h2>
          <p class="text-gray-600 mb-6">Hemos registrado tu aceptación correctamente.</p>
          
          <button 
            (click)="downloadPdf()" 
            class="mb-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Descargar PDF
          </button>
          
          <p class="text-sm text-gray-400">Cerrando automáticamente en 2 segundos...</p>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class TermsModalComponent implements OnInit {
  @Input() usuarioId!: number;
  @Output() termsAccepted = new EventEmitter<void>();

  isOpen = false;
  isLoading = false;
  accepted = false;
  showSuccess = false;

  terminoId: number | null = null;
  version: string = '';
  content: string = '';
  sanitizedContent: SafeHtml = '';

  constructor(
    private termsService: TermsService,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // No verificar automáticamente al iniciar
    // Solo verificar cuando se llame explícitamente a checkStatus()
  }

  checkStatus() {

    this.isLoading = true;
    this.termsService.checkStatus(this.usuarioId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.data.status === 'pending') {
          // Términos pendientes de aceptación, mostrar modal
          this.isOpen = true;
          this.terminoId = response.data.termino_id!;
          this.version = response.data.version!;
          this.content = response.data.contenido_html!;
          this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(this.content);
        } else {
          // Términos ya aceptados o no requeridos, no mostrar modal
          this.isOpen = false;
        }
      },
      error: (err) => {
        this.isLoading = false;
      }
    });
  }

  onAccept() {
    if (!this.accepted || !this.terminoId) return;

    this.isLoading = true;

    // Esperar confirmación del backend antes de mostrar éxito
    this.termsService.acceptTerms(this.usuarioId, this.terminoId).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showSuccess = true;
        this.cdr.detectChanges(); // Forzar detección de cambios

        // Esperar 2 segundos y cerrar
        setTimeout(() => {
          this.closeModal();
          this.cdr.detectChanges(); // Forzar detección de cambios al cerrar
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        alert('Error al guardar la aceptación de términos. Por favor, intente nuevamente.');
      }
    });
  }

  closeModal() {
    this.isOpen = false;
    this.showSuccess = false;
    this.termsAccepted.emit();
  }

  onClose() {
    // Si el usuario cierra sin aceptar, cerrar sesión y redirigir a login
    this.authService.logout();
    this.router.navigate(['/login']);
    this.isOpen = false;
  }

  downloadPdf() {
    if (!this.terminoId) return;

    // Generar PDF en el frontend usando jsPDF
    this.generatePdfFrontend();
  }

  private generatePdfFrontend() {
    // Importar jsPDF dinámicamente
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);

      // Título principal
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Términos y Condiciones', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Versión
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Versión: ${this.version}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Parsear HTML y generar contenido formateado
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = this.content;

      // Procesar cada elemento hijo
      const processElement = (element: Element) => {
        const tagName = element.tagName.toLowerCase();

        // Verificar si necesitamos nueva página
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        switch (tagName) {
          case 'h1':
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            const h1Lines = doc.splitTextToSize(element.textContent || '', maxWidth);
            doc.text(h1Lines, margin, yPosition);
            yPosition += h1Lines.length * 8 + 5;
            break;

          case 'h2':
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            const h2Lines = doc.splitTextToSize(element.textContent || '', maxWidth);
            doc.text(h2Lines, margin, yPosition);
            yPosition += h2Lines.length * 7 + 4;
            break;

          case 'p':
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const pLines = doc.splitTextToSize(element.textContent || '', maxWidth);
            doc.text(pLines, margin, yPosition);
            yPosition += pLines.length * 5 + 3;
            break;

          case 'ul':
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const listItems = element.querySelectorAll('li');
            listItems.forEach((li) => {
              if (yPosition > pageHeight - 40) {
                doc.addPage();
                yPosition = 20;
              }
              const liText = '• ' + (li.textContent || '');
              const liLines = doc.splitTextToSize(liText, maxWidth - 5);
              doc.text(liLines, margin + 5, yPosition);
              yPosition += liLines.length * 5 + 2;
            });
            yPosition += 3;
            break;
        }
      };

      // Procesar todos los elementos
      Array.from(tempDiv.children).forEach(processElement);

      // Pie de página con información de aceptación
      const footerY = pageHeight - 25;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

      doc.setFont('helvetica', 'bold');
      doc.text('ACEPTACIÓN DIGITAL', pageWidth / 2, footerY, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      const user = this.authService.currentUser();
      doc.text(`Usuario: ${user?.nombre_completo || 'Usuario'}`, margin, footerY + 6);
      doc.text(`Fecha de aceptación: ${new Date().toLocaleString('es-ES')}`, margin, footerY + 12);

      // Descargar
      doc.save(`terminos_condiciones_v${this.version}.pdf`);
    }).catch(err => {
      console.error('Error cargando jsPDF:', err);
      alert('Error al generar el PDF');
    });
  }
}
