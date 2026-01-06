import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  connected = signal<boolean>(false);
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  async connect(): Promise<void> {
    // Conexión instantánea sin delay
    this.connected.set(true);
    return Promise.resolve();
  }

  disconnect(): void {
    this.connected.set(false);
  }

  async query(queryString: string, params: any[] = []): Promise<any[]> {
    if (!this.connected()) {
      return Promise.reject(new Error("Database not connected."));
    }

    const fromMatch = queryString.match(/FROM\s+(\w+)/);
    const tableName = fromMatch ? fromMatch[1] : null;

    if (!tableName) {
      return Promise.reject(new Error("No table found in query"));
    }

    try {
      let url = `${this.apiUrl}/${tableName}.php`;

      // Agregar parámetros si existen
      if (queryString.includes('WHERE email = ?') && params.length > 0) {
        url += `?email=${encodeURIComponent(params[0])}`;
      }

      const response = await firstValueFrom(this.http.get<any>(url));

      if (response.success) {
        let data = response.data;

        // Manejar JOINs
        if (queryString.includes('JOIN clientes')) {
          const clientes = await this.query('SELECT * FROM clientes');
          this.join(data, 'id_cliente', clientes, 'id_cliente', 'cliente', 'nombre_razon_social');
        }
        if (queryString.includes('JOIN usuarios')) {
          const usuarios = await this.query('SELECT * FROM usuarios');
          this.join(data, 'id_supervisor', usuarios, 'id_usuario', 'supervisor', 'nombre_completo');
        }
        if (queryString.includes('JOIN inventario')) {
          const inventario = await this.query('SELECT * FROM inventario');
          this.join(data, 'id_producto', inventario, 'id_producto', 'inventario', ['stock_actual', 'ubicacion_bodega']);
        }
        if (queryString.includes('JOIN proveedores')) {
          const proveedores = await this.query('SELECT * FROM proveedores');
          this.join(data, 'id_proveedor', proveedores, 'id_proveedor', 'proveedor', 'nombre_razon_social');
        }
        if (queryString.includes('JOIN trabajadores')) {
          const trabajadores = await this.query('SELECT * FROM trabajadores');
          this.join(data, 'id_trabajador', trabajadores, 'id_trabajador', 'empleado', ['nombres', 'apellidos']);
        }
        if (queryString.includes('JOIN ordenes_trabajo')) {
          const ordenes = await this.query('SELECT * FROM ordenes_trabajo');
          this.join(data, 'id_ot', ordenes, 'id_ot', 'proyecto', 'numero_ot');
        }

        return data;
      } else {
        return Promise.reject(new Error(response.message));
      }
    } catch (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      return [];
    }
  }

  // Helper para mock joins
  private join(
    leftTable: any[], leftKey: string,
    rightTable: any[], rightKey: string,
    newPropName: string,
    propsToCopy: string | string[]
  ) {
    const rightMap = new Map(rightTable.map(item => [item[rightKey], item]));
    leftTable.forEach(leftItem => {
      const rightItem = rightMap.get(leftItem[leftKey]);
      if (rightItem) {
        if (typeof propsToCopy === 'string') {
          leftItem[newPropName] = rightItem[propsToCopy];
        } else if (Array.isArray(propsToCopy)) {
          if (newPropName === 'empleado' && propsToCopy.includes('nombres') && propsToCopy.includes('apellidos')) {
            leftItem[newPropName] = `${rightItem['nombres']} ${rightItem['apellidos']}`;
          } else {
            propsToCopy.forEach(prop => {
              leftItem[prop] = rightItem[prop];
            });
          }
        }
      }
    });
  }

  // Agregar este método en la clase DatabaseService

  async post(endpoint: string, data: any): Promise<any> {
    if (!this.connected()) {
      return Promise.reject(new Error("Database not connected."));
    }

    try {
      const url = `${this.apiUrl}/${endpoint}.php`;

      // Log seguro que oculta contraseñas y fotos base64
      const safeData = { ...data };
      if (safeData.password) safeData.password = '***';
      if (safeData.foto_base64) safeData.foto_base64 = '[FOTO_BASE64]';

      console.log('📤 POST a:', url, 'con datos:', safeData);

      const response = await firstValueFrom(
        this.http.post<any>(url, data)
      );

      console.log('📥 Respuesta recibida:', response);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error en la petición');
      }
    } catch (error: any) {
      console.error(`❌ Error en POST a ${endpoint}:`, error);

      // Mostrar más detalles del error
      if (error.error) {
        console.error('Error details:', error.error);
      }
      if (error.status) {
        console.error('HTTP Status:', error.status);
      }

      if (error.error?.message) {
        throw new Error(error.error.message);
      }

      throw error;
    }
  }

  async getWorkOrders(): Promise<any[]> {
    try {
      const url = `${this.apiUrl}/ordenes_trabajo.php`;
      console.log('Fetching work orders from:', url);
      const response = await firstValueFrom(this.http.get<any>(url));
      console.log('Work orders response:', response);

      if (response.success) {
        return response.data;
      } else {
        console.error('Error en respuesta de OTs:', response.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching work orders:', error);
      return [];
    }
  }
}
