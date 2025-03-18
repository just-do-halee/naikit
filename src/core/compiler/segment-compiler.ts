/**
 * 세그먼트 컴파일러 (세그먼트 → 텍스트)
 *
 * 세그먼트 객체 모델을 NovelAI 호환 텍스트로 변환하는 컴파일러
 */

import {
  Segment,
  isTextSegment,
  isWeightedSegment,
  isPresetSegment,
  isInlineWildcardSegment,
  BracketType,
  PresetSegment,
  InlineWildcardSegment,
} from "../segment-model/types";
import {
  CompileOptions,
  NovelAIPrompt,
  WildcardExpansionOptions,
} from "./types";
import { RootSegments } from "../segment-model/types";
import { assertExists } from "@/shared/utils/type-safety";

/**
 * 시드 기반 난수 생성기
 *
 * @param seed 난수 생성 시드
 * @returns 난수 생성 함수
 */
export function createSeededRandom(seed: number): () => number {
  let currentSeed = seed;

  return function () {
    // 선형 합동 생성기 (Linear Congruential Generator)
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
}

/**
 * 세그먼트 트리를 NovelAI 호환 텍스트로 컴파일
 *
 * @param rootSegment 루트 세그먼트
 * @param options 컴파일 옵션
 * @returns 컴파일된 텍스트
 */
export function compileSegmentTree(
  rootSegment: Segment,
  options: CompileOptions = {}
): string {
  assertExists(rootSegment, "Root segment is required for compilation");

  const { expandWildcards = false, seed = Date.now() } = options;

  // 시드 기반 난수 생성기 초기화
  const random = createSeededRandom(seed);

  // 세그먼트 처리 및 결과 반환
  const result = processSegment(rootSegment, { random, expandWildcards });

  // 디버그용 로그 (개발모드에서만 출력)
  if (process.env.NODE_ENV === 'development' && false) { // Disable logging for now
    console.log("Root segment:", JSON.stringify(rootSegment, null, 2));
    console.log("Compiled result:", result);
  }

  // 결과가 비어있을 경우 자식 세그먼트 직접 처리 시도
  if (!result && rootSegment.children && rootSegment.children.length > 0) {
    console.log("루트 세그먼트 결과가 비어있고 자식이 있어 직접 처리 시도");

    // 자식 세그먼트 처리 결과 결합
    const childResults = rootSegment.children
      .map((child) => processSegment(child, { random, expandWildcards }))
      .filter(Boolean)
      .join("");

    console.log("자식 세그먼트 직접 처리 결과:", childResults);
    return childResults;
  }

  return result;
}

/**
 * 세그먼트를 재귀적으로 처리하는 내부 함수
 *
 * @param segment 처리할 세그먼트
 * @param context 컴파일 컨텍스트
 * @returns 컴파일된 텍스트
 */
function processSegment(
  segment: Segment | undefined,
  context: { random: () => number; expandWildcards: boolean }
): string {
  if (!segment) return "";

  // 디버깅 주석 처리 (성능 이슈)
  // console.log(`Processing segment of type: ${segment.type}`);

  // 세그먼트 타입별 처리
  if (isTextSegment(segment)) {
    // console.log(`Text segment content: "${segment.content}"`);
    return segment.content || "";
  }

  if (isPresetSegment(segment)) {
    const result = compilePresetSegment(
      segment,
      context.random,
      context.expandWildcards
    );
    // console.log(`Preset segment result: "${result}"`);
    return result;
  }

  if (isWeightedSegment(segment)) {
    // 자식 먼저 처리
    // console.log(`Processing weighted segment with ${segment.children?.length || 0} children`);
    const childrenContent =
      segment.children
        ?.map((child) => processSegment(child, context))
        .join("") || "";

    // 가중치 적용
    const result = applyBrackets(
      childrenContent,
      segment.bracketType,
      segment.bracketLevel
    );
    // console.log(`Weighted segment result: "${result}"`);
    return result;
  }

  if (isInlineWildcardSegment(segment)) {
    const result = compileInlineWildcard(
      segment,
      context.random,
      context.expandWildcards
    );
    // console.log(`Inline wildcard result: "${result}"`);
    return result;
  }

  // 타입별 처리가 없는 경우, 자식 세그먼트 처리
  const unknownSegment = segment as unknown as {
    children?: Segment[];
    type?: string;
  };
  if (unknownSegment.children && unknownSegment.children.length > 0) {
    // console.log(`Processing ${unknownSegment.children.length} children of segment type: ${unknownSegment.type || 'unknown'}`);
    const results = unknownSegment.children.map((child: Segment) =>
      processSegment(child, context)
    );
    const result = results.join("");
    // console.log(`Result after processing children: "${result}"`);
    return result;
  }

  // 자식이 없는 텍스트 세그먼트로 간주
  if ("content" in segment) {
    const content = (segment as any).content || "";
    // console.log(`Generic content: "${content}"`);
    return content;
  }

  // console.log(`No handler for segment type: ${(segment as any).type || 'unknown'}`);
  return "";
}

/**
 * 프리셋 세그먼트 컴파일
 *
 * @param segment 프리셋 세그먼트
 * @param random 난수 생성기
 * @param expandWildcards 와일드카드 확장 여부
 * @returns 컴파일된 텍스트
 */
export function compilePresetSegment(
  segment: PresetSegment,
  random: () => number,
  expandWildcards: boolean
): string {
  assertExists(segment.name, "Preset segment must have a name");

  if (segment.mode === "random") {
    // 와일드카드 모드
    if (expandWildcards) {
      // 프리셋 값 가져오기
      const values = (segment.metadata?.values as string[] | undefined) || [];

      // 값이 있으면 무작위 선택
      if (values && values.length > 0) {
        const randomIndex = Math.floor(random() * values.length);
        return values[randomIndex];
      }

      // 값이 없으면 빈 문자열 반환 (오류 발생하지 않음)
      return "";
    } else {
      // 확장하지 않고 원본 표현 유지
      return `!${segment.name}`;
    }
  } else {
    // 고정(키워드) 모드
    if (!segment.selected) {
      // 선택된 항목이 없으면 오류 (실제 출력에는 포함)
      return `[ERROR:선택되지 않은 키워드-${segment.name}]`;
    }

    // 고정 모드에서는 선택된 값만 직접 반환
    return segment.selected;
  }
}

/**
 * 가중치 괄호 적용
 *
 * @param content 내용
 * @param bracketType 괄호 타입
 * @param bracketLevel 괄호 레벨
 * @returns 괄호로 감싸진 텍스트
 */
export function applyBrackets(
  content: string,
  bracketType: BracketType,
  bracketLevel: number
): string {
  // 중립 가중치는 그대로 반환
  if (bracketLevel === 0) {
    return content;
  }

  // 괄호 문자 선택
  const bracket = bracketType === "increase" ? "{}" : "[]";

  // 괄호로 감싸기
  let result = content;
  for (let i = 0; i < bracketLevel; i++) {
    result = bracket[0] + result + bracket[1];
  }

  return result;
}

/**
 * 인라인 와일드카드 컴파일
 *
 * @param segment 인라인 와일드카드 세그먼트
 * @param random 난수 생성기
 * @param expandWildcards 와일드카드 확장 여부
 * @returns 컴파일된 텍스트
 */
export function compileInlineWildcard(
  segment: InlineWildcardSegment,
  random: () => number,
  expandWildcards: boolean
): string {
  if (expandWildcards) {
    // 옵션이 있으면 무작위 선택
    if (segment.options && segment.options.length > 0) {
      const randomIndex = Math.floor(random() * segment.options.length);
      return segment.options[randomIndex];
    }

    // 옵션이 없으면 빈 문자열 반환
    return "";
  } else {
    // 확장하지 않고 원본 형식 유지
    return `(${segment.options.join("|")})`;
  }
}

/**
 * 중첩된 와일드카드 확장 (최적화 버전)
 *
 * O(n) 시간 복잡도 달성 (n: 입력 문자열 길이)
 * 공간 복잡도 O(d*n) (d: 중첩 깊이, n: 입력 길이)
 *
 * @param text 확장할 텍스트
 * @param options 확장 옵션
 * @returns 확장된 텍스트
 */
export function expandNestedWildcards(
  text: string,
  options: WildcardExpansionOptions
): string {
  const { random, maxDepth = 10 } = options;

  // 최적화 1: 와일드카드가 없으면 빠르게 반환
  if (!text.includes("(")) return text;

  // 최적화 2: 결과 캐싱 (중복 계산 방지)
  const cache = new Map<string, string>();

  /**
   * 재귀적으로 와일드카드 확장
   */
  function expand(input: string, depth: number): string {
    // 기저 조건: 최대 깊이 초과
    if (depth > maxDepth) {
      return `[최대 중첩 깊이 초과: ${input}]`;
    }

    // 최적화 3: 캐시 활용 (동일 입력+깊이 조합)
    const cacheKey = `${depth}:${input}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    // 최적화 4: 결과 누적에 배열 사용 (문자열 연결보다 효율적)
    const segments: string[] = [];

    // 스택 기반 파서 (괄호 균형을 정확히 추적)
    let i = 0;
    while (i < input.length) {
      if (input[i] !== "(") {
        // 일반 문자는 그대로 추가
        const start = i;
        while (i < input.length && input[i] !== "(") i++;
        segments.push(input.slice(start, i));
        continue;
      }

      // 와일드카드 파싱 시작
      const startPos = i;
      let bracketDepth = 1;
      i++; // 여는 괄호 다음부터 검색

      // 닫는 괄호 찾기 (중첩 레벨 고려)
      while (i < input.length && bracketDepth > 0) {
        if (input[i] === "(") bracketDepth++;
        else if (input[i] === ")") bracketDepth--;
        i++;
      }

      // 유효한 와일드카드 패턴
      if (bracketDepth === 0) {
        const endPos = i - 1;
        // 괄호 내용 추출 (괄호 제외)
        const content = input.substring(startPos + 1, endPos);

        // 옵션 파싱 및 선택
        const choices = parseInlineOptions(content);
        if (choices.length > 0) {
          const selectedIndex = Math.floor(random() * choices.length);
          // 재귀적 처리 (깊이 증가)
          segments.push(expand(choices[selectedIndex], depth + 1));
        }
      } else {
        // 괄호 불균형 - 일반 텍스트로 처리
        segments.push("(");
        i = startPos + 1;
      }
    }

    // 최종 결과 조합
    const result = segments.join("");

    // 결과 캐싱
    cache.set(cacheKey, result);
    return result;
  }

  return expand(text, 0);
}

/**
 * 인라인 옵션 파싱 (파이프로 구분된 옵션)
 *
 * @param optionsText 옵션 텍스트
 * @returns 파싱된 옵션 배열
 */
function parseInlineOptions(optionsText: string): string[] {
  // 최적화: 파이프가 없으면 단일 옵션으로 빠르게 반환
  if (!optionsText.includes("|")) {
    return optionsText.trim() ? [optionsText.trim()] : [];
  }

  const options: string[] = [];
  let current = "";
  let depth = 0;

  // 한번의 순회로 옵션 추출
  for (let i = 0; i < optionsText.length; i++) {
    const char = optionsText[i];

    if (char === "(") {
      depth++;
      current += char;
    } else if (char === ")") {
      depth--;
      current += char;
    } else if (char === "|" && depth === 0) {
      // 최상위 레벨 파이프는 옵션 구분자
      options.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // 마지막 옵션 추가
  if (current.trim()) {
    options.push(current.trim());
  }

  return options;
}

/**
 * 루트 세그먼트와 세그먼트 맵에서 NovelAI 프롬프트 컴파일
 *
 * @param segments 세그먼트 맵
 * @param rootSegments 루트 세그먼트 참조
 * @param options 컴파일 옵션
 * @returns NovelAI 프롬프트 객체
 */
export function compileToNovelAIPrompt(
  segments: Record<string, Segment>,
  rootSegments: RootSegments,
  options: CompileOptions = {}
): NovelAIPrompt {
  const result: NovelAIPrompt = {
    mainPositive: "",
    mainNegative: "",
    characters: {},
  };

  // 메인 프롬프트 컴파일
  if (rootSegments.main.positive && segments[rootSegments.main.positive]) {
    result.mainPositive = compileSegmentTree(
      segments[rootSegments.main.positive],
      options
    );
  }

  if (rootSegments.main.negative && segments[rootSegments.main.negative]) {
    result.mainNegative = compileSegmentTree(
      segments[rootSegments.main.negative],
      options
    );
  }

  // 캐릭터 프롬프트 컴파일
  for (const [indexStr, character] of Object.entries(rootSegments.characters)) {
    const index = parseInt(indexStr);

    result.characters[index] = {
      positive: "",
      negative: "",
    };

    if (character.positive && segments[character.positive]) {
      result.characters[index].positive = compileSegmentTree(
        segments[character.positive],
        options
      );
    }

    if (character.negative && segments[character.negative]) {
      result.characters[index].negative = compileSegmentTree(
        segments[character.negative],
        options
      );
    }
  }

  return result;
}

/**
 * 증분 컴파일 (변경된 부분만 재컴파일)
 *
 * @param segments 세그먼트 맵
 * @param lastKnownSegments 마지막으로 알려진 세그먼트 맵
 * @param changedIds 변경된 세그먼트 ID 배열
 * @param options 컴파일 옵션
 * @returns 컴파일된 텍스트 맵
 */
export function incrementalCompile(
  segments: Record<string, Segment>,
  _lastKnownSegments: Record<string, Segment>,
  changedIds: string[],
  options: CompileOptions = {}
): Record<string, string> {
  // 변경된 세그먼트가 없으면 빈 객체 반환
  if (changedIds.length === 0) {
    return {};
  }

  // 결과 객체
  const result: Record<string, string> = {};

  // 변경된 ID별로 컴파일
  for (const id of changedIds) {
    if (segments[id]) {
      result[id] = compileSegmentTree(segments[id], options);
    }
  }

  return result;
}

/**
 * 세그먼트 트리 비동기 컴파일
 * 대규모 세그먼트 트리를 웹 워커를 사용해 비동기적으로 처리
 *
 * @param rootSegment 루트 세그먼트
 * @param options 컴파일 옵션
 * @returns 컴파일된 텍스트를 담은 Promise
 */
export async function compileSegmentTreeAsync(
  rootSegment: Segment,
  options: CompileOptions = {}
): Promise<string> {
  // 트리 복잡도 계산
  const complexity = calculateTreeComplexity(rootSegment);

  // 임계값 미만이면 동기 처리
  if (complexity < 100) {
    return compileSegmentTree(rootSegment, options);
  }

  // 웹 워커 지원 확인
  if (typeof Worker === "undefined") {
    console.warn(
      "Web Workers not supported. Falling back to synchronous compilation."
    );
    return compileSegmentTree(rootSegment, options);
  }

  // 웹 워커로 처리 (실제 구현 시에는 별도 워커 파일 필요)
  return new Promise((resolve, reject) => {
    try {
      // 메인 스레드에서 처리 (웹 워커 구현 전 임시 방식)
      setTimeout(() => {
        try {
          const result = compileSegmentTree(rootSegment, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 0);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 세그먼트 트리 복잡도 계산 (노드 수 기준)
 *
 * @param segment 루트 세그먼트
 * @returns 트리 복잡도 점수
 */
function calculateTreeComplexity(segment: Segment): number {
  let complexity = 1; // 현재 노드

  // 자식 노드 복잡도 추가
  if (segment.children && segment.children.length > 0) {
    segment.children.forEach((child) => {
      complexity += calculateTreeComplexity(child);
    });
  }

  return complexity;
}

// 컴파일러 성능 최적화를 위한 메모이제이션 적용
// export const memoizedCompileSegmentTree = memoize(compileSegmentTree);

import { incrementalCompileSegmentTree } from "./segment-incremental-compiler";
export const memoizedCompileSegmentTree = incrementalCompileSegmentTree;
