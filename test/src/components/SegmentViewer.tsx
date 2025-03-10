import React, { useState } from 'react';
import { useSegmentStore } from '@/store/segment-store';
import { useModeStore } from '@/store/mode-store';
import { useGroupStore } from '@/store/group-store';
import { compileToNovelAIPrompt } from '@main/src/modules/compiler';

interface SegmentViewerProps {
  compiledPrompt: {
    mainPositive: string;
    mainNegative: string;
    characters: Record<number, { positive: string; negative: string }>;
  };
}

const SegmentViewer: React.FC<SegmentViewerProps> = ({ compiledPrompt }) => {
  const [expandWildcards, setExpandWildcards] = useState(false);
  const [customSeed, setCustomSeed] = useState<number | undefined>(undefined);
  const [useSeed, setUseSeed] = useState(false);
  
  const { segments, rootSegments } = useSegmentStore();
  const { currentMode } = useModeStore();
  const { groups } = useGroupStore();
  
  // 와일드카드 확장 처리
  const handleCompile = () => {
    // 랜덤 시드 생성 또는 지정된 값 사용
    const seed = useSeed && customSeed !== undefined ? customSeed : Date.now();
    
    // 프롬프트 컴파일
    const compiled = compileToNovelAIPrompt(segments, rootSegments, {
      expandWildcards,
      seed,
    });
    
    // 출력용 포맷팅
    const formattedOutput = JSON.stringify(compiled, null, 2);
    
    // 결과 다운로드
    const blob = new Blob([formattedOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold">프롬프트 뷰어</h2>
          <div className="ml-4 px-3 py-1 rounded text-sm bg-gray-100 dark:bg-gray-700">
            현재 모드: {currentMode === 'compose' ? '컴포즈' : '파인튜닝'}
          </div>
        </div>
        <div className="space-x-2">
          <div className="inline-flex items-center mr-4">
            <input
              type="checkbox"
              id="expandWildcards"
              checked={expandWildcards}
              onChange={(e) => setExpandWildcards(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="expandWildcards">와일드카드 확장</label>
          </div>
          
          <div className="inline-flex items-center mr-4">
            <input
              type="checkbox"
              id="useSeed"
              checked={useSeed}
              onChange={(e) => setUseSeed(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="useSeed">시드 사용</label>
            {useSeed && (
              <input
                type="number"
                value={customSeed || ''}
                onChange={(e) => setCustomSeed(parseInt(e.target.value) || undefined)}
                placeholder="난수 시드"
                className="input ml-2 w-32"
              />
            )}
          </div>
          
          <button
            onClick={handleCompile}
            className="btn btn-primary"
          >
            프롬프트 다운로드
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-xl font-semibold mb-2">메인 프롬프트</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-medium mb-1 text-green-600 dark:text-green-400">Positive:</h4>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-60">
              <pre className="whitespace-pre-wrap break-words">{compiledPrompt.mainPositive}</pre>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-1 text-red-600 dark:text-red-400">Negative:</h4>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-60">
              <pre className="whitespace-pre-wrap break-words">{compiledPrompt.mainNegative}</pre>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(compiledPrompt.characters).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-xl font-semibold mb-2">캐릭터 프롬프트</h3>
          <div className="space-y-6">
            {Object.entries(compiledPrompt.characters).map(([charIndex, character]) => (
              <div key={charIndex} className="border-t pt-4 first:border-0 first:pt-0">
                <h4 className="text-lg font-medium mb-2">캐릭터 #{charIndex}</h4>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-base font-medium mb-1 text-green-600 dark:text-green-400">Positive:</h5>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-60">
                      <pre className="whitespace-pre-wrap break-words">{character.positive}</pre>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-base font-medium mb-1 text-red-600 dark:text-red-400">Negative:</h5>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-60">
                      <pre className="whitespace-pre-wrap break-words">{character.negative}</pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SegmentViewer;