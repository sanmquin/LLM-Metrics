# DEV.md - Developer Setup & Deployment Guide

## Overview
This document describes local environment setup, configuration keys, and deployment instructions for deploying LLM-Metrics to Netlify with MongoDB Atlas integration.

---

## Environment Variables & Keys

The application requires the following environment variables configured in Netlify or in a local `.env` file:

| Environment Variable | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `MONGODB_URI` | **Yes (Production)** | Connection string to MongoDB Atlas Cluster | `mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DB_NAME` | Optional | Target MongoDB database name | `llm_metrics` |

*Note: If `MONGODB_URI` is not configured, the React application automatically runs in a gracefully degraded **Demo Mode** with interactive mock metrics and sample arXiv paper data.*

---

## Local Development Setup

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Execution
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a local `.env` file (optional):
   ```env
   MONGODB_URI=mongodb+srv://admin:password@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=llm_metrics
   ```

3. Start the local Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. Run test suite:
   ```bash
   npm test
   ```

5. Run production build test:
   ```bash
   npm run build
   ```

---

## Netlify Deployment Guide

### Option A: Netlify CLI
1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```
2. Log in and link site:
   ```bash
   netlify login
   netlify init
   ```
3. Set environment variable:
   ```bash
   netlify env:set MONGODB_URI "mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority"
   ```
4. Deploy to production:
   ```bash
   netlify deploy --build --prod
   ```

### Option B: Netlify Web Dashboard
1. Connect your GitHub repository (`LLM-Metrics`) to Netlify.
2. Build settings will automatically populate from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
3. In Netlify Site Settings -> **Environment variables**, add:
   - `MONGODB_URI`: your MongoDB Atlas connection URI.
   - `MONGODB_DB_NAME`: `llm_metrics` (optional).
4. Save and trigger a site deploy.

---

## Netlify Functions & Ingestion Pipeline Architecture

1. **`netlify/functions/fetch-arxiv-background.ts`**
   - Implemented as a **Netlify Background Function** (indicated by `-background.ts` suffix).
   - Can run asynchronously for up to 15 minutes.
   - Triggered via the "Fetch Last Day Papers" button or an automated Netlify scheduled cron hook.
   - Queries `https://export.arxiv.org/api/query` for category `cat:cs.AI`, parses titles, abstracts, and authors, computes prose metrics, and upserts entries into MongoDB Atlas.

2. **`netlify/functions/get-metrics.ts`**
   - Aggregates stored papers by `publishedDate`.
   - Returns daily paper counts, average word counts, and average sentence lengths for visualization in Recharts.

3. **`netlify/functions/get-papers.ts`**
   - Retrieves stored papers from MongoDB Atlas sorted by publication date descending.
