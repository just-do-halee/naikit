// src/sidebar/index.js
import NaiKitSidebar from './sidebar.js';

console.log('사이드바 스크립트 로드됨');

// DOM이 로드된 후 사이드바 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log('사이드바 DOM 로드됨 (index.js)');
  
  const container = document.getElementById('naikit-sidebar-root');
  console.log('사이드바 컨테이너:', container);
  
  if (container) {
    try {
      console.log('사이드바 초기화 시작');
      const sidebar = new NaiKitSidebar(container);
      console.log('사이드바 초기화 완료');
    } catch (error) {
      console.error('사이드바 초기화 오류:', error);
    }
  } else {
    console.error('사이드바 컨테이너를 찾을 수 없습니다');
  }
});