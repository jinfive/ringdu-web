import Link from "next/link";
import { ParentSignupForm } from "@/components/auth/ParentSignupForm";
import { SocialSignupButtons } from "@/components/auth/SocialSignupButtons";

export default function ParentSignupPage() {
  return (
    <main className="min-h-screen px-5 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col">
        <nav className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-blue-700">
            Ringdu
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            가입 유형 다시 선택
          </Link>
        </nav>

        <section className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl shadow-blue-100/70 backdrop-blur sm:p-8">
            <div className="mb-8 text-center">
              <p className="text-3xl font-black tracking-tight text-blue-700">Ringdu</p>
              <p className="mt-2 text-sm font-medium text-slate-500">Linking Edu</p>
              <h1 className="mt-6 text-3xl font-black text-slate-950">학부모 가입</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                자녀의 학원 생활 정보를 확인할 학부모 계정을 생성합니다.
              </p>
            </div>
            <ParentSignupForm />
            <SocialSignupButtons />
          </div>
        </section>
      </div>
    </main>
  );
}
