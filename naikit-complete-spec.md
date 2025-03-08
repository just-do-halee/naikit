# NaiKit
## NovelAI 이미지 생성 확장 프로그램 전체 기획서

---

# 1. 프로젝트 개요

## 1.1 배경 및 목적

NovelAI의 이미지 생성 서비스(novelai.net/image)는 AI 이미지 생성 분야에서 뛰어난 품질을 제공하지만, 그 사용자 인터페이스와 기능은 다수의 사용자에게 불편함을 주고 있습니다. 특히 프롬프트 관리, 가중치 조절, 프리셋 저장 등의 영역에서 사용자 경험이 제한적입니다.

NaiKit은 이러한 제한을 해결하고 NovelAI 이미지 생성 경험을 근본적으로 향상시키기 위한 크롬 확장 프로그램입니다. 기존 인터페이스를 확장하고 재구성함으로써, 사용자들이 더 직관적이고 효율적으로 이미지를 생성할 수 있는 환경을 제공합니다.

## 1.2 주요 목표

1. **사용자 경험 혁신**: 프롬프트 작성과 가중치 조절을 위한 직관적이고 효율적인 인터페이스 제공
2. **워크플로우 최적화**: 반복 작업 자동화 및 시간 절약을 위한 고급 기능 통합
3. **세밀한 제어**: 프롬프트 요소에 대한 정밀한 가중치 조절 및 관리 시스템 구현
4. **확장성 및 커스터마이징**: 무제한 프리셋, 와일드카드, 자동화 옵션을 통한 개인화 지원
5. **원활한 통합**: NovelAI 시스템과의 완벽한 호환성 및 실시간 동기화 보장

## 1.3 타겟 사용자

- AI 이미지 생성에 정기적으로 NovelAI를 사용하는 아티스트 및 크리에이터
- 정밀한 프롬프트 제어를 원하는 고급 사용자
- 작업 효율성을 중시하는 프로페셔널 및 반복적인 이미지 생성 작업자
- 직관적인 인터페이스를 선호하는 초보 및 중급 사용자

---

# 2. 기술 요구사항

## 2.1 개발 환경

- 크롬 확장 프로그램 프레임워크
- 최신 manifest 버전 (V3) 사용
- 정확한 web_accessible_resources 정의

## 2.2 호환성 및 제한사항

- novelai.net/image 도메인에서만 작동
- NovelAI의 React 컴포넌트와 상호작용
- 웹 브라우저 확장 제한 준수

## 2.3 보안 고려사항

- 사용자 데이터(프리셋, 설정 등) 로컬 저장
- NovelAI 계정 정보 접근 최소화
- 악의적 코드 삽입 방지 조치

---

# 3. 사용자 인터페이스

## 3.1 레이아웃 구조

NaiKit은 NovelAI 웹사이트의 왼쪽 영역에 새로운 사이드바 형태로 통합됩니다. 이 사이드바는 기존 NovelAI UI의 프롬프트 관리 섹션을 완전히 덮으면서도 필요시 기존 UI에 쉽게 접근할 수 있는 유연성을 제공합니다.

### 3.1.1 사이드바 구성

- **위치**: NovelAI 사이트 내 최좌측
- **너비**: 기존 NovelAI UI 프롬프트 섹션과 자동 동기화
- **토글 기능**: 오른쪽 면 중앙에 위치한 버튼으로 사이드바 접기/펼치기 가능
- **너비 조절**: NovelAI UI의 오른쪽 드래그 영역 노출로 기존 UI 너비 조절 유지

### 3.1.2 주요 UI 요소

- **모드 전환 탭**: 컴포즈 모드와 파인튜닝 모드 간 전환
- **프롬프트 섹션**: 메인 및 캐릭터 프롬프트 관리
- **설정 패널**: 해상도, 배치 사이즈 등 이미지 생성 파라미터 관리
- **프리셋 관리자**: 저장된 프리셋 접근 및 관리
- **생성 컨트롤**: 단일/자동 생성 버튼 및 관련 설정

## 3.2 모드 시스템

NaiKit은 프롬프트 관리를 위한 두 가지 핵심 모드를 제공합니다:

### 3.2.1 컴포즈(Compose) 모드

프롬프트 내용 작성과 와일드카드/키워드 관리에 중점을 둔 모드입니다.

- **순수 텍스트 환경**: 가중치 표시 없이 내용에 집중
- **시각적 표현**: 와일드카드와 키워드 프리셋만 색상 박스로 표시
- **와일드카드/키워드 통합**: 자동완성 및 시각적 표시
- **인라인 와일드카드 지원**: 괄호와 파이프(|) 구문 지원

### 3.2.2 파인튜닝(Fine-tune) 모드

프롬프트 요소의 가중치를 시각적으로 조절하는 모드입니다.

- **포괄적 시각적 표시**: 
  - 컴포즈 모드의 모든 시각적 요소(와일드카드, 키워드 박스) 유지
  - 추가로 가중치 박스 및 그룹화 박스 표시
  - 모든 레이어가 동시에 시각화됨
- **직관적 가중치 표시**: 색상 코딩된 박스로 가중치 시각화
- **슬라이더 기반 제어**: 드래그 선택 시 자동 표시되는 가중치 슬라이더
- **그룹 관리**: 관련 요소 그룹화 및 일괄 조정

### 3.2.3 모드 전환 메커니즘

- **정보 보존**: 
  - 모드 간 전환 시 모든 설정과 가중치 정보 유지
  - 키보드 커서 위치는 모드 간 통합되어 정확히 동일한 위치 유지
  - 컴포즈 모드에서는 가중치가 적용되어 있더라도 수치 확인 불가
- **컴포즈 → 파인튜닝**: 기존 텍스트에 설정된 가중치 시각화
- **파인튜닝 → 컴포즈**: 가중치 및 그룹 정보는 내부적으로 유지되지만 가중치/그룹 박스는 시각적으로 숨김

## 3.3 반응형 설계

- 다양한 화면 해상도 지원
- 편안한 사용을 위한 최소 너비 설정
- 확장 가능한 패널 및 섹션

---

# 4. 프롬프트 관리 시스템

## 4.1 프롬프트 구조

NaiKit은 NovelAI의 프롬프트 구조를 유지하면서 더 강력한 관리 기능을 제공합니다:

### 4.1.1 메인 프롬프트

- **긍정(Positive) 프롬프트**: 이미지에 포함할 요소 정의
- **부정(Negative) 프롬프트**: 이미지에서 제외할 요소 정의
- **수직 분할 레이아웃**: 
  - 긍정 프롬프트가 위쪽, 부정 프롬프트가 아래쪽에 위치
  - 두 프롬프트 영역 동시 표시로 한눈에 비교 가능
  - 기존 nai사이트의 탭 방식과 달리 동시 편집 가능

### 4.1.2 캐릭터 프롬프트

- **다중 캐릭터 지원**: Add Character 버튼으로 추가 캐릭터 정의
- **독립 설정**: 각 캐릭터별 독립적인 긍정/부정 프롬프트
- **사용자 정의 이름**: 기본 "Character X" 이름을 사용자 지정 이름으로 변경 가능
- **순서 관리**: 캐릭터 순서 변경 및 삭제 기능

### 4.1.3 프롬프트 섹션 통합 인터페이스

- **수직 레이아웃 구성**:
  - 최상단: 컴포즈/파인튠 모드 토글 버튼
  - 상단: 메인 프롬프트(긍정 + 부정)
  - 중간: 캐릭터 추가 버튼
  - 하단: 추가된 각 캐릭터의 긍정/부정 프롬프트 쌍
  
- **통합 탐색 시스템**:
  - 기본 프롬프트 영역은 최대한 한눈에 확인 가능하도록 설계
  - 캐릭터 수가 많아질 경우 자연스러운 스크롤로 추가 캐릭터 접근
  - 탭(Tab)과 Shift+탭으로 모든 텍스트 영역 간 순차적 이동
  - 단축키 지원: Ctrl+W로 컴포즈/파인튠 모드 빠른 전환

## 4.2 프리셋 시스템

### 4.2.1 저장 기능

- **전체/부분 저장**: 모든 설정 또는 특정 부분만 선택적 저장
- **메타데이터**: 이름, 설명, 태그를 포함한 프리셋 정보
- **무제한 저장**: 저장 개수 제한 없음

### 4.2.2 로드 기능

- **스마트 체크**: 부분 저장된 프리셋은 해당 부분만 자동 체크, 전체 저장된 프리셋은 모두 체크
- **선택적 적용**: 로드 시 적용할 부분 사용자 선택 가능
- **미리보기**: 프리셋 내용 로드 전 확인

### 4.2.3 관리 도구

- **검색 및 필터링**: 이름, 설명, 태그 기반 검색
- **카테고리화**: 폴더 또는 그룹으로 프리셋 구성
- **가져오기/내보내기**: 프리셋 공유 및 백업

## 4.3 해상도 관리

- **기본 프리셋**: NovelAI 제공 해상도 옵션 활용
- **커스텀 해상도**: 사용자 정의 너비 및 높이 설정
- **미니프리셋**: 자주 사용하는 커스텀 해상도 저장 및 이름 부여

## 4.4 배치 설정

- **동적 최대값**: 해상도별 가능한 최대 배치 크기 자동 조정
- **시각적 피드백**: 현재 설정의 유효성 표시
- **적응형 인터페이스**: NovelAI 정책 변경에 대응하는 유연한 설계

---

# 5. 통합 프리셋 및 와일드카드 시스템

## 5.1 핵심 개념

NaiKit은 와일드카드와 키워드 프리셋을 하나의 통합된 시스템으로 제공합니다. 이 시스템은 프롬프트 작성 시 다양한 옵션을 쉽게 관리하고 적용할 수 있게 해줍니다.

** 중요: 와일드카드와 키워드는 별개의 기능이 아닌, 동일한 시스템의 두 가지 작동 모드입니다. **
이들은 구현, 데이터 구조, 사용자 인터페이스가 모두 동일하며, 단지 최종 프롬프트 생성 시 랜덤 선택(와일드카드)과 
고정 선택(키워드) 중 어떤 방식으로 동작할지만 다릅니다. 개발자는 이 두 기능을 별도로 구현하지 말고, 
하나의 통합된 '프리셋 시스템'으로 구현해야 합니다.

## 5.2 통합 프리셋 시스템

### 5.2.1 기본 작동 방식

- **접근 방법**: 컴포즈 모드에서 느낌표(!) 입력 시 프리셋 이름 목록 자동완성 표시
- **선택 및 확장**: 프리셋 선택(엔터) 시 해당 프리셋의 모든 항목 목록 표시
- **항목 구성**: 개행으로 구분된 모든 단어/문장이 항목 목록에 포함

