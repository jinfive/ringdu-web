import Link from "next/link";
import { HomeAuthActions } from "@/components/auth/HomeAuthActions";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e5edff_0,#f7f9ff_34%,#ffffff_100%)] px-5 py-8 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-12">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-blue-700">
            Ringdu
          </Link>
          <HomeAuthActions variant="nav" />
        </nav>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xl rounded-lg border border-red-100 bg-white p-8 text-center shadow-xl shadow-red-100/50">
            <h1 className="text-3xl font-bold text-slate-950">접근 권한 없음</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              현재 계정으로는 이 화면에 접근할 수 없습니다.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-blue-700 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
