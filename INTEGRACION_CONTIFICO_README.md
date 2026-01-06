# Integración con Contifico

Este módulo permite la sincronización automática de documentos entre Sergeva-OS y Contifico, un sistema de facturación electrónica.

## 📋 Características

- ✅ **Conexión segura con API de Contifico**
- ✅ **Sincronización de clientes**
- ✅ **Creación automática de facturas**
- ✅ **Historial completo de sincronizaciones**
- ✅ **Manejo de errores y reintentos**
- ✅ **Dashboard con estadísticas**

## 🚀 Configuración Inicial

### 1. Crear la tabla en la base de datos

Ejecuta el script SQL:

```bash
mysql -u root -p nombre_bd < sql/create_integracion_contifico.sql
```

### 2. Obtener credenciales de Contifico

1. Ingresa a tu cuenta de Contifico
2. Ve a **Configuración > API**
3. Genera un nuevo token o credenciales de API
4. Copia el **Usuario** y **Contraseña/Token**

### 3. Configurar en Sergeva-OS

1. Ve al módulo **Contabilidad**
2. Haz clic en **Configurar API**
3. Ingresa las credenciales:
   - **URL API**: `https://api.contifico.com/sistema/api/v1`
   - **Usuario**: Tu email o username de Contifico
   - **Contraseña**: Tu API token

4. Haz clic en **Probar Conexión**

## 📡 API de Contifico

### Endpoints Disponibles

#### Clientes

```typescript
// Obtener todos los clientes
GET /cliente

// Buscar cliente por identificación
GET /cliente/buscar?identificacion={RUC_O_CEDULA}

// Crear nuevo cliente
POST /cliente
{
  "identificacion": "1234567890001",
  "razon_social": "Empresa S.A.",
  "nombre_comercial": "Mi Empresa",
  "direccion": "Av. Principal 123",
  "telefono": "0999999999",
  "email": "contacto@empresa.com",
  "tipo_identificacion": "RUC"
}
```

#### Productos

```typescript
// Obtener productos
GET /producto

// Crear producto
POST /producto
{
  "codigo": "PROD001",
  "descripcion": "Servicio de mantenimiento",
  "precio": 100.00,
  "iva": true,
  "tipo": "SERVICIO"
}
```

#### Facturas

```typescript
// Crear factura
POST /documento/factura
{
  "numero_factura": "001-001-000000123",
  "fecha_emision": "2025-12-13",
  "cliente": {
    "identificacion": "1234567890001"
  },
  "items": [
    {
      "producto_codigo": "PROD001",
      "descripcion": "Servicio de mantenimiento",
      "cantidad": 1,
      "precio_unitario": 100.00,
      "iva": true
    }
  ]
}

// Obtener facturas por rango de fechas
GET /documento/factura?fecha_desde=2025-01-01&fecha_hasta=2025-12-31
```

## 🔄 Flujo de Sincronización

### Sincronización de Orden de Trabajo

```typescript
// Ejemplo de uso en el código
import { ContificoService } from './services/contifico.service';

// 1. Preparar datos de la factura
const factura = {
  numero_factura: ot.numero_ot,
  fecha_emision: new Date().toISOString().split('T')[0],
  cliente: {
    identificacion: cliente.ruc_ci,
    razon_social: cliente.razon_social,
    // ... otros campos
  },
  items: detalles.map(detalle => ({
    producto_codigo: detalle.codigo_producto,
    descripcion: detalle.descripcion,
    cantidad: detalle.cantidad,
    precio_unitario: detalle.precio_unitario,
    iva: true
  }))
};

// 2. Sincronizar con Contifico
const result = await contificoService.sincronizarOrdenTrabajo(ot.id_ot, factura);

// 3. El servicio automáticamente:
//    - Crea la factura en Contifico
//    - Registra el resultado en la tabla integracion_contifico
//    - Maneja errores y los registra
```

## 🎯 Uso del Servicio

### Inyectar el servicio

```typescript
import { inject } from '@angular/core';
import { ContificoService } from '../../services/contifico.service';

export class MiComponente {
  contificoService = inject(ContificoService);
}
```

### Verificar conexión

