/**
 * NovelAI Integration Service
 * 
 * This service provides integration with the NovelAI website, handling
 * DOM interaction, synchronization, and image generation.
 */

import { ENV, DEV } from "@/config/env";
import { novelAIActions, novelAIState } from "@/state/novelai-state";
import { segmentState } from "@/state/segment-state";
import { compileSegmentTree } from "@/core/compiler/segment-compiler";
import { Segment } from "@/core/segment-model/types";

// Observer configuration
const NOVELAI_OBSERVER_CONFIG = {
  attributes: true,
  childList: true,
  subtree: true,
  characterData: true
};

// Selectors for NovelAI UI elements - cached for performance
const SELECTORS = {
  POSITIVE_PROMPT: ".positive-prompt textarea",
  NEGATIVE_PROMPT: ".negative-prompt textarea",
  CHARACTER_PROMPT: (index: number) => `.character-${index} .positive-prompt textarea`,
  CHARACTER_NEGATIVE: (index: number) => `.character-${index} .negative-prompt textarea`,
  GENERATE_BUTTON: ".generate-button",
  RESOLUTION_SELECT: ".resolution-select",
  ANLAS_BALANCE: ".anlas-balance",
  GENERATION_PROGRESS: ".progress-indicator"
};

// DOM element cache
const elementCache = new Map<string, Element>();

// Timer IDs
const observerTimers: {
  promptSync?: number;
  anlasCheck?: number;
} = {};

// DOM Observers
const observers: {
  promptObserver?: MutationObserver;
  progressObserver?: MutationObserver;
} = {};

// Initialization state tracking
let initializationStarted = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the NovelAI integration service with optimized startup
 */
export async function initNovelAIService(): Promise<void> {
  // Prevent multiple initializations
  if (initializationStarted) {
    return initializationPromise || Promise.resolve();
  }
  
  initializationStarted = true;
  
  initializationPromise = (async () => {
    try {
      if (ENV.IS_DEV) {
        console.log("🎨 Initializing NovelAI integration service");
      }

      // Use Promise.race to speed up UI detection with fast-path resolution
      await Promise.race([
        // Optimized UI detection with progressive enhancement
        detectNovelAIUI(),
        // Fallback timeout (shorter than before)
        new Promise<void>(resolve => {
          setTimeout(() => {
            console.warn("Warning: Timeout waiting for NovelAI UI, proceeding anyway");
            resolve();
          }, 5000); // 5 second timeout (reduced from 10s)
        })
      ]);

      // Set initial connection status
      novelAIActions.setConnectionStatus(true);
      novelAIActions.setAvailability(true);

      // Execute remaining setup tasks in parallel
      await Promise.all([
        setupObserversAsync(),
        setupInitialSyncAsync(),
        setupAnlasChecksAsync()
      ]);

      if (ENV.IS_DEV) {
        console.log("✅ NovelAI integration service initialized");
      }
      
      return;
    } catch (error) {
      console.error("Error initializing NovelAI service:", error);
      novelAIActions.setConnectionStatus(false, error?.toString() || "Failed to initialize NovelAI integration");
      return;
    }
  })();
  
  return initializationPromise;
}

/**
 * Optimized detection of NovelAI UI elements with smart caching
 */
async function detectNovelAIUI(): Promise<void> {
  // Use a progressive enhancement approach with priority queue
  const detectionQueue = [
    // First, try standard selectors (most likely to succeed)
    () => findElements([
      SELECTORS.POSITIVE_PROMPT, 
      SELECTORS.GENERATE_BUTTON
    ], 2),
    
    // Next, try alternative selectors
    () => findElements([
      'textarea[placeholder*="prompt"]',
      'button[aria-label*="generate"]'
    ], 2),
    
    // Finally, try generic fallbacks
    () => findElements([
      'textarea',
      'button'
    ], 1)
  ];
  
  // Process detection queue
  for (const detector of detectionQueue) {
    const foundElements = await detector();
    
    if (foundElements) {
      // Cache the found elements for faster access
      foundElements.forEach((el, selector) => {
        if (el) elementCache.set(selector, el);
      });
      
      // Elements found, exit early
      return;
    }
    
    // Short delay before trying next detection strategy
    await new Promise(r => setTimeout(r, 50));
  }
  
  // No elements found, but we'll continue anyway
  return;
}

