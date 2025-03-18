// modules/compiler/segment-compiler-cache.ts

import { CompileCache, CacheKeyOptions } from "./types";

/**
 * 고성능 컴파일 결과 캐싱 시스템
 *
 * 메모리 효율적인 LRU 캐시와 세그먼트 의존성 그래프를 결합하여
 * 변경된 세그먼트만 선택적으로 재컴파일하는 최적화 시스템
 */
export class SegmentCompileCache implements CompileCache {
  // Cache of compiled results
  private readonly cache = new Map<string, string>();

  // Dependency graph
  private readonly dependencies = new Map<string, Set<string>>();

  // Track options objects that have been used
  private readonly usedOptions = new WeakMap<object, string>();

  // Cache statistics
  private hits = 0;
  private misses = 0;

  // LRU mechanism
  private readonly maxSize: number;
  private readonly recentKeys: string[] = [];

  /**
   * Constructor
   * @param maxSize Maximum cache entries (default: 1000)
   */
  constructor(maxSize = 1000) {
    this.maxSize = Math.max(1, maxSize);
  }

  /**
   * Create a cache key from options
   */
  private createCacheKey(options: CacheKeyOptions): string {
    // Check if we've seen this exact options object before
    if (this.usedOptions.has(options)) {
      const oldKey = this.usedOptions.get(options)!;

      // Generate a new key based on current values
      const newKey = this.generateKeyFromValues(options);

      // If values changed, invalidate the old entry
      if (oldKey !== newKey) {
        this.cache.delete(oldKey);
        const index = this.recentKeys.indexOf(oldKey);
        if (index !== -1) {
          this.recentKeys.splice(index, 1);
        }
        // Update tracked key for this options object
        this.usedOptions.set(options, newKey);
        return newKey;
      }

      return oldKey;
    }

    // First time seeing this options object
    const key = this.generateKeyFromValues(options);
    this.usedOptions.set(options, key);
    return key;
  }

  /**
   * Generate a key string from option values
   */
  private generateKeyFromValues(options: CacheKeyOptions): string {
    // Extract values to prevent reference issues
    const segmentId = String(options.segmentId || "");
    const expandWildcards = Boolean(options.expandWildcards);
    const seed = typeof options.seed === "number" ? Number(options.seed) : 0;

    // Create a unique key based on values
    return `${segmentId}:${expandWildcards ? "1" : "0"}:${seed}`;
  }

  /**
   * Update LRU tracking for a key
   */
  private updateKeyAccess(key: string): void {
    // Remove key from current position if it exists
    const index = this.recentKeys.indexOf(key);
    if (index !== -1) {
      this.recentKeys.splice(index, 1);
    }

    // Add key to the end (most recent)
    this.recentKeys.push(key);
  }

  /**
   * Enforce cache size limit
   */
  private enforceSizeLimit(): void {
    // Remove oldest items until within limit
    while (this.cache.size >= this.maxSize && this.recentKeys.length > 0) {
      const oldestKey = this.recentKeys.shift();
      if (oldestKey && this.cache.has(oldestKey)) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Get cached result
   */
  public get(options: CacheKeyOptions): string | null {
    const key = this.createCacheKey(options);

    if (this.cache.has(key)) {
      this.updateKeyAccess(key);
      this.hits++;
      return this.cache.get(key) || null;
    }

    this.misses++;
    return null;
  }

  /**
   * Cache a result
   */
  public set(options: CacheKeyOptions, result: string): void {
    const key = this.createCacheKey(options);

    // Update existing item
    if (this.cache.has(key)) {
      this.cache.set(key, result);
      this.updateKeyAccess(key);
      return;
    }

    // Enforce size limit before adding new item
    this.enforceSizeLimit();

    // Add new item
    this.cache.set(key, result);
    this.updateKeyAccess(key);
  }

  /**
   * Register a dependency between segments
   */
  public registerDependency(parentId: string, childId: string): void {
    if (!this.dependencies.has(parentId)) {
      this.dependencies.set(parentId, new Set<string>());
    }
    this.dependencies.get(parentId)!.add(childId);
  }

  /**
   * Invalidate all cache entries for a segment
   */
  public invalidate(segmentId: string): void {
    if (!segmentId) return;

    // Find and remove all keys for this segment
    const keysToInvalidate: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${segmentId}:`)) {
        keysToInvalidate.push(key);
      }
    }

    // Remove from cache and recency tracking
    for (const key of keysToInvalidate) {
      this.cache.delete(key);
      const index = this.recentKeys.indexOf(key);
      if (index !== -1) {
        this.recentKeys.splice(index, 1);
      }
    }
  }

  /**
   * Invalidate a segment and all its dependencies
   * Uses breadth-first traversal for better handling of deep trees
   */
  public invalidateTree(segmentId: string): void {
    if (!segmentId) return;

    // Track invalidated segments to prevent cycles
    const invalidated = new Set<string>();

    // Queue for breadth-first traversal
    const queue: string[] = [segmentId];

    // Process queue until empty
    while (queue.length > 0) {
      const id = queue.shift()!;

      // Skip if already invalidated
      if (invalidated.has(id)) continue;

      // Mark as invalidated
      invalidated.add(id);

      // Invalidate this segment
      this.invalidate(id);

      // Add dependencies to queue
      const deps = this.dependencies.get(id);
      if (deps) {
        for (const depId of deps) {
          if (!invalidated.has(depId)) {
            queue.push(depId);
          }
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate,
    };
  }

  /**
   * Clear the cache
   */
  public clear(): void {
    this.cache.clear();
    this.recentKeys.length = 0;
    this.dependencies.clear();
    this.hits = 0;
    this.misses = 0;
    // usedOptions will be automatically cleared as objects are garbage collected
  }
}

// 싱글톤 캐시 인스턴스 (실제 구현에서는 의존성 주입이 더 좋음)
let compileCacheInstance: SegmentCompileCache | null = null;

export function getCompileCacheInstance(): SegmentCompileCache {
  if (!compileCacheInstance) {
    compileCacheInstance = new SegmentCompileCache();
  }
  return compileCacheInstance;
}
