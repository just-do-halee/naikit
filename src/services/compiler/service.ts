/**
 * Compiler Service Utility
 *
 * A set of wrapper functions around the compiler module to provide
 * consistent error handling, logging, and performance monitoring.
 */

import {
  parseNovelAIPrompt,
  compileSegmentTree,
  CompileOptions,
} from "@/core/compiler";
import { Segment } from "@/core/segment-model/types";

/**
 * Result interface for compiler operations
 */
interface CompilerResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
}

/**
 * Service to safely interact with the compiler functionality
 */
export const CompilerService = {
  /**
   * Parse text into a segment tree with error handling
   *
   * @param text The prompt text to parse
   * @returns Result containing success status and either segment data or error
   */
  parsePrompt(text: string): CompilerResult<Segment> {
    const startTime = performance.now();

    try {
      if (!text || typeof text !== "string") {
        return {
          success: false,
          error: "Invalid input: text must be a non-empty string",
          duration: 0,
        };
      }

      const rootSegment = parseNovelAIPrompt(text);
      const duration = performance.now() - startTime;

      console.log(`[CompilerService] Parsed prompt (${duration.toFixed(2)}ms)`);

      return {
        success: true,
        data: rootSegment,
        duration,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error("[CompilerService] Error parsing prompt:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
  },

  /**
   * Compile a segment tree back to text with error handling
   *
   * @param segment The segment tree to compile
   * @param options Compilation options
   * @returns Result containing success status and either compiled text or error
   */
  compileSegment(
    segment: Segment,
    options?: CompileOptions
  ): CompilerResult<string> {
    const startTime = performance.now();

    try {
      if (!segment || typeof segment !== "object" || !segment.type) {
        return {
          success: false,
          error: "Invalid input: segment must be a valid Segment object",
          duration: 0,
        };
      }

      const compiled = compileSegmentTree(segment, options);
      const duration = performance.now() - startTime;

      console.log(
        `[CompilerService] Compiled segment (${duration.toFixed(2)}ms)`
      );

      return {
        success: true,
        data: compiled,
        duration,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error("[CompilerService] Error compiling segment:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
  },

  /**
   * End-to-end process: parse text and then compile it back
   * Useful for validation or transformation with specific options
   *
   * @param text The prompt text to process
   * @param options Compilation options
   * @returns Result containing success status and processed data or error
   */
  processPrompt(
    text: string,
    options?: CompileOptions
  ): CompilerResult<{
    parsed: Segment;
    compiled: string;
  }> {
    const startTime = performance.now();

    try {
      // First parse the text
      const parseResult = this.parsePrompt(text);
      if (!parseResult.success || !parseResult.data) {
        return {
          success: false,
          error: parseResult.error || "Unknown parsing error",
          duration: parseResult.duration,
        };
      }

      // Then compile the segment
      const compileResult = this.compileSegment(parseResult.data, options);
      if (!compileResult.success || !compileResult.data) {
        return {
          success: false,
          error: compileResult.error || "Unknown compilation error",
          duration: (parseResult.duration || 0) + (compileResult.duration || 0),
        };
      }

      const totalDuration = performance.now() - startTime;

      return {
        success: true,
        data: {
          parsed: parseResult.data,
          compiled: compileResult.data,
        },
        duration: totalDuration,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error("[CompilerService] Error in end-to-end processing:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
  },

  /**
   * Count segments in a segment tree (for debugging/metrics)
   *
   * @param segment The root segment
   * @returns The total number of segments in the tree
   */
  countSegments(segment: Segment): number {
    try {
      let count = 1; // Count the current segment

      if (segment.children && segment.children.length > 0) {
        segment.children.forEach((child) => {
          count += this.countSegments(child);
        });
      }

      return count;
    } catch (error) {
      console.error("[CompilerService] Error counting segments:", error);
      return 0;
    }
  },
};

export default CompilerService;