/**
 * Smart element finder with batched queries
 */
async function findElements(selectors: string[], minimumRequired: number): Promise<Map<string, Element> | null> {
  return new Promise(resolve => {
    // Use requestAnimationFrame for optimal DOM query timing
    requestAnimationFrame(() => {
      const found = new Map<string, Element>();
      let foundCount = 0;
      
      // Batch all queries in a single reflow
      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector);
          if (element) {
            found.set(selector, element);
            foundCount++;
            
            if (ENV.IS_DEV) {
              DEV.log(`Found NovelAI element for selector: ${selector}`);
            }
          }
        } catch (err) {
          // Ignore selector errors and continue
        }
      }
      
      // Meet minimum threshold to consider detection successful
      resolve(foundCount >= minimumRequired ? found : null);
    });
  });
}

/**
 * Setup mutation observers asynchronously
 */
async function setupObserversAsync(): Promise<void> {
  return new Promise(resolve => {
    // Use requestIdleCallback if available, otherwise use setTimeout
    const callbackFn = () => {
      // Setup prompt observer
      observers.promptObserver = new MutationObserver(handlePromptMutations);
      
      // Find the prompt container with fallbacks
      const promptContainer = 
        document.querySelector('.prompt-container') || 
        document.querySelector(SELECTORS.POSITIVE_PROMPT)?.closest('div') ||
        document.body;
        
      if (promptContainer) {
        observers.promptObserver.observe(promptContainer, NOVELAI_OBSERVER_CONFIG);
      }
      
      // Setup progress observer
      observers.progressObserver = new MutationObserver(handleProgressMutations);
      
      // Find the progress container with fallbacks
      const progressContainer = 
        document.querySelector('.generation-progress') || 
        document.querySelector(SELECTORS.GENERATION_PROGRESS)?.closest('div') ||
        document.body;
        
      if (progressContainer) {
        observers.progressObserver.observe(progressContainer, NOVELAI_OBSERVER_CONFIG);
      }
      
      resolve();
    };
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(callbackFn, { timeout: 1000 });
    } else {
      setTimeout(callbackFn, 0);
    }
  });
}

/**
 * Initialize synchronization asynchronously
 */
async function setupInitialSyncAsync(): Promise<void> {
  return new Promise(resolve => {
    // Execute in next tick to avoid blocking
    setTimeout(() => {
      // Initial sync from NovelAI to NaiKit
      syncFromNovelAI();
      
      // Setup periodic sync with smart timing
      observerTimers.promptSync = window.setInterval(() => {
        const { autoSync, syncDirection } = novelAIState.get();
        
        if (!autoSync) return;
        
        if (syncDirection === 'fromNovelAI' || syncDirection === 'bidirectional') {
          syncFromNovelAI();
        }
        
        if (syncDirection === 'toNovelAI' || syncDirection === 'bidirectional') {
          syncToNovelAI();
        }
      }, 2000); // Sync every 2 seconds
      
      resolve();
    }, 0);
  });
}

/**
 * Setup Anlas checks asynchronously
 */
async function setupAnlasChecksAsync(): Promise<void> {
  return new Promise(resolve => {
    // Execute in next tick to avoid blocking
    setTimeout(() => {
      // Immediately check Anlas
      checkAnlasBalance();
      
      // Setup periodic checks with longer interval (performance optimization)
      observerTimers.anlasCheck = window.setInterval(() => {
        checkAnlasBalance();
      }, 30000); // Check every 30 seconds
      
      resolve();
    }, 0);
  });
}

/**
 * Sync prompt data from NovelAI to NaiKit with improved performance
 */
