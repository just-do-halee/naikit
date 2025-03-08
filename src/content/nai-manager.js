// src/content/nai-manager.js
import { initMessaging, MessageTypes } from "../modules/messaging";
import { NaiInterface } from "../modules/nai";
import { compileSegmentTree } from "../modules/compiler/prompt-compiler";

/**
 * NovelAI 관리자 클래스
 * 확장 프로그램과 NovelAI 인터페이스 간의 상호작용 관리
 */
export class NaiManager {
  constructor() {
    // NovelAI 인터페이스
    this.naiInterface = new NaiInterface();

    // 메시징 시스템
    this.messenger = null;

    // 자동 생성 상태
    this.autoGeneration = {
      active: false,
      count: 0,
      interval: 3000, // 기본 3초
      remaining: 0,
      timerId: null,
    };

    // 세그먼트 트리
    this.segmentTree = null;
  }

  /**
   * 관리자 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    try {
      // NovelAI 인터페이스 초기화
      const naiInitialized = await this.naiInterface.initialize();
      if (!naiInitialized) {
        throw new Error("NovelAI 인터페이스 초기화 실패");
      }

      // 메시징 시스템 초기화
      this.messenger = initMessaging("content");

      // 메시지 리스너 설정
      this.setupMessageListeners();

      // NovelAI 인터페이스 이벤트 리스너 설정
      this.setupInterfaceListeners();

      // 초기 상태 동기화
      await this.syncInitialState();

      return true;
    } catch (error) {
      console.error("NaiManager 초기화 실패:", error);
      return false;
    }
  }

  /**
   * 메시지 리스너 설정
   */
  setupMessageListeners() {
    // 프롬프트 업데이트
    this.messenger.onMessage(MessageTypes.SET_POSITIVE_PROMPT, (payload) => {
      return this.naiInterface.setPositivePrompt(payload.prompt);
    });

    this.messenger.onMessage(MessageTypes.SET_NEGATIVE_PROMPT, (payload) => {
      return this.naiInterface.setNegativePrompt(payload.prompt);
    });

    this.messenger.onMessage(MessageTypes.UPDATE_NOVELAI_PROMPT, (payload) => {
      if (payload.promptType === "main") {
        if (payload.promptMode === "positive") {
          return this.naiInterface.setPositivePrompt(payload.text);
        } else {
          return this.naiInterface.setNegativePrompt(payload.text);
        }
      } else if (payload.promptType.startsWith("character_")) {
        const index = parseInt(payload.promptType.split("_")[1]);
        return this.naiInterface.setCharacterPrompt(
          index,
          payload.promptMode,
          payload.text
        );
      }
      return false;
    });

    // 해상도 업데이트
    this.messenger.onMessage(MessageTypes.UPDATE_RESOLUTION, (payload) => {
      return this.naiInterface.setResolution(payload.width, payload.height);
    });

    // 배치 크기 업데이트
    this.messenger.onMessage(MessageTypes.UPDATE_BATCH_SIZE, (payload) => {
      return this.naiInterface.setBatchSize(payload.size);
    });

    // 이미지 생성
    this.messenger.onMessage(MessageTypes.GENERATE_IMAGE, (payload) => {
      return this.generateImage(payload);
    });

    // 자동 생성
    this.messenger.onMessage(MessageTypes.START_AUTO_GENERATION, (payload) => {
      return this.startAutoGeneration(payload.count, payload.interval);
    });

    this.messenger.onMessage(MessageTypes.STOP_AUTO_GENERATION, () => {
      return this.stopAutoGeneration();
    });
  }

  /**
   * NovelAI 인터페이스 이벤트 리스너 설정
   */
  setupInterfaceListeners() {
    // 인터페이스 변경 이벤트
    document.addEventListener("naikit:interfaceChanged", (event) => {
      const { type, data } = event.detail;

      // 백그라운드로 변경 알림
      this.messenger.sendMessage(MessageTypes.NAI_INTERFACE_CHANGED, {
        type,
        data,
      });

      // 사이드바로 변경 알림
      this.messenger.sendToSidebar(MessageTypes.NAI_INTERFACE_CHANGED, {
        type,
        data,
      });
    });
  }

