// import React, { useRef, useState, useCallback, useEffect } from 'react';
// import Webcam from 'react-webcam';
// import { 
//   Eye, EyeOff, Users, Smartphone, BookOpen, AlertTriangle, 
//   Play, Square, CameraOff, Settings, Maximize2, Volume2, VolumeX, Moon, Sun 
// } from 'lucide-react';
// import useAdvancedDetection from '../hooks/useAdvancedDetection'; // ✅ default import now
// import { DetectionEvent } from '../types';

// interface VideoMonitorProps {
//   candidateId: string;
//   sessionId: string;
//   onEvent: (event: Omit<DetectionEvent, '_id' | 'candidateId' | 'sessionId'>) => void;
//   isRecording: boolean;
//   onToggleRecording: () => void;
//   candidateName?: string;
// }

// export const VideoMonitor: React.FC<VideoMonitorProps> = ({
//   candidateId,
//   sessionId,
//   onEvent,
//   isRecording,
//   onToggleRecording,
//   candidateName = 'Candidate'
// }) => {
//   const webcamRef = useRef<Webcam>(null);
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [cameraError, setCameraError] = useState<string | null>(null);

//   const { detectionState, isModelLoaded } = useAdvancedDetection(
//     videoRef,
//     (eventData) => handleDetectionEvent(eventData),
//     isRecording
//   );

//   const lastEventRef = useRef<{ [key: string]: number }>({});

//   const handleDetectionEvent = useCallback(
//     (event: Omit<DetectionEvent, '_id' | 'candidateId' | 'sessionId'>) => {
//       const now = Date.now();
//       const lastTime = lastEventRef.current[event.type] || 0;

//       if (now - lastTime > 3000) { // throttle every 3 seconds per event type
//         onEvent(event);
//         lastEventRef.current[event.type] = now;
//       }
//     },
//     [onEvent]
//   );

//   useEffect(() => {
//     if (webcamRef.current?.video) {
//       videoRef.current = webcamRef.current.video;
//     }
//   }, [webcamRef.current?.video]);

//   const handleCameraError = useCallback((error: string | DOMException) => {
//     console.error('Camera error:', error);
//     setCameraError(typeof error === 'string' ? error : error.message);
//   }, []);

//   const toggleFullscreen = useCallback(() => setIsFullscreen(!isFullscreen), [isFullscreen]);

//   // Automatically trigger events for detected issues
//   useEffect(() => {
//     if (!isRecording) return;

//     if (!detectionState.isFaceDetected) {
//       handleDetectionEvent({
//         type: 'no_face',
//         description: 'No face detected',
//         severity: 'high',
//         timestamp: new Date().toISOString()
//       });
//     }

//     if (detectionState.isLookingAway) {
//       handleDetectionEvent({
//         type: 'focus_lost',
//         description: 'Candidate looking away',
//         severity: 'medium',
//         timestamp: new Date().toISOString()
//       });
//     }

//     if ('isDrowsy' in detectionState && detectionState.isDrowsy) {
//       handleDetectionEvent({
//         type: 'drowsiness',
//         description: 'Candidate appears drowsy',
//         severity: 'high',
//         timestamp: new Date().toISOString()
//       });
//     }

//     if ('backgroundVoiceDetected' in detectionState && detectionState.backgroundVoiceDetected) {
//       handleDetectionEvent({
//         type: 'background_voice',
//         description: 'Background voice detected',
//         severity: 'medium',
//         timestamp: new Date().toISOString()
//       });
//     }

//     detectionState.detectedObjects.forEach(obj => {
//       handleDetectionEvent({
//         type: obj,
//         description: `Detected object: ${obj}`,
//         severity: 'high',
//         timestamp: new Date().toISOString()
//       });
//     });

//     if (detectionState.faceCount > 1) {
//       handleDetectionEvent({
//         type: 'multiple_faces',
//         description: `${detectionState.faceCount} faces detected`,
//         severity: 'high',
//         timestamp: new Date().toISOString()
//       });
//     }

//   }, [detectionState, isRecording, handleDetectionEvent]);

//   const getStatusColor = (detected: boolean, severity?: 'low' | 'medium' | 'high' | 'critical') => {
//     if (!detected) return 'bg-green-100 text-green-800 border-green-200';
//     switch (severity) {
//       case 'critical':
//       case 'high': return 'bg-red-100 text-red-800 border-red-200';
//       case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
//       default: return 'bg-blue-100 text-blue-800 border-blue-200';
//     }
//   };

