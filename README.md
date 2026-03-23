# Web Content Analyzer

An AI-powered full-stack application that scrapes web content, analyzes it using Google's Gemini AI, and provides comprehensive insights including summaries, SEO scores, sentiment analysis, and categorization.

## 🚀 Features

*   **Intelligent Scraping**: Hybrid scraping engine using Cheerio for static sites and Puppeteer for dynamic/SPA sites (with automatic fallback for 403 errors).
*   **AI Analysis**: Leverages Google Gemini (Flash models) to generate executive summaries, SEO recommendations, and sentiment analysis.
*   **User Dashboard**: Clean, responsive UI built with React and Tailwind CSS.
*   **History & Management**: Save analysis history, delete records, and manage user profiles.
*   **Authentication**: Secure JWT-based authentication with password hashing.
*   **Background Processing**: Asynchronous job queue (Bull/Redis) for handling long-running scraping tasks without blocking the UI.
*   **Profile Management**: Update username, password, and upload avatar images.

## 📸 Screenshots


| Dashboard View | Analysis Results |
| ![alt text](dashboard.png)
| !Dashboard | !Analysis |

| History & Queues | Profile Management |
| ![alt text](History.png)
| !History | !Profile |

## �️ Tech Stack

### Frontend (`/client`)
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS
*   **State Management**: TanStack Query (React Query)
*   **Routing**: React Router DOM
*   **Icons**: Lucide React

### Backend (`/server`)
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: MySQL (via Sequelize ORM)
*   **Queue**: Bull (requires Redis)
*   **AI**: Google Generative AI SDK (Gemini)
*   **Scraping**: Cheerio, Puppeteer

## 📋 Prerequisites

Before running the application, ensure you have the following installed:
*   **Node.js** (v18+ recommended)
*   **MySQL** Database
*   **Redis** Server (required for the job queue)
*   **Google Gemini API Key**

## ⚙️ Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd web-content-analyzer
    ```

2.  **Install Root Dependencies** (for concurrent execution)
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies**
    ```bash
    cd server
    npm install
    ```

4.  **Install Frontend Dependencies**
    ```bash
    cd ../client
    npm install
    ```

## 🔐 Configuration

Create a `.env` file in the `server/` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=web_content_analyzer
DB_DIALECT=mysql

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Redis Configuration (for Bull Queue)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

## 🚀 Running the Application

You can start the entire stack (Backend API, Worker, and Frontend) with a single command from the **root** directory:

```bash
npm run dev
```

This command uses `concurrently` to launch:
1.  **API Server**: http://localhost:5000
2.  **Worker**: Background process for scraping
3.  **Frontend**: http://localhost:5173 (Opens automatically)
