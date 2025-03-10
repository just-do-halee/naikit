import React, { useState, useEffect } from 'react';
import { expandNestedWildcards, createSeededRandom } from '@main/src/modules/compiler';
import { WildcardExpansionOptions } from '@main/src/modules/compiler';
import { useSegmentStore } from '@/store/segment-store';

interface ViewerPanelProps {
  compiledPrompt: {
    mainPositive: string;
    mainNegative: string;
    characters: Record<number, { positive: string; negative: string }>;
  };
}

const ViewerPanel: React.FC<ViewerPanelProps> = ({ compiledPrompt }) => {
  const [promptType, setPromptType] = useState<'positive' | 'negative'>('positive');
  const [expandWildcards, setExpandWildcards] = useState(false);
  const [seed, setSeed] = useState<number | null>(null);
  
  // 다운로드 처리
  const handleDownload = () => {
    const text = promptType === 'positive' 
      ? compiledPrompt.mainPositive 
      : compiledPrompt.mainNegative;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `prompt_${promptType}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // 랜덤 시드 생성
  const generateRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 4294967295));
  };
  
  // 확장된 프롬프트 저장
  const [expandedPrompt, setExpandedPrompt] = useState<{
    mainPositive: string;
    mainNegative: string;
    characters: Record<number, { positive: string; negative: string }>;
  }>({
    mainPositive: '',
    mainNegative: '',
    characters: {}
  });
  
  // 추가 확장 처리 함수
  const processPromptText = (text: string, random: () => number): string => {
    // 인라인 와일드카드 확장 ((a|b|c) → a 또는 b 또는 c 중 하나)
    let processedText = text.replace(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, (match, options) => {
      const choices = options.split('|').map((opt: string) => opt.trim());
      if (choices.length === 0) return '';
      
      const selectedIndex = Math.floor(random() * choices.length);
      return choices[selectedIndex];
    });

    // 랜덤 프리셋 확장 (!name → 실제 값)
    // 특수문자(한글 포함)도 처리할 수 있도록 정규식 수정
    processedText = processedText.replace(/!([^\s\(\){}[\]]+)/g, (match, presetName) => {
      console.log(`프리셋 확장 시도: '${presetName}'`);
      
      // 일반 값 처리 - 세그먼트 스토어에서 우선 검색
      try {
        // 세그먼트 스토어에서 프리셋 세그먼트 찾기
        const { segments } = useSegmentStore.getState();
        
        // 디버깅 정보
        console.log(`세그먼트 스토어 상태:`, Object.keys(segments).length, '개 세그먼트');
        
        // 모든 세그먼트 중에서 해당 이름의 프리셋 세그먼트 찾기
        const presetSegments = Object.values(segments).filter(seg => 
          seg.type === 'preset' && seg.name === presetName
        );
        
        if (presetSegments.length > 0) {
          const presetSegment = presetSegments[0];
          console.log(`스토어에서 프리셋 찾음:`, presetSegment);
          
          // 고정 모드 확인 - 고정 모드면 선택된 값 반환
          if (presetSegment.type === 'preset' && presetSegment.mode === 'fixed' && presetSegment.selected) {
            console.log(`고정 모드 프리셋 '${presetName}', 선택된 값: '${presetSegment.selected}'`);
            return presetSegment.selected;
          }
          
          // 랜덤 모드 처리
          if (presetSegment.type === 'preset' && presetSegment.mode === 'random') {
            // 값 목록 추출
            const values = presetSegment.metadata?.values as string[] || [];
            
            if (values && values.length > 0) {
              // 랜덤 선택
              const selectedIndex = Math.floor(random() * values.length);
              const selectedValue = values[selectedIndex];
              console.log(`랜덤 모드 프리셋 '${presetName}' 값 선택: '${selectedValue}'`);
              return selectedValue;
            }
          }
        }
      } catch (error) {
        console.error(`프리셋 스토어 검색 중 오류: ${error}`);
      }
      
      // 스토어에서 찾지 못한 경우 테스트값 사용
      // 한글, 특수문자 등 모든 프리셋 이름 처리를 위한 테스트용 확장 값
      const testValues: Record<string, string[]> = {
        'color': ['red', 'blue', 'green', 'yellow', 'purple'],
        'material': ['metal', 'wood', 'glass', 'plastic', 'fabric'],
        'size': ['small', 'medium', 'large', 'tiny', 'huge'],
        'qwd': ['qwe', 'qweqwd', 'QWdqwd'],
        'ㅂㅈㅇㅂㅇ': ['옵션1-확장됨', '옵션2-확장됨', '옵션3-확장됨']
      };
      
      // 테스트 값 확인
      if (testValues[presetName] && testValues[presetName].length > 0) {
        const selectedIndex = Math.floor(random() * testValues[presetName].length);
        const selectedValue = testValues[presetName][selectedIndex];
        console.log(`테스트 프리셋 '${presetName}' 확장 결과: '${selectedValue}'`);
        return selectedValue;
      }
      
      // 해당 프리셋이 없는 경우 디버깅을 위해 태그 표시
      console.log(`프리셋 '${presetName}' 찾을 수 없음, 원본 유지`);
      return `[프리셋확장실패:${presetName}]`;
    });

    return processedText;
  };

  // 와일드카드 확장 처리 (expandWildcards, seed 변경 시)
  useEffect(() => {
    console.log("와일드카드 확장 설정 변경:", { expandWildcards, seed });
    
    // 사용할 시드 결정 (명시적 시드 or 현재 시간)
    const finalSeed = seed !== null ? seed : Date.now();
    console.log("사용할 시드:", finalSeed);
    
    // 시드 기반 난수 생성기 초기화
    const randomGenerator = createSeededRandom(finalSeed);
    
    // 원본 컴파일 결과 복사
    const newExpanded = { ...compiledPrompt };
    
    // 와일드카드 확장이 활성화된 경우에만 처리
    if (expandWildcards) {
      console.log("와일드카드 확장 처리 시작");
      
      // 메인 긍정/부정 프롬프트 확장 (두 가지 방법 모두 시도)
      try {
        // 1. main 컴파일러의 expandNestedWildcards 함수 사용
        const expansionOptions: WildcardExpansionOptions = {
          random: randomGenerator,
          maxDepth: 10
        };
        
        // 먼저 processPromptText 함수로 기본 확장
        let processedPositive = processPromptText(newExpanded.mainPositive, randomGenerator);
        let processedNegative = processPromptText(newExpanded.mainNegative, randomGenerator);
        
        // 그 다음 중첩 와일드카드 확장
        newExpanded.mainPositive = expandNestedWildcards(processedPositive, expansionOptions);
        newExpanded.mainNegative = expandNestedWildcards(processedNegative, expansionOptions);
        
        console.log("확장 결과:", {
          original: compiledPrompt.mainPositive,
          processed: processedPositive,
          final: newExpanded.mainPositive
        });
        
        // 캐릭터 프롬프트도 확장
        Object.keys(newExpanded.characters).forEach(index => {
          const idx = parseInt(index);
          
          // 먼저 기본 확장
          let processedCharPos = processPromptText(newExpanded.characters[idx].positive, randomGenerator);
          let processedCharNeg = processPromptText(newExpanded.characters[idx].negative, randomGenerator);
          
          // 중첩 와일드카드 확장
          newExpanded.characters[idx].positive = expandNestedWildcards(processedCharPos, expansionOptions);
          newExpanded.characters[idx].negative = expandNestedWildcards(processedCharNeg, expansionOptions);
        });
      } catch (error) {
        console.error("와일드카드 확장 중 오류 발생:", error);
      }
    } else {
      console.log("와일드카드 확장 비활성화 상태");
    }
    
    // 확장된 프롬프트 설정
    setExpandedPrompt(newExpanded);
  }, [compiledPrompt, expandWildcards, seed]);
  
  // 프롬프트 텍스트 가져오기
  const getPromptText = () => {
    // 확장 여부에 따라 적절한 프롬프트 선택
    const sourcePrompt = expandWildcards ? expandedPrompt : compiledPrompt;
    
    // 선택된 프롬프트 타입에 따라 반환
    return promptType === 'positive'
      ? sourcePrompt.mainPositive
      : sourcePrompt.mainNegative;
  };
  
  // 클립보드에 복사
  const copyToClipboard = () => {
    const text = getPromptText();
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('클립보드에 복사되었습니다.');
      })
      .catch(err => {
        console.error('클립보드 복사 실패:', err);
        alert('클립보드 복사에 실패했습니다.');
      });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">프롬프트 뷰어</h2>
        
        <div className="flex justify-between items-center mb-4">
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
          
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={copyToClipboard}
            >
              복사
            </button>
            <button
              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
              onClick={handleDownload}
            >
              다운로드
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="expandWildcards"
              checked={expandWildcards}
              onChange={e => setExpandWildcards(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="expandWildcards">와일드카드 확장</label>
          </div>
          
          {expandWildcards && (
            <div className="flex items-center gap-2">
              <label htmlFor="seed">시드:</label>
              <input
                type="number"
                id="seed"
                value={seed || ''}
                onChange={e => setSeed(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="랜덤 시드"
                className="w-32 p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                className="px-2 py-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md"
                onClick={generateRandomSeed}
              >
                랜덤
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <pre className="whitespace-pre-wrap break-words text-sm font-mono">
          {getPromptText() || '프롬프트가 비어있습니다.'}
        </pre>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">캐릭터 프롬프트</h3>
        
        {(() => {
          // 캐릭터 데이터 준비
          const sourcePrompt = expandWildcards ? expandedPrompt : compiledPrompt;
          const characterCount = Object.keys(sourcePrompt.characters).length;
          
          // 캐릭터가 없는 경우
          if (characterCount === 0) {
            return <p className="text-gray-500 dark:text-gray-400">캐릭터가 없습니다.</p>;
          }
          
          // 캐릭터가 있는 경우
          return (
            <div className="space-y-4">
              {Object.entries(sourcePrompt.characters).map(([characterIndex, character]) => (
                <div 
                  key={characterIndex}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <h4 className="font-medium mb-2">캐릭터 #{characterIndex}</h4>
                  <div className="mb-2">
                    <h5 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Positive:</h5>
                    <pre className="whitespace-pre-wrap break-words text-xs font-mono p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {character.positive || '(비어있음)'}
                    </pre>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Negative:</h5>
                    <pre className="whitespace-pre-wrap break-words text-xs font-mono p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {character.negative || '(비어있음)'}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ViewerPanel;