# LLM-Metrics: Educational Abstract Analysis Pipeline

> **Evaluating language metrics with applications for education — teaching students and LLMs to write better academic abstracts.**

LLM-Metrics is a React + TypeScript application deployed to **Netlify** that automatically ingests daily **arXiv** research papers in Artificial Intelligence (`cs.AI`), calculates key prose and syntactic language metrics, stores paper records in **MongoDB Atlas**, and visualizes dataset growth and prose complexity over time.

---

## 🎯 Educational Purpose & Vision

Abstract writing is a critical skill in scientific communication. Concise, well-structured abstracts make research accessible and reproducible.

The goal of this project is to build a continuous dataset that enables:
1. **Language Metric Benchmarking:** Tracking readability, word density, and average sentence length trends across AI literature.
2. **Pedagogical Applications:** Assisting students in learning how to craft impact-driven, concise scientific abstracts.
3. **LLM Evaluation & Alignment:** Evaluating automated paper summarization models and fine-tuning LLMs (e.g. via DPO) to produce clear, passive-voice-free abstract syntheses.

---

## ⚡ Key Features

- **Dark Mode UI Dashboard:** Sleek, modern dark-mode user interface built with React, Tailwind CSS, and Lucide React.
- **ArXiv Background Ingestion:**
  - Netlify Background Function (`netlify/functions/fetch-arxiv-background.ts`) queries the arXiv API for subject **Artificial Intelligence** (`cat:cs.AI`).
  - Extracts paper titles, abstracts, authors, publication dates, categories, and direct arXiv links.
  - Automatically calculates abstract metrics: word count, sentence count, average sentence length, and character count.
  - Generates detailed execution logs and error traces for easy debugging.
- **Interactive Metrics Dashboard (Recharts):**
  - Displays daily paper collection volume.
  - Plots average word count and sentence length complexity trends over time.
- **Abstract Explorer & Search:**
  - Interactive master-detail browser for searching papers by title, abstract keywords, author, or arXiv ID.
- **MongoDB Atlas Storage:**
  - Persists paper records with upsert semantics and indexing on `arxivId` and `publishedDate`.
  - Detailed MongoDB schema documented in [`AGENTS.md`](./AGENTS.md).
- **Fallback Demo Mode:**
  - Automatically displays simulated paper metrics and abstracts if `MONGODB_URI` is not yet configured.

---

## 🏗️ Project Architecture

```
LLM-Metrics/
├── netlify/
│   └── functions/
│       ├── fetch-arxiv-background.ts  # Netlify background function (arXiv fetcher & DB sink)
│       ├── get-metrics.ts             # API endpoint aggregating daily DB metrics
│       └── get-papers.ts              # API endpoint listing recent arXiv papers
├── src/
│   ├── components/
│   │   ├── MetricsChart.tsx           # Recharts daily volume & language trend charts
│   │   └── PaperList.tsx              # Paper browser and detail modal with language metrics
│   ├── lib/
│   │   ├── arxiv.ts                   # Fast XML parser for arXiv Atom feed
│   │   ├── db.ts                      # MongoDB Atlas client connection & schema definitions
│   │   └── mockData.ts                # Fallback mock dataset for demo mode
│   ├── App.tsx                        # Main dashboard shell & background task controls
│   └── main.tsx
├── AGENTS.md                          # AI Agent instructions & MongoDB collection schema
├── DEV.md                             # Setup, keys, and deployment guide
└── netlify.toml                       # Netlify build configuration
```

---

## 🚀 Quick Start

See [`DEV.md`](./DEV.md) for full developer setup and deployment documentation.

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Run unit tests
npm test

# 4. Verify build
npm run build
```

---

## 📝 Documentation
- **[`AGENTS.md`](./AGENTS.md):** AI agent directives & complete MongoDB Schema documentation.
- **[`DEV.md`](./DEV.md):** Environment variable keys (`MONGODB_URI`) and Netlify deployment instructions.
