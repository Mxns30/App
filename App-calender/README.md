# 캘린더 PWA React 버전

간단한 캘린더 Progressive Web App의 React 버전입니다.

## 기능

- 월별 캘린더 보기
- 이전/다음 월 이동
- 오늘 날짜 하이라이트
- 거래 일정과 투두리스트 관리
- 인라인 편집 기능
- 사진 업로드 및 관리
- PWA 지원 (홈 화면에 설치 가능)
- 반응형 디자인

## 네임스페이스 격리

이 캘린더 PWA는 다른 메인 기능과 충돌하지 않도록 완전히 격리된 구조로 설계되었습니다:

### CSS 클래스 네임스페이스
- 모든 CSS 클래스에 `calendar-pwa-` 접두사 사용
- 예: `.calendar-pwa-container`, `.calendar-pwa-modal` 등

### LocalStorage 키 격리
- 이벤트 데이터: `calendar-pwa-events`
- 사진 데이터: `calendar-pwa-saved-photo`

### 컴포넌트 격리
- 모든 컴포넌트가 독립적인 네임스페이스 사용
- 다른 개발자의 메인 기능과 충돌 방지

## 설치 및 실행

### 필수 요구사항
- Node.js (버전 14 이상)
- npm 또는 yarn

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm start
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

### 빌드
```bash
npm run build
```

## 사용법

1. **캘린더 탐색**: 좌우 화살표 버튼으로 월을 이동할 수 있습니다
2. **일정 관리**: 날짜를 클릭하여 거래 일정과 투두리스트를 추가/편집/삭제할 수 있습니다
3. **사진 관리**: 우상단 "시간표" 버튼을 클릭하여 사진을 업로드할 수 있습니다
4. **인라인 편집**: 일정을 클릭하여 직접 편집할 수 있습니다

## PWA 설치

1. Chrome 브라우저에서 앱을 열어주세요
2. 주소창 옆의 설치 아이콘을 클릭하거나
3. 메뉴 → "앱 설치"를 선택하세요

## 프로젝트 구조

```
src/
├── components/           # React 컴포넌트
│   ├── Calendar.js      # 메인 캘린더 컴포넌트
│   ├── CalendarHeader.js # 캘린더 헤더
│   ├── CalendarGrid.js  # 캘린더 그리드
│   ├── EventModal.js    # 일정 모달
│   ├── PhotoManager.js  # 사진 관리
│   └── FloatingActionButton.js # 플로팅 버튼
├── App.js               # 메인 앱 컴포넌트
├── index.js             # 앱 진입점
└── index.css            # 전역 스타일

public/
├── index.html           # HTML 템플릿
├── manifest.json        # PWA 매니페스트
├── sw.js               # Service Worker
└── cat.png             # UI 이미지
```

## 기술 스택

- **React 18**: 사용자 인터페이스 라이브러리
- **React Router**: 클라이언트 사이드 라우팅
- **CSS3**: 스타일링 (네임스페이스 격리)
- **LocalStorage**: 데이터 저장 (키 격리)
- **Service Worker**: PWA 기능 및 오프라인 지원

## 주요 기능

### 캘린더 기능
- 월별 캘린더 뷰
- 월 네비게이션
- 오늘 날짜 하이라이트
- 주말 구분 표시
- 이벤트 마커

### 일정 관리
- 거래 일정과 투두리스트 분리 관리
- 인라인 편집 기능
- 실시간 저장

### 사진 관리
- 이미지 업로드
- 로컬 저장
- 삭제 기능

### PWA 기능
- 홈 화면 설치
- 오프라인 지원
- 반응형 디자인

## 개발 가이드

### 컴포넌트 구조
- **Calendar**: 메인 캘린더 컨테이너
- **CalendarHeader**: 월/년도 표시 및 네비게이션
- **CalendarGrid**: 날짜 그리드 렌더링
- **EventModal**: 일정 관리 모달
- **PhotoManager**: 사진 관리 페이지
- **FloatingActionButton**: 플로팅 액션 버튼

### 상태 관리
- React Hooks (useState, useEffect) 사용
- 로컬스토리지를 통한 데이터 영속성 (키 격리)
- 컴포넌트 간 props를 통한 데이터 전달

### 스타일링
- 모든 CSS 클래스에 `calendar-pwa-` 접두사 사용
- 반응형 디자인 적용
- 기존 디자인 완전 유지
- 다른 기능과의 스타일 충돌 방지

### 메인 기능과의 통합
이 캘린더는 독립적인 모듈로 설계되어 다른 메인 기능과 쉽게 통합할 수 있습니다:

1. **컴포넌트 임포트**: 필요한 컴포넌트만 임포트하여 사용
2. **스타일 격리**: 네임스페이스로 인해 스타일 충돌 없음
3. **데이터 격리**: LocalStorage 키가 격리되어 데이터 충돌 없음
4. **라우팅 독립**: 필요시 별도 라우팅 설정 가능

## 배포

### 정적 호스팅
```bash
npm run build
```

빌드된 파일을 Netlify, Vercel, GitHub Pages 등에 배포할 수 있습니다.

### PWA 배포 시 주의사항
- HTTPS 환경에서만 PWA 기능이 정상 작동합니다
- Service Worker가 정상적으로 등록되어야 합니다
- 매니페스트 파일이 올바르게 설정되어야 합니다

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 