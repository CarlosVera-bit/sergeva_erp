import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OtLinksService, OtLink } from '../../services/ot-links.service';
import { ShareLinkModalComponent } from '../shared/share-link-modal.component';
import { ConfirmDeleteModalComponent } from '../shared/confirm-delete-modal.component';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ot-links-section',
  standalone: true,
  imports: [CommonModule, FormsModule, ShareLinkModalComponent, ConfirmDeleteModalComponent],
  template: `
    <div>
      <h4 class="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3 border-b border-indigo-100 dark:border-slate-600 pb-2 flex justify-between items-center">
        <span class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          Links Compartibles
        </span>
        <span class="text-sm font-normal text-slate-500">{{ links().length }} link(s)</span>
      </h4>

      <!-- Add Link Form -->
      <div class="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg mb-4">
        @if (!showAddForm()) {
          <button (click)="showAddForm.set(true)" 
                  class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Agregar Link
          </button>
        } @else {
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                URL *
              </label>
              <input type="url" 
                     [(ngModel)]="newLinkUrl"
                     placeholder="https://ejemplo.com"
                     class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Título
              </label>
              <input type="text" 
                     [(ngModel)]="newLinkTitle"
                     placeholder="Título del link"
                     class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Descripción
              </label>
              <textarea [(ngModel)]="newLinkDescription"
                        rows="2"
                        placeholder="Descripción opcional..."
                        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white text-sm"></textarea>
            </div>
            <div class="flex gap-2">
              <button (click)="addLink()" 
                      [disabled]="isLoading() || !newLinkUrl"
                      class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                @if (isLoading()) {
                  <svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                } @else {
                  Guardar Link
                }
              </button>
              <button (click)="cancelAdd()" 
                      [disabled]="isLoading()"
                      class="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 disabled:opacity-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Links List -->
      @if (links().length > 0) {
        <div class="space-y-3">
          @for (link of links(); track link.id_link) {
            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  @if (link.titulo) {
                    <h5 class="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      {{ link.titulo }}
                    </h5>
                  }
                  <a [href]="link.url" target="_blank" rel="noopener noreferrer"
                     class="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all flex items-center gap-1">
                    {{ link.url }}
                    <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </a>
                  @if (link.descripcion) {
                    <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {{ link.descripcion }}
                    </p>
                  }
                  <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Agregado por: {{ link.usuario_nombre || 'Usuario' }} • {{ link.fecha_creacion | date:'short' }}
                  </p>
                </div>
                <div class="flex gap-1 flex-shrink-0">
                  <button (click)="openShareModal(link)" 
                          class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Compartir">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                    </svg>
                  </button>
                  <button (click)="openDeleteModal(link)" 
                          class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Eliminar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-lg text-center">
          <svg class="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          <p class="text-slate-500 dark:text-slate-400">No hay links compartidos para esta orden.</p>
          <p class="text-sm text-slate-400 dark:text-slate-500 mt-1">Use el botón de arriba para agregar links.</p>
        </div>
      }
    </div>

    <!-- Share Modal -->
    @if (showShareModal() && selectedLink()) {
      <app-share-link-modal 
        [linkUrl]="selectedLink()!.url"
        [linkTitle]="selectedLink()!.titulo"
        (onClose)="closeShareModal()">
      </app-share-link-modal>
    }

    <!-- Delete Confirmation Modal -->
    @if (showDeleteModal() && linkToDelete()) {
      <app-confirm-delete-modal
        [title]="'Eliminar Link'"
        [message]="'¿Está seguro de que desea eliminar este link? Esta acción no se puede deshacer.\\n\\n' + linkToDelete()!.url"
        (onConfirm)="confirmDeleteLink()"
        (onCancel)="closeDeleteModal()">
      </app-confirm-delete-modal>
    }
  `
})
export class OtLinksSectionComponent implements OnInit {
  @Input() workOrderId!: number;

  private otLinksService = inject(OtLinksService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  links = signal<OtLink[]>([]);
  isLoading = signal(false);
  showAddForm = signal(false);
  showShareModal = signal(false);
  showDeleteModal = signal(false);
  selectedLink = signal<OtLink | null>(null);
  linkToDelete = signal<OtLink | null>(null);

  newLinkUrl = '';
  newLinkTitle = '';
  newLinkDescription = '';

  ngOnInit(): void {
    if (this.workOrderId) {
      this.loadLinks();
    }
  }

  async loadLinks(): Promise<void> {
    try {
      const links = await this.otLinksService.getLinks(this.workOrderId);
      this.links.set(links);
    } catch (error) {
      console.error('Error cargando links:', error);
    }
  }

  async addLink(): Promise<void> {
    if (!this.newLinkUrl) {
      this.toastService.showWarning('Por favor ingrese una URL');
      return;
    }

    if (!this.otLinksService.isValidUrl(this.newLinkUrl)) {
      this.toastService.showError('Por favor ingrese una URL válida');
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      this.toastService.showError('Usuario no autenticado');
      return;
    }

    this.isLoading.set(true);
    try {
      const newLink: OtLink = {
        id_ot: this.workOrderId,
        id_usuario: user.id_usuario,
        url: this.newLinkUrl,
        titulo: this.newLinkTitle || undefined,
        descripcion: this.newLinkDescription || undefined
      };

      await this.otLinksService.addLink(newLink);
      this.toastService.showSuccess('Link agregado correctamente');

      // Recargar links
      await this.loadLinks();

      // Limpiar formulario
      this.cancelAdd();
    } catch (error: any) {
      this.toastService.showError(error.message || 'Error al agregar link');
    } finally {
      this.isLoading.set(false);
    }
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
    this.newLinkUrl = '';
    this.newLinkTitle = '';
    this.newLinkDescription = '';
  }

  openDeleteModal(link: OtLink): void {
    this.linkToDelete.set(link);
    this.showDeleteModal.set(true);
  }

  async confirmDeleteLink(): Promise<void> {
    const link = this.linkToDelete();
    if (!link) return;

    try {
      await this.otLinksService.deleteLink(link.id_link!);
      this.toastService.showSuccess('Link eliminado correctamente');
      await this.loadLinks();
    } catch (error: any) {
      this.toastService.showError(error.message || 'Error al eliminar link');
    } finally {
      this.closeDeleteModal();
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.linkToDelete.set(null);
  }

  openShareModal(link: OtLink): void {
    this.selectedLink.set(link);
    this.showShareModal.set(true);
  }

  closeShareModal(): void {
    this.showShareModal.set(false);
    this.selectedLink.set(null);
  }
}