//   const getOverallStatus = () => {
//     if (!isModelLoaded || !isRecording) return 'inactive';
//     if (!detectionState.isFaceDetected || detectionState.detectedObjects.length > 0 || detectionState.faceCount > 1 || ('isDrowsy' in detectionState && detectionState.isDrowsy)) {
//       return 'violation';
//     }
//     if (detectionState.isLookingAway || ('backgroundVoiceDetected' in detectionState && detectionState.backgroundVoiceDetected)) {
//       return 'warning';
//     }
//     return 'normal';
//   };

//   const overallStatus = getOverallStatus();

//   return (
//     <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
//       {/* Header */}
//       <div className={`bg-gradient-to-r px-6 py-4 ${
//         overallStatus === 'violation' ? 'from-red-600 to-red-700' :
//         overallStatus === 'warning' ? 'from-yellow-600 to-yellow-700' :
//         overallStatus === 'normal' ? 'from-green-600 to-green-700' : 'from-gray-600 to-gray-700'
//       }`}>
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-xl font-semibold text-white">Live Video Monitor</h2>
//             <p className="text-blue-100 text-sm">{candidateName} • {overallStatus.toUpperCase()}</p>
//           </div>
//           <div className="flex items-center gap-3">
//             <button onClick={toggleFullscreen} className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
//               <Maximize2 className="w-4 h-4" />
//             </button>
//             <button onClick={onToggleRecording} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' : 'bg-white hover:bg-gray-50 text-blue-600 shadow-md'}`}>
//               {isRecording ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
//               {isRecording ? 'Stop' : 'Start'} Monitoring
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="flex">
//         {/* Video Feed */}
//         <div className="flex-1 p-6">
//           <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video shadow-inner">
//             {cameraError ? (
//               <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
//                 <div className="text-center">
//                   <CameraOff className="w-16 h-16 mx-auto mb-4 text-gray-400" />
//                   <h3 className="text-lg font-medium mb-2">Camera Error</h3>
//                   <p className="text-gray-300 text-sm">{cameraError}</p>
//                   <button onClick={() => setCameraError(null)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Retry</button>
//                 </div>
//               </div>
//             ) : (
//               <Webcam ref={webcamRef} audio={false} width="100%" height="100%" screenshotFormat="image/jpeg" videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }} onUserMediaError={handleCameraError} className="w-full h-full object-cover" />
//             )}

//             {isRecording && <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg"><div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>REC</div>}
//           </div>
//         </div>

//         {/* Detection Status Panel */}
//         <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 space-y-3">
//           <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(detectionState.isFaceDetected)}`}>
//             <Eye className="w-5 h-5 flex-shrink-0" />
//             <div className="flex-1"><div className="font-medium">Face Detection</div><div className="text-sm">{detectionState.isFaceDetected ? `${detectionState.faceCount} face(s) detected` : 'No face detected'}</div></div>
//           </div>

//           <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(detectionState.isLookingAway, 'medium')}`}>
//             {detectionState.isLookingAway ? <EyeOff className="w-5 h-5 flex-shrink-0" /> : <Eye className="w-5 h-5 flex-shrink-0" />}
//             <div className="flex-1"><div className="font-medium">Focus Status</div><div className="text-sm">{detectionState.isLookingAway ? 'Looking away detected' : 'Maintaining focus'}</div></div>
//           </div>

//           {detectionState.detectedObjects.length > 0 && (
//             <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(true, 'high')}`}>
//               <AlertTriangle className="w-5 h-5 flex-shrink-0" />
//               <div className="flex-1">
//                 <div className="font-medium">Object Detection</div>
//                 <div className="text-sm">Detected: {detectionState.detectedObjects.join(', ')}</div>
//               </div>
//             </div>
//           )}

//           {'isDrowsy' in detectionState && detectionState.isDrowsy && (
//             <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(true, 'high')}`}>
//               <Moon className="w-5 h-5 flex-shrink-0" />
//               <div className="flex-1">
//                 <div className="font-medium">Drowsiness Detection</div>
//                 <div className="text-sm">Drowsiness detected</div>
//               </div>
//             </div>

