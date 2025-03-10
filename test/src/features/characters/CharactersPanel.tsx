import React, { useState } from 'react';
import { useSegmentStore } from '@/store/segment-store';
import { compileSegmentTree } from '@main/src/modules/compiler/segment-compiler';

const CharactersPanel: React.FC = () => {
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState<number | null>(null);
  const [promptType, setPromptType] = useState<'positive' | 'negative'>('positive');
  const [newCharacterText, setNewCharacterText] = useState('');
  
  const {
    segments,
    rootSegments,
    addCharacter,
    removeCharacter,
    reorderCharacters,
    createAndAddTextSegment,
    updateSegment,
  } = useSegmentStore();
  
  // 캐릭터 목록 가져오기
  const characters = rootSegments.characters || {};
  const characterIndices = Object.keys(characters).map(Number).sort((a, b) => a - b);
  
  // 현재 선택된 캐릭터 프롬프트 가져오기
  const getSelectedCharacterPrompt = (): string => {
    if (selectedCharacterIndex === null) return '';
    
    const character = characters[selectedCharacterIndex];
    if (!character) return '';
    
    const rootId = character[promptType];
    const segment = segments[rootId];
    
    if (!segment) return '';
    
    return compileSegmentTree(segment);
  };
  
  // 새 캐릭터 추가
  const handleAddCharacter = () => {
    const newIndex = addCharacter();
    setSelectedCharacterIndex(newIndex);
  };
  
  // 캐릭터 제거
  const handleRemoveCharacter = (index: number) => {
    removeCharacter(index);
    
    // 선택된 캐릭터가 삭제된 경우 선택 해제
    if (selectedCharacterIndex === index) {
      setSelectedCharacterIndex(null);
    }
  };
  
  // 캐릭터 순서 변경
  const handleReorderCharacter = (index: number, direction: 'up' | 'down') => {
    const indexInArray = characterIndices.indexOf(index);
    if (indexInArray === -1) return;
    
    const targetIndex = direction === 'up' 
      ? indexInArray - 1 
      : indexInArray + 1;
    
    if (targetIndex < 0 || targetIndex >= characterIndices.length) return;
    
    reorderCharacters(indexInArray, targetIndex);
  };
  
  // 캐릭터 프롬프트 업데이트
  const handleUpdateCharacterPrompt = () => {
    if (selectedCharacterIndex === null || !newCharacterText.trim()) return;
    
    const character = characters[selectedCharacterIndex];
    if (!character) return;
    
    const rootId = character[promptType];
    if (!rootId) return;
    
    const rootSegment = segments[rootId];
    
    if (!rootSegment) {
      // 루트 세그먼트가 없는 경우 새로 생성
      const newRootId = createAndAddTextSegment(newCharacterText);
      
      // 루트 세그먼트 설정
      character[promptType] = newRootId;
    } else {
      // 기존 루트 세그먼트의 텍스트 내용 업데이트
      updateSegment(rootId, { content: newCharacterText });
    }
    
    // 입력 필드 초기화
    setNewCharacterText('');
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-4">캐릭터 목록</h2>
        
        <button
          onClick={handleAddCharacter}
          className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          새 캐릭터 추가
        </button>
        
        {characterIndices.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            캐릭터가 없습니다. 새 캐릭터를 추가해보세요.
          </p>
        ) : (
          <ul className="space-y-2">
            {characterIndices.map(index => (
              <li 
                key={index}
                className={`p-3 rounded-md flex justify-between items-center ${
                  selectedCharacterIndex === index
                    ? 'bg-blue-100 dark:bg-blue-900/20'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                onClick={() => setSelectedCharacterIndex(index)}
              >
                <span className="font-medium">캐릭터 #{index}</span>
                
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReorderCharacter(index, 'up'); }}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    disabled={characterIndices.indexOf(index) === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReorderCharacter(index, 'down'); }}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    disabled={characterIndices.indexOf(index) === characterIndices.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (window.confirm(`캐릭터 #${index}을 삭제하시겠습니까?`)) {
                        handleRemoveCharacter(index);
                      }
                    }}
                    className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {selectedCharacterIndex === null ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">캐릭터를 선택해주세요</h3>
            <p className="text-gray-500 dark:text-gray-400">
              왼쪽에서 캐릭터를 선택하거나 새 캐릭터를 추가하세요.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">캐릭터 #{selectedCharacterIndex} 편집</h2>
              
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
            
            <div className="mb-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 mb-2">
                <h4 className="font-medium mb-1">현재 프롬프트:</h4>
                <pre className="whitespace-pre-wrap break-words text-sm font-mono">
                  {getSelectedCharacterPrompt() || '(비어있음)'}
                </pre>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">프롬프트 수정:</h4>
                <textarea
                  value={newCharacterText}
                  onChange={(e) => setNewCharacterText(e.target.value)}
                  placeholder="캐릭터 프롬프트 입력..."
                  className="w-full h-32 p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-3"
                />
                <button
                  onClick={handleUpdateCharacterPrompt}
                  disabled={!newCharacterText.trim()}
                  className={`px-4 py-2 rounded-md ${
                    newCharacterText.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  프롬프트 업데이트
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  * 캐릭터 프롬프트는 세그먼트 형태로 저장되지 않고 텍스트로만 저장됩니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharactersPanel;