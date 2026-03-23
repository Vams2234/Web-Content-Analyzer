const { WebsiteAnalysis, User } = require('../models/index');
const { Op } = require('sequelize');
const Redis = require('ioredis');

// Initialize Redis for Caching
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379, // Default port for local Redis
  password: process.env.REDIS_PASSWORD, // Password for Redis Cloud
  username: process.env.REDIS_USERNAME // Username for Redis Cloud
});

// Handle Redis connection errors to prevent app crashes
redis.on('error', (err) => {
  console.error('Redis Connection Error:', err);
});

/**
 * AnalysisController handles retrieval, deletion, and export of analysis reports.
 */
const getHistory = async (req, res) => {
  const { page = 1, limit = 10, status, domain, startDate } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;

  const where = { userId };
  if (status) where.status = status;
  if (domain) where.url = { [Op.like]: `%${domain}%` };
  if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };

  try {
    const { count, rows } = await WebsiteAnalysis.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Summary stats
    const totalCompleted = await WebsiteAnalysis.count({ where: { userId, status: 'completed' } });

    res.json({
      data: rows,
      meta: { total: count, pages: Math.ceil(count / limit), currentPage: page },
      stats: { totalCompleted }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAnalysisById = async (req, res) => {
  try {
    const cacheKey = `analysis:${req.params.id}`;
    
    // 1. Try Redis Cache
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) return res.json(JSON.parse(cachedData));
    } catch (redisError) {
      console.warn('Redis cache miss due to error, falling back to DB');
    }

    // 2. Query Database
    const analysis = await WebsiteAnalysis.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });

    // 3. Store in Cache (TTL 1 hour)
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(analysis));
    } catch (redisError) {
      console.error('Failed to set Redis cache:', redisError);
    }
    
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteAnalysis = async (req, res) => {
  try {
    const analysis = await WebsiteAnalysis.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });

    // Soft delete
    await analysis.destroy();

    // Update user count (decrement)
    await User.decrement('analysisCount', { where: { id: req.user.id } });

    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportAnalysis = async (req, res) => {
  const { format } = req.body; // pdf, json, csv
  try {
    const analysis = await WebsiteAnalysis.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=analysis-${analysis.id}.json`);
      return res.send(JSON.stringify(analysis, null, 2));
    }

    // Note: PDF and CSV would require additional libraries like 'pdfkit' or 'json2csv'
    res.status(501).json({ error: `Export format ${format} not yet implemented` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getHistory, getAnalysisById, deleteAnalysis, exportAnalysis };