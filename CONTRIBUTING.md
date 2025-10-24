# 협업 가이드 (Contributing Guide)

## 작업 흐름

### 1. 작업 브랜치 생성
```bash
# 최신 main 브랜치로 업데이트
git checkout main
git pull origin main

# 새로운 작업 브랜치 생성
git checkout -b feature/작업내용-설명
# 예: git checkout -b feature/user-profile-page
```

### 2. 작업 및 커밋
```bash
# 파일 수정 후 스테이징
git add .

# 의미있는 커밋 메시지로 커밋
git commit -m "feat: 사용자 프로필 페이지 추가"
```

### 3. 원격으로 푸시
```bash
# 작업 브랜치를 원격에 푸시
git push -u origin feature/작업내용-설명
```

### 4. Pull Request 생성
- GitHub에서 "Compare & pull request" 클릭
- PR 제목: 간단명료하게 작성
- PR 설명: 작업 내용, 변경사항, 테스트 방법 등 상세히 작성
- Assignees: 코드 리뷰어 지정
- Labels: 적절한 라벨 추가 (feat, bugfix, docs 등)

### 5. 코드 리뷰
- 팀원들이 코드를 리뷰하고 코멘트 작성
- 리뷰어의 피드백에 따라 코드 수정
- 모든 리뷰가 승인될 때까지 대기

### 6. Main에 머지
- 모든 리뷰가 승인되면 "Merge pull request" 클릭
- 작업 브랜치 삭제 (GitHub에서 자동 제공)

## 커밋 메시지 규칙

```
type: 간단한 설명

예시:
feat: 사용자 프로필 페이지 추가
fix: 로그인 버그 수정
docs: README 업데이트
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 코드 추가
```

## 브랜치 명명 규칙

- `feature/기능명`: 새로운 기능 개발
- `bugfix/버그명`: 버그 수정
- `hotfix/긴급수정`: 긴급 수정사항
- `docs/문서명`: 문서 수정

## 코드 리뷰 체크리스트

- [ ] 코드가 요구사항을 만족하는가?
- [ ] 코드 스타일이 일관성 있는가?
- [ ] 적절한 에러 처리가 되어 있는가?
- [ ] 테스트가 포함되어 있는가?
- [ ] 문서가 업데이트되었는가?

## 문제 해결

### 충돌 해결
```bash
# 충돌 발생 시
git pull origin main
# 충돌 해결 후
git add .
git commit -m "resolve: 충돌 해결"
git push origin feature/브랜치명
```

### 브랜치 업데이트
```bash
# main 브랜치 최신화
git checkout main
git pull origin main

# 작업 브랜치에 main 변경사항 적용
git checkout feature/브랜치명
git rebase main
```

## 연락처

문제가 발생하거나 질문이 있으면 팀 리더에게 연락하세요. 