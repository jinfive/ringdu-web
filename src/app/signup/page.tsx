import Link from "next/link";
import { SignupTypeCard } from "@/components/auth/SignupTypeCard";

const signupTypes = [
  {
    title: "선생님 가입",
    description: "학원 수업, 출석, 숙제를 관리하기 위한 선생님 계정입니다.",
    href: "/signup/teacher",
  },
  {
    title: "학부모 가입",
    description: "자녀의 시간표, 출석, 숙제, 청구서를 확인하기 위한 학부모 계정입니다.",
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
          </div>
        </section>
      </div>
    </main>
  );
}
