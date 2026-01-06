// RESUMEN: Cambios en quote-create.component.ts
// Archivo: src/components/quotes/quote-create.component.ts (871 líneas)

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PROPIEDADES AGREGADAS AL FORMULARIO (línea ~461)
// ═══════════════════════════════════════════════════════════════════════════════

formulario = {
  numero_cotizacion: 'Cargando...',
  fecha_cotizacion: new Date().toISOString().split('T')[0],
  fecha_validez: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  id_cliente: '',
  id_contacto: '',
  destinatario_nombre: '',
  destinatario_direccion: '',
  destinatario_telefono: '',
  observaciones: '',
  
  // ✨ NUEVAS PROPIEDADES PARA DESCUENTO:
  tienDescuento: false,              // boolean - Toggle del checkbox
  descuento: 0,                       // number - Valor del descuento
  tipoDescuento: 'monto'              // 'monto' o 'porcentaje'
};


// ═══════════════════════════════════════════════════════════════════════════════
// 2. NUEVOS MÉTODOS DE CÁLCULO (línea ~666)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcula el descuento final basado en el tipo seleccionado
 * @returns {number} Monto del descuento a aplicar
 */
calcularDescuento(): number {
  // Si no está habilitado o es 0, retorna 0
  if (!this.formulario.tienDescuento || this.formulario.descuento <= 0) {
    return 0;
  }

  // Si es porcentaje, calcula sobre el total
  if (this.formulario.tipoDescuento === 'porcentaje') {
    const total = this.calcularSubtotalTotal() + this.calcularIVATotal();
    return (total * this.formulario.descuento) / 100;
  } else {
    // Si es monto fijo, retorna el valor directamente
    return this.formulario.descuento;
  }
}

/**
 * Método actualizado: Calcula el total restando el descuento
 * @returns {number} Total final (Subtotal + IVA - Descuento)
 */
calcularTotal(): number {
  const subtotal = this.calcularSubtotalTotal();
  const iva = this.calcularIVATotal();
  const total = subtotal + iva;
  
  if (!this.formulario.tienDescuento || this.formulario.descuento <= 0) {
    return total;
  }
  
  const descuento = this.calcularDescuento();
  return total - descuento;
}


// ═══════════════════════════════════════════════════════════════════════════════
// 3. SECCIÓN EN EL TEMPLATE - TOTALES ACTUALIZADA (línea ~253)
// ═══════════════════════════════════════════════════════════════════════════════

/*
<!-- Totales -->
<div class="mt-3 flex justify-end">
  <div class="w-full md:w-1/3 space-y-1 text-sm">
    <!-- Subtotal -->
    <div class="flex justify-between text-slate-700 dark:text-slate-300">
      <span>Subtotal:</span>
      <span class="font-medium">${{ calcularSubtotalTotal().toFixed(2) }}</span>
    </div>
    
    <!-- IVA -->
    <div class="flex justify-between text-slate-700 dark:text-slate-300">
      <span>IVA (15%):</span>
      <span class="font-medium">${{ calcularIVATotal().toFixed(2) }}</span>
    </div>

    <!-- NUEVA SECCIÓN: DESCUENTO -->
    <div class="border-t pt-2">
      <!-- Checkbox -->
      <label class="flex items-center gap-2 cursor-pointer mb-2">
        <input type="checkbox" 
          [(ngModel)]="formulario.tienDescuento" 
          class="w-4 h-4 text-primary-600 rounded border-slate-300 
                 dark:bg-slate-700 dark:border-slate-600">
        <span class="text-slate-700 dark:text-slate-300 font-medium">
          Aplicar Descuento
        </span>
      </label>

      <!-- Contenedor condicional - Solo aparece si tienDescuento = true -->
      @if (formulario.tienDescuento) {
        <div class="space-y-2 mb-2 p-2 bg-slate-50 dark:bg-slate-700 rounded">
          <!-- Selector de tipo -->
          <div>
            <label class="block text-xs font-medium text-slate-700 
                         dark:text-slate-300 mb-1">
              Tipo de Descuento
            </label>
            <select [(ngModel)]="formulario.tipoDescuento" 
              (change)="formulario.descuento = 0"
              class="w-full px-2 py-1 text-xs border border-slate-300 rounded 
                     focus:ring-2 focus:ring-primary-500 
                     dark:bg-slate-600 dark:border-slate-600 dark:text-white">
              <option value="monto">Monto Fijo (\$)</option>
              <option value="porcentaje">Porcentaje (%)</option>
            </select>
          </div>
          
          <!-- Input de descuento -->
          <div>
            <label class="block text-xs font-medium text-slate-700 
                         dark:text-slate-300 mb-1">
              {{ formulario.tipoDescuento === 'porcentaje' 
                 ? 'Descuento (%)' 
                 : 'Descuento (\$)' }}
            </label>
            <input 
              [type]="formulario.tipoDescuento === 'porcentaje' 
                      ? 'number' : 'number'" 
              [(ngModel)]="formulario.descuento" 
              [max]="formulario.tipoDescuento === 'porcentaje' 
                     ? 100 
                     : calcularSubtotalTotal() + calcularIVATotal()"
              min="0" step="0.01"
              class="w-full px-2 py-1 text-xs border border-slate-300 rounded 
                     focus:ring-2 focus:ring-primary-500 
                     dark:bg-slate-600 dark:border-slate-600 dark:text-white">
          </div>
        </div>

        <!-- Línea de descuento calculado -->
        <div class="flex justify-between text-slate-700 dark:text-slate-300 
                    text-amber-600 dark:text-amber-400 font-medium">
          <span>Descuento:</span>
          <span>-\${{ calcularDescuento().toFixed(2) }}</span>
        </div>
      }
    </div>

    <!-- TOTAL -->
    <div class="flex justify-between text-base font-bold text-slate-900 
                dark:text-white border-t pt-1">
      <span>TOTAL:</span>
      <span>\${{ calcularTotal().toFixed(2) }}</span>
    </div>
  </div>
</div>
*/


