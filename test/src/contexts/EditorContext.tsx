import React, { createContext, useContext, useState, useCallback } from 'react';
import { BracketType } from '@main/src/modules/segment-model/types';

interface EditorContextType {
  // Selection state
  selectedSegments: string[];
  toggleSegmentSelection: (segmentId: string) => void;
  clearSelection: () => void;
  isSelected: (segmentId: string) => boolean;
  
  // Active segment state (for finetune mode)
  activeSegmentId: string | null;
  setActiveSegment: (segmentId: string | null) => void;
  
  // Segment creation state
  promptType: 'positive' | 'negative';
  setPromptType: (type: 'positive' | 'negative') => void;
  
  // New segment parameters
  newTextContent: string;
  setNewTextContent: (content: string) => void;
  
  newInlineOptions: string;
  setNewInlineOptions: (options: string) => void;
  
  newPresetName: string;
  setNewPresetName: (name: string) => void;
  
  newPresetMode: 'random' | 'fixed';
  setNewPresetMode: (mode: 'random' | 'fixed') => void;
  
  newPresetSelected: string;
  setNewPresetSelected: (selected: string) => void;
  
  newPresetValues: string;
  setNewPresetValues: (values: string) => void;
  
  bracketLevel: number;
  setBracketLevel: (level: number) => void;
  
  bracketType: BracketType;
  setBracketType: (type: BracketType) => void;
  
  importText: string;
  setImportText: (text: string) => void;
  
  // Group management
  newGroupName: string;
  setNewGroupName: (name: string) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Selection state
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  
  // Segment creation parameters
  const [promptType, setPromptType] = useState<'positive' | 'negative'>('positive');
  const [newTextContent, setNewTextContent] = useState('');
  const [newInlineOptions, setNewInlineOptions] = useState('');
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetMode, setNewPresetMode] = useState<'random' | 'fixed'>('random');
  const [newPresetSelected, setNewPresetSelected] = useState('');
  const [newPresetValues, setNewPresetValues] = useState('');
  const [bracketLevel, setBracketLevel] = useState(1);
  const [bracketType, setBracketType] = useState<BracketType>('increase');
  const [importText, setImportText] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  
  const toggleSegmentSelection = useCallback((segmentId: string) => {
    setSelectedSegments(prev => 
      prev.includes(segmentId)
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedSegments([]);
  }, []);
  
  const isSelected = useCallback((segmentId: string) => {
    return selectedSegments.includes(segmentId);
  }, [selectedSegments]);
  
  const setActiveSegment = useCallback((segmentId: string | null) => {
    setActiveSegmentId(segmentId);
  }, []);
  
  const value = {
    selectedSegments,
    toggleSegmentSelection,
    clearSelection,
    isSelected,
    activeSegmentId,
    setActiveSegment,
    promptType,
    setPromptType,
    newTextContent,
    setNewTextContent,
    newInlineOptions,
    setNewInlineOptions,
    newPresetName,
    setNewPresetName,
    newPresetMode,
    setNewPresetMode,
    newPresetSelected,
    setNewPresetSelected,
    newPresetValues,
    setNewPresetValues,
    bracketLevel,
    setBracketLevel,
    bracketType,
    setBracketType,
    importText,
    setImportText,
    newGroupName,
    setNewGroupName,
  };
  
  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};