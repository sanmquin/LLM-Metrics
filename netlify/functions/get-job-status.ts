import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { connectToDatabase, IngestionJob } from '../../src/lib/db';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const jobId = queryParams.jobId;

    const conn = await connectToDatabase();

    if (!conn) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          connected: false,
          message: 'MongoDB URI is not configured. Live job tracking is in mock mode.'
        })
      };
    }

    const { db } = conn;
    const collection = db.collection<IngestionJob>('ingestion_jobs');

    let job: IngestionJob | null = null;

    if (jobId) {
      job = await collection.findOne({ jobId });
    } else {
      // Find the most recent job
      const recentJobs = await collection.find({}).sort({ startedAt: -1 }).limit(1).toArray();
      job = recentJobs.length > 0 ? recentJobs[0] : null;
    }

    if (!job) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          connected: true,
          found: false,
          message: jobId ? `Job [${jobId}] not found.` : 'No ingestion jobs found.'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        connected: true,
        found: true,
        job
      })
    };
  } catch (error: any) {
    console.error('[get-job-status] Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        connected: false,
        error: error?.message || 'Failed to retrieve job status'
      })
    };
  }
};