### 5.2.2 듀얼 모드 작동

- **와일드카드 모드**: 목록 최상단의 특별 표시된 '*' 항목 선택 시 활성화
  - 특정 색상 박스로 표시
  - 이미지 생성 시 목록 내 항목 중 무작위 선택
  - 예: `!landscape` 선택 후 '*' 선택 → 생성 시 landscape 목록에서 무작위 항목 선택

- **키워드 모드**: 일반 항목 선택 시 활성화
  - 다른 색상 박스로 표시
  - "키워드이름:선택항목" 형태로 표시
  - 고정 값으로 컴파일
  - 예: `!style` 선택 후 "oil painting" 항목 선택 → "style:oil painting"으로 고정

이 듀얼 모드 구조는 개발상의 효율성과 사용자 경험 일관성을 위해 의도적으로 설계되었습니다. 
와일드카드와 키워드는 근본적으로 동일한 시스템이며, 단지 최종 결과물 생성 방식(랜덤 vs 고정)만 다릅니다. 
개발 시 이 두 기능을 위한 별도의 코드 경로, 별도의 데이터 구조, 별도의 UI 요소를 만들지 않아야 합니다. 
모든 관련 기능(생성, 편집, 관리, 저장, 로드 등)은 단일 통합 시스템으로 구현되어야 합니다.

### 5.2.3 관리 인터페이스

- **생성 및 편집**: 직관적인 에디터로 프리셋 내용 관리
- **메타데이터**: 이름, 설명, 태그 지정
- **폴더 구조**: 카테고리별 구성 가능
- **가져오기/내보내기**: 프리셋 공유 기능

### 5.2.4 고급 기능

- **접두어/접미사 처리**: 
  - 프리셋 내 모든 항목에 일괄 적용 가능한 텍스트 변환
  - 고급 모드에서 전용 입력 필드로 간편하게 설정
  
- **가중치 사전 설정**:
  - 키워드 프리셋 전체에 적용되는 기본 가중치 설정 필드
  - 개별 키워드별 가중치 지정 문법 지원: `키워드::가중치` (예: `beautiful girl::0.4`)
  - 입력된 가중치 값은 자동으로 1.05 양자화에 맞게 최적 근사값으로 조정
  
- **표현식 기반 변환**: 
  - 개발 모드에서 파이썬 유사 스크립트로 문자열 처리
  - 사용자 정의 코드로 복잡한 텍스트 변환 구현 가능
  
- **중첩 참조**: 프리셋 내에서 다른 프리셋 참조 가능

### 5.2.5 사용자 경험

- **시각적 구분**: 색상 박스 또는 배경색/폰트색 변경으로 구분
- **IDE 스타일 편집**: 
  - 느낌표(!) 입력 시 프리셋 목록 자동 표시
  - 프리셋 이름 타이핑 중 실시간 필터링
  - 선택된 요소 내 커서 위치 시 관련 옵션 즉시 표시
  - 키보드 화살표로 옵션 탐색 및 엔터로 선택
  - Tab 키로 자동완성 제안 수락
- **실시간 미리보기**: 설정된 항목의 효과 즉시 확인

## 5.3 인라인 와일드카드

별도의 프리셋 정의 없이 프롬프트 내에서 직접 사용 가능한 간편한 와일드카드 시스템입니다.

- **구문**: 괄호와 파이프(|)로 구분 - "(옵션1|옵션2|옵션3)"
- **작동**: 이미지 생성 시 제시된 옵션 중 하나를 무작위 선택
- **시각적 표시**: 다른 와일드카드처럼 색상 박스로 구분되어 표시
- **중첩 지원**: 
  - "(옵션1|(하위1|하위2))" 형태의 복합 구조 가능
  - 인라인 와일드카드 내에서도 `!프리셋명` 형태로 통합 프리셋 기능 사용 가능
  - 예: "(하늘색|!하늘색상|푸른색)" - 하늘색 프리셋에서 무작위 색상 선택 가능
- **가중치 적용**: 인라인 와일드카드에도 가중치 설정 가능

---

# 6. 프롬프트 가중치 시스템

## 6.1 가중치 기본 원리

NovelAI의 이미지 생성에서 가중치는 특정 프롬프트 요소의 중요도를 조절하는 메커니즘입니다. NaiKit은 이 복잡한 시스템을 직관적인 인터페이스로 관리할 수 있게 해줍니다.

### 6.1.1 가중치 표기법

- **증가 시스템(중괄호 { })**: 
  - 한 겹: 가중치 1.05배 - `{텍스트}`
  - 두 겹: 가중치 1.1025배 (1.05²) - `{{텍스트}}`
  - 세 겹: 가중치 1.157625배 (1.05³) - `{{{텍스트}}}`
  - 최대 78겹: 가중치 약 45.0배
  
- **감소 시스템(대괄호 [ ])**: 
  - 한 겹: 가중치 0.952배 (1/1.05) - `[텍스트]`
  - 두 겹: 가중치 0.907배 (1/1.05²) - `[[텍스트]]`
  - 세 겹: 가중치 0.864배 (1/1.05³) - `[[[텍스트]]]`
  - 최대 78겹: 가중치 약 0.02배

## 6.2 파인튜닝 모드 인터페이스

파인튜닝 모드는 프롬프트 가중치를 시각적이고 직관적으로 관리할 수 있는 특화된 환경을 제공합니다.

### 6.2.1 가중치 조절 UI

- **텍스트 선택 메커니즘**: 프롬프트 내 텍스트 드래그로 선택
- **박스 표시**: 선택 완료 시 해당 부분이 즉시 박스로 뒤덮이고 기본값 1.0이 오른쪽에 표시
- **자동 슬라이더**: 박스 생성과 함께 텍스트 상단에 슬라이더 자동 표시
- **범위**: 0.02(최소) ~ 1.0(중립) ~ 45.0(최대)
- **실시간 동기화**: 슬라이더 조절 시 박스 오른쪽 가중치 값이 실시간 갱신
- **직접 입력**: 더블클릭으로 정확한 수치 직접 입력 가능

### 6.2.2 시각적 표현

- **증가 가중치(>1.0)**: 파란색 계열 박스, 값이 클수록 진한 색상
- **감소 가중치(<1.0)**: 빨간색 계열 박스, 값이 작을수록 진한 색상
- **수치 표시**: 각 가중치 박스 오른쪽에 정확한 가중치 값 표시
- **중립 요소**: 특별한 표시 없음(가중치 1.0)
- **레이어 구조**: 
  - 요소 계층화로 명확한 시각적 구분 제공
  - 레이어 순서(앞에서 뒤로): 와일드카드/키워드 박스 > 가중치 박스 > 그룹 박스
  - 각 레이어는 살짝 다른 테두리 위치와 배경 불투명도로 구분

### 6.2.3 특수 선택 동작

- **가중치 박스 우회**: 기존 가중치가 설정된 텍스트는 드래그 시 자동 건너뜀
- **가중치 수정**: 기존 가중치 박스 클릭 시 슬라이더 재활성화
- **다중 영역 선택**: 
  - 드래그 과정에서 기존 가중치 영역을 건너뛰면서 여러 미설정 영역이 자동으로 함께 선택됨
  - 선택된 각 영역은 개별 박스로 표시되지만 슬라이더는 하나만 나타남
  - 이 단일 슬라이더 조절 시 모든 선택된 영역의 가중치가 동시에 실시간 변경됨
- **특수 요소 양자화**: 
  - 컴포즈 모드의 와일드카드나 키워드 표식은 불가분의 단위로 취급
  - 이러한 요소는 일부만 드래그해도 항상 전체가 한꺼번에 선택됨
  - 부분 선택 불가능 - 예: "!계절" 와일드카드의 한 글자만 선택하려 해도 전체 와일드카드가 선택됨
  - **인라인 와일드카드 특별 처리**: 
    - 구조 구분 기호인 '(', '|', ')' 문자는 드래그 선택이 방지됨
    - 인라인 와일드카드 내부 콘텐츠는 일반 텍스트처럼 자유롭게 가중치 설정 가능

## 6.3 그룹 가중치 관리

관련된 여러 프롬프트 요소를 그룹으로 묶어 함께 관리할 수 있는 기능입니다.

### 6.3.1 그룹화 메커니즘

- **선택 방법**: Shift 키를 누른 상태에서 여러 가중치 박스 순차 클릭
- **그룹 생성**: 그룹화 버튼 클릭으로 선택된 요소들 묶기
- **시각적 구분**: 
  - 그룹 내 요소들은 동일한 색상 테두리로 시각적 연결성 제공
  - 그룹 박스는 약간 불투명한 배경색을 가진 넓은 테두리로 표시

### 6.3.2 그룹 가중치 조절

- **슬라이더 접근**: 그룹 내 아무 요소나 클릭하면 그룹 슬라이더 표시
- **상대적 비율 유지 모드**: 기본 활성화 상태
  - 각 요소의 기존 가중치 비율 유지하며 전체적으로 조정
  - 예: [0.5, 1.0, 2.0] 요소들을 2배로 올리면 [1.0, 2.0, 4.0]이 됨
- **절대값 모드**: 옵션 해제 시 활성화
  - 모든 요소에 동일한 절대 가중치 적용
  - 예: 그룹 내 모든 요소를 1.5로 설정

### 6.3.3 그룹 관리

- **그룹 해제**: 
  - 그룹 선택 후 해제 버튼 클릭 시 그룹 전체 한 번에 해제
  - Shift+우클릭으로 개별 요소만 선택적으로 그룹에서 제외 가능
- **이름 지정**: 그룹에 의미 있는 이름 부여 가능
- **색상 커스터마이징**: 그룹 테두리 색상 사용자 지정
- **전체 그룹 목록**: 그룹 관리 패널에서 모든 그룹 확인 및 일괄 조작 가능
- **프리셋 통합**: 모든 그룹 정보(구성, 이름, 색상)가 프리셋에 포함되어 저장 및 로드

## 6.4 고급 가중치 도구 (후순위 개발 항목)

> **개발 참고사항**: 이 섹션의 기능들은 가장 낮은 우선순위로 지정되며, 초기 버전에는 포함되지 않을 수 있습니다. 코어 기능 개발 완료 후 리소스와 필요성에 따라 구현 여부가 결정될 예정입니다.

### 6.4.1 가중치 프로파일

- **텍스트-가중치 페어 관리**:
  - 특정 문구/단어와 해당 가중치 값의 페어셋 저장
  - 와일드카드, 키워드카드를 포함한 모든 텍스트 요소와 그 가중치 쌍 관리
  - 외부 파일로 내보내기 및 가져오기 지원

### 6.4.2 가중치 균형 분석

