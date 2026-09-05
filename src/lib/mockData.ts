import { ArxivPaper } from '../lib/db';

export const MOCK_PAPERS: ArxivPaper[] = [
  {
    arxivId: '2502.18901',
    title: 'Evaluating LLM Abstract Synthesis for AI Educational Curricula',
    abstract: 'Abstract writing is a foundational scientific skill. In this work, we present a systematic framework to evaluate language metrics across automated text summarizers and academic paper abstracts in Artificial Intelligence. By collecting daily cs.AI arXiv abstracts, we measure syntactic complexity, lexical diversity, and sentence length distribution to train educational feedback models for graduate students.',
    authors: ['A. Vance', 'E. Chen', 'M. Rahimi'],
    categories: ['cs.AI', 'cs.CL', 'cs.CY'],
    publishedDate: new Date().toISOString().slice(0, 10),
    publishedAt: new Date(),
    updatedAt: new Date(),
    collectedAt: new Date(),
    primaryCategory: 'cs.AI',
    htmlUrl: 'https://arxiv.org/abs/2502.18901',
    metrics: {
      wordCount: 68,
      sentenceCount: 3,
      avgSentenceLength: 22.67,
      characterCount: 432
    }
  },
  {
    arxivId: '2502.18850',
    title: 'Direct Preference Optimization for Academic Writing Clarity and Conciseness',
    abstract: 'Large Language Models often generate overly verbose or passive abstracts. We introduce DPO-Abstract, a fine-tuned instruction model designed to simplify scientific explanations while maintaining field-specific terminology. Experiments show a 24% improvement in student comprehension speed when reviewing machine-refined paper abstracts.',
    authors: ['J. Smith', 'L. Zhang'],
    categories: ['cs.AI', 'cs.LG'],
    publishedDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    publishedAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(),
    collectedAt: new Date(),
    primaryCategory: 'cs.AI',
    htmlUrl: 'https://arxiv.org/abs/2502.18850',
    metrics: {
      wordCount: 45,
      sentenceCount: 3,
      avgSentenceLength: 15.00,
      characterCount: 310
    }
  },
  {
    arxivId: '2502.17900',
    title: 'Benchmarking AI Educational Tools via Daily Feed Ingestion',
    abstract: 'We present a continuous dataset pipeline for tracking linguistic evolution in AI research publications. The platform ingests arXiv papers daily and extracts key prose metrics to assist educators in evaluating writing benchmarks across student cohorts.',
    authors: ['K. Patel', 'S. Gupta'],
    categories: ['cs.AI'],
    publishedDate: new Date(Date.now() - 172800000).toISOString().slice(0, 10),
    publishedAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(),
    collectedAt: new Date(),
    primaryCategory: 'cs.AI',
    htmlUrl: 'https://arxiv.org/abs/2502.17900',
    metrics: {
      wordCount: 36,
      sentenceCount: 2,
      avgSentenceLength: 18.00,
      characterCount: 245
    }
  }
];

export const MOCK_DAILY_METRICS = [
  { date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), paperCount: 14, avgWordCount: 185, avgSentenceLength: 21.2 },
  { date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10), paperCount: 22, avgWordCount: 192, avgSentenceLength: 22.8 },
  { date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10), paperCount: 19, avgWordCount: 178, avgSentenceLength: 19.5 },
  { date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), paperCount: 31, avgWordCount: 204, avgSentenceLength: 23.1 },
  { date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10), paperCount: 28, avgWordCount: 198, avgSentenceLength: 21.9 },
  { date: new Date().toISOString().slice(0, 10), paperCount: 35, avgWordCount: 210, avgSentenceLength: 22.4 }
];
