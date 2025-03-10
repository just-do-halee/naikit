/**
 * 프롬프트 컴파일러 타입 정의
 */

import { Segment } from '../segment-model/types';

/**
 * 컴파일 옵션 인터페이스
 */
export interface CompileOptions {
  /** 와일드카드 확장 여부 */
  expandWildcards?: boolean;
  
  /** 난수 생성 시드 (결정적 결과용) */
  seed?: number;
  
  /** 비동기 처리 여부 */
  async?: boolean;
}

/**
 * NovelAI 프롬프트 구조
 */
export interface NovelAIPrompt {
  /** 메인 긍정 프롬프트 */
  mainPositive: string;
  
  /** 메인 부정 프롬프트 */
  mainNegative: string;
  
  /** 캐릭터 프롬프트 */
  characters: {
    [characterIndex: number]: {
      positive: string;
      negative: string;
    };
  };
}

/**
 * 파싱 결과 인터페이스
 */
export interface ParseResult {
  /** 성공 여부 */
  success: boolean;
  
  /** 결과 세그먼트 */
  segment?: Segment;
  
  /** 오류 메시지 */
  error?: string;
}

/**
 * 와일드카드 확장 옵션
 */
export interface WildcardExpansionOptions {
  /** 난수 생성 함수 */
  random: () => number;
  
  /** 최대 중첩 깊이 */
  maxDepth?: number;
}