- **시각적 균형 표시**: 전체 프롬프트의 가중치 분포 그래프
- **문제 영역 강조**: 과도하게 높거나 낮은 가중치 경고
- **최적화 제안**: 이미지 품질 향상을 위한 가중치 조정 추천

### 6.4.3 AI 가중치 제안

- **콘텐츠 기반 분석**: 프롬프트 내용에 기반한 최적 가중치 제안
- **개인화된 학습**: 사용자의 이전 패턴을 학습하여 맞춤형 제안
- **원클릭 적용**: 제안된 가중치 전체 또는 부분 적용 옵션

---

# 7. 프롬프트 컴파일러

## 7.1 컴파일러 개요

프롬프트 컴파일러는 NaiKit의 핵심 엔진으로, 사용자 친화적인 인터페이스와 NovelAI의 이미지 생성 시스템 사이를 연결합니다. 기존 텍스트 기반 프롬프트 방식의 한계를 극복하기 위해, NaiKit은 구조화된 객체 모델을 사용하여 프롬프트의 모든 요소를 표현하고 관리합니다.

### 7.1.1 컴파일러의 주요 역할

- **객체 기반 모델링**: 모든 프롬프트 요소(텍스트, 가중치, 프리셋, 인라인 와일드카드)를 구조화된 세그먼트 객체로 표현
- **시각적 인터페이스 연결**: 
  - 사용자 인터페이스 조작이 직접 세그먼트 객체를 생성/수정
  - 컴포즈 모드: 와일드카드/키워드만 시각적으로 강조하여 내용에 집중
  - 파인튜닝 모드: 모든 세그먼트 유형을 시각화하여 정밀한 제어 제공
- **단일 데이터 소스**: 모든 모드가 동일한 세그먼트 트리를 공유하여 일관성 유지
- **최종 컴파일**: 이미지 생성 직전에만 세그먼트 트리를 NovelAI 호환 텍스트로 변환
- **양방향 동기화**: NaiKit ↔ NovelAI UI 간의 완벽한 동기화 유지
- **오류 처리 및 복구**: 잘못된 입력이나 시스템 불안정성에 대한 견고한 처리

## 7.2 세그먼트 객체 모델

NaiKit은 중간 텍스트 표현을 사용하지 않고 직접 세그먼트 객체 모델을 채택합니다. 모든 프롬프트 요소는 처음부터 구조화된 객체로 저장되고 관리됩니다.

### 7.2.1 세그먼트 객체 기반 설계

모든 프롬프트 요소는 전용 객체로 표현되고 이들이 트리 구조로 연결됩니다:

- **직접 객체 모델**: 중간 텍스트 형식 없이 모든 정보를 구조화된 객체로 표현
- **트리 구조**: 중첩된 요소(가중치 안의 가중치 등)를 자연스럽게 표현
- **UI 직접 연결**: 사용자 인터페이스 조작이 세그먼트 객체를 직접 수정
- **최종 컴파일**: NovelAI 텍스트로의 변환은 이미지 생성 직전에만 수행

#### 7.2.1.1 공통 세그먼트 구조

모든 세그먼트 객체가 공유하는 기본 구조:

```javascript
{
  id: "seg_xxxx",       // 고유 식별자
  type: "segment_type", // 세그먼트 유형 (text, preset, weighted, inline_wildcard)
  children: [],         // 자식 세그먼트 배열 (중첩 구조용)
  metadata: {}          // 추가 메타데이터 (UI 상태, 색상 등)
}
```

### 7.2.2 세그먼트 타입

프롬프트를 구성하는 네 가지 핵심 세그먼트 타입:

#### 7.2.2.1 텍스트 세그먼트

일반 텍스트 내용을 나타내는 가장 기본적인 세그먼트입니다:

```javascript
{
  id: "seg_text_1",
  type: "text",
  content: "일반 텍스트 내용", // 실제 텍스트 내용
  children: []
}
```

#### 7.2.2.2 통합 프리셋 세그먼트

와일드카드와 키워드를 단일 객체 타입으로 통합합니다:

```javascript
{
  id: "seg_preset_1",
  type: "preset",          // 와일드카드와 키워드 모두 동일한 'preset' 타입 사용
  name: "계절",             // 프리셋 이름
  mode: "random",          // "random"(와일드카드) 또는 "fixed"(키워드) - 유일한 차이점
  selected: null,          // 키워드 모드일 때 선택된 항목
  children: [],
  metadata: {
    color: "#3A86FF",
    values: ["봄", "여름", "가을", "겨울"]  // 필요시 프리셋 값 캐싱
  }
}
// 주의: 와일드카드와 키워드는 완전히 동일한 객체 구조를 공유하며, 
// 'mode' 속성만 다릅니다. 이는 두 기능이 동일한 시스템의 서로 다른 모드임을 명확히 보여줍니다.
```

#### 7.2.2.3 가중치 세그먼트

텍스트나 다른 세그먼트의 중요도를 조절합니다:

```javascript
{
  id: "seg_weight_1",
  type: "weighted",
  bracketLevel: 3,         // 양수: 중괄호 개수, 음수: 대괄호 개수
  bracketType: "increase", // "increase" 또는 "decrease"
  displayValue: 1.1576,    // 1.05³ ≈ 1.1576... (UI 표시용)
  children: [              // 가중치가 적용된 내용 (하나 이상의 세그먼트)
    { id: "seg_text_2", type: "text", content: "중요한 텍스트" }
  ],
  metadata: {
    color: "#8ECAE6",
    intensity: 0.6         // 색상 강도 (0-1)
  }
}
```

#### 7.2.2.4 인라인 와일드카드 세그먼트

괄호와 파이프로 표현되는 인라인 선택 옵션입니다:

```javascript
{
  id: "seg_inline_1",
  type: "inline_wildcard",
  options: ["빨간", "파란", "노란"],  // 선택 가능한 옵션들
  children: [],
  metadata: {
    color: "#FFB703"
  }
}
```

### 7.2.3 그룹 객체 모델

관련된 세그먼트를 함께 관리하기 위한 별도의 객체 구조입니다:

```javascript
{
  id: "group_1",
  name: "주요 요소",         // 그룹 이름
  segmentIds: [            // 그룹에 포함된 세그먼트 ID 목록
    "seg_weight_1", 
    "seg_preset_1"
  ],
  weightMode: "relative",  // "relative" 또는 "absolute"
  color: "#FF9F1C"         // 그룹 색상
}
```

## 7.3 입력 처리 시스템

다양한 소스의 입력을 세그먼트 객체로 변환하는 시스템입니다.

### 7.3.1 사용자 입력 흐름

사용자 인터페이스에서의 입력이 세그먼트 객체로 변환되는 과정:

#### 7.3.1.1 텍스트 입력

일반 텍스트 입력은 즉시 텍스트 세그먼트로 변환됩니다:

- **키보드 입력**: 사용자 타이핑은 즉시 텍스트 세그먼트로 변환 또는 업데이트
- **붙여넣기**: 클립보드 텍스트는 적절히 파싱되어 세그먼트로 변환
- **텍스트 편집**: 기존 텍스트 수정은 해당 세그먼트 직접 업데이트

#### 7.3.1.2 특수 요소 생성

UI 기능을 통한 특수 세그먼트 생성:

- **가중치 적용**: 
  1. 텍스트 선택
  2. 가중치 슬라이더 표시
  3. 슬라이더 조절
  4. 가중치 세그먼트 자동 생성 (선택된 텍스트를 자식으로 포함)

- **프리셋 삽입**:
  1. `!` 입력으로 프리셋 목록 표시
  2. 프리셋 선택
  3. 와일드카드 또는 키워드 모드 선택
  4. 프리셋 세그먼트 자동 생성

- **인라인 와일드카드**:
  1. `(` 입력 시 특수 모드 활성화
  2. 옵션 입력 및 `|`로 구분
  3. `)` 입력으로 완료
  4. 인라인 와일드카드 세그먼트 자동 생성

### 7.3.2 NovelAI 프롬프트 가져오기

기존 NovelAI 프롬프트를 세그먼트 객체로 변환:

#### 7.3.2.1 가중치 구문 파싱

NovelAI의 가중치 구문을 세그먼트로 변환:

- **중괄호 가중치**: `{텍스트}`, `{{텍스트}}` 등을 가중치 세그먼트로 변환
- **대괄호 가중치**: `[텍스트]`, `[[텍스트]]` 등을 가중치 세그먼트로 변환
- **중첩 구조**: `{중요한 {매우 중요한} 단어}` 같은 중첩 구조를 계층적 세그먼트로 변환

#### 7.3.2.2 파싱 알고리즘

스택 기반의 효율적인 파싱 알고리즘:

```javascript
function parseNovelAIPrompt(text) {
  const root = { type: "root", children: [] };
  const stack = [root];
  let currentText = "";
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // 가중치 시작 감지
    if (char === '{' || char === '[') {
      // 현재까지의 텍스트 처리
      if (currentText) {
        stack[stack.length - 1].children.push({
          type: "text",
          content: currentText
        });
        currentText = "";
      }
      
      // 새 가중치 세그먼트 생성
      const weightSegment = {
        type: "weighted",
        bracketType: char === '{' ? "increase" : "decrease",
        bracketLevel: 1,
        children: []
      };
      
      // 스택에 추가
      stack.push(weightSegment);
    }
    // 가중치 종료 감지
    else if (char === '}' || char === ']') {
      // 현재까지의 텍스트 처리
      if (currentText) {
        stack[stack.length - 1].children.push({
          type: "text",
          content: currentText
        });
        currentText = "";
      }
      
      // 스택에서 최상위 세그먼트 꺼내기
      if (stack.length > 1) {
        const segment = stack.pop();
        // 올바른 종료 괄호인지 확인
        const isValid = (segment.bracketType === "increase" && char === '}') ||
                        (segment.bracketType === "decrease" && char === ']');
        
        if (!isValid) {
          // 오류 처리: 괄호 쌍 불일치
        }
        
        // 부모 세그먼트에 추가
        stack[stack.length - 1].children.push(segment);
      }
    }
    // 일반 텍스트
    else {
      currentText += char;
    }
  }
  
  // 남은 텍스트 처리
  if (currentText) {
    stack[stack.length - 1].children.push({
      type: "text",
      content: currentText
    });
  }
  
  // 스택이 깨끗하게 비워졌는지 확인
  if (stack.length > 1) {
    // 오류 처리: 닫히지 않은 괄호
  }
  
  // 연속된 가중치 처리 및 최적화
  optimizeSegmentTree(root);
  
  return root;
}
```

### 7.3.3 세그먼트 객체 조작

세그먼트 객체의 효율적인 생성 및 관리:

