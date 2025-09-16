const request = require('supertest');
const app = require('../src/server');
const InterviewSession = require('../src/models/InterviewSession');
const Candidate = require('../src/models/Candidate');

describe('Session Routes', () => {
  let candidateId;

  beforeEach(async () => {
    await InterviewSession.deleteMany({});
    await Candidate.deleteMany({});

    const candidate = await Candidate.create({
      name: 'Test Candidate',
      email: 'test@example.com',
      position: 'Test Position',
      interviewDate: new Date(),
      duration: 60
    });

    candidateId = candidate._id;
  });

  describe('POST /api/sessions', () => {
    it('should create a new interview session', async () => {
      const sessionData = {
        candidateId: candidateId,
        startTime: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.candidateId._id).toBe(candidateId.toString());
      expect(response.body.data.status).toBe('active');
    });

    it('should return error for invalid candidate ID', async () => {
      const sessionData = {
        candidateId: '507f1f77bcf86cd799439011',
        startTime: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(sessionData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/sessions', () => {
    it('should get all sessions', async () => {
      await InterviewSession.create({
        candidateId: candidateId,
        startTime: new Date(),
        status: 'active'
      });

      const response = await request(app)
        .get('/api/sessions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/sessions/:id/end', () => {
    it('should end an active session', async () => {
      const session = await InterviewSession.create({
        candidateId: candidateId,
        startTime: new Date(),
        status: 'active'
      });

      const response = await request(app)
        .post(`/api/sessions/${session._id}/end`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.integrityScore).toBeDefined();
    });
  });
});