import React from "react";
import { 
  Segment, 
  isTextSegment, 
  isWeightedSegment, 
  isPresetSegment, 
  isInlineWildcardSegment 
} from "@/core/segment-model/types";

import TextSegment from "./TextSegment";
import WeightedSegment from "./WeightedSegment";
import PresetSegment from "./PresetSegment";
import InlineWildcardSegment from "./InlineWildcardSegment";

interface SegmentRendererProps {
  segment: Segment;
  isNested?: boolean;
}

/**
 * Segment Renderer Component
 * 
 * This component serves as a dispatcher that renders the appropriate
 * segment component based on the segment type.
 */
export const SegmentRenderer: React.FC<SegmentRendererProps> = ({
  segment,
  isNested = false
}) => {
  // Use type guards to determine the correct renderer
  if (isTextSegment(segment)) {
    return <TextSegment segment={segment} isNested={isNested} />;
  }
  
  if (isWeightedSegment(segment)) {
    return <WeightedSegment segment={segment} isNested={isNested} />;
  }
  
  if (isPresetSegment(segment)) {
    return <PresetSegment segment={segment} isNested={isNested} />;
  }
  
  if (isInlineWildcardSegment(segment)) {
    return <InlineWildcardSegment segment={segment} isNested={isNested} />;
  }
  
  // Fallback for unknown segment types
  return (
    <div className="unknown-segment p-1 border border-gray-600 rounded">
      <div className="text-xs text-gray-400">Unknown Segment Type</div>
      <div className="text-xs font-mono opacity-50">
        {(() => {
          // Extract ID safely if available
          if (segment && typeof segment === 'object') {
            const segmentObj = segment as object;
            if ('id' in segmentObj && segmentObj.hasOwnProperty('id')) {
              const id = (segmentObj as {id: unknown}).id;
              return `ID: ${String(id)}`;
            }
          }
          return "ID: unknown";
        })()}
      </div>
    </div>
  );
};

export default SegmentRenderer;