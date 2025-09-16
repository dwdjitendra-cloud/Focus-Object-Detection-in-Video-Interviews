// import { useRef, useEffect, useState, useCallback } from 'react';
// import * as tf from '@tensorflow/tfjs';
// import * as blazeface from '@tensorflow-models/blazeface';
// import * as cocoSsd from '@tensorflow-models/coco-ssd';
// import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
// import { DetectionState, DetectionEvent, DetectionConfig } from '../types';

// // Default config
// const DEFAULT_CONFIG: DetectionConfig = {
//   FOCUS_THRESHOLD: parseInt(import.meta.env.VITE_FOCUS_THRESHOLD) || 5000,
//   ABSENCE_THRESHOLD: parseInt(import.meta.env.VITE_ABSENCE_THRESHOLD) || 10000,
//   DETECTION_INTERVAL: parseInt(import.meta.env.VITE_DETECTION_INTERVAL) || 300,
//   CONFIDENCE_THRESHOLD: parseFloat(import.meta.env.VITE_CONFIDENCE_THRESHOLD) || 0.6,
//   EYE_CLOSURE_THRESHOLD: 0.25,
//   DROWSINESS_DURATION: 3000,
//   AUDIO_THRESHOLD: 0.1,
// };

// interface AdvancedDetectionState extends DetectionState {
//   isDrowsy: boolean;
//   eyeClosureStart?: number;
//   eyeAspectRatio: number;
//   audioLevel: number;
//   backgroundVoiceDetected: boolean;
//   headPose: { yaw: number; pitch: number; roll: number };
//   focusLostStart?: number;
// }

// const useAdvancedDetection = (
//   videoRef: React.RefObject<HTMLVideoElement>,
//   onEvent: (event: Omit<DetectionEvent, '_id' | 'candidateId' | 'sessionId'>) => void,
//   isActive: boolean = true,
//   config: Partial<DetectionConfig> = {}
// ) => {
//   const finalConfig = { ...DEFAULT_CONFIG, ...config };

//   const [detectionState, setDetectionState] = useState<AdvancedDetectionState>({
//     isFaceDetected: false,
//     faceCount: 0,
//     lastFaceTime: Date.now(),
//     isLookingAway: false,
//     detectedObjects: [],
//     confidence: 0,
//     isModelLoaded: false,
//     isDrowsy: false,
//     eyeAspectRatio: 0,
//     audioLevel: 0,
//     backgroundVoiceDetected: false,
//     headPose: { yaw: 0, pitch: 0, roll: 0 },
//   });

//   const [models, setModels] = useState<{
//     faceModel?: blazeface.BlazeFaceModel;
//     objectModel?: cocoSsd.ObjectDetection;
//     landmarkModel?: faceLandmarksDetection.FaceLandmarksDetector;
//   }>({});

//   const intervalRef = useRef<NodeJS.Timeout>();
//   const audioContextRef = useRef<AudioContext>();
//   const analyserRef = useRef<AnalyserNode>();
//   const microphoneRef = useRef<MediaStreamAudioSourceNode>();
//   const eventQueueRef = useRef<Array<Omit<DetectionEvent, '_id' | 'candidateId' | 'sessionId'>>>([]);

//   // Initialize audio
//   // const initializeAudio = useCallback(async () => {
//   //   try {
//   //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//   //     audioContextRef.current = new AudioContext();
//   //     analyserRef.current = audioContextRef.current.createAnalyser();
//   //     microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
//   //     analyserRef.current.fftSize = 256;
//   //     microphoneRef.current.connect(analyserRef.current);
//   //     console.log('Audio detection initialized');
//   //   } catch (error) {
//   //     console.warn('Audio detection not available:', error);
//   //   }
//   // }, []);
//   // inside the hook: improved initializeAudio
// const initializeAudio = useCallback(async () => {
//   try {
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     // Use prefixed for wider compatibility (not required in modern browsers but safe)
//     const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
//     audioContextRef.current = new AudioCtx();

