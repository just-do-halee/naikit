import React, { useMemo } from "react";
import { TextSegment as TextSegmentType } from "@/core/segment-model/types";
import BaseSegment from "./BaseSegment";
import { useActiveModeReactive } from "@/state/react-bindings";

interface TextSegmentProps {
  segment: TextSegmentType;
  isNested?: boolean;
}

/**
 * Text Segment Component
 * 
 * Renders a plain text segment with the following features:
 * - Selectable text
 * - Different rendering based on mode (compose/finetune)
 * - Ability to edit text in compose mode
 */
export const TextSegment: React.FC<TextSegmentProps> = ({
  segment,
  isNested = false
}) => {
  const { content } = segment;
  const [activeMode, _isLoading, _error] = useActiveModeReactive(); // Use _ prefix for unused variables
  
  // Make text editable only in compose mode
  const isComposeMode = activeMode === "compose" || activeMode === null;
  
  // Memorize the content to avoid unnecessary re-renders
  const displayContent = useMemo(() => {
    // In the future, this could include text highlighting or other formatting
    return content;
  }, [content]);
  
  // Handle double-click to edit in compose mode (future enhancement)
  const handleDoubleClick = () => {
    if (isComposeMode) {
      console.log("Double-clicked text segment:", segment.id);
      // Future: Will implement inline editing here once TipTap is integrated
    }
  };
  
  // In fine-tune mode, text segments are just displayed with less emphasis
  if (activeMode === "finetune" && activeMode !== null) {
    return (
      <BaseSegment segment={segment} isNested={isNested}>
        <span className="text-segment text-gray-300">
          {displayContent}
        </span>
      </BaseSegment>
    );
  }
  
  // In compose mode, text segments are more prominent and will be editable
  return (
    <BaseSegment 
      segment={segment} 
      isNested={isNested}
      onDoubleClick={handleDoubleClick}
    >
      <span className="text-segment text-white">
        {displayContent}
      </span>
    </BaseSegment>
  );
};

export default TextSegment;