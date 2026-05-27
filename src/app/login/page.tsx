import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

export default function LoginPage() {
  return (
    <main className="min-h-screen px-5 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col">
        <nav className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-blue-700">
            Ringdu
          </Link>
          <Link href="/signup" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
            회원가입
          </Link>
        </nav>

        <section className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl shadow-blue-100/70 backdrop-blur sm:p-8">
            <div className="mb-8 text-center">
              <p className="text-3xl font-black tracking-tight text-blue-700">Ringdu</p>
              <p className="mt-2 text-sm font-medium text-slate-500">Linking Edu</p>
              <h1 className="mt-6 text-3xl font-black text-slate-950">로그인</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                학원 운영과 학습 정보를 확인할 계정으로 로그인합니다.
              </p>
            </div>

            <Suspense fallback={<p className="text-sm font-semibold text-slate-600">로그인 화면을 준비하고 있습니다.</p>}>
              <LoginForm />
            </Suspense>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
              <p className="text-sm font-semibold text-slate-700">아직 계정이 없나요?</p>
              <div className="mt-3 grid gap-2 text-sm font-semibold text-blue-700 sm:grid-cols-3">
                <Link href="/signup/teacher" className="hover:text-blue-900">
                  선생님 가입
                </Link>
                <Link href="/signup/parent" className="hover:text-blue-900">
                  학부모 가입
                </Link>
                <Link href="/signup/student" className="hover:text-blue-900">
                  학생 가입
                </Link>
              </div>
            </div>

            <SocialLoginButtons />
          </div>
        </section>
      </div>
    </main>
  );
}
