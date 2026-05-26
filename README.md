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
- 학원 홈 대시보드: `/academy`
- 학생 관리: `/academy/students`
- 학생(부모) 등록: `/academy/students/new`
- 선생님 관리: `/academy/teachers`
- 시간표 관리: `/academy/schedule`
- 신규 상담: `/academy/consultations`
- 청구서/수납: `/academy/invoices`
- 출석 현황: `/academy/attendance`
- 학원 설정: `/academy/settings`
- 회원가입 유형 선택 페이지: `/signup`
- 학원 가입 신청 페이지: `/signup/academy`
- 선생님 가입 페이지: `/signup/teacher`
- 학부모 가입 페이지: `/signup/parent`
- 학생 가입 페이지: `/signup/student`
- 학부모 홈 대시보드: `/parent`
- 학부모 연결 초대장: `/parent/invitations`
- 학생 홈 대시보드: `/student`
- 학생 연결 초대장: `/student/invitations`
- 관리자 페이지: `/admin`
- 학원 계정 생성 페이지: `/admin/academy-accounts/new`
- 학원 가입 승인 대기 페이지: `/admin/academy-signup-applications`
- 역할 UX 기획: `docs/product-specs/role-based-ux-plan.md`

## 백엔드 API 설정

회원가입 화면은 아래 API를 호출합니다.

```text
POST /api/auth/signup
POST /api/auth/signup/academy
```

학원 운영 화면은 아래 Academy API와 연결됩니다.

```text
GET /api/academies/me
PUT /api/academies/me
GET /api/academies/me/dashboard
```

`/academy`는 등록 학생, 등록 선생님, 이번 달 미납, 신규 상담 대기 요약과 미처리 알림을 표시합니다. `/academy/settings`에서는 학원명, 대표자명, 전화번호, 우편번호, 기본 주소, 상세 주소를 조회하고 수정합니다.

부모-학생 연결은 선택 기능입니다. 부모는 학원 멤버가 아니며, 부모와 학생은 `/parent/invitations`, `/student/invitations`에서 양방향 연결 초대장을 보내고 수락 또는 거절합니다. 초대 수락 시 부모-학생 관계가 생성됩니다.

백엔드 서버 주소를 변경해야 하는 경우 `.env.local`의 `NEXT_PUBLIC_API_BASE_URL` 값을 수정합니다.

## 사용 가능한 스크립트

```bash
npm run dev
npm run build
npm run lint
```
