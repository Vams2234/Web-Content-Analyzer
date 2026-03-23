const { ScrapingJob, WebsiteAnalysis, User } = require('../models/index');
const scrapeQueue = require('../queues/scrapeQueue');
const { validationResult } = require('express-validator');
const { URL } = require('url');

/**
 * ScrapingController handles the initiation and status tracking of scraping jobs.
 */
const analyzeUrl = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { url, priority = 0 } = req.body;
  const userId = req.user.id; // Assumes JWT middleware

  try {
    // 1. Security Check: Prevent SSRF/Malicious URLs
    const parsedUrl = new URL(url);
    
    // Ensure only http and https are allowed
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only HTTP and HTTPS protocols are supported' });
    }

    const forbiddenHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    const privateIpRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/;
    
    if (forbiddenHosts.includes(parsedUrl.hostname) || privateIpRegex.test(parsedUrl.hostname)) {
      return res.status(400).json({ error: 'Access to internal or restricted network is forbidden' });
    }

    // 2. Rate Limit & Permission Check
    const user = await User.findByPk(userId);
    const limit = user.subscription === 'pro' ? 100 : 10;
    if (user.analysisCount >= limit) {
      return res.status(403).json({ error: 'Analysis limit reached for your plan' });
    }

    // 3. Duplicate/Cache Check (Last 24 hours)
    const existingAnalysis = await WebsiteAnalysis.findOne({
      where: { url, userId, status: 'completed' },
      order: [['createdAt', 'DESC']]
    });

    if (existingAnalysis && (Date.now() - new Date(existingAnalysis.createdAt).getTime() < 86400000)) {
      return res.status(200).json({ message: 'Recent analysis found', jobId: null, resultId: existingAnalysis.id });
    }

    // 4. Create Job Record & Queue
    const jobRecord = await ScrapingJob.create({ url, userId, priority, status: 'queued' });
    
    await scrapeQueue.add({ jobId: jobRecord.id, url, userId }, { priority });

    res.status(202).json({ 
      message: 'Scraping job queued', 
      jobId: jobRecord.id,
      eta: '30-60 seconds' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getJobStatus = async (req, res) => {
  try {
    const jobRecord = await ScrapingJob.findByPk(req.params.jobId);
    if (!jobRecord) return res.status(404).json({ error: 'Job not found' });

    // Get progress from Bull if active
    const bullJob = await scrapeQueue.getJob(req.params.jobId);
    const progress = bullJob ? await bullJob.progress() : (jobRecord.status === 'completed' ? 100 : 0);

    res.json({
      status: jobRecord.status,
      progress: `${progress}%`,
      attempts: jobRecord.attempts,
      error: jobRecord.error
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getJobResult = async (req, res) => {
  try {
    const job = await ScrapingJob.findByPk(req.params.jobId, {
      include: [{ model: WebsiteAnalysis }]
    });

    if (!job || !job.WebsiteAnalysis) {
      return res.status(404).json({ error: 'Result not ready or job not found' });
    }

    // Ownership check
    if (job.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to result' });
    }

    res.json(job.WebsiteAnalysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { analyzeUrl, getJobStatus, getJobResult };