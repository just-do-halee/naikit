// modules/nai/nai-interface.js
/**
 * NovelAI DOM 선택자
 * @readonly
 * @enum {string}
 */
const NAI_SELECTORS = {
  // 프롬프트 영역 - 가장 기본적인 선택자
  POSITIVE_PROMPT: ".ProseMirror", // 첫 번째 ProseMirror 에디터
  NEGATIVE_PROMPT: ".ProseMirror:nth-of-type(2)", // 두 번째 ProseMirror 에디터

  // 해상도 및 배치 설정 - 속성 기반 선택자
  RESOLUTION_WIDTH: "input[type='number'][step='64']:first-child", // 너비 입력
  RESOLUTION_HEIGHT: "input[type='number'][step='64']:last-child", // 높이 입력
  BATCH_SIZE_BUTTONS: "button", // 배치 크기 버튼들 (텍스트로 필터링)

  // 생성 버튼 - 단순하고 견고한 선택자
  GENERATE_BUTTON: "button", // 버튼 (텍스트로 필터링)

  // 캐릭터 섹션
  CHARACTER_SECTION: "div[role='button'][tabindex='0']", // 캐릭터 항목들
  CHARACTER_ADD_BUTTON: "button", // 추가 버튼 (텍스트로 필터링)

  // 페이지 로드 확인용
  MAIN_INTERFACE: "#__next",

  // 프롬프트 탭
  PROMPT_TAB: "button", // 버튼 (텍스트로 필터링)
  NEGATIVE_TAB: "button", // 버튼 (텍스트로 필터링)
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

    // 초기화 시도 횟수
    this.initAttempts = 0;
    this.maxInitAttempts = 3;
  }

  /**
   * 지정된 시간만큼 대기
   * @param {number} ms - 대기 시간 (밀리초)
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * NovelAI 인터페이스 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    // 페이지 로드 확인
    try {
      // 페이지 로드 대기
      await this.waitForInterface();
      console.log("NovelAI 기본 인터페이스 로드됨");

      // 추가 지연으로 더 많은 요소가 로드되도록 함
      await this.delay(1000);

      // ProseMirror 에디터 로드 대기
      await this.waitForProseMirror();

      // 추가 지연
      await this.delay(500);

      // 주요 요소 캐싱
      await this.cacheElements();
      this.isLoaded = true;

      // 변경 감지 설정
      await this.setupObservers();

      console.log("인터페이스 초기화 완료");
      return true;
    } catch (error) {
      console.error("NovelAI 인터페이스 초기화 실패:", error);

      // 최대 시도 횟수까지 재시도
      this.initAttempts++;
      if (this.initAttempts < this.maxInitAttempts) {
        console.log(
          `초기화 재시도 중... (${this.initAttempts}/${this.maxInitAttempts})`
        );
        await this.delay(2000); // 재시도 전 지연
        return this.initialize();
      }

      return false;
    }
  }

  /**
   * NovelAI 인터페이스 로드 대기
   * @param {number} timeout - 타임아웃 (밀리초)
   * @returns {Promise<Element>} 인터페이스 요소
   */
  waitForInterface(timeout = 30000) {
    return new Promise((resolve, reject) => {
      try {
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
          if (observer) {
            observer.disconnect();
          }
          reject(new Error("NovelAI 인터페이스 로드 타임아웃"));
        }, timeout);

        // DOM 변화 감시
        const observer = new MutationObserver((mutations, obs) => {
          try {
            const element = document.querySelector(
              NAI_SELECTORS.MAIN_INTERFACE
            );
            if (element) {
              clearTimeout(timeoutId);
              obs.disconnect();
              resolve(element);
            }
          } catch (error) {
            console.warn("인터페이스 감지 중 오류:", error);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * ProseMirror 에디터가 로드될 때까지 대기
   * @param {number} timeout - 타임아웃 (밀리초)
   * @returns {Promise<boolean>} 로드 성공 여부
   */
  waitForProseMirror(timeout = 10000) {
    return new Promise((resolve) => {
      try {
        // 이미 존재하는지 확인
        const editorElement = document.querySelector(".ProseMirror");
        if (editorElement) {
          console.log("ProseMirror 에디터 발견");
          resolve(true);
          return;
        }

        // 타임아웃 설정
        const timeoutId = setTimeout(() => {
          if (observer) {
            observer.disconnect();
          }
          console.warn("ProseMirror 에디터 로드 타임아웃");
          resolve(false);
        }, timeout);

        // DOM 변화 감시
        const observer = new MutationObserver((mutations, obs) => {
          try {
            const element = document.querySelector(".ProseMirror");
            if (element) {
              clearTimeout(timeoutId);
              obs.disconnect();
              console.log("ProseMirror 에디터 로드됨");
              resolve(true);
            }
          } catch (error) {
            console.warn("ProseMirror 감지 중 오류:", error);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      } catch (error) {
        console.error("ProseMirror 대기 중 오류:", error);
        resolve(false);
      }
    });
  }

  /**
   * 자주 사용하는 요소 캐싱
   */
  async cacheElements() {
    console.log("요소 캐싱 시작...");

    try {
      // 프롬프트 에디터 캐싱
      const editors = document.querySelectorAll(".ProseMirror");
      console.log(`ProseMirror 에디터 ${editors.length}개 발견`);

      if (editors.length > 0) {
        this.elements.POSITIVE_PROMPT = editors[0];
        if (editors.length > 1) {
          this.elements.NEGATIVE_PROMPT = editors[1];
        }
      } else {
        console.warn("ProseMirror 에디터를 찾을 수 없음");
      }

      // 해상도 입력 필드 캐싱
      const numberInputs = document.querySelectorAll(
        "input[type='number'][step='64']"
      );
      if (numberInputs.length >= 2) {
        this.elements.RESOLUTION_WIDTH = numberInputs[0];
        this.elements.RESOLUTION_HEIGHT = numberInputs[1];
        console.log("해상도 입력 필드 캐싱됨");
      } else {
        console.warn("해상도 입력 필드를 찾을 수 없음");
      }

      // 배치 크기 버튼 및 생성 버튼 캐싱을 위한 특별 처리
      await this.cacheBatchButtons();
      await this.cacheGenerateButton();
      await this.cacheTabButtons();
      await this.cacheCharacterButtons();

      console.log("요소 캐싱 완료");
    } catch (error) {
      console.error("요소 캐싱 중 오류:", error);
      throw error;
    }
  }

  /**
   * 배치 크기 버튼 캐싱
   */
  async cacheBatchButtons() {
    try {
      // 1, 2, 3, 4 값을 가진 버튼 찾기
      const allButtons = document.querySelectorAll("button");
      let batchButtons = [];

      allButtons.forEach((button) => {
        const text = button.textContent?.trim();
        if (text === "1" || text === "2" || text === "3" || text === "4") {
          batchButtons.push(button);
        }
      });

      if (batchButtons.length > 0) {
        this.elements.BATCH_SIZE_BUTTONS = batchButtons;
        console.log(`배치 크기 버튼 ${batchButtons.length}개 캐싱됨`);
      } else {
        console.warn("배치 크기 버튼을 찾을 수 없음");
      }
    } catch (error) {
      console.warn("배치 버튼 캐싱 중 오류:", error);
    }
  }

  /**
   * 생성 버튼 캐싱
   */
  async cacheGenerateButton() {
    try {
      // "Generate" 텍스트가 포함된 버튼 찾기
      const allButtons = document.querySelectorAll("button");
      let generateButton = null;

      for (const button of allButtons) {
        if (button.textContent && button.textContent.includes("Generate")) {
          generateButton = button;
          break;
        }
      }

      if (generateButton) {
        this.elements.GENERATE_BUTTON = generateButton;
        console.log("생성 버튼 캐싱됨");
      } else {
        console.warn("생성 버튼을 찾을 수 없음");
      }
    } catch (error) {
      console.warn("생성 버튼 캐싱 중 오류:", error);
    }
  }

  /**
   * 탭 버튼 캐싱
   */
  async cacheTabButtons() {
    try {
      // "Prompt"와 "Undesired Content" 텍스트가 포함된 버튼 찾기
      const allButtons = document.querySelectorAll("button");
      let promptTab = null;
      let negativeTab = null;

      for (const button of allButtons) {
        const text = button.textContent;
        if (!text) continue;

        if (text.includes("Prompt") && !text.includes("Undesired")) {
          promptTab = button;
        } else if (text.includes("Undesired")) {
          negativeTab = button;
        }

        if (promptTab && negativeTab) break;
      }

      if (promptTab) {
        this.elements.PROMPT_TAB = promptTab;
        console.log("프롬프트 탭 버튼 캐싱됨");
      }

      if (negativeTab) {
        this.elements.NEGATIVE_TAB = negativeTab;
        console.log("부정 프롬프트 탭 버튼 캐싱됨");
      }
    } catch (error) {
      console.warn("탭 버튼 캐싱 중 오류:", error);
    }
  }

  /**
   * 캐릭터 관련 버튼 캐싱
   */
  async cacheCharacterButtons() {
    try {
      // "Add Character" 텍스트가 포함된 버튼 찾기
      const allButtons = document.querySelectorAll("button");
      let addCharacterButton = null;

      for (const button of allButtons) {
        if (
          button.textContent &&
          button.textContent.includes("Add Character")
        ) {
          addCharacterButton = button;
          break;
        }
      }

      if (addCharacterButton) {
        this.elements.CHARACTER_ADD_BUTTON = addCharacterButton;
        console.log("캐릭터 추가 버튼 캐싱됨");
      }

      // 캐릭터 목록 찾기
      const characterItems = document.querySelectorAll(
        NAI_SELECTORS.CHARACTER_SECTION
      );
      if (characterItems.length > 0) {
        console.log(`캐릭터 항목 ${characterItems.length}개 발견`);
        this.updateCharacterElements();
      }
    } catch (error) {
      console.warn("캐릭터 버튼 캐싱 중 오류:", error);
    }
  }

  /**
   * 요소 변경 감지 관찰자 설정
   */
  async setupObservers() {
    try {
      // 프롬프트 변경 감지
      this.observePrompts();

      // 설정 변경 감지
      this.observeSettings();

      // 캐릭터 섹션 변경 감지
      this.observeCharacters();

      console.log("관찰자 설정 완료");
    } catch (error) {
      console.error("관찰자 설정 중 오류:", error);
    }
  }

  /**
   * 프롬프트 텍스트 영역 변경 감지
   */
  observePrompts() {
    try {
      // 긍정 프롬프트 관찰
      if (this.elements.POSITIVE_PROMPT) {
        this.observers.positivePrompt = this.createProseMirrorObserver(
          this.elements.POSITIVE_PROMPT,
          "positivePrompt"
        );
      }

      // 부정 프롬프트 관찰
      if (this.elements.NEGATIVE_PROMPT) {
        this.observers.negativePrompt = this.createProseMirrorObserver(
          this.elements.NEGATIVE_PROMPT,
          "negativePrompt"
        );
      }
    } catch (error) {
      console.warn("프롬프트 관찰자 설정 중 오류:", error);
    }
  }

  /**
   * ProseMirror 에디터 변경 감지 관찰자 생성
   * @param {Element} element - 관찰할 ProseMirror 에디터
   * @param {string} name - 요소 이름 (이벤트용)
   * @returns {MutationObserver} 생성된 관찰자
   */
  createProseMirrorObserver(element, name) {
    if (!element) return null;

    try {
      // 변경 감지 관찰자
      const observer = new MutationObserver((mutations) => {
        try {
          // 텍스트 내용 변경 감지
          const newValue = element.textContent || "";

          this.dispatchChangeEvent(name, {
            value: newValue,
            source: "user", // 사용자 입력으로 간주
          });
        } catch (error) {
          console.warn(`${name} 변경 감지 중 오류:`, error);
        }
      });

      observer.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return observer;
    } catch (error) {
      console.warn(`${name} 관찰자 생성 중 오류:`, error);
      return null;
    }
  }

  /**
   * 설정 요소 변경 감지
   */
  observeSettings() {
    try {
      // 해상도 설정 관찰
      if (this.elements.RESOLUTION_WIDTH && this.elements.RESOLUTION_HEIGHT) {
        const resolutionObserver = new MutationObserver(() => {
          try {
            const width = this.elements.RESOLUTION_WIDTH?.value;
            const height = this.elements.RESOLUTION_HEIGHT?.value;

            if (width && height) {
              this.dispatchChangeEvent("resolution", {
                width: parseInt(width),
                height: parseInt(height),
              });
            }
          } catch (error) {
            console.warn("해상도 변경 감지 중 오류:", error);
          }
        });

        resolutionObserver.observe(this.elements.RESOLUTION_WIDTH, {
          attributes: true,
          attributeFilter: ["value"],
        });

        resolutionObserver.observe(this.elements.RESOLUTION_HEIGHT, {
          attributes: true,
          attributeFilter: ["value"],
        });

        this.observers.resolution = resolutionObserver;
      }

      // 배치 크기 버튼 관찰
      this.observeBatchButtons();
    } catch (error) {
      console.warn("설정 관찰자 설정 중 오류:", error);
    }
  }

  /**
   * 배치 크기 버튼 관찰
   */
  observeBatchButtons() {
    const batchButtons = this.elements.BATCH_SIZE_BUTTONS;
    if (!batchButtons || !batchButtons.length) return;

    try {
      // 각 버튼에 클릭 이벤트 리스너 추가
      batchButtons.forEach((button, index) => {
        button.addEventListener("click", () => {
          try {
            const batchSize = index + 1; // 버튼은 1부터 시작
            this.dispatchChangeEvent("batchSize", {
              value: batchSize,
            });
          } catch (error) {
            console.warn("배치 크기 이벤트 발생 중 오류:", error);
          }
        });
      });
    } catch (error) {
      console.warn("배치 버튼 관찰 중 오류:", error);
    }
  }

  /**
   * 캐릭터 섹션 변경 감지
   */
  observeCharacters() {
    try {
      // 캐릭터 추가 버튼 감지
      const addButton = this.elements.CHARACTER_ADD_BUTTON;

      if (addButton) {
        // 버튼 클릭 시 캐릭터 요소 업데이트
        addButton.addEventListener("click", () => {
          // 약간의 지연 후 캐릭터 요소 업데이트 (DOM 업데이트 대기)
          setTimeout(() => this.updateCharacterElements(), 500);
        });
      }

      // 캐릭터 수 저장
      this.characterCount = document.querySelectorAll(
        NAI_SELECTORS.CHARACTER_SECTION
      ).length;

      // 전체 DOM 변경 감지 (새 캐릭터 추가 감지용)
      const bodyObserver = new MutationObserver((mutations) => {
        try {
          // 주기적으로 캐릭터 수 확인 (안정적인 방법)
          const currentCharacterCount = document.querySelectorAll(
            NAI_SELECTORS.CHARACTER_SECTION
          ).length;

          if (currentCharacterCount !== this.characterCount) {
            // 캐릭터 수가 변경됨
            this.characterCount = currentCharacterCount;
            setTimeout(() => this.updateCharacterElements(), 200);
          }
        } catch (error) {
          console.warn("DOM 변경 감지 중 오류:", error);
        }
      });

      bodyObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      this.observers.bodyObserver = bodyObserver;
    } catch (error) {
      console.warn("캐릭터 관찰자 설정 중 오류:", error);
    }
  }

  /**
   * 캐릭터 요소 참조 업데이트
   */
  updateCharacterElements() {
    try {
      // 현재 캐릭터 항목 가져오기
      const characterItems = document.querySelectorAll(
        NAI_SELECTORS.CHARACTER_SECTION
      );

      // 캐릭터 수 저장
      this.characterCount = characterItems.length;

      console.log(`캐릭터 항목 ${characterItems.length}개 업데이트`);

      // 각 캐릭터의 프롬프트 에디터 캐싱
      characterItems.forEach((item, index) => {
        try {
          // 캐릭터 클릭하여 내용 표시
          item.click();

          // 약간의 지연 후 에디터 찾기
          setTimeout(() => {
            try {
              // 캐릭터 프롬프트 에디터 요소 찾기
              const editors = item.querySelectorAll(".ProseMirror");

              if (editors.length > 0) {
                // 첫 번째 에디터는 긍정 프롬프트
                this.elements[`CHARACTER_${index}_POSITIVE`] = editors[0];

                // 두 번째 에디터가 있으면 부정 프롬프트
                if (editors.length > 1) {
                  this.elements[`CHARACTER_${index}_NEGATIVE`] = editors[1];
                }

                // 에디터 변경 감지
                editors.forEach((editor, editorIndex) => {
                  try {
                    const type = editorIndex === 0 ? "positive" : "negative";
                    const observerKey = `character_${index}_${type}`;

                    // 기존 관찰자 해제
                    if (this.observers[observerKey]) {
                      this.observers[observerKey].disconnect();
                    }

                    // 새 관찰자 설정
                    this.observers[observerKey] =
                      this.createProseMirrorObserver(
                        editor,
                        `character_${index}_${type}`
                      );
                  } catch (error) {
                    console.warn(
                      `캐릭터 ${index} 에디터 관찰자 설정 중 오류:`,
                      error
                    );
                  }
                });
              }
            } catch (innerError) {
              console.warn(`캐릭터 ${index} 에디터 찾기 중 오류:`, innerError);
            }
          }, 200);
        } catch (error) {
          console.warn(`캐릭터 ${index} 처리 중 오류:`, error);
        }
      });

      // 캐릭터 변경 이벤트 발생
      this.dispatchChangeEvent("characters", {
        count: characterItems.length,
      });
    } catch (error) {
      console.warn("캐릭터 요소 업데이트 중 오류:", error);
    }
  }

  /**
   * 변경 이벤트 발생
   * @param {string} type - 이벤트 타입
   * @param {Object} data - 이벤트 데이터
   */
  dispatchChangeEvent(type, data) {
    try {
      const event = new CustomEvent("naikit:interfaceChanged", {
        detail: { type, data },
      });

      document.dispatchEvent(event);
    } catch (error) {
      console.warn(`이벤트 발생 중 오류 (${type}):`, error);
    }
  }

  /**
   * 텍스트를 ProseMirror 에디터에 설정
   * @param {Element} editor - ProseMirror 에디터 요소
   * @param {string} text - 설정할 텍스트
   * @returns {boolean} 성공 여부
   */
  setProseMirrorText(editor, text) {
    if (!editor) return false;

    try {
      // p 태그 내부 텍스트 설정
      let paragraph = editor.querySelector("p");

      if (!paragraph) {
        paragraph = document.createElement("p");
        editor.appendChild(paragraph);
      }

      paragraph.textContent = text;

      // 변경 이벤트 발생 (NovelAI가 변경을 감지하도록)
      try {
        const inputEvent = new InputEvent("input", {
          bubbles: true,
          cancelable: true,
        });

        editor.dispatchEvent(inputEvent);
      } catch (eventError) {
        console.warn("ProseMirror 이벤트 발생 실패:", eventError);

        // 대체 방식으로 이벤트 발생
        try {
          const changeEvent = new Event("input", {
            bubbles: true,
          });
          editor.dispatchEvent(changeEvent);
        } catch (alternativeEventError) {
          console.warn("대체 이벤트 발생 실패:", alternativeEventError);
        }
      }

      return true;
    } catch (error) {
      console.error("ProseMirror 텍스트 설정 실패:", error);
      return false;
    }
  }

  /**
   * 긍정 프롬프트 설정
   * @param {string} prompt - 설정할 프롬프트 텍스트
   * @returns {Promise<boolean>} 성공 여부
   */
  async setPositivePrompt(prompt) {
    try {
      // 긍정 프롬프트 탭 활성화
      const promptTab = this.elements.PROMPT_TAB;
      if (promptTab) {
        promptTab.click();
        await this.delay(100); // 탭 전환 대기
      }

      // 에디터 가져오기 및 텍스트 설정
      const activeEditor =
        this.elements.POSITIVE_PROMPT || document.querySelector(".ProseMirror");
      if (!activeEditor) {
        console.error("긍정 프롬프트 에디터를 찾을 수 없음");
        return false;
      }

      return this.setProseMirrorText(activeEditor, prompt);
    } catch (error) {
      console.error("긍정 프롬프트 설정 실패:", error);
      return false;
    }
  }

  /**
   * 부정 프롬프트 설정
   * @param {string} prompt - 설정할 프롬프트 텍스트
   * @returns {Promise<boolean>} 성공 여부
   */
  async setNegativePrompt(prompt) {
    try {
      // 부정 프롬프트 탭 활성화
      const negativeTab = this.elements.NEGATIVE_TAB;
      if (negativeTab) {
        negativeTab.click();
        await this.delay(100); // 탭 전환 대기
      }

      // 에디터 가져오기 및 텍스트 설정
      const activeEditor =
        this.elements.NEGATIVE_PROMPT ||
        document.querySelector(".ProseMirror:nth-of-type(2)") ||
        document.querySelectorAll(".ProseMirror")[1];

      if (!activeEditor) {
        console.error("부정 프롬프트 에디터를 찾을 수 없음");
        return false;
      }

      return this.setProseMirrorText(activeEditor, prompt);
    } catch (error) {
      console.error("부정 프롬프트 설정 실패:", error);
      return false;
    }
  }

  /**
   * 캐릭터 프롬프트 설정
   * @param {number} index - 캐릭터 인덱스
   * @param {string} type - 프롬프트 타입 ('positive' 또는 'negative')
   * @param {string} prompt - 설정할 프롬프트 텍스트
   * @returns {Promise<boolean>} 성공 여부
   */
  async setCharacterPrompt(index, type, prompt) {
    try {
      // 캐릭터 항목 찾기
      const characterItems = document.querySelectorAll(
        NAI_SELECTORS.CHARACTER_SECTION
      );
      const character = characterItems[index];

      if (!character) {
        console.error(`캐릭터 ${index}를 찾을 수 없음`);
        return false;
      }

      // 캐릭터 항목 클릭하여 펼치기
      character.click();
      await this.delay(100);

      // 탭 찾기 및 클릭
      const buttons = Array.from(character.querySelectorAll("button"));

      let targetTab = null;
      if (type === "positive") {
        // 텍스트가 "Prompt"를 포함하고 "Undesired"를 포함하지 않는 버튼 찾기
        targetTab = buttons.find(
          (button) =>
            button.textContent &&
            button.textContent.includes("Prompt") &&
            !button.textContent.includes("Undesired")
        );
      } else if (type === "negative") {
        // 텍스트가 "Undesired"를 포함하는 버튼 찾기
        targetTab = buttons.find(
          (button) =>
            button.textContent && button.textContent.includes("Undesired")
        );
      }

      if (targetTab) {
        targetTab.click();
        await this.delay(100);
      }

      // 에디터 찾기 및 텍스트 설정
      const editorKey = `CHARACTER_${index}_${type.toUpperCase()}`;
      let editor = this.elements[editorKey];

      if (!editor) {
        // 에디터를 직접 찾기
        const editors = character.querySelectorAll(".ProseMirror");
        editor = type === "positive" ? editors[0] : editors[1];
      }

      if (!editor) {
        console.error("캐릭터 에디터를 찾을 수 없음");
        return false;
      }

      return this.setProseMirrorText(editor, prompt);
    } catch (error) {
      console.error("캐릭터 프롬프트 설정 실패:", error);
      return false;
    }
  }

  /**
   * 해상도 설정
   * @param {number} width - 너비
   * @param {number} height - 높이
   * @returns {boolean} 성공 여부
   */
  setResolution(width, height) {
    try {
      if (!this.elements.RESOLUTION_WIDTH || !this.elements.RESOLUTION_HEIGHT) {
        // 요소를 재시도해서 가져오기
        const inputs = document.querySelectorAll(
          "input[type='number'][step='64']"
        );
        if (inputs.length >= 2) {
          this.elements.RESOLUTION_WIDTH = inputs[0];
          this.elements.RESOLUTION_HEIGHT = inputs[1];
        } else {
          console.error("해상도 입력 필드를 찾을 수 없음");
          return false;
        }
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
    } catch (error) {
      console.error("해상도 설정 실패:", error);
      return false;
    }
  }

  /**
   * 배치 크기 설정
   * @param {number} size - 배치 크기 (1-4)
   * @returns {boolean} 성공 여부
   */
  setBatchSize(size) {
    try {
      // 유효한 범위로 조정
      const validSize = Math.max(1, Math.min(4, size));

      // 배치 크기 버튼이 없으면 재캐싱
      if (
        !this.elements.BATCH_SIZE_BUTTONS ||
        this.elements.BATCH_SIZE_BUTTONS.length === 0
      ) {
        // 1-4 텍스트를 가진 버튼 찾기
        const allButtons = document.querySelectorAll("button");
        let batchButtons = [];

        allButtons.forEach((button) => {
          const text = button.textContent?.trim();
          if (text === "1" || text === "2" || text === "3" || text === "4") {
            batchButtons.push(button);
          }
        });

        if (batchButtons.length > 0) {
          this.elements.BATCH_SIZE_BUTTONS = batchButtons;
        } else {
          console.error("배치 크기 버튼을 찾을 수 없음");
          return false;
        }
      }

      // 해당 인덱스의 버튼 클릭 (인덱스 유효성 검사)
      const buttonIndex = validSize - 1;
      if (
        buttonIndex >= 0 &&
        buttonIndex < this.elements.BATCH_SIZE_BUTTONS.length
      ) {
        this.elements.BATCH_SIZE_BUTTONS[buttonIndex].click();
        return true;
      } else {
        console.error("유효하지 않은 배치 크기 버튼 인덱스:", buttonIndex);
        return false;
      }
    } catch (error) {
      console.error("배치 크기 설정 실패:", error);
      return false;
    }
  }

  /**
   * 이미지 생성 트리거
   * @returns {boolean} 성공 여부
   */
  triggerGeneration() {
    try {
      // 생성 버튼이 없으면 재캐싱
      if (!this.elements.GENERATE_BUTTON) {
        // "Generate" 텍스트가 포함된 버튼 찾기
        const allButtons = document.querySelectorAll("button");

        for (const button of allButtons) {
          if (button.textContent && button.textContent.includes("Generate")) {
            this.elements.GENERATE_BUTTON = button;
            break;
          }
        }

        if (!this.elements.GENERATE_BUTTON) {
          console.error("생성 버튼을 찾을 수 없음");
          return false;
        }
      }

      // 버튼 클릭
      this.elements.GENERATE_BUTTON.click();
      console.log("이미지 생성 트리거 성공");

      return true;
    } catch (error) {
      console.error("이미지 생성 트리거 실패:", error);
      return false;
    }
  }

  /**
   * 이미지 생성 완료 감지
   * @returns {Promise<void>} 생성 완료 시 해결되는 프로미스
   */
  waitForGenerationComplete() {
    return new Promise((resolve) => {
      try {
        // 생성 버튼이 없으면 재캐싱
        if (!this.elements.GENERATE_BUTTON) {
          const allButtons = document.querySelectorAll("button");

          for (const button of allButtons) {
            if (button.textContent && button.textContent.includes("Generate")) {
              this.elements.GENERATE_BUTTON = button;
              break;
            }
          }
        }

        if (!this.elements.GENERATE_BUTTON) {
          console.error("생성 버튼을 찾을 수 없음");
          resolve(); // 에러 상태로 해결
          return;
        }

        // 생성 버튼 상태 관찰
        const observer = new MutationObserver((mutations) => {
          try {
            // 버튼이 다시 활성화되면 생성 완료로 간주
            const isEnabled =
              !this.elements.GENERATE_BUTTON.disabled &&
              !this.elements.GENERATE_BUTTON.hasAttribute("disabled");

            if (isEnabled) {
              observer.disconnect();
              resolve();
            }
          } catch (error) {
            console.warn("생성 완료 감지 중 오류:", error);
            observer.disconnect();
            resolve(); // 오류 발생 시 그냥 해결
          }
        });

        // 버튼의 모든 속성 변경 관찰
        observer.observe(this.elements.GENERATE_BUTTON, {
          attributes: true,
        });

        // 안전장치: 최대 2분 후 자동 해결
        setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 120000);
      } catch (error) {
        console.error("생성 완료 감지 실패:", error);
        resolve(); // 오류 발생 시 그냥 해결
      }
    });
  }

  /**
   * 현재 인터페이스 상태 가져오기
   * @returns {Object} 인터페이스 상태 객체
   */
  getCurrentState() {
    try {
      this.updateElementsIfNeeded();

      return {
        positivePrompt: this.getPromptText("positive"),
        negativePrompt: this.getPromptText("negative"),
        resolution: {
          width: parseInt(this.elements.RESOLUTION_WIDTH?.value || 1024),
          height: parseInt(this.elements.RESOLUTION_HEIGHT?.value || 1024),
        },
        batchSize: this.getCurrentBatchSize(),
        characters: this.getCharacterStates(),
      };
    } catch (error) {
      console.error("인터페이스 상태 가져오기 실패:", error);
      return {
        positivePrompt: "",
        negativePrompt: "",
        resolution: { width: 1024, height: 1024 },
        batchSize: 1,
        characters: [],
        error: error.message,
      };
    }
  }

  /**
   * 필요한 경우 요소 참조 업데이트
   */
  updateElementsIfNeeded() {
    try {
      // 핵심 요소 재캐싱
      if (!this.elements.POSITIVE_PROMPT) {
        this.elements.POSITIVE_PROMPT = document.querySelector(".ProseMirror");
      }

      if (!this.elements.NEGATIVE_PROMPT) {
        this.elements.NEGATIVE_PROMPT =
          document.querySelectorAll(".ProseMirror")[1];
      }

      if (!this.elements.RESOLUTION_WIDTH || !this.elements.RESOLUTION_HEIGHT) {
        const inputs = document.querySelectorAll(
          "input[type='number'][step='64']"
        );
        if (inputs.length >= 2) {
          this.elements.RESOLUTION_WIDTH = inputs[0];
          this.elements.RESOLUTION_HEIGHT = inputs[1];
        }
      }

      if (
        !this.elements.BATCH_SIZE_BUTTONS ||
        this.elements.BATCH_SIZE_BUTTONS.length === 0
      ) {
        this.cacheBatchButtons();
      }

      if (!this.elements.GENERATE_BUTTON) {
        this.cacheGenerateButton();
      }

      if (!this.elements.PROMPT_TAB || !this.elements.NEGATIVE_TAB) {
        this.cacheTabButtons();
      }
    } catch (error) {
      console.warn("요소 업데이트 중 오류:", error);
    }
  }

  /**
   * 프롬프트 텍스트 가져오기
   * @param {string} type - 프롬프트 타입 ('positive' 또는 'negative')
   * @returns {string} 프롬프트 텍스트
   */
  getPromptText(type) {
    try {
      // 적절한 탭 클릭
      const tab =
        type === "positive"
          ? this.elements.PROMPT_TAB
          : this.elements.NEGATIVE_TAB;

      if (tab) {
        tab.click();
        // 동기적 결과가 필요하지만 비동기 작업임 (단순화)
      }

      // 에디터 내용 가져오기
      let editor;
      if (type === "positive") {
        editor =
          this.elements.POSITIVE_PROMPT ||
          document.querySelector(".ProseMirror");
      } else {
        editor =
          this.elements.NEGATIVE_PROMPT ||
          document.querySelector(".ProseMirror:nth-of-type(2)") ||
          document.querySelectorAll(".ProseMirror")[1];
      }

      return editor?.textContent || "";
    } catch (error) {
      console.warn(`${type} 프롬프트 가져오기 오류:`, error);
      return "";
    }
  }

  /**
   * 현재 배치 크기 가져오기
   * @returns {number} 배치 크기 (1-4)
   */
  getCurrentBatchSize() {
    try {
      if (
        !this.elements.BATCH_SIZE_BUTTONS ||
        this.elements.BATCH_SIZE_BUTTONS.length === 0
      ) {
        return 1; // 기본값
      }

      // 가장 단순한 방법: 첫 번째 버튼 사용 (기본값)
      return 1;
    } catch (error) {
      console.warn("배치 크기 가져오기 오류:", error);
      return 1;
    }
  }

  /**
   * 현재 캐릭터 상태 가져오기
   * @returns {Array<Object>} 캐릭터 상태 배열
   */
  getCharacterStates() {
    try {
      const characterItems = document.querySelectorAll(
        NAI_SELECTORS.CHARACTER_SECTION
      );
      const characters = [];

      // 각 캐릭터 상태 수집 - 간소화된 방식
      characterItems.forEach((item, index) => {
        try {
          characters.push({
            index,
            positivePrompt: "",
            negativePrompt: "",
          });
        } catch (error) {
          console.warn(`캐릭터 ${index} 상태 수집 중 오류:`, error);
        }
      });

      return characters;
    } catch (error) {
      console.warn("캐릭터 상태 가져오기 오류:", error);
      return [];
    }
  }

  /**
   * 리소스 정리
   */
  cleanup() {
    try {
      // 관찰자 해제
      Object.values(this.observers).forEach((observer) => {
        if (observer && typeof observer.disconnect === "function") {
          try {
            observer.disconnect();
          } catch (error) {
            console.warn("관찰자 해제 중 오류:", error);
          }
        }
      });

      console.log("NaiInterface 리소스 정리 완료");
    } catch (error) {
      console.warn("리소스 정리 중 오류:", error);
    }
  }
}
