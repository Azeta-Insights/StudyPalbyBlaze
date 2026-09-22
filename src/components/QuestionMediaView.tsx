import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Image as ImageIcon, ZoomIn } from 'lucide-react';

interface QuestionMediaViewProps {
  imageUrl?: string | null;
  passage?: string | null;
}

export const QuestionMediaView: React.FC<QuestionMediaViewProps> = ({
  imageUrl,
  passage,
}) => {
  const [isPassageExpanded, setIsPassageExpanded] = useState(true);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  if (!imageUrl && !passage) return null;

  return (
    <div className="space-y-4 mb-4">
      {/* Reading Passage View */}
      {passage && (
        <div className="rounded-2xl bg-slate-800/80 border border-slate-700 overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setIsPassageExpanded(!isPassageExpanded)}
            className="w-full flex items-center justify-between p-3.5 bg-slate-800 hover:bg-slate-750 transition text-left"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-400">
              <BookOpen className="w-4 h-4" />
              <span>Reading Passage / Comprehension Context</span>
            </div>
            {isPassageExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {isPassageExpanded && (
            <div className="p-4 border-t border-slate-700/60 bg-slate-900/60 text-slate-200 text-sm leading-relaxed whitespace-pre-line font-serif">
              {passage}
            </div>
          )}
        </div>
      )}

      {/* Diagram / Question Figure View */}
      {imageUrl && (
        <div className="rounded-2xl bg-slate-900 border border-slate-700/80 p-3 overflow-hidden text-center relative group">
          <div className="relative inline-block max-w-full">
            <img
              src={imageUrl}
              alt="Question Diagram or Formula"
              className="max-h-64 rounded-xl object-contain mx-auto bg-white/5 p-2 transition-transform duration-200"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => setIsImageZoomed(true)}
              className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700 opacity-90 hover:opacity-100 transition"
              title="Zoom diagram"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Modal */}
          {isImageZoomed && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm"
              onClick={() => setIsImageZoomed(false)}
            >
              <div className="relative max-w-3xl max-h-[85vh] p-3 bg-slate-900 border border-slate-700 rounded-2xl overflow-auto">
                <img
                  src={imageUrl}
                  alt="Question Diagram Zoomed"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg mx-auto"
                />
                <p className="text-center text-xs text-slate-400 mt-2">
                  Click anywhere to close
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
