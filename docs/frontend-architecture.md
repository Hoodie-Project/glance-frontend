# 힐끔 프론트엔드 아키텍처

## 1. 개요

- 문서 목적: `/code` 하위에 구성한 힐끔 프론트엔드 초기 구조와 설계 의도를 기록
- 대상 프로젝트: Next.js 기반 모바일 웹뷰(PWA) 프론트엔드
- 현재 기준: App Router 기반 초기 세팅 완료

## 2. 기술 스택

### 코어

- Next.js 16
- React 19
- TypeScript

### UI / 스타일

- Tailwind CSS v4
- 커스텀 글로벌 CSS 토큰 병행 사용
- lucide-react
- framer-motion

### PWA

- next-pwa
- `manifest.webmanifest` 사용

## 3. 라우팅 전략

### 선택: App Router

- 신규 프로젝트이며 Next.js 16 기준 기본 방향에 맞춤
- 공통 레이아웃, 라우트 그룹, 페이지 단위 확장성을 고려해 App Router 채택
- 모바일 웹뷰 구조에서 하단 탭, 작성 버튼, 공통 앱 쉘을 일관되게 관리하기 쉬움

### Pages Router를 사용하지 않은 이유

- 새 프로젝트에서 구조적 이점이 적음
- `_app.tsx` 중심으로 전역 클라이언트 로직이 몰릴 가능성이 큼
- 향후 화면 수가 늘어나면 레이아웃 계층 관리가 상대적으로 불리함

## 4. 핵심 아키텍처 원칙

### 4.1 서버 컴포넌트 우선

- App Router의 기본 장점을 유지하기 위해 레이아웃과 페이지 껍데기는 서버 컴포넌트 우선으로 설계
- 브라우저 API가 필요 없는 구간은 서버 컴포넌트로 유지
- 추후 피드 초기 데이터, 상세 데이터, 메타데이터를 서버에서 처리할 수 있도록 확장 여지 확보

### 4.2 클라이언트 경계 최소화

- 브라우저 의존성이 있는 기능만 `use client`로 분리
- 지도 SDK, 애니메이션, 탭 활성 상태, 좋아요/댓글/작성 폼 상호작용만 클라이언트 컴포넌트로 구성
- 앱 전체를 CSR로 만들지 않고 필요한 부분만 클라이언트화

### 4.3 모바일 우선

- 모바일 웹뷰 기준으로 설계
- 태블릿은 확장 대응
- 화면 구조는 모바일 단일 컬럼 우선

### 4.4 기능 단위 분리

- `app`: 라우트와 레이아웃
- `components`: 화면 조합 단위 UI
- `lib`: 유틸리티
- `types`: 도메인 타입

## 5. 현재 디렉토리 구조

```txt
/code
  /.gitignore
  /package.json
  /tsconfig.json
  /next.config.mjs
  /postcss.config.mjs
  /eslint.config.mjs
  /next-env.d.ts
  /app
    /globals.css
    /layout.tsx
    /page.tsx
    /(tabs)
      /layout.tsx
      /map
        /page.tsx
      /feed
        /page.tsx
    /thread/[id]
      /page.tsx
    /write
      /page.tsx
  /components
    /layout
      /PageHeader.tsx
    /navigation
      /BottomTabBar.tsx
    /map
      /HotRegions.tsx
      /MapView.tsx
    /thread
      /FeedList.tsx
      /ThreadDetail.tsx
      /WriteForm.tsx
  /lib
    /utils.ts
  /types
    /thread.ts
  /public
    /manifest.webmanifest
```

## 6. 라우트 구조 설명

### `/`

- 구현: [app/page.tsx](/Users/shinhayeong/glance-frontend/code/app/page.tsx)
- 역할: 기본 진입 시 `/map`으로 리다이렉트

### `/(tabs)`

- 구현: [app/(tabs)/layout.tsx](/Users/shinhayeong/glance-frontend/code/app/(tabs)/layout.tsx)
- 역할: 지도/피드 공통 앱 쉘
- 포함 요소
  - 하단 탭바
  - 공통 콘텐츠 패딩

### `/map`

- 구현: [app/(tabs)/map/page.tsx](/Users/shinhayeong/glance-frontend/code/app/(tabs)/map/page.tsx)
- 역할: 지도 메인 화면
- 포함 요소
  - 저장된 좌표 조회 중심 지도 화면
  - 지도 상단 상태 카드
  - 지도 우측 액션 버튼
  - 현재 위치 복귀 버튼
  - 마커 요약 카드
  - 현재 위치 기반 제보 진입 모달

### `/feed`