```typescript
async testConnection() {
  const connected = await this.contificoService.testConnection();
  if (connected) {
    console.log('✅ Conectado a Contifico');
  } else {
    console.log('❌ Error de conexión');
  }
}
```

### Obtener clientes

```typescript
async loadClientes() {
  try {
    const clientes = await this.contificoService.getClientes();
    console.log('Clientes:', clientes);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Crear factura

```typescript
async crearFactura() {
  const factura = {
    numero_factura: 'FAC-001',
    fecha_emision: '2025-12-13',
    cliente: {
      identificacion: '1234567890001',
      razon_social: 'Cliente S.A.'
    },
    items: [
      {
        producto_codigo: 'SERV001',
        descripcion: 'Servicio de consultoría',
        cantidad: 10,
        precio_unitario: 50.00,
        iva: true
      }
    ],
    subtotal: 500.00,
    iva_total: 60.00,
    total: 560.00
  };

  try {
    const result = await this.contificoService.crearFactura(factura);
    console.log('Factura creada:', result);
  } catch (error) {
    console.error('Error creando factura:', error);
  }
}
```

### Sincronizar cliente

```typescript
async syncCliente(clienteLocal: any) {
  try {
    const clienteContifico = await this.contificoService.sincronizarCliente(clienteLocal);
    console.log('Cliente sincronizado:', clienteContifico);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## 📊 Monitoreo

### Dashboard de Integración

El módulo de **Contabilidad** muestra:

- 📈 **Estado de conexión** con Contifico
- 📅 **Última sincronización** realizada
- ✅ **Sincronizaciones exitosas**
- ❌ **Sincronizaciones con error**
- 📋 **Historial completo** de todas las operaciones

### Estados de Sincronización

| Estado | Descripción | Acción |
|--------|-------------|--------|
| `pendiente` | Sincronización programada pero no ejecutada | Se ejecutará en el próximo ciclo |
| `exitoso` | Documento creado exitosamente en Contifico | Sin acción requerida |
| `error` | Error al crear documento | Revisar logs y reintentar |
| `reintento` | Esperando reintento automático | Se ejecutará automáticamente |

## 🛠️ Solución de Problemas

### Error: "No hay credenciales configuradas"

**Solución**: Ve a Configurar API e ingresa tus credenciales de Contifico.

### Error: "Error al conectar con Contifico"

**Posibles causas**:
- Credenciales incorrectas
- URL de API incorrecta
- Problema de red o firewall
- API de Contifico no disponible

**Solución**: 
1. Verifica las credenciales
2. Revisa la URL de la API
3. Prueba la conexión desde Postman

### Error: "Cliente no encontrado"

**Solución**: Usa el método `sincronizarCliente()` para crear el cliente en Contifico primero.

### Logs de Sincronización

Los logs completos se almacenan en:
- **Base de datos**: Tabla `integracion_contifico`
- **Campo**: `respuesta_contifico` (JSON con detalles)

## 🔐 Seguridad

- Las credenciales se almacenan en `localStorage` del navegador
- La comunicación con Contifico usa **HTTPS**
- La autenticación usa **Basic Auth** con token
- Los tokens nunca se envían en URLs

## 📝 Notas Importantes

1. **Producción vs Desarrollo**: Contifico puede tener diferentes URLs para desarrollo y producción. Asegúrate de usar la correcta.

2. **Límites de API**: Contifico puede tener límites de requests por minuto. El servicio maneja reintentos automáticos.

3. **Sincronización Manual**: Usa el botón "Forzar Sincronización" solo cuando sea necesario para evitar duplicados.

4. **Backup**: La tabla `integracion_contifico` mantiene registro de todas las operaciones para auditoría.

## 🔄 Actualización de Datos

Para actualizar documentos ya sincronizados, usa la API de Contifico directamente:

```typescript
// Actualizar factura en Contifico
PUT /documento/factura/{id}
```

## 📞 Soporte

Para más información sobre la API de Contifico:
- 📚 Documentación: https://docs.contifico.com
- 💬 Soporte: soporte@contifico.com
- 📱 Teléfono: (EC) 1800-CONTIFICO

## 🎉 Ejemplo Completo

Ver el archivo [work-orders.component.ts](../src/components/work-orders/work-orders.component.ts) para un ejemplo completo de integración en el módulo de Órdenes de Trabajo.
