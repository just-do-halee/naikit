import React, { useCallback } from 'react';
import { Segment } from '@main/src/modules/segment-model/types';
import { useModeStore } from '@/store/mode-store';
import { useEditor } from '@/contexts/EditorContext';
import { useGroupActions } from '@/hooks/useGroupActions';
import { useSegmentActions } from '@/hooks/useSegmentActions';

interface SegmentWrapperProps {
  segment: Segment;
  depth?: number;
  children: React.ReactNode;
  className?: string;
}

const SegmentWrapper: React.FC<SegmentWrapperProps> = ({
  segment,
  depth = 0,
  children,
  className = '',
}) => {
  const { currentMode } = useModeStore();
  const { deleteSegment } = useSegmentActions();
  const { getSegmentGroups } = useGroupActions();
  const { 
    isSelected,
    toggleSegmentSelection,
    activeSegmentId,
    setActiveSegment,
  } = useEditor();
  
  const isSegmentSelected = isSelected(segment.id);
  const isSegmentActive = currentMode === 'finetune' && activeSegmentId === segment.id;
  const segmentGroups = getSegmentGroups(segment.id);
  
  // 세그먼트 활성화
  const handleActivateSegment = useCallback(() => {
    if (currentMode === 'finetune') {
      setActiveSegment(segment.id);
    }
  }, [currentMode, segment.id, setActiveSegment]);

  // 세그먼트 선택
  const handleToggleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSegmentSelection(segment.id);
  }, [segment.id, toggleSegmentSelection]);

  // 세그먼트 삭제
  const handleRemoveSegment = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSegment(segment.id);
  }, [segment.id, deleteSegment]);

  // 기본 클래스 설정
  let wrapperClass = `
    segment-container p-3 mb-3 rounded-lg 
    ${isSegmentSelected ? 'ring-2 ring-blue-500' : ''} 
    ${isSegmentActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}
    ${className}
  `;

  return (
    <div 
      className={wrapperClass.trim()}
      style={{ marginLeft: `${depth * 16}px` }}
      onClick={handleActivateSegment}
    >
      <div className="flex justify-between items-center mb-2">
        <div>
          {segmentGroups.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {segmentGroups.map(group => (
                <span 
                  key={group.id}
                  className="px-2 py-0.5 text-xs rounded-full text-white"
                  style={{ backgroundColor: group.color }}
                >
                  {group.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="space-x-2">
          {currentMode === 'compose' && (
            <button
              onClick={handleToggleSelect}
              className={`btn ${isSegmentSelected ? 'btn-primary' : 'btn-secondary'}`}
            >
              {isSegmentSelected ? '선택 해제' : '선택'}
            </button>
          )}
          <button
            onClick={handleRemoveSegment}
            className="btn btn-danger"
          >
            삭제
          </button>
        </div>
      </div>
      
      {children}
    </div>
  );
};

export default SegmentWrapper;