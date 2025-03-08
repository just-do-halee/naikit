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
