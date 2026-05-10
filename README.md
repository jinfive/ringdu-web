# Ringdu Web

Ringdu Web은 `Linking Edu`를 의미하는 Ringdu 학원 관리 서비스의 프론트엔드 프로젝트입니다. 학원, 선생, 학생, 부모를 연결하는 무료 학원 관리 웹 화면을 제공합니다.

MVP 역할 구조는 `ACADEMY`, `TEACHER`, `STUDENT`, `PARENT`, `ADMIN` 기준입니다. `OWNER`, `DESK`는 MVP에서 제외하고 향후 학원 내부 세부 권한으로 검토합니다.

## 기술 스택

- Next.js
- TypeScript
- Tailwind CSS
- App Router
- React Hook Form
- Zod

## 로컬 실행 방법

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

## 환경변수 설정

예시 파일을 복사해 로컬 환경변수를 설정합니다.

```bash
cp .env.local.example .env.local
```

기본 백엔드 API 서버 주소는 아래와 같습니다.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
```

## 주요 경로

- 메인 페이지: `/`
- 로그인 페이지: `/login`
- 회원가입 유형 선택 페이지: `/signup`
- 선생님 가입 페이지: `/signup/teacher`
- 학부모 가입 페이지: `/signup/parent`
- 학생 가입 페이지: `/signup/student`
- 관리자 페이지: `/admin`
- 학원 계정 생성 페이지: `/admin/academy-accounts/new`
- 역할 UX 기획: `docs/product-specs/role-based-ux-plan.md`

## 백엔드 API 설정

회원가입 화면은 아래 API를 호출합니다.

```text
POST /api/auth/signup
```

백엔드 서버 주소를 변경해야 하는 경우 `.env.local`의 `NEXT_PUBLIC_API_BASE_URL` 값을 수정합니다.

## 사용 가능한 스크립트

```bash
npm run dev
npm run build
npm run lint
```
