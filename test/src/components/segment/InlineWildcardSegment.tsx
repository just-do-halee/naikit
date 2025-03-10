import React, { useCallback } from 'react';
import { InlineWildcardSegment as InlineWildcardSegmentType } from '@main/src/modules/segment-model/types';
import SegmentWrapper from './SegmentWrapper';
import { useSegmentStore } from '@/store/segment-store';

interface InlineWildcardSegmentProps {
  segment: InlineWildcardSegmentType;
  depth?: number;
}

const InlineWildcardSegment: React.FC<InlineWildcardSegmentProps> = ({ segment, depth = 0 }) => {
  const { updateSegment } = useSegmentStore();
  
  // 옵션 추가
  const handleAddOption = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('newOption') as HTMLInputElement;
    
    if (!input.value.trim()) return;
    
    const newOptions = [...segment.options, input.value.trim()];
    updateSegment(segment.id, { options: newOptions });
    input.value = '';
  }, [segment.id, segment.options, updateSegment]);
  
  // 옵션 제거
  const handleRemoveOption = useCallback((index: number) => {
    const newOptions = [...segment.options];
    newOptions.splice(index, 1);
    updateSegment(segment.id, { options: newOptions });
  }, [segment.id, segment.options, updateSegment]);
  
  // 이벤트 전파 방지
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  
  return (
    <SegmentWrapper 
      segment={segment} 
      depth={depth}
      className="segment-inline-wildcard"
    >
      <div>
        <h4 className="font-medium">인라인 와일드카드</h4>
        
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <ul className="flex flex-wrap gap-2 mb-3">
            {segment.options.map((option, index) => (
              <li 
                key={`${segment.id}-option-${index}`}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center"
              >
                <span className="mr-2">{option}</span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleRemoveOption(index); }}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          
          <form onSubmit={handleAddOption} onClick={handleClick}>
            <div className="flex">
              <input
                type="text"
                name="newOption"
                placeholder="새 옵션 추가..."
                className="flex-1 p-2 border rounded-l-md dark:bg-gray-600 dark:border-gray-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
              >
                추가
              </button>
            </div>
          </form>
        </div>
      </div>
    </SegmentWrapper>
  );
};

export default InlineWildcardSegment;