#### 7.3.3.1 세그먼트 생성

새 세그먼트 객체 생성 및 트리 삽입:

```javascript
function createSegment(type, properties = {}) {
  return {
    id: generateUniqueId(),
    type,
    children: [],
    ...properties
  };
}

function insertSegment(parent, newSegment, index = -1) {
  if (!parent.children) {
    parent.children = [];
  }
  
  if (index === -1 || index >= parent.children.length) {
    parent.children.push(newSegment);
  } else {
    parent.children.splice(index, 0, newSegment);
  }
  
  return newSegment;
}
```

#### 7.3.3.2 세그먼트 탐색

ID 또는 조건으로 세그먼트 찾기:

```javascript
function findSegmentById(root, id) {
  if (root.id === id) return root;
  
  if (root.children) {
    for (const child of root.children) {
      const found = findSegmentById(child, id);
      if (found) return found;
    }
  }
  
  return null;
}

function findSegments(root, predicate) {
  const results = [];
  
  function traverse(node) {
    if (predicate(node)) {
      results.push(node);
    }
    
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }
  
  traverse(root);
  return results;
}
```

#### 7.3.3.3 세그먼트 조작

세그먼트 객체 업데이트 및 변환:

```javascript
function updateSegment(segment, properties) {
  // 타입은 변경 불가
  const { type, ...updateProps } = properties;
  
  Object.assign(segment, updateProps);
  
  // 특수 속성에 따른 부가 계산
  if (segment.type === 'weighted' && 
      (properties.bracketLevel !== undefined || 
       properties.bracketType !== undefined)) {
    // 표시값 재계산
    segment.displayValue = calculateDisplayValue(
      segment.bracketLevel,
      segment.bracketType
    );
  }
  
  return segment;
}

function removeSegment(root, id) {
  if (!root.children) return false;
  
  const index = root.children.findIndex(child => child.id === id);
  
  if (index !== -1) {
    // 직접 자식인 경우
    root.children.splice(index, 1);
    return true;
  }
  
  // 하위 자식에서 검색
  for (const child of root.children) {
    if (removeSegment(child, id)) {
      return true;
    }
  }
  
  return false;
}
```

#### 7.3.3.4 텍스트 세그먼트 분할 및 병합

텍스트 편집에 필요한 세그먼트 분할 및 병합:

```javascript
function splitTextSegment(segment, position) {
  if (segment.type !== 'text') return null;
  
  const leftContent = segment.content.substring(0, position);
  const rightContent = segment.content.substring(position);
  
  // 원본 세그먼트 내용 갱신
  segment.content = leftContent;
  
  // 새 세그먼트 생성
  const newSegment = createSegment('text', {
    content: rightContent
  });
  
  return newSegment;
}

function mergeAdjacentTextSegments(parent) {
  if (!parent.children || parent.children.length < 2) return false;
  
  let modified = false;
  
  for (let i = 0; i < parent.children.length - 1; i++) {
    const current = parent.children[i];
    const next = parent.children[i + 1];
    
    if (current.type === 'text' && next.type === 'text') {
      // 텍스트 세그먼트 병합
      current.content += next.content;
      parent.children.splice(i + 1, 1);
      modified = true;
      i--; // 병합 후 인덱스 조정
    }
  }
  
  return modified;
}
```

## 7.4 가중치 처리 시스템

NovelAI의 양자화된 가중치 시스템을 정확하게 구현합니다.

### 7.4.1 양자화된 가중치 모델

NovelAI 가중치는 1.05의 거듭제곱 형태로만 표현됩니다:

- **증가 가중치**:
  - 1.05¹ = 1.05 (한 개 중괄호)
  - 1.05² = 1.1025 (두 개 중괄호)
  - 최대 78개 중괄호: 1.05^78 ≈ 45.0

- **감소 가중치**:
  - 1.05⁻¹ ≈ 0.952 (한 개 대괄호)
  - 1.05⁻² ≈ 0.907 (두 개 대괄호)
  - 최대 78개 대괄호: 1.05^(-78) ≈ 0.02

### 7.4.2 가중치 변환 시스템

가중치 값과 괄호 수 간의 변환을 효율적으로 처리합니다:

#### 7.4.2.1 가중치 → 괄호 변환

UI 슬라이더에서 설정한 가중치 값을 괄호 수준으로 변환:

```javascript
function convertWeightToBrackets(weight) {
  // 중립 가중치 (1.0)
  if (weight === 1.0) {
    return { type: 'increase', level: 0 };
  }
  
  // 증가 또는 감소 결정
  const isIncrease = weight > 1.0;
  
  // 레벨 계산 (양자화)
  let level;
  if (isIncrease) {
    level = Math.round(Math.log(weight) / Math.log(1.05));
  } else {
    level = -Math.round(Math.log(1/weight) / Math.log(1.05));
  }
  
  // 제한: -78 ~ 78
  level = Math.max(-78, Math.min(78, level));
  
  return {
    type: isIncrease ? 'increase' : 'decrease',
    level: Math.abs(level) * (isIncrease ? 1 : -1)
  };
}
```

#### 7.4.2.2 괄호 → 가중치 변환

괄호 수준을 정확한 가중치 값으로 변환:

```javascript
function calculateDisplayValue(bracketLevel, bracketType) {
  // 중립 가중치
  if (bracketLevel === 0) return 1.0;
  
  // 가중치 계산
  if (bracketType === 'increase') {
    return Math.pow(1.05, bracketLevel);
  } else {
    return Math.pow(1.05, -bracketLevel);
  }
}
```

#### 7.4.2.3 슬라이더 값 양자화

연속적인 슬라이더 값을 가장 가까운 유효 가중치로 변환:

```javascript
// 미리 계산된 룩업 테이블 생성
const WEIGHT_MAPPING = createWeightMappingTable();

function findClosestQuantizedWeight(targetWeight) {
  // 중립 가중치
  if (targetWeight === 1.0) {
    return { type: 'increase', level: 0, value: 1.0 };
  }
  
  const isIncrease = targetWeight > 1.0;
  
  // 정확한 레벨 계산 (반올림 전)
  let exactLevel;
  if (isIncrease) {
    exactLevel = Math.log(targetWeight) / Math.log(1.05);
  } else {
    exactLevel = -Math.log(1/targetWeight) / Math.log(1.05);
  }
  
  // 가장 가까운 정수 레벨 두 개
  const lowerLevel = Math.floor(Math.abs(exactLevel));
  const upperLevel = Math.ceil(Math.abs(exactLevel));
  
  // 각 레벨의 가중치 값
  const lowerWeight = isIncrease 
    ? Math.pow(1.05, lowerLevel) 
    : Math.pow(1.05, -lowerLevel);
    
  const upperWeight = isIncrease 
    ? Math.pow(1.05, upperLevel) 
    : Math.pow(1.05, -upperLevel);
  
  // 더 가까운 값 선택
  const lowerDiff = Math.abs(targetWeight - lowerWeight);
  const upperDiff = Math.abs(targetWeight - upperWeight);
  
  if (lowerDiff <= upperDiff) {
    return {
      type: isIncrease ? 'increase' : 'decrease',
      level: lowerLevel * (isIncrease ? 1 : -1),
      value: lowerWeight
    };
  } else {
    return {
      type: isIncrease ? 'increase' : 'decrease',
      level: upperLevel * (isIncrease ? 1 : -1),
      value: upperWeight
    };
  }
}
```

### 7.4.3 가중치 세그먼트 생성 및 조작

가중치 세그먼트의 생성과 조작 프로세스:

#### 7.4.3.1 가중치 세그먼트 생성

텍스트 선택 시 가중치 세그먼트 생성:

1. **텍스트 선택**: 사용자가 텍스트 영역 선택
2. **가중치 UI 표시**: 선택 완료 시 가중치 슬라이더 표시
3. **가중치 설정**: 사용자가 슬라이더로 가중치 값 설정
4. **세그먼트 변환**:
   - 선택 영역을 가중치 세그먼트로 변환
   - 원본 텍스트를 가중치 세그먼트의 자식으로 이동

```javascript
function createWeightedSegment(selectedSegments, bracketInfo) {
  // 가중치 세그먼트 생성
  const weightedSegment = createSegment('weighted', {
    bracketType: bracketInfo.type,
    bracketLevel: Math.abs(bracketInfo.level),
    displayValue: calculateDisplayValue(
      Math.abs(bracketInfo.level),
      bracketInfo.type
    ),
    children: selectedSegments
  });
  
  return weightedSegment;
}
```

#### 7.4.3.2 가중치 값 조정

기존 가중치 세그먼트의 값 조정:

```javascript
function adjustSegmentWeight(segment, newWeight) {
  if (segment.type !== 'weighted') return false;
  
  // 가장 가까운 양자화된 가중치 찾기
  const bracketInfo = findClosestQuantizedWeight(newWeight);
  
  // 세그먼트 업데이트
  updateSegment(segment, {
    bracketType: bracketInfo.type,
    bracketLevel: Math.abs(bracketInfo.level),
    displayValue: bracketInfo.value
  });
  
  return true;
}
```

### 7.4.4 중첩 가중치 처리

가중치 세그먼트 내에 다른 가중치 세그먼트가 중첩된 경우:

- **트리 구조 활용**: 가중치 세그먼트가 다른 가중치 세그먼트를 자식으로 포함
- **유효 가중치 계산**: 부모에서 자식으로 내려가며 가중치 값 누적 곱 계산
- **시각적 표현**: 중첩 구조를 계층적으로 표시하여 사용자가 이해하기 쉽게 함

```javascript
function calculateEffectiveWeight(segment, parentWeight = 1.0) {
  if (segment.type !== 'weighted') {
    return parentWeight;
  }
  
  // 현재 세그먼트의 가중치 값
  const currentWeight = segment.displayValue;
  
  // 누적 가중치 계산
  const effectiveWeight = parentWeight * currentWeight;
  
  return effectiveWeight;
}
```

### 7.4.5 그룹 가중치 조정

여러 세그먼트의 가중치를 동시에 조정:

- **상대적 모드**: 기존 가중치 비율 유지하며 모든 세그먼트 스케일링
- **절대적 모드**: 모든 세그먼트에 동일한 가중치 값 적용
- **양자화 적용**: 결과 값을 항상 1.05의 거듭제곱으로 양자화

