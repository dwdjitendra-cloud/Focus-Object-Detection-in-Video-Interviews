// detectionWorker.ts - Runs TFJS inference off the main thread
// Message protocol:
//  - { type: 'init' }
//      -> loads tfjs (wasm backend) + models, replies { type: 'ready' }
//  - { type: 'frame', bitmap: ImageBitmap }
//      -> runs inference, replies { type: 'result', payload: {...} }
//  - { type: 'stop' } -> cleanup and close

export type WorkerInit = { type: 'init' };
export type WorkerFrame = { type: 'frame'; bitmap: ImageBitmap };
export type WorkerStop = { type: 'stop' };

// Lazy module-level caches
let tf: typeof import('@tensorflow/tfjs');
let cocoSsdNS: typeof import('@tensorflow-models/coco-ssd');
let faceLmNS: typeof import('@tensorflow-models/face-landmarks-detection');

let objectModel: import('@tensorflow-models/coco-ssd').ObjectDetection | undefined;
let landmarkModel: import('@tensorflow-models/face-landmarks-detection').FaceLandmarksDetector | undefined;

let canvas: OffscreenCanvas | undefined;
let ctx: OffscreenCanvasRenderingContext2D | null | undefined;

function calculateEAR(landmarks: any) {
  try {
    const leftIdx = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
    const rightIdx = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
    const leftEye = leftIdx.map(i => landmarks[i]);
    const rightEye = rightIdx.map(i => landmarks[i]);
    const leftVert = Math.abs(leftEye[1].y - leftEye[5].y) + Math.abs(leftEye[2].y - leftEye[4].y);
    const rightVert = Math.abs(rightEye[1].y - rightEye[5].y) + Math.abs(rightEye[2].y - rightEye[4].y);
    const leftHor = Math.abs(leftEye[0].x - leftEye[3].x) || 1;
    const rightHor = Math.abs(rightEye[0].x - rightEye[3].x) || 1;
    return (leftVert / (2 * leftHor) + rightVert / (2 * rightHor)) / 2;
  } catch {
    return 0.3;
  }
}

function calculateHeadPose(landmarks: any) {
  try {
    const nose = landmarks[1], leftEye = landmarks[33], rightEye = landmarks[362];
    const leftMouth = landmarks[61], rightMouth = landmarks[291];
    const eyeDist = Math.abs(rightEye.x - leftEye.x) || 1;
    const yaw = ((nose.x - leftEye.x) - (rightEye.x - nose.x)) / eyeDist;
    const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
    const mouthCenter = { x: (leftMouth.x + rightMouth.x) / 2, y: (leftMouth.y + rightMouth.y) / 2 };
    const pitch = (mouthCenter.y - eyeCenter.y) / eyeDist;
    const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    return { yaw, pitch, roll };
  } catch {
    return { yaw: 0, pitch: 0, roll: 0 };
  }
}

function analyzeFocus(headPose: { yaw: number; pitch: number; roll: number }) {
  const { yaw, pitch, roll } = headPose;
  return Math.abs(yaw) > 0.3 || Math.abs(pitch) > 0.2 || Math.abs(roll) > 0.4;
}

async function ensureInit() {
  if (tf && objectModel && landmarkModel) return;
  // Dynamic imports
  tf = await import('@tensorflow/tfjs');
  // Prefer WASM in worker for stability/perf; configure asset path for .wasm files
  try {
    const wasmNS = await import('@tensorflow/tfjs-backend-wasm');
    // Allow env override, else default to jsDelivr CDN matching our package.json version (4.18.0)
    const wasmPath = (import.meta as any)?.env?.VITE_TFJS_WASM_PATH ||
      'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.18.0/dist/';
    // setWasmPaths is available on the wasm backend namespace
    try {
      (wasmNS as any).setWasmPaths?.(wasmPath);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[worker] setWasmPaths not available or failed:', e);
    }
    await tf.setBackend('wasm');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[worker] WASM backend init failed; will try webgl/cpu fallback.', e);
  }

  if (tf.getBackend() !== 'wasm') {
    // Try webgl next
    try {
      await import('@tensorflow/tfjs-backend-webgl');
      await tf.setBackend('webgl');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[worker] WebGL backend init failed; falling back to CPU.', e);
    }
  }

  if (tf.getBackend() !== 'wasm' && tf.getBackend() !== 'webgl') {
    try {
      await import('@tensorflow/tfjs-backend-cpu');
      await tf.setBackend('cpu');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[worker] CPU backend init failed as well.', e);
    }
  }
  await tf.ready();

  cocoSsdNS = await import('@tensorflow-models/coco-ssd');
  faceLmNS = await import('@tensorflow-models/face-landmarks-detection');

  // Load models
  [objectModel, landmarkModel] = await Promise.all([
    cocoSsdNS.load(),
    faceLmNS.createDetector(faceLmNS.SupportedModels.MediaPipeFaceMesh, { runtime: 'tfjs', refineLandmarks: true, maxFaces: 2 })
  ]);
}

