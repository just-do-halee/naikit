import React from "react";
import { Segment } from "@/core/segment-model/types";
import { useSegmentSelection } from "@/state/react-bindings";

interface BaseSegmentProps {
  segment: Segment;
  isNested?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}

/**
 * Base Segment Component
 * 
 * Provides common functionality for all segment types including:
 * - Selection handling
 * - Click and double-click events
 * - Common styling
 */
export const BaseSegment: React.FC<BaseSegmentProps> = ({
  segment,
  isNested = false,
  onClick,
  onDoubleClick,
  children
}) => {
  const { isSelected, selectSegment } = useSegmentSelection();
  const selected = isSelected(segment.id);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Handle selection
    selectSegment(segment.id, e.shiftKey);
    
    // Call the provided onClick handler
    if (onClick) onClick(e);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDoubleClick) onDoubleClick(e);
  };

  return (
    <div 
      className={`segment ${selected ? 'segment-selected' : ''} ${isNested ? 'segment-nested' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-segment-id={segment.id}
      data-segment-type={segment.type}
    >
      {children}
    </div>
  );
};

export default BaseSegment;