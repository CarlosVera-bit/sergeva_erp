import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CotizacionPDF {
  numero_cotizacion: string;
  fecha_cotizacion: string;
  fecha_validez: string;
  cliente: {
    nombre: string;
    ruc: string;
    direccion: string;
    telefono: string;
    email?: string;
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
  descuento?: number;
  tipoDescuento?: 'monto' | 'porcentaje';
  total: number;
  observaciones?: string;
  plazaParque?: string;
  tiempoEntrega?: string;
  condicionesPago?: string;
  nombreContacto?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private logoBase64: string | null = null;
  private logoLoaded = false;

  constructor() {
    this.cargarLogo();
  }

  private cargarLogo(): void {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        this.logoBase64 = canvas.toDataURL('image/png');
        this.logoLoaded = true;
      }
    };
    img.src = 'assets/images/logo.png';
  }

  generarCotizacionPDF(cotizacion: CotizacionPDF): void {
    const doc = this.crearDocumentoPDF(cotizacion);
    
    // Guardar PDF
    doc.save(`Presupuesto_${cotizacion.numero_cotizacion}.pdf`);
  }
  
  /**
   * Generar PDF como blob para previsualización
   */
  generarBlobPDF(cotizacion: CotizacionPDF): string {
    const doc = this.crearDocumentoPDF(cotizacion);
    const blobUrl = doc.output('bloburl');
    return typeof blobUrl === 'string' ? blobUrl : URL.createObjectURL(doc.output('blob'));
  }
  
  /**
   * Crear documento PDF (método común para generación y previsualización)
   */
  private crearDocumentoPDF(cotizacion: CotizacionPDF): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // === LOGO (Esquina superior izquierda) ===
    if (this.logoBase64) {
      // Logo con dimensiones proporcionales (ancho: 35mm)
      doc.addImage(this.logoBase64, 'PNG', 10, 8, 35, 12);
    }

    // === INFORMACIÓN EMISOR (Izquierda) ===
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Emisor', 15, 22);

    doc.setFont('helvetica', 'bold');
    doc.text('SERGEVA S.A.', 15, 26);

    doc.setFont('helvetica', 'normal');
    doc.text('Ciudadela (Cdla) Prosperina Av. 10 entre calle 3ra y', 15, 29);
    doc.text('4ta #401', 15, 32);
    doc.text('RUC: 0902289100001', 15, 35);
    doc.text('090205 Guayaquil', 15, 38);
    doc.text('', 15, 41);
    doc.text('Teléfono: 04-2253463', 15, 44);
    doc.text('Correo: Info@sergeva.net', 15, 47);
    doc.text('Web: https://sergeva.net', 15, 50);

    // === PRESUPUESTO (Derecha superior) ===
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Presupuesto ' + cotizacion.numero_cotizacion, pageWidth - 15, 15, { align: 'right' });

    // Información adicional del presupuesto (pequeña, abajo del número)
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ref. cliente: ${cotizacion.nombreContacto || cotizacion.cliente.nombre}`, pageWidth - 15, 19, { align: 'right' });
    doc.text(`Fecha presupuesto: ${cotizacion.fecha_cotizacion}`, pageWidth - 15, 21.5, { align: 'right' });
    doc.text(`Fecha fin de validez: ${cotizacion.fecha_validez}`, pageWidth - 15, 24, { align: 'right' });

    // === RECUADRO CLIENTE "Enviar a" (Derecha) ===
    doc.setLineWidth(0.3);
    doc.rect(110, 28, pageWidth - 125, 30);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Enviar a', 113, 32);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(cotizacion.cliente.nombre, 113, 37);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(cotizacion.cliente.direccion, 113, 41);
    doc.text(`+593 Guayaquil`, 113, 44);
    doc.text('', 113, 47);
    doc.text(`Teléfono: ${cotizacion.cliente.telefono}`, 113, 50);
    doc.text(`Correo: ${cotizacion.cliente.email || ''}`, 113, 53);
    doc.text(`RUC: ${cotizacion.cliente.ruc}`, 113, 56);

    // === PLAZA PARQUE ===
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(cotizacion.plazaParque || 'PLAZA PARQUE', 15, 62);

    // === TABLA DE ITEMS ===
    const tableStartY = 67;

    // Preparar datos de la tabla
    const tableData = cotizacion.items.map(item => {
      const baseImponible = item.cantidad * item.precio_unitario;
      return [
        item.cantidad.toString(),
        item.descripcion,
        item.precio_unitario.toFixed(2),
        `${item.iva}%`,
        baseImponible.toFixed(2)
      ];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: [[
        'Cant.',
        'Descripción',
        'P.U.',
        'IVA',
        'Subtotal'
      ]],
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.3,
        lineColor: [0, 0, 0]
      },
      bodyStyles: {
        lineWidth: 0.2,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center' },
        1: { cellWidth: 95, halign: 'left' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 29, halign: 'right' }
      },
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        // Agregar título "Importes visualizados en Dólares USA" en la esquina superior derecha de la tabla
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text('Importes visualizados en Dólares USA', pageWidth - 16, tableStartY - 1, { align: 'right' });
      }
    });

    // Obtener la posición Y después de la tabla
    const finalY = (doc as any).lastAutoTable.finalY + 5;

    // === SECCIÓN INFERIOR ===
    // Tiempo de entrega y Condiciones de pago (Izquierda)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Tiempo de entrega:', 15, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.text(cotizacion.tiempoEntrega || '1 semana', 47, finalY);

    doc.setFont('helvetica', 'bold');
    doc.text('Condiciones de pago:', 15, finalY + 4);
    
    doc.setFont('helvetica', 'normal');
    doc.text(cotizacion.condicionesPago || 'Pago a los 60 días', 47, finalY + 4);

    // === TOTALES (Derecha) ===
    const totalesX = 140;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    doc.text('Total (Base imp.):', totalesX, finalY);
    doc.text(cotizacion.subtotal.toFixed(2), pageWidth - 15, finalY, { align: 'right' });

    doc.text('Total IVA 15%:', totalesX, finalY + 4);
    doc.text(cotizacion.iva.toFixed(2), pageWidth - 15, finalY + 4, { align: 'right' });

    let totalLineY = finalY + 8;

    // Descuento (si existe)
    if (cotizacion.descuento && cotizacion.descuento > 0) {
      doc.text('Descuento:', totalesX, totalLineY);
      doc.text(`-${cotizacion.descuento.toFixed(2)}`, pageWidth - 15, totalLineY, { align: 'right' });
      totalLineY += 4;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Total', totalesX, totalLineY);
    doc.text(cotizacion.total.toFixed(2), pageWidth - 15, totalLineY, { align: 'right' });

    // === ACEPTACIÓN ===
    const acceptanceY = totalLineY + 8;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Aceptación por escrito, sello de la empresa, fecha y firma', 15, acceptanceY);

    // Caja grande para firma
    doc.setLineWidth(0.2);
    doc.rect(15, acceptanceY + 2, pageWidth - 30, 30);

    // === PIE DE PÁGINA - RUC ===
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(`RUC: ${cotizacion.cliente.ruc}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

    return doc;
  }
}