//     // Resume the context immediately to avoid "suspended" state (common autoplay policy)
//     if (audioContextRef.current.state === 'suspended') {
//       try {
//         await audioContextRef.current.resume();
//         console.log('AudioContext resumed');
//       } catch (err) {
//         console.warn('AudioContext resume failed (will try again on user gesture):', err);
//       }
//     }

//     analyserRef.current = audioContextRef.current.createAnalyser();
//     // Better analyser config
//     analyserRef.current.fftSize = 2048; // higher resolution for time-domain RMS
//     analyserRef.current.smoothingTimeConstant = 0.3;
//     analyserRef.current.minDecibels = -90;
//     analyserRef.current.maxDecibels = -10;

//     microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
//     microphoneRef.current.connect(analyserRef.current);

//     console.log('Audio detection initialized', {
//       fftSize: analyserRef.current.fftSize,
//       smoothingTimeConstant: analyserRef.current.smoothingTimeConstant
//     });
//   } catch (error) {
//     console.warn('Audio detection not available:', error);
//   }
// }, []);


//   // Load AI models
//   useEffect(() => {
//     const loadModels = async () => {
//       try {
//         console.log('Loading AI models...');
//         await tf.ready();
//         await tf.setBackend('webgl');

//         const [faceModel, objectModel, landmarkModel] = await Promise.all([
//           blazeface.load(),
//           cocoSsd.load(),
//           faceLandmarksDetection.createDetector(
//             faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
//             { runtime: 'tfjs', refineLandmarks: true, maxFaces: 2 }
//           ),
//         ]);

//         setModels({ faceModel, objectModel, landmarkModel });
//         setDetectionState(prev => ({ ...prev, isModelLoaded: true }));
//         await initializeAudio();
//         console.log('Models loaded successfully');
//       } catch (error) {
//         console.error('Failed to load AI models:', error);
//       }
//     };

//     loadModels();
//   }, [initializeAudio]);

//   // Eye Aspect Ratio
//   const calculateEAR = useCallback((landmarks: any) => {
//     try {
//       const leftEye = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246].map(i => landmarks[i]);
//       const rightEye = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398].map(i => landmarks[i]);
//       const leftVert = Math.abs(leftEye[1].y - leftEye[5].y) + Math.abs(leftEye[2].y - leftEye[4].y);
//       const rightVert = Math.abs(rightEye[1].y - rightEye[5].y) + Math.abs(rightEye[2].y - rightEye[4].y);
//       const leftHor = Math.abs(leftEye[0].x - leftEye[3].x);
//       const rightHor = Math.abs(rightEye[0].x - rightEye[3].x);
//       return (leftVert / (2 * leftHor) + rightVert / (2 * rightHor)) / 2;
//     } catch {
//       return 0.3;
//     }
//   }, []);

//   // Head pose calculation
//   const calculateHeadPose = useCallback((landmarks: any) => {
//     try {
//       const nose = landmarks[1], leftEye = landmarks[33], rightEye = landmarks[362];
//       const leftMouth = landmarks[61], rightMouth = landmarks[291];
//       const eyeDist = Math.abs(rightEye.x - leftEye.x);
//       const yaw = ((nose.x - leftEye.x) - (rightEye.x - nose.x)) / eyeDist;
//       const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
//       const mouthCenter = { x: (leftMouth.x + rightMouth.x) / 2, y: (leftMouth.y + rightMouth.y) / 2 };
//       const pitch = (mouthCenter.y - eyeCenter.y) / eyeDist;
//       const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
//       return { yaw, pitch, roll };
//     } catch {
//       return { yaw: 0, pitch: 0, roll: 0 };
//     }
//   }, []);

