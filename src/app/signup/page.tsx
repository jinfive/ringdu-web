import Link from "next/link";
import { SignupTypeCard } from "@/components/auth/SignupTypeCard";

const signupTypes = [
  {
    title: "학원 가입 신청",
    description: "관리자 승인 후 학원 계정으로 사용할 수 있습니다.",
    href: "/signup/academy",
  },
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
    <main className="min-h-screen px-5 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
        <nav className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-blue-700">
            Ringdu
          </Link>
          <Link href="/" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
            홈으로
          </Link>
        </nav>

        <section className="flex flex-1 items-center justify-center">
          <div className="w-full">
            <div className="mx-auto max-w-2xl text-center">
              <p className="inline-flex rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm shadow-blue-100/60">
                Linking Edu
              </p>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Ringdu 시작하기
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                학원과 학부모, 학생을 연결하는 학원 관리 서비스
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