- 구현: [app/(tabs)/feed/page.tsx](/Users/shinhayeong/glance-frontend/code/app/(tabs)/feed/page.tsx)
- 역할: 최신 스레드 피드
- 포함 요소
  - 페이지 헤더
  - 태그 필터 리스트
  - 최신순 스레드 목록

### `/thread/[id]`

- 구현: [app/thread/[id]/page.tsx](/Users/shinhayeong/glance-frontend/code/app/thread/[id]/page.tsx)
- 역할: 스레드 상세 화면

### `/write`

- 구현: [app/write/page.tsx](/Users/shinhayeong/glance-frontend/code/app/write/page.tsx)
- 역할: 스레드 작성 화면

## 7. 서버 컴포넌트 / 클라이언트 컴포넌트 분리 기준

### 서버 컴포넌트

- [app/layout.tsx](/Users/shinhayeong/glance-frontend/code/app/layout.tsx)
- [app/(tabs)/layout.tsx](/Users/shinhayeong/glance-frontend/code/app/(tabs)/layout.tsx)
- [app/(tabs)/map/page.tsx](/Users/shinhayeong/glance-frontend/code/app/(tabs)/map/page.tsx)
- [app/(tabs)/feed/page.tsx](/Users/shinhayeong/glance-frontend/code/app/(tabs)/feed/page.tsx)
- [app/thread/[id]/page.tsx](/Users/shinhayeong/glance-frontend/code/app/thread/[id]/page.tsx)
- [app/write/page.tsx](/Users/shinhayeong/glance-frontend/code/app/write/page.tsx)
- [components/layout/PageHeader.tsx](/Users/shinhayeong/glance-frontend/code/components/layout/PageHeader.tsx)
- [components/map/HotRegions.tsx](/Users/shinhayeong/glance-frontend/code/components/map/HotRegions.tsx)

### 클라이언트 컴포넌트

- [components/navigation/BottomTabBar.tsx](/Users/shinhayeong/glance-frontend/code/components/navigation/BottomTabBar.tsx)
  - 현재 경로에 따라 활성 탭 표시가 필요함
- [components/map/MapView.tsx](/Users/shinhayeong/glance-frontend/code/components/map/MapView.tsx)
  - 네이버 지도 SDK, geolocation, 지도 오버레이 UI를 포함하는 핵심 지도 컴포넌트
- [components/thread/FeedList.tsx](/Users/shinhayeong/glance-frontend/code/components/thread/FeedList.tsx)
  - framer-motion 사용
- [components/thread/ThreadDetail.tsx](/Users/shinhayeong/glance-frontend/code/components/thread/ThreadDetail.tsx)
  - 좋아요/댓글 입력 상태 관리
- [components/thread/WriteForm.tsx](/Users/shinhayeong/glance-frontend/code/components/thread/WriteForm.tsx)
  - 폼 입력 상태와 버튼 활성화 처리

### 분리 의도

- 지도와 상호작용 UI 때문에 App Router 장점이 사라지는 것을 방지하기 위해 클라이언트 경계를 컴포넌트 단위로 국소화
- 페이지 전체가 아닌 일부 기능만 클라이언트로 분리하는 방식 유지

## 8. 스타일링 전략

### 기본 방향

- Tailwind CSS v4를 사용할 수 있게 세팅했지만, 초기 구조에서는 전역 CSS 토큰 중심으로 화면 골격을 구성
- 이유는 앱 쉘, safe-area, 글래스 패널, 색상 토큰, 높이 변수 등을 빠르게 고정하기 위함

### 글로벌 스타일

- 구현: [app/globals.css](/Users/shinhayeong/glance-frontend/code/app/globals.css)
- 포함 내용
  - 색상 토큰
  - 반응형 토큰
  - 앱 쉘 너비
  - 공통 surface 스타일
  - 공통 버튼 스타일

### 추후 방향

- 화면이 많아지면 Tailwind 유틸리티 중심으로 점진 전환 가능
- 반복되는 패턴은 컴포넌트화 우선, 스타일 시스템 이중화는 최소화

## 9. PWA 구성

### 설정 파일

- [next.config.mjs](/Users/shinhayeong/glance-frontend/code/next.config.mjs)
- [manifest.webmanifest](/Users/shinhayeong/glance-frontend/code/public/manifest.webmanifest)

### 현재 상태

- `next-pwa` 연결
- 개발 환경에서는 PWA 비활성화
- 프로덕션 빌드 시 서비스 워커 등록 가능하도록 기본 설정 반영

### 추후 추가 필요

- 앱 아이콘
- 오프라인 페이지 전략
- 캐시 정책
- 웹뷰 환경에서 설치/업데이트 UX 검토

