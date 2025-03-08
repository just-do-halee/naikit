// modules/storage/settings.js
import { getStorage, setStorage } from "./storage.js";

// 스토리지 키 상수
const SETTINGS_KEY = "naikit_settings";

/**
 * 기본 설정
 * @type {Object}
 */
const DEFAULT_SETTINGS = {
  // 사이드바 설정
  sidebar: {
    width: 350,
    collapsed: false,
    defaultMode: "compose", // 'compose' 또는 'finetune'
  },

  // 자동 생성 설정
  autoGeneration: {
    defaultCount: 5,
    defaultInterval: 3, // 초
  },

  // 편집기 설정
  editor: {
    fontFamily: "Arial, sans-serif",
    fontSize: 14,
    lineHeight: 1.5,
  },

  // 색상 설정
  colors: {
    wildcard: "#3A86FF",
    keyword: "#FF006E",
    weightIncrease: "#8ECAE6",
    weightDecrease: "#FD8A8A",
    inlineWildcard: "#FFB703",
  },

  // UI 동작 설정
  behavior: {
    autoSetAspectRatio: true,
    confirmBeforeDeletePreset: true,
    saveImageSettings: true,
  },
};

/**
 * 설정 초기화
 * @returns {Promise<Object>} 초기화된 설정
 */
export async function initSettings() {
  try {
    // 기존 설정 가져오기
    const existingSettings = await getStorage(SETTINGS_KEY);

    // 설정이 이미 있으면 그대로 반환
    if (existingSettings) {
      return existingSettings;
    }

    // 없으면 기본 설정 저장
    await setStorage(SETTINGS_KEY, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("설정 초기화 오류:", error);
    throw error;
  }
}

/**
 * 설정 가져오기
 * @returns {Promise<Object>} 설정 객체
 */
export async function getSettings() {
  try {
    const settings = await getStorage(SETTINGS_KEY);
    return settings || DEFAULT_SETTINGS;
  } catch (error) {
    console.error("설정 가져오기 오류:", error);
    throw error;
  }
}

/**
 * 특정 설정 값 가져오기
 * @param {string} path - 설정 경로 (점 표기법: 'sidebar.width')
 * @returns {Promise<any>} 설정 값
 */
export async function getSetting(path) {
  try {
    const settings = await getSettings();

    // 경로가 없으면 전체 설정 반환
    if (!path) return settings;

    // 경로를 배열로 분할
    const parts = path.split(".");

    // 경로를 따라 설정 값 찾기
    let value = settings;
    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  } catch (error) {
    console.error("설정 값 가져오기 오류:", error);
    throw error;
  }
}

/**
 * 설정 업데이트
 * @param {string} path - 설정 경로 (점 표기법: 'sidebar.width')
 * @param {any} value - 새 설정 값
 * @returns {Promise<Object>} 업데이트된 설정
 */
export async function updateSetting(path, value) {
  try {
    const settings = await getSettings();

    // 경로가 없으면 전체 설정 업데이트
    if (!path) {
      await setStorage(SETTINGS_KEY, value);
      return value;
    }

    // 경로를 배열로 분할
    const parts = path.split(".");

    // 중첩 객체 업데이트
    let current = settings;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      // 경로의 일부가 없으면 생성
      if (current[part] === undefined) {
        current[part] = {};
      }

      current = current[part];
    }

    // 마지막 속성 업데이트
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;

    // 업데이트된 설정 저장
    await setStorage(SETTINGS_KEY, settings);

    return settings;
  } catch (error) {
    console.error("설정 업데이트 오류:", error);
    throw error;
  }
}

/**
 * 설정 초기화 (기본값으로 재설정)
 * @returns {Promise<Object>} 초기화된 설정
 */
export async function resetSettings() {
  try {
    await setStorage(SETTINGS_KEY, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("설정 초기화 오류:", error);
    throw error;
  }
}
