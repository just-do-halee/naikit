import React, { useState } from "react";
import { InlineWildcardSegment as InlineWildcardSegmentType } from "@/core/segment-model/types";
import BaseSegment from "./BaseSegment";
import { useActiveModeReactive, useSegmentOperations } from "@/state/react-bindings";

interface InlineWildcardSegmentProps {
  segment: InlineWildcardSegmentType;
  isNested?: boolean;
}

/**
 * Inline Wildcard Segment Component
 * 
 * Renders an inline wildcard segment with the following features:
 * - Shows available options with visual representation
 * - Allows option selection/randomization in fine-tune mode
 * - Compact display in compose mode
 */
export const InlineWildcardSegment: React.FC<InlineWildcardSegmentProps> = ({
  segment,
  isNested = false
}) => {
  const { options, metadata } = segment;
  const [activeMode, _isLoading, _error] = useActiveModeReactive();
  const { updateSegment } = useSegmentOperations();
  
  // Local state for dropdown
  const [isOpen, setIsOpen] = useState(false);
  // Track the currently selected option for UI preview
  const [previewOption, setPreviewOption] = useState<number>(-1);
  
  // Get color or use default
  const color = metadata?.color || "#9d4edd";
  
  // Handle option selection (for UI preview only)
  const handlePreviewOption = (index: number) => {
    setPreviewOption(index);
  };
  
  // Toggle dropdown
  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  // Handle rearranging options
  const handleMoveOption = (fromIndex: number, direction: 'up' | 'down') => {
    if (!options || options.length < 2) return;
    
    const newOptions = [...options];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    // Check bounds
    if (toIndex < 0 || toIndex >= newOptions.length) return;
    
    // Swap elements
    [newOptions[fromIndex], newOptions[toIndex]] = [newOptions[toIndex], newOptions[fromIndex]];
    
    // Update segment
    updateSegment<InlineWildcardSegmentType>(segment.id, {
      options: newOptions
    });
  };
  
  // In fine-tune mode, show detailed view with controls
  if (activeMode === "finetune" && activeMode !== null) {
    return (
      <BaseSegment segment={segment} isNested={isNested}>
        <div 
          className="inline-wildcard-segment relative rounded px-2 py-1 my-1"
          style={{ 
            backgroundColor: `${color}20`, // Use color with 20% opacity
            borderLeft: `3px solid ${color}`
          }}
        >
          <div className="inline-header flex items-center justify-between">
            <div className="inline-info">
              <span className="inline-type font-medium text-sm">
                Inline Options
              </span>
              <span className="inline-count ml-2 text-xs opacity-75">
                ({options.length})
              </span>
            </div>
            
            <button 
              className="inline-toggle text-xs p-1 rounded hover:bg-black hover:bg-opacity-20"
              onClick={handleToggleDropdown}
            >
              {previewOption >= 0 && previewOption < options.length 
                ? options[previewOption] 
                : "Random Option"}
              <span className="ml-1">{isOpen ? "▲" : "▼"}</span>
            </button>
          </div>
          
          {/* Preview area */}
          <div className="inline-preview text-sm mt-1 opacity-75">
            ({options.join(" | ")})
          </div>
          
          {/* Dropdown for option selection */}
          {isOpen && (
            <div className="inline-dropdown absolute z-10 mt-1 right-0 w-64 bg-gray-800 border border-gray-700 rounded shadow-lg">
              <div className="p-2">
                <div className="mb-2 text-xs font-medium text-center">Manage Options</div>
                {options.map((option, index) => (
                  <div key={`${option}-${index}`} className="flex items-center mb-1">
                    <div 
                      className={`flex-grow p-1 text-sm rounded ${previewOption === index ? 'bg-purple-700' : 'hover:bg-gray-700'}`}
                      onMouseEnter={() => handlePreviewOption(index)}
                      onMouseLeave={() => setPreviewOption(-1)}
                    >
                      {option}
                    </div>
                    <div className="flex ml-1">
                      <button 
                        className="p-1 text-xs opacity-75 hover:opacity-100"
                        onClick={() => handleMoveOption(index, 'up')}
                        disabled={index === 0}
                      >
                        ▲
                      </button>
                      <button 
                        className="p-1 text-xs opacity-75 hover:opacity-100"
                        onClick={() => handleMoveOption(index, 'down')}
                        disabled={index === options.length - 1}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </BaseSegment>
    );
  }
  
  // In compose mode, show compact representation
  return (
    <BaseSegment segment={segment} isNested={isNested}>
      <div 
        className="inline-wildcard-segment-compose rounded px-2 py-1 my-1"
        style={{ 
          backgroundColor: `${color}10`, // Use color with 10% opacity
          borderLeft: `2px solid ${color}`
        }}
      >
        <span className="inline-options text-sm">
          ({options.join(" | ")})
        </span>
      </div>
    </BaseSegment>
  );
};

export default InlineWildcardSegment;