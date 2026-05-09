import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e5edff_0,#f7f9ff_34%,#ffffff_100%)] px-5 py-8 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-12">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-blue-700">
            Ringdu
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            회원가입
          </Link>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Linking Edu
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
              학원 운영을 더 쉽게 연결하다
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Ringdu는 학생, 시간표, 출석, 숙제, 청구서와 납부 상태를 한 곳에서
              안정적으로 관리하기 위한 학원 관리 웹 서비스입니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-md bg-blue-700 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                회원가입 시작하기
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                로그인
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/60">
            <div className="grid gap-4">
              {[
                ["학생 관리", "학생과 학부모 정보를 체계적으로 정리"],
                ["시간표 관리", "반별, 학생별 일정을 빠르게 확인"],
                ["출석 관리", "수업 출결과 이력을 명확하게 기록"],
                ["청구 관리", "청구서와 납부 상태를 한눈에 관리"],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-md border border-slate-100 bg-slate-50 px-5 py-4"
                >
                  <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
