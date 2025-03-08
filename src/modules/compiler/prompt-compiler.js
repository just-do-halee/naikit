// modules/compiler/prompt-compiler.js
import { SegmentType, PresetMode, WeightType } from "../segment-model";

/**
 * 시드 기반 난수 생성기 생성
 * @param {number} seed - 난수 생성 시드
 * @returns {Function} 0~1 사이 난수를 반환하는 함수
 */
function createSeededRandom(seed) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/**
 * 세그먼트 트리를 NovelAI 호환 텍스트로 컴파일
 * @param {Object} rootSegment - 컴파일할 루트 세그먼트
 * @param {Object} options - 컴파일 옵션
 * @param {boolean} options.expandWildcards - 와일드카드 확장 여부
 * @param {number} options.seed - 난수 생성 시드
 * @returns {string} 컴파일된 텍스트
 */
export function compileSegmentTree(rootSegment, options = {}) {
  const expandWildcards = options.expandWildcards || false;
  const randomSeed = options.seed || Date.now();

  // 난수 생성기 (시드 기반)
  const random = createSeededRandom(randomSeed);

  // 세그먼트 처리 함수
  function processSegment(segment) {
    if (!segment) return "";

    // 세그먼트 타입별 처리
    switch (segment.type) {
      case SegmentType.TEXT:
        return segment.content || "";

      case SegmentType.PRESET:
        return compilePresetSegment(segment, random, expandWildcards);

      case SegmentType.WEIGHTED:
        // 자식 먼저 처리
        const content = segment.children
          .map((child) => processSegment(child))
          .join("");

        // 가중치 적용
        return applyBrackets(content, segment);

      case SegmentType.INLINE_WILDCARD:
        return compileInlineWildcard(segment, random, expandWildcards);

      default:
        // 알 수 없는 타입은 자식만 처리
        if (segment.children && segment.children.length > 0) {
          return segment.children.map(processSegment).join("");
        }
        return "";
    }
  }

  return processSegment(rootSegment);
}

/**
 * 프리셋 세그먼트 컴파일
 * @param {Object} segment - 프리셋 세그먼트
 * @param {Function} random - 난수 생성 함수
 * @param {boolean} expandWildcards - 와일드카드 확장 여부
 * @returns {string} 컴파일된 텍스트
 */
function compilePresetSegment(segment, random, expandWildcards) {
  if (segment.mode === PresetMode.RANDOM) {
    // 와일드카드 모드
    if (expandWildcards) {
      // 프리셋 값 가져오기
      const values =
        segment.metadata?.values || fetchPresetValues(segment.name);

      // 무작위 선택
      if (values && values.length > 0) {
        const randomIndex = Math.floor(random() * values.length);
        return values[randomIndex];
      }

      return `[ERROR:빈 와일드카드-${segment.name}]`;
    } else {
      // 확장하지 않고 원본 표현 유지
      return `!${segment.name}`;
    }
  } else {
    // 키워드 모드
    if (!segment.selected) {
      return `[ERROR:선택되지 않은 키워드-${segment.name}]`;
    }

    return `${segment.name}:${segment.selected}`;
  }
}

/**
 * 인라인 와일드카드 컴파일
 * @param {Object} segment - 인라인 와일드카드 세그먼트
 * @param {Function} random - 난수 생성 함수
 * @param {boolean} expandWildcards - 와일드카드 확장 여부
 * @returns {string} 컴파일된 텍스트
 */
function compileInlineWildcard(segment, random, expandWildcards) {
  if (expandWildcards) {
    // 무작위 옵션 선택
    if (segment.options && segment.options.length > 0) {
      const randomIndex = Math.floor(random() * segment.options.length);
      return segment.options[randomIndex];
    }

    return "";
  } else {
    // 원본 형식 유지
    return `(${segment.options.join("|")})`;
  }
}

/**
 * 가중치 세그먼트에 괄호 적용
 * @param {string} content - 괄호로 감쌀 내용
 * @param {Object} segment - 가중치 세그먼트
 * @returns {string} 괄호가 적용된 텍스트
 */
function applyBrackets(content, segment) {
  // 중립 가중치(1.0)는 그대로 반환
  if (segment.bracketLevel === 0) {
    return content;
  }

  // 괄호 문자 선택
  const bracket = segment.bracketType === WeightType.INCREASE ? "{}" : "[]";

  // 괄호로 감싸기
  let result = content;
  for (let i = 0; i < segment.bracketLevel; i++) {
    result = bracket[0] + result + bracket[1];
  }

  return result;
}

/**
 * 프리셋 이름으로 값 배열 가져오기
 * @param {string} presetName - 프리셋 이름
 * @returns {Array<string>} 프리셋 값 배열
 */
