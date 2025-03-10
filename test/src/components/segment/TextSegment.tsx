import React, { useCallback } from 'react';
import { TextSegment as TextSegmentType } from '@main/src/modules/segment-model/types';
import SegmentWrapper from './SegmentWrapper';
import { useSegmentActions } from '@/hooks/useSegmentActions';

interface TextSegmentProps {
  segment: TextSegmentType;
  depth?: number;
}

const TextSegment: React.FC<TextSegmentProps> = ({ segment, depth = 0 }) => {
  const { updateTextSegment } = useSegmentActions();
  
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateTextSegment(segment.id, e.target.value);
  }, [segment.id, updateTextSegment]);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  
  return (
    <SegmentWrapper 
      segment={segment} 
      depth={depth}
      className="segment-text"
    >
      <div>
        <h4 className="font-medium">텍스트 세그먼트</h4>
        <textarea
          value={segment.content}
          onChange={handleContentChange}
          onClick={handleClick}
          className="w-full h-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mt-2"
        />
      </div>
    </SegmentWrapper>
  );
};

export default TextSegment;