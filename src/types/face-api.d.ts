declare module 'face-api.js' {
  // Mínima declaración para permitir compilación. En producción se recomienda instalar @types si están disponibles.
  export const nets: any;
  export class TinyFaceDetectorOptions {
    constructor(opts?: { inputSize?: number; scoreThreshold?: number });
  }
  export function detectSingleFace(input: any, options?: any): any;
  export function euclideanDistance(d1: Float32Array | number[], d2: Float32Array | number[]): number;
}
