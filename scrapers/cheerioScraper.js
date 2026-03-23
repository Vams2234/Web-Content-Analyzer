const axios = require('axios');
const cheerio = require('cheerio');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { URL } = require('url');
const extractionUtils = require('./extractionUtils');

// Rate limiter: 5 requests per 10 seconds per domain
const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 10,
});

/**
 * Static Web Scraper using Cheerio
 */
const scrapeStaticContent = async (targetUrl, options = {}) => {
  try {
    // 1. Validate URL
    const parsedUrl = new URL(targetUrl);
    
    // 2. Rate Limiting
    await rateLimiter.consume(parsedUrl.hostname);

    // 3. Robots.txt Check (Basic Implementation)
    // In a production app, you'd use 'robots-parser' here.
    // For now, we log the attempt.
    console.log(`[Scraper] Fetching: ${targetUrl}`);

    // 4. Fetch Content
    const response = await axios.get(targetUrl, {
      timeout: 10000,
      maxContentLength: 5 * 1024 * 1024, // Limit to 5MB
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        ...options.headers
      }
    });

    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('text/html')) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    const $ = cheerio.load(response.data);

    // 5. Extract Structured Content
    const result = {
      url: targetUrl,
      title: $('title').text().trim() || $('h1').first().text().trim(),
      metadata: extractionUtils.extractMeta($),
      content: {
        headings: {
          h1: $('h1').map((i, el) => $(el).text().trim()).get(),
          h2: $('h2').map((i, el) => $(el).text().trim()).get(),
          h3: $('h3').map((i, el) => $(el).text().trim()).get(),
        },
        paragraphs: $('p').map((i, el) => $(el).text().trim()).get().filter(p => p.length > 0),
        images: $('img').map((i, el) => ({
          src: $(el).attr('src'),
          alt: $(el).attr('alt') || '',
          caption: $(el).parent().find('figcaption').text().trim()
        })).get(),
        links: $('a').map((i, el) => ({
          text: $(el).text().trim(),
          href: $(el).attr('href'),
          isExternal: $(el).attr('href')?.startsWith('http')
        })).get()
      }
    };

    // 6. Clean and Calculate Metrics
    const mainText = extractionUtils.getCleanText($);
    result.metrics = extractionUtils.calculateMetrics(mainText);
    result.rawText = mainText;

    return result;

  } catch (error) {
    console.error(`[Scraper Error] ${targetUrl}:`, error.message);
    throw {
      status: error.response?.status || 500,
      message: error.message,
      url: targetUrl
    };
  }
};

module.exports = { scrapeStaticContent };