self.addEventListener('message', async (evt: MessageEvent<WorkerInit | WorkerFrame | WorkerStop>) => {
  const msg = evt.data as any;
  try {
    if (msg.type === 'init') {
      await ensureInit();
      (self as any).postMessage({ type: 'ready' });
    } else if (msg.type === 'frame') {
      if (!objectModel || !landmarkModel) {
        (self as any).postMessage({ type: 'error', error: 'Models not ready' });
        // close transferred bitmap
        try { (msg as WorkerFrame).bitmap.close(); } catch {}
        return;
      }

      const bitmap = (msg as WorkerFrame).bitmap;
      // Prepare canvas once
      if (!canvas) {
        canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        // Use willReadFrequently for faster getImageData readbacks
        ctx = canvas.getContext('2d', { willReadFrequently: true } as any);
      }
      if (canvas!.width !== bitmap.width || canvas!.height !== bitmap.height) {
        canvas!.width = bitmap.width; canvas!.height = bitmap.height;
      }
      ctx!.drawImage(bitmap, 0, 0);
      // Close to release resource
      try { bitmap.close(); } catch {}

      // Run inference
      let faceCount = 0;
      let isFaceDetected = false;
      let ear = 0;
      let isDrowsy = false;
      let headPose = { yaw: 0, pitch: 0, roll: 0 };
      let isLookingAway = false;
      let detectedObjects: string[] = [];
      let confidence = 0;

      {
        // Create tensor from ImageData derived from the canvas
        const img = ctx!.getImageData(0, 0, canvas!.width, canvas!.height);
        const input = tf.browser.fromPixels(img);

        try {
          // Landmarks
          const faces = await landmarkModel!.estimateFaces(input as any);
          faceCount = faces.length;
          isFaceDetected = faceCount > 0;
          if (faces.length > 0) {
            const landmarks = faces[0].keypoints as any[];
            ear = calculateEAR(landmarks);
            isDrowsy = ear < 0.25;
            headPose = calculateHeadPose(landmarks);
            isLookingAway = analyzeFocus(headPose);
          }

          // Object Detection
          const objects = await objectModel!.detect(input as any);
          const filtered = objects.filter(o => (o.score || 0) > 0.6);
          const mapped: string[] = [];
          filtered.forEach(o => {
            const cls = (o.class || '').toLowerCase();
            if (cls.includes('phone') || cls.includes('cell phone') || cls.includes('mobile')) mapped.push('phone');
            else if (cls.includes('book')) mapped.push('book');
            else if (cls.includes('laptop') || cls.includes('keyboard') || cls.includes('mouse')) mapped.push('device');
            else if (cls.includes('paper') || cls.includes('notebook') || cls.includes('note')) mapped.push('notes');
            else if (cls.includes('person') && (o.score || 0) > 0.6) mapped.push('unauthorized_person');
          });
          detectedObjects = Array.from(new Set(mapped));
          confidence = filtered.length > 0 ? Math.max(...filtered.map(o => o.score || 0)) : 0;
        } finally {
          input.dispose();
        }
      }

      (self as any).postMessage({
        type: 'result',
        payload: {
          isFaceDetected,
          faceCount,
          eyeAspectRatio: ear,
          isDrowsy,
          headPose,
          isLookingAway,
          detectedObjects,
          confidence,
        }
      });
    } else if (msg.type === 'stop') {
      try {
        // no specific model dispose API here; tf.tidy used above for tensors
        // If we wanted, we could attempt tf.engine().memory() or related.
      } catch {}
      (self as any).postMessage({ type: 'stopped' });
      (self as any).close?.();
    }
  } catch (error: any) {
    (self as any).postMessage({ type: 'error', error: error?.message || String(error) });
  }
});
