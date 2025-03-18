import React, { useState } from "react";
import { PresetSegment as PresetSegmentType } from "@/core/segment-model/types";
import BaseSegment from "./BaseSegment";
import { useActiveModeReactive, useSegmentOperations } from "@/state/react-bindings";

interface PresetSegmentProps {
  segment: PresetSegmentType;
  isNested?: boolean;
}

/**
 * Preset Segment Component
 * 
 * Renders a preset segment with the following features:
 * - Different display for wildcards (random) and keywords (fixed)
 * - Color coding based on preset type
 * - Dropdown for selecting values in fine-tune mode
 */
export const PresetSegment: React.FC<PresetSegmentProps> = ({
  segment,
  isNested = false
}) => {
  const { name, mode, selected, metadata } = segment;
  const [activeMode, _isLoading, _error] = useActiveModeReactive();
  const { updateSegment } = useSegmentOperations();
  
  // Local state for dropdown
  const [isOpen, setIsOpen] = useState(false);
  
  // Get preset color or use default
  const presetColor = metadata?.color || (mode === "random" ? "#3A86FF" : "#FF9E44");
  
  // Get preset values or empty array
  const presetValues = (metadata?.values as string[]) || [];
  
  // Handle value selection
  const handleSelectValue = (value: string) => {
    updateSegment<PresetSegmentType>(segment.id, {
      selected: value,
      mode: "fixed" // Switch to fixed mode when a value is selected
    });
    setIsOpen(false);
  };
  
  // Toggle dropdown
  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  // In fine-tune mode, show more details and controls
  if (activeMode === "finetune" && activeMode !== null) {
    return (
      <BaseSegment segment={segment} isNested={isNested}>
        <div 
          className="preset-segment relative rounded px-2 py-1 my-1"
          style={{ 
            backgroundColor: `${presetColor}20`, // Use color with 20% opacity
            borderLeft: `3px solid ${presetColor}`
          }}
        >
          <div className="preset-header flex items-center justify-between">
            <div className="preset-info">
              <span className="preset-name font-medium text-sm">{name}</span>
              <span className="preset-mode ml-2 text-xs opacity-75">
                {mode === "random" ? "Wildcard" : "Keyword"}
              </span>
            </div>
            
            <button 
              className="preset-toggle text-xs p-1 rounded hover:bg-black hover:bg-opacity-20"
              onClick={handleToggleDropdown}
            >
              {mode === "random" ? "Random" : selected || "Select..."}
              <span className="ml-1">{isOpen ? "▲" : "▼"}</span>
            </button>
          </div>
          
          {/* Dropdown for value selection */}
          {isOpen && (
            <div className="preset-dropdown absolute z-10 mt-1 right-0 w-48 bg-gray-800 border border-gray-700 rounded shadow-lg">
              <div className="py-1">
                {mode === "fixed" && (
                  <button 
                    className="w-full text-left px-3 py-1 text-sm hover:bg-gray-700"
                    onClick={() => {
                      updateSegment<PresetSegmentType>(segment.id, { mode: "random" });
                      setIsOpen(false);
                    }}
                  >
                    Use as Wildcard (Random)
                  </button>
                )}
                
                {presetValues.map((value, index) => (
                  <button 
                    key={`${value}-${index}`}
                    className={`w-full text-left px-3 py-1 text-sm ${selected === value ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
                    onClick={() => handleSelectValue(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </BaseSegment>
    );
  }
  
  // In compose mode, show simpler display
  return (
    <BaseSegment segment={segment} isNested={isNested}>
      <div 
        className="preset-segment-compose rounded px-2 py-1 my-1"
        style={{ 
          backgroundColor: `${presetColor}10`, // Use color with 10% opacity
          borderLeft: `2px solid ${presetColor}`
        }}
      >
        {mode === "random" ? (
          <span className="preset-wildcard text-sm">
            <span className="text-opacity-75 text-white">!</span>{name}
          </span>
        ) : (
          <span className="preset-keyword text-sm">
            {selected || name}
          </span>
        )}
      </div>
    </BaseSegment>
  );
};

export default PresetSegment;