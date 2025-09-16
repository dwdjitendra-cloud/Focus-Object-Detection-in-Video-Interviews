export interface Candidate {
  _id?: string;
  name: string;
  email: string;
  position: string;
  interviewDate: string;
  duration: number; // in minutes
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DetectionEvent {
  _id?: string;
  sessionId: string;
  candidateId: string;
  type: 'focus_lost' | 'no_face' | 'multiple_faces' | 'phone' | 'book' | 'notes' | 'device' | 'unauthorized_person' | 'suspicious_behavior' | 'drowsiness' | 'background_voice';
  timestamp: Date;
  duration?: number; // for focus events in milliseconds
  confidence?: number; // for object detection (0-1)
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  additionalData?: any;
  resolved?: boolean;
  resolvedAt?: Date;
  createdAt?: string;
  updatedAt?: string;
}

export interface InterviewSession {
  _id?: string;
  candidateId: string | Candidate;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'terminated' | 'paused';
  actualDuration?: number; // in minutes
  integrityScore?: number;
  totalEvents?: number;
  focusViolations?: number;
  objectViolations?: number;
  multiplePersonViolations?: number;
  sessionNotes?: string;
  recordingPath?: string;
  metadata?: {
    browserInfo?: string;
    deviceInfo?: string;
    networkInfo?: string;
    cameraResolution?: string;
  };
  events?: DetectionEvent[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProctorReport {
  candidate: {
    id: string;
    name: string;
    email: string;
    position: string;
    interviewDate: Date;
    duration: number;
  };
  session: {
    id: string;
    startTime: Date;
    endTime?: Date;
    status: string;
    actualDuration: number;
  };
  summary: {
    totalEvents: number;
    focusViolations: number;
    objectViolations: number;
    multiplePersonViolations: number;
    integrityScore: number;
    duration: number;
  };
  analytics: {
    eventDistribution: Record<string, number>;
    severityDistribution: Record<string, number>;
    averageConfidence: number;
  };
  timeline: DetectionEvent[];
  recommendations: Array<{
    type: 'success' | 'caution' | 'warning' | 'critical' | 'attention' | 'security' | 'identity';
    message: string;
  }>;
}

export interface DetectionState {
  isFaceDetected: boolean;
  faceCount: number;
  lastFaceTime: number;
  focusLostStart?: number;
  isLookingAway: boolean;
  detectedObjects: string[];
  confidence: number;
  isModelLoaded: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'interviewer' | 'hr';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface DetectionConfig {
  FOCUS_THRESHOLD: number;
  ABSENCE_THRESHOLD: number;
  DETECTION_INTERVAL: number;
  CONFIDENCE_THRESHOLD: number;
  EYE_CLOSURE_THRESHOLD: number;
  DROWSINESS_DURATION: number;
  AUDIO_THRESHOLD: number;
}

export interface SystemStats {
  candidates: {
    total: number;
    recent: number;
    byStatus: Array<{ _id: string; count: number }>;
  };
  sessions: {
    total: number;
    active: number;
    completed: number;
    avgIntegrityScore: number;
    byStatus: Array<{ _id: string; count: number; avgIntegrityScore: number; avgDuration: number }>;
  };
  events: {
    total: number;
    recent: number;
    byType: Array<{ _id: string; count: number; avgConfidence: number }>;
    bySeverity: Array<{ _id: string; count: number }>;
    overTime: Array<{ _id: string; count: number }>;
  };
}