import React, { useState } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { useGroupActions } from '@/hooks/useGroupActions';

const GroupManager: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [newColor, setNewColor] = useState('#3b82f6'); // 기본 색상: 파란색
  
  const { 
    selectedSegments,
    newGroupName,
    setNewGroupName,
  } = useEditor();
  
  const {
    createNewGroup,
    getAllGroups,
    updateGroupName,
    updateGroupColor,
    deleteGroup,
  } = useGroupActions();
  
  // 새 그룹 생성
  const handleCreateGroup = () => {
    if (!newGroupName.trim() || selectedSegments.length === 0) return;
    
    createNewGroup(newGroupName, selectedSegments);
    setNewGroupName('');
  };
  
  // 색상 선택기 표시 토글
  const toggleColorPicker = () => {
    setIsOpen(!isOpen);
  };
  
  // 그룹 목록 가져오기
  const groups = getAllGroups();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">그룹 관리</h3>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium mb-2">새 그룹 생성</h4>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="그룹 이름"
            className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          />
          
          <div className="relative">
            <button
              type="button"
              onClick={toggleColorPicker}
              className="w-10 h-10 rounded-md border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: newColor }}
            ></button>
            
            {isOpen && (
              <div className="absolute right-0 top-12 p-2 bg-white dark:bg-gray-800 rounded-md shadow-md z-10 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-5 gap-2">
                  {[
                    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
                    '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
                    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
                  ].map(color => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setNewColor(color);
                        setIsOpen(false);
                      }}
                    ></button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-3">
          <p className="text-sm mb-1">선택된 세그먼트: {selectedSegments.length}개</p>
          <button
            onClick={handleCreateGroup}
            disabled={!newGroupName.trim() || selectedSegments.length === 0}
            className={`px-4 py-2 rounded-md ${
              newGroupName.trim() && selectedSegments.length > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            그룹 생성
          </button>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">그룹 목록</h4>
        
        {groups.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">생성된 그룹이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {groups.map(group => (
              <li 
                key={group.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color }}
                  ></div>
                  <span>{group.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({group.segmentIds.length}개 세그먼트)
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newName = window.prompt('새 그룹 이름:', group.name);
                      if (newName) {
                        updateGroupName(group.id, newName);
                      }
                    }}
                    className="px-2 py-1 text-sm bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 rounded"
                  >
                    이름 변경
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`"${group.name}" 그룹을 삭제하시겠습니까?`)) {
                        deleteGroup(group.id);
                      }
                    }}
                    className="px-2 py-1 text-sm bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 rounded"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default GroupManager;