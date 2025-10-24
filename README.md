# 졸작 프로젝트 - React + Firebase

## 프로젝트 소개
React와 Firebase를 활용한 웹 애플리케이션입니다.

## 기술 스택
- **Frontend**: React, TypeScript
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Styling**: CSS
- **Build Tool**: Create React App

## 설치 및 실행

### 필수 요구사항
- Node.js 16.0.0 이상
- npm 또는 yarn

### 설치
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 빌드
npm run build
```

## 프로젝트 구조
```
src/
├── components/     # 재사용 가능한 컴포넌트
├── pages/         # 페이지 컴포넌트
├── config/        # 설정 파일
├── contexts/      # React Context
├── hooks/         # Custom Hooks
├── services/      # API 서비스
├── types/         # TypeScript 타입 정의
└── utils/         # 유틸리티 함수
```

## 협업 가이드
팀원들과의 협업을 위한 자세한 가이드는 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고하세요.

### 간단한 작업 흐름
1. `main` 브랜치에서 작업 브랜치 생성
2. 작업 및 커밋
3. 원격에 푸시
4. Pull Request 생성
5. 코드 리뷰
6. `main`에 머지

## 배포
프로젝트 배포는 `blaze`를 사용합니다.

## 라이선스
이 프로젝트는 팀 내부용으로 제작되었습니다. 