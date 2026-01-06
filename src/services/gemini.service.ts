import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private mockResponses: { [key: string]: string } = {
    'defecto': `Esta es una respuesta simulada de la IA. El sistema indica un fuerte rendimiento en el Q3, con un aumento del 15% en las órdenes de trabajo completadas. Sin embargo, los niveles de inventario para el 'Componente X' son críticamente bajos, y se aconseja un reabastecimiento inmediato para evitar retrasos en la producción. Las horas extra del personal han aumentado un 8%, lo que sugiere la necesidad de una revisión en la asignación de recursos.`,
    'resumen mensual': `**Resumen Mensual (Simulado)**: \n- **Órdenes de Trabajo**: 112 completadas (un 12.5% más que el mes anterior). 42 órdenes permanecen activas. \n- **Finanzas**: Ingresos por cotizaciones aprobadas: $58,000. Costos de compras: $12,500. \n- **Personal**: Total de 450 horas registradas, con un 8% de horas extra concentradas en el proyecto 'OT-2025-002'.\n- **Conclusión**: Mes de alta productividad pero se debe monitorear el aumento de horas extra.`,
    'stock bajo': `**Alerta de Stock Bajo (Simulado)**: \nSe han identificado 8 productos con niveles de inventario por debajo del mínimo establecido. \n- **Crítico**: 'Detector de Humo' (Agotado), 'Interruptor 20A' (45 restantes, mínimo 50). \n- **Acción Recomendada**: Generar órdenes de compra inmediatas para los items críticos para no impactar las OTs 'OT-2025-007' y 'OT-2025-008'.`,
    'rendimiento del equipo': `**Reporte de Rendimiento del Personal (Simulado)**: \n- **Mayor Carga de Trabajo**: John Doe y Jane Smith son los técnicos con más horas asignadas, principalmente en el proyecto 'OT-2025-002'. \n- **Aprobaciones Pendientes**: Existen 3 registros de horas pendientes de aprobación, bloqueando el cierre de la nómina semanal. \n- **Disponibilidad**: Carlos Ray y Luisa Perez se encuentran disponibles para asignación inmediata. \n- **Recomendación**: Asignar a Carlos Ray a la nueva OT 'OT-2025-007' para balancear la carga de trabajo.`
  };


  constructor() {
    // This is a browser environment, so process.env won't be defined.
    // In a real app, API key would be proxied through a backend.
    // For this applet, we will simulate it. If a key was provided via some mechanism, it would be used.
    const apiKey = (window as any).API_KEY; // A mechanism to provide key if needed
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  private getMockResponse(prompt: string): string {
    const lowerCasePrompt = prompt.toLowerCase();
    if (lowerCasePrompt.includes('resumen mensual')) {
      return this.mockResponses['resumen mensual'];
    }
    if (lowerCasePrompt.includes('stock bajo')) {
      return this.mockResponses['stock bajo'];
    }
    if (lowerCasePrompt.includes('rendimiento del equipo') || lowerCasePrompt.includes('personal')) {
      return this.mockResponses['rendimiento del equipo'];
    }
    return this.mockResponses['defecto'];
  }

  async generateSummary(prompt: string): Promise<string> {
    if (!this.ai) {
      console.warn('Gemini API key not found. Returning mocked data.');
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(this.getMockResponse(prompt));
        }, 1500);
      });
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error('Error generating summary from Gemini:', error);
      throw new Error('Failed to generate summary. Please check the console for details.');
    }
  }
}
