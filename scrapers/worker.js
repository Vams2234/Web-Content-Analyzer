const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const scrapeQueue = require('../queues/scrapeQueue'); // Corrected path
const { ScrapingJob, WebsiteAnalysis, User } = require('../models/index'); // Corrected path
const { scrapeStaticContent } = require('./cheerioScraper'); // Corrected path (now in same directory)
const { scrapeDynamicContent } = require('./puppeteerScraper'); // Corrected path (now in same directory)
const analysisService = require('../services/analysisService'); // Corrected path
const enhancementService = require('../services/contentEnhancementService'); // Corrected path

// Initialize Sanitizer
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Worker process for handling asynchronous scraping and analysis jobs.
 */
console.log('Worker process started, listening for jobs...');

scrapeQueue.process(2, async (job) => {
  const { jobId, url, userId, useDynamic = false } = job.data;
  const startTime = Date.now();

  try {
    // 1. Update Job Status to Processing
    await ScrapingJob.update(
      { status: 'processing', attempts: job.attemptsMade + 1 },
      { where: { id: jobId } }
    );
    job.progress(10);

    // 2. Execute Scraping (Static or Dynamic)
    console.log(`[Worker] Scraping: ${url} (Job: ${jobId})`);
    let scrapedData;
    try {
      scrapedData = useDynamic 
        ? await scrapeDynamicContent(url) 
        : await scrapeStaticContent(url);
    } catch (error) {
      // Fallback to Puppeteer for 403 Forbidden errors
      if (!useDynamic && (error.status === 403 || error.message?.includes('403'))) {
        console.log(`[Worker] Static scraping blocked (403). Retrying with Puppeteer...`);
        scrapedData = await scrapeDynamicContent(url);
      } else {
        throw error;
      }
    }
    
    // Sanitize content to prevent XSS before processing
    const rawText = DOMPurify.sanitize(scrapedData.rawText || scrapedData.content);
    const contentHash = enhancementService.generateHash(rawText);
    
    job.progress(40);

    // 3. Execute AI Analysis & Enhancements (Parallelized with Timeout)
    console.log(`[Worker] Analyzing content for Job: ${jobId}`);
    
    const analysisPromise = Promise.all([
        analysisService.analyzeAll(scrapedData),
        enhancementService.detectDuplicates(userId, contentHash, rawText)
    ]);

    // Set a 60-second timeout for AI processing
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI Analysis timed out')), 60000)
    );

    const [aiResult, duplicateInfo] = await Promise.race([analysisPromise, timeoutPromise]);
    
    // Destructure the combined AI result
    const { categoryData, ...coreAnalysis } = aiResult;
    
    job.progress(80);

    // 4. Create Analysis Record
    const analysisRecord = await WebsiteAnalysis.create({
      userId,
      url,
      title: scrapedData.title ? scrapedData.title.substring(0, 255) : 'Untitled',
      content: {
        text: scrapedData.rawText || scrapedData.content,
        images: scrapedData.content?.images || [],
        links: scrapedData.content?.links || [],
        metadata: scrapedData.metadata || {}
      },
      analysis: { ...coreAnalysis, duplicateInfo },
      categoryData,
      contentHash,
      metrics: scrapedData.metrics || {},
      status: 'completed',
      processingTime: Date.now() - startTime
    });

    // 5. Finalize Job Status
    await ScrapingJob.update(
      { status: 'completed', resultId: analysisRecord.id },
      { where: { id: jobId } }
    );

    // Increment User Analysis Count for rate limiting
    await User.increment('analysisCount', { where: { id: userId } });

    job.progress(100);
    return { analysisId: analysisRecord.id };

  } catch (error) {
    console.error(`[Worker Error] Job ${jobId} failed:`, error.message);
    
    // Update DB status to failed if no retries remain
    const maxAttempts = job.opts.attempts || 1;
    // attemptsMade is the count of *previous* failures. So current attempt is attemptsMade + 1.
    if ((job.attemptsMade + 1) >= maxAttempts) {
      await ScrapingJob.update({ status: 'failed', error: error.message }, { where: { id: jobId } });
    }
    throw error; // Re-throw so Bull handles the backoff retry
  }
});

process.on('SIGTERM', async () => {
  console.log('Worker shutting down gracefully...');
  await scrapeQueue.close();
  process.exit(0);
});