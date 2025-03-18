import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

import { vi } from "vitest";

// 메모리 기반 스토리지
const mockStorageData: Record<string, any> = {};
global.chrome = {
  storage: {
    local: {
      set: vi.fn(async (items) => {
        Object.assign(mockStorageData, items);
      }),
      get: vi.fn(async (keys) => {
        if (typeof keys === "string") {
          return { [keys]: mockStorageData[keys] };
        } else if (Array.isArray(keys)) {
          const result: Record<string, any> = {};
          for (const key of keys) {
            if (key in mockStorageData) {
              result[key] = mockStorageData[key];
            }
          }
          return result;
        }
        return {};
      }),
    },
  },
} as any;

// 각 테스트 후 자동 정리
afterEach(() => {
  cleanup();
});
