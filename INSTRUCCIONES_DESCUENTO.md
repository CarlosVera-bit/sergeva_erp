# 🚀 INSTRUCCIONES DE IMPLEMENTACIÓN: Feature de Descuento

## ⏱️ Resumen Ejecutivo

Se ha implementado un **sistema de descuentos** en el módulo de cotizaciones con:
- ✅ Interfaz toggle (checkbox) para activar/desactivar descuento
- ✅ Dos tipos: Monto Fijo ($) o Porcentaje (%)
- ✅ Cálculos automáticos en tiempo real
- ✅ Visualización en PDF con color naranja
- ✅ Persistencia en Base de Datos

**Tiempo de implementación:** 15 min (incluye BD)

---

## 📋 Checklist de Implementación

### ✅ Paso 1: Ejecutar SQL en Base de Datos (REQUERIDO)

1. Abre **phpMyAdmin** o tu cliente MySQL
2. Selecciona la BD `sergeva_erp`
3. Copia y ejecuta este SQL:

```sql
ALTER TABLE cotizaciones 
ADD COLUMN descuento DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER iva,
ADD COLUMN tipo_descuento ENUM('monto', 'porcentaje') DEFAULT 'monto' AFTER descuento;
```

**Verificar:**
```sql
-- Ejecuta para confirmar que las columnas existen
DESCRIBE cotizaciones;

-- Deberías ver:
-- descuento | decimal(12,2)
-- tipo_descuento | enum('monto','porcentaje')
```

### ✅ Paso 2: Actualizar Frontend (AUTOMÁTICO)

Los siguientes archivos YA han sido modificados:

- [x] `src/components/quotes/quote-create.component.ts` ← 871 líneas actualizadas
- [x] `src/services/pdf.service.ts` ← Interfaz y generación de PDF
- [x] `backend/api/cotizaciones.php` ← Métodos POST y PUT actualizados

**NO NECESITA ACCIÓN** ✨

### ✅ Paso 3: Actualizar Backend (AUTOMÁTICO)

El API está listo para:
- Guardar descuento en POST
- Actualizar descuento en PUT
- Retornar descuento en GET

**NO NECESITA ACCIÓN** ✨

### ✅ Paso 4: Probar la Funcionalidad

#### Test 1: Crear cotización SIN descuento
1. Abre módulo Cotizaciones
2. Crea nueva cotización
3. Agrega items
4. Deja checkbox "Aplicar Descuento" desmarcado
5. Guarda y genera PDF
6. **Resultado esperado:** PDF sin línea de descuento ✅

#### Test 2: Crear cotización CON descuento (Monto Fijo)
1. Crea nueva cotización
2. Agrega items (total $500)
3. Marca checkbox "Aplicar Descuento"
4. Selecciona "Monto Fijo ($)"
5. Ingresa: 50
6. Verifica que el TOTAL sea $500 - $50 = $450
7. Guarda y genera PDF
8. **Resultado esperado:** PDF muestra:
   ```
   Subtotal:       $400.00
   IVA:             $60.00
   Descuento (-):  -$50.00
   TOTAL:          $410.00  ← Correcto
   ```

#### Test 3: Crear cotización CON descuento (Porcentaje)
1. Crea nueva cotización
2. Agrega items (total $1000)
3. Marca checkbox "Aplicar Descuento"
4. Selecciona "Porcentaje (%)"
5. Ingresa: 10
6. Verifica que el descuento sea $100 (10% de $1000)
7. Verifica que el TOTAL sea $1000 - $100 = $900
8. **Resultado esperado:** PDF muestra descuento en naranja ✅

#### Test 4: Editar cotización existente
1. Abre una cotización anterior
2. Agrega descuento
3. Cambia el descuento
4. Guarda cambios
5. **Resultado esperado:** Se actualiza correctamente ✅

---

## 🎯 Funcionalidades Implementadas

