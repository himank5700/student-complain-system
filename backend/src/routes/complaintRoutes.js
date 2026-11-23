const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateComplaintStatus,
  getDashboardStats
} = require('../controllers/complaintController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ==========================================
// Student Routes (Protected by JWT)
// ==========================================
router.post('/complaints', authenticateToken, createComplaint);
router.get('/complaints/my', authenticateToken, getMyComplaints);
router.get('/complaints/:id', authenticateToken, getComplaintById);

// ==========================================
// Administrator Routes (Protected by JWT + Admin Role)
// ==========================================
router.get('/admin/stats', authenticateToken, requireAdmin, getDashboardStats);
router.get('/admin/complaints', authenticateToken, requireAdmin, getAllComplaints);
router.put('/admin/complaints/:id', authenticateToken, requireAdmin, updateComplaintStatus);

module.exports = router;
