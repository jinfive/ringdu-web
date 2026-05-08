import Link from "next/link";
import { SignupTypeCard } from "@/components/auth/SignupTypeCard";
import { SocialSignupButtons } from "@/components/auth/SocialSignupButtons";

const signupTypes = [
  {
    title: "학원 가입",
    description: "학원 원장님이 학원 운영을 시작하기 위한 가입입니다.",
    href: "/signup/academy",
  },
  {
    title: "학부모 가입",
    description: "자녀의 시간표, 출석, 숙제, 청구서를 확인하기 위한 가입입니다.",
    href: "/signup/parent",
  },
  {
    title: "학생 가입",
    description: "본인의 시간표, 출석, 숙제를 확인하고 제출하기 위한 가입입니다.",
    href: "/signup/student",
  },
];

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e9efff_0,#f7f9ff_42%,#ffffff_100%)] px-5 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
        <nav className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-blue-700">
            Ringdu
          </Link>
          <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-blue-700">
            홈으로
          </Link>
        </nav>

        <section className="flex flex-1 items-center justify-center">
          <div className="w-full">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Linking Edu
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Ringdu 시작하기
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                학원과 학부모, 학생을 연결하는 학원 관리 서비스
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {signupTypes.map((type) => (
                <SignupTypeCard key={type.href} {...type} />
              ))}
            </div>

            <div className="mx-auto mt-8 max-w-md rounded-lg border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/60">
              <h2 className="text-center text-base font-semibold text-slate-950">간편 가입</h2>
              <p className="mt-2 text-center text-sm leading-6 text-slate-500">
                카카오, 네이버, 구글 계정으로 시작하는 기능은 준비 중입니다.
              </p>
              <SocialSignupButtons />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