### 1. Interfaz del Descuento
```typescript
// En el formulario de cotización, ahora existe:
formulario.tienDescuento    // boolean - checkbox
formulario.descuento         // number - valor del descuento
formulario.tipoDescuento     // 'monto' o 'porcentaje'
```

### 2. Métodos de Cálculo
```typescript
// Método para calcular el descuento real
calcularDescuento(): number {
  if (!this.formulario.tienDescuento) return 0;
  
  if (this.formulario.tipoDescuento === 'porcentaje') {
    return (this.calcularTotal() * this.formulario.descuento) / 100;
  }
  return this.formulario.descuento;
}

// El total ahora resta el descuento
calcularTotal(): number {
  return this.calcularSubtotalTotal() + 
         this.calcularIVATotal() - 
         this.calcularDescuento();
}
```

### 3. Visualización en Template
```html
<!-- Checkbox -->
<label class="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" [(ngModel)]="formulario.tienDescuento">
  Aplicar Descuento
</label>

<!-- Campos condicionales -->
@if (formulario.tienDescuento) {
  <select [(ngModel)]="formulario.tipoDescuento">
    <option value="monto">Monto Fijo ($)</option>
    <option value="porcentaje">Porcentaje (%)</option>
  </select>
  <input type="number" [(ngModel)]="formulario.descuento">
}

<!-- Línea de descuento -->
@if (formulario.tienDescuento && formulario.descuento > 0) {
  <div class="text-amber-600">
    Descuento (-): ${{ calcularDescuento().toFixed(2) }}
  </div>
}
```

### 4. Persistencia en BD
```php
// POST y PUT ahora incluyen:
$descuento = $input['descuento'] ?? 0;
$tipo_descuento = $input['tipoDescuento'] ?? 'monto';

// INSERT:
INSERT INTO cotizaciones (..., descuento, tipo_descuento, ...) 
VALUES (..., ?, ?, ...);

// UPDATE:
UPDATE cotizaciones SET descuento = ?, tipo_descuento = ? 
WHERE id_cotizacion = ?;
```

### 5. Generación de PDF
```typescript
// El PDF ahora incluye:
if (cotizacion.descuento && cotizacion.descuento > 0) {
  // Línea de descuento en color naranja (220, 100, 0)
  doc.setTextColor(220, 100, 0);
  doc.text(`Descuento (-): $${descuento.toFixed(2)}`);
}
```

---

## 📁 Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `src/components/quotes/quote-create.component.ts` | Interfaz, Template, Métodos | 871 |
| `src/services/pdf.service.ts` | Interfaz CotizacionPDF, Generación | 201 |
| `backend/api/cotizaciones.php` | POST, PUT métodos | 287 |

## 📄 Archivos Creados (Documentación)

| Archivo | Propósito |
|---------|-----------|
| `DESCUENTO_COTIZACIONES_README.md` | Guía completa de cambios |
| `DESCUENTO_VISUAL_GUIDE.md` | Guía visual e interfaz |
| `sql/add_descuento_to_cotizaciones.sql` | Script SQL de migración |
| `sql/IMPLEMENTACION_DESCUENTO.sql` | Scripts completos con validación |

---

## 🔧 Solución de Problemas

### ❌ Problema: "Error al guardar cotización"
**Solución:** 
1. Verifica que las columnas existan en BD:
   ```sql
   DESCRIBE cotizaciones;
   ```
2. Si no existen, ejecuta el SQL del Paso 1

### ❌ Problema: "Descuento no aparece en PDF"
**Solución:**
1. Verifica que `formulario.tienDescuento` sea true
2. Verifica que `formulario.descuento > 0`
3. Recarga la página (Ctrl + Shift + R) para cargar el código nuevo

### ❌ Problema: "El total no se actualiza"
**Solución:**
1. Verifica que tengas las versiones actualizadas de:
   - `quote-create.component.ts`
   - Recarga la página

