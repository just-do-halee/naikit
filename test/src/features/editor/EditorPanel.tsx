import React from 'react';
import { EditorProvider } from '@/contexts/EditorContext';
import { useModeStore } from '@/store/mode-store';
import SegmentCreator from '@/components/segment/SegmentCreator';
import GroupManager from '@/components/segment/GroupManager';
import SegmentTree from '@/components/segment/SegmentTree';

const EditorPanel: React.FC = () => {
  const { currentMode } = useModeStore();
  
  return (
    <EditorProvider>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <SegmentTree />
        </div>
        
        <div className="space-y-6">
          {currentMode === 'compose' && (
            <>
              <SegmentCreator />
              <GroupManager />
            </>
          )}
          
          {currentMode === 'finetune' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-3">파인튜닝 모드</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                이 모드에서는 세그먼트를 선택하여 세부 조정할 수 있습니다.
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                <li className="mb-1">세그먼트를 클릭하여 활성화</li>
                <li className="mb-1">활성화된 세그먼트의 내용 편집</li>
                <li className="mb-1">프리셋 값 및 옵션 조정</li>
                <li className="mb-1">와일드카드 옵션 관리</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </EditorProvider>
  );
};

export default EditorPanel;