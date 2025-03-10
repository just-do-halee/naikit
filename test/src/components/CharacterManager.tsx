import React, { useState, useEffect } from 'react';
import { useSegmentStore } from '@/store/segment-store';
import { useModeStore } from '@/store/mode-store';
import { compileSegmentTree } from '@main/src/modules/compiler/segment-compiler';

const CharacterManager: React.FC = () => {
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState<number | null>(null);
  const [promptType, setPromptType] = useState<'positive' | 'negative'>('positive');
  const [newCharacterText, setNewCharacterText] = useState('');

  // 스토어에서 필요한 상태와 액션 가져오기
  const {
    segments,
    rootSegments,
    addCharacter,
    removeCharacter,
    reorderCharacters,
    createAndAddTextSegment,
    updateSegment,
  } = useSegmentStore();
  
  // 모드 스토어에서 값과 액션 가져오기
  const { currentMode } = useModeStore();
  
  // 모드 변경 시 동작 설정
  useEffect(() => {
    // 컴포즈 모드일 때만 캐릭터 관리 편집 가능하도록 설정
    if (currentMode === 'finetune') {
      // 파인튜닝 모드에서는 UI만 보여주고 편집은 불가능하게 할 수 있음
    }
  }, [currentMode]);

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
      // 기존 세그먼트 업데이트
      updateSegment(rootId, { content: newCharacterText });
    }
    
    // 텍스트 필드 초기화
    setNewCharacterText('');
  };

  // 캐릭터 프롬프트 불러오기
  const handleLoadCharacterPrompt = () => {
    const prompt = getSelectedCharacterPrompt();
    setNewCharacterText(prompt);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">캐릭터 관리</h2>
        {currentMode === 'compose' && (
          <button
            onClick={handleAddCharacter}
            className="btn btn-primary"
          >
            새 캐릭터 추가
          </button>
        )}
        {currentMode === 'finetune' && (
          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-800 dark:text-blue-300 text-sm">
            파인튜닝 모드 - 보기 전용
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 캐릭터 목록 패널 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:col-span-1">
          <h3 className="text-xl font-semibold mb-4">캐릭터 목록</h3>
          
          {characterIndices.length > 0 ? (
            <ul className="space-y-2">
              {characterIndices.map((index) => (
                <li
                  key={index}
                  className={`p-3 border rounded-md ${
                    selectedCharacterIndex === index
                      ? 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700'
                      : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                  } hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer`}
                  onClick={() => setSelectedCharacterIndex(index)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">캐릭터 #{index}</span>
                    <div className="flex space-x-1">
                      {currentMode === 'compose' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorderCharacter(index, 'up');
                            }}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                            title="위로 이동"
                            disabled={characterIndices.indexOf(index) === 0}
                          >
                            ↑
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorderCharacter(index, 'down');
                            }}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                            title="아래로 이동"
                            disabled={characterIndices.indexOf(index) === characterIndices.length - 1}
                          >
                            ↓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCharacter(index);
                            }}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                            title="캐릭터 삭제"
                          >
                            ×
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic text-center py-4">
              캐릭터가 없습니다. 새 캐릭터를 추가하세요.
            </p>
          )}
        </div>
        
        {/* 캐릭터 편집 패널 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              {selectedCharacterIndex !== null
                ? `캐릭터 #${selectedCharacterIndex} 편집`
                : '캐릭터 선택하기'}
            </h3>
            
            {selectedCharacterIndex !== null && (
              <div className="flex space-x-2">
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
            )}
          </div>
          
          {selectedCharacterIndex !== null ? (
            <div className="space-y-4">
              <div className="flex space-x-2 mb-2">
                <button
                  onClick={handleLoadCharacterPrompt}
                  className="btn btn-secondary"
                >
                  현재 프롬프트 불러오기
                </button>
              </div>
              
              <textarea
                value={newCharacterText}
                onChange={(e) => setNewCharacterText(e.target.value)}
                placeholder={`캐릭터 #${selectedCharacterIndex}의 ${
                  promptType === 'positive' ? '긍정' : '부정'
                } 프롬프트를 입력하세요...`}
                disabled={currentMode === 'finetune'}
                className={`w-full h-64 p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-4 ${
                  currentMode === 'finetune' ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''
                }`}
              />
              
              {currentMode === 'compose' && (
                <button
                  onClick={handleUpdateCharacterPrompt}
                  className="btn btn-primary"
                  disabled={!newCharacterText.trim()}
                >
                  프롬프트 저장
                </button>
              )}
              
              {currentMode === 'finetune' && (
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-800 dark:text-blue-300 text-sm">
                  파인튜닝 모드에서는 캐릭터 프롬프트를 직접 편집할 수 없습니다. 
                  컴포즈 모드로 전환하여 편집하세요.
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic text-center py-12">
              왼쪽 목록에서 캐릭터를 선택하거나 새 캐릭터를 추가하세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterManager;