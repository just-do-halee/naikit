import React, { useMemo } from "react";
import { WeightedSegment as WeightedSegmentType } from "@/core/segment-model/types";
import BaseSegment from "./BaseSegment";
import { useActiveModeReactive } from "@/state/react-bindings";
import { SegmentRenderer } from "./SegmentRenderer";

interface WeightedSegmentProps {
  segment: WeightedSegmentType;
  isNested?: boolean;
}

/**
 * Weighted Segment Component
 * 
 * Renders a segment with weight information:
 * - Visual indicators for weight level
 * - Color coding based on weight direction (increase/decrease)
 * - Display of numeric weight value in fine-tune mode
 * - Contains child segments
 */
export const WeightedSegment: React.FC<WeightedSegmentProps> = ({
  segment,
  isNested = false
}) => {
  const { bracketType, bracketLevel, displayValue, children } = segment;
  const [activeMode, _isLoading, _error] = useActiveModeReactive();
  
  // Compute weight display
  const weightDisplay = useMemo(() => {
    const formattedValue = displayValue.toFixed(2);
    return `${bracketType === "increase" ? "+" : "-"}${formattedValue}`;
  }, [displayValue, bracketType]);
  
  // Determine color based on bracket type
  const colorClass = bracketType === "increase" 
    ? "border-blue-500 text-blue-300"
    : "border-red-500 text-red-300";
  
  // Generate intensity class based on bracket level
  const getIntensityClass = () => {
    const level = Math.min(Math.floor(bracketLevel / 2), 4); // 0-4 intensity levels
    return `weight-level-${level}`;
  };
  
  const intensityClass = getIntensityClass();
  
  // Render differently based on mode
  if (activeMode === "finetune" && activeMode !== null) {
    // In fine-tune mode, show weight value and controls
    return (
      <BaseSegment segment={segment} isNested={isNested}>
        <div className={`weighted-segment ${colorClass} ${intensityClass} border rounded p-1 my-1`}>
          <div className="weighted-header flex items-center justify-between text-xs mb-1">
            <span className="font-mono">{weightDisplay}</span>
            <span className="bracket-level text-xs opacity-75">
              {bracketType === "increase" ? "{}" : "[]"}×{bracketLevel}
            </span>
          </div>
          
          <div className="weighted-content pl-2 border-l-2">
            {children?.map((child, index) => (
              <SegmentRenderer key={`${child.id}-${index}`} segment={child} isNested={true} />
            ))}
          </div>
        </div>
      </BaseSegment>
    );
  }
  
  // In compose mode, show simplified view with less emphasis on weights
  return (
    <BaseSegment segment={segment} isNested={isNested}>
      <div className={`weighted-segment-compose ${colorClass} ${intensityClass} border-l-2 pl-2 my-1`}>
        {children?.map((child, index) => (
          <SegmentRenderer key={`${child.id}-${index}`} segment={child} isNested={true} />
        ))}
      </div>
    </BaseSegment>
  );
};

export default WeightedSegment;