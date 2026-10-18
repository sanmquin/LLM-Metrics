import { describe, it, expect } from 'vitest';
import { parseArxivXml } from '../lib/arxiv';
import { computePaperMetrics } from '../lib/db';

describe('arXiv XML Parser', () => {
  it('correctly parses paper entries, titles, abstracts, and authors', () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title type="text">ArXiv Query Results</title>
      <entry>
        <id>http://arxiv.org/abs/2502.99999v1</id>
        <title type="html">  Benchmarking   Large Language Models for Academic Abstract Generation  </title>
        <summary type="html">  In this paper, we present an empirical evaluation of LLMs when writing computer science paper abstracts. We analyze word counts and sentence structure.  </summary>
        <author><name>Jane Doe</name></author>
        <author><name>John Smith</name></author>
        <published>2025-02-20T10:00:00Z</published>
        <category term="cs.AI" scheme="http://arxiv.org/schemas/atom"/>
        <link href="http://arxiv.org/abs/2502.99999v1" rel="alternate" type="text/html"/>
      </entry>
    </feed>`;

    const logs: string[] = [];
    const papers = parseArxivXml(sampleXml, logs);

    expect(papers.length).toBe(1);
    expect(papers[0].arxivId).toBe('2502.99999v1');
    expect(papers[0].title).toBe('Benchmarking Large Language Models for Academic Abstract Generation');
    expect(papers[0].authors).toEqual(['Jane Doe', 'John Smith']);
    expect(papers[0].publishedDate).toBe('2025-02-20');
    expect(papers[0].metrics?.wordCount).toBeGreaterThan(10);
  });
});

describe('Language Metrics Utility', () => {
  it('calculates word count, sentence count, and average sentence length', () => {
    const text = "First sentence is clear. Second sentence provides detailed explanations. Third sentence concludes.";
    const metrics = computePaperMetrics(text);

    expect(metrics.wordCount).toBe(12);
    expect(metrics.sentenceCount).toBe(3);
    expect(metrics.avgSentenceLength).toBe(4.0);
  });
});
