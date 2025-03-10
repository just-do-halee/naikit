import React from 'react';
import { WeightedSegment as WeightedSegmentType } from '@main/src/modules/segment-model/types';
import SegmentWrapper from './SegmentWrapper';
import SegmentRenderer from './SegmentRenderer';

interface WeightedSegmentProps {
  segment: WeightedSegmentType;
  depth?: number;
}

const WeightedSegment: React.FC<WeightedSegmentProps> = ({ segment, depth = 0 }) => {
  const borderColor = segment.bracketType === 'increase' 
    ? 'border-green-300 dark:border-green-700' 
    : 'border-red-300 dark:border-red-700';
  
  const segmentClassName = segment.bracketType === 'increase'
    ? 'segment-weighted-increase'
    : 'segment-weighted-decrease';
  
  return (
    <SegmentWrapper 
      segment={segment} 
      depth={depth}
      className={`${segmentClassName} ${borderColor}`}
    >
      <div>
        <h4 className="font-medium">
          {segment.bracketType === 'increase' ? '강화' : '약화'} 세그먼트 (x{segment.displayValue.toFixed(2)})
        </h4>
        
        {segment.children && segment.children.length > 0 && (
          <div className="pl-4 mt-4 border-l-2 dark:border-gray-600">
            {segment.children.map((child, index) => (
              <SegmentRenderer 
                key={`${child.id}-${index}`} 
                segmentId={child.id} 
                depth={0} 
              />
            ))}
          </div>
        )}
      </div>
    </SegmentWrapper>
  );
};

export default WeightedSegment;