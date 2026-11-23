const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

/**
 * Health Check Endpoint
 * GET /api/health
 * Used by Docker, Nginx, and DevOps monitoring tools to verify application & database status.
 */
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbError = null;

  try {
    // Quick ping to MySQL
    await pool.query('SELECT 1');
  } catch (error) {
    dbStatus = 'unreachable';
    dbError = error.message;
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === 'healthy';

  const healthData = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      ...(dbError && { error: dbError })
    },
    system: {
      node_version: process.version,
      memory_usage_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      response_time_ms: responseTimeMs
    }
  };

  return res.status(isHealthy ? 200 : 503).json(healthData);
});

module.exports = router;
