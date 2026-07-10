"use client";

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
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-[#1e3a5f]">
          AEON Document Log
        </h1>
        <p className="text-gray-600 text-lg">
          Document reference number management system
        </p>
        <button
          onClick={() => signIn("microsoft-entra-id")}
          className="px-6 py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d5a8e] transition-colors font-medium"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
