# Correcciones del Módulo de Compras (Purchasing)

## Problemas Identificados y Solucionados

### 1. **Título del Modal No Cambiaba**
**Problema:** El título del modal siempre mostraba "Nuevo Pedido de Compra", incluso cuando se estaba editando un pedido existente.

**Solución:** Se modificó el título para que sea dinámico usando el signal `isEditing()`:
```html
{{ isEditing() ? 'Editar Pedido de Compra' : 'Nuevo Pedido de Compra' }}
```

---

### 2. **Campo Número de Pedido No Visible**
**Problema:** El campo `numero_pedido` no estaba presente en el formulario, lo que impedía que los usuarios vieran o editaran este valor importante.

**Solución:** Se agregó el campo número de pedido al formulario del modal:
```html
<div>
  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Pedido</label>
  <input type="text" [(ngModel)]="newOrder().numero_pedido" placeholder="Ej: PED-001" 
         class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
</div>
```

**Nota:** Si el usuario no ingresa un número de pedido, el backend generará automáticamente uno con el formato `PED-{timestamp}`.

---

### 3. **Estado Inicial Incorrecto**
**Problema:** Al crear un nuevo pedido, el estado se inicializaba automáticamente como **"recibido"**, lo que causaba que el inventario se actualizara inmediatamente sin confirmación previa.

**Solución:** Se cambió el estado inicial a **"borrador"** en el método `openNewOrderModal()`:
```typescript
this.newOrder.set({
  numero_pedido: '',
  id_proveedor: 0,
  fecha_pedido: new Date().toISOString().split('T')[0],
  estado: 'borrador', // Cambiado de 'recibido' a 'borrador'
  total: 0,
  observaciones: '',
  detalles: []
});
```

**Estados Disponibles:**
- **Borrador:** Estado inicial, no afecta inventario
- **Enviado:** Pedido enviado al proveedor
- **Confirmado:** Proveedor confirmó el pedido
- **Recibido:** Productos recibidos, **SUMA AL STOCK**
- **Cancelado:** Pedido cancelado

---

### 4. **Observaciones No Visibles en la Tabla**
**Problema:** El campo `observaciones` no se mostraba en la tabla principal, obligando a los usuarios a ver el detalle de cada pedido para leer las notas.

**Solución:** Se agregó una nueva columna "Observaciones" a la tabla principal:
```html
<th scope="col" class="px-4 lg:px-6 py-3 hidden lg:table-cell">Observaciones</th>
```

**Comportamiento:**
- Muestra los primeros 30 caracteres de las observaciones
- Si no hay observaciones, muestra "-"
- Está oculta en pantallas pequeñas (mobile) usando `hidden lg:table-cell`

---

### 5. **Validaciones Mejoradas**
**Problema:** Las validaciones eran básicas y no proporcionaban mensajes específicos sobre qué línea de detalle tenía errores.

**Solución:** Se agregaron validaciones detalladas en `saveOrder()`:

```typescript
// Validar proveedor
if (!order.id_proveedor) {
  alert('Seleccione un proveedor');
  return;
}

// Validar fecha
if (!order.fecha_pedido) {
  alert('Ingrese la fecha del pedido');
  return;
}

// Validar que haya productos
if (order.detalles.length === 0) {
  alert('Agregue al menos un producto');
  return;
}

// Validar cada línea de detalle
for (let i = 0; i < order.detalles.length; i++) {
  const d = order.detalles[i];
  if (!d.id_producto || d.id_producto === 0) {
    alert(`Seleccione un producto en la línea ${i + 1}`);
    return;
  }
  if (!d.cantidad || d.cantidad <= 0) {
    alert(`La cantidad debe ser mayor a 0 en la línea ${i + 1}`);
    return;
  }
  if (!d.precio_unitario || d.precio_unitario <= 0) {
    alert(`El precio debe ser mayor a 0 en la línea ${i + 1}`);
    return;
  }
}
```

---

### 6. **Mejor Manejo de Errores**
**Problema:** Los mensajes de error eran genéricos y no mostraban la causa real del problema.

**Solución:** Se mejoró el bloque catch para mostrar mensajes de error específicos:
```typescript
catch (e: any) {
  console.error('Error saving order', e);
  const mensaje = e?.error?.message || e?.message || 'Error desconocido';
  alert('Error al guardar el pedido: ' + mensaje);
}
```

**Además, se agregaron mensajes de confirmación:**
```typescript
alert('Pedido creado correctamente');
alert('Pedido actualizado correctamente');
```

---

## Comportamiento del Inventario

**IMPORTANTE:** El módulo de compras está integrado con el inventario:

