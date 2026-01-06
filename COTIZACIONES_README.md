# Módulo de Cotizaciones - Configuración

## 1. Ejecutar SQL

Debes ejecutar el siguiente SQL en phpMyAdmin o MySQL:

```sql
-- Ver archivo: sql/create_detalle_cotizaciones.sql
```

**Pasos:**
1. Abre phpMyAdmin (http://localhost/phpmyadmin)
2. Selecciona la base de datos `sergeva_db`
3. Ve a la pestaña "SQL"
4. Copia y pega el contenido de `sql/create_detalle_cotizaciones.sql`
5. Haz clic en "Continuar"

## 2. Funcionalidades Implementadas

### ✅ Crear Cotización
- Formulario completo con datos del cliente
- Gestión de items (descripción, cantidad, precio, IVA)
- Cálculo automático de subtotales y totales
- Información del destinatario

### ✅ Generación de PDF Profesional
- Diseño similar al formato SERGEVA mostrado
- Logo y datos de la empresa
- Información del cliente y destinatario
- Tabla de items con IVA
- Totales calculados automáticamente
- Observaciones opcionales

### ✅ Backend API
- **POST /api/cotizaciones.php**: Crear nueva cotización con items
- **GET /api/cotizaciones.php**: Obtener listado de cotizaciones
- Transacciones para garantizar integridad de datos
- Relación con tabla clientes

## 3. Uso

1. **Ir al módulo de Cotizaciones**
2. **Clic en "Crear Cotización"**
3. **Completar formulario:**
   - Seleccionar cliente (autocompleta datos)
   - Agregar items con "Agregar Item"
   - Completar descripción, cantidad, precio
   - Seleccionar % de IVA (0% o 15%)
4. **Previsualizar:** Genera PDF sin guardar
5. **Guardar y Generar PDF:** Guarda en BD y descarga PDF

## 4. Estructura de Datos

### Tabla: detalle_cotizaciones
- `id_detalle`: ID único
- `id_cotizacion`: Relación con cotización
- `descripcion`: Descripción del item
- `cantidad`: Cantidad del producto/servicio
- `precio_unitario`: Precio por unidad
- `iva_porcentaje`: Porcentaje de IVA (0 o 15)
- `subtotal`: Cantidad × Precio Unitario

### Tabla: cotizaciones (existente)
- Almacena información general de la cotización
- Relaciona con cliente
- Guarda totales calculados

## 5. Librerías Utilizadas

- **jspdf**: Generación de archivos PDF
- **jspdf-autotable**: Tablas profesionales en PDF
- **Angular Signals**: Reactividad y gestión de estado
- **FormsModule**: Formularios two-way binding

## 6. Próximos Pasos (Opcional)

- [ ] Editar cotizaciones existentes
- [ ] Ver detalle de cotización
- [ ] Cambiar estado (borrador → enviada → aprobada/rechazada)
- [ ] Enviar PDF por email
- [ ] Convertir cotización en orden de trabajo
- [ ] Historial de versiones