function syncFromNovelAI(): void {
  try {
    // Set sync status
    novelAIActions.setSyncStatus('syncing');
    
    // Get prompt data from NovelAI with cached elements
    const positive = getElementValue(SELECTORS.POSITIVE_PROMPT) || '';
    const negative = getElementValue(SELECTORS.NEGATIVE_PROMPT) || '';
    
    // Use optimized character prompt fetching
    const characterPrompts = fetchCharacterPrompts();
    
    // Update NovelAI state in one operation
    novelAIActions.updatePromptDataFromNovelAI({
      positive,
      negative,
      characterPositives: characterPrompts.positives,
      characterNegatives: characterPrompts.negatives
    });
    
    // Set sync status to success
    novelAIActions.setSyncStatus('success');
  } catch (error) {
    console.error('Error syncing from NovelAI:', error);
    novelAIActions.setSyncStatus('error');
  }
}

/**
 * Optimized character prompt fetching
 */
function fetchCharacterPrompts(): { positives: Record<number, string>, negatives: Record<number, string> } {
  const characterPositives: Record<number, string> = {};
  const characterNegatives: Record<number, string> = {};
  
  // Look for character prompts (up to 10 characters)
  // Batch process with early exit strategy
  for (let i = 0; i < 10; i++) {
    const charPositive = getElementValue(SELECTORS.CHARACTER_PROMPT(i));
    const charNegative = getElementValue(SELECTORS.CHARACTER_NEGATIVE(i));
    
    // Only store if we found values
    if (charPositive) characterPositives[i] = charPositive;
    if (charNegative) characterNegatives[i] = charNegative;
    
    // Optimization: If we don't find any values for 3 consecutive indexes, stop looking
    if (i > 2 && !charPositive && !charNegative && 
        !characterPositives[i-1] && !characterNegatives[i-1] &&
        !characterPositives[i-2] && !characterNegatives[i-2]) {
      break;
    }
  }
  
  return { positives: characterPositives, negatives: characterNegatives };
}

/**
 * Type-safe version of segment access that handles the DeepReadonlyObject issue
 */
function getSegmentForCompilation(segmentMap: Record<string, unknown>, id: string): Segment | undefined {
  const segment = segmentMap[id];
  if (!segment) return undefined;
  
  // Cast to Segment - we know this is safe in our context
  return segment as Segment;
}

/**
 * Sync prompt data from NaiKit to NovelAI with optimized compilation
 */
function syncToNovelAI(): void {
  try {
    // Set sync status
    novelAIActions.setSyncStatus('syncing');
    
    // Get state
    const state = segmentState.get();
    const { segments, rootSegments } = state;
    
    // Safely access segments for compilation
    const mainPositiveSegment = getSegmentForCompilation(segments, rootSegments.main.positive);
    const mainNegativeSegment = getSegmentForCompilation(segments, rootSegments.main.negative);
    
    // Compile prompts in parallel using promises
    Promise.all([
      compileSegmentIfExists(mainPositiveSegment),
      compileSegmentIfExists(mainNegativeSegment),
      compileCharacterPrompts(segments, rootSegments.characters)
    ])
      .then(results => {
        const [mainPositive, mainNegative, characterPrompts] = results;
        
        // Batch DOM updates together using microtask queue
        queueMicrotask(() => {
          // Set main prompts - safely coerce to string
          setElementValue(SELECTORS.POSITIVE_PROMPT, String(mainPositive || ''));
          setElementValue(SELECTORS.NEGATIVE_PROMPT, String(mainNegative || ''));
          
          // Set character prompts
          Object.entries(characterPrompts).forEach(([indexStr, character]) => {
            const index = parseInt(indexStr);
            
            if (character.positive) {
              setElementValue(SELECTORS.CHARACTER_PROMPT(index), character.positive);
            }
            
            if (character.negative) {
              setElementValue(SELECTORS.CHARACTER_NEGATIVE(index), character.negative);
            }
          });
          
          // Update state with success
          novelAIActions.setSyncStatus('success');
        });
      })
      .catch(error => {
        console.error('Error in prompt compilation:', error);
        novelAIActions.setSyncStatus('error');
      });
  } catch (error) {
    console.error('Error syncing to NovelAI:', error);
    novelAIActions.setSyncStatus('error');
  }
}

/**
 * Compile segment if it exists
 */
