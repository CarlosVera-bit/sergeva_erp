import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationModalService } from '../../services/confirmation-modal.service';

@Component({
    selector: 'app-confirmation-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div *ngIf="modal()" 
             class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
             (click)="onBackdropClick()">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden" 
                 (click)="$event.stopPropagation()">
                
                <!-- Header -->
                <div class="p-4 border-b" 
                     [ngClass]="{
                         'bg-red-50 border-red-200': modal()?.type === 'danger',
                         'bg-yellow-50 border-yellow-200': modal()?.type === 'warning',
                         'bg-blue-50 border-blue-200': modal()?.type === 'info'
                     }">
                    <div class="flex items-center gap-3">
                        <!-- Icon -->
                        <div class="flex-shrink-0">
                            <svg *ngIf="modal()?.type === 'danger'" class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                            <svg *ngIf="modal()?.type === 'warning'" class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                            <svg *ngIf="modal()?.type === 'info'" class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        
                        <!-- Title -->
                        <h3 class="text-lg font-semibold"
                            [ngClass]="{
                                'text-red-900': modal()?.type === 'danger',
                                'text-yellow-900': modal()?.type === 'warning',
                                'text-blue-900': modal()?.type === 'info'
                            }">
                            {{ modal()?.title }}
                        </h3>
                    </div>
                </div>

                <!-- Content -->
                <div class="p-6">
                    <p class="text-gray-700 whitespace-pre-line">{{ modal()?.message }}</p>
                </div>

                <!-- Footer -->
                <div class="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button 
                        (click)="onCancel()"
                        class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                        {{ modal()?.cancelText }}
                    </button>
                    <button 
                        (click)="onConfirm()"
                        class="px-4 py-2 text-white rounded-lg transition-colors font-medium"
                        [ngClass]="{
                            'bg-red-600 hover:bg-red-700': modal()?.type === 'danger',
                            'bg-yellow-600 hover:bg-yellow-700': modal()?.type === 'warning',
                            'bg-blue-600 hover:bg-blue-700': modal()?.type === 'info'
                        }">
                        {{ modal()?.confirmText }}
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }
    `]
})
export class ConfirmationModalComponent {
    confirmationService = inject(ConfirmationModalService);
    modal = this.confirmationService.modal;

    onConfirm() {
        const currentModal = this.modal();
        if (currentModal) {
            currentModal.onConfirm();
        }
    }

    onCancel() {
        const currentModal = this.modal();
        if (currentModal) {
            if (currentModal.onCancel) {
                currentModal.onCancel();
            } else {
                this.confirmationService.close();
            }
        }
    }

    onBackdropClick() {
        this.onCancel();
    }
}
