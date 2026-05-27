import Link from "next/link";

export function SignupTypeCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-blue-100/50 backdrop-blur transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100"
    >
      <div className="flex h-full flex-col">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
          {title.slice(0, 1)}
        </div>
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{description}</p>
        <span className="mt-6 inline-flex h-10 items-center text-sm font-bold text-blue-700">가입하기</span>
      </div>
    </Link>
  );
}
