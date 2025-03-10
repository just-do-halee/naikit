import React, { useMemo } from 'react';
import { useSegmentStore } from '@/store/segment-store';
import { 
  isTextSegment,
  isWeightedSegment,
  isPresetSegment,
  isInlineWildcardSegment 
} from '@main/src/modules/segment-model/types';
import TextSegment from './TextSegment';
import WeightedSegment from './WeightedSegment';
import PresetSegment from './PresetSegment';
import InlineWildcardSegment from './InlineWildcardSegment';

interface SegmentRendererProps {
  segmentId: string;
  depth?: number;
}

const SegmentRenderer: React.FC<SegmentRendererProps> = ({ segmentId, depth = 0 }) => {
  const { segments } = useSegmentStore();
  
  const segment = useMemo(() => segments[segmentId], [segments, segmentId]);
  
  if (!segment) {
    return (
      <div className="p-3 mb-3 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300">
        세그먼트를 찾을 수 없습니다 (ID: {segmentId})
      </div>
    );
  }
  
  if (isTextSegment(segment)) {
    return <TextSegment segment={segment} depth={depth} />;
  }
  
  if (isWeightedSegment(segment)) {
    return <WeightedSegment segment={segment} depth={depth} />;
  }
  
  if (isPresetSegment(segment)) {
    return <PresetSegment segment={segment} depth={depth} />;
  }
  
  if (isInlineWildcardSegment(segment)) {
    return <InlineWildcardSegment segment={segment} depth={depth} />;
  }
  
  // 지원되지 않는 세그먼트 타입
  return (
    <div className="p-3 mb-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-300">
      지원되지 않는 세그먼트 타입입니다
    </div>
  );
};

export default SegmentRenderer;