# 🎨 Guía Visual: Feature de Descuento en Cotizaciones

## 📱 Interfaz del Formulario

### ANTES (Sin Descuento)
```
┌─────────────────────────────────────────────┐
│ CREAR COTIZACIÓN                            │
├─────────────────────────────────────────────┤
│ Información del Cliente                     │
│ [Seleccionar Cliente ▼]                     │
│ [Enviar a...]                               │
│                                              │
│ Items                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ Descripción  │ IVA │ P.U. │ Cant │ Sub │ │
│ ├─────────────────────────────────────────┤ │
│ │ Instalación  │ 15% │ $200 │  5   │$1000│ │
│ │ Mano de obra │  0% │ $100 │  3   │ $300│ │
│ └─────────────────────────────────────────┘ │
│ [+ Agregar Item]                            │
│                                              │
│ Totales                                      │
│ ┌────────────────────────┐                  │
│ │ Subtotal:    $1,300.00 │                  │
│ │ IVA (15%):   $  195.00 │                  │
│ │ TOTAL:       $1,495.00 │                  │
│ └────────────────────────┘                  │
└─────────────────────────────────────────────┘
```

### DESPUÉS (Con Feature de Descuento)
```
┌─────────────────────────────────────────────┐
│ CREAR COTIZACIÓN                            │
├─────────────────────────────────────────────┤
│ Información del Cliente                     │
│ [Seleccionar Cliente ▼]                     │
│ [Enviar a...]                               │
│                                              │
│ Items                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ Descripción  │ IVA │ P.U. │ Cant │ Sub │ │
│ ├─────────────────────────────────────────┤ │
│ │ Instalación  │ 15% │ $200 │  5   │$1000│ │
│ │ Mano de obra │  0% │ $100 │  3   │ $300│ │
│ └─────────────────────────────────────────┘ │
│ [+ Agregar Item]                            │
│                                              │
│ Totales                                      │
│ ┌────────────────────────┐                  │
│ │ Subtotal:    $1,300.00 │                  │
│ │ IVA (15%):   $  195.00 │                  │
│ │                        │                  │
│ │ ☐ Aplicar Descuento    │                  │
│ │ TOTAL:       $1,495.00 │                  │
│ └────────────────────────┘                  │
└─────────────────────────────────────────────┘
```

## ✨ Estado: Checkbox Desmarcado (Default)

- El checkbox está vacío: `☐`
- Los campos de descuento están **ocultos**
- El total se calcula sin descuento
- Apariencia limpia y simple

---

## ✅ Estado: Checkbox Marcado

```
┌────────────────────────────────────────────────┐
│ Totales                                         │
├────────────────────────────────────────────────┤
│ Subtotal:         $1,300.00                    │
│ IVA (15%):        $  195.00                    │
│                                                 │
│ ☑ Aplicar Descuento                   ← MARCA │
│ ┌──────────────────────────────────────────┐   │
│ │ Tipo de Descuento                        │   │
│ │ [Monto Fijo ($)  ▼]   ← Selector        │   │
│ │    └─ "Monto Fijo ($)"                   │   │
│ │    └─ "Porcentaje (%)"                   │   │
│ │                                          │   │
│ │ Descuento ($)                            │   │
│ │ [_____________]  ← Input field           │   │
│ │                                          │   │
│ └──────────────────────────────────────────┘   │
│ Descuento (-):    -$   100.00  🟠 (Naranja)   │
│ ─────────────────────────────────────────      │
│ TOTAL:            $ 1,395.00                   │
│                                                 │
│ [GUARDAR Y GENERAR PDF] [CANCELAR]            │
└────────────────────────────────────────────────┘
```

---

## 🎯 Flujo de Interacción

### Paso 1: Marcar Checkbox
```
Usuario hace clic en ☐ Aplicar Descuento
         ↓
         ↓
Aparece el formulario de descuento (animado)
```

