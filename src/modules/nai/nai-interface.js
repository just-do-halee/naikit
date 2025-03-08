// modules/nai/nai-interface.js
/**
 * NovelAI DOM 선택자
 * @readonly
 * @enum {string}
 */
const NAI_SELECTORS = {
  POSITIVE_PROMPT: ".novelai-positive-prompt textarea",
  NEGATIVE_PROMPT: ".novelai-negative-prompt textarea",
  RESOLUTION_WIDTH: 'input[name="width"]',
  RESOLUTION_HEIGHT: 'input[name="height"]',
  BATCH_SIZE: 'input[name="batch-size"]',
  GENERATE_BUTTON: 'button[aria-label="Generate Image"]',
  CHARACTER_SECTION: ".character-prompts",
  CHARACTER_ITEMS: ".character-item",
  CHARACTER_POSITIVE: ".character-positive textarea",
  CHARACTER_NEGATIVE: ".character-negative textarea",

  // 페이지 로드 확인용
  MAIN_INTERFACE: ".novelai-image-generation-interface",
};

/**
 * NovelAI 인터페이스 클래스
 * NovelAI 웹페이지와의 상호작용을 관리
 */
export class NaiInterface {
  constructor() {
    // NovelAI 페이지 로드 확인 상태
    this.isLoaded = false;

    // 주요 요소 참조 캐싱
    this.elements = {};

    // 변경 감지 관찰자
    this.observers = {};
  }

  /**
   * NovelAI 인터페이스 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    // 페이지 로드 확인
    try {
      await this.waitForInterface();
      this.isLoaded = true;

      // 주요 요소 캐싱
      this.cacheElements();

      // 변경 감지 설정
      this.setupObservers();

      return true;
    } catch (error) {
      console.error("NovelAI 인터페이스 초기화 실패:", error);
      return false;
    }
  }

  /**
   * NovelAI 인터페이스 로드 대기
   * @param {number} timeout - 타임아웃 (밀리초)
   * @returns {Promise<Element>} 인터페이스 요소
   */
  waitForInterface(timeout = 10000) {
    return new Promise((resolve, reject) => {
      // 이미 존재하는지 확인
      const interfaceElement = document.querySelector(
        NAI_SELECTORS.MAIN_INTERFACE
      );
      if (interfaceElement) {
        resolve(interfaceElement);
        return;
      }

      // 타임아웃 설정
      const timeoutId = setTimeout(() => {
        observer.disconnect();
        reject(new Error("NovelAI 인터페이스 로드 타임아웃"));
      }, timeout);

      // DOM 변화 감시
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(NAI_SELECTORS.MAIN_INTERFACE);
        if (element) {
          clearTimeout(timeoutId);
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  /**
   * 자주 사용하는 요소 캐싱
   */
  cacheElements() {
    for (const [key, selector] of Object.entries(NAI_SELECTORS)) {
      if (key !== "MAIN_INTERFACE") {
        this.elements[key] = document.querySelector(selector);
      }
    }
  }

  /**
   * 요소 변경 감지 관찰자 설정
   */
  setupObservers() {
    // 프롬프트 변경 감지
    this.observePrompts();

    // 설정 변경 감지
    this.observeSettings();

    // 캐릭터 섹션 변경 감지
    this.observeCharacters();
  }

  /**
   * 프롬프트 텍스트 영역 변경 감지
   */
  observePrompts() {
    // 긍정 프롬프트 관찰
    if (this.elements.POSITIVE_PROMPT) {
      this.observers.positivePrompt = this.createInputObserver(
        this.elements.POSITIVE_PROMPT,
        "positivePrompt"
      );
    }

    // 부정 프롬프트 관찰
    if (this.elements.NEGATIVE_PROMPT) {
      this.observers.negativePrompt = this.createInputObserver(
        this.elements.NEGATIVE_PROMPT,
        "negativePrompt"
      );
    }
  }

  /**
   * 입력 요소 변경 감지 관찰자 생성
   * @param {Element} element - 관찰할 요소
   * @param {string} name - 요소 이름 (이벤트용)
   * @returns {MutationObserver} 생성된 관찰자
   */
  createInputObserver(element, name) {
    // 요소가 렌더링될 때까지 대기
    if (!element) return null;

    // 초기값 기록
    const initialValue = element.value;

    // input 이벤트 리스너 (사용자 입력)
    element.addEventListener("input", (e) => {
      this.dispatchChangeEvent(name, {
        value: e.target.value,
        source: "user",
      });
    });

    // MutationObserver (프로그래밍 방식 변경)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "value"
        ) {
          this.dispatchChangeEvent(name, {
            value: element.value,
            source: "program",
          });
        }
      }
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ["value"],
    });

    return observer;
  }

