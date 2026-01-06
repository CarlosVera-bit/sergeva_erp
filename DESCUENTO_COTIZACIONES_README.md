# 📋 Resumen de Cambios: Módulo de Cotizaciones - Feature Descuento

## ✅ Cambios Implementados

### 1. Frontend - Componente de Cotizaciones

#### Archivo: `src/components/quotes/quote-create.component.ts`

**Cambios realizados:**

1. **Agregadas propiedades de descuento al formulario** (línea ~461):
   ```typescript
   formulario = {
     // ... propiedades existentes ...
     tienDescuento: false,          // Checkbox para habilitar/deshabilitar
     descuento: 0,                   // Monto o porcentaje del descuento
     tipoDescuento: 'monto'          // 'monto' o 'porcentaje'
   };
   ```

2. **Sección de Totales en el Template** (línea ~253):
   - ✨ Checkbox "Aplicar Descuento"
   - 📊 Campo selector: Tipo de Descuento (Monto Fijo o Porcentaje)
   - 💰 Input campo para ingresar el descuento
   - 📉 Línea que muestra el descuento calculado en color naranja
   - Visibilidad condicional: El descuento solo aparece cuando el checkbox está marcado

3. **Nuevo método `calcularDescuento()`** (línea ~670):
   ```typescript
   calcularDescuento(): number {
     // Retorna 0 si descuento no está habilitado
     // Calcula descuento por porcentaje si es %
     // Retorna monto fijo si es $
   }
   ```

4. **Método `calcularTotal()` actualizado** (línea ~666):
   ```typescript
   calcularTotal(): number {
     // Subtotal + IVA - Descuento
     return total - descuento;
   }
   ```

5. **Método `construirObjetoCotizacion()` actualizado** (línea ~861):
   - Se envía `descuento` y `tipoDescuento` al objeto PDF
   - Se agrega descuento al JSON que se envía al backend

6. **Método `guardarYGenerarPDF()` actualizado** (línea ~803):
   - Se incluye `descuento` y `tipoDescuento` en el body del POST/PUT

### 2. Servicio PDF - `src/services/pdf.service.ts`

#### Cambios realizados:

1. **Interfaz `CotizacionPDF` actualizada** (línea ~5):
   ```typescript
   export interface CotizacionPDF {
     // ... propiedades existentes ...
     descuento?: number;
     tipoDescuento?: 'monto' | 'porcentaje';
   }
   ```

2. **Método `crearDocumentoPDF()` actualizado** (línea ~175):
   - Agregada línea de descuento en color naranja (220, 100, 0)
   - El descuento aparece entre IVA y TOTAL si existe
   - Cálculo automático de espaciado (totalY) para no sobreescribir observaciones

**Ejemplo de salida en PDF:**
```
Subtotal:        $ 1,000.00
IVA (15%):       $   150.00
Descuento (-):   $   100.00    ← En color naranja
─────────────────────────────
TOTAL:           $ 1,050.00    ← Se resta automáticamente
```

### 3. Backend API - `backend/api/cotizaciones.php`

#### Cambios realizados:

1. **Método POST actualizado** (línea ~102):
   - Ahora captura `descuento` y `tipoDescuento` del request
   - Inserta en BD con `descuento` y `tipo_descuento`

2. **Método PUT actualizado** (línea ~206):
   - Ahora actualiza `descuento` y `tipo_descuento`
   - Usa parámetros correctos en `bind_param`

### 4. Base de Datos - SQL Migration

#### Archivo: `sql/add_descuento_to_cotizaciones.sql`

```sql
ALTER TABLE cotizaciones 
ADD COLUMN descuento DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN tipo_descuento ENUM('monto', 'porcentaje') DEFAULT 'monto';
```

**⚠️ Acción requerida:** Ejecutar este SQL en la BD para agregar las columnas.

---

## 🎯 Funcionalidad

### Comportamiento del Descuento

1. **Deshabilitado por defecto**
   - El checkbox "Aplicar Descuento" comienza desmarcado
   - El campo de descuento permanece oculto
   - El total se calcula sin descuento

2. **Al marcar el checkbox**
   - Aparecen campos para:
     - Seleccionar tipo (Monto Fijo o Porcentaje)
     - Ingresar el valor del descuento
   - Se valida automáticamente:
     - Máximo 100 si es porcentaje
     - Máximo al total si es monto fijo
   - El descuento se resta del total en tiempo real

3. **Tipos de descuento**
   - **Monto Fijo ($)**: Resta el monto exacto del total
   - **Porcentaje (%)**: Calcula el porcentaje sobre (Subtotal + IVA) y lo resta

4. **En el PDF**
   - Se muestra una línea con el descuento en color naranja
   - El total final ya incluye la resta del descuento
   - Si no hay descuento, la línea no aparece

---

## 📝 Ejemplo de Uso

### Escenario 1: Cotización sin descuento
```
Items: 3x Producto
Subtotal:    $ 1,000.00
IVA 15%:     $   150.00
─────────────
TOTAL:       $ 1,150.00
```

### Escenario 2: Cotización con descuento (Monto fijo)
1. Usuario marca checkbox "Aplicar Descuento"
2. Selecciona "Monto Fijo ($)"
3. Ingresa 100

```
Items: 3x Producto
Subtotal:    $ 1,000.00
IVA 15%:     $   150.00
Descuento:   -$   100.00  ← En naranja
─────────────
TOTAL:       $ 1,050.00
```

### Escenario 3: Cotización con descuento (Porcentaje)
1. Usuario marca checkbox "Aplicar Descuento"
2. Selecciona "Porcentaje (%)"
3. Ingresa 10

```
Items: 3x Producto
Subtotal:    $ 1,000.00
IVA 15%:     $   150.00
Descuento:   -$   115.00  (10% de 1,150)  ← En naranja
─────────────
TOTAL:       $ 1,035.00
```

---

## 🔍 Validaciones Implementadas

✅ Descuento no puede ser negativo
✅ Porcentaje máximo es 100%
✅ Monto máximo no puede exceder el total
✅ Tipo de descuento debe ser 'monto' o 'porcentaje'
✅ Campo se borra al cambiar de tipo
✅ Cálculo en tiempo real

---

## 🚀 Próximos Pasos (Opcional)

Si deseas agregar más funcionalidades:

1. **Descuentos por cantidad**: Aplicar automáticamente descuentos por cantidad de items
2. **Codes de descuento**: Sistema de cupones/códigos promocionales
3. **Historial de descuentos**: Registrar cambios en descuentos para auditoría
4. **Descuentos por cliente**: Descuentos automáticos según cliente VIP/regular

---

## 🎨 Detalles Visuales

**Checkbox:**
- Tailwind classes: `flex items-center gap-2 cursor-pointer`
- Dark mode compatible

**Campo de Descuento:**
- Fondo gris claro (slate-50 / dark:slate-700)
- Redondeado con bordes
- Focus ring azul (primary-500)
- Validaciones en tiempo real

**Línea de Descuento en PDF:**
- Color: RGB(220, 100, 0) - Naranja
- Fuente: Normal, 9pt
- Alineación: Derecha

---

## 📊 Campos en Base de Datos

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `descuento` | DECIMAL(12,2) | 0.00 | Monto del descuento |
| `tipo_descuento` | ENUM | 'monto' | 'monto' o 'porcentaje' |

---

## ✨ Resumen de Beneficios

✅ Interfaz intuitiva con toggle visual
✅ Soporte para dos tipos de descuento
✅ Cálculos automáticos y validaciones
✅ Visualización clara en PDF
✅ Compatible con modo oscuro
✅ Persistencia en base de datos
✅ Actualización en tiempo real

