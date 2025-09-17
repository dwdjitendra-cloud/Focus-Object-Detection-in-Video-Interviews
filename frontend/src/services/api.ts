import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import {
  Candidate,
  DetectionEvent,
  InterviewSession,
  ProctorReport,
  User,
  ApiResponse,
  PaginationParams,
  SystemStats,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Pick correct API base URL depending on environment
    const baseURL =
      import.meta.env.VITE_API_URL?.trim() ||
      (import.meta.env.MODE === 'development'
        ? 'http://localhost:5000/api'
        : 'https://focus-object-detection-in-video-cmky.onrender.com/api'); 

    this.api = axios.create({
      baseURL,
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
      headers: { 'Content-Type': 'application/json' },
    });

    // Attach token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Global response error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // --- Generic request helper ---
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api(config);
      return response.data.data!;
    } catch (error: any) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // --- Auth endpoints ---
  async login(email: string, password: string) {
    const response = await this.api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', { email, password });
    const { token, user } = response.data.data!;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  }

  async register(userData: { name: string; email: string; password: string; role?: string }) {
    const response = await this.api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', userData);
    const { token, user } = response.data.data!;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  }

  async getMe() {
    return this.request<User>({ method: 'GET', url: '/auth/me' });
  }

  async updateProfile(userData: { name: string; email: string }) {
    return this.request<User>({ method: 'PUT', url: '/auth/updatedetails', data: userData });
  }

  async updatePassword(passwords: { currentPassword: string; newPassword: string }) {
    const data = await this.request<{ token: string; user: User }>({
      method: 'PUT',
      url: '/auth/updatepassword',
      data: passwords,
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  // --- Candidate endpoints ---
  async getCandidates(params?: PaginationParams) {
    return this.request<Candidate[]>({ method: 'GET', url: '/candidates', params: params || {} });
  }

  async getCandidate(id: string) {
    return this.request<Candidate>({ method: 'GET', url: `/candidates/${id}` });
  }

  async createCandidate(candidate: Omit<Candidate, '_id'>) {
    return this.request<Candidate>({ method: 'POST', url: '/candidates', data: candidate });
  }

  async updateCandidate(id: string, candidate: Partial<Candidate>) {
    return this.request<Candidate>({ method: 'PUT', url: `/candidates/${id}`, data: candidate });
  }

  async deleteCandidate(id: string) {
    await this.api.delete(`/candidates/${id}`);
  }

  // --- Session endpoints ---
  async getSessions(params?: PaginationParams) {
    return this.request<InterviewSession[]>({ method: 'GET', url: '/sessions', params: params || {} });
  }

  async getSession(id: string) {
    return this.request<InterviewSession>({ method: 'GET', url: `/sessions/${id}` });
  }

  async createSession(session: Omit<InterviewSession, '_id'>) {
    return this.request<InterviewSession>({ method: 'POST', url: '/sessions', data: session });
  }

  async updateSession(id: string, session: Partial<InterviewSession>) {
    return this.request<InterviewSession>({ method: 'PUT', url: `/sessions/${id}`, data: session });
  }

  async endSession(id: string) {
    return this.request<InterviewSession>({ method: 'POST', url: `/sessions/${id}/end` });
  }

  async deleteSession(id: string) {
    await this.api.delete(`/sessions/${id}`);
  }

  // --- Event endpoints ---
  async getEvents(params?: PaginationParams & { sessionId?: string; candidateId?: string; type?: string; severity?: string }) {
    return this.request<DetectionEvent[]>({ method: 'GET', url: '/events', params: params || {} });
  }

  async getEvent(id: string) {
    return this.request<DetectionEvent>({ method: 'GET', url: `/events/${id}` });
  }

  async createEvent(event: Omit<DetectionEvent, '_id' | 'candidateId'>) {
    return this.request<DetectionEvent>({ method: 'POST', url: '/events', data: event });
  }

  async bulkCreateEvents(events: Array<Omit<DetectionEvent, '_id' | 'candidateId'>>) {
    return this.request<DetectionEvent[]>({ method: 'POST', url: '/events/bulk', data: { events } });
  }

  async updateEvent(id: string, event: Partial<DetectionEvent>) {
    return this.request<DetectionEvent>({ method: 'PUT', url: `/events/${id}`, data: event });
  }

  async deleteEvent(id: string) {
    await this.api.delete(`/events/${id}`);
  }

  async getEventsBySession(sessionId: string) {
    return this.request<DetectionEvent[]>({ method: 'GET', url: `/events/session/${sessionId}` });
  }

  // --- Reports ---
  async generateReport(sessionId: string) {
    return this.request<ProctorReport>({ method: 'GET', url: `/reports/${sessionId}` });
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async downloadPDFReport(sessionId: string) {
    const response = await this.api.get(`/reports/${sessionId}/pdf`, { responseType: 'blob' });
    this.downloadBlob(response.data, `report_${sessionId}.pdf`);
  }

  async downloadCSVReport(sessionId: string) {
    const response = await this.api.get(`/reports/${sessionId}/csv`, { responseType: 'blob' });
    this.downloadBlob(response.data, `report_${sessionId}.csv`);
  }

  async getReportStats() {
    return this.request<{
      totalSessions: number;
      avgIntegrityScore: number;
      commonViolations: Array<{ _id: string; count: number }>;
      scoreDistribution: Array<{ _id: string; count: number }>;
    }>({ method: 'GET', url: '/reports/stats' });
  }

  // --- System stats ---
  async getCandidateStats() {
    return this.request<SystemStats['candidates']>({ method: 'GET', url: '/candidates/stats' });
  }

  async getSessionStats() {
    return this.request<SystemStats['sessions']>({ method: 'GET', url: '/sessions/stats' });
  }

  async getEventStats(sessionId?: string) {
    return this.request<SystemStats['events']>({
      method: 'GET',
      url: '/events/stats',
      params: sessionId ? { sessionId } : {},
    });
  }

  // --- Health check ---
  async healthCheck() {
    try {
      const healthUrl = this.api.defaults.baseURL!.replace('/api', '/health');
      const response = await axios.get<ApiResponse<{ status: string; timestamp: string; uptime: number }>>(healthUrl);
      return response.data.data!;
    } catch (error: any) {
      console.error('API Error (Health Check):', error.response?.data || error.message);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService;