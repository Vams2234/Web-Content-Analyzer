const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet'); // <--- Add this line
const { connectDB, sequelize } = require('./config/database.js');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const scrapeQueue = require('./queues/scrapeQueue.js');
const authRoutes = require('./routes/authRoutes.js');
const scrapingRoutes = require('./routes/scrapingRoutes.js');
const analysisRoutes = require('./routes/analysisRoutes.js');
const profileRoutes = require('./routes/profileRoutes.js');
const path = require('path');
const fs = require('fs');
require('./models'); // Initialize associations

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Bull Board Dashboard Setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [new BullAdapter(scrapeQueue)],
  serverAdapter: serverAdapter,
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin/queues', serverAdapter.getRouter());

// Global Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// Browser Caching Middleware for API Responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', profileRoutes);
app.use('/api/scrape', scrapingRoutes);
app.use('/api/analysis', analysisRoutes);

// Database Connection
connectDB();
sequelize.sync({ force: false }).then(() => console.log('Database synced'));

// Root Route
app.get('/', (req, res) => {
    res.json({ message: 'Web Content Analyzer API is running' });
});

// Basic Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Server is running' });
});

// Global Error Handler for Monitoring
app.use((err, req, res, next) => {
  console.error(`[Error Monitor] ${err.stack}`);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;