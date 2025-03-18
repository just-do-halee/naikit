/**
 * 세그먼트 파서 (텍스트 → 세그먼트)
 *
 * NovelAI 프롬프트 텍스트를 세그먼트 객체 트리로 파싱
 */

import { Segment, WeightedSegment } from "../segment-model/types";
import {
  createTextSegment,
  createWeightedSegment,
  createInlineWildcardSegment,
  createPresetSegment,
} from "../segment-model/segment-factory";
import { optimizeSegmentTree } from "../segment-model/segment-operations";
import { ParseResult } from "./types";
import { assertExists } from "@/shared/utils/type-safety";

/**
 * 세그먼트를 텍스트로 간단 변환 (파싱 오류 처리용)
 *
 * @param segment 세그먼트
 * @returns 텍스트 표현
 */
function compileSegmentToText(segment: Segment): string {
  if (segment.type === "text") {
    return segment.content;
  } else if (segment.type === "weighted") {
    const content =
      segment.children?.map((c) => compileSegmentToText(c)).join("") || "";
    const bracket = segment.bracketType === "increase" ? "{}" : "[]";

    // 괄호 레벨만큼 감싸기
    let result = content;
    for (let i = 0; i < segment.bracketLevel; i++) {
      result = bracket[0] + result + bracket[1];
    }

    return result;
  } else if (segment.type === "preset") {
    if (segment.mode === "random") {
      return `!${segment.name}`;
    } else {
      return `${segment.name}:${segment.selected || ""}`;
    }
  } else if (segment.type === "inline_wildcard") {
    return `(${segment.options.join("|")})`;
  }

  return "";
}

/**
 * 연속된 동일 괄호의 개수를 세는 함수
 *
 * @param text 전체 텍스트
 * @param startPos 시작 위치
 * @returns [중첩 레벨, 마지막 인덱스]
 */
function countConsecutiveBrackets(
  text: string,
  startPos: number
): [number, number] {
  const bracketChar = text[startPos];
  let level = 1;
  let currentPos = startPos + 1;

  // 연속된 동일 괄호 개수 세기
  while (currentPos < text.length && text[currentPos] === bracketChar) {
    level++;
    currentPos++;
  }

  return [level, currentPos - 1];
}

/**
 * NovelAI 프롬프트 텍스트를 세그먼트 트리로 파싱
 *
 * @param text 파싱할 텍스트
 * @returns 파싱된 루트 세그먼트
 */
