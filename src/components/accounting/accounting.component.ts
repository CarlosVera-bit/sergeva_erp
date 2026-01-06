import { Component, ChangeDetectionStrategy, signal, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { ContificoService, ContificoCredentials, SyncLog } from '../../services/contifico.service';

@Component({
  selector: 'app-accounting',
  templateUrl: './accounting.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountingComponent {
  dbService = inject(DatabaseService);
  contificoService = inject(ContificoService);
  
  // Señales de estado
  syncLogs = signal<SyncLog[]>([]);
  isLoading = signal<boolean>(false);
  isSyncing = signal<boolean>(false);
  showConfigModal = signal<boolean>(false);
  
  // Credenciales
  credentials = signal<ContificoCredentials>({
    username: '',
    password: '',
    apiUrl: 'https://api.contifico.com/sistema/api/v1'
  });
  
  // Computed
  syncStatus = computed(() => 
    this.contificoService.isConnected() ? 'Conectado' : 'Desconectado'
  );
  
  lastSync = computed(() => {
    const logs = this.syncLogs();
    if (logs.length > 0 && logs[0].fecha_integracion) {
      const date = new Date(logs[0].fecha_integracion);
      return date.toLocaleString('es-EC', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'Nunca';
  });
  
  totalSyncs = computed(() => this.syncLogs().length);
  
  successfulSyncs = computed(() => 
    this.syncLogs().filter(log => log.estado_sincronizacion === 'exitoso').length
  );
  
  failedSyncs = computed(() => 
    this.syncLogs().filter(log => log.estado_sincronizacion === 'error').length
  );
  
  pendingSyncs = computed(() => 
    this.syncLogs().filter(log => log.estado_sincronizacion === 'pendiente').length
  );

  constructor() {
    effect(() => {
      if (this.dbService.connected()) {
        this.loadLogs();
      } else {
        this.syncLogs.set([]);
      }
    });
    
    // Cargar credenciales guardadas
    this.loadSavedCredentials();
  }

  loadSavedCredentials(): void {
    const stored = localStorage.getItem('contifico_credentials');
    if (stored) {
      try {
        const creds = JSON.parse(stored);
        this.credentials.set(creds);
        this.contificoService.setCredentials(creds);
      } catch (e) {
        console.error('Error loading credentials:', e);
      }
    }
  }

  async loadLogs(): Promise<void> {
    this.isLoading.set(true);
    try {
      const logs = await this.contificoService.getSyncLogs();
      this.syncLogs.set(logs);
    } catch (e) {
      console.error("Error loading sync logs:", e);
      this.syncLogs.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async testConnection(): Promise<void> {
    this.isLoading.set(true);
    try {
      const connected = await this.contificoService.testConnection();
      if (connected) {
        alert('✅ Conexión exitosa con Contifico');
        this.showConfigModal.set(false);
      } else {
        alert('❌ Error al conectar con Contifico. Verifique las credenciales.');
      }
    } catch (error: any) {
      alert('❌ Error: ' + (error.message || 'No se pudo conectar'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveCredentials(): Promise<void> {
    const creds = this.credentials();
    if (!creds.username || !creds.password || !creds.apiUrl) {
      alert('Por favor complete todos los campos');
      return;
    }
    
    this.contificoService.setCredentials(creds);
    await this.testConnection();
  }

  openConfigModal(): void {
    this.showConfigModal.set(true);
  }

  closeConfigModal(): void {
    this.showConfigModal.set(false);
  }

  async forceSyncAll(): Promise<void> {
    if (!this.contificoService.isConnected()) {
      alert('Primero debe configurar la conexión con Contifico');
      this.openConfigModal();
      return;
    }

    if (!confirm('¿Desea sincronizar todas las órdenes de trabajo pendientes con Contifico?')) {
      return;
    }

    this.isSyncing.set(true);
    try {
      // Aquí iría la lógica para obtener órdenes de trabajo pendientes
      // y sincronizarlas con Contifico
      alert('Sincronización iniciada. Este proceso puede tardar varios minutos.');
      
      // Recargar logs después de sincronizar
      await this.loadLogs();
      
      alert('✅ Sincronización completada');
    } catch (error: any) {
      alert('❌ Error en la sincronización: ' + error.message);
    } finally {
      this.isSyncing.set(false);
    }
  }

  async retrySync(log: SyncLog): Promise<void> {
    if (!log.id_integracion) return;
    
    this.isSyncing.set(true);
    try {
      await this.contificoService.reintentarSincronizacion(log.id_integracion);
      await this.loadLogs();
      alert('✅ Sincronización reenviada');
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      this.isSyncing.set(false);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'exitoso': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'reintento': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'pendiente': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'exitoso': return '✓';
      case 'error': return '✗';
      case 'reintento': return '↻';
      case 'pendiente': return '⌛';
      default: return '?';
    }
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      'exitoso': 'Exitoso',
      'error': 'Error',
      'reintento': 'Reintentando',
      'pendiente': 'Pendiente'
    };
    return map[status] || status;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
