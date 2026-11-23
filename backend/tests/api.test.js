/**
 * Automated Test Suite for Student Complaint Management System
 * Uses Jest and Supertest to validate:
 * 1. Health check endpoint
 * 2. User registration (successful and duplicate email)
 * 3. User login (successful and invalid credentials)
 * 4. Complaint submission
 * 5. Complaint tracking
 * 6. Access control (Student trying to view another student's complaint)
 * 7. Role-based authorization (Student trying to access Admin endpoints)
 * 8. Administrator updating complaint status
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_unit_tests_123456';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock MySQL database pool before requiring app
jest.mock('../src/config/db', () => {
  return {
    pool: {
      query: jest.fn(),
      execute: jest.fn(),
      getConnection: jest.fn().mockResolvedValue({
        release: jest.fn()
      })
    },
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

const { pool } = require('../src/config/db');
const app = require('../src/app');

describe('Student Complaint Management System - API Tests', () => {
  // Generate sample JWT tokens for testing
  const studentToken = jwt.sign(
    { id: 2, name: 'Rahul Sharma', email: 'student@college.edu', role: 'student' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const anotherStudentToken = jwt.sign(
    { id: 3, name: 'Priya Patel', email: 'priya@college.edu', role: 'student' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    { id: 1, name: 'System Admin', email: 'admin@college.edu', role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // Test 1: Application Health Endpoint
  // ==========================================
  describe('GET /api/health', () => {
    it('should return 200 and healthy status when database responds', async () => {
      pool.query.mockResolvedValueOnce([[ { 1: 1 } ]]);

      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database.status).toBe('healthy');
    });

    it('should return 503 and degraded status if database connection fails', async () => {
      pool.query.mockRejectedValueOnce(new Error('Connection timeout to MySQL'));

      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(503);
      expect(res.body.status).toBe('degraded');
      expect(res.body.database.status).toBe('unreachable');
    });
  });

  // ==========================================
  // Test 2 & 3: Authentication - Registration
  // ==========================================
  describe('POST /api/auth/register', () => {
    it('should register a new student successfully', async () => {
      // 1st query: check existing user (empty)
      pool.execute.mockResolvedValueOnce([[]]);
      // 2nd query: insert user
      pool.execute.mockResolvedValueOnce([{ insertId: 10 }]);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Aman Verma',
          email: 'aman@college.edu',
          password: 'Password@123',
          department: 'Computer Science'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('aman@college.edu');
    });

    it('should reject registration if email is already registered (duplicate)', async () => {
      // Existing user found
      pool.execute.mockResolvedValueOnce([[{ id: 2, email: 'student@college.edu' }]]);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Student',
          email: 'student@college.edu',
          password: 'Password@123'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  // ==========================================
  // Test 4 & 5: Authentication - Login
  // ==========================================
  describe('POST /api/auth/login', () => {
    it('should successfully log in with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Student@123', 10);
      pool.execute.mockResolvedValueOnce([[
        {
          id: 2,
          name: 'Rahul Sharma',
          email: 'student@college.edu',
          password_hash: hashedPassword,
          role: 'student',
          department: 'Computer Science'
        }
      ]]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@college.edu',
          password: 'Student@123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('student');
    });

    it('should reject login when incorrect password is provided', async () => {
      const hashedPassword = await bcrypt.hash('Student@123', 10);
      pool.execute.mockResolvedValueOnce([[
        {
          id: 2,
          name: 'Rahul Sharma',
          email: 'student@college.edu',
          password_hash: hashedPassword,
          role: 'student'
        }
      ]]);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@college.edu',
          password: 'WrongPassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });
  });

  // ==========================================
  // Test 6: Complaint Submission
  // ==========================================
  describe('POST /api/complaints', () => {
    it('should allow an authenticated student to submit a valid complaint', async () => {
      // 1st execute: insert complaint
      pool.execute.mockResolvedValueOnce([{ insertId: 101 }]);
      // 2nd execute: insert audit log
      pool.execute.mockResolvedValueOnce([{ insertId: 201 }]);

      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          category: 'Hostel',
          title: 'Ceiling fan making loud sound in Room 204',
          description: 'The ceiling fan bearing has worn out and vibrates loudly during night hours.'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.complaint).toHaveProperty('complaint_id');
      expect(res.body.complaint.status).toBe('Submitted');
    });

    it('should reject complaint submission with missing or invalid fields', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          category: 'InvalidCategory',
          title: 'Hi',
          description: 'Too short'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // Test 7 & 8: Access Control and Tracking
  // ==========================================
  describe('GET /api/complaints/:id (Authorization & Tracking)', () => {
    it('should allow student owner to view their own complaint and tracking timeline', async () => {
      // Mock complaint owned by student (id: 2)
      pool.execute.mockResolvedValueOnce([[
        {
          id: 1,
          complaint_id: 'CMP-1001',
          student_id: 2,
          category: 'Hostel',
          title: 'Solar water heater issue',
          description: 'Detailed description',
          status: 'In Progress',
          student_name: 'Rahul Sharma',
          student_email: 'student@college.edu'
        }
      ]]);

      // Mock timeline logs
      pool.execute.mockResolvedValueOnce([[
        {
          id: 1,
          previous_status: 'Submitted',
          new_status: 'In Progress',
          comment: 'Technician assigned',
          created_at: new Date()
        }
      ]]);

      const res = await request(app)
        .get('/api/complaints/CMP-1001')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.complaint.complaint_id).toBe('CMP-1001');
      expect(res.body.timeline.length).toBe(1);
    });

    it('should reject a student trying to access another student complaint (403 Forbidden)', async () => {
      // Complaint owned by student id: 2
      pool.execute.mockResolvedValueOnce([[
        {
          id: 1,
          complaint_id: 'CMP-1001',
          student_id: 2,
          title: 'Private student complaint'
        }
      ]]);

      // Request made by Priya Patel (id: 3)
      const res = await request(app)
        .get('/api/complaints/CMP-1001')
        .set('Authorization', `Bearer ${anotherStudentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden/i);
    });
  });

  // ==========================================
  // Test 9 & 10: Role-Based Authorization & Admin Controls
  // ==========================================
  describe('Admin Role-Based Protection and Actions', () => {
    it('should block non-admin student from accessing admin statistics (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/requires admin privileges/i);
    });

    it('should allow administrator to update complaint status and add comments', async () => {
      // 1st query: fetch existing complaint
      pool.execute.mockResolvedValueOnce([[
        {
          id: 1,
          complaint_id: 'CMP-1001',
          status: 'Submitted',
          assigned_department: 'Administration',
          admin_comments: null
        }
      ]]);
      // 2nd query: update complaint
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // 3rd query: insert audit log
      pool.execute.mockResolvedValueOnce([{ insertId: 55 }]);

      const res = await request(app)
        .put('/api/admin/complaints/CMP-1001')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'In Progress',
          assigned_department: 'Hostel Maintenance',
          admin_comments: 'Electrician dispatched to inspect motor.'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.complaint.status).toBe('In Progress');
    });
  });
});
