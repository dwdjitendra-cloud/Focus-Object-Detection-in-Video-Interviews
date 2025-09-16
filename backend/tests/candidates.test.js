const request = require('supertest');
const app = require('../src/server');
const Candidate = require('../src/models/Candidate');

describe('Candidate Routes', () => {
  beforeEach(async () => {
    await Candidate.deleteMany({});
  });

  describe('POST /api/candidates', () => {
    it('should create a new candidate', async () => {
      const candidateData = {
        name: 'John Doe',
        email: 'john@example.com',
        position: 'Software Engineer',
        interviewDate: new Date().toISOString(),
        duration: 60
      };

      const response = await request(app)
        .post('/api/candidates')
        .send(candidateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(candidateData.name);
      expect(response.body.data.email).toBe(candidateData.email);
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        name: 'J',
        email: 'invalid-email',
        position: '',
        duration: 400
      };

      const response = await request(app)
        .post('/api/candidates')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation Error');
    });
  });

  describe('GET /api/candidates', () => {
    it('should get all candidates', async () => {
      await Candidate.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        position: 'Frontend Developer',
        interviewDate: new Date(),
        duration: 45
      });

      const response = await request(app)
        .get('/api/candidates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/candidates/:id', () => {
    it('should get a single candidate', async () => {
      const candidate = await Candidate.create({
        name: 'Bob Smith',
        email: 'bob@example.com',
        position: 'Backend Developer',
        interviewDate: new Date(),
        duration: 90
      });

      const response = await request(app)
        .get(`/api/candidates/${candidate._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(candidate.name);
    });

    it('should return 404 for non-existent candidate', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/candidates/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});