```javascript
function adjustGroupWeights(group, targetWeight, mode = 'relative') {
  const weightedSegments = group.segmentIds
    .map(id => findSegmentById(rootSegment, id))
    .filter(seg => seg && seg.type === 'weighted');
  
  if (weightedSegments.length === 0) return false;
  
  if (mode === 'absolute') {
    // 절대 모드: 모든 세그먼트를 동일한 가중치로 설정
    const bracketInfo = findClosestQuantizedWeight(targetWeight);
    
    weightedSegments.forEach(segment => {
      updateSegment(segment, {
        bracketType: bracketInfo.type,
        bracketLevel: Math.abs(bracketInfo.level),
        displayValue: bracketInfo.value
      });
    });
  } else {
    // 상대 모드: 기존 비율 유지하며 스케일링
    const scaleFactor = targetWeight;
    
    weightedSegments.forEach(segment => {
      const newWeight = segment.displayValue * scaleFactor;
      const bracketInfo = findClosestQuantizedWeight(newWeight);
      
      updateSegment(segment, {
        bracketType: bracketInfo.type,
        bracketLevel: Math.abs(bracketInfo.level),
        displayValue: bracketInfo.value
      });
    });
  }
  
  return true;
}
```

## 7.5 컴파일 시스템

세그먼트 객체 모델을 NovelAI 호환 텍스트로 변환합니다.

### 7.5.1 컴파일 프로세스

세그먼트 트리를 순회하며 NovelAI 텍스트로 변환:

```javascript
function compileSegmentTree(rootSegment, options = {}) {
  const expandWildcards = options.expandWildcards || false;
  const randomSeed = options.seed || Date.now();
  
  // 난수 생성기 (시드 기반)
  const random = createSeededRandom(randomSeed);
  
  function processSegment(segment) {
    if (!segment) return '';
    
    // 세그먼트 타입별 처리
    switch (segment.type) {
      case 'text':
        return segment.content || '';
        
      case 'preset':
        return compilePresetSegment(segment, random, expandWildcards);
        
      case 'weighted':
        // 자식 먼저 처리
        const content = segment.children
          .map(child => processSegment(child))
          .join('');
        
        // 가중치 적용
        return applyBrackets(content, segment);
        
      case 'inline_wildcard':
        return compileInlineWildcard(segment, random, expandWildcards);
        
      default:
        // 알 수 없는 타입은 자식만 처리
        if (segment.children && segment.children.length > 0) {
          return segment.children.map(processSegment).join('');
        }
        return '';
    }
  }
  
  return processSegment(rootSegment);
}
```

### 7.5.2 세그먼트 타입별 컴파일 규칙

각 세그먼트 타입을 NovelAI 텍스트로 변환하는 규칙:

#### 7.5.2.1 텍스트 세그먼트

텍스트 세그먼트는 내용을 그대로 사용합니다:

```javascript
// 텍스트 세그먼트 처리
if (segment.type === 'text') {
  return segment.content || '';
}
```

#### 7.5.2.2 프리셋 세그먼트

프리셋 세그먼트는 모드에 따라 다르게 처리합니다:

```javascript
function compilePresetSegment(segment, random, expandWildcards) {
  if (segment.mode === 'random') {
    // 와일드카드 모드
    if (expandWildcards) {
      // 프리셋 값 가져오기
      const values = segment.metadata?.values || 
                     fetchPresetValues(segment.name);
      
      // 무작위 선택
      if (values && values.length > 0) {
        const randomIndex = Math.floor(random() * values.length);
        return values[randomIndex];
      }
      
      return `[ERROR:빈 와일드카드-${segment.name}]`;
    } else {
      // 확장하지 않고 원본 표현 유지
      return `!${segment.name}`;
    }
  } else {
    // 키워드 모드
    if (!segment.selected) {
      return `[ERROR:선택되지 않은 키워드-${segment.name}]`;
    }
    
    return `${segment.name}:${segment.selected}`;
  }
}
```

#### 7.5.2.3 가중치 세그먼트

가중치 세그먼트는 내용을 적절한 개수의 중괄호/대괄호로 감쌉니다:

```javascript
function applyBrackets(content, segment) {
  // 중립 가중치(1.0)는 그대로 반환
  if (segment.bracketLevel === 0) {
    return content;
  }
  
  // 괄호 문자 선택
  const bracket = segment.bracketType === 'increase' ? '{}' : '[]';
  
  // 괄호로 감싸기
  let result = content;
  for (let i = 0; i < segment.bracketLevel; i++) {
    result = bracket[0] + result + bracket[1];
  }
  
  return result;
}
```

#### 7.5.2.4 인라인 와일드카드 세그먼트

인라인 와일드카드는 옵션을 괄호와 파이프로 표현하거나 무작위로 선택합니다:

```javascript
function compileInlineWildcard(segment, random, expandWildcards) {
  if (expandWildcards) {
    // 무작위 옵션 선택
    if (segment.options && segment.options.length > 0) {
      const randomIndex = Math.floor(random() * segment.options.length);
      return segment.options[randomIndex];
    }
    
    return '';
  } else {
    // 원본 형식 유지
    return `(${segment.options.join('|')})`;
  }
}
```

### 7.5.3 와일드카드 확장 시스템

와일드카드와 인라인 와일드카드 확장을 위한 시스템:

- **무작위 선택**: 시드 기반 난수 생성기로 재현 가능한 무작위 선택
- **확장 타이밍**: 이미지 생성 직전에만 와일드카드 확장
- **중첩 와일드카드**: 재귀적으로 내부에서 외부로 확장

```javascript
// 시드 기반 난수 생성기
function createSeededRandom(seed) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// 중첩 와일드카드 확장
function expandNestedWildcards(text, random, depth = 0) {
  if (depth > 10) {
    return '[최대 중첩 깊이 초과]';
  }
  
  // 인라인 와일드카드 패턴 검색
  return text.replace(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, (match, options) => {
    const choices = parseInlineOptions(options);
    
    if (choices.length === 0) return '';
    
    // 무작위 선택
    const selected = choices[Math.floor(random() * choices.length)];
    
    // 선택된 옵션에 중첩된 와일드카드가 있는지 확인하고 재귀적으로 처리
    return expandNestedWildcards(selected, random, depth + 1);
  });
}
```

### 7.5.4 컴파일 최적화

효율적인 컴파일 처리를 위한 최적화 기법:

#### 7.5.4.1 증분 컴파일

변경된 부분만 재컴파일하여 성능 향상:

```javascript
function incrementalCompile(rootSegment, lastCompiledVersion, changedSegmentIds) {
  // 변경되지 않은 경우 캐시된 결과 사용
  if (lastCompiledVersion && changedSegmentIds.length === 0) {
    return cachedCompilationResults.get(rootSegment.id);
  }
  
  // 변경된 세그먼트 상위 경로 찾기
  const affectedPaths = findAffectedPaths(rootSegment, changedSegmentIds);
  
  // 선택적 재컴파일
  if (affectedPaths.length > 0 && lastCompiledVersion) {
    // 영향받는 부분만 재컴파일
    for (const path of affectedPaths) {
      const segmentId = path[path.length - 1];
      const segment = findSegmentById(rootSegment, segmentId);
      
      if (segment) {
        const compiledSegment = compileSegmentTree(segment);
        updateCompiledCache(segmentId, compiledSegment);
      }
    }
    
    // 전체 결과 재구성
    return reconstructCompiledResult(rootSegment);
  }
  
  // 전체 컴파일
  return compileSegmentTree(rootSegment);
}
```

#### 7.5.4.2 컴파일 결과 캐싱

동일 세그먼트에 대한 컴파일 결과 재사용:

```javascript
// 컴파일 결과 캐시
const compilationCache = new Map();

function getCachedCompilation(segmentId, parameters) {
  const cacheKey = `${segmentId}_${JSON.stringify(parameters)}`;
  return compilationCache.get(cacheKey);
}

function cacheCompilationResult(segmentId, parameters, result) {
  const cacheKey = `${segmentId}_${JSON.stringify(parameters)}`;
  
  // 캐시 크기 제한
  if (compilationCache.size > MAX_CACHE_SIZE) {
    // LRU 캐시 정리 로직
    pruneCache();
  }
  
  compilationCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
}
```

## 7.6 모드 통합 시스템

컴포즈 모드와 파인튜닝 모드 간의 원활한 전환 및 일관성 유지:

### 7.6.1 모드별 세그먼트 시각화

동일한 세그먼트 객체를 모드에 따라 다르게 렌더링:

```javascript
function renderSegment(segment, mode) {
  if (mode === 'compose') {
    return renderComposeSegment(segment);
  } else {
    return renderFineTuneSegment(segment);
  }
}

function renderComposeSegment(segment) {
  switch (segment.type) {
    case 'text':
      return renderTextSegment(segment);
      
    case 'preset':
      return renderPresetSegment(segment);
      
    case 'weighted':
      // 컴포즈 모드에서는 가중치 시각화하지 않고 자식만 표시
      return renderChildrenOnly(segment);
      
    case 'inline_wildcard':
      return renderInlineWildcardSegment(segment);
      
    default:
      return renderTextSegment({ 
        content: segment.content || '',
        id: segment.id 
      });
  }
}

function renderFineTuneSegment(segment) {
  switch (segment.type) {
    case 'text':
      return renderTextSegment(segment);
      
    case 'preset':
      return renderPresetSegment(segment);
      
    case 'weighted':
      // 파인튜닝 모드에서는 가중치 시각화
      return renderWeightedSegment(segment);
      
    case 'inline_wildcard':
      return renderInlineWildcardSegment(segment);
      
    default:
      return renderTextSegment({ 
        content: segment.content || '',
        id: segment.id 
      });
  }
}
```

### 7.6.2 모드 상태 관리

모드 전환 시 상태 보존:

```javascript
// 모드 관리자
const ModeManager = {
  currentMode: 'compose', // 'compose' 또는 'finetune'
  
  // 모드별 상태
  modeState: {
    compose: {
      cursorPosition: null,
      scrollPosition: null,
      selectedRange: null
    },
    finetune: {
      cursorPosition: null,
      scrollPosition: null,
      selectedRange: null,
      activeSegmentId: null
    }
  },
  
  // 모드 전환
  switchMode(newMode) {
    // 현재 모드 상태 저장
    this.saveCurrentModeState();
    
    // 모드 전환
    const oldMode = this.currentMode;
    this.currentMode = newMode;
    
    // 새 모드 상태 복원
    this.restoreModeState();
    
    // 이벤트 발생
    this.emitModeChangeEvent(oldMode, newMode);
    
    return true;
  },
  
  // 현재 모드 상태 저장
  saveCurrentModeState() {
    // 에디터에서 커서 위치, 스크롤 위치 등 저장
    const editor = document.querySelector('.naikit-prompt-editor');
    if (!editor) return;
    
    this.modeState[this.currentMode] = {
      cursorPosition: editor.selectionStart,
      scrollPosition: editor.scrollTop,
      selectedRange: [editor.selectionStart, editor.selectionEnd],
      // 파인튜닝 모드 전용 상태
      ...(this.currentMode === 'finetune' && {
        activeSegmentId: getCurrentActiveSegmentId()
      })
    };
  },
  
  // 모드 상태 복원
  restoreModeState() {
    const editor = document.querySelector('.naikit-prompt-editor');
    if (!editor) return;
    
    const state = this.modeState[this.currentMode];
    if (state) {
      // 커서 위치 및 선택 복원
      if (state.selectedRange) {
        editor.setSelectionRange(state.selectedRange[0], state.selectedRange[1]);
      }
      
      // 스크롤 위치 복원
      if (state.scrollPosition !== null) {
        editor.scrollTop = state.scrollPosition;
      }
      
      // 파인튜닝 모드 특수 상태 복원
      if (this.currentMode === 'finetune' && state.activeSegmentId) {
        activateSegment(state.activeSegmentId);
      }
    }
  }
};
```

### 7.6.3 모드 전환 UI

모드 전환을 위한 사용자 인터페이스:

- **모드 전환 버튼**: 컴포즈/파인튜닝 모드 간 전환
- **시각적 피드백**: 현재 모드를 명확히 표시
- **키보드 단축키**: 빠른 모드 전환을 위한 단축키(예: Ctrl+W)

```javascript
// 모드 전환 버튼 이벤트 리스너
document.querySelector('.mode-toggle-button').addEventListener('click', () => {
  const newMode = ModeManager.currentMode === 'compose' ? 'finetune' : 'compose';
  ModeManager.switchMode(newMode);
});

// 키보드 단축키
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'w') {
    const newMode = ModeManager.currentMode === 'compose' ? 'finetune' : 'compose';
    ModeManager.switchMode(newMode);
    e.preventDefault();
  }
});
```

## 7.7 NovelAI 동기화 시스템

NaiKit과 NovelAI 인터페이스 간의 양방향 동기화:

### 7.7.1 NaiKit → NovelAI 동기화

세그먼트 모델 변경을 NovelAI 인터페이스에 반영:

```javascript
// NaiKit → NovelAI 동기화 시스템
const NaiKitToNovelAISync = {
  // 변경 감지 플래그
  pendingUpdates: {},
  
  // 프롬프트 업데이트 예약
  scheduleUpdate(fieldKey, value) {
    this.pendingUpdates[fieldKey] = value;
    
    // 디바운스 처리
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    
    this.updateTimeout = setTimeout(() => {
      this.applyPendingUpdates();
    }, 100); // 100ms 지연
  },
  
  // 모든 대기 중인 업데이트 적용
  applyPendingUpdates() {
    for (const [fieldKey, value] of Object.entries(this.pendingUpdates)) {
      this.updateNovelAIField(fieldKey, value);
    }
    
    this.pendingUpdates = {};
    this.updateTimeout = null;
  },
  
  // NovelAI 필드 업데이트
  updateNovelAIField(fieldKey, value) {
    // 필드 요소 찾기
    const element = this.getNovelAIFieldElement(fieldKey);
    if (!element) return false;
    
    // 값 업데이트 및 변경 이벤트 발생
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    
    return true;
  },
  
  // 필드 요소 찾기 (캐릭터 필드 등 특수 처리 포함)
  getNovelAIFieldElement(fieldKey) {
    // 캐릭터 필드 특수 처리
    if (fieldKey.startsWith('character_')) {
      const [_, charIndex, promptType] = fieldKey.split('_');
      return this.getCharacterFieldElement(parseInt(charIndex), promptType);
    }
    
    // 기본 필드 매핑
    const selectors = {
      mainPositive: '.novelai-positive-prompt textarea',
      mainNegative: '.novelai-negative-prompt textarea'
    };
    
    return document.querySelector(selectors[fieldKey]);
  },
  
  // 전체 동기화 실행
  syncAllPrompts(segmentTree) {
    // 컴파일 옵션 (와일드카드 확장 없음)
    const options = { expandWildcards: false };
    
    // 메인 프롬프트 컴파일 및 동기화
    const mainPositive = compileMainPrompt(segmentTree, 'positive', options);
    const mainNegative = compileMainPrompt(segmentTree, 'negative', options);
    
    this.scheduleUpdate('mainPositive', mainPositive);
    this.scheduleUpdate('mainNegative', mainNegative);
    
    // 캐릭터 프롬프트 컴파일 및 동기화
    const characters = compileCharacterPrompts(segmentTree, options);
    
    characters.forEach((char, index) => {
      this.scheduleUpdate(`character_${index}_positive`, char.positive);
      this.scheduleUpdate(`character_${index}_negative`, char.negative);
    });
  }
};
```

### 7.7.2 NovelAI → NaiKit 동기화

NovelAI 인터페이스 변경을 NaiKit에 반영:

```javascript
// NovelAI → NaiKit 동기화 시스템
const NovelAIToNaiKitSync = {
  // 관찰 중인 필드
  observedFields: [
    {
      selector: '.novelai-positive-prompt textarea',
      fieldKey: 'mainPositive'
    },
    {
      selector: '.novelai-negative-prompt textarea',
      fieldKey: 'mainNegative'
    }
    // 캐릭터 필드는 동적으로 추가
  ],
  
  // 관찰 시작
  startObserving() {
    // 각 필드에 이벤트 리스너 등록
    this.observedFields.forEach(field => {
      const element = document.querySelector(field.selector);
      if (!element) return;
      
      const listener = event => {
        this.handleFieldChange(field.fieldKey, event.target.value);
      };
      
      element.addEventListener('input', listener);
      this.fieldListeners = this.fieldListeners || new Map();
      this.fieldListeners.set(element, listener);
    });
    
    // 캐릭터 패널 변경 감지
    this.observeCharacterPanels();
  },
  
  // 필드 변경 처리
  handleFieldChange(fieldKey, value) {
    // NaiKit에서 시작된 변경 무시 (순환 방지)
    if (NaiKitToNovelAISync.pendingUpdates[fieldKey] === value) {
      return;
    }
    
    // 텍스트를 세그먼트 트리로 파싱
    if (fieldKey === 'mainPositive') {
      updateMainPrompt('positive', value);
    } else if (fieldKey === 'mainNegative') {
      updateMainPrompt('negative', value);
    } else if (fieldKey.startsWith('character_')) {
      const [_, charIndex, promptType] = fieldKey.split('_');
      updateCharacterPrompt(parseInt(charIndex), promptType, value);
    }
  },
  
  // 텍스트를 세그먼트 트리로 변환
  parseTextToSegmentTree(text, existingRoot = null) {
    // NovelAI 가중치 구문 파싱
    const result = parseNovelAIPrompt(text);
    
    // 기존 트리가 있으면 병합
    if (existingRoot) {
      return mergeSegmentTrees(existingRoot, result);
    }
    
    return result;
  }
};
```

### 7.7.3 충돌 해결

양측 동시 변경 시 충돌 해결:

```javascript
function resolveConflicts(localTree, remoteTree) {
  // 변경된 세그먼트 식별
  const localChanges = identifyChanges(localTree);
  const remoteChanges = identifyChanges(remoteTree);
  
  // 충돌 세그먼트 찾기
  const conflicts = findConflicts(localChanges, remoteChanges);
  
  if (conflicts.length === 0) {
    // 충돌 없음: 변경사항 병합
    return mergeChanges(localTree, remoteChanges);
  }
  
  // 충돌 해결 전략
  return resolveStrategy(localTree, remoteTree, conflicts);
}
```

## 7.8 확장성 및 미래 개발

지속적인 개발과 확장을 위한 설계:

### 7.8.1 확장 가능한 아키텍처

- **모듈식 설계**: 명확한 책임 분리로 독립적 개발 가능
- **플러그인 시스템**: 핵심 변경 없이 새 기능 추가 가능
- **버전 관리**: 이전 버전과의 호환성 유지

### 7.8.2 구현 로드맵

단계적 개발을 위한 우선순위:

1. **핵심 모델**: 세그먼트 객체 모델 및 기본 CRUD 구현
2. **기본 컴파일러**: 세그먼트 → NovelAI 텍스트 변환
3. **모드 시스템**: 컴포즈/파인튜닝 모드 전환
4. **가중치 시스템**: 양자화된 가중치 처리
5. **통합 프리셋**: 와일드카드 및 키워드 기능
6. **인라인 와일드카드**: 인라인 선택 옵션
7. **그룹 관리**: 세그먼트 그룹화 및 그룹 가중치
8. **양방향 동기화**: NovelAI ↔ NaiKit 동기화
9. **성능 최적화**: 메모리 및 이벤트 최적화
10. **오류 처리**: 견고한 오류 처리 및 복구

---

# 8. 이미지 생성 시스템

## 8.1 기본 생성 기능

### 8.1.1 단일 생성 모드

- **생성 버튼**: 현재 설정으로 이미지 한 번 생성
- **배치 크기**: 설정된 배치 크기만큼 이미지 생성
- **프로그래매틱 실행**: NovelAI 생성 버튼 자동 클릭

### 8.1.2 결과 피드백

- **생성 상태**: 현재 생성 진행 상황 표시
- **Anlas 소모**: 사용된 캐시 포인트 표시
- **오류 처리**: 생성 실패 시 적절한 피드백 제공

## 8.2 자동 생성 기능

NovelAI가 자체적으로 제공하지 않는 자동 연속 생성 기능을 구현합니다.

### 8.2.1 기본 자동 생성

- **시작/중지 버튼**: 자동 생성 시작 및 중단
- **생성 간격**: 서버 부하 및 스팸 방지를 위한 적절한 대기 시간
- **완료 감지**: 이미지 생성 완료 자동 감지

### 8.2.2 고급 자동화 옵션

- **횟수 제한**: 특정 횟수만큼만 생성
- **무한 모드**: 중단할 때까지 계속 생성
- **진행 상황**: 현재까지 생성된 이미지 수 및 진행률 표시
- **조건부 중단**: 설정된 조건 만족 시 자동 중단(예: Anlas 부족)

## 8.3 리소스 관리

### 8.3.1 Anlas(캐시 포인트) 추적

- **현재 잔액**: 사용자의 현재 Anlas 실시간 표시 from NAI사이트
- **예상 소모량**: 현재 설정으로 생성 시 소모될 Anlas 표시 from NAI사이트
- **경고 시스템**: 잔액 부족 시 사전 경고

### 8.3.2 설정 최적화 (후순위 개발 항목)

- **배치 효율성**: 최적의 배치 크기 추천
- **해상도 제안**: Anlas 효율성 기준 해상도 제안
- **비용 계산기**: 다양한 설정의 Anlas 소모량 비교

---

# 9. 사용자 워크플로우

## 9.1 일반 사용 시나리오

### 9.1.1 새 이미지 생성 흐름

