"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ApiError,
  approveAcademySignupApplication,
  getAcademySignupApplications,
} from "@/lib/api";
import type { AcademySignupApplication } from "@/types/auth";
import { useAuth } from "./AuthProvider";

export function AdminAcademySignupApplications() {
  const { accessToken } = useAuth();
  const [applications, setApplications] = useState<AcademySignupApplication[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;

    void getAcademySignupApplications(accessToken)
      .then((response) => {
        if (isMounted) {
          setApplications(response);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(getAdminErrorMessage(error, "승인 대기 목록을 불러오지 못했습니다."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const handleApprove = async (application: AcademySignupApplication) => {
    if (!accessToken) {
      setErrorMessage("관리자 인증이 필요합니다.");
      return;
    }

    const confirmed = window.confirm(`${application.academyName} 가입 신청을 승인할까요?`);
    if (!confirmed) {
      return;
    }

    setApprovingId(application.applicationId);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await approveAcademySignupApplication(application.applicationId, accessToken);
      setApplications((current) =>
        current.filter((item) => item.applicationId !== application.applicationId),
      );
      setSuccessMessage("학원 가입 신청이 승인되었습니다.");
    } catch (error) {
      setErrorMessage(getAdminErrorMessage(error, "승인 처리에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setApprovingId(null);
    }
  };

  if (!accessToken) {
    return (
      <p className="rounded-md border border-red-100 bg-white px-5 py-4 text-sm font-semibold text-red-600 shadow-lg shadow-red-100/50">
        관리자 인증이 필요합니다.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="rounded-md border border-blue-100 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-lg shadow-blue-100/50">
        승인 대기 목록을 불러오고 있습니다.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {successMessage ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {applications.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-lg shadow-slate-100">
          <h2 className="text-xl font-bold text-slate-950">승인 대기 신청이 없습니다.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            새 학원 가입 신청이 접수되면 이 화면에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-xl shadow-blue-100/60">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-blue-50 text-left text-slate-700">
                <tr>
                  <Th>학원명</Th>
                  <Th>대표자명</Th>
                  <Th>이메일</Th>
                  <Th>전화번호</Th>
                  <Th>주소</Th>
                  <Th>신청일</Th>
                  <Th>상태</Th>
                  <Th>작업</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((application) => (
                  <tr key={application.applicationId}>
                    <Td>{application.academyName}</Td>
                    <Td>{application.representativeName}</Td>
                    <Td>{application.email}</Td>
                    <Td>{application.phone}</Td>
                    <Td>
                      {application.postalCode} {application.address} {application.detailAddress}
                    </Td>
                    <Td>{formatDate(application.createdAt)}</Td>
                    <Td>{application.status}</Td>
                    <Td>
                      <button
                        type="button"
                        disabled={approvingId === application.applicationId}
                        onClick={() => void handleApprove(application)}
                        className="h-10 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        {approvingId === application.applicationId ? "승인 중" : "승인"}
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="max-w-xs px-4 py-4 align-top text-slate-700">{children}</td>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getAdminErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "관리자 권한이 필요합니다.";
    }

    if (error.status === 409) {
      return "이미 처리된 신청입니다.";
    }
  }

  return fallback;
}
