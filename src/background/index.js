// src/background/index.js
import { initMessaging, MessageTypes } from "../modules/messaging";
import {
  initStorage,
  savePreset,
  loadPreset,
  getPresetList,
  getWildcardValues,
} from "../modules/storage";

/**
 * NaiKit 백그라운드 스크립트
 * 메시징 중재 및 스토리지 관리를 담당
 */
class NaiKitBackground {
  constructor() {
    // 메시징 시스템
    this.messenger = null;

    // 활성 탭 정보
    this.activeTab = null;

    // 탭 별 세그먼트 트리 캐시
    this.segmentTreeCache = new Map();

    // 자동 생성 상태
    this.autoGenerationStatus = new Map();
  }

  /**
   * 백그라운드 스크립트 초기화
   */
  async initialize() {
    console.log("NaiKit 백그라운드 스크립트 초기화");

    // 스토리지 초기화
    await initStorage();

    // 메시징 시스템 초기화
    this.messenger = initMessaging("background");

    // 메시지 핸들러 등록
    this.setupMessageHandlers();

    // 탭 이벤트 리스너 설정
    this.setupTabListeners();

    console.log("NaiKit 백그라운드 스크립트 초기화 완료");
  }

  /**
   * 메시지 핸들러 설정
   */
  setupMessageHandlers() {
    // 프리셋 관련 핸들러
    this.messenger.onMessage(
      MessageTypes.SAVE_PRESET,
      this.handleSavePreset.bind(this)
    );
    this.messenger.onMessage(
      MessageTypes.LOAD_PRESET,
      this.handleLoadPreset.bind(this)
    );
    this.messenger.onMessage(
      MessageTypes.GET_PRESET_LIST,
      this.handleGetPresetList.bind(this)
    );

    // 와일드카드 관련 핸들러
    this.messenger.onMessage(
      MessageTypes.GET_WILDCARD_VALUES,
      this.handleGetWildcardValues.bind(this)
    );

    // 세그먼트 트리 관련 핸들러
    this.messenger.onMessage(
      MessageTypes.UPDATE_SEGMENT_TREE,
      this.handleUpdateSegmentTree.bind(this)
    );

    // NovelAI 관련 핸들러
    this.messenger.onMessage(
      MessageTypes.UPDATE_NOVELAI_PROMPT,
      this.handleUpdateNovelAIPrompt.bind(this)
    );
    this.messenger.onMessage(
      MessageTypes.NAI_INTERFACE_CHANGED,
      this.handleNaiInterfaceChanged.bind(this)
    );

    // 자동 생성 관련 핸들러
    this.messenger.onMessage(
      MessageTypes.START_AUTO_GENERATION,
      this.handleStartAutoGeneration.bind(this)
    );
    this.messenger.onMessage(
      MessageTypes.STOP_AUTO_GENERATION,
      this.handleStopAutoGeneration.bind(this)
    );
    this.messenger.onMessage(
      MessageTypes.GENERATION_COMPLETE,
      this.handleGenerationComplete.bind(this)
    );
  }

