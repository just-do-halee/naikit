import React, { useState, useEffect } from 'react';
import { BracketType, Segment } from '@main/src/modules/segment-model/types';
import {
  isTextSegment,
  isWeightedSegment,
  isPresetSegment,
  isInlineWildcardSegment,
} from '@main/src/modules/segment-model/types';
import { useSegmentStore } from '@/store/segment-store';
import { useGroupStore, Group } from '@/store/group-store';
import { useModeStore } from '@/store/mode-store';
import { parseNovelAIPrompt } from '@main/src/modules/compiler/segment-parser';

const SegmentEditor: React.FC = () => {
  const [promptType, setPromptType] = useState<'positive' | 'negative'>('positive');
  const [newTextContent, setNewTextContent] = useState('');
  const [newInlineOptions, setNewInlineOptions] = useState('');
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetMode, setNewPresetMode] = useState<'random' | 'fixed'>('random');
  const [newPresetSelected, setNewPresetSelected] = useState('');
  const [newPresetValues, setNewPresetValues] = useState('');
  const [bracketLevel, setBracketLevel] = useState(1);
  const [bracketType, setBracketType] = useState<BracketType>('increase');
  const [importText, setImportText] = useState('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  // 스토어에서 필요한 값과 액션 가져오기
  const {
    segments,
    rootSegments,
    createAndAddTextSegment,
    createAndAddWeightedSegment,
    createAndAddPresetSegment,
    createAndAddInlineWildcardSegment,
    removeSegment,
    updateSegment,
  } = useSegmentStore();
  
  // 그룹 스토어에서 값과 액션 가져오기
  const {
    groups,
    addGroup,
    createGroup,
    updateGroup,
    removeGroup,
    findGroupsBySegmentId,
    addSegmentToGroup,
    removeSegmentFromGroup
  } = useGroupStore();
  
  // 모드 스토어에서 값과 액션 가져오기
  const {
    currentMode,
    modeState,
    setActiveSegment
  } = useModeStore();
  
  // 모드에 따른 UI 상태 관리
  useEffect(() => {
    if (currentMode === 'finetune') {
      // 파인튜닝 모드일 때는 활성화된 세그먼트 설정
      setActiveSegmentId(modeState.finetune.activeSegmentId);
    } else {
      // 컴포즈 모드일 때는 세그먼트 활성화 취소
      setActiveSegmentId(null);
    }
  }, [currentMode, modeState.finetune.activeSegmentId]);

  // 현재 루트 세그먼트 ID 가져오기
  const rootSegmentId = rootSegments.main[promptType];
  const rootSegment = segments[rootSegmentId];

  // 텍스트 세그먼트 추가
  const handleAddTextSegment = () => {
    if (!newTextContent.trim()) return;
    
    createAndAddTextSegment(newTextContent, rootSegmentId);
    setNewTextContent('');
  };

  // 인라인 와일드카드 세그먼트 추가
  const handleAddInlineWildcard = () => {
    if (!newInlineOptions.trim()) return;
    
    const options = newInlineOptions
      .split('|')
      .map(option => option.trim())
      .filter(option => option.length > 0);
    
    if (options.length === 0) return;
    
    createAndAddInlineWildcardSegment(options, rootSegmentId);
    setNewInlineOptions('');
  };

  // 프리셋 세그먼트 추가
  const handleAddPreset = () => {
    if (!newPresetName.trim()) return;
    
    const values = newPresetMode === 'random' && newPresetValues.trim()
      ? newPresetValues.split(',').map(v => v.trim())
      : undefined;
    
    createAndAddPresetSegment(
      newPresetName,
      newPresetMode,
      newPresetMode === 'fixed' ? newPresetSelected : undefined,
      values,
      rootSegmentId
    );
    
    // 입력 필드 초기화
    setNewPresetName('');
    setNewPresetSelected('');
    setNewPresetValues('');
  };

  // 가중치 세그먼트 생성 (선택된 세그먼트들을 감싸는 새 세그먼트)
  const handleAddWeightedSegment = () => {
    if (selectedSegments.length === 0) return;
    
    createAndAddWeightedSegment(
      selectedSegments,
      bracketType,
      bracketLevel,
      rootSegmentId
    );
    
    // 선택 초기화
    setSelectedSegments([]);
  };

  // 세그먼트 선택 토글
  const handleToggleSelect = (segmentId: string) => {
    setSelectedSegments(prev =>
      prev.includes(segmentId)
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  // 세그먼트 삭제
  const handleRemoveSegment = (segmentId: string) => {
    removeSegment(segmentId);
    
    // 선택된 목록에서도 제거
    setSelectedSegments(prev => prev.filter(id => id !== segmentId));
  };

  // 텍스트 세그먼트 내용 업데이트
  const handleUpdateTextSegment = (segmentId: string, content: string) => {
    updateSegment(segmentId, { content });
  };

  // 텍스트로 프롬프트 가져오기
  const handleImportPrompt = () => {
    if (!importText.trim()) return;
    
    try {
      const parsedSegment = parseNovelAIPrompt(importText);
      
      // 기존 루트 세그먼트에 추가
      if (parsedSegment.children && parsedSegment.children.length > 0) {
        const rootSeg = segments[rootSegmentId];
        
        if (!rootSeg.children) {
          updateSegment(rootSegmentId, { children: [...parsedSegment.children] });
        } else {
          updateSegment(rootSegmentId, { 
            children: [...rootSeg.children, ...parsedSegment.children] 
          });
        }
      }
      
      // 입력 필드 초기화
      setImportText('');
    } catch (error) {
      console.error('Error parsing prompt:', error);
      alert('프롬프트 파싱 중 오류가 발생했습니다.');
    }
  };
  
  // 그룹 관리 기능
  const handleCreateGroup = () => {
    if (!newGroupName.trim() || selectedSegments.length === 0) return;
    
    createGroup(newGroupName, selectedSegments);
    setNewGroupName('');
    setSelectedSegments([]);
  };
  
  // 세그먼트 활성화
  const handleActivateSegment = (segmentId: string) => {
    if (currentMode === 'finetune') {
      setActiveSegment(segmentId);
      setActiveSegmentId(segmentId);
    }
  };
  
  // 세그먼트 그룹 정보 가져오기
  const getSegmentGroups = (segmentId: string): Group[] => {
    return findGroupsBySegmentId(segmentId);
  };

  // 세그먼트 렌더링
  const renderSegment = (segment: Segment, depth = 0) => {
    const isSelected = selectedSegments.includes(segment.id);
    const isActive = currentMode === 'finetune' && activeSegmentId === segment.id;
    const segmentGroups = getSegmentGroups(segment.id);
    
    let className = `segment-container p-3 mb-3 rounded-lg ${isSelected ? 'ring-2 ring-blue-500' : ''} ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}`;

    if (isTextSegment(segment)) {
      className += ' segment-text';
      return (
        <div 
          key={segment.id} 
          className={className} 
          style={{ marginLeft: `${depth * 16}px` }}
          onClick={() => currentMode === 'finetune' && handleActivateSegment(segment.id)}
        >
          <div className="flex justify-between items-center mb-2">
            <div>
              <h4 className="font-medium">텍스트 세그먼트</h4>
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
                  onClick={(e) => { e.stopPropagation(); handleToggleSelect(segment.id); }}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {isSelected ? '선택 해제' : '선택'}
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveSegment(segment.id); }}
                className="btn btn-danger"
              >
                삭제
              </button>
            </div>
          </div>
          <textarea
            value={segment.content}
            onChange={(e) => handleUpdateTextSegment(segment.id, e.target.value)}
            className="w-full h-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            onClick={e => e.stopPropagation()}
          />
        </div>
      );
    }

    if (isWeightedSegment(segment)) {
      const borderColor = segment.bracketType === 'increase' 
        ? 'border-green-300 dark:border-green-700' 
        : 'border-red-300 dark:border-red-700';
      
      className += segment.bracketType === 'increase'
        ? ' segment-weighted-increase'
        : ' segment-weighted-decrease';
      
      return (
        <div 
          key={segment.id} 
          className={className} 
          style={{ marginLeft: `${depth * 16}px` }}
          onClick={() => currentMode === 'finetune' && handleActivateSegment(segment.id)}
        >
          <div className="flex justify-between items-center mb-2">
            <div>
              <h4 className="font-medium">
                {segment.bracketType === 'increase' ? '강화' : '약화'} 세그먼트 (x{segment.displayValue.toFixed(2)})
              </h4>
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
                  onClick={(e) => { e.stopPropagation(); handleToggleSelect(segment.id); }}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {isSelected ? '선택 해제' : '선택'}
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveSegment(segment.id); }}
                className="btn btn-danger"
              >
                삭제
              </button>
            </div>
          </div>
          <div className={`pl-4 border-l-4 ${borderColor}`}>
            {segment.children?.map((child: Segment) => renderSegment(child, depth + 1))}
          </div>
        </div>
      );
    }

    if (isPresetSegment(segment)) {
      className += ' segment-preset';
      return (
        <div 
          key={segment.id} 
          className={className} 
          style={{ marginLeft: `${depth * 16}px` }}
          onClick={() => currentMode === 'finetune' && handleActivateSegment(segment.id)}
        >
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">
                {segment.mode === 'random' ? '와일드카드' : '키워드'}: {segment.name}
                {segment.mode === 'fixed' && segment.selected && ` (${segment.selected})`}
              </h4>
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
                  onClick={(e) => { e.stopPropagation(); handleToggleSelect(segment.id); }}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {isSelected ? '선택 해제' : '선택'}
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveSegment(segment.id); }}
                className="btn btn-danger"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isInlineWildcardSegment(segment)) {
      className += ' segment-inline-wildcard';
      return (
        <div 
          key={segment.id} 
          className={className} 
          style={{ marginLeft: `${depth * 16}px` }}
          onClick={() => currentMode === 'finetune' && handleActivateSegment(segment.id)}
        >
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">
                인라인 와일드카드: ({segment.options.join(' | ')})
              </h4>
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
                  onClick={(e) => { e.stopPropagation(); handleToggleSelect(segment.id); }}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {isSelected ? '선택 해제' : '선택'}
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveSegment(segment.id); }}
                className="btn btn-danger"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">세그먼트 에디터</h2>
        
        <div className="flex space-x-4">
          <button
            className={`btn ${promptType === 'positive' ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => setPromptType('positive')}
          >
            긍정 프롬프트
          </button>
          <button
            className={`btn ${promptType === 'negative' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setPromptType('negative')}
          >
            부정 프롬프트
          </button>
        </div>
      </div>

      {/* 루트 세그먼트 편집 패널 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-xl font-semibold mb-4">루트 세그먼트 편집</h3>
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            루트 프롬프트 ({promptType === 'positive' ? '긍정' : '부정'}):
          </label>
          <textarea
            value={rootSegment && 'content' in rootSegment ? rootSegment.content : ''}
            onChange={(e) => handleUpdateTextSegment(rootSegmentId, e.target.value)}
            className="w-full h-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            placeholder="여기서 루트 세그먼트를 직접 편집할 수 있습니다..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* 세그먼트 추가 패널 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="text-xl font-semibold mb-4">세그먼트 추가</h3>
            
            {currentMode === 'compose' && (
              <div className="space-y-6">
                {/* 텍스트 세그먼트 추가 */}
                <div>
                  <h4 className="text-lg font-medium mb-2">텍스트 세그먼트</h4>
                  <textarea
                    value={newTextContent}
                    onChange={(e) => setNewTextContent(e.target.value)}
                    placeholder="텍스트 내용 입력..."
                    className="w-full h-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-2"
                  />
                  <button
                    onClick={handleAddTextSegment}
                    className="btn btn-primary"
                    disabled={!newTextContent.trim()}
                  >
                    텍스트 세그먼트 추가
                  </button>
                </div>
                
                {/* 인라인 와일드카드 추가 */}
                <div>
                  <h4 className="text-lg font-medium mb-2">인라인 와일드카드</h4>
                  <input
                    type="text"
                    value={newInlineOptions}
                    onChange={(e) => setNewInlineOptions(e.target.value)}
                    placeholder="옵션1|옵션2|옵션3"
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-2"
                  />
                  <button
                    onClick={handleAddInlineWildcard}
                    className="btn btn-primary"
                    disabled={!newInlineOptions.includes('|') || !newInlineOptions.trim()}
                  >
                    인라인 와일드카드 추가
                  </button>
                </div>
                
                {/* 프리셋 추가 */}
                <div>
                  <h4 className="text-lg font-medium mb-2">프리셋</h4>
                  <div className="space-y-2 mb-2">
                    <input
                      type="text"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="프리셋 이름"
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="preset-random"
                          checked={newPresetMode === 'random'}
                          onChange={() => setNewPresetMode('random')}
                          className="mr-2"
                        />
                        <label htmlFor="preset-random">와일드카드</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="preset-fixed"
                          checked={newPresetMode === 'fixed'}
                          onChange={() => setNewPresetMode('fixed')}
                          className="mr-2"
                        />
                        <label htmlFor="preset-fixed">키워드</label>
                      </div>
                    </div>
                    
                    {newPresetMode === 'fixed' && (
                      <input
                        type="text"
                        value={newPresetSelected}
                        onChange={(e) => setNewPresetSelected(e.target.value)}
                        placeholder="선택된 값"
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                      />
                    )}
                    
                    {newPresetMode === 'random' && (
                      <input
                        type="text"
                        value={newPresetValues}
                        onChange={(e) => setNewPresetValues(e.target.value)}
                        placeholder="값1, 값2, 값3 (선택사항)"
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                      />
                    )}
                  </div>
                  
                  <button
                    onClick={handleAddPreset}
                    className="btn btn-primary"
                    disabled={!newPresetName.trim() || (newPresetMode === 'fixed' && !newPresetSelected.trim())}
                  >
                    프리셋 추가
                  </button>
                </div>
                
                {/* 가중치 세그먼트 추가 */}
                <div>
                  <h4 className="text-lg font-medium mb-2">가중치 세그먼트</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    선택된 세그먼트를 가중치 세그먼트로 감쌉니다. ({selectedSegments.length}개 선택됨)
                  </p>
                  
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="bracket-increase"
                        checked={bracketType === 'increase'}
                        onChange={() => setBracketType('increase')}
                        className="mr-2"
                      />
                      <label htmlFor="bracket-increase">강화 (중괄호)</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="bracket-decrease"
                        checked={bracketType === 'decrease'}
                        onChange={() => setBracketType('decrease')}
                        className="mr-2"
                      />
                      <label htmlFor="bracket-decrease">약화 (대괄호)</label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <label htmlFor="bracket-level" className="min-w-24">괄호 레벨:</label>
                    <input
                      type="range"
                      id="bracket-level"
                      min="1"
                      max="5"
                      value={bracketLevel}
                      onChange={(e) => setBracketLevel(parseInt(e.target.value))}
                      className="flex-grow"
                    />
                    <span className="min-w-8 text-center">{bracketLevel}</span>
                  </div>
                  
                  <button
                    onClick={handleAddWeightedSegment}
                    className="btn btn-primary"
                    disabled={selectedSegments.length === 0}
                  >
                    가중치 세그먼트 추가
                  </button>
                </div>
                
                {/* 프롬프트 가져오기 */}
                <div>
                  <h4 className="text-lg font-medium mb-2">프롬프트 가져오기</h4>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="NovelAI 프롬프트 텍스트를 붙여넣으세요..."
                    className="w-full h-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-2"
                  />
                  <button
                    onClick={handleImportPrompt}
                    className="btn btn-primary"
                    disabled={!importText.trim()}
                  >
                    프롬프트 가져오기
                  </button>
                </div>
              </div>
            )}
            
            {currentMode === 'finetune' && activeSegmentId && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium mb-2">선택된 세그먼트 조정</h4>
                {/* 세그먼트 속성 편집 UI */}
                {activeSegmentId && segments[activeSegmentId] && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="mb-2 font-medium">세그먼트 ID: {activeSegmentId.substring(0, 8)}...</p>
                    <p className="mb-2">
                      타입: {
                        isTextSegment(segments[activeSegmentId]) ? '텍스트' :
                        isWeightedSegment(segments[activeSegmentId]) ? '가중치' :
                        isPresetSegment(segments[activeSegmentId]) ? '프리셋' :
                        isInlineWildcardSegment(segments[activeSegmentId]) ? '인라인 와일드카드' : '알 수 없음'
                      }
                    </p>
                    
                    {/* 텍스트 세그먼트 편집 */}
                    {isTextSegment(segments[activeSegmentId]) && (
                      <div className="mt-2">
                        <label className="block mb-1">텍스트 내용:</label>
                        <textarea
                          value={segments[activeSegmentId].content}
                          onChange={(e) => handleUpdateTextSegment(activeSegmentId, e.target.value)}
                          className="w-full h-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                    )}
                    
                    {/* 가중치 세그먼트 편집 */}
                    {isWeightedSegment(segments[activeSegmentId]) && (
                      <div className="mt-2">
                        <p>가중치: {segments[activeSegmentId].displayValue.toFixed(2)}</p>
                        <p>괄호 타입: {segments[activeSegmentId].bracketType === 'increase' ? '강화' : '약화'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 그룹 관리 패널 (파인튜닝 모드에서만 표시) */}
          {currentMode === 'finetune' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <h3 className="text-xl font-semibold mb-4">그룹 관리</h3>
              
              {/* 그룹 생성 */}
              <div className="mb-4">
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="새 그룹 이름"
                    className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                  <button
                    onClick={handleCreateGroup}
                    className="btn btn-primary whitespace-nowrap"
                    disabled={!newGroupName.trim() || selectedSegments.length === 0}
                  >
                    그룹 생성
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  선택된 세그먼트 {selectedSegments.length}개를 그룹으로 묶습니다.
                </p>
              </div>
              
              {/* 그룹 목록 */}
              <div className="space-y-2">
                <h4 className="text-lg font-medium mb-2">그룹 목록</h4>
                {Object.values(groups).length > 0 ? (
                  <div className="space-y-2">
                    {Object.values(groups).map(group => (
                      <div 
                        key={group.id} 
                        className="p-3 bg-white dark:bg-gray-700 rounded-lg border"
                        style={{ borderLeftWidth: '4px', borderLeftColor: group.color }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium">{group.name}</h5>
                          <button
                            onClick={() => removeGroup(group.id)}
                            className="btn btn-danger btn-sm"
                          >
                            삭제
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          세그먼트 {group.segmentIds.length}개
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic text-center py-4">
                    생성된 그룹이 없습니다.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* 세그먼트 목록 패널 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-xl font-semibold mb-4">세그먼트 목록</h3>
          
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {rootSegment.children && rootSegment.children.length > 0 ? (
              rootSegment.children.map((segment: Segment) => renderSegment(segment))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic text-center py-8">
                세그먼트가 없습니다. 새 세그먼트를 추가하세요.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SegmentEditor;