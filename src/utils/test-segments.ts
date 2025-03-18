/**
 * Test Segment Utilities
 * 
 * This file provides utilities for creating test segments for development and testing.
 */

import { segmentActions } from "@/state/segment-state";

/**
 * Initialize test segments for a given root segment ID
 * Creates a rich segment tree with examples of all segment types
 */
export function initializeTestSegments(rootSegmentId: string) {
  // Create test segments
  const textSegment1Id = segmentActions.createTextSegment("This is a ");
  const textSegment2Id = segmentActions.createTextSegment(" with ");
  const textSegment3Id = segmentActions.createTextSegment(" features.");
  
  // Create preset (wildcard)
  const wildcardId = segmentActions.createPresetSegment(
    "art_style", 
    "random",
    undefined,
    ["digital art", "oil painting", "watercolor", "pencil sketch", "concept art"]
  );
  
  // Create preset (keyword)
  const keywordId = segmentActions.createPresetSegment(
    "quality", 
    "fixed",
    "masterpiece",
    ["masterpiece", "high quality", "best quality", "extremely detailed"]
  );
  
  // Create inline wildcard
  const inlineWildcardId = segmentActions.createInlineWildcardSegment([
    "advanced", 
    "interesting", 
    "stunning", 
    "complex"
  ]);
  
  // Create nested weighted segments
  const innerWeightedId = segmentActions.createWeightedSegment(
    [inlineWildcardId], 
    "increase", 
    2
  );
  
  const outerWeightedId = segmentActions.createWeightedSegment(
    [textSegment2Id, innerWeightedId, textSegment3Id], 
    "increase", 
    1
  );
  
  const negativeWeightedId = segmentActions.createWeightedSegment(
    [segmentActions.createTextSegment("low quality")], 
    "decrease", 
    2
  );
  
  // Build the segment tree by adding children to the root
  segmentActions.addChildToSegment(rootSegmentId, textSegment1Id);
  segmentActions.addChildToSegment(rootSegmentId, wildcardId);
  segmentActions.addChildToSegment(rootSegmentId, outerWeightedId);
  segmentActions.addChildToSegment(rootSegmentId, keywordId);
  
  // Add an example negative segment if this is the negative root
  if (rootSegmentId.includes("negative")) {
    segmentActions.addChildToSegment(rootSegmentId, negativeWeightedId);
  }
  
  return rootSegmentId;
}

/**
 * Initialize simpler test segments for a given root segment ID
 */
export function initializeSimpleTestSegments(rootSegmentId: string) {
  // Create basic segments
  const textId = segmentActions.createTextSegment(
    "This is a simple test prompt with basic segments for testing."
  );
  
  // Add to root
  segmentActions.addChildToSegment(rootSegmentId, textId);
  
  return rootSegmentId;
}