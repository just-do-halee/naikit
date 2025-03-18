/**
 * 세그먼트 모델 타입 정의
 *
 * NaiKit의 모든 프롬프트 요소를 구조화된 세그먼트 객체로 표현하는 핵심 타입 정의
 */

/**
 * 세그먼트 타입 리터럴 유니온
 */
export type SegmentType = "text" | "weighted" | "preset" | "inline_wildcard";

/**
 * 기본 세그먼트 인터페이스
 * 모든 세그먼트 타입의 기본이 되는 공통 속성 정의
 */
export interface BaseSegment {
  /** 세그먼트 고유 식별자 */
  id: string;

  /** 세그먼트 타입 */
  type: SegmentType;

  /** 자식 세그먼트 배열 (중첩 구조용) */
  children?: Segment[];

  /** 추가 메타데이터 (UI 상태, 색상 등) */
  metadata?: Record<string, unknown>;
}

/**
 * 텍스트 세그먼트 인터페이스
 * 일반 텍스트 내용을 나타내는 가장 기본적인 세그먼트
 */
export interface TextSegment extends BaseSegment {
  type: "text";

  /** 실제 텍스트 내용 */
  content: string;
}

/**
 * 가중치 적용 타입 ('증가' 또는 '감소')
 */
export type BracketType = "increase" | "decrease";

/**
 * 가중치 세그먼트 인터페이스
 * 텍스트나 다른 세그먼트의 중요도를 조절하는 세그먼트
 */
export interface WeightedSegment extends BaseSegment {
  type: "weighted";

  /** 가중치 적용 타입 ('증가' = 중괄호, '감소' = 대괄호) */
  bracketType: BracketType;

  /** 괄호 레벨 (양수: 중괄호 수, 음수: 대괄호 수) */
  bracketLevel: number;

  /** UI 표시용 실제 가중치 값 (1.05의 거듭제곱으로 계산) */
  displayValue: number;
}

/**
 * 프리셋 모드 타입 ('랜덤' = 와일드카드, '고정' = 키워드)
 */
export type PresetMode = "random" | "fixed";

/**
 * 프리셋 세그먼트 인터페이스
 * 와일드카드와 키워드를 동일 모델로 통합
 */
export interface PresetSegment extends BaseSegment {
  type: "preset";

  /** 프리셋 이름 */
  name: string;

  /** 모드 ('random' = 와일드카드, 'fixed' = 키워드) */
  mode: PresetMode;

  /** 키워드 모드일 때 선택된 항목 */
  selected?: string;

  /** 메타데이터 - 확장 */
  metadata?: {
    /** 색상 */
    color?: string;

    /** 프리셋 값 캐싱 */
    values?: string[];

    /** 기본 가중치 */
    defaultWeight?: number;

    /** 접두사 */
    prefix?: string;

    /** 접미사 */
    suffix?: string;
  };
}

/**
 * 인라인 와일드카드 세그먼트 인터페이스
 * 괄호와 파이프로 표현되는 인라인 선택 옵션
 */
export interface InlineWildcardSegment extends BaseSegment {
  type: "inline_wildcard";

  /** 선택 가능한 옵션들 */
  options: string[];

  /** 메타데이터 - 확장 */
  metadata?: {
    /** 색상 */
    color?: string;
  };
}

/**
 * 세그먼트 유니온 타입
 * 모든 세그먼트 타입을 포함하는 유니온
 */
export type Segment =
  | TextSegment
  | WeightedSegment
  | PresetSegment
  | InlineWildcardSegment;

/**
 * 그룹 가중치 모드 ('상대적' 또는 '절대적')
 */
export type GroupWeightMode = "relative" | "absolute";

/**
 * 그룹 객체 인터페이스
 * 관련 세그먼트를 함께 관리하기 위한 그룹
 */
export interface Group {
  /** 그룹 고유 식별자 */
  id: string;

  /** 그룹 이름 */
  name: string;

  /** 그룹에 포함된 세그먼트 ID 목록 */
  segmentIds: string[];

  /** 가중치 적용 모드 ('relative' = 비율 유지, 'absolute' = 동일 값) */
  weightMode: GroupWeightMode;

  /** 그룹 색상 */
  color: string;
}

/**
 * 루트 세그먼트 구조 정의
 * 메인 및 캐릭터 프롬프트 참조 구조
 */
export interface RootSegments {
  main: {
    positive: string; // root segment ID
    negative: string; // root segment ID
  };
  characters: {
    [characterIndex: number]: {
      positive: string; // root segment ID
      negative: string; // root segment ID
    };
  };
}

/**
 * 세그먼트 타입 가드 함수들
 */
// main/src/modules/segment-model/types.ts
export function isTextSegment(segment: Segment): segment is TextSegment {
  const result = segment.type === "text";
  return result;
}

export function isWeightedSegment(
  segment: Segment
): segment is WeightedSegment {
  const result = segment.type === "weighted";
  return result;
}

export function isPresetSegment(segment: Segment): segment is PresetSegment {
  const result = segment.type === "preset";
  return result;
}

export function isInlineWildcardSegment(
  segment: Segment
): segment is InlineWildcardSegment {
  const result = segment.type === "inline_wildcard";
  return result;
}
