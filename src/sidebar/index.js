// src/sidebar/index.js
import NaiKitSidebar from './sidebar';

// DOM이 로드된 후 사이드바 초기화
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('naikit-sidebar-root');
  if (container) {
    const sidebar = new NaiKitSidebar(container);
  } else {
    console.error('사이드바 컨테이너를 찾을 수 없습니다');
  }
});