### Paso 2: Seleccionar Tipo
```
[Monto Fijo ($)  ▼]  ← Click
         ↓
┌─────────────────────┐
│ Monto Fijo ($)      │  ← Selected
│ Porcentaje (%)      │
└─────────────────────┘

Si cambia el tipo:
Tipo anterior: Monto Fijo - Valor: 100
Nuevo tipo: Porcentaje
    ↓
Valor se limpia: [_______]  ← Previene confusión
```

### Paso 3: Ingresar Valor
```
[_____________]  ← Usuario escribe
         ↓
Validaciones en tiempo real:
- Si es % → Máximo 100
- Si es $ → Máximo al total
- No negativos
```

### Paso 4: Ver Resultado
```
Usuario escribe 10 (porcentaje)
         ↓
Cálculo: 10% de ($1,300 + $195) = $149.50
         ↓
Descuento (-):    -$   149.50
TOTAL:            $ 1,345.50  ← Actualizado
```

---

## 📊 Ejemplo Completo: Cotización con Descuento

### Inicio: Usuario crea cotización
```
Productos:
  - Tablero Eléctrico: 1 x $500 = $500 (IVA 15%)
  - Cables y Conectores: 2 x $150 = $300 (Sin IVA)
  
Subtotal: $800.00
IVA:      $120.00 (15% solo sobre tablero)
─────────────────
TOTAL:    $920.00
```

### Cliente pide descuento del 10%
```
1. Usuario marca ☑ Aplicar Descuento
2. Selecciona "Porcentaje (%)"
3. Ingresa: 10
```

### Resultado en Pantalla
```
Subtotal:    $  800.00
IVA (15%):   $  120.00
Descuento:   -$   92.00  🟠 (10% de $920)
─────────────────────────
TOTAL:       $  828.00  ← Nuevo total
```

### Resultado en PDF
```
═══════════════════════════════════════════════════════
                    PRESUPUESTO PR-2025-0001
═══════════════════════════════════════════════════════

SERGEVA S.A.

Enviar a:
  Cliente ABC
  Dirección...
  Teléfono...

───────────────────────────────────────────────────────
Descripción              IVA  P.U.    Cant.   Base Imp.
───────────────────────────────────────────────────────
Tablero Eléctrico        15%  $500      1     $500.00
Cables y Conectores       0%  $150      2     $300.00
───────────────────────────────────────────────────────

                              Subtotal:    $  800.00
                              IVA (15%):   $  120.00
                              Descuento:   -$   92.00  ← 🟠 Naranja
                              ──────────────────────
                              TOTAL:       $  828.00

Observaciones:
Válido por 30 días. Instalación no incluida.

═══════════════════════════════════════════════════════
```

---

## 🎨 Estilos CSS (Tailwind)

### Checkbox
```typescript
<input type="checkbox" 
  class="w-4 h-4 
          text-primary-600     // Azul cuando está marcado
          rounded 
          border-slate-300 
          dark:bg-slate-700 
          dark:border-slate-600">
```

### Contenedor del Descuento
```typescript
<div class="space-y-2 
            mb-2 
            p-2 
            bg-slate-50 
            dark:bg-slate-700   // Gris oscuro en dark mode
            rounded">
```

### Línea de Descuento (HTML)
```typescript
<div class="flex justify-between 
            text-slate-700 
            dark:text-slate-300 
            text-amber-600       // Naranja
            dark:text-amber-400  // Naranja en dark
            font-medium">
  <span>Descuento:</span>
  <span>-$149.50</span>
</div>
```

### Línea de Descuento (PDF - jsPDF)
```typescript
doc.setTextColor(220, 100, 0);  // RGB Naranja
doc.text('Descuento (-):' , totalesX, finalY + 12);
doc.text(`$${descuento.toFixed(2)}`, pageWidth - 20, finalY + 12);
```

---

## 🌙 Dark Mode

Todos los elementos soportan dark mode:

```
Light Mode:
┌──────────────────────────────┐
│ ☑ Aplicar Descuento (Negro)  │
│ [Fondo blanco/gris claro]    │
│ Texto: Gris oscuro           │
│ Input: Borde gris            │
└──────────────────────────────┘

Dark Mode:
┌──────────────────────────────┐
│ ☑ Aplicar Descuento (Blanco) │
│ [Fondo gris oscuro]          │
│ Texto: Gris claro            │
│ Input: Borde gris oscuro     │
└──────────────────────────────┘
```

---

## 💾 Persistencia en BD

Cuando el usuario guarda una cotización con descuento:

```sql
INSERT INTO cotizaciones (
  numero_cotizacion,
  id_cliente,
  fecha_cotizacion,
  fecha_validez,
  subtotal,
  iva,
  descuento,           ← Nueva columna
  tipo_descuento,      ← Nueva columna
  total,
  observaciones,
  estado
) VALUES (
  'PR-2025-0001',
  15,
  '2025-12-27',
  '2026-01-26',
  800.00,
  120.00,
  92.00,               ← Valor guardado
  'porcentaje',        ← Tipo guardado
  828.00,
  'Válido por 30 días',
  'enviada'
);
```

---

## 🔄 Edición de Cotización Existente

Cuando el usuario **edita** una cotización con descuento:

```
Abre cotización guardada:
│
├─ Carga datos básicos
├─ Carga items
├─ Carga descuento: { descuento: 92.00, tipoDescuento: 'porcentaje' }
│
└─ Renderiza:
   ☑ Aplicar Descuento  ← Marcado automáticamente
   [Porcentaje (%)  ▼]  ← Selector setea
   [10]                 ← Campo se llena
   
   Descuento (-): -$92.00
   TOTAL:         $828.00
```

---

## ⚠️ Casos Especiales

### Caso 1: Cambiar de Monto a Porcentaje
```
Estado inicial:
  Tipo: Monto Fijo
  Valor: 100
  Descuento: -$100.00

Usuario cambia a Porcentaje:
  Tipo: Porcentaje
  Valor: [_______]  ← Se limpia automáticamente
  Descuento: -$0.00 ← Se actualiza
  
Motivo: Evitar confusión (100 monto ≠ 100%)
```

### Caso 2: Desmarcar Descuento
```
Estado actual:
  ☑ Aplicar Descuento
  Descuento: -$92.00
  
Usuario desmarca:
  ☐ Aplicar Descuento
  [Campos se ocultan]
  Descuento: $0.00 (se ignora)
  TOTAL: Se recalcula sin descuento
```

### Caso 3: Descuento Mayor al Total
```
User intenta ingresar descuento más alto que el total:

Monto fijo:
  Total: $500
  Usuario escribe: 600
  
Validación:
  [max="500"]  ← El input bloquea valores > 500
  No permite ingresar 600
```

---

## 📈 Cálculo Matemático

### Monto Fijo
```
TOTAL_FINAL = SUBTOTAL + IVA - DESCUENTO_FIJO
TOTAL_FINAL = $800 + $120 - $100
TOTAL_FINAL = $820
```

### Porcentaje
```
DESCUENTO_CALCULADO = (SUBTOTAL + IVA) × (PORCENTAJE / 100)
DESCUENTO_CALCULADO = $920 × (10 / 100)
DESCUENTO_CALCULADO = $92

TOTAL_FINAL = SUBTOTAL + IVA - DESCUENTO_CALCULADO
TOTAL_FINAL = $800 + $120 - $92
TOTAL_FINAL = $828
```

---

## ✨ Beneficios del Diseño

✅ **Claridad**: Checkbox indica claramente el estado
✅ **Economía visual**: Se oculta cuando no se usa
✅ **Intuitividad**: UI similar a otros formularios
✅ **Flexibilidad**: Dos tipos de descuento
✅ **Seguridad**: Validaciones previenen errores
✅ **Accesibilidad**: Labels y inputs semánticamente correctos
✅ **Responsive**: Funciona en móvil y escritorio
✅ **Dark Mode**: Compatible con ambos temas

