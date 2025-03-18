/**
 * 세그먼트 팩토리 함수
 *
 * 각 세그먼트 타입의 인스턴스를 일관된 방식으로 생성하는 팩토리 함수 모음
 */

import { nanoid } from "nanoid";
import {
  Segment,
  TextSegment,
  WeightedSegment,
  PresetSegment,
  InlineWildcardSegment,
  BracketType,
  PresetMode,
} from "./types";
import { memoize } from "@/shared/utils/memoize";
import { assertExists } from "@/shared/utils/type-safety";

/**
 * 가중치 값 계산 (1.05의 거듭제곱)
 * 메모이제이션으로 성능 최적화
 *
 * @param bracketLevel 괄호 레벨
 * @param bracketType 괄호 타입 ('increase' 또는 'decrease')
 * @returns 계산된 가중치 값
 */
export const calculateDisplayValue = memoize(
  (bracketLevel: number, bracketType: BracketType): number => {
    // 중립 가중치 (레벨 0)
    if (bracketLevel === 0) return 1.0;

    // 증가 또는 감소에 따른 계산
    if (bracketType === "increase") {
      // 1.05^레벨
      return Math.pow(1.05, bracketLevel);
    } else {
      // 1.05^(-레벨)
      return Math.pow(1.05, -bracketLevel);
    }
  }
);

/**
 * 세그먼트 ID 생성
 *
 * @param prefix 접두사 (선택사항)
 * @returns 고유한 ID
 */
export function generateSegmentId(prefix?: string): string {
  const id = nanoid(8); // 8자 길이 ID
  const result = prefix ? `${prefix}_${id}` : id;
  return result;
}

/**
 * 텍스트 세그먼트 생성 함수
 *
 * @param content 텍스트 내용
 * @returns 생성된 텍스트 세그먼트
 */
export function createTextSegment(content: string): TextSegment {
  if (content === undefined) {
    throw new Error("Content is undefined");
  }
  const segment: TextSegment = {
    id: generateSegmentId("txt"),
    type: "text",
    content,
  };
  return segment;
}

/**
 * 가중치 세그먼트 생성 함수
 *
 * @param children 가중치가 적용될 자식 세그먼트 배열
 * @param bracketType 괄호 타입 ('increase' 또는 'decrease')
 * @param bracketLevel 괄호 레벨 (1 이상의 정수)
 * @returns 생성된 가중치 세그먼트
 */
export function createWeightedSegment(
  children: Segment[],
  bracketType: BracketType,
  bracketLevel: number
): WeightedSegment {
  // 매개변수 검증
  if (bracketLevel < 0) {
    throw new Error("Bracket level must be a non-negative integer");
  }

  if (bracketLevel > 78) {
    throw new Error("Bracket level exceeds maximum allowed value (78)");
  }

  // 자식 세그먼트 깊은 복사 (불변성 보장)
  const childrenCopy = children.map((child) => ({ ...child }));

  // 가중치 값 계산
  const displayValue = calculateDisplayValue(bracketLevel, bracketType);

  // 색상 강도 계산 (가중치 기반)
  let colorIntensity = 0.3; // 기본 강도

  if (bracketType === "increase") {
    if (displayValue > 3.0) colorIntensity = 0.8;
    else if (displayValue > 1.5) colorIntensity = 0.6;
  } else {
    if (displayValue < 0.4) colorIntensity = 0.8;
    else if (displayValue < 0.7) colorIntensity = 0.6;
  }

  const result: WeightedSegment = {
    id: generateSegmentId("wgt"),
    type: "weighted",
    bracketType,
    bracketLevel,
    displayValue,
    children: childrenCopy,
    metadata: {
      intensity: colorIntensity,
    },
  };

  return result;
}

/**
 * 프리셋 세그먼트 생성 함수
 *
 * @param name 프리셋 이름
 * @param mode 모드 ('random' = 와일드카드, 'fixed' = 키워드)
 * @param selected 키워드 모드일 때 선택된 항목
 * @param values 프리셋 값 배열 (캐싱용)
 * @returns 생성된 프리셋 세그먼트
 */
export function createPresetSegment(
  name: string,
  mode: PresetMode,
  selected?: string,
  values?: string[]
): PresetSegment {
  // 매개변수 검증
  assertExists(name, "Preset name is required");

  // 모드 검증
  if (mode === "fixed" && !selected) {
    console.warn(
      `Selected value should be provided for fixed preset "${name}"`
    );
  }

  // 모드에 따른 색상 설정
  const color = mode === "random" ? "#8E6FD8" : "#4A9F8E";

  return {
    id: generateSegmentId("pre"),
    type: "preset",
    name,
    mode,
    selected,
    metadata: {
      color,
      values: values || [],
    },
  };
}

/**
 * 인라인 와일드카드 세그먼트 생성 함수
 *
 * @param options 선택 가능한 옵션 배열
 * @returns 생성된 인라인 와일드카드 세그먼트
 */
export function createInlineWildcardSegment(
  options: string[]
): InlineWildcardSegment {
  // 매개변수 검증
  if (!Array.isArray(options) || options.length === 0) {
    throw new Error("Options must be a non-empty array");
  }

  return {
    id: generateSegmentId("wld"),
    type: "inline_wildcard",
    options: [...options], // 배열 복사 (불변성 보장)
    metadata: {
      color: "#8E6FD8",
    },
  };
}

/**
 * 세그먼트 깊은 복제 함수
 *
 * @param segment 복제할 세그먼트
 * @returns 깊은 복제된 세그먼트
 */
export function cloneSegment<T extends Segment>(segment: T): T {
  const clone = { ...segment } as T;

  // 자식 세그먼트가 있으면 재귀적으로 복제
  if (segment.children && segment.children.length > 0) {
    clone.children = segment.children.map(cloneSegment);
  }

  return clone;
}
