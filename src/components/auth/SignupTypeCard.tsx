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
      className="group rounded-lg border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/50 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100"
    >
      <div className="flex h-full flex-col">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-lg font-bold text-blue-700 group-hover:bg-blue-700 group-hover:text-white">
          {title.slice(0, 1)}
        </div>
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{description}</p>
        <span className="mt-6 text-sm font-semibold text-blue-700">가입하기</span>
      </div>
    </Link>
  );
}
