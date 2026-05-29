import Link from "next/link";
import { HomeAuthActions } from "@/components/auth/HomeAuthActions";

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-8 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-14">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-blue-700">
            Ringdu
          </Link>
          <HomeAuthActions variant="nav" />
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm shadow-blue-100/60">
              Linking Edu
            </p>
            <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
              학원 운영을 더 쉽게 연결하다
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              학생, 선생님, 보호자를 하나의 흐름으로 연결해 학원 운영을 더 가볍게 만듭니다.
            </p>
            <HomeAuthActions variant="hero" />
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-2xl shadow-blue-100/70 backdrop-blur">
            <div className="grid gap-4">
              {[
                ["학생 관리", "학생과 학부모 정보를 체계적으로 정리"],
                ["시간표 관리", "반별, 학생별 일정을 빠르게 확인"],
                ["출석 관리", "수업 출결과 이력을 명확하게 기록"],
                ["청구 관리", "청구서와 납부 상태를 한눈에 관리"],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-5 transition hover:-translate-y-0.5 hover:border-blue-100 hover:bg-white hover:shadow-lg hover:shadow-blue-100/50"
                >
                  <h2 className="text-base font-bold text-slate-950">{title}</h2>
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
