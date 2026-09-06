import { XMLParser } from 'fast-xml-parser';
import { ArxivPaper, computePaperMetrics } from './db';

export interface ArxivFetchResult {
  papers: ArxivPaper[];
  totalResults: number;
  rawXmlLength: number;
  fetchedAt: string;
  logs: string[];
}

export function formatLogEntry(level: 'INFO' | 'WARN' | 'ERROR', stage: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] [${stage}] ${message}`;
}

export function parseArxivXml(xmlData: string, logs: string[] = []): ArxivPaper[] {
  logs.push(formatLogEntry('INFO', 'ArXiv Parser', `Parsing XML string (length: ${xmlData.length} chars)`));

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => ['entry', 'author', 'category', 'link'].includes(name)
  });

  const parsed = parser.parse(xmlData);
  const feed = parsed.feed || parsed['atom:feed'] || parsed;

  if (!feed) {
    logs.push(formatLogEntry('WARN', 'ArXiv Parser', 'No root <feed> element found in XML'));
    return [];
  }

  const entries = feed.entry || feed['atom:entry'] || [];
  const entryList = Array.isArray(entries) ? entries : [entries];
  logs.push(formatLogEntry('INFO', 'ArXiv Parser', `Found ${entryList.length} entry elements in feed`));

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
      logs.push(formatLogEntry('ERROR', 'ArXiv Parser', `Failed to parse entry: ${err?.message || err}`));
    }
  }

  logs.push(formatLogEntry('INFO', 'ArXiv Parser', `Successfully parsed ${papers.length} papers`));
  return papers;
}

export interface FetchOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
}

export async function fetchArxivLastDayPapers(
  logs: string[] = [],
  options: FetchOptions = {}
): Promise<ArxivFetchResult> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 1000;
  const backoffFactor = options.backoffFactor ?? 2;

  const category = 'cat:cs.AI';
  const url = `https://export.arxiv.org/api/query?search_query=${category}&start=0&max_results=50&sortBy=submittedDate&sortOrder=descending`;

  logs.push(formatLogEntry('INFO', 'ArXiv Fetcher', `Requesting arXiv API URL: ${url}`));

  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= maxRetries) {
    try {
      attempt++;
      const headers: Record<string, string> = {
        'User-Agent': 'LLM-Metrics/1.0 (https://github.com/llm-metrics; contact: academic-bot@llm-metrics.org)',
        'Accept': 'application/atom+xml, application/xml, text/xml'
      };

      if (attempt > 1) {
        logs.push(formatLogEntry('INFO', 'ArXiv Fetcher', `Retry attempt ${attempt - 1}/${maxRetries} sending request...`));
      }

      const response = await fetch(url, { headers });

      if (response.ok) {
        const xmlText = await response.text();
        logs.push(formatLogEntry('INFO', 'ArXiv Fetcher', `Received XML response of size ${xmlText.length} bytes`));
        const papers = parseArxivXml(xmlText, logs);

        return {
          papers,
          totalResults: papers.length,
          rawXmlLength: xmlText.length,
          fetchedAt: new Date().toISOString(),
          logs
        };
      }

      const status = response.status;
      const statusText = response.statusText || 'Unknown Error';
      const isRateLimit = status === 429;
      const isServerError = status >= 500 && status < 600;

      const retryAfterHeader = response.headers.get('Retry-After');
      let retryWait = delay;
      if (retryAfterHeader) {
        const parsedRetry = parseInt(retryAfterHeader, 10);
        if (!isNaN(parsedRetry)) {
          retryWait = parsedRetry * 1000;
        }
      }

      const errMessage = isRateLimit
        ? `HTTP 429 Rate Limit exceeded: ${statusText}. ArXiv API query limit reached.`
        : `HTTP ${status}: ${statusText}`;

      if ((isRateLimit || isServerError) && attempt <= maxRetries) {
        logs.push(formatLogEntry('WARN', 'ArXiv Fetcher', `${errMessage} (Attempt ${attempt}/${maxRetries + 1}). Retrying in ${retryWait}ms...`));
        await new Promise((resolve) => setTimeout(resolve, retryWait));
        delay *= backoffFactor;
        continue;
      }

      logs.push(formatLogEntry('ERROR', 'ArXiv Fetcher', `Failed request with status ${status}: ${errMessage}`));
      throw new Error(`[ArXiv Fetcher Error] HTTP ${status}: ${statusText}`);
    } catch (err: any) {
      if (attempt <= maxRetries && !err?.message?.startsWith('[ArXiv Fetcher Error]')) {
        logs.push(formatLogEntry('WARN', 'ArXiv Fetcher', `Fetch exception: ${err?.message || err}. Retrying in ${delay}ms...`));
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= backoffFactor;
        continue;
      }
      const finalErrMsg = err?.message || String(err);
      if (!logs.some(l => l.includes(finalErrMsg))) {
        logs.push(formatLogEntry('ERROR', 'ArXiv Fetcher', finalErrMsg));
      }
      throw err;
    }
  }

  throw new Error('[ArXiv Fetcher Error] Maximum retries exceeded.');
}
