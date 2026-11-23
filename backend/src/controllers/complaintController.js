const { pool } = require('../config/db');

// Allowed Categories and Statuses as per requirements
const VALID_CATEGORIES = [
  'Hostel',
  'Library',
  'Wi-Fi and Internet',
  'Classroom',
  'Laboratory',
  'Transport',
  'Canteen',
  'Other'
];

const VALID_STATUSES = [
  'Submitted',
  'Under Review',
  'In Progress',
  'Resolved',
  'Rejected'
];

/**
 * Helper: Generate a unique Complaint ID (e.g., CMP-738291)
 */
function generateComplaintId() {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `CMP-${randomSuffix}`;
}

/**
 * Controller: Submit a new complaint (Student)
 * POST /api/complaints
 */
async function createComplaint(req, res, next) {
  try {
    const studentId = req.user.id;
    const { category, title, description } = req.body;

    // 1. Validation
    if (!category || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category, title, and description are required.'
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    if (title.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 5 characters long.'
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters long to provide sufficient detail.'
      });
    }

    // Generate unique complaint ID
    const complaintId = generateComplaintId();

    // 2. Insert complaint record
    const [insertResult] = await pool.execute(
      `INSERT INTO complaints 
       (complaint_id, student_id, category, title, description, status, assigned_department) 
       VALUES (?, ?, ?, ?, ?, 'Submitted', 'Administration')`,
      [complaintId, studentId, category, title.trim(), description.trim()]
    );

    // 3. Log initial status entry in audit trail
    await pool.execute(
      `INSERT INTO complaint_logs (complaint_id, changed_by_user_id, previous_status, new_status, comment) 
       VALUES (?, ?, NULL, 'Submitted', 'Complaint submitted by student.')`,
      [complaintId, studentId]
    );

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully!',
      complaint: {
        id: insertResult.insertId,
        complaint_id: complaintId,
        category,
        title: title.trim(),
        description: description.trim(),
        status: 'Submitted',
        created_at: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Get complaints submitted by the logged-in student
 * GET /api/complaints/my
 */
async function getMyComplaints(req, res, next) {
  try {
    const studentId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT c.id, c.complaint_id, c.category, c.title, c.description, 
              c.status, c.assigned_department, c.admin_comments, 
              c.resolved_at, c.created_at, c.updated_at
       FROM complaints c
       WHERE c.student_id = ?
       ORDER BY c.created_at DESC`,
      [studentId]
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      complaints: rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Get a single complaint by complaint_id (e.g. CMP-1001)
 * Accessible by: Student owner OR Administrator
 * GET /api/complaints/:id
 */
async function getComplaintById(req, res, next) {
  try {
    const complaintIdentifier = req.params.id; // Can be string CMP-XXXX or integer id

    // Query complaint with student details
    const [rows] = await pool.execute(
      `SELECT c.*, 
              u.name AS student_name, 
              u.email AS student_email, 
              u.department AS student_department
       FROM complaints c
       JOIN users u ON c.student_id = u.id
       WHERE c.complaint_id = ? OR c.id = ?`,
      [complaintIdentifier, isNaN(complaintIdentifier) ? 0 : parseInt(complaintIdentifier, 10)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }

    const complaint = rows[0];

    // Authorization check: If logged-in user is a student, they can only view THEIR OWN complaint
    if (req.user.role === 'student' && complaint.student_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to view complaints submitted by other students.'
      });
    }

    // Fetch history logs for tracking timeline
    const [logs] = await pool.execute(
      `SELECT l.id, l.previous_status, l.new_status, l.comment, l.created_at, 
              u.name AS changed_by_name, u.role AS changed_by_role
       FROM complaint_logs l
       JOIN users u ON l.changed_by_user_id = u.id
       WHERE l.complaint_id = ?
       ORDER BY l.created_at ASC`,
      [complaint.complaint_id]
    );

    return res.status(200).json({
      success: true,
      complaint,
      timeline: logs
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Get all complaints with search and filters (Administrator only)
 * GET /api/admin/complaints
 */
async function getAllComplaints(req, res, next) {
  try {
    const { search, category, status } = req.query;

    let query = `
      SELECT c.*, 
             u.name AS student_name, 
             u.email AS student_email, 
             u.department AS student_department
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Search filter (by complaint ID, title, or student name)
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query += ` AND (c.complaint_id LIKE ? OR c.title LIKE ? OR u.name LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Category filter
    if (category && category !== 'All') {
      query += ` AND c.category = ?`;
      params.push(category);
    }

    // Status filter
    if (status && status !== 'All') {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY c.created_at DESC`;

    const [complaints] = await pool.execute(query, params);

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Update complaint status, department, and resolution comments (Admin)
 * PUT /api/admin/complaints/:id
 */
async function updateComplaintStatus(req, res, next) {
  try {
    const complaintIdentifier = req.params.id;
    const { status, assigned_department, admin_comments } = req.body;
    const adminId = req.user.id;

    // 1. Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    // 2. Fetch existing complaint
    const [existing] = await pool.execute(
      'SELECT id, complaint_id, status, assigned_department, admin_comments FROM complaints WHERE complaint_id = ? OR id = ?',
      [complaintIdentifier, isNaN(complaintIdentifier) ? 0 : parseInt(complaintIdentifier, 10)]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.'
      });
    }

    const currentComplaint = existing[0];
    const newStatus = status || currentComplaint.status;
    const newDept = assigned_department !== undefined ? assigned_department : currentComplaint.assigned_department;
    const newComments = admin_comments !== undefined ? admin_comments : currentComplaint.admin_comments;
    const isResolved = newStatus === 'Resolved';

    // 3. Update complaint record
    await pool.execute(
      `UPDATE complaints 
       SET status = ?, 
           assigned_department = ?, 
           admin_comments = ?, 
           resolved_at = CASE WHEN ? = 1 THEN NOW() ELSE resolved_at END
       WHERE id = ?`,
      [newStatus, newDept, newComments, isResolved ? 1 : 0, currentComplaint.id]
    );

    // 4. Record action in audit log if status or comments changed
    const logComment = admin_comments 
      ? `Status: ${newStatus}. Note: ${admin_comments}`
      : `Status changed to ${newStatus}`;

    await pool.execute(
      `INSERT INTO complaint_logs (complaint_id, changed_by_user_id, previous_status, new_status, comment) 
       VALUES (?, ?, ?, ?, ?)`,
      [currentComplaint.complaint_id, adminId, currentComplaint.status, newStatus, logComment]
    );

    return res.status(200).json({
      success: true,
      message: 'Complaint updated successfully.',
      complaint: {
        complaint_id: currentComplaint.complaint_id,
        status: newStatus,
        assigned_department: newDept,
        admin_comments: newComments
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Get dashboard statistics (Admin)
 * GET /api/admin/stats
 */
async function getDashboardStats(req, res, next) {
  try {
    // 1. Overall counts by status
    const [statusCounts] = await pool.execute(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) AS submitted,
        SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) AS under_review,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected
      FROM complaints
    `);

    // 2. Counts by category
    const [categoryCounts] = await pool.execute(`
      SELECT category, COUNT(*) AS count
      FROM complaints
      GROUP BY category
      ORDER BY count DESC
    `);

    // 3. Total registered students count
    const [userCounts] = await pool.execute(`
      SELECT COUNT(*) AS total_students FROM users WHERE role = 'student'
    `);

    // 4. Five most recent complaints
    const [recentComplaints] = await pool.execute(`
      SELECT c.id, c.complaint_id, c.title, c.category, c.status, c.created_at, u.name AS student_name
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    const stats = statusCounts[0];

    return res.status(200).json({
      success: true,
      stats: {
        total: stats.total || 0,
        pending: (Number(stats.submitted) || 0) + (Number(stats.under_review) || 0),
        in_progress: Number(stats.in_progress) || 0,
        resolved: Number(stats.resolved) || 0,
        rejected: Number(stats.rejected) || 0,
        total_students: userCounts[0].total_students || 0
      },
      category_breakdown: categoryCounts,
      recent_complaints: recentComplaints
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateComplaintStatus,
  getDashboardStats,
  VALID_CATEGORIES,
  VALID_STATUSES
};
