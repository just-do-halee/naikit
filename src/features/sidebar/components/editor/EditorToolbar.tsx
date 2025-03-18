import React, { useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
  useSegmentState, 
  Preset,
  usePresetOperations, 
  useGroupOperations, 
  useGroupsExtended 
} from '../../../../state/segment-react-bindings';
import { useOnClickOutside } from '../../../../shared/utils';
import PresetManager from './PresetManager';
import GroupManager from './GroupManager';

interface EditorToolbarProps {
  editor: Editor | null;
  onCreateWeightedSegment?: () => void;
  onCreatePresetSegment?: (presetName: string, presetType: 'wildcard' | 'keyword', keywordValue?: string) => void;
  onCreateInlineWildcard?: (options: string[]) => void;
  presets?: Preset[]; // Add presets prop
  selectedSegmentIds?: string[]; // Add selected segments prop
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  editor, 
  onCreateWeightedSegment,
  onCreatePresetSegment,
  onCreateInlineWildcard,
  presets = [], // Default to empty array
  selectedSegmentIds = [], // Default to empty array
}) => {
  // Get the active mode from the segment state
  const state = useSegmentState();
  const mode = state?.activeMode || 'compose';
  const { addPreset, updatePreset, deletePreset } = usePresetOperations();
  const groups = useGroupsExtended();
  const { 
    createGroup, 
    updateGroup, 
    deleteGroup, 
    addSegmentsToGroup, 
    removeSegmentsFromGroup 
  } = useGroupOperations();
  
  // State for dropdown and modal management
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const [inlineOptions, setInlineOptions] = useState('');
  const [isInlineModalOpen, setIsInlineModalOpen] = useState(false);
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [customWeight, setCustomWeight] = useState(1.1);
  
  // Refs for click outside detection
  const presetMenuRef = useRef<HTMLDivElement>(null);
  const inlineModalRef = useRef<HTMLDivElement>(null);
  const weightModalRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useOnClickOutside(presetMenuRef, () => setIsPresetMenuOpen(false));
  useOnClickOutside(inlineModalRef, () => setIsInlineModalOpen(false));
  useOnClickOutside(weightModalRef, () => setWeightModalOpen(false));
  
  // Mock presets for demo if none provided
  const availablePresets = presets.length > 0 
    ? presets 
    : [
        { id: '1', name: 'Character', category: 'CHARACTER', type: 'wildcard' as const },
        { id: '2', name: 'Scene', category: 'SCENE', type: 'wildcard' as const },
        { id: '3', name: 'Style', category: 'STYLE', type: 'wildcard' as const },
        { id: '4', name: 'Background', category: 'SCENE', type: 'wildcard' as const },
        { id: '5', name: 'Lighting', category: 'STYLE', type: 'wildcard' as const },
        { id: '6', name: 'Character_pose', category: 'CHARACTER', type: 'keyword' as const, keywordValue: 'standing' },
      ];
  
  // Filtered presets based on search and category
  const filteredPresets = availablePresets.filter(preset => 
    (preset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     preset.category.toLowerCase().includes(searchQuery.toLowerCase())) && 
    (categoryFilter === '' || preset.category === categoryFilter)
  );
  
  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(availablePresets.map(p => p.category)));
  
  if (!editor) {
    return null;
  }

  // Handler for adding a weighted segment
  const handleAddWeight = () => {
    if (weightModalOpen) {
      // Apply the custom weight
      const { from, to } = editor.state.selection;
      if (from !== to && onCreateWeightedSegment) {
        // Here we'd normally get the weight from user input
        editor.commands.setWeightedSegment({ 
          weight: customWeight, 
          bracketType: customWeight >= 1 ? 'curly' : 'square' 
        });
      }
      setWeightModalOpen(false);
    } else {
      // Open the weight selection modal
      setWeightModalOpen(true);
    }
  };

  // Handler for custom weight adjustment
  const handleSetCustomWeight = (weight: number) => {
    setCustomWeight(weight);
  };

  // Handler for adding a preset segment
  const handleAddPreset = (preset: Preset) => {
    if (onCreatePresetSegment) {
      onCreatePresetSegment(
        preset.name, 
        preset.type, 
        preset.type === 'keyword' ? preset.keywordValue : undefined
      );
      setIsPresetMenuOpen(false);
    }
  };

  // Handler for adding an inline wildcard
  const handleAddInlineWildcard = () => {
    if (inlineOptions && onCreateInlineWildcard) {
      // Split by pipes or commas and trim each option
      const options = inlineOptions
        .split(/[|,]/)
        .map(option => option.trim())
        .filter(option => option);
      
      if (options.length > 0) {
        onCreateInlineWildcard(options);
        setInlineOptions('');
        setIsInlineModalOpen(false);
      }
    }
  };

  // We'll show different toolbars based on the mode
  return (
    <div className="editor-toolbar flex items-center p-2 bg-gray-50 text-gray-500 border-b border-gray-200">
      {/* Preset Manager Modal */}
      {showPresetManager && (
        <PresetManager 
          presets={availablePresets}
          onClose={() => setShowPresetManager(false)}
          onAddPreset={addPreset}
          onUpdatePreset={updatePreset}
          onDeletePreset={deletePreset}
        />
      )}
      
      {/* Group Manager Modal */}
      {showGroupManager && (
        <GroupManager 
          groups={groups}
          segmentIds={selectedSegmentIds}
          onClose={() => setShowGroupManager(false)}
          onCreateGroup={createGroup}
          onUpdateGroup={updateGroup}
          onDeleteGroup={deleteGroup}
          onAddSegmentsToGroup={addSegmentsToGroup}
          onRemoveSegmentsFromGroup={removeSegmentsFromGroup}
        />
      )}
      
      {mode === 'compose' ? (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`toolbar-btn flex items-center justify-center w-8 h-8 rounded ${
              editor.isActive('bold') 
                ? 'bg-gray-200 text-blue-500' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Bold"
          >
            <span className="sr-only">Bold</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="fill-current">
              <path d="M8 11h4.5a2.5 2.5 0 0 0 0-5H8v5zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.613A4.5 4.5 0 0 1 18 15.5zM8 13v5h5.5a2.5 2.5 0 0 0 0-5H8z"/>
            </svg>
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`toolbar-btn flex items-center justify-center w-8 h-8 rounded ${
              editor.isActive('italic') 
                ? 'bg-gray-200 text-blue-500' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Italic"
          >
            <span className="sr-only">Italic</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="fill-current">
              <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15z"/>
            </svg>
          </button>
          
          <span className="h-4 w-px bg-gray-300 mx-1"></span>
          
          {/* Weight Button */}
          <div className="relative">
            <button
              onClick={handleAddWeight}
              className="toolbar-btn"
              title="Add Weight"
            >
              <span className="sr-only">Add Weight</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="fill-current">
                <path d="M9 7v10h6V7H9zm8-2v14H7V5h10z"/>
              </svg>
            </button>
            
            {weightModalOpen && (
              <div 
                ref={weightModalRef}
                className="absolute left-0 mt-1 w-64 bg-white shadow-lg rounded-md z-10 p-3"
              >
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight ({customWeight.toFixed(2)})
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={customWeight}
                    onChange={e => handleSetCustomWeight(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Lower</span>
                    <span>Normal</span>
                    <span>Higher</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="text-xs">
                    {customWeight >= 1 ? 'Using { }' : 'Using [ ]'}
                  </div>
                  <div className="space-x-2">
                    <button
                      className="px-2 py-1 text-xs border border-gray-300 rounded"
                      onClick={() => setWeightModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                      onClick={handleAddWeight}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Preset Button */}
          <div className="relative">
            <button
              onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
              className="toolbar-btn"
              title="Insert Preset"
            >
              <span className="sr-only">Insert Preset</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="fill-current">
                <path d="M12 22l-4-4h8l-4 4zm0-20l4 4H8l4-4zm9 9l-4-4v8l4-4zm-18 0l4 4V7l-4 4z"/>
              </svg>
            </button>
            
            {isPresetMenuOpen && (
              <div 
                ref={presetMenuRef}
                className="absolute left-0 mt-1 w-64 bg-white shadow-lg rounded-md z-10 py-1"
              >
                <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b">
                  Presets
                </div>
                
                {/* Search and filters */}
                <div className="px-3 py-2 border-b">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-1 text-sm mb-2"
                    placeholder="Search presets..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="w-full border border-gray-300 rounded-md p-1 text-sm"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                {/* Preset list */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredPresets.length > 0 ? (
                    filteredPresets.map(preset => (
                      <button
                        key={preset.id}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => handleAddPreset(preset)}
                      >
                        <div className="flex items-center">
                          {/* Indicator for preset type */}
                          <span 
                            className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              preset.type === 'wildcard' ? 'bg-purple-500' : 'bg-green-500'
                            }`}
                          ></span>
                          
                          {/* Preset name and category */}
                          <div>
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-xs text-gray-500">{preset.category}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No presets match your search
                    </div>
                  )}
                </div>
                
                {/* Manage presets button */}
                <div className="px-3 py-2 border-t">
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      setIsPresetMenuOpen(false);
                      setShowPresetManager(true);
                    }}
                  >
                    Manage Presets
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Inline Wildcard Button */}
          <div className="relative">
            <button
              onClick={() => setIsInlineModalOpen(true)}
              className="toolbar-btn"
              title="Inline Wildcard"
            >
              <span className="sr-only">Inline Wildcard</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="fill-current">
                <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm0 2h7v5h5v11H6V4zm9.9 6l-3.814 7.632-2.302-4.625L6 16.423l3.027-1.82 1.207 2.445 2.225-4.455L14.9 10z"/>
              </svg>
            </button>
            
            {isInlineModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div ref={inlineModalRef} className="bg-white rounded-lg shadow-xl p-6 w-80">
                  <h3 className="text-lg font-medium mb-4">Create Inline Wildcard</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Options (separate with | or ,)
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      placeholder="option1|option2|option3"
                      value={inlineOptions}
                      onChange={e => setInlineOptions(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: tall|short|average height
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md"
                      onClick={() => {
                        setInlineOptions('');
                        setIsInlineModalOpen(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
                      onClick={handleAddInlineWildcard}
                    >
                      Insert
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Fine-tune mode toolbar
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              // In a complete implementation, this would adjust weight
              console.log('Adjust weight');
            }}
            className="toolbar-btn"
            title="Adjust Weight"
          >
            <span className="sr-only">Adjust Weight</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="fill-current">
              <path d="M4 6V4h16v2H4zm0 14v-2h16v2H4zm4-8v-2h8v2H8z"/>
            </svg>
          </button>
          
          <button
            onClick={() => setShowGroupManager(true)}
            className="toolbar-btn"
            title="Manage Groups"
          >
            <span className="sr-only">Manage Groups</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="fill-current">
              <path d="M2 3h8a2 2 0 0 1 2 2v2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm10 4v12h8V9h-8zm-2 8H4v2h6v-2z"/>
            </svg>
          </button>
          
          <span className="h-4 w-px bg-gray-300 mx-1"></span>
          
          <button
            onClick={() => {
              // In a complete implementation, this would select all segments
              console.log('Select all');
            }}
            className="toolbar-btn"
            title="Select All"
          >
            <span className="sr-only">Select All</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="fill-current">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default EditorToolbar;