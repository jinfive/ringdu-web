"use client";

import { useState } from "react";

const socialProviders = [
  { name: "카카오", className: "border-[#fee500] bg-[#fee500] text-[#191600] hover:bg-[#f5dc00]" },
  { name: "네이버", className: "border-[#03c75a] bg-[#03c75a] text-white hover:bg-[#02b351]" },
  { name: "구글", className: "border-slate-200 bg-white text-slate-800 hover:bg-slate-50" },
];

export function SocialSignupButtons() {
  const [message, setMessage] = useState("");

  const handleClick = () => {
    setMessage("간편가입은 준비 중입니다.");
  };

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <p className="mb-4 text-center text-sm font-semibold text-slate-700">간편가입</p>
      <div className="space-y-3">
        {socialProviders.map((provider) => (
          <button
            key={provider.name}
            type="button"
            onClick={handleClick}
            className={`h-12 w-full rounded-md border px-4 text-base font-semibold transition ${provider.className}`}
          >
            {provider.name}로 간편가입
          </button>
        ))}
      </div>
      {message ? (
        <p className="mt-3 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
