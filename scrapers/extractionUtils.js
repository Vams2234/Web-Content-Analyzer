/**
 * Utilities for cleaning and analyzing HTML content
 */

const extractMeta = ($) => {
  return {
    description: $('meta[name="description"]').attr('content') || '',
    keywords: $('meta[name="keywords"]').attr('content') || '',
    ogTitle: $('meta[property="og:title"]').attr('content') || '',
    ogDescription: $('meta[property="og:description"]').attr('content') || '',
    language: $('html').attr('lang') || 'en',
    charset: $('meta[charset]').attr('charset') || 'UTF-8'
  };
};

const getCleanText = ($) => {
  // Remove boilerplate/noise
  $('script, style, nav, footer, header, noscript, iframe, ad, .ads, #sidebar').remove();
  
  // Focus on main content areas
  const mainContent = $('main, article, #content, .content, body').first();
  
  return mainContent.text()
    .replace(/\s\s+/g, ' ') // Remove extra whitespace
    .trim();
};

const calculateMetrics = (text) => {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  
  // Average reading speed: 200-250 words per minute
  const readingTime = Math.ceil(wordCount / 225);
  
  // Simple complexity score based on average word length
  const avgWordLength = text.length / (wordCount || 1);
  let complexity = 'Low';
  if (avgWordLength > 6) complexity = 'High';
  else if (avgWordLength > 4.5) complexity = 'Medium';

  return {
    wordCount,
    readingTime, // in minutes
    complexity
  };
};

module.exports = {
  extractMeta,
  getCleanText,
  calculateMetrics
};