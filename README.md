// README.md
# NaiKit - NovelAI 이미지 생성 확장 프로그램

NaiKit은 NovelAI의 이미지 생성 인터페이스를 향상시키는 크롬 확장 프로그램입니다. 프롬프트 관리, 가중치 조절, 프리셋 저장 등의 영역에서 사용자 경험을 크게 개선합니다.

## 핵심 기능

- **컴포즈/파인튜닝 모드**: 프롬프트 작성과 가중치 조절을 위한 별도의 모드 제공
- **통합 와일드카드/키워드 시스템**: 프롬프트 요소를 쉽게 관리하고 재사용
- **정밀한 가중치 제어**: 프롬프트 요소별 가중치를 시각적으로 표시하고 조절
- **무제한 프리셋 저장**: 프롬프트, 해상도, 배치 설정 등을 쉽게 저장하고 불러오기
- **자동 생성 기능**: 여러 이미지를 자동으로 연속 생성

## 개발 환경 설정

### 필수 요구사항
- Node.js 14.0.0 이상
- npm 또는 yarn

### 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/your-username/naikit.git
cd naikit

# 의존성 설치
npm install

# 개발 모드 실행 (파일 변경 감시)
npm run dev
```

개발 모드에서는 파일 변경을 감지하여 자동으로 빌드합니다. 빌드된 확장 프로그램은 `dist` 디렉토리에 생성됩니다.

### 크롬에 확장 프로그램 로드하기

1. Chrome 브라우저에서 `chrome://extensions` 페이지로 이동
2. 우측 상단의 "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 버튼 클릭
4. `dist` 폴더 선택

## 프로젝트 구조

```
naikit/
├── src/
│   ├── background/       # 백그라운드 스크립트
│   ├── content/          # 콘텐츠 스크립트
│   ├── sidebar/          # 사이드바 UI
│   ├── modules/          # 공유 모듈
│   │   ├── segment-model/
│   │   ├── compiler/
│   │   ├── messaging/
│   │   ├── storage/
│   │   └── nai/
│   └── styles/           # 스타일시트
├── public/               # 정적 파일
├── dist/                 # 빌드 결과물
├── vite.config.js        # Vite 설정
└── package.json
```

## 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 배포용 ZIP 패키지 생성
npm run package
```

생성된 `naikit-v{version}.zip` 파일은 Chrome 웹 스토어에 업로드할 수 있습니다.

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 기여하기

이슈 보고서, 기능 요청 등 모든 기여를 환영합니다. 풀 리퀘스트를 제출하기 전에 관련 이슈에 대해 먼저 논의해주세요.