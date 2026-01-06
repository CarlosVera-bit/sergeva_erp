import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';

// Interfaces para la API de Contifico
export interface ContificoCredentials {
  username: string;
  password: string;
  apiUrl: string; // URL base de la API de Contifico
}

export interface ContificoCliente {
  id_contifico?: string;
  identificacion: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  tipo_identificacion: 'RUC' | 'CEDULA' | 'PASAPORTE';
}

export interface ContificoProducto {
  id_contifico?: string;
  codigo: string;
  descripcion: string;
  precio: number;
  iva: boolean;
  tipo: 'BIEN' | 'SERVICIO';
}

export interface ContificoFactura {
  id_contifico?: string;
  numero_factura: string;
  fecha_emision: string;
  cliente: ContificoCliente;
  items: ContificoFacturaItem[];
  subtotal: number;
  iva_total: number;
  total: number;
  estado?: 'BORRADOR' | 'EMITIDA' | 'ANULADA';
}

export interface ContificoFacturaItem {
  producto_codigo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  iva: boolean;
}

export interface SyncLog {
  id_integracion?: number;
  id_ot?: number;
  numero_documento_contifico?: string;
  fecha_integracion?: string;
  estado_sincronizacion: 'pendiente' | 'exitoso' | 'error' | 'reintento';
  respuesta_contifico?: string;
  tipo_documento?: 'FACTURA' | 'NOTA_CREDITO' | 'GUIA_REMISION';
}

@Injectable({
  providedIn: 'root'
})
export class ContificoService {
  private apiUrl = environment.apiUrl + '/integracion_contifico.php';

  // Credenciales almacenadas (en producción deberían estar en variables de entorno)
  private credentials = signal<ContificoCredentials | null>(null);

  // Estado de conexión
  isConnected = signal<boolean>(false);
  lastError = signal<string | null>(null);

  constructor(private http: HttpClient) {
    this.loadCredentials();
  }

  /**
   * Cargar credenciales desde localStorage
   */
  private loadCredentials(): void {
    const stored = localStorage.getItem('contifico_credentials');
    if (stored) {
      try {
        const creds = JSON.parse(stored);
        this.credentials.set(creds);
      } catch (e) {
        console.error('Error loading Contifico credentials:', e);
      }
    }
  }

  /**
   * Guardar credenciales en localStorage
   */
  setCredentials(credentials: ContificoCredentials): void {
    this.credentials.set(credentials);
    localStorage.setItem('contifico_credentials', JSON.stringify(credentials));
  }

