# NaiKit 테스트 애플리케이션

NovelAI 프롬프트 생성 및 관리를 위한 테스트 애플리케이션입니다.

## 개요

이 애플리케이션은 NaiKit 코어 모듈을 테스트하기 위한 웹 기반 인터페이스를 제공합니다. 주요 기능은 다음과 같습니다:

- 세그먼트 기반 프롬프트 생성 및 편집
- 다양한 세그먼트 타입 지원 (텍스트, 가중치, 프리셋, 인라인 와일드카드)
- 복합 가중치 세그먼트 구성
- 캐릭터별 프롬프트 관리
- NovelAI 호환 프롬프트 내보내기

## 실행 방법

```bash
# 의존성 설치
bun install

# 개발 서버 실행
bun run dev
```

## 기능 설명

### 세그먼트 에디터

세그먼트 에디터에서는 다음과 같은 작업을 수행할 수 있습니다:

- 텍스트 세그먼트 추가 및 편집
- 가중치 세그먼트 생성 (중첩 가능)
- 인라인 와일드카드 세그먼트 추가
- 프리셋 세그먼트 추가
- 텍스트 형식의 프롬프트 가져오기
- 긍정/부정 프롬프트 전환

### 프롬프트 뷰어

프롬프트 뷰어에서는 다음과 같은 작업을 수행할 수 있습니다:

- 현재 프롬프트 텍스트 확인
- 와일드카드 확장 기능 테스트
- 시드 기반 랜덤 생성 테스트
- JSON 형식으로 프롬프트 다운로드

### 캐릭터 관리

캐릭터 관리에서는 다음과 같은 작업을 수행할 수 있습니다:

- 새 캐릭터 추가
- 캐릭터별 긍정/부정 프롬프트 편집
- 캐릭터 순서 변경
- 캐릭터 삭제

## 기술 스택

- React + TypeScript
- Zustand (상태 관리)
- Immer (불변성 관리)
- TailwindCSS (스타일링)
- Vite (빌드 도구)

## NaiKit 코어 모듈

테스트 애플리케이션은 다음과 같은 NaiKit 코어 모듈을 사용합니다:

- `segment-model`: 세그먼트 데이터 구조 및 조작 함수
- `compiler`: 세그먼트를 NovelAI 호환 문자열로 변환
- `parser`: NovelAI 프롬프트 문자열을 세그먼트로 파싱