export function parseNovelAIPrompt(text: string): Segment {
  // 루트 텍스트 세그먼트 생성
  const root = createTextSegment("");
  root.children = [];

  // 빈 텍스트인 경우 빈 트리 반환
  if (!text || text.trim() === "") {
    return root;
  }

  // 파싱 상태
  const stack: Segment[] = [root];
  let currentText = "";

  // 텍스트 문자별로 처리
  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // 가중치 시작 감지 (중괄호 또는 대괄호)
    if (char === "{" || char === "[") {
      // 현재까지의 텍스트 처리
      if (currentText) {
        addTextToCurrentSegment(stack, currentText);
        currentText = "";
      }

      // 연속된 괄호 개수 세기
      const [bracketLevel, lastIndex] = countConsecutiveBrackets(text, i);

      // 새 가중치 세그먼트 생성 (중첩 레벨 적용)
      const weightedSegment = createWeightedSegment(
        [],
        char === "{" ? "increase" : "decrease",
        bracketLevel
      );

      // 스택에 추가
      stack.push(weightedSegment);

      // 인덱스 이동 (이미 처리한 연속 괄호는 건너뛰기)
      i = lastIndex;
    }
    // 가중치 종료 감지
    else if (char === "}" || char === "]") {
      // 현재까지의 텍스트 처리
      if (currentText) {
        addTextToCurrentSegment(stack, currentText);
        currentText = "";
      }

      // 연속된 닫는 괄호 개수 세기
      const [closingBracketCount, lastIndex] = countConsecutiveBrackets(
        text,
        i
      );

      // 스택에서 최상위 세그먼트 꺼내기
      if (stack.length > 1) {
        const segment = stack.pop() as WeightedSegment;

        // 올바른 종료 괄호인지 확인
        const isValid =
          (segment.bracketType === "increase" && char === "}") ||
          (segment.bracketType === "decrease" && char === "]");

        // 괄호 레벨이 맞는지 확인 (optional)
        const levelMatches = segment.bracketLevel === closingBracketCount;

        if (!isValid || !levelMatches) {
          // 오류 처리: 괄호 쌍 불일치 - 임시로 텍스트로 처리
          const bracketChar = segment.bracketType === "increase" ? "{" : "[";
          let errorText = "";

          // 원래 괄호 레벨만큼 여는 괄호 추가
          for (let j = 0; j < segment.bracketLevel; j++) {
            errorText += bracketChar;
          }

          // 내용 추가
          errorText +=
            segment.children
              ?.map((child) => compileSegmentToText(child))
              .join("") || "";

          // 닫는 괄호 레벨만큼 닫는 괄호 추가
          for (let j = 0; j < closingBracketCount; j++) {
            errorText += char;
          }

          const errorSegment = createTextSegment(errorText);
          addSegmentToParent(stack, errorSegment);
        } else {
          // 정상적인 경우 부모 세그먼트에 추가
          addSegmentToParent(stack, segment);
        }
      }

      // 인덱스 이동 (이미 처리한 연속 괄호는 건너뛰기)
      i = lastIndex;
    }
    // 느낌표 시작 (프리셋 가능성)
    else if (char === "!" && currentText === "") {
      // 프리셋 이름 추출 시도
      const presetMatch = text
        .slice(i)
        .match(/^!([a-zA-Z0-9_\-\u3131-\uD79D가-힣]+)/);

      if (presetMatch) {
        const presetName = presetMatch[1];

        // 프리셋 세그먼트 생성
        const presetSegment = createPresetSegment(presetName, "random");
        addSegmentToParent(stack, presetSegment);

        // 다음 위치로 인덱스 이동
        i += presetName.length;
      } else {
        // 프리셋이 아닌 경우 일반 텍스트로 처리
        currentText += char;
      }
    }
    // 키워드 패턴 인식
    else if (
      currentText === "" &&
      /[a-zA-Z0-9_\-\u3131-\uD79D가-힣]/.test(char)
    ) {
      // 키워드 패턴 검사
      const keywordMatch = text
        .slice(i)
        .match(/^([a-zA-Z0-9_\-\u3131-\uD79D가-힣]+):([^,\s:]+)/);

      if (keywordMatch) {
        const keywordName = keywordMatch[1];
        const keywordValue = keywordMatch[2];

        // 키워드 세그먼트 생성
        const keywordSegment = createPresetSegment(
          keywordName,
          "fixed",
          keywordValue
        );
        addSegmentToParent(stack, keywordSegment);

        // 다음 위치로 인덱스 이동
        i += keywordName.length + keywordValue.length + 1; // +1 for colon
      } else {
        // 키워드가 아닌 경우 일반 텍스트로 처리
        currentText += char;
      }
    }
    // 인라인 와일드카드 시작 감지
    else if (char === "(" && isInlineWildcardStart(text, i)) {
      // 현재까지의 텍스트 처리
      if (currentText) {
        addTextToCurrentSegment(stack, currentText);
        currentText = "";
      }

      // 인라인 와일드카드 종료 위치 찾기
      const [endPos, _bracketLevel] = findMatchingClosingBracket(text, i);

      if (endPos === -1) {
        // 종료 괄호를 찾지 못한 경우 일반 텍스트로 처리
        currentText += char;
      } else {
        // 와일드카드 내용 추출
        const wildcardContent = text.substring(i + 1, endPos);

        // 옵션 파싱
        const options = parseInlineWildcardOptions(wildcardContent);

        // 인라인 와일드카드 세그먼트 생성
        const wildcardSegment = createInlineWildcardSegment(options);
        addSegmentToParent(stack, wildcardSegment);

        // 다음 위치로 인덱스 이동
        i = endPos;
      }
    }
    // 일반 텍스트
    else {
      currentText += char;
    }
  }

  // 남은 텍스트 처리
  if (currentText) {
    addTextToCurrentSegment(stack, currentText);
  }

  // 스택이 깨끗하게 비워졌는지 확인
  while (stack.length > 1) {
    // 닫히지 않은 괄호 처리
    const segment = stack.pop() as WeightedSegment;
    const bracketChar = segment.bracketType === "increase" ? "{" : "[";

    // 텍스트로 변환 (중첩 레벨 고려)
    let unclosedText = "";

    // 괄호 레벨만큼 여는 괄호 추가
    for (let i = 0; i < segment.bracketLevel; i++) {
      unclosedText += bracketChar;
    }

    // 내용 추가
    unclosedText +=
      segment.children?.map((child) => compileSegmentToText(child)).join("") ||
      "";

    const errorSegment = createTextSegment(unclosedText);
    addSegmentToParent(stack, errorSegment);
  }

  // 최적화 및 반환
  return optimizeSegmentTree(root);
}

