import React, { useState } from "react";
import { useRootSegmentsReactive, useCharacterOperations } from "@/state/react-bindings";
import { PromptSection } from "./PromptSection";
import { isObject, safeGet } from "@/shared/utils/type-safety";

/**
 * Type guard for Characters structure
 */
function isValidCharacters(
  data: unknown
): data is Record<number, { positive: string; negative: string }> {
  if (!isObject(data)) return false;
  
  // Check if the structure looks like a record object
  // This is a simplified check that could be more robust in production
  return true;
}

/**
 * Character Prompts Section Component
 * 
 * Container for all character-specific prompts with add/remove functionality.
 */
export const CharacterSection: React.FC = () => {
  const rootSegmentsData = useRootSegmentsReactive();
  const { addCharacter, removeCharacter } = useCharacterOperations();
  
  // Safely extract character data using type guards
  const charactersData = safeGet(rootSegmentsData, 'characters');
  const characters = isValidCharacters(charactersData) 
    ? charactersData 
    : {};
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Get all character indices as numbers
  const characterIndices = Object.keys(characters).map(Number).sort((a, b) => a - b);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleAddCharacter = () => {
    addCharacter();
  };
  
  const handleRemoveCharacter = (index: number) => {
    removeCharacter(index);
  };

  return (
    <div className="character-section mb-4">
      <div 
        className="section-header flex justify-between items-center p-2 bg-gray-800 rounded cursor-pointer"
        onClick={toggleExpand}
      >
        <div className="flex items-center">
          <span className="mr-2">{isExpanded ? '▼' : '►'}</span>
          <h2 className="font-medium">Character Prompts</h2>
          <span className="ml-2 text-sm text-gray-400">({characterIndices.length})</span>
        </div>
        <button
          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
          onClick={(e) => {
            e.stopPropagation();
            handleAddCharacter();
          }}
        >
          Add Character
        </button>
      </div>
      
      {isExpanded && (
        <div className="character-list p-2">
          {characterIndices.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No characters added yet. Click "Add Character" to create one.
            </div>
          ) : (
            characterIndices.map((index) => (
              <CharacterPrompt 
                key={index}
                index={index} 
                characterData={characters[index]}
                onRemove={() => handleRemoveCharacter(index)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface CharacterPromptProps {
  index: number;
  characterData: {
    positive: string;
    negative: string;
  };
  onRemove: () => void;
}

/**
 * Individual Character Prompt Component
 * 
 * Shows positive and negative prompts for a single character.
 */
const CharacterPrompt: React.FC<CharacterPromptProps> = ({ 
  index, 
  characterData,
  onRemove
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="character-prompt mb-3 border border-gray-700 rounded overflow-hidden">
      <div className="character-header flex justify-between items-center p-2 bg-gray-700">
        <div 
          className="flex items-center cursor-pointer"
          onClick={toggleExpand}
        >
          <span className="mr-2">{isExpanded ? '▼' : '►'}</span>
          <h3 className="font-medium">Character {index}</h3>
        </div>
        <button
          className="text-gray-300 hover:text-red-400"
          onClick={onRemove}
          title="Remove character"
        >
          <TrashIcon />
        </button>
      </div>
      
      {isExpanded && (
        <div className="character-content p-2">
          <PromptSection
            title="Positive"
            segmentId={characterData.positive}
            type="positive"
            characterIndex={index}
          />
          <PromptSection
            title="Negative"
            segmentId={characterData.negative}
            type="negative"
            characterIndex={index}
          />
        </div>
      )}
    </div>
  );
};

// Simple trash icon component
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);