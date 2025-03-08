// modules/storage/storage.js
/**
 * 로컬 스토리지에서 데이터 가져오기
 * @param {string} key - 스토리지 키
 * @returns {Promise<any>} 저장된 데이터
 */
export function getStorage(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result[key]);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 로컬 스토리지에 데이터 저장
 * @param {string} key - 스토리지 키
 * @param {any} value - 저장할 데이터
 * @returns {Promise<void>} 완료 프로미스
 */
export function setStorage(key, value) {
  return new Promise((resolve, reject) => {
    try {
      const data = {};
      data[key] = value;

      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 로컬 스토리지에서 데이터 삭제
 * @param {string} key - 스토리지 키
 * @returns {Promise<void>} 완료 프로미스
 */
export function removeStorage(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove(key, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// modules/storage/preset-storage.js
import { getStorage, setStorage } from "./storage.js";

// 스토리지 키 상수
const PRESETS_KEY = "naikit_presets";
const PRESET_INDEX_KEY = "naikit_preset_index";

/**
 * 프리셋 저장
 * @param {Object} preset - 저장할 프리셋 객체
 * @returns {Promise<Object>} 저장된 프리셋
 */
export async function savePreset(preset) {
  try {
    // 기존 프리셋 가져오기
    const presets = await getPresets();

    // ID 생성 또는 기존 ID 유지
    const presetId =
      preset.id ||
      `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 인덱스 가져오기 또는 생성
    let presetIndex = (await getStorage(PRESET_INDEX_KEY)) || {};
    if (!Array.isArray(presetIndex.ids)) {
      presetIndex = { ids: [] };
    }

    // 저장할 프리셋 준비
    const presetToSave = {
      ...preset,
      id: presetId,
      updatedAt: Date.now(),
    };

    // 기존 프리셋 업데이트 또는 새 프리셋 추가
    presets[presetId] = presetToSave;

    // 인덱스에 없으면 추가
    if (!presetIndex.ids.includes(presetId)) {
      presetIndex.ids.push(presetId);
    }

    // 저장
    await setStorage(PRESETS_KEY, presets);
    await setStorage(PRESET_INDEX_KEY, presetIndex);

    return presetToSave;
  } catch (error) {
    console.error("프리셋 저장 오류:", error);
    throw error;
  }
}

/**
 * 프리셋 로드
 * @param {string} presetId - 프리셋 ID
 * @returns {Promise<Object>} 로드된 프리셋
 */
export async function loadPreset(presetId) {
  try {
    const presets = await getPresets();
    return presets[presetId] || null;
  } catch (error) {
    console.error("프리셋 로드 오류:", error);
    throw error;
  }
}

/**
 * 프리셋 삭제
 * @param {string} presetId - 프리셋 ID
 * @returns {Promise<boolean>} 성공 여부
 */
export async function deletePreset(presetId) {
  try {
    // 프리셋 객체 가져오기
    const presets = await getPresets();

    // 인덱스 가져오기
    let presetIndex = (await getStorage(PRESET_INDEX_KEY)) || { ids: [] };

    // 프리셋이 없으면 실패
    if (!presets[presetId]) {
      return false;
    }

    // 프리셋 삭제
    delete presets[presetId];

    // 인덱스에서 제거
    const idIndex = presetIndex.ids.indexOf(presetId);
    if (idIndex !== -1) {
      presetIndex.ids.splice(idIndex, 1);
    }

    // 저장
    await setStorage(PRESETS_KEY, presets);
    await setStorage(PRESET_INDEX_KEY, presetIndex);

    return true;
  } catch (error) {
    console.error("프리셋 삭제 오류:", error);
    throw error;
  }
}

/**
 * 전체 프리셋 가져오기
 * @returns {Promise<Object>} 전체 프리셋 객체
 */
async function getPresets() {
  try {
    return (await getStorage(PRESETS_KEY)) || {};
  } catch (error) {
    console.error("프리셋 가져오기 오류:", error);
    return {};
  }
}

/**
 * 프리셋 목록 가져오기
 * @param {Object} filters - 필터링 옵션
 * @returns {Promise<Array>} 프리셋 배열
 */
export async function getPresetList(filters = {}) {
  try {
    const presets = await getPresets();
    const presetIndex = (await getStorage(PRESET_INDEX_KEY)) || { ids: [] };

    // 인덱스 기반 정렬된 프리셋 배열 생성
    let presetList = presetIndex.ids
      .filter((id) => presets[id]) // 유효한 ID만 유지
      .map((id) => ({
        id,
        name: presets[id].name,
        description: presets[id].description,
        tags: presets[id].tags || [],
        type: presets[id].type,
        updatedAt: presets[id].updatedAt,
      }));

    // 필터링 적용 (옵션)
    if (filters.type) {
      presetList = presetList.filter((preset) => preset.type === filters.type);
    }

    if (
      filters.tags &&
      Array.isArray(filters.tags) &&
      filters.tags.length > 0
    ) {
      presetList = presetList.filter((preset) =>
        filters.tags.some((tag) => preset.tags.includes(tag))
      );
    }

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      presetList = presetList.filter(
        (preset) =>
          preset.name.toLowerCase().includes(searchTerm) ||
          (preset.description &&
            preset.description.toLowerCase().includes(searchTerm))
      );
    }

    // 정렬 적용 (옵션)
    if (filters.sortBy) {
      const sortField = filters.sortBy;
      const sortDirection = filters.sortDirection === "desc" ? -1 : 1;

      presetList.sort((a, b) => {
        if (a[sortField] < b[sortField]) return -1 * sortDirection;
        if (a[sortField] > b[sortField]) return 1 * sortDirection;
        return 0;
      });
    } else {
      // 기본 정렬: 최근 업데이트순
      presetList.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    return presetList;
  } catch (error) {
    console.error("프리셋 목록 가져오기 오류:", error);
    throw error;
  }
}
