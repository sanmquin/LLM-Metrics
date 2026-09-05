import { useState } from 'react';
import { Search, ExternalLink, BookOpen, Users, Calendar, Type } from 'lucide-react';
import { ArxivPaper } from '../lib/db';

interface PaperListProps {
  papers: ArxivPaper[];
}

export default function PaperList({ papers }: PaperListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaper, setSelectedPaper] = useState<ArxivPaper | null>(null);

  const filteredPapers = papers.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.arxivId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authors?.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/90 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search titles, abstracts, authors or arXiv ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="text-xs text-gray-400">
          Showing <span className="text-white font-medium">{filteredPapers.length}</span> of {papers.length} papers
        </div>
      </div>

      {/* Papers Grid / Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paper List Column */}
        <div className={`space-y-3 ${selectedPaper ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          {filteredPapers.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-gray-800 bg-gray-900/50 text-gray-400">
              No matching arXiv papers found.
            </div>
          ) : (
            filteredPapers.map((paper) => {
              const isSelected = selectedPaper?.arxivId === paper.arxivId;
              return (
                <div
                  key={paper.arxivId}
                  onClick={() => setSelectedPaper(paper)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-950/30'
                      : 'border-gray-800 bg-gray-900/80 hover:border-gray-700 hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-gray-800 text-indigo-300 border border-gray-700">
                      arXiv:{paper.arxivId}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {paper.publishedDate}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2 leading-snug">
                    {paper.title}
                  </h3>

                  <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                    {paper.abstract}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-800/60">
                    <span className="truncate max-w-[200px] flex items-center gap-1">
                      <Users className="w-3 h-3 text-gray-400" /> {paper.authors?.slice(0, 2).join(', ')}
                      {paper.authors?.length > 2 ? ' et al.' : ''}
                    </span>
                    {paper.metrics && (
                      <span className="font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded text-[11px]">
                        {paper.metrics.wordCount} words
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Paper Detail Panel */}
        {selectedPaper && (
          <div className="lg:col-span-2 p-6 rounded-xl border border-gray-800 bg-gray-900/90 space-y-6 sticky top-24 self-start max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-gray-800 pb-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    arXiv:{selectedPaper.arxivId}
                  </span>
                  <span className="text-xs text-gray-400">{selectedPaper.publishedDate}</span>
                </div>
                <h2 className="text-lg font-bold text-white leading-snug">{selectedPaper.title}</h2>
              </div>
              <button
                onClick={() => setSelectedPaper(null)}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800 border border-gray-700 shrink-0 cursor-pointer"
              >
                Close Panel
              </button>
            </div>

            {/* Author List */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Authors
              </h4>
              <p className="text-xs text-gray-300">{selectedPaper.authors?.join(', ')}</p>
            </div>

            {/* Abstract Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Abstract
              </h4>
              <div className="p-4 rounded-lg bg-gray-950 border border-gray-800 text-sm text-gray-200 leading-relaxed font-sans">
                {selectedPaper.abstract}
              </div>
            </div>

            {/* Language & Prose Metrics Grid */}
            {selectedPaper.metrics && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" /> Abstract Educational Language Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg">
                    <p className="text-[11px] text-gray-400">Word Count</p>
                    <p className="text-base font-mono font-bold text-indigo-400 mt-0.5">
                      {selectedPaper.metrics.wordCount}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg">
                    <p className="text-[11px] text-gray-400">Sentence Count</p>
                    <p className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                      {selectedPaper.metrics.sentenceCount}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg">
                    <p className="text-[11px] text-gray-400">Avg Words / Sentence</p>
                    <p className="text-base font-mono font-bold text-blue-400 mt-0.5">
                      {selectedPaper.metrics.avgSentenceLength}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg">
                    <p className="text-[11px] text-gray-400">Character Count</p>
                    <p className="text-base font-mono font-bold text-purple-400 mt-0.5">
                      {selectedPaper.metrics.characterCount}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Categories & External Link */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-800">
              <div className="flex flex-wrap gap-1.5">
                {selectedPaper.categories?.map((cat) => (
                  <span
                    key={cat}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {selectedPaper.htmlUrl && (
                <a
                  href={selectedPaper.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span>View on arXiv</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