/**
 * 현재 스택의 최상위 세그먼트에 텍스트 추가하는 헬퍼 함수
 */
function addTextToCurrentSegment(stack: Segment[], text: string): void {
  const textSegment = createTextSegment(text);
  addSegmentToParent(stack, textSegment);
}

/**
 * 부모 세그먼트에 자식 세그먼트 추가하는 헬퍼 함수
 */
function addSegmentToParent(stack: Segment[], segment: Segment): void {
  assertExists(stack[stack.length - 1], "Stack cannot be empty");

  const parent = stack[stack.length - 1];
  if (!parent.children) {
    parent.children = [];
  }
  parent.children.push(segment);
}

/**
 * 인라인 와일드카드 시작인지 확인
 *
 * @param text 전체 텍스트
 * @param pos 현재 위치
 * @returns 와일드카드 시작 여부
 */
function isInlineWildcardStart(text: string, pos: number): boolean {
  // 파이프가 있는지 확인하고 닫는 괄호 위치 찾기
  const restText = text.slice(pos + 1);
  if (!restText.includes("|")) return false;

  // 닫는 괄호의 위치 찾기
  const [closingPos, _bracketLevel] = findMatchingClosingBracket(text, pos);
  if (closingPos === -1) return false;

  // 파이프가 닫는 괄호 전에 있는지 확인
  const pipePos = text.indexOf("|", pos + 1);
  return pipePos > pos && pipePos < closingPos;
}

/**
 * 괄호 쌍의 닫는 괄호 위치 찾기
 * 중첩 레벨을 고려하여 닫는 괄호 위치를 찾는다
 *
 * @param text 텍스트
 * @param openPos 여는 괄호 위치
 * @returns [닫는 괄호 위치 (없으면 -1), 괄호 레벨]
 */
function findMatchingClosingBracket(
  text: string,
  openPos: number
): [number, number] {
  const openChar = text[openPos];
  const closeChar =
    openChar === "("
      ? ")"
      : openChar === "{"
      ? "}"
      : openChar === "["
      ? "]"
      : null;

  if (!closeChar) return [-1, 0];

  // 연속된 여는 괄호 개수 세기
  let openLevel = 0;
  let pos = openPos;

  while (pos < text.length && text[pos] === openChar) {
    openLevel++;
    pos++;
  }

  // 대응하는 닫는 괄호 찾기
  let nestedLevel = openLevel;

  for (let i = pos; i < text.length; i++) {
    if (text[i] === openChar) {
      nestedLevel++;
    } else if (text[i] === closeChar) {
      nestedLevel--;
      // 모든 닫는 괄호를 찾았는지 확인
      if (nestedLevel === 0) {
        // 연속된 닫는 괄호 개수 세기
        let closeLevel = 0;
        let closePos = i;

        while (closePos < text.length && text[closePos] === closeChar) {
          closeLevel++;
          closePos++;
        }

        // 괄호 레벨은 더 작은 쪽으로 (보수적 접근)
        const bracketLevel = Math.min(openLevel, closeLevel);

        // 마지막 닫는 괄호 위치 반환
        return [i + closeLevel - 1, bracketLevel];
      }
    }
  }

  return [-1, openLevel];
}

/**
 * 인라인 와일드카드 옵션 파싱
 *
 * @param content 와일드카드 내용
 * @returns 파싱된 옵션 배열
 */
function parseInlineWildcardOptions(content: string): string[] {
  const options: string[] = [];
  let currentOption = "";
  let nestedLevel = 0;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === "(") {
      nestedLevel++;
      currentOption += char;
    } else if (char === ")") {
      nestedLevel--;
      currentOption += char;
    } else if (char === "|" && nestedLevel === 0) {
      options.push(currentOption.trim());
      currentOption = "";
    } else {
      currentOption += char;
    }
  }

  if (currentOption) {
    options.push(currentOption.trim());
  }

  return options;
}

