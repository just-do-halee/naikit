import { useCallback } from 'react';
import { BracketType, Segment } from '@main/src/modules/segment-model/types';
import { useSegmentStore } from '@/store/segment-store';
import { parseNovelAIPrompt } from '@main/src/modules/compiler/segment-parser';

export const useSegmentActions = () => {
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

  // 현재 루트 세그먼트 ID 가져오기
  const getRootSegmentId = useCallback((promptType: 'positive' | 'negative') => {
    return rootSegments.main[promptType];
  }, [rootSegments.main]);

  // 텍스트 세그먼트 추가
  const addTextSegment = useCallback((content: string, promptType: 'positive' | 'negative') => {
    if (!content.trim()) return null;
    
    const rootId = getRootSegmentId(promptType);
    const segmentId = createAndAddTextSegment(content, rootId);
    return segmentId;
  }, [createAndAddTextSegment, getRootSegmentId]);

  // 인라인 와일드카드 세그먼트 추가
  const addInlineWildcard = useCallback((optionsString: string, promptType: 'positive' | 'negative') => {
    if (!optionsString.trim()) return null;
    
    const options = optionsString
      .split('|')
      .map(option => option.trim())
      .filter(option => option.length > 0);
    
    if (options.length === 0) return null;
    
    const rootId = getRootSegmentId(promptType);
    const segmentId = createAndAddInlineWildcardSegment(options, rootId);
    return segmentId;
  }, [createAndAddInlineWildcardSegment, getRootSegmentId]);

  // 프리셋 세그먼트 추가
  const addPreset = useCallback((
    presetName: string,
    presetMode: 'random' | 'fixed',
    presetSelected: string,
    presetValues: string,
    promptType: 'positive' | 'negative'
  ) => {
    if (!presetName.trim()) return null;
    
    // 값 목록 처리 (쉼표로 구분된 값을 배열로 변환)
    const valueArray = presetValues.trim()
      ? presetValues.split(',').map(v => v.trim()).filter(v => v.length > 0)
      : [];
    
    // 항상 랜덤 모드로 먼저 생성 (값 목록 설정 후 고정 모드로 전환 가능)
    const rootId = getRootSegmentId(promptType);
    const segmentId = createAndAddPresetSegment(
      presetName,
      'random', // 항상 랜덤 모드로 시작
      undefined, // 선택된 값 없음
      valueArray, // 값 목록
      rootId
    );
    
    return segmentId;
  }, [createAndAddPresetSegment, getRootSegmentId]);

  // 가중치 세그먼트 생성 (선택된 세그먼트들을 감싸는 새 세그먼트)
  const addWeightedSegment = useCallback((
    segmentIds: string[],
    bracketType: BracketType,
    bracketLevel: number,
    promptType: 'positive' | 'negative'
  ) => {
    if (segmentIds.length === 0) return null;
    
    const rootId = getRootSegmentId(promptType);
    const segmentId = createAndAddWeightedSegment(
      segmentIds,
      bracketType,
      bracketLevel,
      rootId
    );
    
    return segmentId;
  }, [createAndAddWeightedSegment, getRootSegmentId]);

  // 텍스트 세그먼트 내용 업데이트
  const updateTextSegment = useCallback((segmentId: string, content: string) => {
    // 세그먼트가 루트인지 확인
    const rootPositiveId = getRootSegmentId('positive');
    const rootNegativeId = getRootSegmentId('negative');
    
    // 세그먼트 업데이트
    updateSegment(segmentId, { content });
  }, [updateSegment, getRootSegmentId]);

  // 텍스트로 프롬프트 가져오기
  const importPrompt = useCallback((text: string, promptType: 'positive' | 'negative') => {
    if (!text.trim()) return false;
    
    try {
      const parsedSegment = parseNovelAIPrompt(text);
      
      // 기존 루트 세그먼트에 추가
      if (parsedSegment.children && parsedSegment.children.length > 0) {
        const rootId = getRootSegmentId(promptType);
        const rootSeg = segments[rootId];
        
        if (!rootSeg.children) {
          updateSegment(rootId, { children: [...parsedSegment.children] });
        } else {
          updateSegment(rootId, { 
            children: [...rootSeg.children, ...parsedSegment.children] 
          });
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error parsing prompt:', error);
      return false;
    }
  }, [segments, updateSegment, getRootSegmentId]);

  // 세그먼트 삭제
  const deleteSegment = useCallback((segmentId: string) => {
    removeSegment(segmentId);
  }, [removeSegment]);

  // 세그먼트 가져오기
  const getSegment = useCallback((segmentId: string): Segment | undefined => {
    return segments[segmentId];
  }, [segments]);

  return {
    addTextSegment,
    addInlineWildcard,
    addPreset,
    addWeightedSegment,
    updateTextSegment,
    importPrompt,
    deleteSegment,
    getSegment,
    getRootSegmentId,
  };
};