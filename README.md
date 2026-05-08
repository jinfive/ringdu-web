# Ringdu Web

Ringdu Web은 `Linking Edu`를 의미하는 Ringdu 학원 관리 서비스의 프론트엔드 프로젝트입니다. 학생, 시간표, 출석, 숙제, 청구서, 납부 상태 관리를 위한 웹 화면을 제공합니다.

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
- 회원가입 페이지: `/signup`

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