  /**
   * 초기 상태 동기화
   * @returns {Promise<void>}
   */
  async syncInitialState() {
    // 현재 NovelAI 상태 가져오기
    const naiState = this.naiInterface.getCurrentState();

    // 백그라운드로 초기 상태 전송
    await this.messenger.sendMessage(MessageTypes.NAI_INTERFACE_CHANGED, {
      type: "initialState",
      data: naiState,
    });
  }

  /**
   * 이미지 생성
   * @param {Object} payload - 생성 파라미터
   * @returns {Promise<boolean>} 성공 여부
   */
  async generateImage(payload) {
    // 해상도 설정
    if (payload.width && payload.height) {
      this.naiInterface.setResolution(payload.width, payload.height);
    }

    // 배치 크기 설정
    if (payload.batchSize) {
      this.naiInterface.setBatchSize(payload.batchSize);
    }

    // 프롬프트 설정
    if (payload.positivePrompt) {
      this.naiInterface.setPositivePrompt(payload.positivePrompt);
    }

    if (payload.negativePrompt) {
      this.naiInterface.setNegativePrompt(payload.negativePrompt);
    }

    // 생성 트리거
    const triggered = this.naiInterface.triggerGeneration();
    if (!triggered) return false;

    // 생성 완료 대기
    await this.naiInterface.waitForGenerationComplete();

    // 생성 완료 알림
    this.messenger.sendMessage(MessageTypes.GENERATION_COMPLETE, {
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * 자동 생성 시작
   * @param {number} count - 생성 횟수 (0은 무한)
   * @param {number} interval - 생성 간격 (밀리초)
   * @returns {boolean} 성공 여부
   */
  startAutoGeneration(count, interval) {
    // 이미 실행 중인 경우
    if (this.autoGeneration.active) {
      this.stopAutoGeneration();
    }

    this.autoGeneration = {
      active: true,
      count: count,
      interval: interval,
      remaining: count,
      timerId: null,
    };

    // 첫 번째 생성 즉시 시작
    this.generateNextAutoImage();

    return true;
  }

  /**
   * 자동 생성 중지
   * @returns {boolean} 성공 여부
   */
  stopAutoGeneration() {
    if (!this.autoGeneration.active) return false;

    // 타이머 정리
    if (this.autoGeneration.timerId) {
      clearTimeout(this.autoGeneration.timerId);
    }

    this.autoGeneration.active = false;
    this.autoGeneration.timerId = null;

    return true;
  }

  /**
   * 다음 자동 생성 이미지 처리
   * @returns {Promise<void>}
   */
  async generateNextAutoImage() {
    if (!this.autoGeneration.active) return;

    try {
      // 현재 상태의 세그먼트 트리 컴파일
      let positivePrompt = "";
      let negativePrompt = "";

      if (this.segmentTree) {
        // 랜덤 시드로 와일드카드 확장
        const seed = Date.now();
        positivePrompt = compileSegmentTree(this.segmentTree.positivePrompt, {
          expandWildcards: true,
          seed,
        });

        negativePrompt = compileSegmentTree(this.segmentTree.negativePrompt, {
          expandWildcards: true,
          seed: seed + 1, // 약간 다른 시드
        });
      }

      // 현재 NovelAI 설정으로 이미지 생성
      await this.generateImage({
        positivePrompt,
        negativePrompt,
      });

      // 카운트 감소
      if (this.autoGeneration.count > 0) {
        this.autoGeneration.remaining--;

        // 모든 생성 완료
        if (this.autoGeneration.remaining <= 0) {
          this.stopAutoGeneration();
          return;
        }
      }

      // 다음 생성 예약
      this.autoGeneration.timerId = setTimeout(() => {
        this.generateNextAutoImage();
      }, this.autoGeneration.interval);
    } catch (error) {
      console.error("자동 생성 오류:", error);
      this.stopAutoGeneration();
    }
  }

  /**
   * 세그먼트 트리 업데이트
   * @param {Object} newTree - 새 세그먼트 트리
   */
  updateSegmentTree(newTree) {
    this.segmentTree = newTree;
  }

  /**
   * 리소스 정리
   */
  cleanup() {
    // 자동 생성 중지
    this.stopAutoGeneration();

    // NovelAI 인터페이스 정리
    this.naiInterface.cleanup();
  }
}
