import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastsSignal = signal<Toast[]>([]);
    toasts = this.toastsSignal.asReadonly();
    private counter = 0;

    showSuccess(message: string, duration: number = 3000) {
        this.addToast(message, 'success', duration);
    }

    showError(message: string, duration: number = 3000) {
        this.addToast(message, 'error', duration);
    }

    showInfo(message: string, duration: number = 3000) {
        this.addToast(message, 'info', duration);
    }

    showWarning(message: string, duration: number = 3000) {
        this.addToast(message, 'warning', duration);
    }

    private addToast(message: string, type: Toast['type'], duration: number) {
        const id = this.counter++;
        const toast: Toast = { id, message, type, duration };

        this.toastsSignal.update(toasts => [...toasts, toast]);

        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }
    }

    remove(id: number) {
        this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
    }
}
