import React, { useState, useEffect } from 'react';
import { Group } from '../../../../state/segment-react-bindings';

interface GroupManagerProps {
  groups: Group[];
  segmentIds: string[];
  onClose: () => void;
  onCreateGroup: (name: string, segmentIds: string[], color: string) => void;
  onUpdateGroup: (id: string, updates: Partial<Omit<Group, 'id'>>) => void;
  onDeleteGroup: (id: string) => void;
  onAddSegmentsToGroup: (groupId: string, segmentIds: string[]) => void;
  onRemoveSegmentsFromGroup: (groupId: string, segmentIds: string[]) => void;
}

const GroupManager: React.FC<GroupManagerProps> = ({
  groups,
  segmentIds,
  onClose,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddSegmentsToGroup,
  onRemoveSegmentsFromGroup,
}) => {
  // Current view state: 'list', 'create', 'edit'
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  
  // Selected group for editing
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Check if we have segments selected
  const hasSegmentsSelected = segmentIds.length > 0;
  
  // Form values for create/edit
  const [formValues, setFormValues] = useState({
    name: '',
    color: '#3A86FF',
    weightMode: 'relative' as 'relative' | 'absolute',
  });
  
  // Segment selection state
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  
  // Initialize form when editing an existing group
  useEffect(() => {
    if (view === 'edit' && selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      if (group) {
        setFormValues({
          name: group.name,
          color: group.color,
          weightMode: group.weightMode,
        });
        setSelectedSegments(group.segmentIds);
      }
    } else if (view === 'create') {
      // Initialize create form with default values and any selected segments
      setFormValues({
        name: '',
        color: '#3A86FF',
        weightMode: 'relative',
      });
      setSelectedSegments(segmentIds);
    }
  }, [view, selectedGroupId, groups, segmentIds]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formValues.name) {
      alert('Group name is required');
      return;
    }
    
    if (selectedSegments.length === 0) {
      alert('At least one segment must be selected');
      return;
    }
    
    if (view === 'create') {
      onCreateGroup(
        formValues.name,
        selectedSegments,
        formValues.color
      );
      setView('list');
    } else if (view === 'edit' && selectedGroupId) {
      // Handle both group property updates and segment membership changes
      
      // First update group properties
      onUpdateGroup(selectedGroupId, {
        name: formValues.name,
        color: formValues.color,
        weightMode: formValues.weightMode,
      });
      
      // Then handle segment membership changes
      const group = groups.find(g => g.id === selectedGroupId);
      if (group) {
        const currentSegments = new Set(group.segmentIds);
        const newSegments = new Set(selectedSegments);
        
        // Find segments to add (in new but not in current)
        const segmentsToAdd = selectedSegments.filter(id => !currentSegments.has(id));
        if (segmentsToAdd.length > 0) {
          onAddSegmentsToGroup(selectedGroupId, segmentsToAdd);
        }
        
        // Find segments to remove (in current but not in new)
        const segmentsToRemove = group.segmentIds.filter(id => !newSegments.has(id));
        if (segmentsToRemove.length > 0) {
          onRemoveSegmentsFromGroup(selectedGroupId, segmentsToRemove);
        }
      }
      
      setView('list');
    }
  };
  
  // Handle delete button click
  const handleDeleteClick = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      onDeleteGroup(groupId);
    }
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    setView('list');
  };
  
  // Handle segment selection toggle
  const handleSegmentToggle = (segmentId: string) => {
    setSelectedSegments(prev => {
      if (prev.includes(segmentId)) {
        return prev.filter(id => id !== segmentId);
      } else {
        return [...prev, segmentId];
      }
    });
  };
  
  // Handle quick add to existing group
  const handleQuickAdd = (groupId: string) => {
    if (segmentIds.length > 0) {
      onAddSegmentsToGroup(groupId, segmentIds);
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {view === 'list' ? 'Group Manager' : 
             view === 'create' ? 'Create Group' : 'Edit Group'}
          </h2>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {view === 'list' && (
            <>
              {/* Group list view */}
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Your Groups</h3>
                {groups.length > 0 ? (
                  <ul className="space-y-3">
                    {groups.map(group => (
                      <li 
                        key={group.id} 
                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: group.color }}
                            ></div>
                            <div>
                              <h4 className="font-medium">{group.name}</h4>
                              <p className="text-xs text-gray-500">
                                {group.segmentIds.length} segments • 
                                {group.weightMode === 'relative' ? ' Relative weights' : ' Absolute weights'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {hasSegmentsSelected && (
                              <button
                                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded"
                                onClick={() => handleQuickAdd(group.id)}
                                title="Add selected segments to this group"
                              >
                                Add Selected
                              </button>
                            )}
                            <button
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                              onClick={() => {
                                setSelectedGroupId(group.id);
                                setView('edit');
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded"
                              onClick={() => handleDeleteClick(group.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No groups created yet</p>
                    <p className="text-sm">Create a group to organize related segments together</p>
                  </div>
                )}
              </div>
              
              {/* Create group button */}
              <div className="flex justify-center">
                <button
                  className={`px-4 py-2 rounded-full ${
                    hasSegmentsSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                  disabled={!hasSegmentsSelected}
                  onClick={() => setView('create')}
                >
                  {hasSegmentsSelected 
                    ? `Create Group with ${segmentIds.length} Selected Segment${segmentIds.length > 1 ? 's' : ''}` 
                    : 'Select Segments to Create a Group'}
                </button>
              </div>
            </>
          )}
          
          {(view === 'create' || view === 'edit') && (
            /* Create/Edit form */
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Group name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formValues.name}
                    onChange={handleInputChange}
                    placeholder="Enter a descriptive name"
                  />
                </div>
                
                {/* Group color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      name="color"
                      className="h-8 w-8 border border-gray-300 rounded"
                      value={formValues.color}
                      onChange={handleInputChange}
                    />
                    <input
                      type="text"
                      name="color"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      value={formValues.color}
                      onChange={handleInputChange}
                      pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                      placeholder="#RRGGBB"
                    />
                  </div>
                </div>
                
                {/* Weight mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight Mode
                  </label>
                  <select
                    name="weightMode"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formValues.weightMode}
                    onChange={handleInputChange}
                  >
                    <option value="relative">Relative - Maintain each segment's own weight</option>
                    <option value="absolute">Absolute - Apply same weight to all segments</option>
                  </select>
                </div>
                
                {/* Segment selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Segments in Group
                  </label>
                  
                  {segmentIds.length > 0 ? (
                    <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                      {segmentIds.map(id => (
                        <div key={id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            id={`segment-${id}`}
                            checked={selectedSegments.includes(id)}
                            onChange={() => handleSegmentToggle(id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`segment-${id}`} className="text-sm">
                            Segment {id.substring(0, 8)}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 border border-gray-300 rounded-md p-3">
                      No segments are currently selected.
                    </div>
                  )}
                  
                  <p className="mt-2 text-xs text-gray-500">
                    {selectedSegments.length} of {segmentIds.length} segments selected
                  </p>
                </div>
              </div>
              
              {/* Form actions */}
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
                  disabled={!formValues.name || selectedSegments.length === 0}
                >
                  {view === 'create' ? 'Create Group' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupManager;