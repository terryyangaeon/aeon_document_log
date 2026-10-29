"use client";

import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/log-sheet");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="ov-login-backdrop">
        <div className="ov-login-box">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ov-login-backdrop">
      <div className="ov-login-box">
        <div className="ov-login-brand">
          <Image
            src="/aeon_banner.png"
            alt="AEON delight"
            width={180}
            height={50}
            priority
          />
          <div className="ov-login-l1">文件記錄</div>
          <div className="ov-login-l2">AEON Document Log</div>
        </div>

        <button
          onClick={() => signIn("microsoft-entra-id")}
          className="ov-sso-btn"
        >
          <svg width="20" height="20" viewBox="0 0 21 21" aria-hidden="true">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          <span>
            使用 永旺永樂(亞洲) 帳戶登入
            <br />
            Sign in with AEON Delight (Asia) Account
          </span>
        </button>
      </div>
    </div>
  );
}