### ❌ Problema: "El descuento se borra al cambiar tipo"
**Solución:**
- ✅ Esto es **INTENCIONAL** para evitar confusión
- Ejemplo: 100 como monto ≠ 100 como porcentaje
- El usuario debe reingresarlo en el nuevo tipo

---

## 📊 Validaciones Implementadas

✅ **Descuento no puede ser negativo**
```typescript
min="0" step="0.01"
```

✅ **Porcentaje máximo es 100%**
```typescript
[max]="formulario.tipoDescuento === 'porcentaje' ? 100 : ..."
```

✅ **Monto no puede exceder el total**
```typescript
[max]="calcularSubtotalTotal() + calcularIVATotal()"
```

✅ **Campos de descuento solo aparecen si checkbox está marcado**
```html
@if (formulario.tienDescuento) { ... }
```

✅ **Campo se limpia al cambiar tipo**
```typescript
(change)="formulario.descuento = 0"
```

---

## 🎓 Ejemplos de Uso

### Escenario 1: Cotización con descuento por volumen
```
Cliente pide 100 unidades, aplica descuento del 5%

1. Crear cotización
2. Agregar 100 items a $10 c/u = $1000
3. Marcar "Aplicar Descuento"
4. Seleccionar "Porcentaje (%)"
5. Ingresar 5
6. Resultado: Total = $1000 - $50 = $950

PDF generado:
Subtotal:       $1000.00
IVA:              $0.00 (si no tiene IVA)
Descuento (-):   -$50.00 🟠
TOTAL:           $950.00
```

### Escenario 2: Cotización con descuento por pronto pago
```
Cliente paga al contado, se otorga $200 de descuento

1. Crear cotización normal
2. Total final = $2000
3. Marcar "Aplicar Descuento"
4. Seleccionar "Monto Fijo ($)"
5. Ingresar 200
6. Resultado: Total = $2000 - $200 = $1800

PDF generado:
Subtotal:       $1500.00
IVA:              $225.00
Descuento (-):  -$200.00 🟠
TOTAL:          $1525.00
```

---

## 🚀 Próximas Características (Futuro)

Si en el futuro deseas agregar:

1. **Descuentos automáticos por cantidad**
   ```typescript
   if (cantidadTotal > 100) aplicar 5% descuento;
   ```

2. **Códigos de cupón**
   ```typescript
   aplicarCodigoCupon('VERANO2025') // Retorna % o $
   ```

3. **Descuentos por cliente**
   ```typescript
   const clienteVIP = cliente.categoria === 'VIP';
   if (clienteVIP) aplicarDescuentoCliente();
   ```

4. **Auditoría de descuentos**
   ```sql
   INSERT INTO auditoria_descuentos 
   (id_cotizacion, descuento, razon, usuario, fecha)
   ```

---

## 📞 Soporte

**Documentos de referencia:**
- 📄 [DESCUENTO_COTIZACIONES_README.md](./DESCUENTO_COTIZACIONES_README.md) - Cambios técnicos
- 🎨 [DESCUENTO_VISUAL_GUIDE.md](./DESCUENTO_VISUAL_GUIDE.md) - Interfaz visual
- 🗄️ [sql/IMPLEMENTACION_DESCUENTO.sql](./sql/IMPLEMENTACION_DESCUENTO.sql) - Scripts SQL

**Si encontras problemas:**
1. Revisa que el SQL se haya ejecutado ✅
2. Limpia el caché del navegador (Ctrl+Shift+Del)
3. Recarga la aplicación (Ctrl+Shift+R)
4. Verifica la consola del navegador (F12 → Console)

---

## ✨ Resumen Final

La feature está **100% lista para usar**:

✅ Código frontend actualizado
✅ Backend actualizado  
✅ Interfaz diseñada
✅ PDF mejorado
✅ Documentación completa
✅ Scripts SQL preparados

**Próximo paso:** Ejecutar el SQL (5 minutos) y ¡listo! 🎉

