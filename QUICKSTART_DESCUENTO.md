# ⚡ QUICK START: Sistema de Descuentos

## 🚀 En 5 Minutos

### 1️⃣ Ejecuta esto en phpMyAdmin (1 minuto)
```sql
ALTER TABLE cotizaciones 
ADD COLUMN descuento DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER iva,
ADD COLUMN tipo_descuento ENUM('monto', 'porcentaje') DEFAULT 'monto' AFTER descuento;
```

✅ **Listo! El código ya está actualizado.**

---

### 2️⃣ Abre el navegador y ve a Cotizaciones

```
1. Abre tu app
2. Módulo → Cotizaciones
3. Crear Nueva Cotización
```

---

### 3️⃣ Prueba el Descuento

#### Test 1: Sin descuento (baseline)
```
☐ Aplicar Descuento  (Deja desmarcado)
TOTAL: $1,000.00
✅ Funciona normalmente
```

#### Test 2: Con descuento ($100)
```
☑ Aplicar Descuento
Tipo: [Monto Fijo ($)]
Valor: [100]
Descuento (-): -$100.00 🟠
TOTAL: $900.00
✅ Resta correctamente
```

#### Test 3: Con descuento (10%)
```
☑ Aplicar Descuento
Tipo: [Porcentaje (%)]
Valor: [10]
Descuento (-): -$100.00 🟠 (10% de $1000)
TOTAL: $900.00
✅ Calcula bien
```

---

### 4️⃣ Genera PDF

```
Botón: [GUARDAR Y GENERAR PDF]
→ El PDF incluye el descuento
→ En color naranja para destacar
✅ Todo correcto
```

---

## 📊 Ejemplo Rápido

```
ANTES (sin descuento):
Subtotal:    $1,000
IVA:         $  150
─────────────────────
TOTAL:       $1,150

DESPUÉS (con 15% descuento):
Subtotal:    $1,000
IVA:         $  150
Descuento:   -$  172.50 🟠
─────────────────────
TOTAL:       $  977.50
```

---

## 🔄 Editar Cotización Existente

```
1. Abre cotización existente
2. Marca "Aplicar Descuento"
3. Ingresa valor
4. Guarda
→ Los cambios se persisten en BD
✅ Funciona
```

---

## ✨ Features Incluidas

| Feature | Estado |
|---------|--------|
| Checkbox toggle | ✅ |
| Tipo (monto/%) | ✅ |
| Cálculo automático | ✅ |
| Visualización PDF | ✅ |
| Guardado en BD | ✅ |
| Edición | ✅ |
| Dark mode | ✅ |
| Validaciones | ✅ |

---

## 🎯 Casos de Uso

### Cliente solicita 10% descuento
```
1. Crear cotización
2. ☑ Aplicar Descuento
3. [Porcentaje]
4. [10]
✅ Se calcula automáticamente
```

### Pronto pago: $50 descuento
```
1. Crear cotización
2. ☑ Aplicar Descuento
3. [Monto Fijo]
4. [50]
✅ Resta exactamente $50
```

### Editar después: cambiar descuento
```
1. Abre cotización guardada
2. Modifica el valor
3. Guarda
✅ Se actualiza en BD y PDF
```

---

## ❓ Si algo no funciona

| Síntoma | Causa | Solución |
|---------|-------|----------|
| "Error al guardar" | SQL no ejecutado | Ejecuta el ALTER TABLE |
| Descuento no se ve | Caché | Ctrl+Shift+R (recarga) |
| Total no se calcula | Código viejo | Ctrl+Shift+R (recarga) |
| Campo no desaparece | Checkbox marcado | Desmarca para ocultarlo |

---

## 📚 Documentación Completa

Si necesitas más detalles:
- 📖 [FEATURE_DESCUENTO_COMPLETO.md](./FEATURE_DESCUENTO_COMPLETO.md) - Resumen general
- 📘 [INSTRUCCIONES_DESCUENTO.md](./INSTRUCCIONES_DESCUENTO.md) - Paso a paso
- 🎨 [DESCUENTO_VISUAL_GUIDE.md](./DESCUENTO_VISUAL_GUIDE.md) - Interfaz visual
- 💻 [CODIGO_CAMBIOS_DESCUENTO.ts](./CODIGO_CAMBIOS_DESCUENTO.ts) - Código modificado

---

## ✅ Listo!

**Solo un SQL y ¡funciona! 🎉**

Más preguntas → Revisa la [documentación completa](./FEATURE_DESCUENTO_COMPLETO.md)

---

**Creado:** 27/12/2025  
**Tiempo setup:** ~5 minutos  
**Complejidad:** Baja ✨