//           )}
//         {/* Audio Detection */}
//                   {'audioLevel' in detectionState && (
//                     <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
//                       getStatusColor('backgroundVoiceDetected' in detectionState && detectionState.backgroundVoiceDetected, 'medium')
//                     }`}>
//                       {'backgroundVoiceDetected' in detectionState && detectionState.backgroundVoiceDetected ? 
//                         <Volume2 className="w-5 h-5 flex-shrink-0" /> : 
//                         <VolumeX className="w-5 h-5 flex-shrink-0" />
//                       }
//                       <div className="flex-1">
//                         <div className="font-medium">Audio Detection</div>
//                         <div className="text-sm">
//                           {'backgroundVoiceDetected' in detectionState && detectionState.backgroundVoiceDetected ? 
//                             'Background voice detected' : 
//                             'No background voices'
//                           }
//                           <span className="ml-2 text-xs">
//                             (Level: {Math.round(detectionState.audioLevel * 100)}%)
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//           {detectionState.faceCount > 1 && (
//             <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(true, 'high')}`}>
//               <Users className="w-5 h-5 flex-shrink-0" />
//               <div className="flex-1">
//                 <div className="font-medium">Multiple Faces</div>
//                 <div className="text-sm">{detectionState.faceCount} faces detected</div>
//               </div>
//             </div>
//           )}

//           {!isModelLoaded && (
//             <div className="flex items-center gap-3 p-3 rounded-lg border bg-yellow-100 text-yellow-800 border-yellow-200">
//               <Settings className="w-5 h-5 flex-shrink-0" />
//               <div className="flex-1">
//                 <div className="font-medium">Loading Models</div>
//                 <div className="text-sm">Please wait, loading detection models...</div>
//               </div>
//             </div>
//           )}

//           {!isRecording && (
//             <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-100 text-gray-800 border-gray-200">
//               <Settings className="w-5 h-5 flex-shrink-0" />
//               <div className="flex-1"></div>
//                 <div className="font-medium">Monitoring Inactive</div>
//                 <div className="text-sm">Click "Start Monitoring" to begin</div>
//         </div>
//           )}


//  {/* Confidence Score */}
//             {detectionState.confidence > 0 && (
//               <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
//                 <div className="font-medium text-blue-900">Detection Confidence</div>
//                 <div className="text-sm text-blue-700">
//                   {Math.round(detectionState.confidence * 100)}%
//                 </div>
//                 <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
//                   <div 
//                     className="bg-blue-600 h-2 rounded-full transition-all duration-300"
//                     style={{ width: `${detectionState.confidence * 100}%` }}
//                   ></div>
//                 </div>
//               </div>
//             )}




//     {/* Head Pose Information */}
//             {'headPose' in detectionState && (
//               <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
//                 <div className="font-medium text-indigo-900">Head Pose Analysis</div>
//                 <div className="text-sm text-indigo-700 space-y-1">
//                   <div>Yaw: {detectionState.headPose.yaw.toFixed(2)}</div>
//                   <div>Pitch: {detectionState.headPose.pitch.toFixed(2)}</div>
//                   <div>Roll: {detectionState.headPose.roll.toFixed(2)}</div>
//                 </div>
//               </div>
//             )}
        














          
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VideoMonitor;




import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { 
  Eye, EyeOff, Users, Smartphone, BookOpen, AlertTriangle, 
  Play, Square, CameraOff, Settings, Maximize2, Volume2, VolumeX, Moon, Sun 
} from 'lucide-react';
import useAdvancedDetection from '../hooks/useAdvancedDetection'; // ✅ default import now
import { DetectionEvent } from '../types';

interface VideoMonitorProps {
  candidateId: string;
  sessionId: string;
  onEvent: (event: Omit<DetectionEvent, '_id' | 'candidateId' | 'sessionId'>) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  candidateName?: string;
}

