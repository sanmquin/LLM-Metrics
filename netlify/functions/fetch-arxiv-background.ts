import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { connectToDatabase, ArxivPaper } from '../../src/lib/db';
import { fetchArxivLastDayPapers } from '../../src/lib/arxiv';

/**
 * Netlify Background Function: `fetch-arxiv-background`
 * Netlify background functions run asynchronously for up to 15 minutes.
 * Naming convention ending in `-background.ts` enables background execution.
 */
export const handler: Handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  const logs: string[] = [];
  const startTime = Date.now();
  logs.push(`[Background Task] Ingestion started at ${new Date().toISOString()}`);

  try {
    logs.push('[Background Task] Fetching papers from arXiv API for subject cs.AI...');
    const result = await fetchArxivLastDayPapers(logs);

    logs.push(`[Background Task] Fetched ${result.papers.length} papers from arXiv.`);

    const conn = await connectToDatabase();
    let upsertCount = 0;
    let modifiedCount = 0;

    if (!conn) {
      logs.push('[Background Task Warning] MONGODB_URI is not defined. Results will not be saved to MongoDB Atlas.');
    } else {
      const { db } = conn;
      const collection = db.collection<ArxivPaper>('papers');

      logs.push('[Background Task] Syncing papers to MongoDB Atlas collection "papers"...');

      for (const paper of result.papers) {
        try {
          const res = await collection.updateOne(
            { arxivId: paper.arxivId },
            {
              $set: {
                title: paper.title,
                abstract: paper.abstract,
                authors: paper.authors,
                categories: paper.categories,
                publishedDate: paper.publishedDate,
                publishedAt: paper.publishedAt,
                primaryCategory: paper.primaryCategory,
                pdfUrl: paper.pdfUrl,
                htmlUrl: paper.htmlUrl,
                metrics: paper.metrics,
                updatedAt: new Date(),
              },
              $setOnInsert: {
                collectedAt: new Date(),
              }
            },
            { upsert: true }
          );

          if (res.upsertedCount > 0) upsertCount++;
          if (res.modifiedCount > 0) modifiedCount++;
        } catch (err: any) {
          logs.push(`[Background Task Error] Failed to write paper ${paper.arxivId}: ${err?.message || err}`);
        }
      }

      logs.push(`[Background Task] Database operation complete. Upserted: ${upsertCount}, Updated: ${modifiedCount}`);
    }

    const durationMs = Date.now() - startTime;
    logs.push(`[Background Task] Finished execution in ${durationMs}ms`);

    console.log(logs.join('\n'));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'ArXiv paper ingestion completed',
        papersRetrieved: result.papers.length,
        upsertedCount: upsertCount,
        modifiedCount: modifiedCount,
        durationMs,
        logs
      })
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    logs.push(`[Background Task FATAL] Ingestion failed: ${errorMsg}`);
    console.error('[Background Task Error]', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: errorMsg,
        logs
      })
    };
  }
};
