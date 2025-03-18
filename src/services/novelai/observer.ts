// TODO: NovelAI 인터페이스 관찰자

/**
 * NovelAI 인터페이스 관찰자
 *
 * NovelAI UI 변경을 관찰하고 대응
 */
import { DEV } from "@/config/env";

/**
 * NovelAI 인터페이스 관찰 설정
 */
export function observeNovelAiInterface(): void {
  // MutationObserver 인스턴스 생성
  const observer = new MutationObserver(handleDomMutations);

  // 관찰 설정
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });

  DEV.log("NovelAI interface observer initialized");

  // 초기 상태 검사
  checkNovelAiState();
}

/**
 * DOM 변경 처리 함수
 */
function handleDomMutations(mutations: MutationRecord[]): void {
  // 변경사항을 분석하여 중요한 변경사항 감지
  let hasSignificantChanges = false;

  for (const mutation of mutations) {
    // 여기서 중요한 변경 감지 로직 구현
    if (isSignificantMutation(mutation)) {
      hasSignificantChanges = true;
      break;
    }
  }

  // 중요한 변경이 있을 때만 상태 검사 수행 (성능 최적화)
  if (hasSignificantChanges) {
    checkNovelAiState();
  }
}

/**
 * 중요한 DOM 변경인지 확인
 */
function isSignificantMutation(mutation: MutationRecord): boolean {
  // 노드 추가/제거의 경우
  if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
    for (let i = 0; i < mutation.addedNodes.length; i++) {
      const node = mutation.addedNodes[i];

      // Element 노드인 경우만 확인
      if (node?.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;

        // 중요한 UI 요소 확인
        if (
          element.id?.includes("prompt") ||
          element.className?.includes("prompt") ||
          element.querySelector('[aria-label="Generate"]')
        ) {
          return true;
        }
      }
    }
  }

  // 속성 변경의 경우
  if (mutation.type === "attributes") {
    const target = mutation.target as Element;

    // 특정 중요 요소의 속성 변경
    if (
      target.id?.includes("prompt") ||
      target.className?.includes("prompt") ||
      target.getAttribute("aria-label") === "Generate"
    ) {
      return true;
    }
  }

  return false;
}

/**
 * NovelAI 상태 검사
 */
function checkNovelAiState(): void {
  // 프롬프트 필드 검색
  const promptField = findPromptField();

  if (promptField) {
    DEV.log("Found NovelAI prompt field:", promptField);
    // 필요한 동작 수행
  }

  // 생성 버튼 검색
  const generateButton = findGenerateButton();

  if (generateButton) {
    DEV.log("Found NovelAI generate button:", generateButton);
    // 필요한 동작 수행
  }
}

/**
 * 프롬프트 필드 찾기
 */
function findPromptField(): HTMLTextAreaElement | null {
  // 여러 선택자 시도 (회복성 향상)
  const selectors = [
    'textarea[placeholder*="Write your prompt here"]',
    'textarea[aria-label*="prompt"]',
    ".prompt-textarea",
    "#prompt-input",
  ];

  for (const selector of selectors) {
    const element = document.querySelector<HTMLTextAreaElement>(selector);
    if (element) return element;
  }

  return null;
}

/**
 * 생성 버튼 찾기
 */
function findGenerateButton(): HTMLButtonElement | null {
  // 여러 선택자 시도 (회복성 향상)
  const selectors = [
    'button[aria-label="Generate"]',
    "button.generate-button",
    'button[data-action="generate"]',
    'button:has(svg[data-icon="play"])',
  ];

  for (const selector of selectors) {
    try {
      const element = document.querySelector<HTMLButtonElement>(selector);
      if (element) return element;
    } catch (_error) {
      // 일부 고급 CSS 선택자는 지원되지 않을 수 있음
      continue;
    }
  }

  // 텍스트로 찾기 (마지막 수단)
  const buttons = Array.from(document.querySelectorAll("button"));
  return (
    (buttons.find(
      (button) =>
        button.textContent?.includes("Generate") ||
        button.getAttribute("aria-label")?.includes("Generate")
    ) as HTMLButtonElement) || null
  );
}