// ═══════════════════════════════════════════════════════════════════════════════
// 4. MÉTODO guardarYGenerarPDF() ACTUALIZADO (línea ~803)
// ═══════════════════════════════════════════════════════════════════════════════

async guardarYGenerarPDF() {
  if (!this.formularioValido()) return;

  this.guardando.set(true);

  try {
    // Determinar URL basada en modo
    const url = this.modoEdicion
      ? `http://localhost/Sergeva/backend/api/cotizaciones.php?id=${this.idCotizacionEditar}`
      : 'http://localhost/Sergeva/backend/api/cotizaciones.php';

    // Preparar body del request
    const response = await fetch(url, {
      method: this.modoEdicion ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(this.modoEdicion && { id_cotizacion: this.idCotizacionEditar }),
        numero_cotizacion: this.formulario.numero_cotizacion,
        id_cliente: parseInt(this.formulario.id_cliente),
        fecha_cotizacion: this.formulario.fecha_cotizacion,
        fecha_validez: this.formulario.fecha_validez,
        subtotal: this.calcularSubtotalTotal(),
        iva: this.calcularIVATotal(),
        
        // ✨ NUEVAS PROPIEDADES:
        descuento: this.formulario.tienDescuento 
          ? this.calcularDescuento() 
          : 0,
        tipoDescuento: this.formulario.tipoDescuento,
        
        total: this.calcularTotal(),
        observaciones: this.formulario.observaciones,
        items: this.items()
      })
    });

    // Resto del código...
  } catch (error) {
    console.error('Error guardando cotización:', error);
    this.toastService.showError('❌ Error al guardar la cotización');
  } finally {
    this.guardando.set(false);
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// 5. MÉTODO construirObjetoCotizacion() ACTUALIZADO (línea ~861)
// ═══════════════════════════════════════════════════════════════════════════════

construirObjetoCotizacion(): CotizacionPDF {
  const cliente = this.clienteSeleccionado();
  return {
    numero_cotizacion: this.formulario.numero_cotizacion,
    fecha_cotizacion: this.formatearFecha(this.formulario.fecha_cotizacion),
    fecha_validez: this.formatearFecha(this.formulario.fecha_validez),
    cliente: {
      nombre: cliente?.nombre_razon_social || '',
      ruc: cliente?.ruc_cedula || '',
      direccion: cliente?.direccion || '',
      telefono: cliente?.telefono || ''
    },
    destinatario: {
      nombre: this.formulario.destinatario_nombre,
      direccion: this.formulario.destinatario_direccion,
      telefono: this.formulario.destinatario_telefono
    },
    items: this.items(),
    subtotal: this.calcularSubtotalTotal(),
    iva: this.calcularIVATotal(),
    
    // ✨ NUEVAS PROPIEDADES PARA PDF:
    descuento: this.formulario.tienDescuento 
      ? this.calcularDescuento() 
      : 0,
    tipoDescuento: this.formulario.tipoDescuento,
    
    total: this.calcularTotal(),
    observaciones: this.formulario.observaciones
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// CAMBIOS EN INTERFAZ CotizacionPDF (en pdf.service.ts)
// ═══════════════════════════════════════════════════════════════════════════════

export interface CotizacionPDF {
  numero_cotizacion: string;
  fecha_cotizacion: string;
  fecha_validez: string;
  cliente: {
    nombre: string;
    ruc: string;
    direccion: string;
    telefono: string;
  };
  destinatario: {
    nombre: string;
    direccion: string;
    telefono: string;
  };
  items: Array<{
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    iva: number;
  }>;
  subtotal: number;
  iva: number;
  
  // ✨ NUEVAS PROPIEDADES:
  descuento?: number;
  tipoDescuento?: 'monto' | 'porcentaje';
  
  total: number;
  observaciones?: string;
}


// ═══════════════════════════════════════════════════════════════════════════════
// CAMBIOS EN PDF GENERATION (en pdf.service.ts - Método crearDocumentoPDF)
// ═══════════════════════════════════════════════════════════════════════════════

// Sección de TOTALES actualizada (línea ~175):

const totalesX = pageWidth - 70;
doc.setFontSize(9);
doc.setFont('helvetica', 'normal');

doc.text('Subtotal:', totalesX, finalY);
doc.text(`$${cotizacion.subtotal.toFixed(2)}`, pageWidth - 20, finalY, { 
  align: 'right' 
});

doc.text('IVA (15%):', totalesX, finalY + 6);
doc.text(`$${cotizacion.iva.toFixed(2)}`, pageWidth - 20, finalY + 6, { 
  align: 'right' 
});

// ✨ NUEVA SECCIÓN: Descuento
let totalY = finalY + 14;
if (cotizacion.descuento && cotizacion.descuento > 0) {
  doc.setTextColor(220, 100, 0);  // Color naranja RGB
  const descuentoText = cotizacion.tipoDescuento === 'porcentaje' 
    ? `Descuento (-):` 
    : `Descuento (-):`;
  doc.text(descuentoText, totalesX, finalY + 12);
  doc.text(`$${cotizacion.descuento.toFixed(2)}`, pageWidth - 20, finalY + 12, { 
    align: 'right' 
  });
  totalY = finalY + 20;  // Ajusta posición del TOTAL
}

// Restaurar color a negro para TOTAL
doc.setTextColor(0, 0, 0);
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('TOTAL:', totalesX, totalY);
doc.text(`$${cotizacion.total.toFixed(2)}`, pageWidth - 20, totalY, { 
  align: 'right' 
});

// Observaciones ahora usa totalY variable:
if (cotizacion.observaciones) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text('Observaciones:', 15, totalY + 12);
  doc.text(cotizacion.observaciones, 15, totalY + 18, {
    maxWidth: pageWidth - 30
  });
}


// ═══════════════════════════════════════════════════════════════════════════════
// CAMBIOS EN BACKEND API (backend/api/cotizaciones.php)
// ═══════════════════════════════════════════════════════════════════════════════

// Método POST actualizado:
if ($method === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true);
  
  // ... validaciones ...
  
  // ✨ Capturar nuevos parámetros:
  $descuento = $input['descuento'] ?? 0;
  $tipo_descuento = $input['tipoDescuento'] ?? 'monto';
  
  // Insertar en BD:
  $stmt = $conn->prepare("INSERT INTO cotizaciones 
    (numero_cotizacion, id_cliente, fecha_cotizacion, fecha_validez, 
     subtotal, iva, descuento, tipo_descuento, total, observaciones, estado) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'enviada')");
     
  $stmt->bind_param("sisddddsds", 
    $numero_cotizacion, $id_cliente, $fecha_cotizacion, $fecha_validez, 
    $subtotal, $iva, $descuento, $tipo_descuento, $total, $observaciones);
  
  $stmt->execute();
}

// Método PUT actualizado:
if ($method === 'PUT') {
  // ... extrae datos ...
  
  // ✨ Capturar nuevos parámetros:
  $descuento = $input['descuento'] ?? 0;
  $tipo_descuento = $input['tipoDescuento'] ?? 'monto';
  
  // Actualizar en BD:
  $stmt = $conn->prepare("UPDATE cotizaciones 
    SET numero_cotizacion = ?, id_cliente = ?, fecha_cotizacion = ?, 
        fecha_validez = ?, subtotal = ?, iva = ?, descuento = ?, 
        tipo_descuento = ?, total = ?, observaciones = ? 
    WHERE id_cotizacion = ?");
    
  $stmt->bind_param("sisddddsdssi", 
    $numero_cotizacion, $id_cliente, $fecha_cotizacion, $fecha_validez, 
    $subtotal, $iva, $descuento, $tipo_descuento, $total, $observaciones, 
    $id_cotizacion);
    
  $stmt->execute();
}


// ═══════════════════════════════════════════════════════════════════════════════
// RESUMEN DE CAMBIOS
// ═══════════════════════════════════════════════════════════════════════════════

/*
✨ CAMBIOS TOTALES:

Frontend (quote-create.component.ts):
  - 3 nuevas propiedades en formulario
  - 2 métodos nuevos/actualizados (calcularDescuento, calcularTotal)
  - 1 sección actualizada en template (~40 líneas)
  - 2 métodos actualizados (guardarYGenerarPDF, construirObjetoCotizacion)

Backend (cotizaciones.php):
  - Métodos POST y PUT actualizados para manejar descuento
  - 2 nuevas columnas en BD

PDF (pdf.service.ts):
  - Interfaz actualizada
  - Generación de PDF con línea de descuento
  - Color naranja para destacar

Base de Datos:
  - 2 nuevas columnas (descuento, tipo_descuento)
  - 1 SQL migration script

Total: ~150 líneas de código nuevo/actualizado
Complejidad: BAJA
Testing: 4 test cases incluidos
*/
