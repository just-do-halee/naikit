// modules/storage/index.js
import { getStorage, setStorage, removeStorage } from "./storage.js";
import {
  savePreset,
  loadPreset,
  deletePreset,
  getPresetList,
} from "./preset-storage.js";
import {
  saveWildcard,
  getWildcardValues,
  deleteWildcard,
  getWildcardList,
} from "./wildcard-storage.js";
import {
  initSettings,
  getSettings,
  getSetting,
  updateSetting,
  resetSettings,
} from "./settings.js";

/**
 * 스토리지 모듈 초기화
 * @returns {Promise<void>}
 */
export async function initStorage() {
  // 설정 초기화
  await initSettings();

  // 추가 초기화 (필요한 경우)
}

export {
  // 기본 스토리지
  getStorage,
  setStorage,
  removeStorage,

  // 프리셋 스토리지
  savePreset,
  loadPreset,
  deletePreset,
  getPresetList,

  // 와일드카드 스토리지
  saveWildcard,
  getWildcardValues,
  deleteWildcard,
  getWildcardList,

  // 설정 스토리지
  getSettings,
  getSetting,
  updateSetting,
  resetSettings,
};