1. **프롬프트 작성**: 컴포즈 모드에서 기본 프롬프트 작성
2. **와일드카드/키워드 적용**: 필요한 와일드카드 및 키워드 삽입
3. **가중치 조정**: 파인튜닝 모드로 전환하여 가중치 설정
4. **이미지 설정**: 해상도 및 배치 크기 설정
5. **생성 및 평가**: 이미지 생성 및 결과 확인
6. **프리셋 저장**: 마음에 드는 설정 저장

### 9.1.2 프리셋 기반 워크플로우

1. **프리셋 검색**: 원하는 효과에 맞는 프리셋 검색
2. **선택적 로드**: 필요한 프리셋 부분만 로드
3. **미세 조정**: 특정 프롬프트 요소 수정
4. **생성 및 반복**: 이미지 생성, 필요시 조정, 재생성

## 9.2 고급 워크플로우

### 9.2.1 배치 탐색

1. **와일드카드 활용**: 다양한 변형을 위한 와일드카드 설정
2. **자동 생성**: 무한 모드로 다양한 변형 탐색
3. **선별 및 반복**: 좋은 결과 발견 시 설정 저장, 세부 조정

### 9.2.2 정밀 튜닝

1. **기본 결과 생성**: 초기 프롬프트로 이미지 생성
2. **가중치 분석**: 결과 평가 및 가중치 균형 확인
3. **그룹 관리**: 관련 요소 그룹화 및 전체 가중치 조정
4. **점진적 개선**: 미세 조정을 통한 결과 최적화

---

# 10. 기술 구현 세부사항

## 10.1 크롬 확장 기본 구조

- **manifest.json**: 최신 버전(V3) 적용 및 권한 설정
- **Content Scripts**: NovelAI 페이지 내 스크립트 삽입
- **Background Scripts**: 필요시 백그라운드 처리 지원
- **Web Accessible Resources**: 필요한 리소스 정의

## 10.1.1 Vite 활용 개발 가이드

## 1. Vite 소개 및 장점

### 1.1 Vite란?
Vite는 현대적인 웹 개발 환경을 위한 차세대 빌드 도구로, Evan You(Vue.js 창시자)에 의해 개발되었습니다. ESM(ES Modules)을 기반으로 한 개발 서버와 Rollup을 활용한 빌드 시스템을 제공합니다.

### 1.2 Webpack 대비 Vite의 장점

| 기능 | Vite | Webpack |
|------|------|---------|
| 개발 서버 시작 속도 | 거의 즉시 (ESM 기반) | 수 초~수십 초 (전체 번들링 필요) |
| 변경 반영 속도 (HMR) | 매우 빠름 (변경된 모듈만 교체) | 상대적으로 느림 (청크 재컴파일) |
| 설정 복잡도 | 간결함 (기본값 최적화) | 복잡함 (세부 설정 다수) |
| 빌드 성능 | 높음 (esbuild 기반 변환) | 중간 (여러 로더 체인) |
| 메모리 사용량 | 낮음 | 높음 |

### 1.3 크롬 확장 프로그램 개발에서의 이점

- **개발 주기 단축**: 즉각적인 변경 사항 반영으로 반복 개발 효율성 향상
- **모듈화 지원**: ES 모듈 시스템 기반의 명확한 코드 구조화 가능
- **최신 자바스크립트 지원**: 최신 문법과 기능 자동 변환 및 최적화
- **플러그인 생태계**: 다양한 플러그인을 통한 확장성 제공
- **효율적인 빌드 결과**: 최적화된 번들링으로 성능 향상

## 2. 개발 환경 구성

### 2.1 프로젝트 초기화 및 필수 패키지 설치

```bash
# 프로젝트 폴더 생성 및 이동
mkdir naikit && cd naikit

# npm 초기화
npm init -y

# Vite 및 웹 확장 플러그인 설치
npm install --save-dev vite @samrum/vite-plugin-web-extension

# 선택적 도구 설치
npm install --save-dev cross-env rimraf
```

### 2.2 vite.config.js 기본 설정

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import webExtension from '@samrum/vite-plugin-web-extension';
import path from 'path';

export default defineConfig({
  plugins: [
    webExtension({
      manifest: {
        manifest_version: 3,
        name: "NaiKit - NovelAI 이미지 생성 확장",
        version: "1.0.0",
        description: "NovelAI의 이미지 생성 인터페이스를 향상시키는 확장 프로그램",
        
        action: {
          default_icon: {
            "16": "icons/icon16.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png"
          },
          default_title: "NaiKit"
        },
        
        background: {
          service_worker: "src/background/index.js",
          type: "module"
        },
        
        content_scripts: [
          {
            matches: ["*://*.novelai.net/image*"],
            js: ["src/content/index.js"],
            css: ["src/styles/content.css"],
            run_at": "document_idle"
          }
        ],
        
        web_accessible_resources: [
          {
            resources: [
              "sidebar.html",
              "src/sidebar/**",
              "src/styles/*.css",
              "icons/*.png"
            ],
            matches: ["*://*.novelai.net/*"]
          }
        ],
        
        permissions: ["storage", "tabs"],
        host_permissions: ["*://*.novelai.net/*"]
      },
      
      // 확장 진입점 설정
      entrypoints: {
        background: 'src/background/index.js',
        content: 'src/content/index.js',
        sidebar: 'src/sidebar/index.js'
      }
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  
  // 빌드 설정
  build: {
    // 디버깅용 소스맵 (개발 모드에서만)
    sourcemap: process.env.NODE_ENV !== 'production',
    // 출력 디렉토리
    outDir: 'dist',
    // 번들 최적화
    minify: process.env.NODE_ENV === 'production',
  }
});
```

### 2.3 package.json 스크립트 설정

```json
{
  "name": "naikit",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite build --watch --mode development",
    "build": "vite build",
    "clean": "rimraf dist",
    "package": "npm run build && cd dist && zip -r ../naikit-v$npm_package_version.zip ."
  }
}
```

## 3. 프로젝트 구조 최적화

### 3.1 권장 디렉토리 구조

```
naikit/
├── src/
│   ├── background/         # 백그라운드 스크립트
│   │   └── index.js        # 진입점
│   ├── content/            # 콘텐츠 스크립트
│   │   └── index.js        # 진입점
│   ├── sidebar/            # 사이드바 UI
│   │   └── index.js        # 진입점
│   ├── modules/            # 공유 모듈
│   │   ├── segment-model/  # 세그먼트 관련 모듈
│   │   ├── messaging/      # 메시징 관련 모듈
│   │   └── ...
│   └── styles/             # 스타일시트
│       ├── sidebar.css
│       └── content.css
├── public/                 # 정적 파일
│   ├── sidebar.html        # 사이드바 HTML
│   └── icons/              # 아이콘
├── vite.config.js          # Vite 설정
└── package.json            # 프로젝트 메타데이터
```

### 3.2 모듈 구조 설계 원칙

- **단일 책임 원칙**: 각 모듈은 하나의 기능에만 집중
- **명확한 경계**: 모듈 간 의존성 최소화 및 명확한 인터페이스 정의
- **공유 코드 분리**: 여러 컨텍스트에서 사용되는 코드는 공통 모듈로 추출
- **순환 참조 방지**: 모듈 간 순환 참조가 발생하지 않도록 구조화

## 4. 주요 구성 요소 구현

### 4.1 백그라운드 스크립트 (service worker)

```javascript
// src/background/index.js
import { initStorage } from '../modules/storage';
import { setupMessageListeners } from './message-handlers';

// 초기화 로직
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await initStorage();
    console.log('NaiKit installed successfully');
  }
});

// 메시지 리스너 설정
setupMessageListeners();

// 서비스 워커 활성화 상태 유지 (필요한 경우)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 간단한 메시지 핸들러로 워커 활성 상태 유지
  return false;  // 비동기 응답이 필요하지 않음
});
```

### 4.2 콘텐츠 스크립트

```javascript
// src/content/index.js
import { injectSidebar } from './sidebar-injector';
import { setupNaiInterface } from './nai-interface-setup';
import { initMessaging } from '../modules/messaging';

// 메인 초기화 함수
async function initialize() {
  console.log('NaiKit content script initialized');
  
  // 메시징 시스템 초기화
  initMessaging('content');
  
  // NovelAI 인터페이스 설정
  await setupNaiInterface();
  
  // 사이드바 삽입
  await injectSidebar();
}

// 페이지 로드 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
```

### 4.3 사이드바 UI

```javascript
// src/sidebar/index.js
import { initMessaging } from '../modules/messaging';
import { initUI } from './ui-manager';
import { setupEventListeners } from './event-handlers';

// 메인 초기화 함수
function initialize() {
  console.log('NaiKit sidebar initialized');
  
  // 메시징 초기화
  initMessaging('sidebar');
  
  // UI 초기화
  initUI();
  
  // 이벤트 리스너 설정
  setupEventListeners();
}

// 페이지 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', initialize);
```

## 5. Vite 개발 워크플로우 최적화

### 5.1 개발 모드 작동 방식

Vite의 개발 모드는 주로 두 가지 핵심 기능으로 작동합니다:

1. **네이티브 ESM 기반 개발 서버**:
   - 번들링 과정을 생략하고 브라우저의 네이티브 ES 모듈 로딩 활용
   - 애플리케이션 크기와 관계없이 빠른 개발 서버 시작

2. **빠른 HMR(Hot Module Replacement)**:
   - 변경된 모듈만 교체하여 전체 페이지 새로고침 없이 변경사항 적용
   - 애플리케이션 상태 유지하며 개발 가능

### 5.2 확장 프로그램 개발 시 주의사항

1. **콘텐츠 스크립트와 HMR**:
   - 콘텐츠 스크립트는 웹페이지에 주입되므로 HMR이 직접 작동하지 않음
   - 변경 시 확장 프로그램 새로고침이 필요할 수 있음

2. **백그라운드 스크립트 제약**:
   - 서비스 워커는 비활성화 시 종료될 수 있음
   - 주기적인 메시지나 영구 연결을 통해 활성 상태 유지 필요

3. **웹 접근 가능 리소스**:
   - 동적으로 로드되는 모든 리소스는 `web_accessible_resources`에 등록 필요
   - URL이 변경될 수 있으므로 chrome.runtime.getURL() 사용 권장

### 5.3 효율적인 개발 환경 구성

```bash
# 1. 개발 모드로 빌드 (파일 변경 감시)
npm run dev

# 2. 크롬에서 확장 프로그램 로드
# chrome://extensions 접속
# "개발자 모드" 활성화
# "압축해제된 확장 프로그램을 로드합니다" 클릭
# dist 폴더 선택
```

## 6. ES 모듈 시스템 활용

### 6.1 모듈 내보내기/가져오기 모범 사례

```javascript
// 내보내기 모범 사례
// modules/messaging/index.js
export { MessageTypes } from './message-types';
export { createMessenger } from './messenger';

