import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Calendar, Type } from 'lucide-react';

interface MetricItem {
  date: string;
  paperCount: number;
  avgWordCount?: number;
  avgSentenceLength?: number;
}

interface MetricsChartProps {
  metrics: MetricItem[];
}

export default function MetricsChart({ metrics }: MetricsChartProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="p-12 text-center border border-gray-800 rounded-xl bg-gray-900/50">
        <p className="text-gray-400">No daily metric data recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart 1: Papers Collected By Day */}
      <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/90 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-950 text-indigo-400 rounded-lg border border-indigo-800/40">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ArXiv Papers Collected by Day</h2>
              <p className="text-xs text-gray-400">Daily breakdown of ingested Artificial Intelligence (cs.AI) papers</p>
            </div>
          </div>
          <span className="text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-1 rounded-md">
            cs.AI
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', color: '#f3f4f6' }}
                cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
              />
              <Bar dataKey="paperCount" name="Papers Ingested" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Language & Complexity Metrics */}
      <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/90 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800/40">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Abstract Prose & Complexity Trends</h2>
              <p className="text-xs text-gray-400">Average word count & sentence length metrics across collected abstracts</p>
            </div>
          </div>
          <span className="text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-md">
            Educational Benchmark
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} />
              <YAxis yAxisId="left" stroke="#10b981" fontSize={12} tickLine={false} domain={['dataMin - 20', 'dataMax + 20']} />
              <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={12} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', color: '#f3f4f6' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line yAxisId="left" type="monotone" dataKey="avgWordCount" name="Avg Abstract Word Count" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="avgSentenceLength" name="Avg Words / Sentence" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
