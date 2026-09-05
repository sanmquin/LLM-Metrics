# AGENTS.md - Instructions & Guidelines for AI Agents

## Overview & Scope
This repository houses **LLM-Metrics**, a React + TypeScript application deployed to Netlify that retrieves daily arXiv papers in Artificial Intelligence (`cs.AI`), calculates abstract language metrics, and stores paper records in a MongoDB Atlas collection.

The primary educational goal is to construct a continuous dataset enabling the measurement of language metrics with applications for education (e.g. teaching students or LLMs to write clear, concise academic paper abstracts).

---

## Agent Guidelines & System Rules
1. **Never edit build artifacts directly.** Always trace back to source files in `src/` or `netlify/functions/`.
2. **Obey Dark Mode Theme:** The UI must remain cleanly designed in dark mode using Tailwind CSS dark classes (`bg-gray-950`, `text-gray-100`, etc.).
3. **Thorough Error Tracing & Logs:** Netlify background functions must capture structured execution logs (`logs[]`) to assist in debugging Netlify background tasks and API connection failures.
4. **Schema Synchronization:** Keep the MongoDB collection schema documentation below up to date whenever paper fields or computed metric structures change.
5. **Quality Verification:** Always run `npm run build` and `npm test` after modifying system files.

---

## MongoDB Collection Schema Documentation

### Database: `llm_metrics`
### Collection: `papers`

#### Schema Definition (TypeScript Interface & JSON Schema)

```typescript
export interface ArxivPaper {
  _id?: ObjectId;               // Primary key automatically managed by MongoDB Atlas
  arxivId: string;              // Unique arXiv ID (e.g. "2502.18901" or "2502.18901v1") [INDEXED UNIQUE]
  title: string;                // Sanitized paper title string
  abstract: string;             // Paper abstract prose content
  authors: string[];            // Array of author names
  categories: string[];         // Array of arXiv category term codes (e.g. ["cs.AI", "cs.CL"])
  primaryCategory: string;      // Main category string (default: "cs.AI")
  publishedDate: string;        // YYYY-MM-DD date string [INDEXED]
  publishedAt: Date;            // ISO Date object of original arXiv publication
  updatedAt: Date;              // ISO Date object of last document update
  collectedAt: Date;            // ISO Date object when first ingested into dataset
  pdfUrl?: string;              // Direct link to paper PDF
  htmlUrl?: string;             // Direct link to paper abstract page
  metrics: {                    // Educational prose & language metrics
    wordCount: number;          // Total words in abstract
    sentenceCount: number;      // Number of sentences in abstract
    avgSentenceLength: number;  // Average words per sentence (rounded to 2 decimals)
    characterCount: number;     // Total character count
  };
}
```

#### Example MongoDB BSON Document

```json
{
  "_id": { "$oid": "65d4f1a2e4b0a123456789ab" },
  "arxivId": "2502.18901",
  "title": "Evaluating LLM Abstract Synthesis for AI Educational Curricula",
  "abstract": "Abstract writing is a foundational scientific skill. In this work, we present a systematic framework to evaluate language metrics across automated text summarizers and academic paper abstracts in Artificial Intelligence.",
  "authors": ["A. Vance", "E. Chen", "M. Rahimi"],
  "categories": ["cs.AI", "cs.CL"],
  "primaryCategory": "cs.AI",
  "publishedDate": "2025-02-20",
  "publishedAt": { "$date": "2025-02-20T10:00:00.000Z" },
  "updatedAt": { "$date": "2025-02-20T20:00:00.000Z" },
  "collectedAt": { "$date": "2025-02-20T20:00:00.000Z" },
  "htmlUrl": "https://arxiv.org/abs/2502.18901",
  "metrics": {
    "wordCount": 35,
    "sentenceCount": 2,
    "avgSentenceLength": 17.5,
    "characterCount": 224
  }
}
```

#### Collection Indexes
- `{ arxivId: 1 }` (Unique)
- `{ publishedDate: 1 }`