export const VideoMonitor: React.FC<VideoMonitorProps> = ({
  candidateId,
  sessionId,
  onEvent,
  isRecording,
  onToggleRecording,
  candidateName = 'Candidate'
}) => {
  const webcamRef = useRef<Webcam>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const lastEventRef = useRef<{ [key: string]: number }>({});

  const handleDetectionEvent = useCallback(
    (event: Omit<DetectionEvent, '_id' | 'candidateId' | 'sessionId'>) => {
      const now = Date.now();
      const lastTime = lastEventRef.current[event.type] || 0;

      if (now - lastTime > 3000) { // throttle every 3 seconds per event type
        onEvent(event);
        lastEventRef.current[event.type] = now;
      }
    },
    [onEvent]
  );

  // ✅ Correct hook usage (inside component)
  const { detectionState, isModelLoaded, ensureAudioActive } = useAdvancedDetection(
    videoRef,
    handleDetectionEvent,
    isRecording
  );

  const handleStartStop = useCallback(async () => {
    if (!isRecording) {
      // starting — ensure audio is resumed (user gesture)
      await ensureAudioActive?.();
    }
    onToggleRecording();
  }, [isRecording, ensureAudioActive, onToggleRecording]);

  useEffect(() => {
    if (webcamRef.current?.video) {
      videoRef.current = webcamRef.current.video;
    }
  }, [webcamRef.current?.video]);

  const handleCameraError = useCallback((error: string | DOMException) => {
    console.error('Camera error:', error);
    setCameraError(typeof error === 'string' ? error : error.message);
  }, []);

  const toggleFullscreen = useCallback(() => setIsFullscreen(!isFullscreen), [isFullscreen]);

  // Automatically trigger events for detected issues
  useEffect(() => {
    if (!isRecording) return;

    if (!detectionState.isFaceDetected) {
      handleDetectionEvent({
        type: 'no_face',
        description: 'No face detected',
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    }

    if (detectionState.isLookingAway) {
      handleDetectionEvent({
        type: 'focus_lost',
        description: 'Candidate looking away',
        severity: 'medium',
        timestamp: new Date().toISOString()
      });
    }

    if ('isDrowsy' in detectionState && detectionState.isDrowsy) {
      handleDetectionEvent({
        type: 'drowsiness',
        description: 'Candidate appears drowsy',
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    }

    if ('backgroundVoiceDetected' in detectionState && detectionState.backgroundVoiceDetected) {
      handleDetectionEvent({
        type: 'background_voice',
        description: 'Background voice detected',
        severity: 'medium',
        timestamp: new Date().toISOString()
      });
    }

    detectionState.detectedObjects.forEach(obj => {
      handleDetectionEvent({
        type: obj,
        description: `Detected object: ${obj}`,
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    });

    if (detectionState.faceCount > 1) {
      handleDetectionEvent({
        type: 'multiple_faces',
        description: `${detectionState.faceCount} faces detected`,
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    }

  }, [detectionState, isRecording, handleDetectionEvent]);

  const getStatusColor = (detected: boolean, severity?: 'low' | 'medium' | 'high' | 'critical') => {
    if (!detected) return 'bg-green-100 text-green-800 border-green-200';
    switch (severity) {
      case 'critical':
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getOverallStatus = () => {
    if (!isModelLoaded || !isRecording) return 'inactive';
    if (!detectionState.isFaceDetected || detectionState.detectedObjects.length > 0 || detectionState.faceCount > 1 || ('isDrowsy' in detectionState && detectionState.isDrowsy)) {
      return 'violation';
    }
    if (detectionState.isLookingAway || ('backgroundVoiceDetected' in detectionState && detectionState.backgroundVoiceDetected)) {
      return 'warning';
    }
    return 'normal';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Header */}
      <div className={`bg-gradient-to-r px-6 py-4 ${
        overallStatus === 'violation' ? 'from-red-600 to-red-700' :
        overallStatus === 'warning' ? 'from-yellow-600 to-yellow-700' :
        overallStatus === 'normal' ? 'from-green-600 to-green-700' : 'from-gray-600 to-gray-700'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Live Video Monitor</h2>
            <p className="text-blue-100 text-sm">{candidateName} • {overallStatus.toUpperCase()}</p>
              {!isModelLoaded && (
              <div className="flex items-center gap-2 text-yellow-200 text-sm">
                <div className="w-4 h-4 border-2 border-yellow-200 border-t-transparent rounded-full animate-spin"></div>
                Loading AI...
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleFullscreen} className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={handleStartStop} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' : 'bg-white hover:bg-gray-50 text-blue-600 shadow-md'}`}>
              {isRecording ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRecording ? 'Stop' : 'Start'} Monitoring
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Video Feed */}
        <div className="flex-1 p-6">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video shadow-inner">
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
                <div className="text-center">
                  <CameraOff className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Camera Error</h3>
                  <p className="text-gray-300 text-sm">{cameraError}</p>
                  <button onClick={() => setCameraError(null)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Retry</button>
                </div>
              </div>
            ) : (
              <Webcam 
                ref={webcamRef}
                audio={false}
                width="100%"
                height="100%"
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
                onUserMediaError={handleCameraError}
                className="w-full h-full object-cover"
              />
            )}

            {isRecording && <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg"><div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>REC</div>}


                    {/* Face detection overlay */}
                               {detectionState.isFaceDetected && isRecording && (
                                 <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium shadow-lg ${
                                   detectionState.faceCount === 1 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                 }`}>
                                   {detectionState.faceCount === 1 ? 'Face Detected' : `${detectionState.faceCount} Faces`}
                                 </div>
                               )}
                   
                               {/* Focus indicator */}
                               {isRecording && (
                                 <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-sm font-medium shadow-lg ${
                                   detectionState.isLookingAway ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                                 }`}>
                                   {detectionState.isLookingAway ? 'Looking Away' : 'Focused'}
                                 </div>
                               )}
                   
                               {/* Drowsiness indicator */}
                               {'isDrowsy' in detectionState && detectionState.isDrowsy && (
                                 <div className="absolute top-4 left-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg animate-pulse">
                                   <Moon className="w-4 h-4 inline mr-1" />
                                   Drowsiness Detected
                                 </div>
                               )}
                   
                               {/* Audio indicator */}
                               {'backgroundVoiceDetected' in detectionState && detectionState.backgroundVoiceDetected && (
                                 <div className="absolute bottom-4 center-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                                   <Volume2 className="w-4 h-4 inline mr-1" />
                                   Background Voice
                                 </div>
                               )}
                   
                               {/* Object detection alerts */}
                               {detectionState.detectedObjects.length > 0 && (
                                 <div className="absolute bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                                   Objects: {detectionState.detectedObjects.join(', ')}
                                 </div>
                               )}



          </div>
        </div>

        {/* Detection Status Panel */}
        <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 space-y-3">
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(detectionState.isFaceDetected)}`}>
            <Eye className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium">Face Detection</div>
              <div className="text-sm">
                {detectionState.isFaceDetected ? `${detectionState.faceCount} face(s) detected` : 'No face detected'}
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(detectionState.isLookingAway, 'medium')}`}>
            {detectionState.isLookingAway ? <EyeOff className="w-5 h-5 flex-shrink-0" /> : <Eye className="w-5 h-5 flex-shrink-0" />}
            <div className="flex-1">
              <div className="font-medium">Focus Status</div>
              <div className="text-sm">{detectionState.isLookingAway ? 'Looking away detected' : 'Maintaining focus'}</div>
            </div>
          </div>

          {detectionState.detectedObjects.length > 0 && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(true, 'high')}`}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">Object Detection</div>
                <div className="text-sm">Detected: {detectionState.detectedObjects.join(', ')}</div>
              </div>
            </div>
          )}

          {'isDrowsy' in detectionState && detectionState.isDrowsy && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(true, 'high')}`}>
              <Moon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">Drowsiness Detection</div>
                <div className="text-sm">Drowsiness detected</div>
              </div>
            </div>
          )}

          {/* Audio Detection */}
          {'audioLevel' in detectionState && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
              getStatusColor('backgroundVoiceDetected' in detectionState && detectionState.backgroundVoiceDetected, 'medium')
            }`}>
              {'backgroundVoiceDetected' in detectionState && detectionState.backgroundVoiceDetected ? 
                <Volume2 className="w-5 h-5 flex-shrink-0" /> : 
                <VolumeX className="w-5 h-5 flex-shrink-0" />
              }
              <div className="flex-1">
                <div className="font-medium">Audio Detection</div>
                <div className="text-sm">
                  {'backgroundVoiceDetected' in detectionState && detectionState.backgroundVoiceDetected ? 
                    'Background voice detected' : 
                    'No background voices'
                  }
                  <span className="ml-2 text-xs">
                    (Level: {Math.round(detectionState.audioLevel * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {detectionState.faceCount > 1 && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(true, 'high')}`}>
              <Users className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">Multiple Faces</div>
                <div className="text-sm">{detectionState.faceCount} faces detected</div>
              </div>
            </div>
          )}

          {!isModelLoaded && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-yellow-100 text-yellow-800 border-yellow-200">
              <Settings className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">Loading Models</div>
                <div className="text-sm">Please wait, loading detection models...</div>
              </div>
            </div>
          )}

          {!isRecording && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-100 text-gray-800 border-gray-200">
              <Settings className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-medium">Monitoring Inactive</div>
                <div className="text-sm">Click "Start Monitoring" to begin</div>
              </div>
            </div>
          )}

          {/* Confidence Score */}
          {detectionState.confidence > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-medium text-blue-900">Detection Confidence</div>
              <div className="text-sm text-blue-700">
                {Math.round(detectionState.confidence * 100)}%
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${detectionState.confidence * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Head Pose Information */}
          {'headPose' in detectionState && (
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="font-medium text-indigo-900">Head Pose Analysis</div>
              <div className="text-sm text-indigo-700 space-y-1">
                <div>Yaw: {detectionState.headPose.yaw.toFixed(2)}</div>
                <div>Pitch: {detectionState.headPose.pitch.toFixed(2)}</div>
                <div>Roll: {detectionState.headPose.roll.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoMonitor;
