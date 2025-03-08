// src/sidebar/sidebar.js
import { initMessaging } from "../modules/messaging";
import { createSegmentRoot, TextSegment } from "../modules/segment-model";
import { compileSegmentTree } from "../modules/compiler/prompt-compiler";

/**
 * 사이드바 모드 상수
 * @readonly
 * @enum {string}
 */
const SidebarMode = {
  COMPOSE: "compose",
  FINETUNE: "finetune",
};

/**
 * NaiKit 사이드바 클래스
 * NovelAI 인터페이스에 삽입되는 사이드바 관리
 */
export class NaiKitSidebar {
  /**
   * 사이드바 초기화
   * @param {HTMLElement} container - 사이드바가 삽입될 컨테이너 요소
   */
  constructor(container) {
    this.container = container;
    this.currentMode = SidebarMode.COMPOSE;
    this.messenger = null;
    this.segmentRoot = createSegmentRoot();

    // 모드별 상태 관리
    this.modeState = {
      [SidebarMode.COMPOSE]: {
        cursorPosition: null,
        scrollPosition: null,
        selectedRange: null,
      },
      [SidebarMode.FINETUNE]: {
        cursorPosition: null,
        scrollPosition: null,
        selectedRange: null,
        activeSegmentId: null,
      },
    };

    // 현재 프롬프트 타입 (메인/캐릭터)
    this.promptType = "main";

    // 현재 편집 중인 프롬프트(positive/negative)
    this.currentPrompt = "positive";

    // 메시징 시스템 초기화
    this.initMessaging();

    // UI 초기화
    this.initUI();

    // 이벤트 리스너 설정
    this.setupEventListeners();
  }

  /**
   * 메시징 시스템 초기화
   */
  initMessaging() {
    this.messenger = initMessaging("sidebar");

    // 메시지 리스너 등록
    this.setupMessageListeners();
  }

  /**
   * 메시지 리스너 설정
   */
  setupMessageListeners() {
    // 백그라운드에서 오는 메시지 처리
    this.messenger.onMessage("UPDATE_SEGMENT_TREE", (data) => {
      this.updateSegmentTree(data.segmentTree);
    });

    // NovelAI 인터페이스 변경 감지 메시지
    this.messenger.onMessage("NAI_INTERFACE_CHANGED", (data) => {
      this.handleNaiInterfaceChange(data);
    });
  }

  /**
   * UI 초기화
   */
  initUI() {
    // 사이드바 기본 구조 생성
    this.createBaseStructure();

    // 초기 모드 렌더링
    this.renderCurrentMode();
  }