function compileSegmentIfExists(segment: Segment | undefined): Promise<string> {
  return new Promise(resolve => {
    if (!segment) {
      resolve('');
      return;
    }
    
    try {
      const result = compileSegmentTree(segment);
      resolve(result);
    } catch (error) {
      console.error('Error compiling segment:', error);
      resolve('');
    }
  });
}

/**
 * Type for character prompt compilation result
 */
interface CharacterPromptCompilationResult {
  [index: string]: {
    positive?: string;
    negative?: string;
  }
}

/**
 * Compile character prompts in parallel
 */
function compileCharacterPrompts(
  segments: Record<string, unknown>, 
  characters: Record<string, { positive: string; negative: string }>
): Promise<CharacterPromptCompilationResult> {
  return new Promise(resolve => {
    const result: CharacterPromptCompilationResult = {};
    const promises: Promise<void>[] = [];
    
    Object.entries(characters).forEach(([indexStr, character]) => {
      result[indexStr] = {};
      
      const positiveSegment = getSegmentForCompilation(segments, character.positive);
      const negativeSegment = getSegmentForCompilation(segments, character.negative);
      
      if (positiveSegment) {
        promises.push(
          compileSegmentIfExists(positiveSegment)
            .then(compiled => {
              result[indexStr].positive = compiled;
            })
        );
      }
      
      if (negativeSegment) {
        promises.push(
          compileSegmentIfExists(negativeSegment)
            .then(compiled => {
              result[indexStr].negative = compiled;
            })
        );
      }
    });
    
    Promise.all(promises)
      .then(() => resolve(result))
      .catch(error => {
        console.error('Error compiling character prompts:', error);
        resolve(result);
      });
  });
}

/**
 * Check and update Anlas balance with optimized element access
 */
