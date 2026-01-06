declare module '@vladmandic/face-api/dist/face-api.esm.js' {
  export const nets: any;
  export class TinyFaceDetectorOptions {
    constructor(opts?: { inputSize?: number; scoreThreshold?: number });
  }
  export function detectSingleFace(input: any, options?: any): any;
  export function euclideanDistance(d1: Float32Array | number[], d2: Float32Array | number[]): number;
}
