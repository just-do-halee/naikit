import { useState, useEffect } from 'react';
import { useSegmentStore } from '@/store/segment-store';
import { useModeStore, EditorMode } from '@/store/mode-store';
import { useGroupStore } from '@/store/group-store';
import { compileToNovelAIPrompt, compileSegmentTree } from '@main/src/modules/compiler';
import MainLayout from './layouts/MainLayout';
import EditorPanel from './features/editor/EditorPanel';
import ViewerPanel from './features/viewer/ViewerPanel';
import CharactersPanel from './features/characters/CharactersPanel';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'viewer' | 'characters'>('editor');
  const [compiledPrompt, setCompiledPrompt] = useState<{
    mainPositive: string;
    mainNegative: string;
    characters: Record<number, { positive: string; negative: string }>;
  }>({
    mainPositive: '',
    mainNegative: '',
    characters: {},
  });

  // Get store states and actions
  const { segments, rootSegments, lastCompileVersion } = useSegmentStore();
  const { currentMode, switchMode } = useModeStore();
  
  // 직접 컴파일 로직 (디버깅용)
  function compileSegmentWithLogging(segment: any, options: any = {}): string {
    console.log("직접 컴파일 시도:", { segment, options });
    
    if (!segment) {
      console.log("세그먼트가 없음");
      return '';
    }
    
    // 텍스트 세그먼트 처리
    if (segment.type === 'text') {
      console.log(`텍스트 세그먼트 컴파일: ${segment.content}`);
      const result = segment.content || '';
      console.log("텍스트 세그먼트 컴파일 결과:", result);
      return result;
    }
    
    // 인라인 와일드카드 처리
    if (segment.type === 'inline_wildcard') {
      console.log(`인라인 와일드카드 컴파일: ${segment.options.join('|')}`);
      const result = `(${segment.options.join('|')})`;
      console.log("인라인 와일드카드 컴파일 결과:", result);
      return result;
    }
    
    // 자식 세그먼트 처리
    if (segment.children?.length > 0) {
      console.log(`자식이 있는 세그먼트 컴파일: ${segment.children.length}개`);
      let childrenResults = '';
      
      // 각 자식 세그먼트 컴파일
      for (const child of segment.children) {
        const childResult = compileSegmentWithLogging(child, options);
        console.log(`자식 [${child.id}] 컴파일 결과:`, childResult);
        
        if (childResult) {
          childrenResults += (childrenResults ? ' ' : '') + childResult;
        }
      }
      
      console.log("자식들 전체 컴파일 결과:", childrenResults);
      
      // 텍스트 세그먼트인데 내용이 있으면, 자식 앞에 추가
      if (segment.type === 'text' && segment.content) {
        const combinedResult = segment.content + ' ' + childrenResults;
        console.log("텍스트+자식 결합 결과:", combinedResult);
        return combinedResult;
      }
      
      return childrenResults;
    }
    
    console.log("처리할 수 없는 세그먼트 타입:", segment.type);
    return '';
  }
  
  // Compile prompt when segments or rootSegments change
  useEffect(() => {
    try {
      // 메인 루트 세그먼트 가져오기
      const mainPositiveRoot = segments[rootSegments.main.positive];
      const mainNegativeRoot = segments[rootSegments.main.negative];
      
      console.log("Main positive root:", mainPositiveRoot);
      console.log("Main negative root:", mainNegativeRoot);
      
      // 직접 구현한 컴파일러로 처리해보기
      let mainPositiveCompiled = '';
      let mainNegativeCompiled = '';
      
      if (mainPositiveRoot) {
        console.log("디버깅용 직접 컴파일러로 메인 긍정 세그먼트 컴파일");
        mainPositiveCompiled = compileSegmentWithLogging(mainPositiveRoot);
        console.log("디버깅 컴파일 최종 결과:", mainPositiveCompiled);
      }
      
      if (mainNegativeRoot) {
        console.log("디버깅용 직접 컴파일러로 메인 부정 세그먼트 컴파일");
        mainNegativeCompiled = compileSegmentWithLogging(mainNegativeRoot);
        console.log("디버깅 컴파일 최종 결과:", mainNegativeCompiled);
      }
      
      // main 폴더의 컴파일러 먼저 테스트 (수정됨)
      let compiledResult = {
        mainPositive: '',
        mainNegative: '',
        characters: {}
      };
      
      try {
        console.log("main 폴더의 수정된 compileToNovelAIPrompt 함수 테스트");
        
        // 와일드카드 확장하지 않은 상태로 컴파일 (확장은 뷰어에서 수행)
        compiledResult = compileToNovelAIPrompt(segments, rootSegments, { 
          expandWildcards: false  // 와일드카드 확장 비활성화 (뷰어에서 처리)
        });
        console.log("와일드카드 확장된 main 컴파일 결과:", compiledResult);
        
        // main 폴더 컴파일 결과가 유효하면 이것 사용
        if (compiledResult.mainPositive || compiledResult.mainNegative) {
          setCompiledPrompt(compiledResult);
          console.log("main 폴더 컴파일러 결과 사용");
          return; // 성공적으로 컴파일됨
        }
      } catch (mainCompilerError) {
        console.error("main 폴더 컴파일러 오류:", mainCompilerError);
      }
      
      // main 폴더 컴파일러가 실패했거나 결과가 없으면 직접 컴파일한 결과 사용
      console.log("직접 컴파일러 결과 사용");
      setCompiledPrompt({
        mainPositive: mainPositiveCompiled,
        mainNegative: mainNegativeCompiled,
        characters: {}
      });
      
      // 이미 main 폴더 컴파일러를 테스트했기 때문에 이 부분은 제거
      
    } catch (error) {
      console.error('Error compiling prompt:', error);
      
      // 오류 발생 시 빈 결과로 대체
      setCompiledPrompt({
        mainPositive: '',
        mainNegative: '',
        characters: {}
      });
    }
  }, [segments, rootSegments, lastCompileVersion]);

  // Render active panel based on tab
  const renderActivePanel = () => {
    switch (activeTab) {
      case 'editor':
        return <EditorPanel />;
      case 'viewer':
        return <ViewerPanel compiledPrompt={compiledPrompt} />;
      case 'characters':
        return <CharactersPanel />;
      default:
        return <EditorPanel />;
    }
  };

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentMode={currentMode}
      switchMode={switchMode}
    >
      {renderActivePanel()}
    </MainLayout>
  );
}

export default App;