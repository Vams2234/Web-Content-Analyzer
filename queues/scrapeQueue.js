const Queue = require('bull');
const dotenv = require('dotenv');

dotenv.config();

// Initialize the scraping queue with Redis connection
const scrapeQueue = new Queue('web-scraping', {
  redis: { 
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || '127.0.0.1', // <--- Add this comma
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME
  }, // <--- This comma is crucial for separating the 'redis' object from 'defaultJobOptions'
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5s delay
    },
    removeOnComplete: 100, // Keep last 100 for history
    removeOnFail: 500,
  }
});

// Queue Health Monitoring
scrapeQueue.on('failed', (job, err) => {
  console.error(`[Queue] Job ${job.id} failed: ${err.message}`);
});

scrapeQueue.on('stalled', (job) => {
  console.warn(`[Queue] Job ${job.id} stalled - check worker resource usage`);
});

scrapeQueue.on('completed', (job) => {
  console.log(`[Queue] Job ${job.id} finished`);
});

module.exports = scrapeQueue;