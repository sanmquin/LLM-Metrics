import { XMLParser } from 'fast-xml-parser';
import { ArxivPaper, computePaperMetrics } from './db';

export interface ArxivFetchResult {
  papers: ArxivPaper[];
  totalResults: number;
  rawXmlLength: number;
  fetchedAt: string;
  logs: string[];
}

export function parseArxivXml(xmlData: string, logs: string[] = []): ArxivPaper[] {
  logs.push(`[ArXiv Parser] Parsing XML string (length: ${xmlData.length} chars)`);

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => ['entry', 'author', 'category', 'link'].includes(name)
  });

  const parsed = parser.parse(xmlData);
  const feed = parsed.feed || parsed['atom:feed'] || parsed;

  if (!feed) {
    logs.push('[ArXiv Parser Warning] No root <feed> element found in XML');
    return [];
  }

  const entries = feed.entry || feed['atom:entry'] || [];
  const entryList = Array.isArray(entries) ? entries : [entries];
  logs.push(`[ArXiv Parser] Found ${entryList.length} entry elements in feed`);

  const papers: ArxivPaper[] = [];

  for (const entry of entryList) {
    try {
      const idRaw: string = typeof entry.id === 'object' ? entry.id['#text'] || '' : (entry.id || '');
      // Extract arXiv ID (e.g., http://arxiv.org/abs/2502.99999v1 or 2502.99999v1)
      const arxivIdMatch = idRaw.match(/arxiv\.org\/abs\/([^/]+)/i);
      const arxivId = arxivIdMatch ? arxivIdMatch[1] : (idRaw.replace(/^https?:\/\/[^/]+\/abs\//, '') || 'unknown');

      const titleRaw = typeof entry.title === 'object' ? entry.title['#text'] || '' : (entry.title || '');
      const summaryRaw = typeof entry.summary === 'object' ? entry.summary['#text'] || '' : (entry.summary || '');

      const title = titleRaw.replace(/\s+/g, ' ').trim();
      const abstract = summaryRaw.replace(/\s+/g, ' ').trim();

      // Parse authors
      let authors: string[] = [];
      if (entry.author) {
        const authorList = Array.isArray(entry.author) ? entry.author : [entry.author];
        authors = authorList
          .map((a: any) => {
            if (typeof a === 'string') return a;
            if (typeof a.name === 'string') return a.name;
            if (typeof a.name === 'object' && a.name['#text']) return a.name['#text'];
            return '';
          })
          .filter(Boolean);
      }

      // Parse categories
      let categories: string[] = [];
      if (entry.category) {
        const catList = Array.isArray(entry.category) ? entry.category : [entry.category];
        categories = catList
          .map((c: any) => c['@_term'] || c.term)
          .filter(Boolean);
      }

      const publishedRaw = entry.published || new Date().toISOString();
      const publishedAt = new Date(publishedRaw);
      const publishedDate = publishedAt.toISOString().slice(0, 10); // YYYY-MM-DD

      const primaryCategory = categories[0] || 'cs.AI';

      // Find links
      let pdfUrl = '';
      let htmlUrl = `https://arxiv.org/abs/${arxivId}`;
      if (entry.link) {
        const links = Array.isArray(entry.link) ? entry.link : [entry.link];
        for (const link of links) {
          if (link['@_title'] === 'pdf' || link['@_type'] === 'application/pdf') {
            pdfUrl = link['@_href'];
          }
        }
      }

      if (title && abstract) {
        const paper: ArxivPaper = {
          arxivId,
          title,
          abstract,
          authors,
          categories,
          publishedDate,
          publishedAt,
          updatedAt: new Date(),
          collectedAt: new Date(),
          primaryCategory,
          pdfUrl,
          htmlUrl,
          metrics: computePaperMetrics(abstract)
        };

        papers.push(paper);
      }
    } catch (err: any) {
      logs.push(`[ArXiv Parser Error] Failed to parse entry: ${err?.message || err}`);
    }
  }

  logs.push(`[ArXiv Parser] Successfully parsed ${papers.length} papers`);
  return papers;
}

export async function fetchArxivLastDayPapers(logs: string[] = []): Promise<ArxivFetchResult> {
  const category = 'cat:cs.AI';
  // Query arXiv API for cs.AI sorted by submittedDate descending
  const url = `https://export.arxiv.org/api/query?search_query=${category}&start=0&max_results=50&sortBy=submittedDate&sortOrder=descending`;

  logs.push(`[ArXiv Fetcher] Requesting arXiv API URL: ${url}`);
  const response = await fetch(url);

  if (!response.ok) {
    const errText = `[ArXiv Fetcher Error] HTTP ${response.status}: ${response.statusText}`;
    logs.push(errText);
    throw new Error(errText);
  }

  const xmlText = await response.text();
  logs.push(`[ArXiv Fetcher] Received XML response of size ${xmlText.length} bytes`);

  const papers = parseArxivXml(xmlText, logs);

  return {
    papers,
    totalResults: papers.length,
    rawXmlLength: xmlText.length,
    fetchedAt: new Date().toISOString(),
    logs
  };
}
