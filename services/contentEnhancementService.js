const crypto = require('crypto');
const { WebsiteAnalysis } = require('../models');

/**
 * Generates a unique hash for the content to detect exact duplicates.
 */
const generateHash = (text) => {
  if (!text) return null;
  return crypto.createHash('md5').update(text).digest('hex');
};

/**
 * Checks if the user has already analyzed this exact content.
 */
const detectDuplicates = async (userId, contentHash, text) => {
  if (!contentHash) return { isDuplicate: false };

  const existing = await WebsiteAnalysis.findOne({
    where: {
      userId,
      contentHash
    }
  });

  return existing ? { isDuplicate: true, originalId: existing.id } : { isDuplicate: false };
};

module.exports = {
  generateHash,
  detectDuplicates
};