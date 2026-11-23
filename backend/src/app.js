const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load environment configuration
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { testConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// Global Middleware
// ==========================================
app.use(cors({
  origin: '*', // Allow frontend requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging (DevOps observability)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve Frontend Static Files directly from Express
const frontendPath = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// ==========================================
// API Routes
// ==========================================
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', complaintRoutes);

// Root route redirects to frontend home
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ==========================================
// Error Handling Middleware
// ==========================================
// Catch-all for undefined API routes
app.use('/api/*', notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// ==========================================
// Server Startup (Only when not run by Jest tests)
// ==========================================
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`=======================================================`);
    console.log(`🚀 Student Complaint Management System Server Started`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}/index.html`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
    // Verify database connection
    await testConnection();
  });
}

module.exports = app;
