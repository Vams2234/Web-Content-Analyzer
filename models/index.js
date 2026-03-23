const User = require('./User');
const WebsiteAnalysis = require('./WebsiteAnalysis');
const ScrapingJob = require('./ScrapingJob');

// User -> WebsiteAnalysis (One-to-Many)
User.hasMany(WebsiteAnalysis, { foreignKey: 'userId', onDelete: 'CASCADE' });
WebsiteAnalysis.belongsTo(User, { foreignKey: 'userId' });

// User -> ScrapingJob (One-to-Many)
User.hasMany(ScrapingJob, { foreignKey: 'userId', onDelete: 'CASCADE' });
ScrapingJob.belongsTo(User, { foreignKey: 'userId' });

// ScrapingJob -> WebsiteAnalysis (One-to-One)
WebsiteAnalysis.hasOne(ScrapingJob, { foreignKey: 'resultId' });
ScrapingJob.belongsTo(WebsiteAnalysis, { foreignKey: 'resultId' });

module.exports = {
  User,
  WebsiteAnalysis,
  ScrapingJob
};