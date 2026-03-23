const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WebsiteAnalysis = sequelize.define('WebsiteAnalysis', {
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
  title: {
    type: DataTypes.STRING
  },
  content: {
    type: DataTypes.JSON, // Stores {text, images, links, metadata}
    allowNull: false
  },
  analysis: {
    type: DataTypes.JSON // Stores {summary, keywords, sentiment, topics, insights}
  },
  categoryData: {
    type: DataTypes.JSON // Stores { primaryCategory, subCategories, confidence, suggestions }
  },
  contentHash: {
    type: DataTypes.STRING // For duplicate detection
  },
  metrics: {
    type: DataTypes.JSON // Stores {wordCount, readingTime, complexity}
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  processingTime: {
    type: DataTypes.INTEGER // in milliseconds
  }
}, {
    timestamps: true,
    paranoid: true, // Enables soft deletes (deletedAt column)
  indexes: [
    {
      fields: ['url']
    },
    {
      fields: ['status']
    },
    {
      fields: ['userId', 'createdAt'] // Optimized for history sorting
    },
    {
      fields: ['contentHash'] // Optimized for duplicate detection
    },
    {
      name: 'fulltext_title',
      type: 'FULLTEXT',
      fields: ['title']
    }
  ]
});

module.exports = WebsiteAnalysis;