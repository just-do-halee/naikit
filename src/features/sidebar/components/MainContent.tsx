import React from "react";
import { useRootSegmentsReactive } from "@/state/react-bindings";
import { PromptSection } from "./PromptSection";
import { CharacterSection } from "./CharacterSection";
import { isObject, hasProperty, safeGet } from "@/shared/utils/type-safety";

/**
 * Type guard for Main property structure
 */
function isValidMain(data: unknown): data is { positive: string; negative: string } {
  if (!isObject(data)) return false;
  
  return (
    hasProperty(data, 'positive') &&
    hasProperty(data, 'negative') &&
    typeof data.positive === 'string' &&
    typeof data.negative === 'string'
  );
}

/**
 * Main Content Component
 * 
 * Container for all prompt sections including main prompts and character sections.
 */
export const MainContent: React.FC = () => {
  const rootSegmentsData = useRootSegmentsReactive();
  
  // Safely extract main data using type guards
  const mainData = safeGet(rootSegmentsData, 'main');
  const main = isValidMain(mainData) 
    ? mainData 
    : { positive: null, negative: null };
  
  return (
    <div className="main-content p-3">
      {/* Main Prompts */}
      <div className="main-prompts mb-4">
        <PromptSection
          title="Main Positive Prompt"
          segmentId={main.positive}
          type="positive"
        />
        
        <PromptSection
          title="Main Negative Prompt"
          segmentId={main.negative}
          type="negative"
        />
      </div>
      
      {/* Character Prompts */}
      <CharacterSection />
      
      {/* Parameter Settings Section - Will be implemented in the future */}
      <div className="parameter-settings border-t border-gray-700 pt-3 mt-3">
        <h2 className="text-lg font-medium mb-2">Generation Settings</h2>
        <div className="text-gray-400 text-sm text-center py-2">
          Generation settings will be implemented in a future update.
        </div>
      </div>
    </div>
  );
};