/**
 * 인라인 와일드카드 텍스트 파싱
 *
 * @param text 와일드카드 텍스트
 * @returns 파싱 결과
 */
export function parseInlineWildcard(text: string): ParseResult {
  // 인라인 와일드카드 패턴: (옵션1|옵션2|옵션3)
  const match = text.match(/^\(([^\(\)]*(?:\([^\(\)]*\)[^\(\)]*)*)\)$/);

  if (!match) {
    return {
      success: false,
      error: "Invalid inline wildcard pattern",
    };
  }

  const optionsText = match[1];
  const options = parseInlineWildcardOptions(optionsText);

  // 유효한 옵션이 없거나 빈 옵션만 있으면 실패
  if (options.length === 0 || options.every((opt) => opt.trim() === "")) {
    return {
      success: false,
      error: "No valid options found",
    };
  }

  return {
    success: true,
    segment: createInlineWildcardSegment(options),
  };
}

/**
 * 가중치 텍스트 파싱
 *
 * @param text 가중치 텍스트
 * @returns 파싱 결과
 */
export function parseWeightedText(text: string): ParseResult {
  // 괄호 종류 및 중첩 레벨 계산
  let bracketType: "increase" | "decrease";
  let content: string;
  let bracketLevel = 0;

  if (text.startsWith("{") && text.endsWith("}")) {
    bracketType = "increase";

    // 시작 중괄호 개수 세기
    let startLevel = 0;
    while (startLevel < text.length && text[startLevel] === "{") {
      startLevel++;
    }

    // 끝 중괄호 개수 세기
    let endLevel = 0;
    let endIndex = text.length - 1;
    while (endIndex >= 0 && text[endIndex] === "}") {
      endLevel++;
      endIndex--;
    }

    // 중첩 레벨은 더 작은 값으로 (보수적 접근)
    bracketLevel = Math.min(startLevel, endLevel);

    // 내용 추출
    content = text.substring(startLevel, text.length - endLevel);
  } else if (text.startsWith("[") && text.endsWith("]")) {
    bracketType = "decrease";

    // 시작 대괄호 개수 세기
    let startLevel = 0;
    while (startLevel < text.length && text[startLevel] === "[") {
      startLevel++;
    }

    // 끝 대괄호 개수 세기
    let endLevel = 0;
    let endIndex = text.length - 1;
    while (endIndex >= 0 && text[endIndex] === "]") {
      endLevel++;
      endIndex--;
    }

    // 중첩 레벨은 더 작은 값으로 (보수적 접근)
    bracketLevel = Math.min(startLevel, endLevel);

    // 내용 추출
    content = text.substring(startLevel, text.length - endLevel);
  } else {
    return {
      success: false,
      error: "Not a weighted text pattern",
    };
  }

  // 내용 파싱
  const contentSegment = parseNovelAIPrompt(content);
  let children: Segment[] = [];

  if (contentSegment.children && contentSegment.children.length > 0) {
    children = contentSegment.children;
  } else {
    // 내용이 없으면 빈 텍스트 세그먼트 추가
    children = [createTextSegment("")];
  }

  // 정확한 중첩 레벨로 세그먼트 생성
  return {
    success: true,
    segment: createWeightedSegment(children, bracketType, bracketLevel),
  };
}

/**
 * 프리셋 텍스트 파싱
 *
 * @param text 프리셋 텍스트
 * @returns 파싱 결과
 */
export function parsePresetText(text: string): ParseResult {
  // 와일드카드 패턴 (!이름)
  let match = text.match(/^!([a-zA-Z0-9_\-\u3131-\uD79D가-힣]+)$/);

  if (match) {
    return {
      success: true,
      segment: createPresetSegment(match[1], "random"),
    };
  }

  // 키워드 패턴 (이름:값)
  match = text.match(/^([a-zA-Z0-9_\-\u3131-\uD79D가-힣]+):([^,\s:]+)$/);

  if (match) {
    return {
      success: true,
      segment: createPresetSegment(match[1], "fixed", match[2]),
    };
  }

  return {
    success: false,
    error: "Not a preset pattern",
  };
}
