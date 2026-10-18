import { MongoClient, Db } from 'mongodb';

export interface ArxivPaper {
  arxivId: string;
  title: string;
  abstract: string;
  authors: string[];
  categories: string[];
  publishedDate: string; // YYYY-MM-DD string
  publishedAt: Date;
  updatedAt: Date;
  collectedAt: Date;
  primaryCategory: string;
  pdfUrl?: string;
  htmlUrl?: string;
  metrics?: {
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    characterCount: number;
  };
}

export interface MetricByDay {
  date: string; // YYYY-MM-DD
  paperCount: number;
  lastUpdated: string;
}

export interface IngestionJob {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  papersRetrieved?: number;
  upsertedCount?: number;
  modifiedCount?: number;
  durationMs?: number;
  error?: string;
  logs: string[];
}

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'llm_metrics';
const COLLECTION_NAME = 'papers';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db } | null> {
  if (!MONGODB_URI) {
    console.warn('[MongoDB] MONGODB_URI environment variable is not set.');
    return null;
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    // Ensure index on arxivId and publishedDate
    const collection = db.collection<ArxivPaper>(COLLECTION_NAME);
    await collection.createIndex({ arxivId: 1 }, { unique: true });
    await collection.createIndex({ publishedDate: 1 });

    cachedClient = client;
    cachedDb = db;
    return { client, db };
  } catch (error) {
    console.error('[MongoDB] Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
}

export function computePaperMetrics(abstract: string) {
  const words = abstract.trim().split(/\s+/).filter(Boolean);
  const sentences = abstract.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;
  const avgSentenceLength = Number((wordCount / sentenceCount).toFixed(2));
  const characterCount = abstract.length;

  return {
    wordCount,
    sentenceCount,
    avgSentenceLength,
    characterCount
  };
}
