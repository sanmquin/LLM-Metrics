import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { connectToDatabase, ArxivPaper, IngestionJob } from '../../src/lib/db';
import { fetchArxivLastDayPapers, formatLogEntry } from '../../src/lib/arxiv';

/**
 * Netlify Background Function: `fetch-arxiv-background`
 * Netlify background functions run asynchronously for up to 15 minutes.
 * Naming convention ending in `-background.ts` enables background execution.
 */
export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const logs: string[] = [];
  const startTime = Date.now();

  let jobId = '';
  try {
    if (event.body) {
      const parsed = JSON.parse(event.body);
      if (parsed && parsed.jobId) {
        jobId = String(parsed.jobId);
      }
    }
  } catch (e) {
    // ignore json parse error
  }

  if (!jobId && event.queryStringParameters && event.queryStringParameters.jobId) {
    jobId = event.queryStringParameters.jobId;
  }

  if (!jobId) {
    jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  logs.push(formatLogEntry('INFO', 'Background Task', `Ingestion job [${jobId}] started`));

  let conn: Awaited<ReturnType<typeof connectToDatabase>> = null;
  try {
    conn = await connectToDatabase();
  } catch (e) {
    logs.push(formatLogEntry('WARN', 'Database', `Could not connect to MongoDB Atlas: ${e}`));
  }

  const updateJobStatus = async (
    status: 'running' | 'completed' | 'failed',
    extra: Partial<IngestionJob> = {}
  ) => {
    if (!conn) return;
    try {
      const { db } = conn;
      const jobsCol = db.collection<IngestionJob>('ingestion_jobs');
      await jobsCol.updateOne(
        { jobId },
        {
          $set: {
            jobId,
            status,
            updatedAt: new Date(),
            logs: [...logs],
            ...extra
          },
          $setOnInsert: {
            startedAt: new Date(startTime)
          }
        },
        { upsert: true }
      );
    } catch (err) {
      console.error('Failed to update ingestion job status in DB:', err);
    }
  };

  await updateJobStatus('running');

  try {
    logs.push(formatLogEntry('INFO', 'Background Task', 'Fetching papers from arXiv API for subject cs.AI...'));
    const result = await fetchArxivLastDayPapers(logs);

    logs.push(formatLogEntry('INFO', 'Background Task', `Fetched ${result.papers.length} papers from arXiv.`));

    let upsertCount = 0;
    let modifiedCount = 0;

    if (!conn) {
      logs.push(formatLogEntry('WARN', 'Background Task', 'MONGODB_URI is not defined. Results will not be saved to MongoDB Atlas.'));
    } else {
      const { db } = conn;
      const collection = db.collection<ArxivPaper>('papers');

      logs.push(formatLogEntry('INFO', 'Background Task', 'Syncing papers to MongoDB Atlas collection "papers"...'));

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
          logs.push(formatLogEntry('ERROR', 'Background Task', `Failed to write paper ${paper.arxivId}: ${err?.message || err}`));
        }
      }

      logs.push(formatLogEntry('INFO', 'Background Task', `Database operation complete. Upserted: ${upsertCount}, Updated: ${modifiedCount}`));
    }

    const durationMs = Date.now() - startTime;
    logs.push(formatLogEntry('INFO', 'Background Task', `Finished execution in ${durationMs}ms`));

    await updateJobStatus('completed', {
      completedAt: new Date(),
      papersRetrieved: result.papers.length,
      upsertedCount: upsertCount,
      modifiedCount: modifiedCount,
      durationMs
    });

    console.log(logs.join('\n'));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
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
    const durationMs = Date.now() - startTime;
    logs.push(formatLogEntry('ERROR', 'Background Task', `Ingestion failed: ${errorMsg}`));
    console.error('[Background Task Error]', error);

    await updateJobStatus('failed', {
      completedAt: new Date(),
      error: errorMsg,
      durationMs
    });

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        success: false,
        error: errorMsg,
        logs
      })
    };
  }
};
