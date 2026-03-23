const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const extractionUtils = require('./extractionUtils');

/**
 * Dynamic Web Scraper using Puppeteer
 * Handles SPAs and sites with bot protection
 */
const scrapeDynamicContent = async (url) => {
  console.log(`[Puppeteer] Launching browser for: ${url}`);
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set realistic User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    // Navigate to URL
    // waitUntil: 'networkidle2' waits until there are no more than 2 network connections for at least 500 ms.
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Get page content
    const content = await page.content();
    const $ = cheerio.load(content);

    // Reuse extraction logic from extractionUtils
    const result = {
      url: url,
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

    // Clean and Calculate Metrics
    const mainText = extractionUtils.getCleanText($);
    result.metrics = extractionUtils.calculateMetrics(mainText);
    result.rawText = mainText;

    return result;

  } catch (error) {
    console.error(`[Puppeteer Error] ${url}:`, error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = { scrapeDynamicContent };