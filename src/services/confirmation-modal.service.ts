import { Injectable, signal } from '@angular/core';

export interface ConfirmationOptions {
    id: number;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
}

@Injectable({
    providedIn: 'root'
})
export class ConfirmationModalService {
    private modalSignal = signal<ConfirmationOptions | null>(null);
    modal = this.modalSignal.asReadonly();
    private counter = 0;

    confirm(
        message: string,
        options?: {
            title?: string;
            confirmText?: string;
            cancelText?: string;
            type?: 'danger' | 'warning' | 'info';
        }
    ): Promise<boolean> {
        return new Promise((resolve) => {
            const id = this.counter++;
            const confirmOptions: ConfirmationOptions = {
                id,
                title: options?.title || 'Confirmar acción',
                message,
                confirmText: options?.confirmText || 'Confirmar',
                cancelText: options?.cancelText || 'Cancelar',
                type: options?.type || 'warning',
                onConfirm: () => {
                    this.close();
                    resolve(true);
                },
                onCancel: () => {
                    this.close();
                    resolve(false);
                }
            };

            this.modalSignal.set(confirmOptions);
        });
    }

    close() {
        this.modalSignal.set(null);
    }
}
