import React, { useMemo } from 'react';
import { useSegmentStore } from '@/store/segment-store';
import { useEditor } from '@/contexts/EditorContext';
import SegmentRenderer from './SegmentRenderer';

const SegmentTree: React.FC = () => {
  const { 
    segments, 
    rootSegments 
  } = useSegmentStore();
  
  const { promptType } = useEditor();
  
  // 현재 루트 세그먼트 ID와 세그먼트 가져오기
  const rootSegmentId = useMemo(() => {
    return rootSegments.main[promptType];
  }, [rootSegments.main, promptType]);
  
  const rootSegment = useMemo(() => {
    return segments[rootSegmentId];
  }, [segments, rootSegmentId]);
  
  return (
    <div className="segment-tree pb-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          {promptType === 'positive' ? 'Positive' : 'Negative'} 프롬프트 세그먼트
        </h3>
      </div>
      
      {rootSegment && rootSegment.children && rootSegment.children.length > 0 ? (
        <div className="space-y-2">
          {rootSegment.children.map((child, index) => (
            <SegmentRenderer key={`${child.id}-${index}`} segmentId={child.id} />
          ))}
        </div>
      ) : (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md text-center text-gray-500 dark:text-gray-400">
          세그먼트가 없습니다. 새 세그먼트를 추가해보세요.
        </div>
      )}
    </div>
  );
};

export default SegmentTree;