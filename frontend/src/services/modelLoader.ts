// Centralized, cached, lazy model loader for TFJS + models
// - Dynamically imports heavy deps
// - Ensures tf backend and readiness
// - Caches model instances across the app

export type TFModule = typeof import('@tensorflow/tfjs');
export type BlazeFaceNS = typeof import('@tensorflow-models/blazeface');
export type CocoSsdNS = typeof import('@tensorflow-models/coco-ssd');
export type FaceLandmarksNS = typeof import('@tensorflow-models/face-landmarks-detection');

export type FaceModel = import('@tensorflow-models/blazeface').BlazeFaceModel;
export type ObjectModel = import('@tensorflow-models/coco-ssd').ObjectDetection;
export type LandmarkModel = import('@tensorflow-models/face-landmarks-detection').FaceLandmarksDetector;

let tfPromise: Promise<TFModule> | null = null;
let modelsPromise: Promise<{ faceModel: FaceModel; objectModel: ObjectModel; landmarkModel: LandmarkModel }>| null = null;

async function getTF(): Promise<TFModule> {
  if (!tfPromise) {
    tfPromise = (async () => {
      const tf = await import('@tensorflow/tfjs');
      // Attempt preferred backends with fallbacks and configure WASM asset path (for non-worker path)
      try {
        await tf.setBackend('webgl');
      } catch (e) {
        console.warn('[modelLoader] webgl backend not available; trying wasm.', e);
      }

      if (tf.getBackend() !== 'webgl') {
        try {
          const wasmNS = await import('@tensorflow/tfjs-backend-wasm');
          const wasmPath = (import.meta as any)?.env?.VITE_TFJS_WASM_PATH ||
            'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.18.0/dist/';
          try { (wasmNS as any).setWasmPaths?.(wasmPath); } catch {}
          await tf.setBackend('wasm');
        } catch (e) {
          console.warn('[modelLoader] wasm backend init failed; will fall back to cpu.', e);
        }
      }

      if (tf.getBackend() !== 'webgl' && tf.getBackend() !== 'wasm') {
        try {
          await import('@tensorflow/tfjs-backend-cpu');
          await tf.setBackend('cpu');
        } catch (e) {
          console.warn('[modelLoader] cpu backend init failed as well.', e);
        }
      }

      await tf.ready();
      return tf;
    })();
  }
  return tfPromise;
}

export async function getModels() {
  if (!modelsPromise) {
    modelsPromise = (async () => {
      // Ensure TF is ready and backend chosen
      await getTF();

      const [blazefaceNS, cocoSsdNS, faceLmNS] = await Promise.all([
        import('@tensorflow-models/blazeface'),
        import('@tensorflow-models/coco-ssd'),
        import('@tensorflow-models/face-landmarks-detection'),
      ]);

      const [faceModel, objectModel, landmarkModel] = await Promise.all([
        blazefaceNS.load(),
        // Use the heavier but more accurate base
        cocoSsdNS.load({ base: 'mobilenet_v2' }),
        faceLmNS.createDetector(
          faceLmNS.SupportedModels.MediaPipeFaceMesh,
          { runtime: 'tfjs', refineLandmarks: true, maxFaces: 2 }
        ),
      ]);

      return { faceModel, objectModel, landmarkModel };
    })();
  }
  return modelsPromise;
}

export async function preload() {
  try {
    // Fire and forget; caller can await if desired
    await Promise.all([getTF(), getModels()]);
    // eslint-disable-next-line no-console
    console.info('[modelLoader] Models preloaded.');
  } catch (e) {
    console.error('[modelLoader] Preload failed', e);
  }
}
