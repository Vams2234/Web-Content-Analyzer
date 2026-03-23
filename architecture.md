# Architecture Overview

## Data Flow
1. **Client**: User submits a URL.
2. **Server (Scraper)**: Fetches HTML and extracts relevant text content.
3. **Server (Service)**: Sends extracted text to an LLM for analysis.
4. **Database**: Stores the original content and the generated report.
5. **Client**: Displays the analysis report to the user.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Axios.
- **Backend**: Node.js, Express, Puppeteer (Scraping).
 - **Database**: MySQL.
- **AI**: OpenAI API / LangChain.