function fetchPresetValues(presetName) {
  // 실제 구현에서는 프리셋 스토리지에서 값을 가져옴
  // 여기서는 예시 구현
  const presetStorage = window.presetStorage || {};
  return presetStorage[presetName] || [];
}

/**
 * NovelAI 텍스트를 세그먼트 트리로 파싱
 * @param {string} text - 파싱할 텍스트
 * @returns {Object} 파싱된 세그먼트 트리
 */
export function parseNovelAIPrompt(text) {
  const {
    BaseSegment,
    TextSegment,
    WeightedSegment,
  } = require("../segment-model");
  const { SegmentType, WeightType } = require("../segment-model");

  const root = new BaseSegment("root", SegmentType.ROOT);
  const stack = [root];
  let currentText = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // 가중치 시작 감지
    if (char === "{" || char === "[") {
      // 현재까지의 텍스트 처리
      if (currentText) {
        stack[stack.length - 1].addChild(new TextSegment(currentText));
        currentText = "";
      }

      // 새 가중치 세그먼트 생성
      const weightType =
        char === "{" ? WeightType.INCREASE : WeightType.DECREASE;
      const weightSegment = new WeightedSegment(weightType, 1);

      // 스택에 추가
      stack[stack.length - 1].addChild(weightSegment);
      stack.push(weightSegment);
    }
    // 가중치 종료 감지
    else if (char === "}" || char === "]") {
      // 현재까지의 텍스트 처리
      if (currentText) {
        stack[stack.length - 1].addChild(new TextSegment(currentText));
        currentText = "";
      }

      // 스택에서 최상위 세그먼트 꺼내기
      if (stack.length > 1) {
        const segment = stack.pop();

        // 올바른 종료 괄호인지 확인
        const isValid =
          (segment.bracketType === WeightType.INCREASE && char === "}") ||
          (segment.bracketType === WeightType.DECREASE && char === "]");

        if (!isValid) {
          // 오류 처리: 괄호 쌍 불일치
          console.warn("Bracket mismatch detected");
        }
      }
    }
    // 일반 텍스트
    else {
      currentText += char;
    }
  }

  // 남은 텍스트 처리
  if (currentText) {
    stack[stack.length - 1].addChild(new TextSegment(currentText));
  }

  // 스택이 깨끗하게 비워졌는지 확인
  if (stack.length > 1) {
    // 오류 처리: 닫히지 않은 괄호
    console.warn("Unclosed brackets detected");
  }

  return root;
}

/**
 * 세그먼트 트리 최적화
 * - 연속된 텍스트 세그먼트 병합
 * - 빈 세그먼트 제거
 * @param {Object} rootSegment - 최적화할 루트 세그먼트
 */
export function optimizeSegmentTree(rootSegment) {
  // 빈 세그먼트 제거
  rootSegment.children = rootSegment.children.filter((child) => {
    if (
      child.type === SegmentType.TEXT &&
      (!child.content || child.content.length === 0)
    ) {
      return false;
    }
    return true;
  });

  // 연속된 텍스트 세그먼트 병합
  for (let i = 0; i < rootSegment.children.length - 1; i++) {
    const current = rootSegment.children[i];
    const next = rootSegment.children[i + 1];

    if (current.type === SegmentType.TEXT && next.type === SegmentType.TEXT) {
      current.content += next.content;
      rootSegment.children.splice(i + 1, 1);
      i--; // 인덱스 조정
    }
  }

  // 재귀적으로 자식 세그먼트 최적화
  for (const child of rootSegment.children) {
    if (child.children && child.children.length > 0) {
      optimizeSegmentTree(child);
    }
  }
}

/**
 * 중첩된 와일드카드를 확장
 * @param {string} text - 와일드카드를 포함한 텍스트
 * @param {Function} random - 난수 생성 함수
 * @param {number} depth - 현재 재귀 깊이
 * @returns {string} 확장된 텍스트
 */
export function expandNestedWildcards(text, random, depth = 0) {
  if (depth > 10) {
    return "[최대 중첩 깊이 초과]";
  }

  // 인라인 와일드카드 패턴 검색
  return text.replace(
    /\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g,
    (match, options) => {
      const choices = parseInlineOptions(options);

      if (choices.length === 0) return "";

      // 무작위 선택
      const selected = choices[Math.floor(random() * choices.length)];

      // 선택된 옵션에 중첩된 와일드카드가 있는지 확인하고 재귀적으로 처리
      return expandNestedWildcards(selected, random, depth + 1);
    }
  );
}

/**
 * 인라인 와일드카드 옵션 파싱
 * @param {string} optionsText - 파이프로 구분된 옵션 텍스트
 * @returns {Array<string>} 파싱된 옵션 배열
 */
function parseInlineOptions(optionsText) {
  return optionsText.split("|").map((option) => option.trim());
}
