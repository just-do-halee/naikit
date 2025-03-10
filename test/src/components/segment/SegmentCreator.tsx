import React, { useState } from 'react';
import { BracketType } from '@main/src/modules/segment-model/types';
import { useEditor } from '@/contexts/EditorContext';
import { useSegmentActions } from '@/hooks/useSegmentActions';

const SegmentCreator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'weighted' | 'preset' | 'inline' | 'import'>('text');
  
  const { 
    promptType,
    setPromptType,
    newTextContent,
    setNewTextContent,
    newInlineOptions,
    setNewInlineOptions,
    newPresetName,
    setNewPresetName,
    newPresetMode,
    setNewPresetMode,
    newPresetSelected,
    setNewPresetSelected,
    newPresetValues,
    setNewPresetValues,
    bracketLevel,
    setBracketLevel,
    bracketType,
    setBracketType,
    importText,
    setImportText,
    selectedSegments,
    clearSelection,
  } = useEditor();
  
  const { 
    addTextSegment,
    addInlineWildcard,
    addPreset,
    addWeightedSegment,
    importPrompt,
  } = useSegmentActions();
  
  // 텍스트 세그먼트 추가
  const handleAddTextSegment = () => {
    if (!newTextContent.trim()) return;
    
    addTextSegment(newTextContent, promptType);
    setNewTextContent('');
  };
  
  // 인라인 와일드카드 추가
  const handleAddInlineWildcard = () => {
    if (!newInlineOptions.trim()) return;
    
    addInlineWildcard(newInlineOptions, promptType);
    setNewInlineOptions('');
  };
  
  // 프리셋 추가
  const handleAddPreset = () => {
    if (!newPresetName.trim()) return;
    
    addPreset(
      newPresetName,
      newPresetMode,
      newPresetSelected,
      newPresetValues,
      promptType
    );
    
    setNewPresetName('');
    setNewPresetSelected('');
    setNewPresetValues('');
  };
  
  // 가중치 세그먼트 추가
  const handleAddWeightedSegment = () => {
    if (selectedSegments.length === 0) return;
    
    addWeightedSegment(
      selectedSegments,
      bracketType,
      bracketLevel,
      promptType
    );
    
    clearSelection();
  };
  
  // 텍스트 가져오기
  const handleImportPrompt = () => {
    if (!importText.trim()) return;
    
    const success = importPrompt(importText, promptType);
    if (success) {
      setImportText('');
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">새 세그먼트 추가</h3>
          
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 rounded-md ${
                promptType === 'positive'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setPromptType('positive')}
            >
              Positive
            </button>
            <button
              className={`px-3 py-1 rounded-md ${
                promptType === 'negative'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setPromptType('negative')}
            >
              Negative
            </button>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'text'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('text')}
          >
            텍스트
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'weighted'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('weighted')}
          >
            가중치
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'preset'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('preset')}
          >
            프리셋
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'inline'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('inline')}
          >
            와일드카드
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'import'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('import')}
          >
            가져오기
          </button>
        </div>
      </div>
      
      <div className="p-2">
        {activeTab === 'text' && (
          <div>
            <textarea
              value={newTextContent}
              onChange={(e) => setNewTextContent(e.target.value)}
              placeholder="텍스트 입력..."
              className="w-full h-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-3"
            />
            <button
              onClick={handleAddTextSegment}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              텍스트 세그먼트 추가
            </button>
          </div>
        )}
        
        {activeTab === 'inline' && (
          <div>
            <input
              type="text"
              value={newInlineOptions}
              onChange={(e) => setNewInlineOptions(e.target.value)}
              placeholder="옵션1 | 옵션2 | 옵션3"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-3"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              옵션들을 파이프(|)로 구분하여 입력하세요.
            </p>
            <button
              onClick={handleAddInlineWildcard}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              인라인 와일드카드 추가
            </button>
          </div>
        )}
        
        {activeTab === 'preset' && (
          <div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">프리셋 이름</label>
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="프리셋 이름"
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div className="mb-3">
              <div className="flex gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setNewPresetMode('random')}
                  className={`px-3 py-1 rounded-md ${
                    newPresetMode === 'random' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  랜덤 모드
                </button>
                <button
                  type="button"
                  onClick={() => setNewPresetMode('fixed')}
                  className={`px-3 py-1 rounded-md ${
                    newPresetMode === 'fixed' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  고정 모드
                </button>
              </div>
              
              {newPresetMode === 'fixed' ? (
                <div>
                  <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-md mb-3">
                    <p className="text-sm">
                      고정 모드는 세그먼트 생성 후 편집할 수 있습니다. 
                      먼저 랜덤 모드로 생성하고 랜덤 값을 추가한 다음, 고정 모드로 전환하세요.
                    </p>
                  </div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">고정 값 (세그먼트 생성 후 선택)</label>
                  <input
                    type="text"
                    disabled
                    placeholder="세그먼트 생성 후 선택 가능"
                    className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">랜덤 값 목록 (쉼표로 구분)</label>
                  <textarea
                    value={newPresetValues}
                    onChange={(e) => setNewPresetValues(e.target.value)}
                    placeholder="값1, 값2, 값3"
                    className="w-full h-20 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              )}
            </div>
            
            <button
              onClick={handleAddPreset}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              프리셋 추가
            </button>
          </div>
        )}
        
        {activeTab === 'weighted' && (
          <div>
            <div className="mb-3">
              <h4 className="font-medium mb-2">선택된 세그먼트: {selectedSegments.length}개</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                가중치를 적용할 세그먼트를 선택하세요.
              </p>
            </div>
            
            <div className="flex gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">가중치 타입</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBracketType('increase')}
                    className={`px-3 py-1 rounded-md ${
                      bracketType === 'increase' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    강화 (증가)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBracketType('decrease')}
                    className={`px-3 py-1 rounded-md ${
                      bracketType === 'decrease' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    약화 (감소)
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">가중치 레벨 ({bracketLevel})</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={bracketLevel}
                  onChange={(e) => setBracketLevel(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            <button
              onClick={handleAddWeightedSegment}
              disabled={selectedSegments.length === 0}
              className={`px-4 py-2 rounded-md ${
                selectedSegments.length > 0
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              가중치 세그먼트 추가
            </button>
          </div>
        )}
        
        {activeTab === 'import' && (
          <div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="NovelAI 프롬프트 텍스트 붙여넣기..."
              className="w-full h-36 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-3"
            />
            <button
              onClick={handleImportPrompt}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              프롬프트 가져오기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SegmentCreator;