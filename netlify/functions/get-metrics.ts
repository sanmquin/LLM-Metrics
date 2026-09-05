import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { connectToDatabase, ArxivPaper } from '../../src/lib/db';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

export const handler: Handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  try {
    const conn = await connectToDatabase();

    if (!conn) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          connected: false,
          metrics: [],
          totalPapers: 0,
          message: 'MongoDB URI is not configured. Displaying fallback UI metrics.'
        })
      };
    }

    const { db } = conn;
    const collection = db.collection<ArxivPaper>('papers');

    // Aggregate counts by publishedDate YYYY-MM-DD
    const pipeline = [
      {
        $group: {
          _id: '$publishedDate',
          paperCount: { $sum: 1 },
          avgWordCount: { $avg: '$metrics.wordCount' },
          avgSentenceLength: { $avg: '$metrics.avgSentenceLength' }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const aggregationResults = await collection.aggregate(pipeline).toArray();
    const totalPapers = await collection.countDocuments();

    const metrics = aggregationResults.map(item => ({
      date: item._id || 'Unknown',
      paperCount: item.paperCount || 0,
      avgWordCount: item.avgWordCount ? Math.round(item.avgWordCount) : 0,
      avgSentenceLength: item.avgSentenceLength ? Number(item.avgSentenceLength.toFixed(1)) : 0,
      lastUpdated: new Date().toISOString()
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        connected: true,
        totalPapers,
        metrics,
        lastUpdated: new Date().toISOString()
      })
    };
  } catch (error: any) {
    console.error('[get-metrics] Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        connected: false,
        error: error?.message || 'Failed to retrieve database metrics'
      })
    };
  }
};