  /**
   * 탭 이벤트 리스너 설정
   */
  setupTabListeners() {
    // 탭 활성화 이벤트
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.updateActiveTab(activeInfo.tabId);
    });

    // 탭 업데이트 이벤트
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete" && tab.active) {
        this.updateActiveTab(tabId);
      }
    });

    // 탭 제거 이벤트
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.segmentTreeCache.delete(tabId);
      this.autoGenerationStatus.delete(tabId);
    });

    // 현재 활성 탭 정보 초기화
    this.updateCurrentActiveTab();
  }

  /**
   * 현재 활성 탭 가져오기
   */
  async updateCurrentActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab) {
        this.updateActiveTab(tab.id);
      }
    } catch (error) {
      console.error("활성 탭 정보 가져오기 실패:", error);
    }
  }

  /**
   * 활성 탭 업데이트
   * @param {number} tabId - 탭 ID
   */
  async updateActiveTab(tabId) {
    this.activeTab = tabId;

    try {
      const tab = await chrome.tabs.get(tabId);

      // NovelAI 이미지 생성 페이지인지 확인
      const isNovelAI = tab.url && tab.url.includes("novelai.net/image");

      // 활성 탭이 NovelAI 이미지 생성 페이지가 아니면 처리 안 함
      if (!isNovelAI) {
        return;
      }

      // 해당 탭의 세그먼트 트리가 없으면 초기화
      if (!this.segmentTreeCache.has(tabId)) {
        this.segmentTreeCache.set(tabId, this.createEmptySegmentTree());
      }
    } catch (error) {
      console.error("탭 정보 업데이트 실패:", error);
    }
  }

  /**
   * 빈 세그먼트 트리 생성
   * @returns {Object} 빈 세그먼트 트리
   */
  createEmptySegmentTree() {
    return {
      positivePrompt: {
        type: "text",
        content: "",
        id: "root_positive",
        children: [],
      },
      negativePrompt: {
        type: "text",
        content: "",
        id: "root_negative",
        children: [],
      },
      characters: [],
    };
  }

  /**
   * 프리셋 저장 핸들러
   * @param {Object} payload - 저장할 프리셋 데이터
   * @returns {Promise<Object>} 저장 결과
   */
  async handleSavePreset(payload) {
    try {
      const result = await savePreset(payload.preset);
      return { success: true, presetId: result.id };
    } catch (error) {
      console.error("프리셋 저장 실패:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 프리셋 로드 핸들러
   * @param {Object} payload - 로드할 프리셋 정보
   * @returns {Promise<Object>} 로드된 프리셋
   */
  async handleLoadPreset(payload) {
    try {
      const preset = await loadPreset(payload.presetId);

      // 활성 탭에 프리셋 적용
      if (this.activeTab && preset) {
        // 세그먼트 트리 업데이트 (필요한 경우)
        if (preset.segmentTree) {
          await this.updateTabSegmentTree(this.activeTab, preset.segmentTree);
        }

        // NovelAI 설정 업데이트 (필요한 경우)
        if (preset.resolution) {
          await this.messenger.sendToContent(
            this.activeTab,
            MessageTypes.UPDATE_RESOLUTION,
            preset.resolution
          );
        }

        if (preset.batchSize) {
          await this.messenger.sendToContent(
            this.activeTab,
            MessageTypes.UPDATE_BATCH_SIZE,
            {
              size: preset.batchSize,
            }
          );
        }
      }

      return { success: true, preset };
    } catch (error) {
      console.error("프리셋 로드 실패:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 프리셋 목록 가져오기 핸들러
   * @returns {Promise<Object>} 프리셋 목록
   */
  async handleGetPresetList() {
    try {
      const presets = await getPresetList();
      return { success: true, presets };
    } catch (error) {
      console.error("프리셋 목록 가져오기 실패:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 와일드카드 값 가져오기 핸들러
   * @param {Object} payload - 와일드카드 정보
   * @returns {Promise<Object>} 와일드카드 값 배열
   */
  async handleGetWildcardValues(payload) {
    try {
      const values = await getWildcardValues(payload.name);
      return { success: true, values };
    } catch (error) {
      console.error("와일드카드 값 가져오기 실패:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 세그먼트 트리 업데이트 핸들러
   * @param {Object} payload - 세그먼트 트리 및 메타데이터
   * @param {Object} sender - 메시지 발신자 정보
   * @returns {Promise<Object>} 업데이트 결과
   */
  async handleUpdateSegmentTree(payload, sender) {
    try {
      const tabId = sender.tab ? sender.tab.id : this.activeTab;
      if (!tabId) {
        throw new Error("유효한 탭 ID를 찾을 수 없습니다");
      }

      await this.updateTabSegmentTree(tabId, payload.segmentTree);
      return { success: true };
    } catch (error) {
      console.error("세그먼트 트리 업데이트 실패:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 특정 탭의 세그먼트 트리 업데이트
   * @param {number} tabId - 탭 ID
   * @param {Object} segmentTree - 새 세그먼트 트리
   */
  async updateTabSegmentTree(tabId, segmentTree) {
    // 세그먼트 트리 캐시 업데이트
    this.segmentTreeCache.set(tabId, segmentTree);

    // 콘텐츠 스크립트로 업데이트 전송
    await this.messenger.sendToContent(
      tabId,
      MessageTypes.UPDATE_SEGMENT_TREE,
      {
        segmentTree,
      }
    );
  }

  /**
   * NovelAI 프롬프트 업데이트 핸들러
   * @param {Object} payload - 프롬프트 정보
   * @param {Object} sender - 메시지 발신자 정보
   * @returns {Promise<Object>} 업데이트 결과
   */
  async handleUpdateNovelAIPrompt(payload, sender) {
    try {
      const tabId = sender.tab ? sender.tab.id : this.activeTab;
      if (!tabId) {
        throw new Error("유효한 탭 ID를 찾을 수 없습니다");
      }

      // 콘텐츠 스크립트로 프롬프트 업데이트 전달
      await this.messenger.sendToContent(
        tabId,
        MessageTypes.UPDATE_NOVELAI_PROMPT,
        payload
      );
      return { success: true };
    } catch (error) {
      console.error("NovelAI 프롬프트 업데이트 실패:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * NovelAI 인터페이스 변경 핸들러
   * @param {Object} payload - 변경 정보
   * @param {Object} sender - 메시지 발신자 정보
   * @returns {Object} 처리 결과
   */
  handleNaiInterfaceChanged(payload, sender) {
    try {
      const tabId = sender.tab ? sender.tab.id : this.activeTab;
      if (!tabId) {
        throw new Error("유효한 탭 ID를 찾을 수 없습니다");
      }

      // TODO: 필요한 경우 세그먼트 트리 업데이트

      return { success: true };
    } catch (error) {
      console.error("NovelAI 인터페이스 변경 처리 실패:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 자동 생성 시작 핸들러
   * @param {Object} payload - 자동 생성 설정
   * @param {Object} sender - 메시지 발신자 정보
   * @returns {Promise<Object>} 처리 결과
   */
  async handleStartAutoGeneration(payload, sender) {
    try {
      const tabId = sender.tab ? sender.tab.id : this.activeTab;
      if (!tabId) {
        throw new Error("유효한 탭 ID를 찾을 수 없습니다");
      }

      // 콘텐츠 스크립트로 자동 생성 시작 전달
      await this.messenger.sendToContent(
        tabId,
        MessageTypes.START_AUTO_GENERATION,
        payload
      );

      // 상태 추적
      this.autoGenerationStatus.set(tabId, {
        active: true,
        count: payload.count,
        interval: payload.interval,
        remaining: payload.count,
        startTime: Date.now(),
      });

      return { success: true };
    } catch (error) {
      console.error("자동 생성 시작 실패:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 자동 생성 중지 핸들러
   * @param {Object} payload - 중지 정보
   * @param {Object} sender - 메시지 발신자 정보
   * @returns {Promise<Object>} 처리 결과
   */
  async handleStopAutoGeneration(payload, sender) {
    try {
      const tabId = sender.tab ? sender.tab.id : this.activeTab;
      if (!tabId) {
        throw new Error("유효한 탭 ID를 찾을 수 없습니다");
      }

      // 콘텐츠 스크립트로 자동 생성 중지 전달
      await this.messenger.sendToContent(
        tabId,
        MessageTypes.STOP_AUTO_GENERATION
      );

      // 상태 업데이트
      if (this.autoGenerationStatus.has(tabId)) {
        const status = this.autoGenerationStatus.get(tabId);
        status.active = false;
        this.autoGenerationStatus.set(tabId, status);
      }

      return { success: true };
    } catch (error) {
      console.error("자동 생성 중지 실패:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 생성 완료 핸들러
   * @param {Object} payload - 완료 정보
   * @param {Object} sender - 메시지 발신자 정보
   * @returns {Object} 처리 결과
   */
  handleGenerationComplete(payload, sender) {
    try {
      const tabId = sender.tab ? sender.tab.id : this.activeTab;
      if (!tabId) {
        throw new Error("유효한 탭 ID를 찾을 수 없습니다");
      }

      // 상태 업데이트 (필요한 경우)
      if (this.autoGenerationStatus.has(tabId)) {
        const status = this.autoGenerationStatus.get(tabId);
        if (status.active && status.count > 0) {
          status.remaining = Math.max(0, status.remaining - 1);
          this.autoGenerationStatus.set(tabId, status);
        }
      }

      return { success: true };
    } catch (error) {
      console.error("생성 완료 처리 실패:", error);
      return { success: false, error: error.message };
    }
  }
}

// 백그라운드 스크립트 인스턴스 생성 및 초기화
const naiKitBackground = new NaiKitBackground();
naiKitBackground.initialize();

// 서비스 워커 활성 상태 유지
chrome.runtime.onMessage.addListener(() => {
  // 단순 리스너 등록만으로 서비스 워커 활성 상태 유지
  return false;
});
