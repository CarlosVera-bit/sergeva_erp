import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CsvExportService {

  constructor() { }

  /**
   * Exporta datos a CSV con formato compatible con Excel en español
   * Usa punto y coma como separador y BOM para caracteres UTF-8
   */
  exportToCsv(filename: string, data: any[]): void {
    if (!data || data.length === 0) {
      return;
    }

    // Usar punto y coma para compatibilidad con Excel en español
    const separator = ';';
    const keys = Object.keys(data[0]);
    
    // Crear contenido CSV
    const csvContent =
      keys.join(separator) +
      '\n' +
      data.map(row => {
        return keys.map(key => {
          let cell = row[key] === null || row[key] === undefined ? '' : row[key];
          cell = cell instanceof Date
            ? cell.toLocaleString('es-EC')
            : cell.toString().replace(/"/g, '""');
          // Escapar si contiene separador, comillas o saltos de línea
          if (cell.search(/("|;|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(separator);
      }).join('\n');

    // Agregar BOM para que Excel reconozca UTF-8 correctamente
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Liberar memoria
    }
  }

  /**
   * Exporta a archivo Excel real (.xlsx) usando formato XML
   * Mejor compatibilidad y formato profesional
   */
  exportToExcel(filename: string, data: any[], sheetName: string = 'Datos'): void {
    if (!data || data.length === 0) {
      return;
    }

    const keys = Object.keys(data[0]);
    
    // Crear XML para Excel (formato SpreadsheetML)
    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
  <Style ss:ID="header">
    <Font ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
  </Style>
  <Style ss:ID="entrada">
    <Font ss:Color="#166534"/>
    <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="salida">
    <Font ss:Color="#991B1B"/>
    <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="normal">
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    </Borders>
  </Style>
</Styles>
<Worksheet ss:Name="${this.escapeXml(sheetName)}">
<Table>`;

    // Agregar encabezados
    xmlContent += '\n<Row ss:AutoFitHeight="1">';
    keys.forEach(key => {
      xmlContent += `<Cell ss:StyleID="header"><Data ss:Type="String">${this.escapeXml(key)}</Data></Cell>`;
    });
    xmlContent += '</Row>';

    // Agregar datos
    data.forEach(row => {
      // Determinar estilo basado en tipo
      const tipo = row['Tipo']?.toString().toUpperCase() || '';
      const rowStyle = tipo === 'ENTRADA' ? 'entrada' : tipo === 'SALIDA' ? 'salida' : 'normal';
      
      xmlContent += '\n<Row>';
      keys.forEach(key => {
        const value = row[key] === null || row[key] === undefined ? '' : row[key].toString();
        const cellStyle = key === 'Tipo' ? rowStyle : 'normal';
        xmlContent += `<Cell ss:StyleID="${cellStyle}"><Data ss:Type="String">${this.escapeXml(value)}</Data></Cell>`;
      });
      xmlContent += '</Row>';
    });

    xmlContent += `
</Table>
</Worksheet>
</Workbook>`;

    // Cambiar extensión a .xls para que Excel lo abra directamente
    const excelFilename = filename.replace(/\.csv$/i, '.xls');
    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', excelFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
