import React, { useState, useCallback, useEffect } from 'react';
import { CandidateSetup } from './components/CandidateSetup';
import { VideoMonitor } from './components/VideoMonitor';
import { Candidate, DetectionEvent, InterviewSession } from './types';
import { apiService } from './services/api';
import { 
  FileText, Play, Square, BarChart3, AlertTriangle, 
  CheckCircle, Clock, Eye 
} from 'lucide-react';

type AppState = 'setup' | 'monitoring' | 'report';

function App() {
  const [appState, setAppState] = useState<AppState>('setup');
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentSession && appState === 'monitoring') {
      interval = setInterval(() => {
        const startTime = new Date(currentSession.startTime).getTime();
        const now = Date.now();
        setSessionDuration(Math.floor((now - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession, appState]);

  // Start Interview
  const handleStartInterview = async (candidate: Candidate) => {
    setIsLoading(true);
    setError(null);

    try {
      const createdCandidate = await apiService.createCandidate(candidate);

      const sessionData: Omit<InterviewSession, '_id'> = {
        candidateId: createdCandidate._id!,
        startTime: new Date(),
        status: 'active',
      };

      const createdSession = await apiService.createSession(sessionData);

      setCurrentCandidate(createdCandidate);
      setCurrentSession(createdSession);
      setAppState('monitoring');
      setEvents([]);
      setSessionDuration(0);
    } catch (err: any) {
      console.error('Failed to start interview:', err);
      setError(err.response?.data?.message || 'Failed to start interview session');
    } finally {
      setIsLoading(false);
    }
  };

  // Log detection event
  const handleDetectionEvent = useCallback(
    async (eventData: Omit<DetectionEvent, '_id' | 'candidateId' | 'sessionId'>) => {
      if (!currentSession || !currentCandidate) return;

      try {
        const event = await apiService.createEvent({
          ...eventData,
          sessionId: currentSession._id!,
        });
      
        setEvents(prev => [event, ...prev]);
      } catch (err) {
        console.error('Failed to log event:', err);
      }
    },
    [currentSession, currentCandidate]
  );

  // Toggle recording
  const handleToggleRecording = () => setIsRecording(prev => !prev);

  // End interview
  const handleEndInterview = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      await apiService.endSession(currentSession._id!);
      await apiService.downloadPDFReport(currentSession._id!);
      handleNewInterview();
    } catch (err: any) {
      console.error('Failed to end interview:', err);
      setError(err.response?.data?.message || 'Failed to end interview session');
    } finally {
      setIsLoading(false);
    }
  };

  // View report
  const handleViewReport = async () => {
    if (!currentSession) return;

    try {
      await apiService.downloadPDFReport(currentSession._id!);
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      setError(err.response?.data?.message || 'Failed to generate report');
    }
  };

  // Reset for new interview
  const handleNewInterview = () => {
    setAppState('setup');
    setCurrentCandidate(null);
    setCurrentSession(null);
    setEvents([]);
    setIsRecording(false);
    setSessionDuration(0);
    setError(null);
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Session stats
  const getSessionStats = () => {
    const focusEvents = events.filter(e => ['focus_lost', 'no_face'].includes(e.type));
    const objectEvents = events.filter(e => ['phone', 'book', 'notes', 'device'].includes(e.type));
    const highSeverityEvents = events.filter(e => e.severity === 'high');
    return {
      total: events.length,
      focus: focusEvents.length,
      objects: objectEvents.length,
      highSeverity: highSeverityEvents.length,
    };
  };

  const stats = getSessionStats();

  // Render
  if (appState === 'setup') {
    return (
      <div>
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}
        <CandidateSetup onStart={handleStartInterview} isLoading={isLoading} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-white hover:text-gray-200">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Video Proctoring System</h1>
            {currentCandidate && (
              <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-600">
                  <span className="font-medium">{currentCandidate.name}</span> • {currentCandidate.position}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" /> {formatDuration(sessionDuration)}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="text-gray-600">{isRecording ? 'Recording' : 'Not Recording'}</span>
            </div>
            <button
              onClick={handleViewReport}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <BarChart3 className="w-4 h-4" /> View Report
            </button>
            <button
              onClick={handleEndInterview}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              End Interview
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <VideoMonitor
            candidateId={currentCandidate?._id || ''}
            sessionId={currentSession?._id || ''}
            onEvent={handleDetectionEvent}
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            candidateName={currentCandidate?.name}
          />
        </div>

        {/* Stats & Recent Events */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Total Events</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.total}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Focus Issues</span>
                </div>
                <span className="font-semibold text-yellow-600">{stats.focus}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-600">Object Violations</span>
                </div>
                <span className="font-semibold text-red-600">{stats.objects}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-600">High Severity</span>
                </div>
                <span className="font-semibold text-purple-600">{stats.highSeverity}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No violations detected</p>
                </div>
              ) : (
                // ✅ FIX 2: Display the first 5 events (which are the newest)
                events.slice(0, 5).map((event, index) => (
                  <div
                    key={event._id || index}
                    className={`p-3 rounded-lg border-l-4 ${
                      event.severity === 'high' ? 'border-red-500 bg-red-50' :
                      event.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">
                          {event.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.severity === 'high' ? 'bg-red-100 text-red-800' :
                        event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {event.severity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;