  /**
   * 설정 요소 변경 감지
   */
  observeSettings() {
    // 해상도 설정 관찰
    const resolutionObserver = new MutationObserver(() => {
      const width = this.elements.RESOLUTION_WIDTH?.value;
      const height = this.elements.RESOLUTION_HEIGHT?.value;

      if (width && height) {
        this.dispatchChangeEvent("resolution", {
          width: parseInt(width),
          height: parseInt(height),
        });
      }
    });

    if (this.elements.RESOLUTION_WIDTH) {
      resolutionObserver.observe(this.elements.RESOLUTION_WIDTH, {
        attributes: true,
        attributeFilter: ["value"],
      });
    }

    if (this.elements.RESOLUTION_HEIGHT) {
      resolutionObserver.observe(this.elements.RESOLUTION_HEIGHT, {
        attributes: true,
        attributeFilter: ["value"],
      });
    }

    // 배치 크기 관찰
    if (this.elements.BATCH_SIZE) {
      const batchObserver = new MutationObserver(() => {
        this.dispatchChangeEvent("batchSize", {
          value: parseInt(this.elements.BATCH_SIZE.value),
        });
      });

      batchObserver.observe(this.elements.BATCH_SIZE, {
        attributes: true,
        attributeFilter: ["value"],
      });
    }

    this.observers.resolution = resolutionObserver;
  }

  /**
   * 캐릭터 섹션 변경 감지
   */
  observeCharacters() {
    if (!this.elements.CHARACTER_SECTION) return;

    const characterObserver = new MutationObserver((mutations) => {
      // DOM 변경 시 캐릭터 목록 업데이트
      this.updateCharacterElements();

      // 변경 이벤트 발생
      this.dispatchChangeEvent("characters", {
        count: document.querySelectorAll(NAI_SELECTORS.CHARACTER_ITEMS).length,
      });
    });

    characterObserver.observe(this.elements.CHARACTER_SECTION, {
      childList: true,
      subtree: true,
    });

    this.observers.characters = characterObserver;
  }

  /**
   * 캐릭터 요소 참조 업데이트
   */
  updateCharacterElements() {
    // 현재 캐릭터 항목 가져오기
    const characterItems = document.querySelectorAll(
      NAI_SELECTORS.CHARACTER_ITEMS
    );

    // 각 캐릭터의 프롬프트 요소 캐싱 및 관찰
    characterItems.forEach((item, index) => {
      const positiveTextarea = item.querySelector(
        NAI_SELECTORS.CHARACTER_POSITIVE
      );
      const negativeTextarea = item.querySelector(
        NAI_SELECTORS.CHARACTER_NEGATIVE
      );

      if (positiveTextarea) {
        this.elements[`CHARACTER_${index}_POSITIVE`] = positiveTextarea;
        this.observers[`character_${index}_positive`] =
          this.createInputObserver(
            positiveTextarea,
            `character_${index}_positive`
          );
      }

      if (negativeTextarea) {
        this.elements[`CHARACTER_${index}_NEGATIVE`] = negativeTextarea;
        this.observers[`character_${index}_negative`] =
          this.createInputObserver(
            negativeTextarea,
            `character_${index}_negative`
          );
      }
    });
  }

  /**
   * 변경 이벤트 발생
   * @param {string} type - 이벤트 타입
   * @param {Object} data - 이벤트 데이터
   */
  dispatchChangeEvent(type, data) {
    const event = new CustomEvent("naikit:interfaceChanged", {
      detail: { type, data },
    });

    document.dispatchEvent(event);
  }

  /**
   * 긍정 프롬프트 설정
   * @param {string} prompt - 설정할 프롬프트 텍스트
   * @returns {boolean} 성공 여부
   */
  setPositivePrompt(prompt) {
    return this.setTextareaValue(this.elements.POSITIVE_PROMPT, prompt);
  }

  /**
   * 부정 프롬프트 설정
   * @param {string} prompt - 설정할 프롬프트 텍스트
   * @returns {boolean} 성공 여부
   */
  setNegativePrompt(prompt) {
    return this.setTextareaValue(this.elements.NEGATIVE_PROMPT, prompt);
  }

  /**
   * 캐릭터 프롬프트 설정
   * @param {number} index - 캐릭터 인덱스
   * @param {string} type - 프롬프트 타입 ('positive' 또는 'negative')
   * @param {string} prompt - 설정할 프롬프트 텍스트
   * @returns {boolean} 성공 여부
   */
  setCharacterPrompt(index, type, prompt) {
    const element = this.elements[`CHARACTER_${index}_${type.toUpperCase()}`];
    return this.setTextareaValue(element, prompt);
  }

