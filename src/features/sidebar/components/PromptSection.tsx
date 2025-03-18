import React, { useState } from "react";
import { useSegment as useSegmentReactive, useCompiledSegment } from "@/state/react-bindings";
import { SegmentRenderer } from "./segments";
import { PromptEditor } from "./editor";
import { useAppMode } from "@/state/segment-react-bindings";

interface PromptSectionProps {
  title: string;
  segmentId: string | null;
  type: "positive" | "negative";
  characterIndex?: number;
}

/**
 * Prompt Section Component
 * 
 * Displays a prompt section with title and editable content area.
 * Used for both positive and negative prompts.
 */
export const PromptSection: React.FC<PromptSectionProps> = ({
  title,
  segmentId,
  type,
  characterIndex,
}) => {
  // Get segment data
  const segment = useSegmentReactive(segmentId);
  
  // Get the compiled text representation (for clipboard and fallback)
  const compiledText = useCompiledSegment(segmentId);
  
  // Get current mode
  const mode = useAppMode();
  
  // State for view mode toggle (segmented, compiled, or editor)
  const [viewMode, setViewMode] = useState<"segmented" | "compiled" | "editor">("editor");
  
  // Determine background color based on type
  const bgColor = type === "positive" 
    ? "bg-gray-800 border-l-2 border-blue-500" 
    : "bg-gray-800 border-l-2 border-red-500";
  
  // Add character index to title if provided
  const sectionTitle = characterIndex !== undefined
    ? `${title} - Character ${characterIndex}`
    : title;

  // Handle clipboard copy
  const handleCopy = () => {
    if (compiledText) {
      navigator.clipboard.writeText(compiledText)
        .then(() => {
          console.log("Copied to clipboard:", compiledText);
          // You might want to add a toast notification here
        })
        .catch(err => {
          console.error("Failed to copy:", err);
        });
    }
  };

  // Toggle between view modes
  const toggleViewMode = () => {
    setViewMode(prev => {
      if (prev === "segmented") return "compiled";
      if (prev === "compiled") return "editor";
      return "segmented";
    });
  };

  return (
    <div className="prompt-section mb-3">
      <div className="prompt-header flex justify-between items-center px-3 py-1 bg-gray-700 rounded-t text-sm text-white">
        <h3 className="font-medium">{sectionTitle}</h3>
        <div className="flex space-x-1">
          <button 
            className="text-gray-300 hover:text-white p-1" 
            title={`Switch to ${viewMode === "segmented" ? "compiled" : viewMode === "compiled" ? "editor" : "segmented"} view`}
            onClick={toggleViewMode}
          >
            {viewMode === "segmented" ? <CodeIcon /> : 
             viewMode === "compiled" ? <EditIcon /> : <SegmentsIcon />}
          </button>
          <button 
            className="text-gray-300 hover:text-white p-1" 
            title="Copy to clipboard"
            onClick={handleCopy}
          >
            <ClipboardIcon />
          </button>
          <button 
            className="text-gray-300 hover:text-white p-1" 
            title="Clear"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      
      <div className={`${bgColor} p-2 rounded-b h-auto min-h-32 overflow-y-auto`}>
        {!segment || !segmentId ? (
          <div className="text-gray-400 text-sm h-full flex items-center justify-center">
            No segment data available
          </div>
        ) : viewMode === "compiled" ? (
          // Compiled text view (raw text)
          <textarea 
            className="w-full h-full bg-transparent outline-none resize-none"
            placeholder={`Enter your ${type} prompt here...`}
            value={compiledText}
            readOnly
          />
        ) : viewMode === "editor" ? (
          // Editor view
          <PromptEditor 
            segmentId={segmentId} 
            placeholder={`Enter your ${type} prompt here...`}
            readOnly={mode !== 'compose'}
          />
        ) : (
          // Segmented view (visualized segments)
          <div className="segment-container">
            {segment ? 
              (() => {
                // Define proper type guard for Segment
                const isSegment = (obj: unknown): obj is import('@/core/segment-model/types').Segment => {
                  if (!obj || typeof obj !== 'object') return false;
                  
                  // Check for required properties with correct types
                  const segmentCandidate = obj as Partial<import('@/core/segment-model/types').Segment>;
                  
                  if (!segmentCandidate.id || typeof segmentCandidate.id !== 'string') {
                    return false;
                  }
                  
                  if (!segmentCandidate.type || 
                      !['text', 'weighted', 'preset', 'inline_wildcard'].includes(segmentCandidate.type)) {
                    return false;
                  }
                  
                  return true;
                };
                
                if (isSegment(segment)) {
                  return <SegmentRenderer segment={segment} />;
                }
                
                return (
                  <div className="text-gray-400 text-sm h-full flex items-center justify-center">
                    Invalid segment data structure
                  </div>
                );
              })()
              : 
              <div className="text-gray-400 text-sm h-full flex items-center justify-center">
                No segment data available
              </div>
            }
          </div>
        )}
      </div>
    </div>
  );
};

// Simple icon components
const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const CodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// TextIcon is no longer used since we're now using EditIcon and SegmentsIcon

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);

const SegmentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
  </svg>
);