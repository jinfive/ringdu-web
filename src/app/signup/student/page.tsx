import Link from "next/link";
import { SocialSignupButtons } from "@/components/auth/SocialSignupButtons";
import { StudentSignupForm } from "@/components/auth/StudentSignupForm";

export default function StudentSignupPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e9efff_0,#f7f9ff_42%,#ffffff_100%)] px-5 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col">
        <nav className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-blue-700">
            Ringdu
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            가입 유형 다시 선택
          </Link>
        </nav>

        <section className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-lg border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/60 sm:p-8">
            <div className="mb-8 text-center">
              <p className="text-3xl font-bold tracking-tight text-blue-700">Ringdu</p>
              <p className="mt-2 text-sm font-medium text-slate-500">Linking Edu</p>
              <h1 className="mt-6 text-2xl font-bold text-slate-950">학생 가입</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                본인의 시간표, 출석, 숙제를 확인할 학생 계정을 생성합니다.
              </p>
            </div>
            <StudentSignupForm />
            <SocialSignupButtons />
          </div>
        </section>
      </div>
    </main>
  );
}