  /**
   * 사이드바 기본 구조 생성
   */
  createBaseStructure() {
    this.container.innerHTML = `
      <div class="naikit-sidebar">
        <div class="naikit-header">
          <div class="naikit-mode-toggle">
            <button class="naikit-mode-button compose active" data-mode="compose">컴포즈</button>
            <button class="naikit-mode-button finetune" data-mode="finetune">파인튠</button>
          </div>
          <button class="naikit-toggle-button">◀</button>
        </div>
        
        <div class="naikit-main-content">
          <div class="naikit-prompt-section">
            <div class="naikit-prompt-tabs">
              <button class="naikit-tab active" data-prompt="positive">긍정적</button>
              <button class="naikit-tab" data-prompt="negative">부정적</button>
            </div>
            
            <div class="naikit-editor-container">
              <div class="naikit-editor" contenteditable="true"></div>
            </div>
          </div>
          
          <div class="naikit-character-section">
            <h3>캐릭터 프롬프트</h3>
            <button class="naikit-add-character">Add Character</button>
            <div class="naikit-character-list"></div>
          </div>
        </div>
        
        <div class="naikit-settings-panel">
          <div class="naikit-image-settings">
            <h3>이미지 설정</h3>
            <div class="naikit-resolution-control">
              <label>해상도</label>
              <select class="naikit-resolution-select">
                <option value="normal-square">Normal Square (1024x1024)</option>
                <option value="portrait">Portrait (832x1216)</option>
                <option value="landscape">Landscape (1216x832)</option>
                <option value="custom">커스텀...</option>
              </select>
              
              <div class="naikit-custom-resolution" style="display: none;">
                <input type="number" class="naikit-width" value="1024" min="64" max="1920" step="8">
                <span>x</span>
                <input type="number" class="naikit-height" value="1024" min="64" max="1920" step="8">
              </div>
            </div>
            
            <div class="naikit-batch-control">
              <label>배치 크기</label>
              <input type="number" class="naikit-batch-size" value="1" min="1" max="4">
            </div>
          </div>
          
          <div class="naikit-preset-panel">
            <h3>프리셋</h3>
            <div class="naikit-preset-actions">
              <button class="naikit-save-preset">저장</button>
              <button class="naikit-load-preset">로드</button>
              <button class="naikit-manage-preset">관리</button>
            </div>
            <div class="naikit-preset-list"></div>
          </div>
        </div>
        
        <div class="naikit-generation-panel">
          <button class="naikit-generate">이미지 생성</button>
          <div class="naikit-auto-generation">
            <button class="naikit-auto-start">자동 생성 시작</button>
            <button class="naikit-auto-stop" style="display: none;">중지</button>
            <div class="naikit-auto-settings">
              <label>
                횟수:
                <input type="number" class="naikit-auto-count" value="5" min="1" max="100">
              </label>
              <label>
                간격(초):
                <input type="number" class="naikit-auto-interval" value="3" min="1" max="60">
              </label>
            </div>
          </div>
        </div>
      </div>
    `;

    // 요소 참조 저장
    this.elements = {
      sidebar: this.container.querySelector(".naikit-sidebar"),
      modeButtons: this.container.querySelectorAll(".naikit-mode-button"),
      toggleButton: this.container.querySelector(".naikit-toggle-button"),
      promptTabs: this.container.querySelectorAll(".naikit-tab"),
      editor: this.container.querySelector(".naikit-editor"),
      addCharacterButton: this.container.querySelector(".naikit-add-character"),
      characterList: this.container.querySelector(".naikit-character-list"),
      resolutionSelect: this.container.querySelector(
        ".naikit-resolution-select"
      ),
      customResolution: this.container.querySelector(
        ".naikit-custom-resolution"
      ),
      widthInput: this.container.querySelector(".naikit-width"),
      heightInput: this.container.querySelector(".naikit-height"),
      batchSizeInput: this.container.querySelector(".naikit-batch-size"),
      savePresetButton: this.container.querySelector(".naikit-save-preset"),
      loadPresetButton: this.container.querySelector(".naikit-load-preset"),
      managePresetButton: this.container.querySelector(".naikit-manage-preset"),
      presetList: this.container.querySelector(".naikit-preset-list"),
      generateButton: this.container.querySelector(".naikit-generate"),
      autoStartButton: this.container.querySelector(".naikit-auto-start"),
      autoStopButton: this.container.querySelector(".naikit-auto-stop"),
      autoCountInput: this.container.querySelector(".naikit-auto-count"),
      autoIntervalInput: this.container.querySelector(".naikit-auto-interval"),
    };
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 모드 버튼 클릭 이벤트
    this.elements.modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.dataset.mode;
        this.switchMode(mode);
      });
    });

    // 사이드바 토글 버튼
    this.elements.toggleButton.addEventListener("click", () => {
      this.toggleSidebar();
    });

    // 프롬프트 탭 전환
    this.elements.promptTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        this.switchPromptTab(tab.dataset.prompt);
      });
    });

    // 에디터 이벤트
    this.elements.editor.addEventListener("input", () => {
      this.handleEditorInput();
    });

    this.elements.editor.addEventListener("keydown", (e) => {
      this.handleEditorKeydown(e);
    });

    // 해상도 설정 변경
    this.elements.resolutionSelect.addEventListener("change", () => {
      this.handleResolutionChange();
    });

    // 캐릭터 추가 버튼
    this.elements.addCharacterButton.addEventListener("click", () => {
      this.addNewCharacter();
    });

    // 생성 버튼
    this.elements.generateButton.addEventListener("click", () => {
      this.generateImage();
    });

    // 자동 생성 버튼
    this.elements.autoStartButton.addEventListener("click", () => {
      this.startAutoGeneration();
    });

    this.elements.autoStopButton.addEventListener("click", () => {
      this.stopAutoGeneration();
    });

    // 키보드 단축키 전역 이벤트
    document.addEventListener("keydown", (e) => {
      this.handleGlobalKeydown(e);
    });
  }

  /**
   * 현재 모드 렌더링
   */
  renderCurrentMode() {
    this.elements.modeButtons.forEach((button) => {
      if (button.dataset.mode === this.currentMode) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });

    // 컴포즈/파인튠 모드별 클래스 전환
    this.elements.sidebar.classList.remove("mode-compose", "mode-finetune");
    this.elements.sidebar.classList.add(`mode-${this.currentMode}`);

    // 현재 모드에 맞게 에디터 내용 렌더링
    this.renderEditorContent();
  }

  /**
   * 에디터 내용 렌더링
   * 모드에 따라 다르게 표시
   */
  renderEditorContent() {
    // 현재 프롬프트 세그먼트 가져오기
    const segmentTree = this.getPromptSegmentTree();

    if (this.currentMode === SidebarMode.COMPOSE) {
      this.renderComposeMode(segmentTree);
    } else {
      this.renderFineTuneMode(segmentTree);
    }

    // 저장된 커서 위치와 스크롤 위치 복원
    this.restoreEditorState();
  }

  /**
   * 컴포즈 모드 렌더링
   * @param {Object} segmentTree - 렌더링할 세그먼트 트리
   */
  renderComposeMode(segmentTree) {
    // 컴포즈 모드에서는 와일드카드/키워드만 시각적으로 표시하고,
    // 가중치 박스는 표시하지 않음
    const html = this.renderSegmentTreeToHTML(segmentTree, {
      showWeights: false,
      showGroups: false,
      showPresets: true,
      showInlineWildcards: true,
    });

    this.elements.editor.innerHTML = html;
  }

  /**
   * 파인튠 모드 렌더링
   * @param {Object} segmentTree - 렌더링할 세그먼트 트리
   */
  renderFineTuneMode(segmentTree) {
    // 파인튠 모드에서는 모든 요소(가중치, 그룹, 와일드카드, 키워드)를 시각적으로 표시
    const html = this.renderSegmentTreeToHTML(segmentTree, {
      showWeights: true,
      showGroups: true,
      showPresets: true,
      showInlineWildcards: true,
    });

    this.elements.editor.innerHTML = html;
  }

  /**
   * 세그먼트 트리를 HTML로 렌더링
   * @param {Object} segment - 렌더링할 세그먼트
   * @param {Object} options - 렌더링 옵션
   * @returns {string} HTML 문자열
   */
  renderSegmentTreeToHTML(segment, options) {
    if (!segment) return "";

    let html = "";

    switch (segment.type) {
      case "text":
        html = this.escapeHTML(segment.content);
        break;

      case "preset":
        if (options.showPresets) {
          const presetClass =
            segment.mode === "random" ? "wildcard" : "keyword";
          html = `<span class="naikit-preset ${presetClass}" data-id="${
            segment.id
          }" data-name="${segment.name}">
                    ${
                      segment.mode === "random"
                        ? `!${segment.name}`
                        : `${segment.name}:${segment.selected}`
                    }
                  </span>`;
        } else {
          html =
            segment.mode === "random"
              ? `!${segment.name}`
              : `${segment.name}:${segment.selected}`;
        }
        break;

      case "weighted":
        if (options.showWeights) {
          const intensityClass = `intensity-${Math.floor(
            segment.metadata.intensity * 10
          )}`;
          const weightTypeClass =
            segment.bracketType === "increase" ? "increase" : "decrease";

          const childrenHTML = segment.children
            .map((child) => this.renderSegmentTreeToHTML(child, options))
            .join("");

          html = `<span class="naikit-weight ${weightTypeClass} ${intensityClass}" data-id="${
            segment.id
          }" data-value="${segment.displayValue.toFixed(2)}">
                    ${childrenHTML}
                    <span class="naikit-weight-value">${segment.displayValue.toFixed(
                      2
                    )}</span>
                  </span>`;
        } else {
          // 가중치 표시 없이 자식만 렌더링
          html = segment.children
            .map((child) => this.renderSegmentTreeToHTML(child, options))
            .join("");
        }
        break;

      case "inline_wildcard":
        if (options.showInlineWildcards) {
          html = `<span class="naikit-inline-wildcard" data-id="${segment.id}">
                    (${segment.options.join("|")})
                  </span>`;
        } else {
          html = `(${segment.options.join("|")})`;
        }
        break;

      default:
        // 기본적으로 자식 렌더링
        if (segment.children && segment.children.length > 0) {
          html = segment.children
            .map((child) => this.renderSegmentTreeToHTML(child, options))
            .join("");
        }
    }

    return html;
  }

  /**
   * HTML 이스케이프
   * @param {string} text - 이스케이프할 텍스트
   * @returns {string} 이스케이프된 텍스트
   */
  escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 에디터 상태 저장
   */
  saveEditorState() {
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (range) {
      this.modeState[this.currentMode].selectedRange = {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
      };
    }

    this.modeState[this.currentMode].scrollPosition =
      this.elements.editor.scrollTop;

    // 파인튠 모드 전용 상태
    if (this.currentMode === SidebarMode.FINETUNE) {
      this.modeState[this.currentMode].activeSegmentId =
        this.getActiveSegmentId();
    }
  }

  /**
   * 에디터 상태 복원
   */
  restoreEditorState() {
    const state = this.modeState[this.currentMode];

    // 선택 범위 복원
    if (state.selectedRange) {
      try {
        const range = document.createRange();
        range.setStart(
          state.selectedRange.startContainer,
          state.selectedRange.startOffset
        );
        range.setEnd(
          state.selectedRange.endContainer,
          state.selectedRange.endOffset
        );

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        // 선택 복원 실패 처리
        console.warn("Failed to restore selection", e);
      }
    }

    // 스크롤 위치 복원
    if (state.scrollPosition !== null) {
      this.elements.editor.scrollTop = state.scrollPosition;
    }

    // 파인튠 모드 특수 상태 복원
    if (this.currentMode === SidebarMode.FINETUNE && state.activeSegmentId) {
      this.activateSegment(state.activeSegmentId);
    }
  }

  /**
   * 모드 전환
   * @param {string} newMode - 새 모드 ('compose' 또는 'finetune')
   */
  switchMode(newMode) {
    if (newMode === this.currentMode) return;

    // 현재 모드 상태 저장
    this.saveEditorState();

    // 모드 전환
    this.currentMode = newMode;

    // 새 모드 렌더링
    this.renderCurrentMode();
  }

  /**
   * 사이드바 토글
   */
  toggleSidebar() {
    this.elements.sidebar.classList.toggle("collapsed");

    // 토글 버튼 방향 변경
    if (this.elements.sidebar.classList.contains("collapsed")) {
      this.elements.toggleButton.textContent = "▶";
    } else {
      this.elements.toggleButton.textContent = "◀";
    }
  }

  /**
   * 프롬프트 탭 전환
   * @param {string} promptType - 프롬프트 타입 ('positive' 또는 'negative')
   */
  switchPromptTab(promptType) {
    if (promptType === this.currentPrompt) return;

    // 탭 UI 업데이트
    this.elements.promptTabs.forEach((tab) => {
      if (tab.dataset.prompt === promptType) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    // 현재 프롬프트 타입 변경
    this.currentPrompt = promptType;

    // 에디터 콘텐츠 업데이트
    this.renderEditorContent();
  }

  /**
   * 현재 프롬프트의 세그먼트 트리 가져오기
   * @returns {Object} 세그먼트 트리
   */
  getPromptSegmentTree() {
    if (this.promptType === "main") {
      return this.currentPrompt === "positive"
        ? this.segmentRoot.positivePrompt
        : this.segmentRoot.negativePrompt;
    } else {
      // 캐릭터 프롬프트 처리
      const characterIndex = parseInt(this.promptType.split("_")[1]);
      const character = this.segmentRoot.characters[characterIndex];

      if (!character) return createSegmentRoot();

      return this.currentPrompt === "positive"
        ? character.positivePrompt
        : character.negativePrompt;
    }
  }

  /**
   * 세그먼트 트리 업데이트
   * @param {Object} segmentTree - 새 세그먼트 트리
   */
  updateSegmentTree(segmentTree) {
    this.segmentRoot = segmentTree;
    this.renderEditorContent();
  }

  /**
   * 에디터 입력 처리
   */
  handleEditorInput() {
    // 텍스트 입력을 세그먼트 트리로 변환
    const editorContent = this.elements.editor.innerText;

    // 세그먼트 트리 업데이트
    this.updatePromptSegment(editorContent);

    // NovelAI로 변경 내용 동기화
    this.syncToNovelAI();
  }

  /**
   * 프롬프트 세그먼트 업데이트
   * @param {string} content - 새 텍스트 내용
   */
  updatePromptSegment(content) {
    // 간단한 구현: 텍스트 세그먼트 생성
    const newSegment = new TextSegment(content);

    // 현재 프롬프트 세그먼트 트리 업데이트
    if (this.promptType === "main") {
      if (this.currentPrompt === "positive") {
        this.segmentRoot.positivePrompt = newSegment;
      } else {
        this.segmentRoot.negativePrompt = newSegment;
      }
    } else {
      // 캐릭터 프롬프트 처리
      const characterIndex = parseInt(this.promptType.split("_")[1]);
      const character = this.segmentRoot.characters[characterIndex];

      if (character) {
        if (this.currentPrompt === "positive") {
          character.positivePrompt = newSegment;
        } else {
          character.negativePrompt = newSegment;
        }
      }
    }
  }

  /**
   * NovelAI와 동기화
   */
  syncToNovelAI() {
    // 세그먼트 트리 컴파일
    const compiledText = compileSegmentTree(this.getPromptSegmentTree(), {
      expandWildcards: false, // UI 표시용으로는 와일드카드 확장 안 함
    });

    // 백그라운드로 메시지 전송
    this.messenger.sendMessage("UPDATE_NOVELAI_PROMPT", {
      promptType: this.promptType,
      promptMode: this.currentPrompt,
      text: compiledText,
    });
  }

  /**
   * 에디터 키다운 이벤트 처리
   * @param {KeyboardEvent} e - 키보드 이벤트
   */
  handleEditorKeydown(e) {
    // 컨트롤+W: 모드 전환
    if (e.ctrlKey && e.key === "w") {
      e.preventDefault();
      this.switchMode(
        this.currentMode === SidebarMode.COMPOSE
          ? SidebarMode.FINETUNE
          : SidebarMode.COMPOSE
      );
      return;
    }

    // 특수 키 처리
    if (e.key === "!") {
      // 느낌표 입력 시 프리셋 목록 표시
      // 여기서는 간단한 구현만
      console.log("프리셋 목록 표시");
    } else if (e.key === "(" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      // 괄호 입력 시 인라인 와일드카드 시작
      console.log("인라인 와일드카드 시작");
    }
  }

  /**
   * 전역 키다운 이벤트 처리
   * @param {KeyboardEvent} e - 키보드 이벤트
   */
  handleGlobalKeydown(e) {
    // 여기에 전역 단축키 처리 추가
  }

  /**
   * 해상도 변경 처리
   */
  handleResolutionChange() {
    const selectedValue = this.elements.resolutionSelect.value;

    if (selectedValue === "custom") {
      // 커스텀 해상도 입력 필드 표시
      this.elements.customResolution.style.display = "flex";
    } else {
      // 기본 해상도 설정
      this.elements.customResolution.style.display = "none";

      // 해상도 값 설정
      let width, height;
      switch (selectedValue) {
        case "normal-square":
          width = height = 1024;
          break;
        case "portrait":
          width = 832;
          height = 1216;
          break;
        case "landscape":
          width = 1216;
          height = 832;
          break;
      }

      this.elements.widthInput.value = width;
      this.elements.heightInput.value = height;

      // NovelAI로 해상도 동기화
      this.syncResolution(width, height);
    }
  }

  /**
   * 해상도 동기화
   * @param {number} width - 너비
   * @param {number} height - 높이
   */
  syncResolution(width, height) {
    this.messenger.sendMessage("UPDATE_RESOLUTION", { width, height });
  }

  /**
   * 새 캐릭터 추가
   */
  addNewCharacter() {
    // 캐릭터 ID 생성
    const characterIndex = this.segmentRoot.characters
      ? this.segmentRoot.characters.length
      : 0;

    // 캐릭터 객체 생성
    const newCharacter = {
      id: `character_${characterIndex}`,
      name: `Character ${characterIndex + 1}`,
      positivePrompt: new TextSegment(""),
      negativePrompt: new TextSegment(""),
    };

    // 세그먼트 루트에 캐릭터 추가
    if (!this.segmentRoot.characters) {
      this.segmentRoot.characters = [];
    }

    this.segmentRoot.characters.push(newCharacter);

    // 캐릭터 UI 업데이트
    this.renderCharacterList();

    // 새 캐릭터로 전환
    this.switchToCharacter(characterIndex);
  }

  /**
   * 캐릭터 목록 렌더링
   */
  renderCharacterList() {
    if (
      !this.segmentRoot.characters ||
      this.segmentRoot.characters.length === 0
    ) {
      this.elements.characterList.innerHTML = "<p>No characters added.</p>";
      return;
    }

    const charactersHTML = this.segmentRoot.characters
      .map(
        (character, index) => `
      <div class="naikit-character-item" data-index="${index}">
        <div class="naikit-character-header">
          <span class="naikit-character-name">${character.name}</span>
          <div class="naikit-character-actions">
            <button class="naikit-rename-character" data-index="${index}">✏️</button>
            <button class="naikit-delete-character" data-index="${index}">🗑️</button>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    this.elements.characterList.innerHTML = charactersHTML;

    // 캐릭터 항목 클릭 이벤트 추가
    this.elements.characterList
      .querySelectorAll(".naikit-character-item")
      .forEach((item) => {
        item.addEventListener("click", () => {
          const index = parseInt(item.dataset.index);
          this.switchToCharacter(index);
        });
      });

    // 이름 변경 버튼 이벤트
    this.elements.characterList
      .querySelectorAll(".naikit-rename-character")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation(); // 상위 클릭 이벤트 방지
          const index = parseInt(button.dataset.index);
          this.renameCharacter(index);
        });
      });

    // 삭제 버튼 이벤트
    this.elements.characterList
      .querySelectorAll(".naikit-delete-character")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation(); // 상위 클릭 이벤트 방지
          const index = parseInt(button.dataset.index);
          this.deleteCharacter(index);
        });
      });
  }

  /**
   * 캐릭터로 전환
   * @param {number} index - 캐릭터 인덱스
   */
  switchToCharacter(index) {
    // 현재 에디터 상태 저장
    this.saveEditorState();

    // 프롬프트 타입 변경
    this.promptType = `character_${index}`;

    // 캐릭터 항목 하이라이트
    this.elements.characterList
      .querySelectorAll(".naikit-character-item")
      .forEach((item, i) => {
        if (i === index) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });

    // 에디터 콘텐츠 업데이트
    this.renderEditorContent();
  }

  /**
   * 캐릭터 이름 변경
   * @param {number} index - 캐릭터 인덱스
   */
  renameCharacter(index) {
    const character = this.segmentRoot.characters[index];
    if (!character) return;

    const newName = prompt("캐릭터 이름 입력:", character.name);
    if (newName !== null && newName.trim() !== "") {
      character.name = newName.trim();
      this.renderCharacterList();
    }
  }

  /**
   * 캐릭터 삭제
   * @param {number} index - 캐릭터 인덱스
   */
  deleteCharacter(index) {
    if (!confirm("이 캐릭터를 삭제하시겠습니까?")) return;

    // 캐릭터 삭제
    this.segmentRoot.characters.splice(index, 1);

    // 현재 선택된 캐릭터가 삭제되는 경우
    if (this.promptType === `character_${index}`) {
      // 메인 프롬프트로 돌아가기
      this.promptType = "main";
    }
    // 삭제된 캐릭터보다 높은 인덱스의 캐릭터를 보고 있는 경우
    else if (this.promptType.startsWith("character_")) {
      const currentIndex = parseInt(this.promptType.split("_")[1]);
      if (currentIndex > index) {
        // 인덱스 조정
        this.promptType = `character_${currentIndex - 1}`;
      }
    }

    // 캐릭터 목록 업데이트
    this.renderCharacterList();

    // 에디터 콘텐츠 업데이트
    this.renderEditorContent();
  }

  /**
   * 이미지 생성
   */
  generateImage() {
    // 이미지 생성 전 와일드카드 확장
    const expandedPositivePrompt = compileSegmentTree(
      this.getPositivePromptTree(),
      {
        expandWildcards: true,
        seed: Math.floor(Math.random() * 1000000), // 랜덤 시드
      }
    );

    const expandedNegativePrompt = compileSegmentTree(
      this.getNegativePromptTree(),
      {
        expandWildcards: true,
        seed: Math.floor(Math.random() * 1000000), // 랜덤 시드
      }
    );

    // 이미지 생성 메시지 전송
    this.messenger.sendMessage("GENERATE_IMAGE", {
      positivePrompt: expandedPositivePrompt,
      negativePrompt: expandedNegativePrompt,
      width: parseInt(this.elements.widthInput.value),
      height: parseInt(this.elements.heightInput.value),
      batchSize: parseInt(this.elements.batchSizeInput.value),
    });
  }

  /**
   * 자동 생성 시작
   */
  startAutoGeneration() {
    const count = parseInt(this.elements.autoCountInput.value);
    const interval = parseInt(this.elements.autoIntervalInput.value) * 1000; // 초 -> 밀리초

    // 자동 생성 설정 전송
    this.messenger.sendMessage("START_AUTO_GENERATION", {
      count,
      interval,
    });

    // UI 업데이트
    this.elements.autoStartButton.style.display = "none";
    this.elements.autoStopButton.style.display = "block";
  }

  /**
   * 자동 생성 중지
   */
  stopAutoGeneration() {
    // 자동 생성 중지 요청
    this.messenger.sendMessage("STOP_AUTO_GENERATION");

    // UI 업데이트
    this.elements.autoStartButton.style.display = "block";
    this.elements.autoStopButton.style.display = "none";
  }

  /**
   * 현재 긍정 프롬프트 세그먼트 트리 가져오기
   * @returns {Object} 세그먼트 트리
   */
  getPositivePromptTree() {
    if (this.promptType === "main") {
      return this.segmentRoot.positivePrompt;
    } else {
      const characterIndex = parseInt(this.promptType.split("_")[1]);
      return this.segmentRoot.characters[characterIndex]?.positivePrompt;
    }
  }

  /**
   * 현재 부정 프롬프트 세그먼트 트리 가져오기
   * @returns {Object} 세그먼트 트리
   */
  getNegativePromptTree() {
    if (this.promptType === "main") {
      return this.segmentRoot.negativePrompt;
    } else {
      const characterIndex = parseInt(this.promptType.split("_")[1]);
      return this.segmentRoot.characters[characterIndex]?.negativePrompt;
    }
  }

  /**
   * 활성 세그먼트 ID 가져오기
   * @returns {string|null} 활성 세그먼트 ID
   */
  getActiveSegmentId() {
    const activeElement = this.elements.editor.querySelector(".active");
    return activeElement ? activeElement.dataset.id : null;
  }

  /**
   * 세그먼트 활성화
   * @param {string} segmentId - 활성화할 세그먼트 ID
   */
  activateSegment(segmentId) {
    // 기존 활성 요소 비활성화
    const activeElements = this.elements.editor.querySelectorAll(".active");
    activeElements.forEach((el) => el.classList.remove("active"));

    // 새 세그먼트 활성화
    const targetElement = this.elements.editor.querySelector(
      `[data-id="${segmentId}"]`
    );
    if (targetElement) {
      targetElement.classList.add("active");
    }
  }

  /**
   * NovelAI 인터페이스 변경 처리
   * @param {Object} data - 변경 데이터
   */
  handleNaiInterfaceChange(data) {
    // NovelAI에서 온 변경 사항을 사이드바에 반영
    // 예: 프롬프트, 해상도, 배치 크기 등

    if (data.resolution) {
      this.elements.widthInput.value = data.resolution.width;
      this.elements.heightInput.value = data.resolution.height;

      // 해상도 선택 업데이트
      this.updateResolutionSelect(
        data.resolution.width,
        data.resolution.height
      );
    }

    if (data.batchSize) {
      this.elements.batchSizeInput.value = data.batchSize;
    }

    // 프롬프트 업데이트는 parseNovelAIPrompt 함수를 사용하여 세그먼트 트리로 변환
  }

  /**
   * 해상도 선택 컨트롤 업데이트
   * @param {number} width - 너비
   * @param {number} height - 높이
   */
  updateResolutionSelect(width, height) {
    if (width === 1024 && height === 1024) {
      this.elements.resolutionSelect.value = "normal-square";
      this.elements.customResolution.style.display = "none";
    } else if (width === 832 && height === 1216) {
      this.elements.resolutionSelect.value = "portrait";
      this.elements.customResolution.style.display = "none";
    } else if (width === 1216 && height === 832) {
      this.elements.resolutionSelect.value = "landscape";
      this.elements.customResolution.style.display = "none";
    } else {
      this.elements.resolutionSelect.value = "custom";
      this.elements.customResolution.style.display = "flex";
    }
  }
}

export default NaiKitSidebar;