// 가져오기 모범 사례
// content/index.js
import { MessageTypes, createMessenger } from '../modules/messaging';
// 또는 별칭 사용
import { MessageTypes as MT } from '../modules/messaging';
```

### 6.2 효율적인 모듈 구조

```javascript
// 1. 진입점 모듈 (index.js)
// 다른 모듈에서 쉽게 가져올 수 있도록 하는 진입점
export * from './segment';
export * from './text-segment';
// 선택적 기본 내보내기
export { TextSegment as default } from './text-segment';

// 2. 단일 책임 모듈
// text-segment.js - 하나의 명확한 기능만 담당
export class TextSegment {
  // 구현...
}

// 3. 유틸리티 모듈
// utils.js - 관련 유틸리티 함수 그룹화
export function generateId() { /* ... */ }
export function sanitizeText() { /* ... */ }
```

### 6.3 동적 임포트 활용

```javascript
// 필요할 때만 모듈 로딩 (코드 분할)
async function loadOptionalFeature() {
  if (featureEnabled) {
    const { OptionalFeature } = await import('./optional-feature.js');
    return new OptionalFeature();
  }
  return null;
}
```

## 7. 효율적인 빌드 최적화

### 7.1 코드 분할 전략

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 공유 의존성 분리
        manualChunks: {
          vendor: ['src/modules/messaging/index.js', 'src/modules/storage/index.js'],
          ui: ['src/modules/ui/index.js'],
          // 기능별 청크
          compiler: ['src/modules/compiler/index.js']
        }
      }
    }
  }
});
```

### 7.2 에셋 처리 최적화

```javascript
// 작은 이미지/파일은 인라인 처리
import smallIcon from '../assets/small-icon.png?url';

// SVG를 컴포넌트로 사용 (선택적)
import IconComponent from '../assets/icon.svg?component';

// 공개 URL 설정
const sidebarUrl = chrome.runtime.getURL('sidebar.html');
```

### 7.3 환경 변수 활용

```javascript
// .env.development
VITE_DEBUG_MODE=true
VITE_API_ENDPOINT=https://dev-api.example.com

// .env.production
VITE_DEBUG_MODE=false
VITE_API_ENDPOINT=https://api.example.com

// 코드에서 사용
const DEBUG = import.meta.env.VITE_DEBUG_MODE === 'true';
if (DEBUG) {
  console.log('디버그 모드 활성화');
}
```

## 8. 고급 기능 구현 및 디버깅

### 8.1 메시징 시스템 구현

```javascript
// modules/messaging/messenger.js
export function createMessenger(context) {
  return {
    // 메시지 전송
    sendMessage(type, payload) {
      return chrome.runtime.sendMessage({ type, payload, source: context });
    },
    
    // 콘텐츠 스크립트에 메시지 전송 (백그라운드에서만)
    sendToContent(tabId, type, payload) {
      if (context !== 'background') throw new Error('백그라운드만 사용 가능');
      return chrome.tabs.sendMessage(tabId, { type, payload, source: context });
    },
    
    // 메시지 리스너 등록
    onMessage(type, handler) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === type) {
          const response = handler(message.payload, sender);
          if (response instanceof Promise) {
            response.then(sendResponse).catch(console.error);
            return true; // 비동기 응답 표시
          }
          sendResponse(response);
        }
        return false;
      });
    }
  };
}
```

### 8.2 효율적인 디버깅 방법

1. **소스맵 활성화**:
   ```javascript
   // vite.config.js
   build: {
     sourcemap: true // 개발 모드에서 활성화
   }
   ```

2. **Chrome 확장 프로그램 디버깅**:
   - 백그라운드 스크립트: chrome://extensions에서 "배경 페이지 검사" 버튼 클릭
   - 콘텐츠 스크립트: 대상 페이지에서 개발자 도구 열기
   - 팝업/사이드바: 요소 위에서 마우스 오른쪽 버튼 > "검사" 클릭

3. **로깅 유틸리티**:
   ```javascript
   // modules/utils/logger.js
   export const logger = {
     debug: (...args) => import.meta.env.DEV && console.debug('[NaiKit Debug]', ...args),
     info: (...args) => console.info('[NaiKit]', ...args),
     warn: (...args) => console.warn('[NaiKit Warning]', ...args),
     error: (...args) => console.error('[NaiKit Error]', ...args)
   };
   ```

## 9. 자주 발생하는 문제 및 해결 방법

### 9.1 모듈 로딩 문제

**문제**: `Uncaught SyntaxError: Cannot use import statement outside a module`

**해결 방법**:
1. 확장 프로그램 manifest.json에 `"type": "module"` 추가 확인
2. 스크립트 태그에 `type="module"` 속성 추가:
   ```html
   <script type="module" src="script.js"></script>
   ```

### 9.2 CORS 및 CSP 문제

**문제**: 콘텐츠 스크립트에서 확장 리소스 로드 오류

**해결 방법**:
1. `web_accessible_resources`에 필요한 모든 리소스 포함
2. `chrome.runtime.getURL()` 사용하여 URL 생성
3. 동적 임포트 사용 (가능한 경우)

### 9.3 HMR 관련 문제

**문제**: 변경 사항이 자동으로 반영되지 않음

**해결 방법**:
1. Vite의 감시 모드 사용 (`vite build --watch`)
2. 크롬 확장 페이지에서 새로고침 버튼 클릭
3. 백그라운드 서비스 워커의 경우 특별한 처리 필요

## 10. 배포 준비

### 10.1 프로덕션 빌드 최적화

```javascript
// vite.config.js - 프로덕션 최적화
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  
  return {
    build: {
      minify: isProd ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd
        }
      },
      sourcemap: !isProd
    }
  };
});
```

### 10.2 배포용 패키징

```bash
# 배포용 빌드 및 패키징
npm run build
cd dist && zip -r ../naikit-v1.0.0.zip .

# 또는 package.json 스크립트 사용
npm run package
```

### 10.3 버전 관리 자동화

```javascript
// scripts/bump-version.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagePath = path.join(__dirname, '../package.json');
const manifestPath = path.join(__dirname, '../public/manifest.json');

// 새 버전 (인자로 받거나 기본 증가)
const newVersion = process.argv[2] || incrementVersion(
  JSON.parse(fs.readFileSync(packagePath)).version
);

// package.json 업데이트
const pkg = JSON.parse(fs.readFileSync(packagePath));
pkg.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));

// manifest.json 업데이트
const manifest = JSON.parse(fs.readFileSync(manifestPath));
manifest.version = newVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Version updated to ${newVersion}`);

// 버전 증가 유틸리티
function incrementVersion(version) {
  const parts = version.split('.').map(Number);
  parts[2] += 1; // 패치 버전 증가
  return parts.join('.');
}
```


## 10.1.2 개발 시 주의사항

- **와일드카드와 키워드의 통합 구현**: 기획서 전체에서 언급된 바와 같이, 와일드카드와 키워드는 별개의 시스템이 아닌 
  동일한 프리셋 시스템의 두 가지 모드로 구현해야 합니다. 이들을 위한 중복 코드나 별도 모듈을 만들지 마십시오.
  
- **코드 중복 방지**: 와일드카드와 키워드에 관련된 모든 기능(저장, 로드, 편집, UI 표시 등)은 
  동일한 코드 경로를 통해 처리되어야 합니다. 단일 책임 원칙에 따라 구현하십시오.

## 10.2 NovelAI 통합 방식

- **DOM 접근**: NovelAI UI 요소 선택 및 조작
- **이벤트 리스닝**: NovelAI 시스템 변화 감지
- **UI 오버레이**: 사이드바 및 추가 UI 요소 삽입
- **프로그래매틱 조작**: 버튼 클릭, 폼 제출 등 자동화

## 10.3 데이터 관리

- **로컬 스토리지**: 프리셋, 와일드카드, 설정 저장
- **내보내기/가져오기**: JSON 형식 백업 및 복원
- **동기화 옵션**: 여러 브라우저/기기 간 설정 동기화(옵션)

## 10.4 성능 최적화

- **지연 로딩**: 필요한 컴포넌트만 초기 로드
- **캐싱**: 자주 사용하는 데이터 캐싱
- **스로틀링**: 실시간 동기화 과정의 효율적 처리
- **경량화**: 최소한의 리소스 사용

## 10.5 오류 처리 및 복구

- **우아한 실패**: 오류 발생 시에도 기본 기능 유지
- **자동 복구**: 동기화 실패 시 자동 재시도
- **사용자 피드백**: 문제 발생 시 명확한 메시지 제공
- **디버깅 도구**: 개발자 및 고급 사용자를 위한 진단 도구

## 10.6 확장성 고려

- **모듈식 설계**: 기능별 독립 모듈화
- **API 추상화**: NovelAI 변경에 쉽게 대응하는 추상 레이어
- **플러그인 지원**: 추가 기능 플러그인 아키텍처(옵션)
- **테마 지원**: 사용자 정의 테마 및 스타일 적용 가능성

---

# 11. 미래 확장 가능성

## 11.1 추가 기능 후보

- **이미지 갤러리 관리**: 생성된 이미지의 고급 정리 및 태깅
- **프롬프트 역설계**: 이미지에서 예상 프롬프트 추출
- **AI 지원 프롬프트 최적화**: 머신러닝 기반 프롬프트 개선 제안
- **커뮤니티 통합**: 프리셋 및 와일드카드 공유 플랫폼

## 11.2 크로스 플랫폼 고려

- **Firefox 버전**: Firefox 브라우저 지원
- **Standalone 앱**: 독립 실행형 애플리케이션 가능성
- **모바일 호환성**: 모바일 브라우저 지원 가능성 검토

---

# 12. 결론

NaiKit은 NovelAI의 이미지 생성 경험을 완전히 새로운 차원으로 끌어올리는 종합적인 크롬 확장 프로그램입니다. 직관적인 인터페이스, 강력한 프롬프트 관리 도구, 정밀한 가중치 제어, 그리고 다양한 자동화 기능을 통해 사용자들은 더 효율적이고 창의적으로 AI 이미지를 생성할 수 있게 됩니다.

이 기획서에 설명된 기능들은 사용자들이 직면하는 실질적인 문제와 요구사항에 기반하여 설계되었으며, NovelAI 시스템과의 완벽한 통합을 목표로 합니다. NaiKit의 구현은 NovelAI 커뮤니티에 커다란 가치를 제공하며, AI 이미지 생성의 접근성과 생산성을 크게 향상시킬 것입니다.