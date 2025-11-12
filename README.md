# 청춘마켓 (React + Firebase)

## 프로젝트 소개
QR로 학교 범위를 설정하고, 같은 학교 사용자끼리 중고거래 게시글/채팅을 할 수 있는 PWA입니다.

## 기술 스택
- **Frontend**: React 18, TypeScript, React Router v6, MUI v5
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **PWA**: manifest, service worker
- **Build Tool**: Create React App

## 설치 및 실행

### 필수 요구사항
- Node.js 16+ (권장 LTS)
- npm

### 설치
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 빌드
npm run build
```

## 프로젝트 구조 (요약)
```
src/
├── components/        # 공용 컴포넌트 (BottomNav, PostCard, auth/* 등)
├── pages/             # 화면 (HomePage, CategoryPage, PostDetail, chat/*, calendar/*)
├── config/            # Firebase 초기화 등 설정 (firebase.ts)
├── contexts/          # Auth, School(학교 스코프) 컨텍스트
├── hooks/             # 커스텀 훅 (예: useUnreadChatCount)
└── index.tsx, App.tsx # 진입/라우팅
```

## 주요 기능
- QR 스캔으로 학교 스코프 설정(`SchoolContext`), 전역 필터 반영
- 게시글: Firestore `posts/{userId}/userPosts` 저장 및 이미지 업로드(Storage)
- 카테고리: 계열/종류 조합으로 게시물 필터링, 로딩 상태 표시
- 채팅: `chatRooms/*` + `chatRooms/{roomId}/messages/*`, 미확인 배지/읽음 처리, 거래완료 플로우
- 하단 네비: 공용 `BottomNav`로 일관된 탭/배지 표시

## 개발/실행
```bash
npm install
npm start      # http://localhost:3031 (package.json의 포트 설정 참고)
npm run build
```

## 데이터 모델 (요약)
- users/{uid}: userId, email, photoUrl, createdAt 등
- posts/{userId}/userPosts/{postId}: title, price, category, type, description, school, createdAt, status
- chatRooms/{roomId}: participants, participantNames, lastMessage, school, createdAt, updatedAt, status
- chatRooms/{roomId}/messages/{messageId}: type(text/image), text, image, userId, userName, timestamp