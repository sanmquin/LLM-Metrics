import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { connectToDatabase, ArxivPaper } from '../../src/lib/db';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const limit = Math.min(parseInt(queryParams.limit || '50', 10), 100);
    const date = queryParams.date;

    const conn = await connectToDatabase();

    if (!conn) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          connected: false,
          papers: [],
          message: 'MongoDB URI is not configured.'
        })
      };
    }

    const { db } = conn;
    const collection = db.collection<ArxivPaper>('papers');

    const filter: any = {};
    if (date) {
      filter.publishedDate = date;
    }

    const papers = await collection
      .find(filter)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        connected: true,
        count: papers.length,
        papers
      })
    };
  } catch (error: any) {
    console.error('[get-papers] Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        connected: false,
        error: error?.message || 'Failed to retrieve papers'
      })
    };
  }
};