//   const analyzeFocus = useCallback((headPose: { yaw: number; pitch: number; roll: number }) => {
//     const { yaw, pitch, roll } = headPose;
//     return Math.abs(yaw) > 0.3 || Math.abs(pitch) > 0.2 || Math.abs(roll) > 0.4;
//   }, []);

//   // Audio analysis
//   // const analyzeAudio = useCallback(() => {
//   //   if (!analyserRef.current) return 0;
//   //   const bufferLength = analyserRef.current.frequencyBinCount;
//   //   const dataArray = new Uint8Array(bufferLength);
//   //   analyserRef.current.getByteFrequencyData(dataArray);
//   //   return dataArray.reduce((sum, val) => sum + val, 0) / (bufferLength * 255);
//   // }, []);
//   const analyzeAudio = useCallback(() => {
//   if (!analyserRef.current) return 0;
//   const bufferLength = analyserRef.current.fftSize;
//   const dataArray = new Uint8Array(bufferLength);
//   // Use time-domain data and compute RMS (robust for presence detection)
//   analyserRef.current.getByteTimeDomainData(dataArray);

//   // Convert 8-bit PCM [0..255] to [-1..1] and compute RMS
//   let sumSquares = 0;
//   for (let i = 0; i < bufferLength; i++) {
//     const v = (dataArray[i] - 128) / 128; // center around 0
//     sumSquares += v * v;
//   }
//   const rms = Math.sqrt(sumSquares / bufferLength);
//   // rms is roughly 0..1 (quiet..loud). Optionally smooth it with last value.
//   return rms; 
// }, []);

// //helper to audio 
// const ensureAudioActive = useCallback(async () => {
//   if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
//     try {
//       await audioContextRef.current.resume();
//       console.log('AudioContext resumed from ensureAudioActive');
//     } catch (err) {
//       console.warn('Could not resume AudioContext:', err);
//     }
//   }
// }, []);




//   // Queue events
//   const queueEvent = useCallback((event: Omit<DetectionEvent, '_id' | 'candidateId' | 'sessionId'>) => {
//     eventQueueRef.current.push(event);
//   }, []);

//   const processEventQueue = useCallback(() => {
//     const events = [...eventQueueRef.current];
//     eventQueueRef.current = [];
//     events.forEach(event => onEvent(event));
//   }, [onEvent]);

//   // Detection loop
//   useEffect(() => {
//     if (!isActive || !videoRef.current || !models.faceModel || !models.objectModel || !models.landmarkModel) return;

//     const detect = async () => {
//       const video = videoRef.current;
//       if (!video || video.paused || video.ended || video.readyState < 2) return;

//       const currentTime = Date.now();
//       const newState = { ...detectionState };

//       try {
//         const faces = await models.faceModel!.estimateFaces(video, false);
//         const landmarksPred = await models.landmarkModel!.estimateFaces(video);

//         newState.isFaceDetected = faces.length > 0;
//         newState.faceCount = faces.length;
//         newState.lastFaceTime = newState.isFaceDetected ? currentTime : newState.lastFaceTime;

//         if (landmarksPred.length > 0) {
//           const landmarks = landmarksPred[0].keypoints;
//           const ear = calculateEAR(landmarks);
//           newState.eyeAspectRatio = ear;
//           newState.isDrowsy = ear < finalConfig.EYE_CLOSURE_THRESHOLD;

//           const headPose = calculateHeadPose(landmarks);
//           newState.headPose = headPose;
//           const isLookingAway = analyzeFocus(headPose);

//           if (isLookingAway && !detectionState.isLookingAway) newState.focusLostStart = currentTime;
//           else if (!isLookingAway && detectionState.isLookingAway && detectionState.focusLostStart) {
//             const duration = currentTime - detectionState.focusLostStart;
//             if (duration > finalConfig.FOCUS_THRESHOLD) {
//               queueEvent({
//                 type: 'focus_lost',
//                 timestamp: new Date(),
//                 duration,
//                 description: `Focus lost for ${Math.round(duration / 1000)}s (head pose deviation)`,
//                 severity: duration > finalConfig.FOCUS_THRESHOLD * 2 ? 'high' : 'medium',
//               });
//             }
//             delete newState.focusLostStart;
//           }