function checkAnlasBalance(): void {
  try {
    // Use cached element or query and cache
    let anlasElement = elementCache.get(SELECTORS.ANLAS_BALANCE);
    if (!anlasElement) {
      const queriedElement = document.querySelector(SELECTORS.ANLAS_BALANCE);
      if (queriedElement) {
        anlasElement = queriedElement;
        elementCache.set(SELECTORS.ANLAS_BALANCE, queriedElement);
      }
    }
    
    if (anlasElement) {
      const anlasText = anlasElement.textContent || '';
      const anlasMatch = anlasText.match(/(\d+(\.\d+)?)/);
      
      if (anlasMatch && anlasMatch[1]) {
        const balance = parseFloat(anlasMatch[1]);
        
        // Calculate cost only if balance changed
        const prevState = novelAIState.get();
        if (prevState.anlasInfo.balance !== balance) {
          // Update Anlas info
          novelAIActions.updateAnlasInfo({
            balance,
            estimatedCost: calculateAnlasCost()
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking Anlas balance:', error);
  }
}

/**
 * Calculate estimated Anlas cost based on current parameters
 * (Memoized for performance)
 */
const calculateAnlasCost = (() => {
  let lastParams: string = '';
  let lastResult: number = 0;
  
  return function(): number {
    try {
      const { parameters } = novelAIState.get();
      const { width, height, steps, batchSize } = parameters;
      
      // Create a key for memoization
      const paramsKey = `${width},${height},${steps},${batchSize}`;
      
      // If params unchanged, return cached result
      if (paramsKey === lastParams) {
        return lastResult;
      }
      
      // Base cost calculation (simplified)
      const pixelCount = width * height;
      const baseCost = (pixelCount / (512 * 512)) * 0.2;
      
      // Adjust for steps
      const stepCost = (steps / 28) * baseCost;
      
      // Total cost with batch size
      lastParams = paramsKey;
      lastResult = stepCost * batchSize;
      
      return lastResult;
    } catch (error) {
      console.error('Error calculating Anlas cost:', error);
      return 0;
    }
  };
})();

// Optimized debounce implementation
function createDebouncer(ms: number): (callback: () => void) => void {
  let timer: number | null = null;
  return (callback: () => void) => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      callback();
      timer = null;
    }, ms) as unknown as number;
  };
}

// Prompt mutations debouncer
const debouncePromptSync = createDebouncer(500);

/**
 * Handle mutations in the prompt elements with optimized debouncing
 */
function handlePromptMutations(mutations: MutationRecord[]): void {
  // Skip processing if no mutations affect text content or value
  if (!mutations.some(isRelevantMutation)) return;
  
  // Check if we need to sync
  const { autoSync, syncDirection } = novelAIState.get();
  
  if (!autoSync || syncDirection === 'toNovelAI') {
    return; // Don't sync from NovelAI to NaiKit
  }
  
  // Debounce the sync
  debouncePromptSync(() => syncFromNovelAI());
}

/**
 * Check if a mutation is relevant for prompt updates
 */
function isRelevantMutation(mutation: MutationRecord): boolean {
  // Only care about character data or child list changes
  if (mutation.type !== 'characterData' && mutation.type !== 'childList') {
    return false;
  }
  
  // Check if affecting a text node or element that could be part of a prompt
  const targetNode = mutation.target;
  if (targetNode.nodeType === Node.TEXT_NODE) {
    return true; // Text content changes are likely relevant
  }
  
  // Check if target or parent might be a textarea
  const element = targetNode as Element;
  return (
    element.tagName === 'TEXTAREA' || 
    element.closest('textarea') !== null ||
    element.closest('.prompt') !== null
  );
}

/**
 * Handle mutations in the progress indicator with optimized parsing
 */
function handleProgressMutations(mutations: MutationRecord[]): void {
  try {
    // Skip processing if no relevant mutations
    if (!mutations.some(isGenerationMutation)) return;
    
    // Look for progress changes using cached element or query and cache
    let progressElement = elementCache.get(SELECTORS.GENERATION_PROGRESS);
    if (!progressElement) {
      const queriedElement = document.querySelector(SELECTORS.GENERATION_PROGRESS);
      if (queriedElement) {
        progressElement = queriedElement;
        elementCache.set(SELECTORS.GENERATION_PROGRESS, queriedElement);
      }
    }
    
    if (!progressElement) return;
    
    // Check if generation is in progress
    const isGenerating = progressElement.classList.contains('active');
    
    // If generation status changed
    const { generationStatus } = novelAIState.get();
    if (generationStatus.isGenerating !== isGenerating) {
      novelAIActions.updateGenerationStatus({
        isGenerating
      });
    }
    
    // Only parse progress text if generating (performance optimization)
    if (isGenerating) {
      // Look for progress text using regex cache
      const progressText = progressElement.textContent || '';
      
      // Use cached RegExp instance
      const PROGRESS_REGEX = /Step (\d+)\/(\d+)/;
      const progressMatch = PROGRESS_REGEX.exec(progressText);
      
      if (progressMatch && progressMatch[1] && progressMatch[2]) {
        const currentStep = parseInt(progressMatch[1]);
        const totalSteps = parseInt(progressMatch[2]);
        
        // Only update if progress changed
        const progress = Math.round((currentStep / totalSteps) * 100);
        if (generationStatus.progress !== progress) {
          // Calculate remaining time only if needed
          novelAIActions.updateGenerationStatus({
            progress,
            estimatedTimeRemaining: calculateRemainingTime(currentStep, totalSteps)
          });
        }
      }
    }
  } catch (error) {
    console.error('Error handling progress mutations:', error);
  }
}

/**
 * Check if a mutation is relevant for generation status
 */
function isGenerationMutation(mutation: MutationRecord): boolean {
  // Check for class changes that might indicate generation status
  if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
    return true;
  }
  
  // Check for text content changes that might include progress info
  if (mutation.type === 'characterData' || mutation.type === 'childList') {
    const targetText = mutation.target.textContent || '';
    return targetText.includes('Step ') || targetText.includes('Generating');
  }
  
  return false;
}

/**
 * Calculate remaining time based on steps with memoization
 */
const calculateRemainingTime = (() => {
  let lastParams: string = '';
  let lastResult: number = 0;
  
  return function(currentStep: number, totalSteps: number): number {
    // Create a key for memoization
    const { parameters } = novelAIState.get();
    const { width, height } = parameters;
    const paramsKey = `${currentStep},${totalSteps},${width},${height}`;
    
    // If params unchanged, return cached result
    if (paramsKey === lastParams) {
      return lastResult;
    }
    
    // Base time per step (seconds)
    const baseTimePerStep = 1;
    
    // Adjust for resolution
    const resolutionFactor = (width * height) / (512 * 512);
    
    // Time per step
    const timePerStep = baseTimePerStep * resolutionFactor;
    
    // Remaining time - cache result
    lastParams = paramsKey;
    lastResult = (totalSteps - currentStep) * timePerStep;
    
    return lastResult;
  };
})();

// Element access cache with fast lookup
const elementValueCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL = 1000; // 1 second TTL for element values

/**
 * Get value from a DOM element with caching
 */
function getElementValue(selector: string): string | null {
  try {
    // Check cache first
    const now = Date.now();
    const cached = elementValueCache.get(selector);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }
    
    // Use cached element or query and cache
    let element = elementCache.get(selector);
    if (!element) {
      const queriedElement = document.querySelector(selector);
      if (queriedElement) {
        element = queriedElement;
        elementCache.set(selector, queriedElement);
      }
    }
    
    // Extract value and cache it
    let value: string | null = null;
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      value = element.value;
      elementValueCache.set(selector, { value, timestamp: now });
    }
    
    return value;
  } catch (error) {
    console.error(`Error getting element value for ${selector}:`, error);
    return null;
  }
}

