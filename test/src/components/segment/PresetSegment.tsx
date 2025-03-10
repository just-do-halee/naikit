import React, { useCallback, useState, useEffect } from 'react';
import { PresetSegment as PresetSegmentType } from '@main/src/modules/segment-model/types';
import SegmentWrapper from './SegmentWrapper';
import { useSegmentActions } from '@/hooks/useSegmentActions';
import { useSegmentStore } from '@/store/segment-store';

interface PresetSegmentProps {
  segment: PresetSegmentType;
  depth?: number;
}

const PresetSegment: React.FC<PresetSegmentProps> = ({ segment, depth = 0 }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newSelectedValue, setNewSelectedValue] = useState(segment.selected || '');
  const [newValues, setNewValues] = useState((segment.metadata?.values || []).join(', '));
  const [availableOptions, setAvailableOptions] = useState<string[]>([]);
  const { updateSegment } = useSegmentStore();
  
  // 세그먼트 내 저장된 옵션(values) 업데이트 시 사용 가능한 옵션 목록 갱신
  useEffect(() => {
    const values = segment.metadata?.values || [];
    setAvailableOptions(values as string[]);
    
    // 랜덤 모드에서 고정 모드로 전환되고 선택된 값이 없을 때 첫 번째 값을 자동 선택
    if (segment.mode === 'fixed' && !segment.selected && values.length > 0) {
      updateSegment(segment.id, { selected: values[0] });
      setNewSelectedValue(values[0] as string);
    }
  }, [segment.metadata?.values, segment.mode, segment.id, segment.selected, updateSegment]);
  
  // 프리셋 이름 업데이트
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateSegment(segment.id, { name: e.target.value });
  }, [segment.id, updateSegment]);
  
  // 프리셋 모드 변경
  const handleModeChange = useCallback((mode: 'random' | 'fixed') => {
    updateSegment(segment.id, { mode });
  }, [segment.id, updateSegment]);
  
  // 선택된 값 변경
  const handleSelectedValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSelectedValue(e.target.value);
  }, []);
  
  // 값 목록 변경
  const handleValuesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewValues(e.target.value);
  }, []);
  
  // 편집 모드 저장
  const handleSave = useCallback(() => {
    if (segment.mode === 'fixed') {
      updateSegment(segment.id, { selected: newSelectedValue });
    } else {
      const values = newValues.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0);
      if (!segment.metadata) {
        updateSegment(segment.id, { metadata: { values } });
      } else {
        updateSegment(segment.id, { 
          metadata: { ...segment.metadata, values }
        });
      }
    }
    setIsEditing(false);
  }, [segment.id, segment.mode, newSelectedValue, newValues, updateSegment]);
  
  // 이벤트 전파 방지
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  
  return (
    <SegmentWrapper 
      segment={segment} 
      depth={depth}
      className="segment-preset"
    >
      <div onClick={handleClick}>
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-medium">프리셋: </h4>
          {isEditing ? (
            <input
              type="text"
              value={segment.name}
              onChange={handleNameChange}
              className="p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          ) : (
            <span className="font-bold">{segment.name}</span>
          )}
        </div>
        
        <div className="mt-3">
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => handleModeChange('random')}
              className={`px-3 py-1 rounded-md ${
                segment.mode === 'random' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              랜덤 모드
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('fixed')}
              className={`px-3 py-1 rounded-md ${
                segment.mode === 'fixed' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              고정 모드
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            >
              {isEditing ? '취소' : '편집'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1 rounded-md bg-green-500 text-white"
              >
                저장
              </button>
            )}
          </div>
          
          {isEditing ? (
            segment.mode === 'fixed' ? (
              <div>
                <label className="block mb-1 font-medium">고정 값 선택:</label>
                {availableOptions.length > 0 ? (
                  <select
                    value={newSelectedValue}
                    onChange={(e) => setNewSelectedValue(e.target.value)}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  >
                    {availableOptions.map((option, index) => (
                      <option key={`option-${index}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                    사용 가능한 옵션이 없습니다. 먼저 랜덤 모드에서 값을 추가하세요.
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block mb-1 font-medium">랜덤 값 목록 (쉼표로 구분):</label>
                <textarea
                  value={newValues}
                  onChange={handleValuesChange}
                  className="w-full h-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            )
          ) : (
            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
              {segment.mode === 'fixed' ? (
                <div>
                  <div className="font-medium">고정 값:</div>
                  <div className="mt-1 px-3 py-2 bg-blue-100 dark:bg-blue-800 rounded-md">
                    {segment.selected || ''}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-medium">랜덤 값 목록:</div>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {(segment.metadata?.values || []).map((value: string, index: number) => (
                      <li 
                        key={`${segment.id}-value-${index}`}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-800 rounded-full"
                      >
                        {value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SegmentWrapper>
  );
};

export default PresetSegment;