1. **Estado "Recibido":** Cuando un pedido se marca como "recibido", el sistema:
   - Suma automáticamente las cantidades al stock del inventario
   - Si el producto no existe en inventario, lo crea automáticamente

2. **Actualización de Pedidos:** Si se edita un pedido que estaba en estado "recibido":
   - El sistema **revierte** el stock anterior
   - Actualiza los detalles del pedido
   - Si el nuevo estado es "recibido", vuelve a **sumar** el stock

3. **Eliminación de Pedidos:** Los detalles se eliminan en cascada gracias a las restricciones de la base de datos.

---

## Archivos Modificados

1. **purchasing.component.html**
   - Título dinámico del modal
   - Campo número de pedido agregado
   - Columna observaciones en tabla
   - Estados actualizados en select

2. **purchasing.component.ts**
   - Estado inicial cambiado a 'borrador'
   - Campo numero_pedido incluido en newOrder
   - Validaciones mejoradas con mensajes específicos
   - Mejor manejo de errores
   - Mensajes de confirmación agregados
   - Logs de consola para debugging

---

## Cómo Probar

1. **Crear un Pedido Nuevo:**
   - Hacer clic en "Nuevo Pedido"
   - Verificar que el título diga "Nuevo Pedido de Compra"
   - Verificar que el estado inicial sea "Borrador"
   - Llenar todos los campos (opcional: número de pedido)
   - Agregar al menos un producto con cantidad y precio
   - Guardar y verificar mensaje de éxito

2. **Editar un Pedido:**
   - Hacer clic en el botón de editar (lápiz amarillo)
   - Verificar que el título diga "Editar Pedido de Compra"
   - Verificar que todos los campos se carguen correctamente
   - Modificar algún campo
   - Guardar y verificar mensaje de éxito

3. **Ver Observaciones:**
   - En la tabla principal, verificar que aparezca la columna "Observaciones"
   - Las observaciones largas deben truncarse a 30 caracteres

4. **Verificar Stock:**
   - Crear un pedido en estado "Borrador" → No debe afectar inventario
   - Cambiar el estado a "Recibido" → Debe sumar al stock
   - Ir al módulo de inventario y verificar las cantidades

---

## Troubleshooting

### Si No Puede Guardar:
1. Abrir las Herramientas de Desarrollo (F12)
2. Ir a la pestaña "Console"
3. Intentar guardar nuevamente
4. Revisar los mensajes de error en la consola
5. Ir a la pestaña "Network" y revisar la respuesta del servidor

### Errores Comunes:
- **"Seleccione un proveedor":** No se seleccionó un proveedor en el dropdown
- **"Agregue al menos un producto":** La tabla de productos está vacía
- **"Seleccione un producto en la línea X":** Una línea no tiene producto seleccionado
- **"La cantidad debe ser mayor a 0 en la línea X":** Cantidad inválida o vacía
- **"El precio debe ser mayor a 0 en la línea X":** Precio inválido o vacío

---

## Backend (Referencia)

El archivo `backend/api/pedidos_compra.php` maneja:

- **GET:** Listar todos los pedidos o un pedido específico con detalles
- **POST:** Crear nuevo pedido con detalles y actualizar inventario
- **PUT:** Actualizar pedido (con reversión de stock si es necesario)
- **DELETE:** Eliminar pedido

**Lógica de Stock en Backend:**
```php
// Al crear o actualizar con estado 'recibido'
if ($estado === 'recibido') {
    // Verificar si existe en inventario
    $sqlCheck = "SELECT id_inventario, stock FROM inventario WHERE id_producto = $id_producto";
    if (existe) {
        // Sumar cantidad al stock existente
        UPDATE inventario SET stock = stock + $cantidad
    } else {
        // Crear registro nuevo en inventario
        INSERT INTO inventario (id_producto, stock)
    }
}
```

---

## Próximos Pasos Sugeridos

1. **Implementar Toasts:** Reemplazar `alert()` con notificaciones más elegantes
2. **Confirmación de Cambio de Estado:** Mostrar advertencia cuando se cambie a "Recibido"
3. **Historial de Cambios:** Registrar quién y cuándo modificó cada pedido
4. **Validación de Stock:** Al cambiar a "Recibido", verificar si hay suficiente espacio en bodega
5. **Exportar PDF:** Generar documento imprimible del pedido
6. **Integración con Contifico:** Sincronizar pedidos con el sistema contable

---

**Fecha de Actualización:** ${new Date().toLocaleDateString('es-ES')}
**Estado:** ✅ Completado y Funcional
