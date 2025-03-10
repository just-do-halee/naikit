import React from 'react';
import { EditorMode } from '@/store/mode-store';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: 'editor' | 'viewer' | 'characters';
  setActiveTab: (tab: 'editor' | 'viewer' | 'characters') => void;
  currentMode: EditorMode;
  switchMode: (mode: EditorMode) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  currentMode,
  switchMode,
}) => {
  return (
    <div className={`container mx-auto p-4 max-w-6xl mode-${currentMode}`}>
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">NaiKit Test Application</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Novel AI 프롬프트 작성을 위한 고급 에디터
        </p>
      </header>

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'editor'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('editor')}
            >
              세그먼트 에디터
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'viewer'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('viewer')}
            >
              프롬프트 뷰어
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'characters'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('characters')}
            >
              캐릭터 관리
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded font-medium ${
                currentMode === 'compose'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
              onClick={() => switchMode('compose')}
            >
              컴포즈 모드
            </button>
            <button
              className={`px-4 py-2 rounded font-medium ${
                currentMode === 'finetune'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
              onClick={() => switchMode('finetune')}
            >
              파인튜닝 모드
            </button>
          </div>
        </div>
      </div>

      <main>
        {children}
      </main>

      <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
        <p>NaiKit Test App &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default MainLayout;