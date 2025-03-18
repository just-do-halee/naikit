import React, { useState, useRef, useEffect } from 'react';
import { Preset } from '../../../../state/segment-react-bindings';

interface PresetManagerProps {
  presets: Preset[];
  onClose: () => void;
  onAddPreset: (preset: Omit<Preset, 'id'>) => void;
  onUpdatePreset: (id: string, updates: Partial<Omit<Preset, 'id'>>) => void;
  onDeletePreset: (id: string) => void;
}

const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  onClose,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset,
}) => {
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'wildcard' | 'keyword'>('all');
  
  // State for the currently selected preset
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  
  // State for the edit form
  const [editMode, setEditMode] = useState<'none' | 'add' | 'edit'>('none');
  const [formValues, setFormValues] = useState<{
    name: string;
    category: string;
    type: 'wildcard' | 'keyword';
    keywordValue?: string;
    values?: string[];
    color?: string;
  }>({
    name: '',
    category: '',
    type: 'wildcard',
    values: [],
  });
  
  // Ref for values text input
  const valuesInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(presets.map(p => p.category)));
  
  // Filtered presets
  const filteredPresets = presets.filter(preset => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preset.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = categoryFilter === '' || preset.category === categoryFilter;
    
    // Type filter
    const matchesType = typeFilter === 'all' || preset.type === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });
  
  // Find the selected preset
  const selectedPreset = selectedPresetId 
    ? presets.find(p => p.id === selectedPresetId) 
    : null;
  
  // Reset form to default values
  const resetForm = () => {
    setFormValues({
      name: '',
      category: '',
      type: 'wildcard',
      values: [],
    });
  };
  
  // Initialize form with preset values for editing
  const initFormForEdit = (preset: Preset) => {
    setFormValues({
      name: preset.name,
      category: preset.category,
      type: preset.type,
      keywordValue: preset.keywordValue,
      values: preset.values || [],
      color: preset.color,
    });
  };
  
  // Handle preset selection
  const handleSelectPreset = (id: string) => {
    if (editMode !== 'none') {
      // If in edit mode, confirm before switching
      if (window.confirm('You have unsaved changes. Discard them?')) {
        setSelectedPresetId(id);
        setEditMode('none');
      }
    } else {
      setSelectedPresetId(id);
    }
  };
  
  // Handle add button click
  const handleAddClick = () => {
    resetForm();
    setEditMode('add');
    setSelectedPresetId(null);
  };
  
  // Handle edit button click
  const handleEditClick = () => {
    if (selectedPreset) {
      initFormForEdit(selectedPreset);
      setEditMode('edit');
    }
  };
  
  // Handle delete button click
  const handleDeleteClick = () => {
    if (selectedPreset) {
      if (window.confirm(`Are you sure you want to delete "${selectedPreset.name}"?`)) {
        onDeletePreset(selectedPreset.id);
        setSelectedPresetId(null);
        setEditMode('none');
      }
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      // Reset keyword-specific fields when switching types
      if (value === 'wildcard') {
        setFormValues(prev => ({
          ...prev,
          type: 'wildcard',
          keywordValue: undefined,
        }));
      } else {
        setFormValues(prev => ({
          ...prev,
          type: 'keyword',
          values: [],
        }));
      }
    } else if (name === 'values') {
      // Parse the values from the textarea
      const valueArray = value
        .split('\n')
        .map(v => v.trim())
        .filter(v => v !== '');
      
      setFormValues(prev => ({
        ...prev,
        values: valueArray,
      }));
    } else {
      setFormValues(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formValues.name) {
      alert('Name is required!');
      return;
    }
    
    if (!formValues.category) {
      alert('Category is required!');
      return;
    }
    
    if (formValues.type === 'keyword' && !formValues.keywordValue) {
      alert('Keyword value is required for keyword presets!');
      return;
    }
    
    if (formValues.type === 'wildcard' && (!formValues.values || formValues.values.length === 0)) {
      alert('At least one value is required for wildcard presets!');
      return;
    }
    
    if (editMode === 'add') {
      // Add new preset
      onAddPreset(formValues);
      resetForm();
      setEditMode('none');
    } else if (editMode === 'edit' && selectedPresetId) {
      // Update existing preset
      onUpdatePreset(selectedPresetId, formValues);
      setEditMode('none');
    }
  };
  
  // Cancel editing
  const handleCancel = () => {
    if (window.confirm('Discard changes?')) {
      setEditMode('none');
    }
  };
  
  // Focus the values textarea when editing a wildcard preset
  useEffect(() => {
    if (editMode !== 'none' && formValues.type === 'wildcard' && valuesInputRef.current) {
      valuesInputRef.current.focus();
    }
  }, [editMode, formValues.type]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Preset Manager</h2>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel - Preset list */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Search and filters */}
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search presets..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <div className="flex space-x-2">
                <select
                  className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <select
                  className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | 'wildcard' | 'keyword')}
                >
                  <option value="all">All Types</option>
                  <option value="wildcard">Wildcards</option>
                  <option value="keyword">Keywords</option>
                </select>
              </div>
            </div>
            
            {/* Preset list */}
            <div className="flex-1 overflow-y-auto">
              {filteredPresets.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredPresets.map(preset => (
                    <li 
                      key={preset.id}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                        selectedPresetId === preset.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSelectPreset(preset.id)}
                    >
                      <div className="flex items-center">
                        <span 
                          className={`w-3 h-3 rounded-full mr-2 ${
                            preset.type === 'wildcard' ? 'bg-purple-500' : 'bg-green-500'
                          }`}
                        ></span>
                        <div>
                          <div className="font-medium">{preset.name}</div>
                          <div className="text-xs text-gray-500">{preset.category}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No presets found
                </div>
              )}
            </div>
            
            {/* Add button */}
            <div className="p-4 border-t border-gray-200">
              <button
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={handleAddClick}
              >
                Add New Preset
              </button>
            </div>
          </div>
          
          {/* Right panel - Preset details or edit form */}
          <div className="w-2/3 flex flex-col">
            {editMode === 'none' ? (
              /* Preset details view */
              selectedPreset ? (
                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{selectedPreset.name}</h3>
                      <div className="flex items-center">
                        <span className="text-sm bg-gray-200 rounded-full px-3 py-1 mr-2">
                          {selectedPreset.category}
                        </span>
                        <span className={`text-sm rounded-full px-3 py-1 ${
                          selectedPreset.type === 'wildcard' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedPreset.type === 'wildcard' ? 'Wildcard' : 'Keyword'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                        onClick={handleEditClick}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50"
                        onClick={handleDeleteClick}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {selectedPreset.type === 'wildcard' ? (
                    /* Wildcard details */
                    <div>
                      <h4 className="font-medium mb-2">Values</h4>
                      {selectedPreset.values && selectedPreset.values.length > 0 ? (
                        <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-96 overflow-y-auto">
                          <ul className="space-y-1">
                            {selectedPreset.values.map((value, index) => (
                              <li key={index} className="text-sm">
                                {value}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No values defined</p>
                      )}
                    </div>
                  ) : (
                    /* Keyword details */
                    <div>
                      <h4 className="font-medium mb-2">Keyword Value</h4>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        {selectedPreset.keywordValue}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* No preset selected */
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a preset or create a new one
                </div>
              )
            ) : (
              /* Edit form */
              <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto">
                <h3 className="text-lg font-medium mb-4">
                  {editMode === 'add' ? 'Add New Preset' : 'Edit Preset'}
                </h3>
                
                <div className="space-y-4">
                  {/* Basic info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={formValues.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      required
                      list="categories"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={formValues.category}
                      onChange={handleInputChange}
                    />
                    <datalist id="categories">
                      {categories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      name="type"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={formValues.type}
                      onChange={handleInputChange}
                    >
                      <option value="wildcard">Wildcard</option>
                      <option value="keyword">Keyword</option>
                    </select>
                  </div>
                  
                  {/* Type-specific fields */}
                  {formValues.type === 'wildcard' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Values (one per line)
                      </label>
                      <textarea
                        ref={valuesInputRef}
                        name="values"
                        rows={10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                        value={formValues.values?.join('\n') || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keyword Value
                      </label>
                      <input
                        type="text"
                        name="keywordValue"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={formValues.keywordValue || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                  
                  {/* Optional color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color (optional)
                    </label>
                    <input
                      type="color"
                      name="color"
                      className="w-full border border-gray-300 rounded-md"
                      value={formValues.color || '#3A86FF'}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                {/* Form buttons */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editMode === 'add' ? 'Create Preset' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresetManager;