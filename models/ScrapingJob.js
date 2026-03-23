const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ScrapingJob = sequelize.define('ScrapingJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  status: {
    type: DataTypes.ENUM('queued', 'processing', 'completed', 'failed'),
    defaultValue: 'queued'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  scheduledAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

// Job management method
ScrapingJob.prototype.incrementAttempts = async function() {
  this.attempts += 1;
  if (this.attempts >= 3) this.status = 'failed';
  return await this.save();
};

module.exports = ScrapingJob;