## 10. 지도 아키텍처 방향

### 현재 상태

- [components/map/MapView.tsx](/Users/shinhayeong/glance-frontend/code/components/map/MapView.tsx)에서 네이버 지도 SDK 로더와 지도 초기화가 동작함
- 현재 위치는 클라이언트에서만 확인하고, 지도 중심 이동과 제보 진입에만 사용함
- 지도 기본 역할은 저장된 스레드 좌표 조회
- 마커 클릭 시 요약 카드가 갱신되는 구조가 들어가 있음
- 하단 `+` FAB는 제거되었고, 지도 내 제보 플로우 중심으로 전환 중

### 추후 구현 방향

- 지도 인스턴스 생성, 마커 생성, 클러스터링은 `MapView` 또는 하위 전용 훅/컴포넌트로 분리
- 마커 재조회용 새로고침 버튼을 API 호출과 연결
- 클러스터링 숫자 표기는 최대 `+99` 정책 반영
- 기본 화면은 조회 전용으로 두고, 제보하기 버튼을 통해서만 좌표 등록 진입
- 서버 컴포넌트에서는 지도 SDK를 직접 다루지 않음

### 권장 분리안

- `components/map/MapView.tsx`
  - 지도 화면 컨테이너 및 오버레이 조합
- `components/map/NaverMap.tsx`
  - 실제 지도 렌더링
- `components/map/MapMarkers.tsx`
  - 마커 및 클러스터 렌더링
- `components/map/ReportSheet.tsx`
  - 현재 위치 기반 제보 확인 바텀시트
- `hooks/use-naver-map.ts`
  - SDK 로드 및 인스턴스 생명주기 관리

## 11. 데이터 계층 방향

### 현재 상태

- 모든 화면은 목업 데이터 기반
- API 연동은 아직 없음
- 지도 마커도 현재는 더미 데이터 기반

### 확장 방향

- 피드 목록
  - 서버 컴포넌트에서 초기 데이터 로드 가능
  - 이후 무한 스크롤은 클라이언트 쪽 추가 요청 처리
- 지도 마커 목록
  - 최초 진입 시 저장된 좌표 목록 조회
  - 새로고침 버튼 클릭 시 현재 영역 기준으로 마커 재조회
  - 클러스터링은 클라이언트 렌더링 계층에서 처리
- 스레드 상세
  - 서버 컴포넌트에서 상세 데이터 조회
  - 좋아요/댓글 등록은 클라이언트 액션 처리
- 글쓰기
  - 클라이언트 폼 입력 후 API 제출

### API 레이어 제안

- `lib/api/*` 형태로 fetch wrapper 구성
- DTO와 화면 모델은 `types/*` 또는 `lib/mappers/*`로 분리

## 12. 반응형 전략

### 기준

- 모바일 우선
- 권장 breakpoint
  - 모바일: 0px ~ 767px
  - 태블릿: 768px ~ 1023px
  - 확장 화면: 1024px 이상

### 적용 원칙

- 모바일 단일 컬럼 우선
- 태블릿에서는 최대 너비와 여백 중심으로 확장
- 지도는 높이 확보를 우선하고, 좌우 분할은 신중히 적용

## 13. 현재 구조의 장점

- App Router 기반이라 라우트 확장이 용이함
- 지도처럼 client-heavy한 기능을 국소화해 전체 구조는 서버 중심으로 유지 가능
- 모바일 웹뷰에 필요한 공통 앱 쉘 구성이 이미 반영됨
- 피드/상세/작성/지도 흐름을 빠르게 병렬 개발할 수 있음
- 지도 조회와 제보 진입 플로우를 분리하기 쉬운 구조임

## 14. 현재 한계와 후속 작업

### 한계

- 마커 재조회, 클러스터링, 제보하기 버튼 구조는 요구사항 기준으로 추가 구현 필요
- API, 상태관리, 인증 전략 미정
- 디자인 시스템은 초기 토큰 수준
- 테스트 설정 미구성

### 후속 작업 우선순위

1. 지도 조회 전용 플로우와 제보하기 버튼 구조 반영
2. 지도 마커 재조회 API 연결
3. 마커 클러스터링 및 `+99` 표기 정책 적용
4. 피드/상세/작성 API 명세 확정
5. 더미 데이터 제거 및 실제 데이터 계층 구성
6. 공통 UI 컴포넌트 정리
7. PWA 아이콘 및 캐시 전략 보완

## 15. 관련 파일

- 요구사항 문서: [requirements.md](/Users/shinhayeong/glance-frontend/docs/requirements.md)
- 프론트엔드 코드 루트: [/code](/Users/shinhayeong/glance-frontend/code)
