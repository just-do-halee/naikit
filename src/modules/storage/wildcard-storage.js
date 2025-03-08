// modules/storage/wildcard-storage.js
import { getStorage, setStorage } from "./storage.js";

// 스토리지 키 상수
const WILDCARDS_KEY = "naikit_wildcards";
const WILDCARD_INDEX_KEY = "naikit_wildcard_index";

/**
 * 와일드카드 저장
 * @param {string} name - 와일드카드 이름
 * @param {Array<string>} values - 와일드카드 값 배열
 * @returns {Promise<Object>} 저장된 와일드카드
 */
export async function saveWildcard(name, values) {
  try {
    // 기존 와일드카드 가져오기
    const wildcards = await getWildcards();

    // 인덱스 가져오기 또는 생성
    let wildcardIndex = (await getStorage(WILDCARD_INDEX_KEY)) || {};
    if (!Array.isArray(wildcardIndex.names)) {
      wildcardIndex = { names: [] };
    }

    // 저장할 와일드카드 준비
    const wildcardToSave = {
      name,
      values: [...values],
      updatedAt: Date.now(),
    };

    // 기존 와일드카드 업데이트 또는 새 와일드카드 추가
    wildcards[name] = wildcardToSave;

    // 인덱스에 없으면 추가
    if (!wildcardIndex.names.includes(name)) {
      wildcardIndex.names.push(name);
    }

    // 저장
    await setStorage(WILDCARDS_KEY, wildcards);
    await setStorage(WILDCARD_INDEX_KEY, wildcardIndex);

    return wildcardToSave;
  } catch (error) {
    console.error("와일드카드 저장 오류:", error);
    throw error;
  }
}

/**
 * 와일드카드 값 가져오기
 * @param {string} name - 와일드카드 이름
 * @returns {Promise<Array<string>>} 와일드카드 값 배열
 */
export async function getWildcardValues(name) {
  try {
    const wildcards = await getWildcards();
    return wildcards[name]?.values || [];
  } catch (error) {
    console.error("와일드카드 값 가져오기 오류:", error);
    throw error;
  }
}

/**
 * 와일드카드 삭제
 * @param {string} name - 와일드카드 이름
 * @returns {Promise<boolean>} 성공 여부
 */
export async function deleteWildcard(name) {
  try {
    // 와일드카드 객체 가져오기
    const wildcards = await getWildcards();

    // 인덱스 가져오기
    let wildcardIndex = (await getStorage(WILDCARD_INDEX_KEY)) || { names: [] };

    // 와일드카드가 없으면 실패
    if (!wildcards[name]) {
      return false;
    }

    // 와일드카드 삭제
    delete wildcards[name];

    // 인덱스에서 제거
    const nameIndex = wildcardIndex.names.indexOf(name);
    if (nameIndex !== -1) {
      wildcardIndex.names.splice(nameIndex, 1);
    }

    // 저장
    await setStorage(WILDCARDS_KEY, wildcards);
    await setStorage(WILDCARD_INDEX_KEY, wildcardIndex);

    return true;
  } catch (error) {
    console.error("와일드카드 삭제 오류:", error);
    throw error;
  }
}

/**
 * 전체 와일드카드 가져오기
 * @returns {Promise<Object>} 전체 와일드카드 객체
 */
async function getWildcards() {
  try {
    return (await getStorage(WILDCARDS_KEY)) || {};
  } catch (error) {
    console.error("와일드카드 가져오기 오류:", error);
    return {};
  }
}

/**
 * 와일드카드 목록 가져오기
 * @param {Object} filters - 필터링 옵션
 * @returns {Promise<Array>} 와일드카드 배열
 */
export async function getWildcardList(filters = {}) {
  try {
    const wildcards = await getWildcards();
    const wildcardIndex = (await getStorage(WILDCARD_INDEX_KEY)) || {
      names: [],
    };

    // 인덱스 기반 정렬된 와일드카드 배열 생성
    let wildcardList = wildcardIndex.names
      .filter((name) => wildcards[name]) // 유효한 이름만 유지
      .map((name) => ({
        name,
        valueCount: wildcards[name].values.length,
        updatedAt: wildcards[name].updatedAt,
      }));

    // 필터링 적용 (옵션)
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      wildcardList = wildcardList.filter((wildcard) =>
        wildcard.name.toLowerCase().includes(searchTerm)
      );
    }

    // 정렬 적용 (옵션)
    if (filters.sortBy) {
      const sortField = filters.sortBy;
      const sortDirection = filters.sortDirection === "desc" ? -1 : 1;

      wildcardList.sort((a, b) => {
        if (a[sortField] < b[sortField]) return -1 * sortDirection;
        if (a[sortField] > b[sortField]) return 1 * sortDirection;
        return 0;
      });
    } else {
      // 기본 정렬: 이름순
      wildcardList.sort((a, b) => a.name.localeCompare(b.name));
    }

    return wildcardList;
  } catch (error) {
    console.error("와일드카드 목록 가져오기 오류:", error);
    throw error;
  }
}