/**
 * Set value in a DOM element and trigger input event with optimized event handling
 */
function setElementValue(selector: string, value: string): void {
  try {
    // Skip if value hasn't changed
    const currentValue = getElementValue(selector);
    if (currentValue === value) return;
    
    // Use cached element or query and cache
    let element = elementCache.get(selector);
    if (!element) {
      const queriedElement = document.querySelector(selector);
      if (queriedElement) {
        element = queriedElement;
        elementCache.set(selector, queriedElement);
      }
    }
    
    if (element && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      element.value = value;
      
      // Update cache
      elementValueCache.set(selector, { value, timestamp: Date.now() });
      
      // Dispatch input event to trigger NovelAI's internal handlers
      // Create event only once and reuse
      const event = new Event('input', { bubbles: true });
      element.dispatchEvent(event);
    }
  } catch (error) {
    console.error(`Error setting element value for ${selector}:`, error);
  }
}

/**
 * Generate image using NovelAI with cached element access
 */
export function generateImage(): void {
  try {
    // Check if we can generate
    const { isConnected, isAvailable } = novelAIState.get();
    const { isGenerating } = novelAIState.get().generationStatus;
    
    if (!isConnected || !isAvailable || isGenerating) {
      console.warn('Cannot generate image: not connected, not available, or already generating');
      return;
    }
    
    // Start generation
    novelAIActions.startGeneration();
    
    // Use cached element or query and cache
    let generateButton = elementCache.get(SELECTORS.GENERATE_BUTTON);
    if (!generateButton) {
      const queriedElement = document.querySelector(SELECTORS.GENERATE_BUTTON);
      if (queriedElement) {
        generateButton = queriedElement;
        elementCache.set(SELECTORS.GENERATE_BUTTON, queriedElement);
      }
    }
    
    if (generateButton && generateButton instanceof HTMLElement) {
      generateButton.click();
    } else {
      throw new Error('Generate button not found');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    novelAIActions.stopGeneration();
  }
}

/**
 * Clean up NovelAI service with complete resource release
 */
export function cleanupNovelAIService(): void {
  // Clear all interval timers
  Object.values(observerTimers).forEach(timerId => {
    if (timerId) clearInterval(timerId);
  });
  
  // Reset timer references
  Object.keys(observerTimers).forEach(key => {
    observerTimers[key as keyof typeof observerTimers] = undefined;
  });
  
  // Disconnect observers
  Object.values(observers).forEach(observer => {
    if (observer) observer.disconnect();
  });
  
  // Clear element caches
  elementCache.clear();
  elementValueCache.clear();
  
  // Reset initialization state
  initializationStarted = false;
  initializationPromise = null;
}