//           newState.isLookingAway = isLookingAway;
//         }

//         const audioLevel = analyzeAudio();
//         newState.audioLevel = audioLevel;
//         newState.backgroundVoiceDetected = audioLevel > finalConfig.AUDIO_THRESHOLD;

//         const objects = await models.objectModel!.detect(video);
//         newState.detectedObjects = objects.filter(o => o.score > finalConfig.CONFIDENCE_THRESHOLD).map(o => o.class);
//         newState.confidence = newState.detectedObjects.length > 0 ? Math.max(...objects.map(o => o.score)) : 0;

//         setDetectionState(newState);
//       } catch (error) {
//         console.error('Detection loop error:', error);
//       }
//     };

//     intervalRef.current = setInterval(detect, finalConfig.DETECTION_INTERVAL);
//     return () => clearInterval(intervalRef.current);
//   }, [isActive, videoRef, models, detectionState, calculateEAR, calculateHeadPose, analyzeFocus, analyzeAudio, finalConfig, queueEvent]);

//   useEffect(() => {
//     const qInterval = setInterval(processEventQueue, 1000);
//     return () => clearInterval(qInterval);
//   }, [processEventQueue]);

//   useEffect(() => {
//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);

//       if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
//         audioContextRef.current.close().catch(err => {
//           console.warn("AudioContext already closed:", err);
//         });
//       }

//       processEventQueue();
//     };
//   }, [processEventQueue]);

//   // return { detectionState, isModelLoaded: detectionState.isModelLoaded, config: finalConfig };
//   return { detectionState, isModelLoaded: detectionState.isModelLoaded, config: finalConfig, ensureAudioActive };

// };

// export default useAdvancedDetection;



import { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { DetectionState, DetectionEvent, DetectionConfig } from '../types';

// Default config
const DEFAULT_CONFIG: DetectionConfig = {
  FOCUS_THRESHOLD: parseInt(import.meta.env.VITE_FOCUS_THRESHOLD) || 5000,
  ABSENCE_THRESHOLD: parseInt(import.meta.env.VITE_ABSENCE_THRESHOLD) || 10000,
  DETECTION_INTERVAL: parseInt(import.meta.env.VITE_DETECTION_INTERVAL) || 300,
  CONFIDENCE_THRESHOLD: parseFloat(import.meta.env.VITE_CONFIDENCE_THRESHOLD) || 0.6,
  EYE_CLOSURE_THRESHOLD: 0.25,
  DROWSINESS_DURATION: 3000,
  // Lowered default audio threshold for real-world mic levels (quiet rooms)
  AUDIO_THRESHOLD: parseFloat(import.meta.env.VITE_AUDIO_THRESHOLD) || 0.005,
};

interface AdvancedDetectionState extends DetectionState {
  isDrowsy: boolean;
  eyeClosureStart?: number;
  eyeAspectRatio: number;
  audioLevel: number; // 0..1 (RMS)
  backgroundVoiceDetected: boolean;
  headPose: { yaw: number; pitch: number; roll: number };
  focusLostStart?: number;
}

const useAdvancedDetection = (
  videoRef: React.RefObject<HTMLVideoElement>,
  onEvent: (event: Omit<DetectionEvent, '_id' | 'candidateId' | 'sessionId'>) => void,
  isActive: boolean = true,
  config: Partial<DetectionConfig> = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [detectionState, setDetectionState] = useState<AdvancedDetectionState>({
    isFaceDetected: false,
    faceCount: 0,
    lastFaceTime: Date.now(),
    isLookingAway: false,
    detectedObjects: [],
    confidence: 0,
    isModelLoaded: false,
    isDrowsy: false,
    eyeAspectRatio: 0,
    audioLevel: 0,
    backgroundVoiceDetected: false,
    headPose: { yaw: 0, pitch: 0, roll: 0 },
  });

  const [models, setModels] = useState<{
    faceModel?: blazeface.BlazeFaceModel;
    objectModel?: cocoSsd.ObjectDetection;
    landmarkModel?: faceLandmarksDetection.FaceLandmarksDetector;
  }>({});

  const intervalRef = useRef<number | undefined>();
  const audioContextRef = useRef<AudioContext | undefined>();
  const analyserRef = useRef<AnalyserNode | undefined>();
  const microphoneRef = useRef<MediaStreamAudioSourceNode | undefined>();
  const eventQueueRef = useRef<Array<Omit<DetectionEvent, '_id' | 'candidateId' | 'sessionId'>>>([]);
  const lastAudioLevelRef = useRef<number>(0); // for smoothing (EMA)
  const audioInitializedRef = useRef<boolean>(false);

  // Improved initializeAudio with resume, reuse, and logs
  const initializeAudio = useCallback(async () => {
    try {
      if (audioInitializedRef.current) {
        // already initialized
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        console.warn('Web Audio API not supported in this browser.');
        return;
      }

      // Create context only once
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      // Create analyser only once
      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        // Config for time-domain RMS analysis
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.25;
        // min/max decibels are optional on some browsers
        try {
          analyserRef.current.minDecibels = -90;
          analyserRef.current.maxDecibels = -10;
        } catch (e) {
          /* ignore */
        }
      }

      // Create microphone source and connect (recreate if necessary)
      if (microphoneRef.current) {
        try {
          microphoneRef.current.disconnect();
        } catch (e) { /* ignore */ }
        microphoneRef.current = undefined;
      }
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      // Try to resume immediately; browsers often start suspended
      if (audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
          console.log('AudioContext resumed during initializeAudio');
        } catch (err) {
          console.warn('AudioContext resume failed during initializeAudio:', err);
        }
      }

      audioInitializedRef.current = true;
      console.log('Audio detection initialized (fftSize:', analyserRef.current.fftSize, ')');
    } catch (error) {
      console.warn('Audio detection initialization failed:', error);
    }
  }, []);

  // expose method to ensure audio resumed on user gesture
  const ensureAudioActive = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        console.log('AudioContext resumed from ensureAudioActive');
      } catch (err) {
        console.warn('Could not resume AudioContext:', err);
      }
    }
    // if not yet initialized, try to initialize (user gesture)
    if (!audioInitializedRef.current) {
      await initializeAudio();
    }
  }, [initializeAudio]);

  // Load AI models & initialize audio
  useEffect(() => {
    let cancelled = false;

    const loadModels = async () => {
      try {
        console.log('Loading AI models...');
        await tf.ready();
        // prefer webgl for performance if available
        try {
          await tf.setBackend('webgl');
        } catch (e) {
          console.warn('Failed to set tf backend to webgl, using default:', e);
        }

        const [faceModel, objectModel, landmarkModel] = await Promise.all([
          blazeface.load(),
          cocoSsd.load(),
          faceLandmarksDetection.createDetector(
            faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
            { runtime: 'tfjs', refineLandmarks: true, maxFaces: 2 }
          ),
        ]);

        if (cancelled) return;

        setModels({ faceModel, objectModel, landmarkModel });
        setDetectionState(prev => ({ ...prev, isModelLoaded: true }));
        // initialize audio (attempt). if user gesture needed, ensureAudioActive() can be called from component.
        await initializeAudio();
        console.log('Models loaded successfully');
      } catch (error) {
        console.error('Failed to load AI models:', error);
      }
    };

    loadModels();

    return () => {
      cancelled = true;
    };
  }, [initializeAudio]);

  // Utilities: EAR, head pose, focus analysis (unchanged logic; kept same behavior)
  const calculateEAR = useCallback((landmarks: any) => {
    try {
      const leftEye = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246].map(i => landmarks[i]);
      const rightEye = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398].map(i => landmarks[i]);
      const leftVert = Math.abs(leftEye[1].y - leftEye[5].y) + Math.abs(leftEye[2].y - leftEye[4].y);
      const rightVert = Math.abs(rightEye[1].y - rightEye[5].y) + Math.abs(rightEye[2].y - rightEye[4].y);
      const leftHor = Math.abs(leftEye[0].x - leftEye[3].x);
      const rightHor = Math.abs(rightEye[0].x - rightEye[3].x);
      return (leftVert / (2 * leftHor) + rightVert / (2 * rightHor)) / 2;
    } catch {
      return 0.3;
    }
  }, []);

  const calculateHeadPose = useCallback((landmarks: any) => {
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
  }, []);

  const analyzeFocus = useCallback((headPose: { yaw: number; pitch: number; roll: number }) => {
    const { yaw, pitch, roll } = headPose;
    return Math.abs(yaw) > 0.3 || Math.abs(pitch) > 0.2 || Math.abs(roll) > 0.4;
  }, []);

  // Audio analysis: RMS + EMA smoothing
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return 0;
    const fftSize = analyserRef.current.fftSize || 2048;
    const data = new Uint8Array(fftSize);
    try {
      analyserRef.current.getByteTimeDomainData(data);
    } catch (e) {
      // if analyser fails, return last known
      return lastAudioLevelRef.current;
    }

    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128; // normalize to [-1,1]
      sumSquares += v * v;
    }
    const rms = Math.sqrt(sumSquares / data.length); // in [0..1]
    // apply light exponential smoothing so we don't react to micro-spikes
    const alpha = 0.15;
    const smoothed = alpha * rms + (1 - alpha) * lastAudioLevelRef.current;
    lastAudioLevelRef.current = smoothed;
    return smoothed;
  }, []);

  // Queue events helper (keeps original design)
  const queueEvent = useCallback((event: Omit<DetectionEvent, '_id' | 'candidateId' | 'sessionId'>) => {
    eventQueueRef.current.push(event);
  }, []);

  const processEventQueue = useCallback(() => {
    const events = [...eventQueueRef.current];
    eventQueueRef.current = [];
    events.forEach(event => onEvent(event));
  }, [onEvent]);

  // Detection loop (uses functional state updates to avoid stale closures)
  useEffect(() => {
    if (!isActive || !videoRef.current || !models.faceModel || !models.objectModel || !models.landmarkModel) return;

    const detect = async () => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || video.readyState < 2) return;

      const currentTime = Date.now();

      try {
        const faces = await models.faceModel!.estimateFaces(video, false);
        const landmarksPred = await models.landmarkModel!.estimateFaces(video);

        // Compute values
        const isFaceDetected = faces.length > 0;
        const faceCount = faces.length;
        let newEyeAspectRatio = 0;
        let newIsDrowsy = false;
        let headPose = { yaw: 0, pitch: 0, roll: 0 };
        let isLookingAway = false;

        if (landmarksPred.length > 0) {
          const landmarks = landmarksPred[0].keypoints;
          const ear = calculateEAR(landmarks);
          newEyeAspectRatio = ear;
          newIsDrowsy = ear < finalConfig.EYE_CLOSURE_THRESHOLD;
          headPose = calculateHeadPose(landmarks);
          isLookingAway = analyzeFocus(headPose);
        }

        const audioLevel = analyzeAudio();
        const backgroundVoiceDetected = audioLevel > finalConfig.AUDIO_THRESHOLD;

        const objects = await models.objectModel!.detect(video);
        const filtered = objects.filter(o => o.score > finalConfig.CONFIDENCE_THRESHOLD);
        const detectedObjects = filtered.map(o => o.class);
        const confidence = filtered.length > 0 ? Math.max(...filtered.map(o => o.score)) : 0;

        // Functional state update to avoid stale closures
        setDetectionState(prev => {
          const newState: AdvancedDetectionState = {
            ...prev,
            isFaceDetected,
            faceCount,
            lastFaceTime: isFaceDetected ? currentTime : prev.lastFaceTime,
            eyeAspectRatio: newEyeAspectRatio,
            isDrowsy: newIsDrowsy,
            headPose,
            isLookingAway,
            audioLevel,
            backgroundVoiceDetected,
            detectedObjects,
            confidence,
          };

          // Focus lost handling (mirrors original logic)
          if (isLookingAway && !prev.isLookingAway) {
            newState.focusLostStart = currentTime;
          } else if (!isLookingAway && prev.isLookingAway && prev.focusLostStart) {
            const duration = currentTime - (prev.focusLostStart || currentTime);
            if (duration > finalConfig.FOCUS_THRESHOLD) {
              queueEvent({
                type: 'focus_lost',
                timestamp: new Date(),
                duration,
                description: `Focus lost for ${Math.round(duration / 1000)}s (head pose deviation)`,
                severity: duration > finalConfig.FOCUS_THRESHOLD * 2 ? 'high' : 'medium',
              });
            }
            delete newState.focusLostStart;
          }

          // Drowsiness event (queue)
          if (newIsDrowsy && !prev.isDrowsy) {
            // start timer? For now queue immediate event (keeping original behavior)
            queueEvent({
              type: 'drowsiness',
              timestamp: new Date(),
              description: 'Candidate appears drowsy',
              severity: 'high',
            });
          }

          // Background voice event (queue)
          if (backgroundVoiceDetected && !prev.backgroundVoiceDetected) {
            queueEvent({
              type: 'background_voice',
              timestamp: new Date(),
              description: 'Background voice detected',
              severity: 'medium',
            });
          }

          // Multiple faces detection
          if (faceCount > 1 && prev.faceCount <= 1) {
            queueEvent({
              type: 'multiple_faces',
              timestamp: new Date(),
              description: `${faceCount} faces detected`,
              severity: 'high',
            });
          }

          // Object detection events (queue any new objects that weren't in previous)
          const newObjects = detectedObjects.filter(o => !prev.detectedObjects.includes(o));
          newObjects.forEach(obj => {
            queueEvent({
              type: obj,
              timestamp: new Date(),
              description: `Detected object: ${obj}`,
              severity: 'high',
            });
          });

          return newState;
        });

      } catch (error) {
        console.error('Detection loop error:', error);
      }
    };

    // start interval (use window.setInterval to get numeric id)
    intervalRef.current = window.setInterval(detect, finalConfig.DETECTION_INTERVAL);
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
    // intentionally excluding analyzeAudio from deps to avoid re-creating interval too often
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, videoRef, models, calculateEAR, calculateHeadPose, analyzeFocus, finalConfig.DETECTION_INTERVAL, finalConfig.CONFIDENCE_THRESHOLD, finalConfig.FOCUS_THRESHOLD, finalConfig.EYE_CLOSURE_THRESHOLD, finalConfig.AUDIO_THRESHOLD, queueEvent]);

  // process queued events periodically (calls provided onEvent)
  useEffect(() => {
    const qInterval = window.setInterval(processEventQueue, 1000);
    return () => window.clearInterval(qInterval);
  }, [processEventQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }

      // disconnect microphone
      try {
        if (microphoneRef.current) {
          microphoneRef.current.disconnect();
        }
      } catch (e) { /* ignore */ }

      // close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(err => {
          console.warn('AudioContext close error:', err);
        });
      }

      // process any remaining events
      processEventQueue();
    };
  }, [processEventQueue]);

  return { detectionState, isModelLoaded: detectionState.isModelLoaded, config: finalConfig, ensureAudioActive };
};

export default useAdvancedDetection;