  /**
   * Obtener headers para las peticiones a Contifico
   */
  private getContificoHeaders(): HttpHeaders {
    const creds = this.credentials();
    if (!creds) {
      throw new Error('No se han configurado las credenciales de Contifico');
    }

    // Contifico usa autenticación Basic
    const authString = btoa(`${creds.username}:${creds.password}`);

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authString}`
    });
  }

  /**
   * Verificar conexión con Contifico
   */
  async testConnection(): Promise<boolean> {
    try {
      const creds = this.credentials();
      if (!creds) {
        this.lastError.set('No hay credenciales configuradas');
        this.isConnected.set(false);
        return false;
      }

      // Intentar obtener la lista de clientes como test
      const headers = this.getContificoHeaders();
      const response = await firstValueFrom(
        this.http.get(`${creds.apiUrl}/cliente`, { headers })
      );

      this.isConnected.set(true);
      this.lastError.set(null);
      return true;
    } catch (error: any) {
      this.isConnected.set(false);
      this.lastError.set(error.message || 'Error al conectar con Contifico');
      return false;
    }
  }

  /**
   * Obtener lista de clientes desde Contifico
   */
  async getClientes(): Promise<ContificoCliente[]> {
    try {
      const creds = this.credentials();
      if (!creds) throw new Error('No hay credenciales configuradas');

      const headers = this.getContificoHeaders();
      const response: any = await firstValueFrom(
        this.http.get(`${creds.apiUrl}/cliente`, { headers })
      );

      return response.data || response || [];
    } catch (error) {
      console.error('Error obteniendo clientes:', error);
      throw error;
    }
  }

  /**
   * Buscar cliente por identificación
   */
  async buscarClientePorIdentificacion(identificacion: string): Promise<ContificoCliente | null> {
    try {
      const creds = this.credentials();
      if (!creds) throw new Error('No hay credenciales configuradas');

      const headers = this.getContificoHeaders();
      const response: any = await firstValueFrom(
        this.http.get(`${creds.apiUrl}/cliente/buscar?identificacion=${identificacion}`, { headers })
      );

      return response.data || response || null;
    } catch (error) {
      console.error('Error buscando cliente:', error);
      return null;
    }
  }

  /**
   * Crear cliente en Contifico
   */
  async crearCliente(cliente: ContificoCliente): Promise<any> {
    try {
      const creds = this.credentials();
      if (!creds) throw new Error('No hay credenciales configuradas');

      const headers = this.getContificoHeaders();
      const response = await firstValueFrom(
        this.http.post(`${creds.apiUrl}/cliente`, cliente, { headers })
      );

      return response;
    } catch (error) {
      console.error('Error creando cliente:', error);
      throw error;
    }
  }

  /**
   * Obtener productos desde Contifico
   */
  async getProductos(): Promise<ContificoProducto[]> {
    try {
      const creds = this.credentials();
      if (!creds) throw new Error('No hay credenciales configuradas');

      const headers = this.getContificoHeaders();
      const response: any = await firstValueFrom(
        this.http.get(`${creds.apiUrl}/producto`, { headers })
      );

      return response.data || response || [];
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      throw error;
    }
  }

  /**
   * Crear factura en Contifico
   */
  async crearFactura(factura: ContificoFactura): Promise<any> {
    try {
      const creds = this.credentials();
      if (!creds) throw new Error('No hay credenciales configuradas');

      const headers = this.getContificoHeaders();
      const response = await firstValueFrom(
        this.http.post(`${creds.apiUrl}/documento/factura`, factura, { headers })
      );

      return response;
    } catch (error) {
      console.error('Error creando factura:', error);
      throw error;
    }
  }

  /**
   * Obtener facturas desde Contifico
   */
  async getFacturas(fechaDesde?: string, fechaHasta?: string): Promise<ContificoFactura[]> {
    try {
      const creds = this.credentials();
      if (!creds) throw new Error('No hay credenciales configuradas');

      let url = `${creds.apiUrl}/documento/factura`;
      if (fechaDesde && fechaHasta) {
        url += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`;
      }

      const headers = this.getContificoHeaders();
      const response: any = await firstValueFrom(
        this.http.get(url, { headers })
      );

      return response.data || response || [];
    } catch (error) {
      console.error('Error obteniendo facturas:', error);
      throw error;
    }
  }

  /**
   * Sincronizar orden de trabajo con Contifico (crear factura)
   */
  async sincronizarOrdenTrabajo(idOt: number, datosFactura: ContificoFactura): Promise<SyncLog> {
    try {
      // Primero crear la factura en Contifico
      const facturaCreada = await this.crearFactura(datosFactura);

      // Registrar la sincronización en nuestra base de datos
      const syncLog: SyncLog = {
        id_ot: idOt,
        numero_documento_contifico: facturaCreada.numero || facturaCreada.numeroDocumento,
        estado_sincronizacion: 'exitoso',
        respuesta_contifico: JSON.stringify(facturaCreada),
        tipo_documento: 'FACTURA'
      };

      // Guardar en la base de datos local
      await this.registrarSincronizacion(syncLog);

      return syncLog;
    } catch (error: any) {
      // Registrar el error
      const syncLog: SyncLog = {
        id_ot: idOt,
        estado_sincronizacion: 'error',
        respuesta_contifico: error.message || JSON.stringify(error),
        tipo_documento: 'FACTURA'
      };

      await this.registrarSincronizacion(syncLog);
      throw error;
    }
  }

  /**
   * Registrar sincronización en base de datos local
   */
  private async registrarSincronizacion(syncLog: SyncLog): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(this.apiUrl, syncLog)
      );
    } catch (error) {
      console.error('Error registrando sincronización:', error);
    }
  }

  /**
   * Obtener historial de sincronizaciones
   */
  async getSyncLogs(): Promise<SyncLog[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(this.apiUrl)
      );

      return response.data || response || [];
    } catch (error) {
      console.error('Error obteniendo logs:', error);
      return [];
    }
  }

  /**
   * Reintentar sincronización fallida
   */
  async reintentarSincronizacion(idIntegracion: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(`${this.apiUrl}?id=${idIntegracion}`, {
          estado_sincronizacion: 'reintento'
        })
      );
    } catch (error) {
      console.error('Error reintentando sincronización:', error);
      throw error;
    }
  }

  /**
   * Sincronizar cliente desde el sistema local a Contifico
   */
  async sincronizarCliente(clienteLocal: any): Promise<ContificoCliente> {
    try {
      // Verificar si el cliente ya existe en Contifico
      const clienteExistente = await this.buscarClientePorIdentificacion(clienteLocal.ruc_ci);

      if (clienteExistente) {
        console.log('Cliente ya existe en Contifico:', clienteExistente);
        return clienteExistente;
      }

      // Crear nuevo cliente en Contifico
      const nuevoCliente: ContificoCliente = {
        identificacion: clienteLocal.ruc_ci,
        razon_social: clienteLocal.razon_social,
        nombre_comercial: clienteLocal.nombre_comercial,
        direccion: clienteLocal.direccion,
        telefono: clienteLocal.telefono,
        email: clienteLocal.email,
        tipo_identificacion: clienteLocal.ruc_ci.length === 13 ? 'RUC' : 'CEDULA'
      };

      const response = await this.crearCliente(nuevoCliente);
      return response;
    } catch (error) {
      console.error('Error sincronizando cliente:', error);
      throw error;
    }
  }
}