  /**
   * 텍스트 영역 값 설정 및 이벤트 발생
   * @param {Element} element - 대상 텍스트 영역
   * @param {string} value - 설정할 값
   * @returns {boolean} 성공 여부
   */
  setTextareaValue(element, value) {
    if (!element) return false;

    // 값 설정
    element.value = value;

    // 이벤트 발생 (NovelAI가 변경을 감지하도록)
    element.dispatchEvent(new Event("input", { bubbles: true }));

    return true;
  }

  /**
   * 해상도 설정
   * @param {number} width - 너비
   * @param {number} height - 높이
   * @returns {boolean} 성공 여부
   */
  setResolution(width, height) {
    if (!this.elements.RESOLUTION_WIDTH || !this.elements.RESOLUTION_HEIGHT) {
      return false;
    }

    // 각 입력 필드에 값 설정
    this.elements.RESOLUTION_WIDTH.value = width;
    this.elements.RESOLUTION_HEIGHT.value = height;

    // 이벤트 발생
    this.elements.RESOLUTION_WIDTH.dispatchEvent(
      new Event("input", { bubbles: true })
    );
    this.elements.RESOLUTION_HEIGHT.dispatchEvent(
      new Event("input", { bubbles: true })
    );

    return true;
  }

  /**
   * 배치 크기 설정
   * @param {number} size - 배치 크기 (1-4)
   * @returns {boolean} 성공 여부
   */
  setBatchSize(size) {
    if (!this.elements.BATCH_SIZE) return false;

    // 유효한 범위로 조정
    const validSize = Math.max(1, Math.min(4, size));

    // 값 설정
    this.elements.BATCH_SIZE.value = validSize;

    // 이벤트 발생
    this.elements.BATCH_SIZE.dispatchEvent(
      new Event("input", { bubbles: true })
    );

    return true;
  }

  /**
   * 이미지 생성 트리거
   * @returns {boolean} 성공 여부
   */
  triggerGeneration() {
    if (!this.elements.GENERATE_BUTTON) return false;

    // 버튼 클릭
    this.elements.GENERATE_BUTTON.click();

    return true;
  }

  /**
   * 이미지 생성 완료 감지
   * @returns {Promise<void>} 생성 완료 시 해결되는 프로미스
   */
  waitForGenerationComplete() {
    return new Promise((resolve) => {
      // 생성 버튼 상태 관찰
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          // 버튼이 다시 활성화되면 생성 완료로 간주
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "disabled" &&
            !this.elements.GENERATE_BUTTON.disabled
          ) {
            observer.disconnect();
            resolve();
          }
        }
      });

      observer.observe(this.elements.GENERATE_BUTTON, {
        attributes: true,
        attributeFilter: ["disabled"],
      });
    });
  }

  /**
   * 현재 인터페이스 상태 가져오기
   * @returns {Object} 인터페이스 상태 객체
   */
  getCurrentState() {
    return {
      positivePrompt: this.elements.POSITIVE_PROMPT?.value || "",
      negativePrompt: this.elements.NEGATIVE_PROMPT?.value || "",
      resolution: {
        width: parseInt(this.elements.RESOLUTION_WIDTH?.value || 1024),
        height: parseInt(this.elements.RESOLUTION_HEIGHT?.value || 1024),
      },
      batchSize: parseInt(this.elements.BATCH_SIZE?.value || 1),
      characters: this.getCharacterStates(),
    };
  }

  /**
   * 현재 캐릭터 상태 가져오기
   * @returns {Array<Object>} 캐릭터 상태 배열
   */
  getCharacterStates() {
    const characterItems = document.querySelectorAll(
      NAI_SELECTORS.CHARACTER_ITEMS
    );
    const characters = [];

    characterItems.forEach((item, index) => {
      const positive =
        item.querySelector(NAI_SELECTORS.CHARACTER_POSITIVE)?.value || "";
      const negative =
        item.querySelector(NAI_SELECTORS.CHARACTER_NEGATIVE)?.value || "";

      characters.push({
        index,
        positivePrompt: positive,
        negativePrompt: negative,
      });
    });

    return characters;
  }

  /**
   * 리소스 정리
   */
  cleanup() {
    // 관찰자 해제
    Object.values(this.observers).forEach((observer) => {
      if (observer && typeof observer.disconnect === "function") {
        observer.disconnect();
      }
    });

    // 이벤트 리스너 해제
    for (const element of Object.values(this.elements)) {
      if (element && typeof element.removeEventListener === "function") {
        element.removeEventListener("input", () => {});
      }
    }
  }
}
